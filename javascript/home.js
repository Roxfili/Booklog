//pop up prova
const popup = document.getElementById("popup");
const openBtn = document.getElementById("open-popup");
const closeBtn = document.getElementById("close-popup");

//pop up tbr
const closeBtnTbr = document.getElementById("send-tbr")
const tbrPopBtn = document.getElementById("add-tbr-pop");
const popupTbr = document.getElementById("popupTbr");
const popupTbrForm =document.getElementById("popup-tbr-form");
const category = document.getElementById("length");
const subcategoryContainer = document.getElementById("subcategory-length");
const subcategory = document.getElementById("length-sub");

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



// ----- POP UP TBR
tbrPopBtn.addEventListener("click", () => {
  popupTbr.style.display = "flex"; // display:flex per centrare contenuto
});

closeBtn.addEventListener("click", () => {
  popupTbr.style.display = "none";
});

closeBtnTbr.addEventListener("click", () => {
  popupTbr.style.display = "none";
  subcategoryContainer.style.display = "none";
  popupTbrForm.reset();
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