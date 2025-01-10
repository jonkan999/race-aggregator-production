// project-root/common/js/racePageImageHandling.js

document.addEventListener("DOMContentLoaded", function () {
  const mainImage = document.getElementById("race-main-image");
  const thumbnails = document.getElementById("race-thumbnails");

  if (mainImage && thumbnails) {
    const thumbnailContainers = thumbnails.querySelectorAll(
      ".thumbnail-container"
    );

    thumbnailContainers.forEach((container, index) => {
      const img = container.querySelector("img");
      if (index === 0) {
        container.classList.add("active");
      }

      img.addEventListener("click", () => {
        mainImage.src = img.src;
        mainImage.alt = img.alt;
        thumbnailContainers.forEach((thumb) =>
          thumb.classList.remove("active")
        );
        container.classList.add("active");
      });
    });
  }
});