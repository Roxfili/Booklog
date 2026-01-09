


//tbr options script
const category = document.getElementById("length");
const subcategoryContainer = document.getElementById("subcategory-length");
const subcategory = document.getElementById("length-sub");

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