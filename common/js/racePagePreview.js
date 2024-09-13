document.addEventListener("DOMContentLoaded", () => {
  const raceData = JSON.parse(localStorage.getItem("raceData"));
  if (raceData) {
    updatePreview(raceData);
  }

  document.getElementById("edit-race").addEventListener("click", () => {
    window.location.href = "add_race.html";
  });

  document.getElementById("submit-race").addEventListener("click", () => {
    submitRace(raceData);
  });
});

function updatePreview(race) {
  document.getElementById("preview-name").textContent = race.name;
  document.getElementById("preview-date").textContent = formatDate(
    race.date,
    race.end_date
  );
  document.getElementById("preview-location").textContent = race.place;
  document.getElementById("preview-type").textContent = race.type;
  document.getElementById("preview-distances").textContent =
    race.distances.join(", ");
  document.getElementById("preview-organizer").textContent = race.organizer;
  document.getElementById("preview-price-range").textContent = race.price_range;

  const websiteLink = document.getElementById("preview-website");
  websiteLink.href = race.website;
  websiteLink.textContent = race.website;

  document.getElementById("preview-summary").textContent = race.summary;
  document.getElementById("preview-additional").textContent = race.additional;

  updatePreviewMap(race.place);
  updatePreviewImages(race.images);
}

function formatDate(startDate, endDate) {
  // Implement date formatting logic here
  return endDate ? `${startDate} - ${endDate}` : startDate;
}

function updatePreviewMap(place) {
  // Implement map update logic here
  const mapContainer = document.getElementById("preview-map");
  mapContainer.textContent = `Map placeholder for ${place}`;
}

function updatePreviewImages(images) {
  const imagesContainer = document.getElementById("preview-images");
  images.forEach((imageData) => {
    const img = document.createElement("img");
    img.src = imageData;
    img.alt = "Race image";
    imagesContainer.appendChild(img);
  });
}

function submitRace(raceData) {
  // Implement race submission logic here
  console.log("Submitting race:", raceData);
  alert("Race submitted successfully!");
  localStorage.removeItem("raceData");
  window.location.href = "add_race.html";
}
