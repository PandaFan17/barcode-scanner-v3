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

// Enable if your labels use Code 39 check digits.
// hints.set(
//     DecodeHintType.ASSUME_CODE_39_CHECK_DIGIT,
//     true
// );

const codeReader = new BrowserMultiFormatReader(hints);

const video = document.getElementById("video");
const cameraSelect = document.getElementById("cameraSelect");
const startBtn = document.getElementById("startBtn");
const stopBtn = document.getElementById("stopBtn");
const resultDiv = document.getElementById("result");
const statusDiv = document.getElementById("status");

let currentControls = null;
let lastScan = "";

function beep() {
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.frequency.value = 1200;

        osc.start();

        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(
            0.0001,
            ctx.currentTime + 0.1
        );

        osc.stop(ctx.currentTime + 0.1);
    } catch (e) {
        console.log("Beep unavailable");
    }
}

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

        let preferredCamera = null;

        devices.forEach((device, index) => {

            const option = document.createElement("option");

            option.value = device.deviceId;

            option.textContent =
                device.label ||
                `Camera ${index + 1}`;

            cameraSelect.appendChild(option);

            const label =
                (device.label || "").toLowerCase();

            if (
                label.includes("back") ||
                label.includes("rear") ||
                label.includes("environment")
            ) {
                preferredCamera = device.deviceId;
            }
        });

        if (preferredCamera) {
            cameraSelect.value = preferredCamera;
        }

        statusDiv.textContent =
            `${devices.length} camera(s) available`;
        statusDiv.className = "";

    } catch (err) {

        console.error(err);

        statusDiv.textContent =
            "Unable to enumerate cameras.";
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

    if (!deviceId) {
        statusDiv.textContent =
            "Select a camera first.";
        statusDiv.className = "error";
        return;
    }

    resultDiv.textContent =
        "Looking for Code 39 barcode...";

    statusDiv.textContent =
        "Scanner running";

    statusDiv.className = "";

    try {

        currentControls =
            await codeReader.decodeFromVideoDevice(
                deviceId,
                video,
                (result, error) => {

                    if (result) {

                        const value =
                            result.getText().trim();

                        if (value !== lastScan) {

                            lastScan = value;

                            resultDiv.textContent =
                                value;

                            resultDiv.className =
                                "success";

                            beep();

                            console.log(
                                "Code39:",
                                value
                            );
                        }
                    }
                }
            );

    } catch (err) {

        console.error(err);

        statusDiv.textContent =
            "Failed to start scanner: " +
            err.message;

        statusDiv.className = "error";
    }
}

startBtn.addEventListener(
    "click",
    startScanner
);

stopBtn.addEventListener(
    "click",
    stopScanner
);

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

        if (cameraSelect.options.length > 0) {
            await startScanner();
        }

    } catch (err) {

        console.error(err);

        statusDiv.textContent =
            "Camera permission denied.";
        statusDiv.className = "error";
    }

})();
