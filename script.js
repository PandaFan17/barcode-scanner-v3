import {
    BrowserMultiFormatReader
} from "https://cdn.jsdelivr.net/npm/@zxing/browser@0.1.5/+esm";

import {
    BarcodeFormat,
    DecodeHintType
} from "https://cdn.jsdelivr.net/npm/@zxing/library@0.21.3/+esm";

const hints = new Map();

hints.set(
    DecodeHintType.POSSIBLE_FORMATS,
    [BarcodeFormat.CODE_39]
);

const codeReader = new BrowserMultiFormatReader(hints);

const video = document.getElementById("video");
const cameraSelect = document.getElementById("cameraSelect");
const startBtn = document.getElementById("startBtn");
const stopBtn = document.getElementById("stopBtn");
const resultDiv = document.getElementById("result");
const statusDiv = document.getElementById("status");

let currentControls = null;

async function loadCameras() {
    try {
        const devices =
            await BrowserMultiFormatReader.listVideoInputDevices();

        cameraSelect.innerHTML = "";

        if (devices.length === 0) {
            statusDiv.textContent = "No cameras detected.";
            statusDiv.className = "error";
            return;
        }

        let preferred = null;

        devices.forEach((device, index) => {

            const option = document.createElement("option");

            option.value = device.deviceId;
            option.textContent =
                device.label || `Camera ${index + 1}`;

            cameraSelect.appendChild(option);

            const label = (device.label || "").toLowerCase();

            if (
                label.includes("back") ||
                label.includes("rear") ||
                label.includes("environment")
            ) {
                preferred = device.deviceId;
            }
        });

        if (preferred) {
            cameraSelect.value = preferred;
        }

        statusDiv.textContent =
            `${devices.length} camera(s) found`;

    } catch (err) {
        console.error(err);
        statusDiv.textContent =
            "Camera access failed.";
        statusDiv.className = "error";
    }
}

async function stopScanner() {
    try {
        if (currentControls) {
            currentControls.stop();
            currentControls = null;
        }
    } catch (err) {
        console.error(err);
    }
}

async function startScanner() {

    await stopScanner();

    const deviceId = cameraSelect.value;

    resultDiv.textContent =
        "Scanning for Code 39...";

    statusDiv.textContent =
        "Camera active";

    try {

        currentControls =
            await codeReader.decodeFromVideoDevice(
                deviceId,
                video,
                async (result, error) => {

                    if (result) {

                        const value =
                            result.getText().trim();

                        // STOP IMMEDIATELY AFTER FIRST SCAN
                        resultDiv.textContent = value;
                        resultDiv.className = "success";

                        statusDiv.textContent =
                            "Scan complete (camera stopped)";

                        console.log("Code39:", value);

                        try {
                            await stopScanner();
                        } catch (e) {
                            console.error(e);
                        }
                    }
                }
            );

    } catch (err) {
        console.error(err);
        statusDiv.textContent =
            "Failed to start scanner: " + err.message;
        statusDiv.className = "error";
    }
}

startBtn.addEventListener("click", startScanner);
stopBtn.addEventListener("click", stopScanner);

(async () => {

    try {

        statusDiv.textContent =
            "Requesting camera permission...";

        await navigator.mediaDevices.getUserMedia({
            video: {
                facingMode: "environment"
            }
        });

        await loadCameras();

        statusDiv.textContent =
            "Ready to scan";

    } catch (err) {

        console.error(err);

        statusDiv.textContent =
            "Camera permission denied";
        statusDiv.className = "error";
    }

})();
