// Wait for the full HTML document to be loaded and parsed before executing the script
document.addEventListener("DOMContentLoaded", () => {


// ===DOM ELEMENTS REFERENCE=== //


  const themeToggle = document.querySelector(".theme-toggle");
  const promptForm = document.querySelector(".prompt-form");
  const promptInput = document.querySelector(".prompt-input")
  const promptBtn = document.querySelector(".prompt-btn");
  const generateBtn = document.querySelector(".generate-btn");
  const modelSelect = document.getElementById("model-select");
  const countSelect = document.getElementById("count-select");
  const ratioSelect = document.getElementById("ratio-select");
  const gridGallery = document.querySelector(".gallery-grid");
  const API_KEY = "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"; // TODO: Add your Hugging Face API key here


// ===RANDOM PROMPTS=== //


  const examplePrompts = [
    "A magic forest with glowing plants and fairy homes among giant mushrooms",
    "An old steampunk airship floating through golden clouds at sunset",
    "A future Mars colony with glass domes and gardens against red mountains",
    "A dragon sleeping on gold coins in a crystal cave",
    "An underwater kingdom with merpeople and glowing coral buildings",
    "A floating island with waterfalls pouring into clouds below",
    "A witch's cottage in fall with magic herbs in the garden",
    "A robot painting in a sunny studio with art supplies around it",
    "A magical library with floating glowing books and spiral staircases",
    "A Japanese shrine during cherry blossom season with lanterns and misty mountains",
    "A cosmic beach with glowing sand and an aurora in the night sky",
    "A medieval marketplace with colorful tents and street performers",
    "A cyberpunk city with neon signs and flying cars at night",
    "A peaceful bamboo forest with a hidden ancient temple",
    "A giant turtle carrying a village on its back in the ocean",
  ];


  // ===THEME INITIALIZATION===
  

  const userPref = localStorage.getItem("theme");
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const theme = userPref || (prefersDark ? "dark" : "light");

  // Apply the theme to the body and update the icon
  document.body.classList.toggle("dark-theme", theme === "dark");

  // Set the icon based on the current theme
  themeToggle.querySelector("i").className = theme === "dark"
    ? "fa-solid fa-sun"
    : "fa-solid fa-moon";

  // Set the theme in localStorage
  localStorage.setItem("theme", theme);


  

// ===THEME TOGGLE FUNCTION=== //


  const toggleTheme = () => {
// Toggle the dark theme class on the body
    const isDarkTheme = document.body.classList.toggle("dark-theme");
    const newTheme = isDarkTheme ? "dark" : "light";

    // Update the icon based on the new theme
    if (themeToggle) {
      const icon = themeToggle.querySelector("i");
      if (icon) {
        icon.className = newTheme === "dark" ? "fa-solid fa-sun" : "fa-solid fa-moon";
      }
    }

    // Update the localStorage with the new theme
    localStorage.setItem("theme", isDarkTheme ? "dark" : "light");
  }


// ===UTILITY: CALCULATE THE IMAGE DIMENSIONS=== //


  const getImageDimensions = (aspectRatio, baseSize = 512) => {
    const [width, height] = aspectRatio.split("/").map(Number);// Convert 16/9 to [16, 9]
    const scaleFactor = baseSize / Math.sqrt(width * height);// Calculate the scale factor based on the base size

    // Scale and round to nearest multiple of 16 (required by many ML models)
    let calculatedWidth = Math.round(width * scaleFactor);
    let calculatedHeight = Math.round(height * scaleFactor);

    calculatedWidth = Math.floor(calculatedWidth / 16) * 16;
    calculatedHeight = Math.floor(calculatedHeight / 16) * 16;

    return { width: calculatedWidth, height: calculatedHeight };
  };


// ===UPDATE IMAGE CARD ONCE IMAGE IS READY=== //


  const updateImageCard = (imgIndex, imgUrl) => {
    const imgCard = document.getElementById(`img-card-${imgIndex}`);
    if (!imgCard) return;

    imgCard.classList.remove("loading");

    // Populate the image card with the generated image and a download button
    imgCard.innerHTML = `
      <img src="${imgUrl}" alt="Generated Image" class="result-img" />
      <div class="img-overlay">
        <a href="${imgUrl}" class="img-download-btn" download="${Date.now()}.png">
          <i class="fa-solid fa-download"></i> <!-- optional icon for download -->
        </a>
      </div>
    `;
  };


// === FETCH IMAGES FROM THE API AND HANDLES RESPONSES


  const generateImages = async (selectedModel, imageCount, aspectRatio, promptText) => {
    const MODEL_URL = `https://api-inference.huggingface.co/models/${selectedModel}`;
    const { width, height } = getImageDimensions(aspectRatio);


    generateBtn.setAttribute("disabled", true); // Disable the button to prevent multiple clicks

    const imagePromises = Array.from({ length: imageCount }, async (_, i) => {
      try {

        const response = await fetch(MODEL_URL, {
          headers: {
            Authorization: `Bearer ${API_KEY}`,
            "Content-Type": "application/json",
            "x-use-cache": "false",
          },
          method: "POST",
          body: JSON.stringify({
            inputs: promptText,
            parameters: { width, height },
          }),

        });

        // Handle failed response
        if (!response.ok) throw new Error((await response.json())?.error);


        const result = await response.blob();
        updateImageCard(i, URL.createObjectURL(result));

      }
      catch (error) {
        console.log(error);

        // Update the image card to show an error status
        const imgCard = document.getElementById(`img-card-${i}`);
        imgCard.classList.replace("loading", "error");

      }
    });
    await Promise.allSettled(imagePromises);// Wait for all responses to complete

    generateBtn.removeAttribute("disabled");// Re-enable the button
  };


// ===CREATE PLACEHOLDER IMAGE CARDS BEFORE THE IMAGES ARRIVE=== //
  const createImageCards = (selectedModel, imageCount, aspectRatio, promptText) => {
    gridGallery.innerHTML = "";// Clear the gallery before adding new cards

    for (let i = 0; i < imageCount; i++) {
      gridGallery.innerHTML += `
            <div class="img-card loading" id= "img-card-${i}" style= "aspect-ratio:${aspectRatio}">
              <div class="status-container">
                <div class="spinner"></div>
                <i class="fa-solid fa-triangle-exclamation"></i>
                  <p class="status-text">Generating...</p>
              </div>
              `;
    }
  
  };


  // ===FORM SUBMISSION HANDLER FOR IMAGE GENERATION=== //


  const handleFormSubmit = (event) => {
    event.preventDefault();// Prevent page refresh

    const selectedModel = modelSelect.value;
    const imageCount = parseInt(countSelect.value) || 1;
    const aspectRatio = ratioSelect.value;
    const promptText = promptInput.value.trim();

    createImageCards(selectedModel, imageCount, aspectRatio, promptText);
    generateImages(selectedModel, imageCount, aspectRatio, promptText);

  };


  // ===BUTTON TO GENERATE RANDOM PROMPT=== //
  promptBtn.addEventListener("click", () => {
    const prompt = examplePrompts[Math.floor(Math.random() * examplePrompts.length)];
    promptInput.value = prompt;
    promptInput.focus();

  })
// ===EVENT LISTENERS===

  promptForm.addEventListener("submit", handleFormSubmit);

  themeToggle.addEventListener("click", toggleTheme);

});