export function loadRacePageContent() {
  const formData = JSON.parse(localStorage.getItem("raceFormData"));
  if (formData) {
    document.getElementById("race-name").textContent = formData["race-name"];
    document.getElementById("race-place").textContent = formData["race-place"];
    document.getElementById("primary-highlight-race-place").textContent =
      formData["race-place"];
    document.getElementById("highlight-race-place").textContent =
      formData["race-place"];
    document.getElementById("race-type").textContent = formData["race-type"];
    document.getElementById("highlight-race-type").textContent =
      formData["race-type"];
    document.getElementById("race-date").textContent = formData["race-date"];
    document.getElementById("highlight-race-date").textContent =
      formData["race-date"];

    const raceDistancesElement = document.getElementById("race-distances");
    const highlightRaceDistancesElement = document.getElementById(
      "highlight-race-distances"
    );

    // Clear existing content
    raceDistancesElement.innerHTML = "";
    highlightRaceDistancesElement.textContent = "";

    // Populate both elements
    formData.distances.forEach((distance, index) => {
      // For race-distances (in the main image)
      const distanceElement = document.createElement("div");
      distanceElement.classList.add("race-distance");
      distanceElement.textContent = `${distance} km`;
      raceDistancesElement.appendChild(distanceElement);

      // For highlight-race-distances (in the highlights container)
      if (index > 0)
        highlightRaceDistancesElement.appendChild(
          document.createTextNode(", ")
        );
      highlightRaceDistancesElement.appendChild(
        document.createTextNode(`${distance} km`)
      );
    });

    document.getElementById("race-summary").textContent =
      formData["race-summary"];
    document.getElementById("race-additional").textContent =
      formData["race-additional"];
    document.getElementById("race-website").href = formData["race-website"];
    document.getElementById("race-website").textContent =
      formData["race-website"];

    // Load images
    const raceImagesData = JSON.parse(localStorage.getItem("raceImages"));
    if (raceImagesData && raceImagesData.images.length > 0) {
      const mainImage = document.getElementById("race-main-image");
      const thumbnails = document.getElementById("race-thumbnails");

      mainImage.src = raceImagesData.images[0];

      raceImagesData.images.forEach((imageData, index) => {
        const container = document.createElement("div");
        container.classList.add("thumbnail-container");
        if (index === 0) {
          container.classList.add("active");
        }
        const img = document.createElement("img");
        img.src = imageData;
        img.alt = `Race image ${index + 1}`;
        img.addEventListener("click", () => {
          mainImage.src = imageData;
          thumbnails
            .querySelectorAll(".thumbnail-container")
            .forEach((thumb) => thumb.classList.remove("active"));
          container.classList.add("active");
        });
        const overlay = document.createElement("div");
        overlay.classList.add("overlay", "soft");
        container.appendChild(img);
        container.appendChild(overlay);
        thumbnails.appendChild(container);
      });
    }

    // Initialize map (you'll need to implement this based on your mapping solution)
    initializeMap(formData["race-place"]);

    // Populate race details
    const detailsMapping = {
      "race-name": "detail-race-name",
      "race-place": "detail-race-place",
      distances: "detail-distances",
      "race-organizer": "detail-race-organizer",
      "race-organizer-contact": "detail-race-organizer-contact",
      "race-price-range": "detail-race-price-range",
      "race-website": "detail-race-website",
      "race-start-time": "detail-race-start-time",
      "race-type": "detail-race-type",
    };

    Object.entries(detailsMapping).forEach(([key, elementId]) => {
      const element = document.getElementById(elementId);
      if (formData[key] && element) {
        element.style.display = "list-item";
        if (key === "race-website") {
          const link = element.querySelector("a");
          link.href = formData[key];
          link.textContent = formData[key];
        } else if (key === "distances") {
          element.querySelector("span").textContent = formData[key]
            .map((distance) => `${distance} km`)
            .join(", ");
        } else {
          element.querySelector("span").textContent = formData[key];
        }
      }
    });
  }
}

function initializeMap(location) {
  // Implement map initialization here
  // This will depend on the mapping solution you're using (e.g., Mapbox, Google Maps, etc.)
}
