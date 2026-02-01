//js for books.html

import { sbAuth } from './auth_check.js';
import { renderStars, formatDate } from './utils.js';

//----------- GLOBAL VARS -----------
let currentBooksList = [];
let displayedBooks = [];    
let ascending = true;
let lastSelected = null;
const { data: { user } } = await sbAuth.auth.getUser();
//----------- FUNCS CALLS -----------
loadBooks();
//----------- FUNCS DEFS -----------

async function loadBooks() {
    
    currentBooksList = [];

    try {
        
        let query = sbAuth
            .from('Books')
            .select(`
                title,
                author,
                length,
                saga,
                serie_position,
                cover_link,
                status,
                tropes,
                genre,
                TBR (link, add_date),
                Read (start_date, finish_date, stars, is_from_tbr),
                Purchase (price, shop_date)
            `)
            .eq('user_id', user.id);
        const { data, error } = await query;
        if (error) throw error;

        const formattedBooks = data.map(book => {
            return {
                ...book, //book data
                
                links: book.TBR ? book.TBR.map(t => t.link) : [], //links
                
                total_count: book.TBR ? book.TBR.length : 0, //count links
                
                finish_date: book.Read && book.Read.length > 0 ? book.Read[0].finish_date : null,
                start_date: book.Read && book.Read.length > 0 ? book.Read[0].start_date : null,
                stars: book.Read && book.Read.length > 0 ? book.Read[0].stars : null,
                
                price: book.Purchase && book.Purchase.length > 0 ? book.Purchase[0].price : null,
                shop_date: book.Purchase && book.Purchase.length > 0 ? book.Purchase[0].shop_date : null,
                
                add_date: book.TBR && book.TBR.length > 0 ? book.TBR[0].add_date : null //most recent tbr date
            };
        });

        
        currentBooksList = formattedBooks;
        displayedBooks = [...formattedBooks];
    
        renderTable(displayedBooks);
        
    } catch (err) {
        console.error("Error loading books:", err.message);
    }
}

function renderTable(groupedBooks) { 
    booksContainer.innerHTML = ""; 

    if (groupedBooks.length === 0) {
        booksContainer.innerHTML = "<p>No books found with these filters.</p>";
        return;
    }

    let html = `
        <table class="books-table">
            <thead>
                <tr>
                    <th>Cover</th>
                    <th>Title</th>
                    <th>Author</th>
                    <th>Genre</th>
                    <th>Tropes</th>
                    <th>Dates</th> 
                    <th>Bought</th> 
                    <th>Info</th> 
                </tr>
            </thead>
            <tbody>
    `;

    groupedBooks.forEach(book => {
        
        const linksHTML = book.links
            .map(link => `<a href="${link}" target="_blank" style="margin-right: 5px;">🔗</a>`)
            .join("");

        let dates = " - ";
        if (book.finish_date) {
            dates = book.start_date 
                ? `${formatDate(book.start_date)} - ${formatDate(book.finish_date)}` 
                : formatDate(book.finish_date);
        } else if (book.add_date) {
            dates = formatDate(book.add_date);
        }
        
        
        html += `
            <tr>
                <td><img src="${book.cover_link || 'img/dragon.png'}" width="50" style="border-radius: 4px;"></td>
                <td><strong>${book.title}</strong>${book.saga ? `<br><small>${book.saga}</small>` : ''}</td>
                <td>${book.author}</td>
                <td>${book.genre || '-'}</td>
                <td class="col-tropes">${book.tropes || '-'}</td>
                <td>${dates}</td>
                <td>${book.price ? `<strong>${book.price}</strong><br><small>${book.shop_date}</small>` : ' nope '}</td>
                <td>${book.stars ? `<strong>${renderStars(book.stars)}</strong>` : `<strong>${linksHTML}</strong>`}</td>
            </tr>
        `;
    });

    html += `</tbody></table>`;
    booksContainer.innerHTML = html;
}

function sortAndRender(property, isAsc) {
    
    displayedBooks.sort((a, b) => {
        let valA, valB;

        if (property === 'random') return Math.random() - 0.5;

        switch (property) {
            case 'title':
                valA = (a.title || "").toLowerCase();
                valB = (b.title || "").toLowerCase();
                break;
            case 'author':
                valA = (a.author || "").toLowerCase();
                valB = (b.author || "").toLowerCase();
                break;
            case 'count':
                valA = a.total_count || 0;
                valB = b.total_count || 0;
                break;
            case 'price':
                valA = a.price === null ? Infinity : a.price;
                valB = b.price === null ? Infinity : b.price;
                break;
            case 'date':
                const getTime = (d) => d ? new Date(d).getTime() : 0;
                valA = getTime(a.finish_date || a.add_date);
                valB = getTime(b.finish_date || b.add_date);
                break;
            default: return 0;
        }

        if (valA < valB) return isAsc ? -1 : 1;
        if (valA > valB) return isAsc ? 1 : -1;

        if (a.saga && b.saga && a.saga === b.saga) {
            return isAsc ? (a.serie_position - b.serie_position) : (b.serie_position - a.serie_position);
        }
        return 0;
    });

    renderTable(displayedBooks);
}

function applyCurrentFilter() {
    const type = filterSelect.value;
    const value = input.value.trim().toLowerCase();

    if (!type || !value) {
        displayedBooks = [...currentBooksList];
    } else {
        displayedBooks = currentBooksList.filter(book => {
            if (type === "bought") {
                const hasBought = book.price !== null && book.price !== undefined;
                return value === "yes" ? hasBought : !hasBought;
            }
            
            const fieldValue = (type === "serie" ? book.saga : book[type]) || "";
            return fieldValue.toString().toLowerCase().includes(value);
        });
    }

    const activeRadio = document.querySelector('.order-btn input:checked');
    if (activeRadio) {
        sortAndRender(activeRadio.value, ascending);
    } else {
        renderTable(displayedBooks);
    }
}

//----------- ELEMENTS -----------
const filterSelect = document.getElementById("filter");
const datalist = document.getElementById("filter-options");
const label = document.getElementById("filter-label");
const formContainer = document.getElementById("form-order");
const input = document.getElementById("filter-value");
const confirmBtn = document.querySelector('.confirm-button');
const resetBtn = document.querySelector('.reset-button');
const booksContainer = document.querySelector('.book-list-container');
const clearSortBtn = document.getElementById('clear-sort-btn');
const orderRadios = document.querySelectorAll('.order-btn input');

//FILTER TABLE
filterSelect.addEventListener("change", () => {
    const type = filterSelect.value;
    if (!type) {
        formContainer.style.display = "none";
        return;
    }

    formContainer.style.display = "block";
    input.value = "";
    label.textContent = type.charAt(0).toUpperCase() + type.slice(1) + ":";

    // --- DYNAMIC LOGIC ---
    let options = [];

    if (type === "bought") {
        options = ["Yes", "No"];
    } else if (type === "status") {
        
        options = [...new Set(currentBooksList.map(b => b.status))].filter(Boolean);
    } else if (type === "serie") {
        options = [...new Set(currentBooksList.map(b => b.saga))].filter(Boolean);
    } else if (type === "tropes") {
        const allTropesStrings = currentBooksList.map(b => b.tropes).filter(Boolean);
        const individualTropes = allTropesStrings.flatMap(str => 
            str.split('-').map(t => t.trim())
        );

        options = [...new Set(individualTropes)];
    }else {
        options = [...new Set(currentBooksList.map(b => b[type]))].filter(Boolean);
    }
    options.sort();
    datalist.innerHTML = options
        .map(opt => `<option value="${opt}">`)
        .join("");
});

confirmBtn.addEventListener("click", applyCurrentFilter);

//ORDER BOOKS BUTTONS WITH ARROWS
orderRadios.forEach(radio => {
    radio.addEventListener('click', () => {
        const arrow = radio.parentElement.querySelector('.arrow');

        // remove arrows from other radios
        orderRadios.forEach(r => {
            if (r !== radio) {
                const a = r.parentElement.querySelector('.arrow');
                a.classList.remove('up','down');
            }
        });

        // toggle if same radio
        if (radio === lastSelected) {
            ascending = !ascending;
        } else {
            ascending = true; // new radio → ascending
        }
        //update arrow
        arrow.classList.remove('up','down');
        arrow.classList.add(ascending ? 'up' : 'down');

        lastSelected = radio;
        const orderBy = radio.value; 
        sortAndRender(orderBy, ascending);
    });
});

resetBtn.addEventListener("click", () => {
    filterSelect.value = "";
    input.value = "";
    datalist.innerHTML = ""; 
    formContainer.style.display = "none";
    renderTable(currentBooksList);
});

clearSortBtn.addEventListener('click', () => {
    
    orderRadios.forEach(radio => {
        radio.checked = false;
        const arrow = radio.parentElement.querySelector('.arrow');
        if (arrow) arrow.classList.remove('up', 'down');
    });

    lastSelected = null;
    ascending = true;

    applyCurrentFilter(); 
});

