export async function submitRace() {
  const formData = JSON.parse(localStorage.getItem("raceFormData"));
  const mapCoordinates = JSON.parse(localStorage.getItem("raceCoordinates"));
  const raceImages = JSON.parse(localStorage.getItem("raceImages"));

  if (!formData || !mapCoordinates || !raceImages) {
    alert(
      "Missing data. Please make sure you've filled out the form and selected a location on the map."
    );
    return;
  }

  const raceObject = {
    date: formData["race-date"].replace(/-/g, ""),
    type: formData["race-type"].toLowerCase(),
    name: formData["race-name"],
    image_partial_key: generateImagePartialKey(formData["race-name"]),
    distance: formData.distances.join(" "),
    distance_m: formData.distances.map((d) =>
      d === "backyard" ? "backyard" : d * 1000
    ),
    place: formData["race-place"],
    latitude: mapCoordinates.latitude,
    longitude: mapCoordinates.longitude,
    organizer: formData["race-organizer"],
    website: `/race-pages/${generateImagePartialKey(
      formData["race-name"]
    )}.html`,
    county: "", // You might want to add a function to derive this from the place
    id: `${generateImagePartialKey(formData["race-name"])}_${formData[
      "race-date"
    ].replace(/-/g, "")}`,
    summary: formData["race-summary"],
    website_organizer: formData["race-website"],
    price_range: formData["race-price-range"],
    new_version: true,
  };

  if (formData["multi-day-toggle"] === "on") {
    raceObject.end_date = formData["race-end-date"].replace(/-/g, "");
  }

  const imageData = raceImages.images.map((img, index) => ({
    id: `${raceObject.id}_image_${index + 1}`,
    data: img, // This is already the base64 encoded image data
    name: `image_${index + 1}.webp`, // Assuming all images are WebP format
  }));

  // Here you would typically send this data to your server
  /*   console.log("Race object:", raceObject);
  console.log("Image data:", imageData); */
  console.log("Race object:", JSON.stringify(raceObject));
  console.log("Image data:", JSON.stringify(imageData));

  // For now, we'll just show an alert
  alert("Race submitted successfully! Check the console for details.");

  // Clear the form and local storage
  clearFormAndStorage();
}

function generateImagePartialKey(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function clearFormAndStorage() {
  /*     localStorage.removeItem("raceFormData");
    localStorage.removeItem("raceCoordinates");
    localStorage.removeItem("raceImages"); */
  // You might want to add code here to clear the form fields if necessary
}
