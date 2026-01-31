// //DB
// const supabaseUrl = "https://aiobatomkcovcgbcjuef.supabase.co";
// const supabaseKey = "sb_publishable_qSEddXtkWGocCmpvVVFbHA_iHWIQynQ";

// const sbAuth = window.supabase.createClient(
//   supabaseUrl,
//   supabaseKey
// );
//BOOKS PAGE FILTER OPTIONS SCRIPT

const filterSelect = document.getElementById("filter");
const datalist = document.getElementById("filter-options");
const label = document.getElementById("filter-label");
const formContainer = document.getElementById("form-order");
const input = document.getElementById("filter-value");


const data = {
    author: ["J.K. Rowling", "Brandon Sanderson", "George R.R. Martin"],
    genre: ["Fantasy", "Sci-Fi", "Romance", "Romantasy"],
    title: ["Harry Potter", "Mistborn", "Game of Thrones"],
    status: [ "In Progress", "Completed", "Standalone" ],
    serie: [ "A Court of Thorns and Roses", "Caraval", "Throne of Glass", "Once Upon A Broken Heart", "Powerless" ],
    bought: [ "Yes", "No" ]
};

filterSelect.addEventListener("change", () => {
    const type = filterSelect.value;
    formContainer.style.display = "block";
    input.value = "";

    if (!data[type]) {
        label.textContent = "Coming soon:";
        datalist.innerHTML = "";
        return;
    }

    label.textContent =
        type.charAt(0).toUpperCase() + type.slice(1) + ":";
    datalist.innerHTML = data[type]
        .map(item => `<option value="${item}">`)
        .join("");
});
//ORDER BOOKS SCRIPT WITH ARROWS

const orderRadios = document.querySelectorAll('.order-btn input');

let lastSelected = null;
let ascending = true; // stato freccia corrente

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
    });
});