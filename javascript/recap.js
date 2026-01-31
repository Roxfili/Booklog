//----------- RECAP BUBBLES -----------
async function updateBubbleCounts() {
    try {
        
        try {
            const currYear = new Date().getFullYear();
            const startDate = `${currYear}-01-01`;
            const endDate = `${currYear}-12-31`;

            const { data: tbrData, error: tbrError } = await sbAuth
                .from('Read')
                .select('book_id')
                .eq('is_from_tbr', true)
                .lte('finish_date', endDate)
                .gte('finish_date', startDate);

            if (tbrError) throw tbrError;
            
            const countFromTbr = tbrData.length;
  
            const { count: readCount } = await sbAuth
                .from('Read')
                .select('*', { count: 'exact', head: true });

            const { count: buyCount } = await sbAuth
                .from('Purchase')
                .select('*', { count: 'exact', head: true });

            const { data: purchaseData, error: purchaseError } = await sbAuth
                .from('Purchase')
                .select('price')
                .gte('shop_date', startDate)
                .lte('shop_date', endDate);

            if (purchaseError) {
                console.error("Errore recupero prezzi:", purchaseError);
            } else {
                const totalPrice = purchaseData.reduce((sum, item) => sum + (item.price || 0), 0);
                const priceElem = document.getElementById('tot-price');
                if (priceElem) priceElem.textContent = totalPrice.toFixed(2);
            }
            const tbrElem = document.getElementById('tot-from-tbr');
            const readElem = document.getElementById('tot-read');
            const buyElem = document.getElementById('tot-buy');
            

            if (tbrElem) tbrElem.textContent = countFromTbr || 0;
            if (readElem) readElem.textContent = readCount || 0;
            if (buyElem) buyElem.textContent = buyCount || 0;
        } catch (err) {
          console.error("Errore conteggio:", err);
        }

    } catch (err) {
        console.error("Errore conteggio:", err.message);
    }

}

updateBubbleCounts();

//----------- PODIUM -----------

async function updatePodium() {

    try{
        const currYear = new Date().getFullYear();

        const{data:podiumBooks, error: firstError} = await sbAuth
                    .from('Books')
                    .select(`
                        author,
                        title,
                        cover_link,
                        Top_3_Year!inner(rank, year),
                        Read(stars, start_date, finish_date)
                    `)
                    .eq('Top_3_Year.year', currYear)
                    .order('rank', { foreignTable: 'Top_3_Year', ascending: true });

        if (firstError) throw firstError;


        for (let i = 0; i < 3; i++) {
            const book = podiumBooks[i];
            const n = i + 1; // Per selezionare gli ID 1, 2, 3

            // Se il libro esiste per questa posizione
            if (book) {
                document.getElementById(`podium-image${n}`).src = book.cover_link || 'placeholder.jpg';
                document.getElementById(`podium-title${n}`).textContent = book.title;
                document.getElementById(`podium-author${n}`).textContent = book.author;
                
                // Gestione Date (ricorda: Read è un array!)
                const readData = book.Read[0]; 
                let dateText = "Non letta";
                if (readData) {
                    dateText = readData.start_date 
                        ? `${formatShortDate(readData.start_date)} - ${formatShortDate(readData.finish_date)}` 
                        : formatShortDate(readData.finish_date);
                }
                document.getElementById(`podium-dates${n}`).textContent = dateText;

                // Stelle (usa innerHTML se renderStars restituisce tag <span> o icone)
                document.getElementById(`podium-rate${n}`).innerHTML = renderStars(book.Read[0].stars);
            } else {
                // Opzionale: cosa mostrare se la posizione è vuota
                document.getElementById(`podium-title${n}`).textContent = "TBD";
                document.getElementById(`podium-image${n}`).src = 'img/dragon.png';
                document.getElementById(`podium-author${n}`).textContent = "Author";
                document.getElementById(`podium-dates${n}`).textContent = "Date";
                document.getElementById(`podium-rate${n}`).innerHTML = renderStars(0);
            
            }
        }
    } catch (err) {
        console.error("Errore podio:", err);
    }

}

updatePodium();

//-------- MONTHLY FAVES ----------


async function updateMonthFav() {

    try{
        const currYear = new Date().getFullYear();
        
        const{data:monthBooks, error: monthError} = await sbAuth
                    .from('Books')
                    .select(`
                        cover_link,
                        Monthly_Favourites!inner(month, year),
                        Read(stars)
                    `)
                    .eq('Monthly_Favourites.year', currYear)
                    .order('month', { foreignTable: 'Monthly_Favourites', ascending: true });

        if (monthError) throw monthError;


        for (let i = 0; i < 12; i++) {
            const book = monthBooks[i];
            const n = i + 1; 

            // Se il libro esiste per questo mese
            if (book) {
                document.getElementById(`fav-img${n}`).src = book.cover_link || 'img/dragon.png';
                document.getElementById(`fav-rate${n}`).innerHTML = renderStars(book.Read[0].stars);
            } else {
                // Opzionale: cosa mostrare se la posizione è vuota
                document.getElementById(`fav-img${n}`).src = 'img/dragon.png';
                document.getElementById(`fav-rate${n}`).innerHTML = renderStars(0);
            
            }
        }
    } catch (err) {
        console.error("Errore podio:", err);
    }


}

updateMonthFav();

//-------- UTILS ----------

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

function formatShortDate(dateStr) {
    if (!dateStr) return null;
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}`;
}

