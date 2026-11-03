const choisir = document.querySelector("#choisir");
const importer = choisir.querySelector("#importer");
const video = choisir.querySelector("#video");
const ouvrirCamera = choisir.querySelector("#ouvrirCamera");
const prendrePhoto = choisir.querySelector("#prendrePhoto");
const fermerCamera = choisir.querySelector("#fermerCamera");

const retouche = document.querySelector("#retouche");
const telecharger = retouche.querySelector("#telecharger")
const selectFiltre = retouche.querySelector("#filtre");
const selectLuminosite = retouche.querySelector("#luminosite");
const canvas = retouche.querySelector("canvas");
const ctx = canvas.getContext("2d");

let photo = null;
let flux = null;
let filtre = "normal";
let luminosite = 100;
let effet = "";

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(reg => console.log('Service Worker enregistré !', reg))
      .catch(err => console.error('Erreur d\'enregistrement', err));
  });
}

importer.addEventListener("submit", event => {
    event.preventDefault();

    const formData = new FormData(importer);

    photo = formData.get("photo");

    if (photo.size > 0) {
        console.log(photo);

        choisir.hidden = true;
        retouche.hidden = false;

        const image = new Image();

        image.onload = () => {
            afficherPhoto(image);
            URL.revokeObjectURL(image.src);
        };

        image.onerror = () => {
            URL.revokeObjectURL(image.src);
        };

        image.src = URL.createObjectURL(photo);
    };
});

ouvrirCamera.addEventListener("click", async () => {
    try {
        flux = await navigator.mediaDevices.getUserMedia({
            video: {
                facingMode: { ideal: "environment" }
            },
            audio: false
        });

        video.srcObject = flux;
        video.hidden = false;

        ouvrirCamera.disabled = true;
        fermerCamera.disabled = false;
        prendrePhoto.hidden = false;

        await video.play();
    } catch (erreur) {
        console.error(erreur);
    }
});

fermerCamera.addEventListener("click", arreterCamera);

function arreterCamera() {
    if (flux) {
        flux.getTracks().forEach(track => track.stop());
        flux = null;
    }

    video.srcObject = null;
    video.hidden = true;
    
    prendrePhoto.hidden = true;
    ouvrirCamera.disabled = false;
    fermerCamera.disabled = true;
}

prendrePhoto.addEventListener("click", () => {
    if (!video.videoWidth || !video.videoHeight) {
        return;
    }

    const image = new Image();

    const photoCanvas = document.createElement("canvas");

    photoCanvas.width = video.videoWidth;
    photoCanvas.height = video.videoHeight;

    const photoCtx = photoCanvas.getContext("2d");

    photoCtx.drawImage(
        video,
        0,
        0,
        photoCanvas.width,
        photoCanvas.height
    );

    image.onload = () => afficherPhoto(image);

    image.src = photoCanvas.toDataURL("image/png");

    arreterCamera();
});

function afficherPhoto(image) {
    photo = image;

    canvas.width = image.naturalWidth || image.videoWidth;
    canvas.height = image.naturalHeight || image.videoHeight;

    choisir.hidden = true;
    retouche.hidden = false;

    filtre = selectFiltre.value;
    luminosite = Number(selectLuminosite.value);

    appliquerEffet();
}

function appliquerEffet() {
    let effet = "none";

    switch(filtre) {
        case "normal":
            effet = "none";
            break;
        case "noirblanc":
            effet = "grayscale(100%)";
            break;
        case "sepia":
            effet = "sepia(100%)";
            break;
        case "flou":
            effet = "blur(2px)";
            break;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.filter = `${effet} brightness(${luminosite}%)`;

    ctx.drawImage(photo, 0, 0, canvas.width, canvas.height);

    ctx.filter = "none";
}

selectFiltre.addEventListener("change", () => {
    filtre = selectFiltre.value;
    appliquerEffet();
});

selectLuminosite.addEventListener("input", () => {
    luminosite = Number(selectLuminosite.value);
    appliquerEffet();
});

telecharger.addEventListener("submit", event => {
    event.preventDefault();

    appliquerEffet();

    canvas.toBlob(blob => {
        const url = URL.createObjectURL(blob);
        const lien = document.createElement("a");

        lien.href = url;
        lien.download = "funpictures.png";
        lien.click();

        setTimeout(() => URL.revokeObjectURL(url), 1000);
    }, "image/png");
});