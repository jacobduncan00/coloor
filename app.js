// HTML Queries
const colorDivs = document.querySelectorAll(".color");
const generateBtn = document.querySelector(".generate");
const sliders = document.querySelectorAll('input[type="range"]');
const currentHexes = document.querySelectorAll(".color h2");
const popup = document.querySelector(".copy-container");
const refreshPopup = document.querySelector(".clear-container");
const adjustButton = document.querySelectorAll(".adjust");
const lockButton = document.querySelectorAll(".lock");
const closeAdjustments = document.querySelectorAll(".close-adjustment");
const sliderContainers = document.querySelectorAll(".sliders");

// Constants / Reference to Original Color
let initialColors;

// Local Storage Array of Objects
let savedpalletes = [];

// Event Listeners
generateBtn.addEventListener("click", randomColors);

sliders.forEach((slider) => {
  slider.addEventListener("input", hslControls);
});

colorDivs.forEach((div, index) => {
  div.addEventListener("change", () => {
    updateTextUI(index);
  });
});

currentHexes.forEach((hex) => {
  hex.addEventListener("click", () => {
    copyToClipboard(hex);
  });
});

popup.addEventListener("transitionend", () => {
  const popupBox = popup.children[0];
  popup.classList.remove("active");
  popupBox.classList.remove("active");
});

refreshPopup.addEventListener("transitionend", () => {
  const refreshPopupBox = refreshPopup.children[0];
  refreshPopup.classList.remove("active");
  refreshPopupBox.classList.remove("active");
});

adjustButton.forEach((button, index) => {
  button.addEventListener("click", () => {
    openAdjustmentPanel(index);
  });
});

closeAdjustments.forEach((button, index) => {
  button.addEventListener("click", () => {
    closeAdjustmentPanel(index);
  });
});

lockButton.forEach((button, index) => {
  button.addEventListener("click", (e) => {
    lockLayer(e, index);
  });
});

// Functions

// Color Generator
// Normal Way
// function generateHex() {
//   const letters = "0123456789ABCDEF";
//   let hash = "#";
//   for (let i = 0; i < 6; i++) {
//     hash += letters[Math.floor(Math.random() * 16)];
//   }
//   return hash;
// }

// Color Generator
// ChromaJS way
function generateHex() {
  const hexColor = chroma.random();
  return hexColor;
}

function randomColors() {
  // Allows us to save initial color
  initialColors = [];
  colorDivs.forEach((div, index) => {
    const hexText = div.children[0];
    const randomColor = generateHex();

    // Add to initial color array to preserve it
    if (div.classList.contains("locked")) {
      initialColors.push(hexText.innerText);
      return;
    } else {
      initialColors.push(chroma(randomColor).hex());
    }

    // Add the generated color to the background
    div.style.backgroundColor = randomColor;
    hexText.innerText = randomColor;
    // Check for text contrast
    checkTextContrast(randomColor, hexText);
    // Set color changing sliders
    const color = chroma(randomColor);
    const sliders = div.querySelectorAll(".sliders input");
    // Each slider
    const hue = sliders[0];
    const brightness = sliders[1];
    const saturation = sliders[2];
    colorizeSliders(color, hue, brightness, saturation);
  });

  // Reset sliders
  resetInputs();

  // Check for contrast on buttons
  adjustButton.forEach((button, index) => {
    // for adjust button
    checkTextContrast(initialColors[index], button);
    // for lock button
    checkTextContrast(initialColors[index], lockButton[index]);
  });
}

function checkTextContrast(color, text) {
  // checks contrast of button and the text to change if needed
  const luminance = chroma(color).luminance();
  if (luminance > 0.5) {
    text.style.color = "black";
  } else {
    text.style.color = "white";
  }
}

function colorizeSliders(color, hue, brightness, saturation) {
  // Set saturation
  const noSat = color.set("hsl.s", 0);
  const fullSat = color.set("hsl.s", 1);
  const scaleSat = chroma.scale([noSat, color, fullSat]);
  // Update saturation slider
  saturation.style.backgroundImage = `linear-gradient(to right, ${scaleSat(
    0
  )}, ${scaleSat(1)})`;

  // Set brightness
  const midBright = color.set("hsl.l", 0.5);
  const lowBright = color.set("hsl.l", 0);
  const highBright = color.set("hsl.l", 1);
  const scaleBright = chroma.scale([lowBright, midBright, highBright]);
  // Update brightness slider
  brightness.style.backgroundImage = `linear-gradient(to right, ${scaleBright(
    0
  )}, ${scaleBright(0.5)}, ${scaleBright(1)})`;

  // Update hue slider
  hue.style.backgroundImage = `linear-gradient(to right, rgb(204, 75, 75), rgb(204, 204, 75), rgb(75, 204, 75), rgb(75, 204, 204), rgb(75, 75, 204), rgb(204, 75, 204), rgb(204, 75, 75))`;
}

// hue, saturation, light control
function hslControls(e) {
  const index =
    e.target.getAttribute("data-bright") ||
    e.target.getAttribute("data-sat") ||
    e.target.getAttribute("data-hue");

  let sliders = e.target.parentElement.querySelectorAll('input[type="range"]');
  const hue = sliders[0];
  const brightness = sliders[1];
  const saturation = sliders[2];
  // Dont rely on HTML text, rely on the initial color
  const bgColor = initialColors[index];
  let color = chroma(bgColor)
    .set("hsl.s", saturation.value)
    .set("hsl.l", brightness.value)
    .set("hsl.h", hue.value);

  colorDivs[index].style.backgroundColor = color;

  // Colorize inputs
  colorizeSliders(color, hue, brightness, saturation);
}

function updateTextUI(index) {
  const activeDiv = colorDivs[index];
  const color = chroma(activeDiv.style.backgroundColor);
  const textHex = activeDiv.querySelector("h2");
  const icons = activeDiv.querySelectorAll(".controls button");
  textHex.innerText = color.hex();

  // Check contrast again
  checkTextContrast(color, textHex);
  for (icon of icons) {
    checkTextContrast(color, icon);
  }
}

function resetInputs() {
  const sliders = document.querySelectorAll(".sliders input");
  sliders.forEach((slider) => {
    if (slider.name === "hue") {
      const hueColor = initialColors[slider.getAttribute("data-hue")];
      const hueValue = chroma(hueColor).hsl()[0];
      slider.value = Math.floor(hueValue);
    }
    if (slider.name === "brightness") {
      const brightColor = initialColors[slider.getAttribute("data-bright")];
      const brightValue = chroma(brightColor).hsl()[2];
      slider.value = Math.floor(brightValue * 100) / 100;
    }
    if (slider.name === "saturation") {
      const satColor = initialColors[slider.getAttribute("data-sat")];
      const satValue = chroma(satColor).hsl()[1];
      slider.value = Math.floor(satValue * 100) / 100;
    }
  });
}

function copyToClipboard(hex) {
  const element = document.createElement("textarea");
  element.value = hex.innerText;
  document.body.appendChild(element);
  element.select();
  document.execCommand("copy");
  document.body.removeChild(element);
  // Invoke popup animation
  const popupBox = popup.children[0];
  popup.classList.add("active");
  popupBox.classList.add("active");
}

function openAdjustmentPanel(index) {
  sliderContainers[index].classList.toggle("active");
}

function closeAdjustmentPanel(index) {
  sliderContainers[index].classList.remove("active");
}

function lockLayer(e, index) {
  const lockSVG = e.target.children[0];
  const activeBg = colorDivs[index];
  activeBg.classList.toggle("locked");

  if (lockSVG.classList.contains("fa-lock-open")) {
    e.target.innerHTML = '<i class="fas fa-lock"></i>';
  } else {
    e.target.innerHTML = '<i class="fas fa-lock-open"></i>';
  }
}

// Implement local storage stuff

const saveBtn = document.querySelector(".save");
const submitSave = document.querySelector(".submit-save");
const closeSave = document.querySelector(".close-save");
const saveContainer = document.querySelector(".save-container");
const saveInput = document.querySelector(".save-container input");
const libraryContainer = document.querySelector(".library-container");
const libraryBtn = document.querySelector(".library");
const closeLibraryBtn = document.querySelector(".close-library");
const refreshBtn = document.querySelector(".refresh");

//Event Listeners
saveBtn.addEventListener("click", openPallete);
closeSave.addEventListener("click", closePallete);
submitSave.addEventListener("click", savePallete);
libraryBtn.addEventListener("click", openLibrary);
closeLibraryBtn.addEventListener("click", closeLibrary);
refreshBtn.addEventListener("click", clearStorage);

function openPallete() {
  const popup = saveContainer.children[0];
  saveContainer.classList.add("active");
  popup.classList.add("active");
}
function closePallete() {
  const popup = saveContainer.children[0];
  saveContainer.classList.remove("active");
  popup.classList.add("remove");
}
function savePallete() {
  saveContainer.classList.remove("active");
  popup.classList.remove("active");
  const name = saveInput.value;
  const colors = [];
  currentHexes.forEach((hex) => {
    colors.push(hex.innerText);
  });

  let palleteNr;
  const palleteObjects = JSON.parse(localStorage.getItem("palletes"));
  if (palleteObjects) {
    palleteNr = palleteObjects.length;
  } else {
    palleteNr = savedpalletes.length;
  }

  const palleteObj = { name, colors, nr: palleteNr };
  savedpalletes.push(palleteObj);
  //Save to localStorage
  savetoLocal(palleteObj);
  saveInput.value = "";
  //Generate the pallete for Library
  const pallete = document.createElement("div");
  pallete.classList.add("custom-pallete");
  const title = document.createElement("h4");
  title.innerText = palleteObj.name;
  const preview = document.createElement("div");
  preview.classList.add("small-preview");
  palleteObj.colors.forEach((smallColor) => {
    const smallDiv = document.createElement("div");
    smallDiv.style.backgroundColor = smallColor;
    preview.appendChild(smallDiv);
  });
  const palleteBtn = document.createElement("button");
  palleteBtn.classList.add("pick-pallete-btn");
  palleteBtn.classList.add(palleteObj.nr);
  palleteBtn.innerText = "Select";

  //Attach event to the btn
  palleteBtn.addEventListener("click", (e) => {
    closeLibrary();
    const palleteIndex = e.target.classList[1];
    initialColors = [];
    savedpalletes[palleteIndex].colors.forEach((color, index) => {
      initialColors.push(color);
      colorDivs[index].style.backgroundColor = color;
      const text = colorDivs[index].children[0];
      checkTextContrast(color, text);
      updateTextUI(index);
    });
    resetInputs();
  });

  //Append to Library
  pallete.appendChild(title);
  pallete.appendChild(preview);
  pallete.appendChild(palleteBtn);
  libraryContainer.children[0].appendChild(pallete);
}

function savetoLocal(palleteObj) {
  let localpalletes;
  if (localStorage.getItem("palletes") === null) {
    localpalletes = [];
  } else {
    localpalletes = JSON.parse(localStorage.getItem("palletes"));
  }
  localpalletes.push(palleteObj);
  localStorage.setItem("palletes", JSON.stringify(localpalletes));
}
function openLibrary() {
  const popup = libraryContainer.children[0];
  libraryContainer.classList.add("active");
  popup.classList.add("active");
}
function closeLibrary() {
  const popup = libraryContainer.children[0];
  libraryContainer.classList.remove("active");
  popup.classList.remove("active");
}

function getLocal() {
  if (localStorage.getItem("palletes") === null) {
    //Local palletes
    localpalletes = [];
  } else {
    const palleteObjects = JSON.parse(localStorage.getItem("palletes"));

    savedpalletes = [...palleteObjects];
    palleteObjects.forEach((palleteObj) => {
      //Generate the pallete for Library
      const pallete = document.createElement("div");
      pallete.classList.add("custom-pallete");
      const title = document.createElement("h4");
      title.innerText = palleteObj.name;
      const preview = document.createElement("div");
      preview.classList.add("small-preview");
      palleteObj.colors.forEach((smallColor) => {
        const smallDiv = document.createElement("div");
        smallDiv.style.backgroundColor = smallColor;
        preview.appendChild(smallDiv);
      });
      const palleteBtn = document.createElement("button");
      palleteBtn.classList.add("pick-pallete-btn");
      palleteBtn.classList.add(palleteObj.nr);
      palleteBtn.innerText = "Select";

      //Attach event to the btn
      palleteBtn.addEventListener("click", (e) => {
        closeLibrary();
        const palleteIndex = e.target.classList[1];
        initialColors = [];
        palleteObjects[palleteIndex].colors.forEach((color, index) => {
          initialColors.push(color);
          colorDivs[index].style.backgroundColor = color;
          const text = colorDivs[index].children[0];
          checkTextContrast(color, text);
          updateTextUI(index);
        });
        resetInputs();
      });

      //Append to Library
      pallete.appendChild(title);
      pallete.appendChild(preview);
      pallete.appendChild(palleteBtn);
      libraryContainer.children[0].appendChild(pallete);
    });
  }
}

function clearStorage() {
  localStorage.clear();
  const refreshPopupBox = refreshPopup.children[0];
  refreshPopup.classList.add("active");
  refreshPopupBox.classList.add("active");
}

getLocal();
randomColors();
