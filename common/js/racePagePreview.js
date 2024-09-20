import { loadRacePageContent } from "./racePageContent.js";
import { submitRace } from "./submitRace.js";

document.addEventListener("DOMContentLoaded", () => {
  const editRaceButton = document.getElementById("edit-race");
  const submitRaceButton = document.getElementById("submit-race-button");

  loadRacePageContent();

  editRaceButton.addEventListener("click", () => {
    window.location.href = `/{{ navigation['add-race'] | slugify(country_code) }}.html`;
  });

  submitRaceButton.addEventListener("click", submitRace);
});
