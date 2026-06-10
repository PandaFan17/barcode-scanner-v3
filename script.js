import {
    BrowserMultiFormatReader
} from "https://cdn.jsdelivr.net/npm/@zxing/browser@0.1.5/+esm";

const codeReader = new BrowserMultiFormatReader();

const video = document.getElementById("video");
const cameraSelect = document.getElementById("cameraSelect");
const startBtn = document.getElementById("startBtn");
const resultDiv = document.getElementById("result");

let currentControls = null;

async function loadCameras() {
    try {
        const devices = await BrowserMultiFormatReader.listVideoInputDevices();

        cameraSelect.innerHTML = "";

        devices.forEach((device, index) => {
            const option = document.createElement("option");

            option.value = device.deviceId;
            option.text =
                device.label ||
                `Camera ${index + 1}`;

            cameraSelect.appendChild(option);
        });

        if (devices.length === 0) {
            resultDiv.textContent = "No cameras found.";
        }
    } catch (err) {
        console.error(err);
        resultDiv.textContent =
            "Could not access cameras. Check permissions.";
    }
}

async function startScanner() {

    if (currentControls) {
        currentControls.stop();
    }

    const deviceId = cameraSelect.value;

    resultDiv.textContent = "Scanning...";

    try {

        currentControls =
            await codeReader.decodeFromVideoDevice(
                deviceId,
                video,
                (result, error) => {

                    if (result) {

                        resultDiv.textContent =
                            result.getText();

                        console.log(
                            "QR:",
                            result.getText()
                        );
                    }
                }
            );

    } catch (err) {
        console.error(err);
        resultDiv.textContent =
            "Failed to start camera: " +
            err.message;
    }
}

startBtn.addEventListener("click", startScanner);

(async () => {

    try {

        await navigator.mediaDevices.getUserMedia({
            video: true
        });

        await loadCameras();

    } catch (err) {

        console.error(err);

        resultDiv.textContent =
            "Camera permission denied.";

    }

})();
