document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("add-race-form");
  const previewButton = document.getElementById("preview-button");
  const previewModal = document.getElementById("preview-modal");
  const closePreview = document.getElementById("close-preview");
  const previewContent = document.getElementById("preview-content");
  const multiDayToggle = document.getElementById("multi-day-toggle");
  const endDateContainer = document.getElementById("end-date-container");
  const distanceInput = document.getElementById("distance-input");
  const addDistanceButton = document.getElementById("add-distance");
  const distancesContainer = document.getElementById("distances-container");
  const raceDistancesInput = document.getElementById("race-distances");
  const quickDistanceButtons = document.querySelectorAll(".quick-distance");
  const fileInput = document.getElementById("race-images");
  const tagsContainer = document.getElementById("picture-tags-container");

  let distances = [];

  // Add this function to save form data to local storage
  function saveFormToLocalStorage() {
    const formData = new FormData(form);
    const formObject = {};
    for (const [key, value] of formData.entries()) {
      formObject[key] = value;
    }
    formObject.distances = distances;

    // Save file information
    const fileInfo = Array.from(fileInput.files).map((file) => ({
      name: file.name,
      size: file.size,
      type: file.type,
    }));
    formObject.fileInfo = fileInfo;

    localStorage.setItem("raceFormData", JSON.stringify(formObject));
  }

  // Add this function to load form data from local storage
  function loadFormFromLocalStorage() {
    const savedData = localStorage.getItem("raceFormData");
    if (savedData) {
      const formObject = JSON.parse(savedData);
      for (const [key, value] of Object.entries(formObject)) {
        if (key === "distances") {
          distances = value;
          updateDistancesDisplay();
        } else if (key === "fileInfo") {
          // Restore file information to the UI
          tagsContainer.innerHTML = "";
          value.forEach((file) => {
            const tag = document.createElement("div");
            tag.className = "picture-tag";
            tag.innerHTML = `
              <span class="picture-name">${file.name}</span>
              <span class="remove-picture" data-file="${file.name}">×</span>
            `;
            tagsContainer.appendChild(tag);
          });
          addRemoveListeners();
        } else {
          const field = form.elements[key];
          if (field) {
            if (field.type === "checkbox") {
              field.checked = value === "on";
            } else {
              field.value = value;
            }
          }
        }
      }
    }
  }

  // Call this function to load saved data when the page loads
  loadFormFromLocalStorage();

  // Add event listeners to all form inputs and buttons
  form.querySelectorAll("input, select, textarea").forEach((element) => {
    element.addEventListener("change", saveFormToLocalStorage);
  });

  form.querySelectorAll("button").forEach((button) => {
    button.addEventListener("click", saveFormToLocalStorage);
  });

  multiDayToggle.addEventListener("change", () => {
    endDateContainer.style.display = multiDayToggle.checked ? "block" : "none";
  });

  addDistanceButton.addEventListener("click", () => {
    addDistance(distanceInput.value);
  });

  quickDistanceButtons.forEach((button) => {
    button.addEventListener("click", () => {
      addDistance(button.dataset.distance);
    });
  });

  function addDistance(distance) {
    if (distance) {
      distances.push(distance);
      updateDistancesDisplay();
      distanceInput.value = "";
      saveFormToLocalStorage();
    }
  }

  function updateDistancesDisplay() {
    distancesContainer.innerHTML = distances
      .map(
        (d) => `
      <div class="distance-tag">
        ${d === "backyard" ? "Backyard Ultra" : d + " km"}
        <button type="button" class="remove-distance" data-distance="${d}">×</button>
      </div>
    `
      )
      .join("");
    raceDistancesInput.value = JSON.stringify(distances);

    document.querySelectorAll(".remove-distance").forEach((button) => {
      button.addEventListener("click", () => {
        distances = distances.filter((d) => d != button.dataset.distance);
        updateDistancesDisplay();
        saveFormToLocalStorage();
      });
    });
  }

  previewButton.addEventListener("click", () => {
    const formData = new FormData(form);
    const previewHtml = generatePreview(formData);
    previewContent.innerHTML = previewHtml;
    previewModal.style.display = "block";
  });

  closePreview.addEventListener("click", () => {
    previewModal.style.display = "none";
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const formData = new FormData(form);

    // Process images
    const imageFiles = formData.getAll("race-images");
    const processedImages = await processImages(imageFiles);

    // Create race object in races.json compatible format
    const raceObject = {
      date: formData.get("race-date").replace(/-/g, ""),
      type: formData.get("race-type").toLowerCase(),
      name: formData.get("race-name"),
      image_partial_key: generateImagePartialKey(formData.get("race-name")),
      distance: distances.join(" "),
      distance_m: distances.map((d) =>
        d === "backyard" ? "backyard" : d * 1000
      ),
      place: formData.get("race-place"),
      latitude: 0, // Placeholder, replace with actual map data
      longitude: 0, // Placeholder, replace with actual map data
      organizer: formData.get("race-organizer"),
      website: formData.get("race-website"),
      county: "", // Placeholder, derive from place if possible
      id: generateId(formData),
      summary: formData.get("race-summary"),
      website_organizer: formData.get("race-website"),
      price_range: formData.get("race-price-range"),
      new_version: true,
    };

    if (multiDayToggle.checked) {
      raceObject.end_date = formData.get("race-end-date").replace(/-/g, "");
    }

    console.log(JSON.stringify(raceObject, null, 2));

    // In a real scenario, you'd send this to the server
    // For now, we'll just log it to the console
    console.log("Race object:", raceObject);
    console.log("Processed images:", processedImages);

    alert("Race data logged to console. Check browser developer tools.");
    form.reset();
    distances = [];
    updateDistancesDisplay();
    localStorage.removeItem("raceFormData");
  });

  fileInput.addEventListener("change", function (e) {
    tagsContainer.innerHTML = ""; // Clear existing tags
    const files = e.target.files;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const tag = document.createElement("div");
      tag.className = "picture-tag";
      tag.innerHTML = `
        <span class="picture-name">${file.name}</span>
        <span class="remove-picture" data-file="${file.name}">×</span>
      `;
      tagsContainer.appendChild(tag);
    }

    addRemoveListeners();
    saveFormToLocalStorage();
  });

  function addRemoveListeners() {
    const removeButtons = document.querySelectorAll(".remove-picture");
    removeButtons.forEach((button) => {
      button.addEventListener("click", function () {
        const fileName = this.getAttribute("data-file");
        this.parentElement.remove();
        // Remove the file from the FileList
        const dt = new DataTransfer();
        const { files } = fileInput;
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          if (file.name !== fileName) dt.items.add(file);
        }
        fileInput.files = dt.files;
        saveFormToLocalStorage();
      });
    });
  }

  // Update this function to clear the form and local storage
  function clearFormAndStorage() {
    form.reset();

    // Clear distances
    distances = [];
    updateDistancesDisplay();

    // Clear image tags
    tagsContainer.innerHTML = "";
    fileInput.value = ""; // Clear the file input

    // Remove data from local storage
    localStorage.removeItem("raceFormData");

    // Clear the map marker
    if (window.globalMap && window.globalMarker) {
      window.globalMap.removeLayer(window.globalMarker);
      window.globalMarker = null;
    }

    // Update coordinates display
    const coordinatesDisplay = document.getElementById("coordinates-display");
    if (coordinatesDisplay) {
      coordinatesDisplay.textContent = "Loppets koordinater: Inte valda";
    }

    // Clear latitude and longitude inputs if they exist
    const latitudeInput = document.getElementById("latitude");
    const longitudeInput = document.getElementById("longitude");
    if (latitudeInput) latitudeInput.value = "";
    if (longitudeInput) longitudeInput.value = "";
  }

  // Add event listener for the clear form button
  const clearFormButton = document.getElementById("clear-form");
  if (clearFormButton) {
    clearFormButton.addEventListener("click", (e) => {
      e.preventDefault();
      clearFormAndStorage();
    });
  }

  const imageUpload = document.getElementById("race-images");
  const fileUploadStatus = document.getElementById("file-upload-status");
  const imageContainer = document.querySelector(".image-container");
  const clearImagesButton = document.getElementById("clear-images-button");

  let raceImagesData = JSON.parse(localStorage.getItem("raceImages")) || {
    images: [],
  };

  function updateFileUploadStatus() {
    if (imageUpload.files.length > 0) {
      const fileNames = Array.from(imageUpload.files).map(
        (file) => `${file.name} (${formatFileSize(file.size)})`
      );
      fileUploadStatus.textContent = fileNames.join(", ");
    } else {
      fileUploadStatus.textContent = "Inga bilder valda";
    }
  }

  function formatFileSize(size) {
    if (size < 1024) return `${size} bytes`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(2)} KB`;
    return `${(size / (1024 * 1024)).toFixed(2)} MB`;
  }

  async function handleImageUpload(event) {
    showLoadingSpinner();
    const files = event.target.files;
    const promises = [];
    const maxNumImages = 8 - raceImagesData.images.length;
    const maxFileSize = 1048576 / 8; // 1MB divided by 8

    if (files.length > maxNumImages) {
      alert(`Du kan bara ladda upp ${maxNumImages} bilder till.`);
      hideLoadingSpinner();
      return;
    }

    for (let i = 0; i < files.length && i < maxNumImages; i++) {
      const file = files[i];
      promises.push(processImage(file, maxFileSize));
    }

    await Promise.all(promises);
    refreshImageDisplay();
    hideLoadingSpinner();
    updateFileUploadStatus();
  }

  async function processImage(file, maxFileSize) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const image = new Image();
        image.src = e.target.result;
        image.onload = async () => {
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");
          let { width, height } = image;
          let quality = 0.9;

          do {
            canvas.width = width;
            canvas.height = height;
            ctx.drawImage(image, 0, 0, width, height);
            const compressedImageData = canvas.toDataURL("image/webp", quality);

            if (compressedImageData.length <= maxFileSize) {
              raceImagesData.images.push(compressedImageData);
              localStorage.setItem(
                "raceImages",
                JSON.stringify(raceImagesData)
              );
              resolve();
              return;
            }

            quality -= 0.1;
            width *= 0.9;
            height *= 0.9;
          } while (quality > 0.1);

          alert(
            `Kunde inte komprimera bilden ${file.name} tillräckligt. Försök med en mindre bild.`
          );
          resolve();
        };
      };
      reader.readAsDataURL(file);
    });
  }

  function displayImage(imageData, index) {
    const imgContainer = document.createElement("div");
    imgContainer.className = "uploaded-image-container";

    const img = document.createElement("img");
    img.src = imageData;

    const deleteIcon = document.createElement("span");
    deleteIcon.className = "delete-icon";
    deleteIcon.textContent = "×";
    deleteIcon.addEventListener("click", () => removeImage(index));

    imgContainer.appendChild(img);
    imgContainer.appendChild(deleteIcon);
    imageContainer.appendChild(imgContainer);
  }

  function removeImage(index) {
    raceImagesData.images.splice(index, 1);
    localStorage.setItem("raceImages", JSON.stringify(raceImagesData));
    refreshImageDisplay();
  }

  function refreshImageDisplay() {
    imageContainer.innerHTML = "";
    raceImagesData.images.forEach((imageData, index) =>
      displayImage(imageData, index)
    );
    updateFileUploadStatus();
  }

  function showLoadingSpinner() {
    // Implement your loading spinner logic here
  }

  function hideLoadingSpinner() {
    // Implement your loading spinner logic here
  }

  imageUpload.addEventListener("change", handleImageUpload);

  clearImagesButton.addEventListener("click", (e) => {
    e.preventDefault();
    localStorage.removeItem("raceImages");
    raceImagesData = { images: [] };
    refreshImageDisplay();
  });

  // Initial display of images
  refreshImageDisplay();

  // Modify the clearFormAndStorage function
  function clearFormAndStorage() {
    form.reset();

    // Clear distances
    distances = [];
    updateDistancesDisplay();

    // Clear image tags
    tagsContainer.innerHTML = "";
    fileInput.value = ""; // Clear the file input

    // Remove data from local storage
    localStorage.removeItem("raceFormData");

    // Clear the map marker
    if (window.globalMap && window.globalMarker) {
      window.globalMap.removeLayer(window.globalMarker);
      window.globalMarker = null;
    }

    // Update coordinates display
    const coordinatesDisplay = document.getElementById("coordinates-display");
    if (coordinatesDisplay) {
      coordinatesDisplay.textContent = "Loppets koordinater: Inte valda";
    }

    // Clear latitude and longitude inputs if they exist
    const latitudeInput = document.getElementById("latitude");
    const longitudeInput = document.getElementById("longitude");
    if (latitudeInput) latitudeInput.value = "";
    if (longitudeInput) longitudeInput.value = "";

    // Clear race images
    localStorage.removeItem("raceImages");
    raceImagesData = { images: [] };
    refreshImageDisplay();
  }

  // Add event listener for the clear form button
  const clearFormButton = document.getElementById("clear-form");
  if (clearFormButton) {
    clearFormButton.addEventListener("click", (e) => {
      e.preventDefault();
      clearFormAndStorage();
    });
  }
});

function generateImagePartialKey(raceName) {
  return raceName.toLowerCase().replace(/[^a-z0-9]+/g, "-");
}

function generateId(formData) {
  const date = formData.get("race-date").replace(/-/g, "");
  const name = formData
    .get("race-name")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-");
  const website = formData.get("race-website").replace(/[^a-z0-9]+/g, "");
  return `${name}_${date}_${website}`;
}

async function processImages(imageFiles) {
  const processedImages = [];
  for (const file of imageFiles) {
    const resizedImage = await resizeImage(file, 1000); // Max width 1000px
    const webpBlob = await convertToWebP(resizedImage);
    const compressedWebP = await compressImage(webpBlob, 500 * 1024); // 500 KB limit
    processedImages.push({
      name: `${file.name.split(".")[0]}.webp`,
      blob: compressedWebP,
    });
  }
  return processedImages;
}

function resizeImage(file, maxWidth) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const scale = maxWidth / img.width;
        canvas.width = maxWidth;
        canvas.height = img.height * scale;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        canvas.toBlob(resolve, "image/jpeg", 0.9);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

function convertToWebP(blob) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0);
      canvas.toBlob(resolve, "image/webp", 0.9);
    };
    img.src = URL.createObjectURL(blob);
  });
}

async function compressImage(blob, maxSizeInBytes) {
  let quality = 0.9;
  let compressedBlob = blob;

  while (compressedBlob.size > maxSizeInBytes && quality > 0.1) {
    quality -= 0.1;
    compressedBlob = await new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0);
        canvas.toBlob(resolve, "image/webp", quality);
      };
      img.src = URL.createObjectURL(blob);
    });
  }

  return compressedBlob;
}

function generatePreview(formData) {
  let html = "<h3>" + formData.get("race-name") + "</h3>";
  html += "<p>Date: " + formData.get("race-date");
  if (formData.get("multi-day-toggle") === "on") {
    html += " to " + formData.get("race-end-date");
  }
  html += "</p>";
  html += "<p>Type: " + formData.get("race-type") + "</p>";
  html += "<p>Distances: " + formData.get("race-distances") + "</p>";
  html += "<p>Place: " + formData.get("race-place") + "</p>";
  html += "<p>Organizer: " + formData.get("race-organizer") + "</p>";
  html += "<p>Price Range: " + formData.get("race-price-range") + "</p>";
  html += "<p>Summary: " + formData.get("race-summary") + "</p>";
  return html;
}
