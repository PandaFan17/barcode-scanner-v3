function onScanSuccess(decodedText, decodedResult) {
  document.getElementById("result").innerText = decodedText;

  // Optional: stop scanning after first result
  html5QrcodeScanner.clear();
}

function onScanFailure(error) {
  // You can ignore scan errors for cleaner UI
}

const html5QrcodeScanner = new Html5QrcodeScanner(
  "reader",
  { fps: 10, qrbox: 250 },
  false
);

html5QrcodeScanner.render(onScanSuccess, onScanFailure);
