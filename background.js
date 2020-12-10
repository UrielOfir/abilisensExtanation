chrome.runtime.onInstalled.addListener(function () {
  window.open("index.html");

  chrome.declarativeContent.onPageChanged.removeRules(undefined, function () {
    chrome.declarativeContent.onPageChanged.addRules([
      {
        conditions: [
          new chrome.declarativeContent.PageStateMatcher({
            pageUrl: { hostEquals: "developer.chrome.com" },
          }),
        ],
        actions: [new chrome.declarativeContent.ShowPageAction()],
      },
    ]);
  });
});

chrome.runtime.onMessage.addListener(function (req) {
  if ((req = "recordIsWorking")) {
    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then(function (stream) {
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorder.start();
        console.log(mediaRecorder.state);
        console.log("recorder started");
        finishRecord(mediaRecorder);

        function finishRecord(mediaRecorder) {
          let chunks = [];

          mediaRecorder.ondataavailable = function (e) {
            chunks.push(e.data);
          };

          setTimeout(() => {
            mediaRecorder.stop();
          }, 10 * 1000);

          mediaRecorder.onstop = function (e) {
            console.log("recorder stopped");
            const blob = new Blob(chunks, { type: "audio/ogg; codecs=opus" });
            chunks = [];
            const audioURL = window.URL.createObjectURL(blob);
            window.open(audioURL);
          };
        }
      });
  }
});
