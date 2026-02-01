export function formatDate(dateString) { //from YY-MM-DD to DD/MM/YY
    if (!dateString) return "-"; 
    const [year, month, day] = dateString.split("-");
    return `${day}/${month}/${year.slice(-2)}`; 
}

export function renderStars(rating) {
    let starsHTML = "";
    for (let i = 1; i <= 5; i++) {
        if (rating >= i) {
            // full star
            starsHTML += '<i class="fas fa-star"></i>';
        } else if (rating >= i - 0.5) {
            // half star
            starsHTML += '<i class="fas fa-star-half-alt"></i>';
        } else {
            // empty star
            starsHTML += '<i class="far fa-star"></i>';
        }
    }
    return starsHTML;
}

export function formatShortDate(dateStr) {
    if (!dateStr) return null;
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}`;
}

//import { renderStars, formatDate, formatShortDate } from './utils.js';