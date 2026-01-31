
//TBR PAGE
//tbr options script
const loadBtn = document.querySelector('.tbr-confirm');
const randomBtn = document.getElementById('choose-random');
const tbrContainer = document.querySelector('.tbr-list-container');

// Variabile globale per salvare i libri caricati (serve per il tasto Random)
let currentTbrList = [];

// Riferimenti per la logica dei menu
const categorySelect = document.getElementById("length");
const subcategoryContainer = document.getElementById("subcategory-length");
const subcategorySelect = document.getElementById("length-sub");

// Mostra/Nascondi status se è una serie
categorySelect.addEventListener("change", () => {
    const value = categorySelect.value;
    if (value === "serie") {
        subcategoryContainer.style.display = "block";
        subcategorySelect.innerHTML = `
            <option value="">-- Select Status --</option>
            <option value="in-progress">In Progress</option>
            <option value="completed">Completed</option>
        `;
    } else {
        subcategoryContainer.style.display = "none";
        subcategorySelect.innerHTML = "<option value=''>-- Select --</option>";
    }
});

async function loadTBR() {
    // 1. Recupero i valori dei filtri
    const lengthFilter = document.getElementById('length').value;
    const genreFilter = document.getElementById('genre').value;
    const statusFilter = document.getElementById('length-sub').value;

    currentTbrList = [];

    try {
        // 2. Query con JOIN su Books
        let query = sbAuth
            .from('TBR')
            .select(`
                tbr_count,
                link,
                Books!inner (
                    title,
                    author,
                    genre,
                    length,
                    saga,
                    serie_position,
                    cover_link,
                    status
                )
            `)
            .order('tbr_count', { ascending: false });

        
        if (lengthFilter) {
            query = query.eq('Books.length', lengthFilter);
        }
        if (genreFilter) {
            
            query = query.ilike('Books.genre', genreFilter);
        }
        if (lengthFilter === 'serie' && statusFilter) {
            
            const statusBool = (statusFilter === 'completed');
            query = query.eq('Books.status', statusBool);
        }
        const { data, error } = await query;

        if (error) throw error;

        currentTbrList = data;
        renderTable(data);

    } catch (err) {
        console.error("Errore nel caricamento TBR:", err.message);
        tbrContainer.innerHTML = `<p>Error loading books: ${err.message}</p>`;
    }
}

function renderTable(books) {
    tbrContainer.innerHTML = ""; 

    if (books.length === 0) {
        tbrContainer.innerHTML = "<p>No books found with these filters. Go add some!</p>";
        return;
    }

    let html = `
        <table class="tbr-table">
            <thead>
                <tr>
                    <th>Cover</th>
                    <th>Title</th>
                    <th>Author</th>
                    <th>Genre</th>
                    <th>Count</th>
                    <th>Link</th>
                </tr>
            </thead>
            <tbody>
    `;

    books.forEach(item => {
        const b = item.Books;
        html += `
            <tr>
                <td><img src="${b.cover_link || 'placeholder.jpg'}" width="50"></td>
                <td><strong>${b.title}</strong>${b.saga ? `<br><small>${b.saga}</small>` : ''}</td>
                <td>${b.author}</td>
                <td>${b.genre || '-'}</td>
                <td>${item.tbr_count}</td>
                <td><a href="${item.link}" target="_blank">🔗</a></td>
            </tr>
        `;
    });

    html += `</tbody></table>`;
    tbrContainer.innerHTML = html;
}

// --- Funzione Random ---
randomBtn.addEventListener('click', () => {
    const rows = document.querySelectorAll('.tbr-table tbody tr');
    
    if (rows.length === 0) {
        alert("Load the list first, then I'll choose!");
        return;
    }

    randomBtn.disabled = true;
    randomBtn.innerText = "CHOOSING...";

    rows.forEach(r => r.classList.remove('winner-row', 'highlight-step'));

    let iterations = 0;
    const maxIterations = 20; 
    const speed = 100; 

    const interval = setInterval(() => {
        rows.forEach(r => r.classList.remove('highlight-step'));
        
        const randomIndex = Math.floor(Math.random() * rows.length);
        rows[randomIndex].classList.add('highlight-step');
        
        iterations++;

        if (iterations >= maxIterations) {
            clearInterval(interval);
            
            rows.forEach(r => r.classList.remove('highlight-step'));
            const finalIndex = Math.floor(Math.random() * rows.length);
            const winner = rows[finalIndex];
            
            winner.classList.add('winner-row');

            // --- SCROLL SOLO PER IL VINCITORE ---
            winner.scrollIntoView({ behavior: 'smooth', block: 'center' });

            randomBtn.disabled = false;
            randomBtn.innerHTML = "CHOOSE<br>RANDOM<br>FOR ME";

            setTimeout(() => {
                const bookTitle = winner.querySelector('strong').innerText;
                alert(`The Fate has spoken! \n\nStop scrolling and start reading: \n"${bookTitle}"`);
            }, 600);
        }
    }, speed);
});
// Event Listener per il tasto Load
loadBtn.addEventListener('click', () => {
    // Rimuove visivamente la classe dalla riga prima ancora di ricaricare i dati
    const winner = document.querySelector('.winner-row');
    if (winner) winner.classList.remove('winner-row');
    
    loadTBR();
});

// // Carica tutto all'avvio
document.addEventListener('DOMContentLoaded', loadTBR);
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

