
//BOOKS PAGE FILTER OPTIONS SCRIPT

const filterSelect = document.getElementById("filter");
const datalist = document.getElementById("filter-options");
const label = document.getElementById("filter-label");
const formContainer = document.getElementById("form-order");
const input = document.getElementById("filter-value");
const confirmBtn = document.querySelector('.confirm-button');
const resetBtn = document.querySelector('.reset-button');

const booksContainer = document.querySelector('.book-list-container');

// Variabile globale per salvare i libri caricati (serve per il tasto Random)
let currentBooksList = [];
let displayedBooks = [];    // I libri attualmente visibili (filtrati o totali)
let ascending = true;
loadBooks();
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
        const { data, error } = await query;
        if (error) throw error;

        const formattedBooks = data.map(book => {
            return {
                ...book,
                // Prendiamo i link dall'array TBR
                links: book.TBR ? book.TBR.map(t => t.link) : [],
                // Contiamo i link (il tuo tbr_count)
                total_count: book.TBR ? book.TBR.length : 0,
                // Prendiamo i dati di lettura (se esistono)
                finish_date: book.Read && book.Read.length > 0 ? book.Read[0].finish_date : null,
                start_date: book.Read && book.Read.length > 0 ? book.Read[0].start_date : null,
                stars: book.Read && book.Read.length > 0 ? book.Read[0].stars : null,
                // Prendiamo i dati d'acquisto (se esistono)
                price: book.Purchase && book.Purchase.length > 0 ? book.Purchase[0].price : null,
                shop_date: book.Purchase && book.Purchase.length > 0 ? book.Purchase[0].shop_date : null,
                // Prendiamo la data di aggiunta alla TBR più recente
                add_date: book.TBR && book.TBR.length > 0 ? book.TBR[0].add_date : null
            };
        });

        
        currentBooksList = formattedBooks;
        displayedBooks = [...formattedBooks]; // Inizialmente i visibili sono tutti
    
        renderTable(displayedBooks);
        
    } catch (err) {
        console.error("Errore nel caricamento libri:", err.message);
    }
}

function renderTable(groupedBooks) { //apposto
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
        // Creiamo la lista di icone per ogni link presente nell'array 'links'
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
                <td>${book.tropes || '-'}</td>
                <td>${dates}</td>
                <td>${book.price ? `<strong>${book.price}</strong><br><small>${book.shop_date}</small>` : ' nope '}</td>
                <td>${book.stars ? `<strong>${renderStars(book.stars)}</strong>` : `<strong>${linksHTML}</strong>`}</td>
            </tr>
        `;
    });

    html += `</tbody></table>`;
    booksContainer.innerHTML = html;
}

const data = {
    author: ["J.K. Rowling", "Brandon Sanderson", "George R.R. Martin"],
    genre: ["Fantasy", "Sci-Fi", "Romance", "Romantasy"],
    title: ["Harry Potter", "Mistborn", "Game of Thrones"],
    status: [ "In Progress", "Completed", "Standalone" ],
    serie: [ "A Court of Thorns and Roses", "Caraval", "Throne of Glass", "Once Upon A Broken Heart", "Powerless" ],
    bought: [ "Yes", "No" ]
};
 //FILTRO TABELLA
filterSelect.addEventListener("change", () => {
    const type = filterSelect.value;
    if (!type) {
        formContainer.style.display = "none";
        return;
    }

    formContainer.style.display = "block";
    input.value = "";
    label.textContent = type.charAt(0).toUpperCase() + type.slice(1) + ":";

    // --- LOGICA DINAMICA ---
    let options = [];

    if (type === "bought") {
        options = ["Yes", "No"];
    } else if (type === "status") {
        // Questi sono solitamente fissi, ma li prendiamo per sicurezza
        options = [...new Set(currentBooksList.map(b => b.status))].filter(Boolean);
    } else if (type === "serie") {
        options = [...new Set(currentBooksList.map(b => b.saga))].filter(Boolean);
    } else {
        // Per author, genre, title prendiamo direttamente la proprietà
        options = [...new Set(currentBooksList.map(b => b[type]))].filter(Boolean);
    }

    // Ordiniamo le opzioni alfabeticamente per comodità dell'utente
    options.sort();

    // Popoliamo la datalist
    datalist.innerHTML = options
        .map(opt => `<option value="${opt}">`)
        .join("");
});

confirmBtn.addEventListener("click", () => {
    const type = filterSelect.value;
    const value = input.value.trim().toLowerCase();

    // 1. FILTRAGGIO
    if (!type || !value) {
        // Se non c'è filtro, i libri da visualizzare sono tutti
        displayedBooks = [...currentBooksList];
    } else {
        displayedBooks = currentBooksList.filter(book => {
            // Gestione speciale per Bought
            if (type === "bought") {
                const hasBought = book.price !== null && book.price !== undefined;
                return value === "yes" ? hasBought : !hasBought;
            }
            
            // Per tutti gli altri campi (title, author, genre, tropes, status, saga)
            const fieldValue = (type === "serie" ? book.saga : book[type]) || "";
            return fieldValue.toString().toLowerCase().includes(value);
        });
    }

    // 2. APPLICA ORDINAMENTO (se un radio è già selezionato)
    const activeRadio = document.querySelector('.order-btn input:checked');
    if (activeRadio) {
        // Invece di renderizzare subito, ordiniamo la lista appena filtrata
        sortAndRender(activeRadio.value, ascending);
    } else {
        // Se non c'è ordinamento, renderizziamo la lista filtrata così com'è
        renderTable(displayedBooks);
    }
});

//ORDER BOOKS SCRIPT WITH ARROWS

const orderRadios = document.querySelectorAll('.order-btn input');

let lastSelected = null;


orderRadios.forEach(radio => {
    radio.addEventListener('click', () => {
        const arrow = radio.parentElement.querySelector('.arrow');

        // rimuovo le frecce solo degli altri radio
        orderRadios.forEach(r => {
            if (r !== radio) {
                const a = r.parentElement.querySelector('.arrow');
                a.classList.remove('up','down');
            }
        });

        // toggle se clicco sullo stesso radio
        if (radio === lastSelected) {
            ascending = !ascending;
        } else {
            ascending = true; // nuovo radio → sempre su
        }

        // aggiorno freccia del radio corrente
        arrow.classList.remove('up','down');
        arrow.classList.add(ascending ? 'up' : 'down');

        lastSelected = radio;
        const orderBy = radio.value; // 'title', 'author', 'random', etc.
        sortAndRender(orderBy, ascending);
    });
});

function sortAndRender(property, isAsc) {
    // 1. Ordiniamo DIRETTAMENTE la variabile globale dei libri visualizzati
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

        // Ordinamento secondario per posizione nella serie
        if (a.saga && b.saga && a.saga === b.saga) {
            return isAsc ? (a.serie_position - b.serie_position) : (b.serie_position - a.serie_position);
        }
        return 0;
    });

    // 2. Renderizziamo la variabile globale che abbiamo appena ordinato
    renderTable(displayedBooks);
}

resetBtn.addEventListener("click", () => {
    filterSelect.value = "";
    input.value = "";
    datalist.innerHTML = ""; // Pulisce i suggerimenti
    formContainer.style.display = "none";
    renderTable(currentBooksList);
});

const clearSortBtn = document.getElementById('clear-sort-btn');

clearSortBtn.addEventListener('click', () => {
    // 1. Deseleziona fisicamente tutti i radio button
    orderRadios.forEach(radio => {
        radio.checked = false;
        
        // 2. Rimuove le frecce grafiche
        const arrow = radio.parentElement.querySelector('.arrow');
        if (arrow) arrow.classList.remove('up', 'down');
    });

    // 3. Reset delle variabili di stato dell'ordinamento
    lastSelected = null;
    ascending = true;

    // 4. Ripristina i dati (mantenendo i filtri attivi)
    applyCurrentFilter(); 
});

function applyCurrentFilter() {
    const type = filterSelect.value;
    const value = input.value.trim().toLowerCase();

    if (!type || !value) {
        displayedBooks = [...currentBooksList];
    } else {
        displayedBooks = currentBooksList.filter(book => {
            // ... (logica del filtro che abbiamo già scritto)
        });
    }
    renderTable(displayedBooks);
}
//UTILS

function formatDate(dateString) { //da YY-MM-DD a DD/MM/YY
    if (!dateString) return "-"; // Gestisce il caso in cui la data sia vuota
    const [year, month, day] = dateString.split("-");
    return `${day}/${month}/${year.slice(-2)}`; // .slice(-2) trasforma 2026 in 26
}

function renderStars(rating) {
    let starsHTML = "";
    for (let i = 1; i <= 5; i++) {
        if (rating >= i) {
            // Stella Piena
            starsHTML += '<i class="fas fa-star"></i>';
        } else if (rating >= i - 0.5) {
            // Mezza Stella
            starsHTML += '<i class="fas fa-star-half-alt"></i>';
        } else {
            // Stella Vuota (solo contorno)
            starsHTML += '<i class="far fa-star"></i>';
        }
    }
    return starsHTML;
}