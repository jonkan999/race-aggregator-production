import { loadRacePageContent } from "./racePageContent.js";

document.addEventListener("DOMContentLoaded", () => {
  const editRaceButton = document.getElementById("edit-race");
  const submitRaceButton = document.getElementById("submit-race");

  loadRacePageContent();

  editRaceButton.addEventListener("click", () => {
    window.location.href = `/{{ navigation['add-race'] | slugify(country_code) }}.html`;
  });

  submitRaceButton.addEventListener("click", () => {
    if (confirm(translations.submit_race_confirmation)) {
      // Implement the submission logic here
      alert(translations.race_submitted_successfully);
      localStorage.removeItem("raceFormData");
      localStorage.removeItem("raceImages");
      window.location.href = "/index.html";
    }
  });
});
