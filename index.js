if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
  console.log("getUserMedia supported.");
  navigator.mediaDevices
    .getUserMedia({
      audio: true,
    })
    .then(function () {
      chrome.runtime.sendMessage("Recording allowed");
      window.close();
    })
    .catch(function (err) {
      console.error("The following getUserMedia error occured: " + err);
    });
} else {
  console.error("getUserMedia not supported on your browser!");
}
