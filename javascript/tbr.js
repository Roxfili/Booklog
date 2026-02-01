import { sbAuth } from './auth_check.js';

//TBR PAGE
//----------- GLOBAL VARS -----------
let currentTbrList = [];
const { data: { user } } = await sbAuth.auth.getUser();
//----------- FUNCS CALLS -----------
loadTBR();
//----------- FUNCS DEFS -----------
async function loadTBR() {
    
    const lengthFilter = document.getElementById('length').value;
    const genreFilter = document.getElementById('genre').value;
    const tropeFilter = document.getElementById('tropes').value;
    const statusFilter = document.getElementById('length-sub').value;

    
    currentTbrList = [];

    try {
        
        let query = sbAuth
            .from('TBR')
            .select(`
                link,
                Books!inner (
                    title,
                    author,
                    genre,
                    tropes,
                    length,
                    saga,
                    serie_position,
                    cover_link,
                    status,
                    saga_total_books
                )
            `)
            .eq('user_id', user.id);
            //.order('tbr_count', { ascending: false });

        
        if (lengthFilter) {
            query = query.eq('Books.length', lengthFilter);
        }
        if (genreFilter) {
            
            query = query.ilike('Books.genre', genreFilter);
        }
        if (tropeFilter) {
            
            query = query.ilike('Books.tropes', `%${tropeFilter}%`);
        }
        if (lengthFilter === 'serie' && statusFilter) {
            
            const statusBool = (statusFilter === 'completed');
            query = query.eq('Books.status', statusBool);
        }
        const { data, error } = await query;
        if (error) throw error;

        const groupedMap = data.reduce((acc, item) => {
            const title = item.Books.title;
            if (!acc[title]) {
                acc[title] = {
                    ...item.Books,
                    links: [item.link],
                    total_count: 1 
                };
            } else {
                if (item.link && !acc[title].links.includes(item.link)) {
                    acc[title].links.push(item.link);
                }
                acc[title].total_count += 1; 
            }
            return acc;
        }, {});

        let groupedData = Object.values(groupedMap);

        groupedData.sort((a, b) => b.total_count - a.total_count);

        currentTbrList = groupedData;
        renderTable(groupedData);
        if (!lengthFilter && !genreFilter && !tropeFilter && !statusFilter) {
            updateTBRFilters(groupedData);
        }

    } catch (err) {
        console.error("Errore nel caricamento TBR:", err.message);
        tbrContainer.innerHTML = `<p>Error loading books: ${err.message}</p>`;
    }
}

function updateTBRFilters(books) {
    const lengthSelect = document.getElementById('length');
    const genreSelect = document.getElementById('genre');
    const tropesSelect = document.getElementById('tropes');

    const genres = [...new Set(books.map(b => b.genre))].filter(Boolean).sort();
    const lengths = [...new Set(books.map(b => b.length))].filter(Boolean).sort();

    const tropes = [...new Set(
        books.flatMap(b => b.tropes ? b.tropes.split('-').map(t => t.trim()) : [])
    )].filter(Boolean).sort();

    const renderOptions = (selectElement, options, placeholder) => {
        if (!selectElement) return;
        const currentValue = selectElement.value; 
        
        selectElement.innerHTML = `<option value="">${placeholder}</option>` + 
            options.map(opt => `<option value="${opt}">${opt}</option>`).join('');
        
        selectElement.value = currentValue; 
    };
    
    renderOptions(lengthSelect, lengths, "-- Select --");
    renderOptions(genreSelect, genres, "-- Select --");
    renderOptions(tropesSelect, tropes, "-- Select --");
}

function renderTable(groupedBooks) {
    tbrContainer.innerHTML = ""; 

    if (groupedBooks.length === 0) {
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
                    <th>Tropes</th>
                    <th>Position</th>
                    <th>Count</th>
                    <th>Links</th>
                </tr>
            </thead>
            <tbody>
    `;

    groupedBooks.forEach(book => {
        
        const linksHTML = book.links
            .map(link => `<a href="${link}" target="_blank" style="margin-right: 5px;">🔗</a>`)
            .join("");
     
        html += `
            <tr>
                <td><img src="${book.cover_link || 'placeholder.jpg'}" width="50" style="border-radius: 4px;"></td>
                <td><strong>${book.title}</strong>${book.saga ? `<br><small>${book.saga}</small>` : ''}</td>
                <td>${book.author}</td>
                <td>${book.genre || '-'}</td>
                <td class="col-tropes">${book.tropes || '-'}</td>
                <td>${book.serie_position || '-'}/${book.saga_total_books || '-'}</td>
                <td>${book.total_count}</td>
                <td>${linksHTML || '-'}</td>
            </tr>
        `;
    });

    html += `</tbody></table>`;
    tbrContainer.innerHTML = html;
}

//----------- ELEMENTS -----------

const loadBtn = document.querySelector('.tbr-confirm');
const randomBtn = document.getElementById('choose-random');
const tbrContainer = document.querySelector('.tbr-list-container');

const categorySelect = document.getElementById("length");
const subcategoryContainer = document.getElementById("subcategory-length");
const subcategorySelect = document.getElementById("length-sub");

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

loadBtn.addEventListener('click', () => {
    
    const winner = document.querySelector('.winner-row');
    if (winner) winner.classList.remove('winner-row');
    
    loadTBR();
});

document.addEventListener('DOMContentLoaded', loadTBR);

categorySelect.addEventListener("change", () => {
  const value = categorySelect.value;

    if (value === "serie") {
        subcategoryContainer.style.display = "block";
        subcategorySelect.innerHTML = `
            <option value="">-- Seleziona --</option>
            <option value="in-progress">In Progress</option>
            <option value="completed">Completed</option>
             `;
    } else {
        subcategoryContainer.style.display = "none";
        subcategorySelect.innerHTML = "<option value=''>-- Seleziona --</option>";
    }
});

