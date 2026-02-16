import { sbAuth } from './auth_check.js';
import { renderStars, formatShortDate } from './utils.js';
import { updatePodium, updateBubbleCounts, updateMonthFav } from './recap.js';
//----------- GLOBAL VARS -----------

let currentNewBookId = null;
let currentNewBookTitle = "";
const { data: { user } } = await sbAuth.auth.getUser();
//---------- FUNCTIONS CALLS ------------

updateDashboardCounts();
updateLastRead();

//---------- FUNCTIONS DEFS ------------

async function updateTopThree(bookId, newRank) {
    const year = new Date().getFullYear();

    // if #1: old 1 -> 2, old 2 -> 3.
    // if #2: old 2 -> 3.
    
    if (newRank === 1) {
        await sbAuth.from('Top_3_Year').delete().eq('rank', 3).eq('year', year).eq('user_id', user.id);
        await sbAuth.from('Top_3_Year').update({ rank: 3 }).eq('rank', 2).eq('year', year).eq('user_id', user.id);
        await sbAuth.from('Top_3_Year').update({ rank: 2 }).eq('rank', 1).eq('year', year).eq('user_id', user.id);
        
    } else if (newRank === 2) {
        await sbAuth.from('Top_3_Year').delete().eq('rank', 3).eq('year', year).eq('user_id', user.id);
        await sbAuth.from('Top_3_Year').update({ rank: 3 }).eq('rank', 2).eq('year', year).eq('user_id', user.id);
    } else if (newRank === 3) {
        await sbAuth.from('Top_3_Year').delete().gt('rank', 3).eq('year', year).eq('user_id', user.id);
    }

  

    const { error } = await sbAuth.from('Top_3_Year').insert([{ 
        book_id: bookId, 
        rank: newRank, 
        year: year 
    }]);

    updatePodium();
    if (error) {
        console.error("Errore inserimento Top 3:", error.message);
        throw error;
    }
}

async function handleMonthlyFavorite(bookId, stars, endDate) {
    const date = new Date(endDate);
    const month = date.getMonth() + 1;
    const year = date.getFullYear();
    const newStars = parseFloat(stars);

    const { data: existingFav, error: favError } = await sbAuth.from('Monthly_Favourites')
        .select(`id, book_id`)
        .eq('month', month)
        .eq('year', year)
        .eq('user_id', user.id)
        .maybeSingle();

    if (favError) console.error("Errore recupero favorito:", favError);

    if (!existingFav) {
        
        await sbAuth.from('Monthly_Favourites').insert([{ book_id: bookId, month, year }]);
    } else {
        const { data: oldReadData } = await sbAuth.from('Read')
            .select('stars, Books(title)')
            .eq('book_id', existingFav.book_id)
            .eq('user_id', user.id)
            .maybeSingle();

        const oldStars = oldReadData ? parseFloat(oldReadData.stars) : 0;
        const oldTitle = oldReadData?.Books?.title || "the current one";

        console.log(`Confronto: Nuovo(${newStars}) vs Vecchio(${oldStars})`);

        if (newStars > oldStars) {
            
            await sbAuth.from('Monthly_Favourites').update({ book_id: bookId }).eq('id', existingFav.id).eq('user_id', user.id);
        } 
        else if (newStars === oldStars && newStars > 0) {
            
            const chooseNew = confirm(`Tie! Both books have ${newStars} stars. \nDo you want to set "${currentNewBookTitle}" as the new Monthly Favorite instead of "${oldTitle}"?`);
            if (chooseNew) {
                await sbAuth.from('Monthly_Favourites').update({ book_id: bookId }).eq('id', existingFav.id).eq('user_id', user.id);
            }
        }
    }
    updateMonthFav();
}

async function updateDashboardCounts() {
  try {
        
    try {
        
        const { data: tbrData, error: tbrError } = await sbAuth
            .from('TBR')
            .select('book_id')
            .eq('user_id', user.id);

        if (tbrError) throw tbrError;

        const uniqueTbrCount = tbrData ? new Set(tbrData.map(item => item.book_id)).size : 0;

        const { count: readCount } = await sbAuth
            .from('Read')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id);
        

        const tbrElem = document.getElementById('tbr-total');
        const readElem = document.getElementById('read-total');

        if (tbrElem) tbrElem.innerText = uniqueTbrCount || 0;
        if (readElem) readElem.innerText = readCount || 0;

    } catch (err) {
      console.error("Error count:", err);
    }

  } catch (err) {
      console.error("Errore count:", err.message);
  }

}

async function updateLastRead() {
  const lrTitle = document.getElementById("lr-title");
  const lrAuthor = document.getElementById("lr-author");
  const lrDates = document.getElementById("lr-dates");
  const lrRates = document.getElementById("lr-rates");
  const lrCover = document.getElementById("lr-cover");

  let { data, error } = await sbAuth
          .from('Read')
          .select(`
              start_date,
              finish_date,
              stars,
              Books!inner (
                  title,
                  author,
                  cover_link
              )
          `)
          .eq('user_id', user.id)
          .order('finish_date', { ascending: false })
          .limit(1)
          .maybeSingle();

  if (error) {
    console.error("Error recovery last read book:", error.message);
  } else {
      lrTitle.innerText = data.Books.title || "Title";;
      lrAuthor.innerText = data.Books.author || "Author";
      const dateRange = data.start_date ? `${formatShortDate(data.start_date)} - ${formatShortDate(data.finish_date)}` : data.finish_date;
      lrDates.innerText = dateRange || "";
      lrRates.innerHTML = renderStars(data.stars) || renderStars(0);
      lrCover.src = data.Books.cover_link || 'img/default_cover.jpg';
      lrCover.alt = "Book cover";
  }
}

async function loadGenreSuggestions() {
    const datalist = document.getElementById('genre-suggestions');

    const { data, error } = await sbAuth
        .from('Books')
        .select('genre')
        .eq('user_id', user.id); 

    if (error) {
        console.error("Error loading:", error.message);
        return;
    }

    if (data) {
        const uniqueGenres = [...new Set(data
            .map(item => item.genre)
            .filter(g => g) 
        )].sort(); 

        datalist.innerHTML = uniqueGenres
            .map(genre => `<option value="${genre}">`)
            .join('');
    }
}

async function loadTitleSuggestions(){
    const datalist = document.getElementById('title-suggestions');

    const { data, error } = await sbAuth
        .from('Books')
        .select('title')
        .eq('user_id', user.id); 

    if (error) {
        console.error("Error loading:", error.message);
        return;
    }

    if (data) {
        
        const uniqueTitle = [...new Set(data
            .map(item => item.title)
            .filter(g => g) 
        )].sort(); 

        
        datalist.innerHTML = uniqueTitle
            .map(title => `<option value="${title}">`)
            .join('');
    }
}

async function loadAuthorSuggestions() {
    const datalist = document.getElementById('author-suggestions');

    const { data, error } = await sbAuth
        .from('Books')
        .select('author')
        .eq('user_id', user.id); 

    if (error) {
        console.error("Error loading:", error.message);
        return;
    }

    if (data) {
        
        const uniqueAuthor = [...new Set(data
            .map(item => item.author)
            .filter(g => g) 
        )].sort(); 

        
        datalist.innerHTML = uniqueAuthor
            .map(author => `<option value="${author}">`)
            .join('');
    }
}

async function prepareTopThreePoll(newTitle) {
    statForm.reset();
    const year = new Date().getFullYear();

    const { data: top3 } = await sbAuth.from('Top_3_Year')
        .select('rank, Books(title)')
        .eq('year', year)
        .eq('user_id', user.id)
        .order('rank', { ascending: true });

    const titles = {
        1: top3.find(b => b.rank === 1)?.Books?.title,
        2: top3.find(b => b.rank === 2)?.Books?.title,
        3: top3.find(b => b.rank === 3)?.Books?.title
    };

    const count = top3.length;

    document.getElementById('q1').style.display = "none";
    document.getElementById('q2').style.display = "none";
    document.getElementById('q3').style.display = "none";

    // --- A: empty table ---
    if (count === 0) {
        //#1 automatically
        document.getElementById('q1').style.display = "block";
        document.getElementById('q1').querySelector('p').innerText = `You haven't added books to the Top 3 yet. Set "${newTitle}" as #1?`;
        document.querySelector('input[name="q1"][value="yes"]').checked = true;
    } 

    // --- B: already 1 book (#1) ---
    else if (count === 1) {
        document.getElementById('q1').style.display = "block";
        document.getElementById('q1').querySelector('p').innerText = `Is "${newTitle}" better than "${titles[1]}" (#1)?`;
    }

    // --- C: already 2 books (#1 + #2) ---
    else if (count === 2) {
        document.getElementById('q1').style.display = "block";
        document.getElementById('q1').querySelector('p').innerText = `Is "${newTitle}" better than "${titles[2]}" (#2)?`;
        
        document.getElementsByName('q1').forEach(r => r.onchange = () => {
            if (r.value === 'yes') {
                document.getElementById('q2').style.display = "block";
                document.getElementById('q2').querySelector('p').innerText = `Is it also better than "${titles[1]}" (#1)?`;
            } else {
                document.getElementById('q2').style.display = "none";
            }
        });
    }

    // --- D: full podium (3 books) ---
    else {
        document.getElementById('q1').style.display = "block";
        document.getElementById('q1').querySelector('p').innerText = `Is "${newTitle}" better than "${titles[3]}" (#3)?`;
        
        document.getElementsByName('q1').forEach(r => r.onchange = () => {
            if (r.value === 'yes') {
                document.getElementById('q2').style.display = "block";
                document.getElementById('q2').querySelector('p').innerText = `Is it better than "${titles[2]}" (#2)?`;
            } else {
                document.getElementById('q2').style.display = "none";
                document.getElementById('q3').style.display = "none";
            }
        });

        document.getElementsByName('q2').forEach(r => r.onchange = () => {
            if (r.value === 'yes') {
                document.getElementById('q3').style.display = "block";
                document.getElementById('q3').querySelector('p').innerText = `Is it even better than "${titles[1]}" (#1)?`;
            } else {
                document.getElementById('q3').style.display = "none";
            }
        });
    }
}

//-------- POPUP TBR ----------

const sendBtnTbr = document.getElementById("send-tbr")
const tbrPopBtn = document.getElementById("add-tbr-pop");
const popupTbr = document.getElementById("popupTbr");
const category = document.getElementById("length");
const subcategoryContainer = document.getElementById("subcategory-length");
const subcategory = document.getElementById("pu-length-sub");
const judgyPop = document.getElementById("judgy-popup");
const closeJudgyBtn = document.getElementById("close-judgy-popup");
const closeTbrBtn = document.getElementById("close-tbr-popup");
const tbrTitleInput = document.getElementById('tbr-title');

tbrTitleInput.addEventListener('input', async (e) => {
    const titleVal = e.target.value.trim();
    
    if (titleVal.length < 2) return; 

    const { data: book, error } = await sbAuth
        .from('Books')
        .select('*')
        .eq('user_id', user.id)
        .ilike('title', titleVal) // Case insensitive
        .maybeSingle();

    if (book) {
        //auto fill fields
        document.getElementById('tbr-author').value = book.author || "";
        document.getElementById('pu-cover-value').value = book.cover_link || "";
        document.getElementById('pu-genre-genre').value = book.genre || "";
        document.getElementById('pu-trope-genre').value = book.tropes || "";
        
        const lengthSelect = document.getElementById('length');
        lengthSelect.value = book.length || "";
        
        const subcat = document.getElementById('subcategory-length');
        if (book.length === 'serie') {
            subcat.style.display = "block";
            document.getElementById('pu-saga-name').value = book.saga || "";
            document.getElementById('pu-prog-value').value = book.serie_position || "";
            document.getElementById('pu-length-value').value = book.saga_total_books || "";
            document.getElementById('pu-length-sub').value = book.status ? "completed" : "in-progress";
        } else {
            subcat.style.display = "none";
        }
    }
});

tbrPopBtn.addEventListener("click", () => {
  popupTbr.style.display = "flex"; 
  loadGenreSuggestions();
  loadAuthorSuggestions();
  loadTitleSuggestions();
});

closeTbrBtn.addEventListener("click", () => {
  popupTbr.style.display = "none";
});

sendBtnTbr.addEventListener("click", async (e) => {
    e.preventDefault();

    const rawTitle = document.getElementById('tbr-title').value.trim(); 
    const rawAuthor = document.getElementById('tbr-author').value.trim(); 
    const link = document.getElementById('pu-link-value').value.trim();
    const cover = document.getElementById('pu-cover-value').value.trim();
    const genre = document.getElementById('pu-genre-genre').value.trim();
    const tropes = document.getElementById('pu-trope-genre').value.trim();
    const lengthType = document.getElementById('length').value; // 'serie' or 'standalone'


   
    let statusBool = true; 
    let sagaName = null;
    let seriePos = null;
    let sagaLength = null;

    if (lengthType === 'serie') {
        const statusVal = document.getElementById('pu-length-sub').value;
        statusBool = (statusVal === 'completed'); // true if 'completed', false otherwise
        
        sagaLength = document.getElementById('pu-length-value').value.trim();
        sagaName = document.getElementById('pu-saga-name').value.trim();
        seriePos = document.getElementById('pu-prog-value').value;
    }

    if (!rawTitle || !rawAuthor) return alert("Title and Author are mandatory!");

    const title = rawTitle.charAt(0).toUpperCase() + rawTitle.slice(1).toLowerCase();
    const author = rawAuthor.charAt(0).toUpperCase() + rawAuthor.slice(1).toLowerCase();

    try {
        
        let { data: existingBook } = await sbAuth
            .from('Books')
            .select('ID')
            .eq('user_id', user.id)
            .ilike('title', title) 
            .ilike('author', author)
            .maybeSingle();

        let bookId;
        if (existingBook) {
            bookId = existingBook.ID;
            await sbAuth.from('Books')
                        .update({ status: statusBool })
                        .eq('ID', bookId)
                        .eq('user_id', user.id);
        } else {
            const { data: newBook, error: bErr } = await sbAuth
                .from('Books')
                .insert([{ 
                title: title, 
                author: author, 
                genre: genre,
                tropes: tropes,
                length: lengthType, 
                saga: sagaName, 
                serie_position: seriePos, 
                saga_total_books: sagaLength, 
                cover_link: cover,
                status: statusBool,
                user_id: user.id // 
            }])
            .select().single();
            if (bErr) throw bErr;
            bookId = newBook.ID;
        }

        // Check if link already with that link
        const { data: sameLinkEntry } = await sbAuth
            .from('TBR')
            .select('ID')
            .eq('book_id', bookId)
            .eq('link', link)
            .eq('user_id', user.id)
            .maybeSingle();

        // Insert only if not already there
        if (!sameLinkEntry) {
            await sbAuth.from('TBR').insert([{
            book_id: bookId,
            link: link,
            user_id: user.id, 
            add_date: new Date().toISOString().split('T')[0]
            }]);
        } else {
            alert("This book with this link has already been added");
        }

        // UI Feedback e Reset 
        const judgyMessage = document.getElementById('judgy-message-text');
        judgyMessage.innerHTML = existingBook 
            ? `You already added this book... READ IT! &#128520;` 
            : `Wow, a new book... AS IF YOU NEEDED IT &#128529;`;

        await updateDashboardCounts(); 

        document.getElementById('popup-tbr-form').reset();
        document.getElementById('subcategory-length').style.display = "none";
        popupTbr.style.display = "none";
        judgyPop.style.display = "flex";

    } catch (err) {
        console.error("Errorr:", err.message);
        alert("Error in saving");
    }
});

closeTbrBtn.addEventListener("click", () => {
  popupTbr.style.display = "none";
});

closeJudgyBtn.addEventListener("click", () => {
  judgyPop.style.display = "none";
  
  alert("No really, stop adding and start reading...");
});

window.addEventListener("click", (e) => {
  if (e.target === popupTbr) {
    popupTbr.style.display = "none";
  }
});

//FORM only saghe POPUP TBR

category.addEventListener("change", () => {
  const value = category.value;

    if (value === "serie") {
        subcategoryContainer.style.display = "block";
        subcategory.innerHTML = `
            <option value="">-- Select --</option>
            <option value="in-progress">In Progress</option>
            <option value="completed">Completed</option>
             `;
    } else {
        subcategoryContainer.style.display = "none";
        subcategory.innerHTML = "<option value=''>-- Select --</option>";
    }
});

//--------POPUP BOOK READ----------
const sendBtnCur = document.getElementById("send-curRead")
const readPopBtn = document.getElementById("add-read-pop");
const popupRead = document.getElementById("popupCurRead");
const popupCrForm =document.getElementById("popup-CR-form");
const closeCurBtn = document.getElementById("close-CR-popup");
const popupStat = document.getElementById("popup-stat");
const closeStatBtn = document.getElementById("close-stat-popup");
const sendBtnStat = document.getElementById("send-stats")
const statForm = document.getElementById("cascade-form");
const readTitleInput = document.getElementById('read-title');
const readCategory = document.getElementById("read-length");
const readSubcategoryContainer = document.getElementById("read-subcategory-length");
const readSubcategory = document.getElementById("read-pu-length-sub");

readTitleInput.addEventListener('input', async (e) => {
    const titleVal = e.target.value.trim();
    
    if (titleVal.length < 2) return; 

    const { data: book, error } = await sbAuth
        .from('Books')
        .select('*')
        .eq('user_id', user.id)
        .ilike('title', titleVal) // Case insensitive
        .maybeSingle();

    if (book) {
        //auto fill fields
        document.getElementById('read-author').value = book.author || "";
        document.getElementById('read-cover').value = book.cover_link || "";
        document.getElementById('read-pu-genre-genre').value = book.genre || "";
        document.getElementById('read-pu-trope-genre').value = book.tropes || "";
        
        const lengthSelect = document.getElementById('read-length');
        lengthSelect.value = book.length || "";

        //const subcat = document.getElementById('read-subcategory-length');
        if (book.length === 'serie') {
            readSubcategoryContainer.style.display = "block";
            document.getElementById('read-pu-saga-name').value = book.saga || "";
            document.getElementById('read-pu-prog-value').value = book.serie_position || "";
            document.getElementById('read-pu-length-value').value = book.saga_total_books || "";
            document.getElementById('read-pu-length-sub').value = book.status ? "completed" : "in-progress";
        } else {
            readSubcategoryContainer.style.display = "none";
        }
    }
});

readPopBtn.addEventListener("click", () => {
  popupRead.style.display = "flex"; 
  readSubcategoryContainer.style.display = "none";
  loadGenreSuggestions();
  loadAuthorSuggestions();
  loadTitleSuggestions();
});

closeCurBtn.addEventListener("click", () => {
  popupRead.style.display = "none"; 
  popupCrForm.reset();
});

closeStatBtn.addEventListener("click", () => {
  popupStat.style.display = "none"; 
  statForm.reset();
});

sendBtnCur.addEventListener("click", async (e) => {
    e.preventDefault();

    const title = document.getElementById('read-title').value.trim();
    const author = document.getElementById('read-author').value.trim();
    const startDate = document.getElementById('pu-start-value').value;
    const endDate = document.getElementById('read-end').value;
    const starsValue = document.getElementById('read-rate').value;
    const cover = document.getElementById('read-cover').value.trim(); 
    const genre = document.getElementById('read-pu-genre-genre').value.trim();
    const tropes = document.getElementById('read-pu-trope-genre').value.trim();
    const lengthType = document.getElementById('read-length').value; // 'serie' or 'standalone'

    let stars = parseFloat(starsValue);

    if (stars > 5) stars = 5;
    if (stars < 0 || isNaN(stars)) stars = 0;

    if (startDate && endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);

        if (end < start) {
            alert("Error: The finish date cannot be earlier than the start date!");
            return; 
        }
    }

    if (!title || !author || !endDate) return alert("Missing data!");

    let statusBool = true; 
    let sagaName = null;
    let seriePos = null;
    let sagaLength = null;

    if (lengthType === 'serie') {
        const statusVal = document.getElementById('read-pu-length-sub').value;
        statusBool = (statusVal === 'completed'); // true if 'completed', false otherwise
        
        sagaLength = document.getElementById('read-pu-length-value').value.trim();
        sagaName = document.getElementById('read-pu-saga-name').value.trim();
        seriePos = document.getElementById('read-pu-prog-value').value;
    }
    try {
        
        let { data: book } = await sbAuth
            .from('Books')
            .select('ID')
            .ilike('title', title)
            .ilike('author', author)
            .eq('user_id', user.id)
            .maybeSingle();
        
        let bookId;
        if (!book) {
            
            const { data: newB, error: bErr } = await sbAuth.from('Books')
                .insert([{ 
                title: title, 
                author: author, 
                genre: genre,
                tropes: tropes,
                length: lengthType, 
                saga: sagaName, 
                serie_position: seriePos, 
                saga_total_books: sagaLength, 
                cover_link: cover,
                status: statusBool,
                user_id: user.id //
                }])
                .select()
                .single();
                if (bErr) throw bErr;
            bookId = newB.ID;
        } else {
            bookId = book.ID;
            
            if (!book.cover_link && cover) {
                await sbAuth.from('Books')
                .update({ cover_link: cover })
                .eq('ID', bookId)
                .eq('user_id', user.id);
            }
        }
        
        const { data: tbrCheck } = await sbAuth.from('TBR')
            .delete()
            .eq('book_id', bookId)
            .eq('user_id', user.id)
            .select();
        
        const isFromTbr = tbrCheck && tbrCheck.length > 0;

        
        const { error: readErr } = await sbAuth.from('Read').insert([{
            book_id: bookId,
            start_date: startDate || null,
            finish_date: endDate,
            stars: stars,
            is_from_tbr: isFromTbr
        }]);
        if (readErr) throw readErr;

        currentNewBookId = bookId;
        currentNewBookTitle = title;

        await handleMonthlyFavorite(bookId, stars, endDate);

        await updateDashboardCounts();
        await updateLastRead()
        popupRead.style.display = "none";
        popupCrForm.reset();
        
        await prepareTopThreePoll(title);
        popupStat.style.display = "flex";

    } catch (err) {
        console.error("Errore:", err.message);
        alert("Ops! Qualcosa è andato storto nel salvataggio.");
    }
});

// ----- POP UP STAT  -----
sendBtnStat.addEventListener("click", async (e) => {
    e.preventDefault();
    
    const r1 = document.querySelector('input[name="q1"]:checked')?.value;
    const r2 = document.querySelector('input[name="q2"]:checked')?.value;
    const r3 = document.querySelector('input[name="q3"]:checked')?.value;

    const year = new Date().getFullYear();
    const { data: top3 } = await sbAuth.from('Top_3_Year').select('rank').eq('year', year).eq('user_id', user.id);
    const count = top3.length;

    let finalRank = null;

    if (count === 0) {
        if (r1 === 'yes') finalRank = 1;
    } 
    else if (count === 1) {
        finalRank = (r1 === 'yes') ? 1 : 2;
    }
    else if (count === 2) {
        if (r1 === 'no') finalRank = 3;
        else if (r2 === 'no') finalRank = 2;
        else finalRank = 1;
    }
    else { // count === 3
        if (r1 === 'yes') {
            finalRank = 3;
            if (r2 === 'yes') {
                finalRank = 2;
                if (r3 === 'yes') finalRank = 1;
            }
        }
    }

    if (finalRank) {
        await updateTopThree(currentNewBookId, finalRank);
        alert(`Book ranked at #${finalRank}!`);
    }

    popupStat.style.display = "none";
});

readCategory.addEventListener("change", () => {
    const value = readCategory.value;

    if (value === "serie") {
        readSubcategoryContainer.style.display = "block";
        readSubcategory.innerHTML = `
            <option value="">-- Select --</option>
            <option value="in-progress">In Progress</option>
            <option value="completed">Completed</option>
             `;
    } else {
        readSubcategoryContainer.style.display = "none";
        readSubcategory.innerHTML = "<option value=''>-- Select --</option>";
    }

});

//--------POPUP BUY----------

const popupBuy = document.getElementById("popupBuy");
const openBuyBtn = document.getElementById("open-buy-popup");
const closeBuyBtn = document.getElementById("close-buy-popup");
const sendBuyBtn = document.getElementById("send-buy")
const buyForm = document.getElementById("popup-buy-form");


openBuyBtn.addEventListener("click", () => {
  popupBuy.style.display = "flex"; 
});

closeBuyBtn.addEventListener("click", () => {
  popupBuy.style.display = "none";
  buyForm.reset();

});

sendBuyBtn.addEventListener("click", async(e) => {
  e.preventDefault();

    const title = document.getElementById('buy-title-value').value.trim();
    const author = document.getElementById('buy-author-value').value.trim();
    const price = document.getElementById('buy-price-value').value;
    const date = document.getElementById('buy-date-genre').value;

    if (!title || !author || !price || !date) return alert("Missing data!");

    try {
        
        let {data: book} = await sbAuth.from('Books')
            .select('ID')
            .ilike('title', title)
            .ilike('author', author)
            .eq('user_id', user.id)
            .maybeSingle();
        
        let bookId;

        if (!book) {
            const {data: newB, error: bookError} = await sbAuth
              .from('Books')
              .insert([{ title, author}])
              .select()
              .single();
            if (bookError) throw bookError;
            bookId = newB.ID;
        } else {
            bookId = book.ID;
        }

        const { error: purchaseError } = await sbAuth
            .from('Purchase')
            .insert([{ 
                book_id: bookId, 
                price: parseFloat(price), 
                shop_date: date 
            }]);
        if (purchaseError) throw purchaseError;

        alert("Success");

    } catch (err) {
        console.error("Error:", err.message);
        alert("Ops! Something went wrong");
    }
  popupBuy.style.display = "none";
  buyForm.reset();
});

//BooksReadTbr2026
