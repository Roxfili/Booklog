async function updateDashboardCounts() {
    try {
        
        const { count: tbrCount } = await sbAuth
            .from('TBR')
            .select('*', { count: 'exact', head: true });

        const { count: readCount } = await sbAuth
            .from('Read')
            .select('*', { count: 'exact', head: true });

        const tbrElem = document.getElementById('tbr-total');
        const readElem = document.getElementById('read-total');

        if (tbrElem) tbrElem.innerText = tbrCount || 0;
        if (readElem) readElem.innerText = readCount || 0;

    } catch (err) {
        console.error("Errore conteggio:", err);
    }
}

updateDashboardCounts();

//pop up prova
const popup = document.getElementById("popup");
const openBtn = document.getElementById("open-popup");
const closeBtn = document.getElementById("close-popup");


openBtn.addEventListener("click", () => {
  popup.style.display = "flex"; // display:flex per centrare contenuto
});

// Chiudi popup cliccando sulla X
closeBtn.addEventListener("click", () => {
  popup.style.display = "none";
});

// Chiudi popup cliccando fuori dal contenuto
window.addEventListener("click", (e) => {
  if (e.target === popup) {
    popup.style.display = "none";
  }
});

//pop up tbr
const sendBtnTbr = document.getElementById("send-tbr")
const tbrPopBtn = document.getElementById("add-tbr-pop");
const popupTbr = document.getElementById("popupTbr");
const popupTbrForm =document.getElementById("popup-tbr-form");
const category = document.getElementById("length");
const subcategoryContainer = document.getElementById("subcategory-length");
const subcategory = document.getElementById("length-sub");
const judgyPop = document.getElementById("judgy-popup");
const closeJudgyBtn = document.getElementById("close-judgy-popup");
const closeTbrBtn = document.getElementById("close-tbr-popup");
// ----- POP UP TBR
tbrPopBtn.addEventListener("click", () => {
  popupTbr.style.display = "flex"; // display:flex per centrare contenuto
});

closeTbrBtn.addEventListener("click", () => {
  popupTbr.style.display = "none";
});

sendBtnTbr.addEventListener("click", async (e) => {
    e.preventDefault();

    // --- 1. Recupero dati con ID CORRETTI dall'HTML ---
    const rawTitle = document.getElementById('tbr-title').value.trim(); // Corretto
    const rawAuthor = document.getElementById('tbr-author').value.trim(); // Corretto
    const link = document.getElementById('pu-link-value').value.trim();
    const cover = document.getElementById('pu-cover-value').value.trim();
    const genre = document.getElementById('pu-title-genre').value.trim();
    const lengthType = document.getElementById('length').value; // 'serie' o 'standalone'

    // --- 2. Logica Condizionale Status e Saga ---
    let statusBool = true; // Default per standalone
    let sagaName = null;
    let seriePos = null;

    if (lengthType === 'serie') {
        const statusVal = document.getElementById('pu-length-sub').value;
        statusBool = (statusVal === 'completed'); // true se 'completed', false altrimenti
        
        sagaName = document.getElementById('pu-saga-name').value.trim();
        seriePos = document.getElementById('pu-prog-value').value;
    }

    if (!rawTitle || !rawAuthor) return alert("Title and Author are mandatory!");

    // Formattazione (Prima lettera maiuscola)
    const title = rawTitle.charAt(0).toUpperCase() + rawTitle.slice(1).toLowerCase();
    const author = rawAuthor.charAt(0).toUpperCase() + rawAuthor.slice(1).toLowerCase();

    try {
        // --- STEP 1: Trova o Crea il Libro in "Books" ---
        let { data: existingBook } = await sbAuth
            .from('Books')
            .select('ID')
            .ilike('title', title) 
            .ilike('author', author)
            .maybeSingle();

        let bookId;
        if (existingBook) {
            bookId = existingBook.ID;
            // Opzionale: aggiorna lo status se è cambiato
            await sbAuth.from('Books').update({ status: statusBool }).eq('ID', bookId);
        } else {
            const { data: newBook, error: bErr } = await sbAuth
                .from('Books')
                .insert([{ 
                    title: title, 
                    author: author, 
                    genre: genre,
                    length: lengthType, 
                    saga: sagaName, 
                    serie_position: seriePos, 
                    cover_link: cover,
                    status: statusBool // Salvataggio BOOLEARNO
                }])
                .select().single();
            if (bErr) throw bErr;
            bookId = newBook.ID;
        }

        // --- STEP 2, 3 e 4 (Logica TBR e Count) ---
        // Recuperiamo tutti i record TBR per quel libro per calcolare il nuovo count
        const { data: allTbrEntries } = await sbAuth
            .from('TBR')
            .select('tbr_count')
            .eq('book_id', bookId);
        
        const currentMaxCount = allTbrEntries?.length > 0 
            ? Math.max(...allTbrEntries.map(item => item.tbr_count || 0)) 
            : 0;
        const newCount = currentMaxCount + 1;

        // Gestione inserimento o update della riga TBR
        const { data: sameLinkEntry } = await sbAuth
            .from('TBR')
            .select('ID')
            .eq('book_id', bookId)
            .eq('link', link)
            .maybeSingle();

        if (sameLinkEntry) {
            await sbAuth.from('TBR').update({ tbr_count: newCount }).eq('ID', sameLinkEntry.ID);
        } else {
            await sbAuth.from('TBR').insert([{
                book_id: bookId,
                link: link,
                add_date: new Date().toISOString().split('T')[0],
                tbr_count: newCount
            }]);
        }

        // --- UI Feedback e Reset ---
        const judgyMessage = document.getElementById('judgy-message-text');
        judgyMessage.innerHTML = existingBook 
            ? `You already added this book... READ IT! &#128520;` 
            : `Wow, a new book... AS IF YOU NEEDED IT &#128529;`;

        await updateDashboardCounts(); // Aggiorna i contatori in alto
        
        // Reset e chiusura
        document.getElementById('popup-tbr-form').reset();
        document.getElementById('subcategory-length').style.display = "none";
        popupTbr.style.display = "none";
        judgyPop.style.display = "flex";

    } catch (err) {
        console.error("Errore:", err.message);
        alert("Errore nel salvataggio.");
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
            <option value="">-- Seleziona --</option>
            <option value="in-progress">In Progress</option>
            <option value="completed">Completed</option>
             `;
    } else {
        subcategoryContainer.style.display = "none";
        subcategory.innerHTML = "<option value=''>-- Seleziona --</option>";
    }
});
//pop up read book
const sendBtnCur = document.getElementById("send-curRead")
const readPopBtn = document.getElementById("add-read-pop");
const popupRead = document.getElementById("popupCurRead");
const popupCrForm =document.getElementById("popup-CR-form");
const closeCurBtn = document.getElementById("close-CR-popup");
const popupStat = document.getElementById("popup-stat");
const closeStatBtn = document.getElementById("close-stat-popup");
const sendBtnStat = document.getElementById("send-stats")
const statForm = document.getElementById("cascade-form");

readPopBtn.addEventListener("click", () => {
  popupRead.style.display = "flex"; // display:flex per centrare contenuto
});

closeCurBtn.addEventListener("click", () => {
  popupRead.style.display = "none"; 
  popupCrForm.reset();
});

closeStatBtn.addEventListener("click", () => {
  popupStat.style.display = "none"; 
  statForm.reset();
});


// Variabili globali temporanee per passare dati tra i due popup
let currentNewBookId = null;
let currentNewBookTitle = "";

// ----- POP UP READ BOOK (Primo Step) -----
sendBtnCur.addEventListener("click", async (e) => {
    e.preventDefault();

    const title = document.getElementById('read-title').value.trim();
    const author = document.getElementById('read-author').value.trim();
    const startDate = document.getElementById('pu-start-value').value;
    const endDate = document.getElementById('read-end').value;
    const starsValue = document.getElementById('read-rate').value;
    const cover = document.getElementById('read-cover').value.trim(); // <--- NUOVO

    let stars = parseFloat(starsValue);

    if (stars > 5) stars = 5;
    if (stars < 0 || isNaN(stars)) stars = 0;

    if (startDate && endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);

        if (end < start) {
            alert("Error: The finish date cannot be earlier than the start date!");
            return; // Blocca l'invio
        }
    }

    if (!title || !author || !endDate) return alert("Missing data!");

    try {
        // 1. Cerca libro
        let { data: book } = await sbAuth.from('Books')
            .select('ID, cover_link').ilike('title', title).ilike('author', author).maybeSingle();
        
        let bookId;
        if (!book) {
            // Se non esiste, lo creiamo con la cover
            const { data: newB } = await sbAuth.from('Books')
                .insert([{ title, author, cover_link: cover }]).select().single();
            bookId = newB.ID;
        } else {
            bookId = book.ID;
            // OPZIONALE: Se il libro esiste ma non ha la cover, la aggiorniamo
            if (!book.cover_link && cover) {
                await sbAuth.from('Books').update({ cover_link: cover }).eq('ID', bookId);
            }
        }
        // 2. Prova a cancellarlo dalla TBR (se c'è)
        const { data: tbrCheck } = await sbAuth.from('TBR')
            .delete()
            .eq('book_id', bookId)
            .select();
        
        const isFromTbr = tbrCheck && tbrCheck.length > 0;

        // 3. Inserisci nella tabella "Read"
        const { error: readErr } = await sbAuth.from('Read').insert([{
            book_id: bookId,
            start_date: startDate || null,
            finish_date: endDate,
            stars: stars,
            is_from_tbr: isFromTbr
        }]);
        if (readErr) throw readErr;

        // Salva dati per il popup successivo
        currentNewBookId = bookId;
        currentNewBookTitle = title;

        // 4. Gestione Favorito del Mese
        await handleMonthlyFavorite(bookId, stars, endDate);

        // 5. Passaggio al Popup Classifica
        await updateDashboardCounts();
        popupRead.style.display = "none";
        popupCrForm.reset();
        
        // Prepariamo le domande dinamiche per la Top 3
        await prepareTopThreePoll(title);
        popupStat.style.display = "flex";

    } catch (err) {
        console.error("Errore:", err.message);
        alert("Ops! Qualcosa è andato storto nel salvataggio.");
    }
});

// ----- POP UP STAT (Secondo Step: Top 3) -----
sendBtnStat.addEventListener("click", async (e) => {
    e.preventDefault();
    
    const r1 = document.querySelector('input[name="q1"]:checked')?.value;
    const r2 = document.querySelector('input[name="q2"]:checked')?.value;
    const r3 = document.querySelector('input[name="q3"]:checked')?.value;

    // Recuperiamo il conteggio attuale per decidere il rank
    const year = new Date().getFullYear();
    const { data: top3 } = await sbAuth.from('Top_3_Year').select('rank').eq('year', year);
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

async function prepareTopThreePoll(newTitle) {
    statForm.reset();
    const year = new Date().getFullYear();

    // 1. Recuperiamo i libri attualmente in Top 3
    const { data: top3 } = await sbAuth.from('Top_3_Year')
        .select('rank, Books(title)')
        .eq('year', year)
        .order('rank', { ascending: true });

    const titles = {
        1: top3.find(b => b.rank === 1)?.Books?.title,
        2: top3.find(b => b.rank === 2)?.Books?.title,
        3: top3.find(b => b.rank === 3)?.Books?.title
    };

    const count = top3.length;

    // Reset visibilità
    document.getElementById('q1').style.display = "none";
    document.getElementById('q2').style.display = "none";
    document.getElementById('q3').style.display = "none";

    // --- CASO A: Tabella Vuota ---
    if (count === 0) {
        // Diventa #1 automaticamente (mostriamo un messaggio o una domanda pro-forma)
        document.getElementById('q1').style.display = "block";
        document.getElementById('q1').querySelector('p').innerText = `You haven't added books to the Top 3 yet. Set "${newTitle}" as #1?`;
        // Pre-selezioniamo "yes" per comodità
        document.querySelector('input[name="q1"][value="yes"]').checked = true;
    } 

    // --- CASO B: C'è 1 libro (#1) ---
    else if (count === 1) {
        document.getElementById('q1').style.display = "block";
        document.getElementById('q1').querySelector('p').innerText = `Is "${newTitle}" better than "${titles[1]}" (#1)?`;
    }

    // --- CASO C: Ci sono 2 libri (#1 e #2) ---
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

    // --- CASO D: Classifica Piena (3 libri) ---
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

async function updateTopThree(bookId, newRank) {
    const year = new Date().getFullYear();

    // 1. Prima facciamo spazio: chi è nel posto che vogliamo prendere (o sotto) deve scalare
    // Se entri al #1: il vecchio 1 va al 2, il vecchio 2 va al 3.
    // Se entri al #2: il vecchio 2 va al 3.
    
    if (newRank === 1) {
        // Spostiamo in ordine inverso (dal 2 al 3, poi dall'1 al 2) per non sovrascrivere
        await sbAuth.from('Top_3_Year').update({ rank: 3 }).eq('rank', 2).eq('year', year);
        await sbAuth.from('Top_3_Year').update({ rank: 2 }).eq('rank', 1).eq('year', year);
    } else if (newRank === 2) {
        await sbAuth.from('Top_3_Year').update({ rank: 3 }).eq('rank', 2).eq('year', year);
    }

    // 2. Pulizia: 
    // - Eliminiamo il vecchio rank 3 se qualcuno è scalato lì sopra (perché ora sarebbe un rank 4 o un doppione)
    // - Eliminiamo chiunque occupi il newRank per sicurezza prima dell'insert
    await sbAuth.from('Top_3_Year').delete().gt('rank', 3).eq('year', year); 
    await sbAuth.from('Top_3_Year').delete().eq('rank', newRank).eq('year', year);

    // 3. Inseriamo il nuovo re della classifica
    const { error } = await sbAuth.from('Top_3_Year').insert([{ 
        book_id: bookId, 
        rank: newRank, 
        year: year 
    }]);

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

    // 1. Troviamo il favorito attuale per quel mese
    const { data: existingFav, error: favError } = await sbAuth.from('Monthly_Favourites')
        .select(`id, book_id`)
        .eq('month', month)
        .eq('year', year)
        .maybeSingle();

    if (favError) console.error("Errore recupero favorito:", favError);

    if (!existingFav) {
        // Nessun favorito? Inseriamo il primo
        await sbAuth.from('Monthly_Favourites').insert([{ book_id: bookId, month, year }]);
    } else {
        // 2. Se esiste, dobbiamo recuperare le stelle del vecchio favorito dalla tabella "Read"
        const { data: oldReadData } = await sbAuth.from('Read')
            .select('stars, Books(title)')
            .eq('book_id', existingFav.book_id)
            .maybeSingle();

        const oldStars = oldReadData ? parseFloat(oldReadData.stars) : 0;
        const oldTitle = oldReadData?.Books?.title || "the current one";

        console.log(`Confronto: Nuovo(${newStars}) vs Vecchio(${oldStars})`);

        if (newStars > oldStars) {
            // Sostituzione automatica se il voto è più alto
            await sbAuth.from('Monthly_Favourites').update({ book_id: bookId }).eq('id', existingFav.id);
        } 
        else if (newStars === oldStars && newStars > 0) {
            // PAREGGIO: Qui DEVE scattare il confirm
            const chooseNew = confirm(`Tie! Both books have ${newStars} stars. \nDo you want to set "${currentNewBookTitle}" as the new Monthly Favorite instead of "${oldTitle}"?`);
            if (chooseNew) {
                await sbAuth.from('Monthly_Favourites').update({ book_id: bookId }).eq('id', existingFav.id);
            }
        }
    }
}

//popup buy

const popupBuy = document.getElementById("popupBuy");
const openBuyBtn = document.getElementById("open-buy-popup");
const closeBuyBtn = document.getElementById("close-buy-popup");
const sendBuyBtn = document.getElementById("send-buy")
const buyForm = document.getElementById("popup-buy-form");

// -------- pop up prova

openBuyBtn.addEventListener("click", () => {
  popupBuy.style.display = "flex"; // display:flex per centrare contenuto
});

// Chiudi popup cliccando sulla X
closeBuyBtn.addEventListener("click", () => {
  popupBuy.style.display = "none";
  buyForm.reset();

});

sendBuyBtn.addEventListener("click", () => {
  popupBuy.style.display = "none";
  buyForm.reset();
});

//BooksReadTbr2026
