import { sbAuth } from './auth_check.js';
import { renderStars, formatShortDate } from './utils.js';

const currYear = new Date().getFullYear();
const { data: { user } } = await sbAuth.auth.getUser();

//----------- FUNCS CALLS -----------

updateBubbleCounts();
updatePodium();
updateMonthFav();

//----------- RECAP BUBBLES -----------

export async function updateBubbleCounts() {
    try {
        
        try {
            const currYear = new Date().getFullYear();
            const startDate = `${currYear}-01-01`;
            const endDate = `${currYear}-12-31`;

            const { data: tbrData, error: tbrError } = await sbAuth
                .from('Read')
                .select('book_id')
                .eq('user_id', user.id)
                .eq('is_from_tbr', true)
                .eq('user_id', user.id)
                .lte('finish_date', endDate)
                .gte('finish_date', startDate);

            if (tbrError) throw tbrError;
            
            const countFromTbr = tbrData.length;
  
            const { count: readCount } = await sbAuth
                .from('Read')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', user.id);

            const { count: buyCount } = await sbAuth
                .from('Purchase')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', user.id);

            const { data: purchaseData, error: purchaseError } = await sbAuth
                .from('Purchase')
                .select('price')
                .gte('shop_date', startDate)
                .lte('shop_date', endDate)
                .eq('user_id', user.id);

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

//----------- PODIUM -----------

export async function updatePodium() {
    try {
        
        const [book1, book2, book3] = await Promise.all([
            getPodiumBook(1),
            getPodiumBook(2),
            getPodiumBook(3)
        ]);
        const books = [book1, book2, book3];
        books.forEach((book, i) => {
            const n = i + 1;
            const imgEl = document.getElementById(`podium-image${n}`);
            const titleEl = document.getElementById(`podium-title${n}`);
            const authorEl = document.getElementById(`podium-author${n}`);
            const datesEl = document.getElementById(`podium-dates${n}`);
            const rateEl = document.getElementById(`podium-rate${n}`);
            if (book) {
                imgEl.src = book.cover_link || 'img/caraval_cover.jpg';
                titleEl.textContent = book.title;
                authorEl.textContent = book.author;
                const readData = book.Read.find(r => r.user_id === user.id) || book.Read[0];
                if (readData) {
                    datesEl.textContent = readData.start_date 
                        ? `${formatShortDate(readData.start_date)} - ${formatShortDate(readData.finish_date)}` 
                        : formatShortDate(readData.finish_date);
                    rateEl.innerHTML = renderStars(readData.stars);
                }
            } else {
                titleEl.textContent = "TBD";
                imgEl.src = 'img/caraval_cover.jpg';
                authorEl.textContent = "Author";
                datesEl.textContent = "Date";
                rateEl.innerHTML = renderStars(0);
            }
        });
    } catch (err) {
        console.error("Errore podio:", err);
    }
}

async function getPodiumBook(rank) {
    const { data } = await sbAuth
        .from('Books')
        .select(`
            title, author, cover_link,
            Top_3_Year!inner(rank, year, user_id),
            Read(stars, start_date, finish_date, user_id)
        `)
        .eq('user_id', user.id)
        .eq('Top_3_Year.year', currYear)
        .eq('Top_3_Year.rank', rank) 
        .eq('Top_3_Year.user_id', user.id)
        .maybeSingle(); 
    return data;
}
//-------- MONTHLY FAVES ----------


export async function updateMonthFav() {

    try{
        const currYear = new Date().getFullYear();
        
        const{data:monthBooks, error: monthError} = await sbAuth
                    .from('Books')
                    .select(`
                        cover_link,
                        Monthly_Favourites!inner(month, year),
                        Read(stars)
                    `)
                    .eq('user_id', user.id)
                    .eq('Monthly_Favourites.year', currYear)
                    .order('month', { foreignTable: 'Monthly_Favourites', ascending: true });

        if (monthError) throw monthError;


        for (let i = 0; i < 12; i++) {
            const book = monthBooks[i];
            const n = i + 1; 

            if (book) {
                document.getElementById(`fav-img${n}`).src = book.cover_link || 'img/caraval_cover.jpg';
                document.getElementById(`fav-rate${n}`).innerHTML = renderStars(book.Read[0].stars);
            } else {
                document.getElementById(`fav-img${n}`).src = 'img/caraval_cover.jpg';
                document.getElementById(`fav-rate${n}`).innerHTML = renderStars(0);
            
            }
        }
    } catch (err) {
        console.error("Errore podio:", err);
    }


}

