//DB
const supabaseUrl = "https://aiobatomkcovcgbcjuef.supabase.co";
const supabaseKey = "sb_publishable_qSEddXtkWGocCmpvVVFbHA_iHWIQynQ";

const supabase = window.supabase.createClient(
  supabaseUrl,
  supabaseKey
);




//pop up prova
const popup = document.getElementById("popup");
const openBtn = document.getElementById("open-popup");
const closeBtn = document.getElementById("close-popup");

// -------- pop up prova

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

closeBtn.addEventListener("click", () => {
  popupTbr.style.display = "none";
});


sendBtnTbr.addEventListener("click", () => {
  popupTbr.style.display = "none";
  judgyPop.style.display = "flex";
  subcategoryContainer.style.display = "none";
  popupTbrForm.reset();
});

closeTbrBtn.addEventListener("click", () => {
  popupTbr.style.display = "none";
});

closeJudgyBtn.addEventListener("click", () => {
  judgyPop.style.display = "none";
  
  alert("No really, stop adding and start reading...");
});

window.addEventListener("click", (e) => {
  if (e.target === popup) {
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

sendBtnCur.addEventListener("click", () => {
  popupRead.style.display = "none";
  popupStat.style.display="flex";
  popupCrForm.reset();
});

closeStatBtn.addEventListener("click", () => {
  popupStat.style.display = "none"; 
  statForm.reset();
});

sendBtnStat.addEventListener("click", () => {
  popupStat.style.display="none";
  statForm.reset();

});

//pop up classifica
const q1 = document.getElementById("q1");
const q2 = document.getElementById("q2");
const q3 = document.getElementById("q3");

const form = document.getElementById("cascade-form");


// Domanda 1
q1.querySelectorAll('input[name="q1"]').forEach(radio => {
  radio.addEventListener("change", () => {
    if (radio.value === "yes") {
      q2.style.display = "block";
    } else {
      q2.style.display = "none";
      q3.style.display = "none"; // nasconde anche la 3 se la 1 è No
    }
  });
});

// Domanda 2
q2.querySelectorAll('input[name="q2"]').forEach(radio => {
  radio.addEventListener("change", () => {
    if (radio.value === "yes") {
      q3.style.display = "block";
    } else {
      q3.style.display = "none";
    }
  });
});

// Form submit (puoi collegarlo al DB)
form.addEventListener("submit", (e) => {
  e.preventDefault();

  const answers = {
    q1: form.querySelector('input[name="q1"]:checked')?.value,
    q2: form.querySelector('input[name="q2"]:checked')?.value,
    q3: form.querySelector('input[name="q3"]:checked')?.value
  };

});

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
BooksReadTbr2026
