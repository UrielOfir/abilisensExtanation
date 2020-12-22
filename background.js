chrome.runtime.onInstalled.addListener(function () {
  window.open("index.html");
});

chrome.runtime.onMessage.addListener(function (req) {
  if (req === "Recording allowed") startWorking();
});

function startWorking() {
  navigator.mediaDevices
    .getUserMedia({ audio: true })
    .then(function (stream) {
      const ctx = new AudioContext();

      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      const destination = ctx.createMediaStreamDestination();

      source.connect(analyser);

      analyser.fftSize = 2048;
      let bufferLength = analyser.frequencyBinCount;
      window._dataArray = new Float32Array(bufferLength);

      function findHighDecibels() {
        d = new Date();
        analyser.getFloatFrequencyData(window._dataArray);
        let filter = window._dataArray.filter((threshold) => threshold > -25);
        if (filter.length > 0) {
          console.log("high decibels at ", d);
          record();
          setTimeout(findHighDecibels, 15 * 1000);
        } else setTimeout(findHighDecibels, 0);
      }

      const mediaRecorder = new MediaRecorder(stream, {
        type: "audio/wav; codecs=MS_PCM",
        audioBitsPerSecond : 16000
      });
      console.dir(mediaRecorder)
      // is it good that the media recorder is working with the original stream?
      function record() {
        mediaRecorder.start();
        console.log(mediaRecorder.state, mediaRecorder.mimeType);
        let chunks = [];
        mediaRecorder.ondataavailable = function (e) {
          chunks.push(e.data);
        };

        setTimeout(() => {
          mediaRecorder.stop();
        }, 10 * 1000);

        mediaRecorder.onstop = function (e) {
          console.log(mediaRecorder.state);
          const blob = new Blob(chunks, { type: "audio/wav; codecs=MS_PCM" });
          chunks = [];
          const audioURL = window.URL.createObjectURL(blob);
          window.open(audioURL);

          const body = new FormData();
          body.append("audiofile", audioURL + ";type=audio/wav");
          body.append("samplingrate", "44100");

          fetch("http://api.abilisense.com/v1/api/predict", {
            body,
            headers: {
              Accept: "application/json",
              "Content-Type": "multipart/form-data",
              "X-Abilisense-Api-Key": "0479e58c-3258-11e8-b467-4d41j4-Uriel",
            },
            method: "POST",
            mode: 'no-cors',
          }).then((response) => console.log(response));


        //   Access to fetch at 'http://api.abilisense.com/v1/api/predict' from origin 'chrome-extension://edmkodepdbnhipjlkjnheofidkjnloja' has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present on the requested resource. If an opaque response serves your needs, 
        //   set the request's mode to 'no-cors' to fetch the resource with CORS disabled.
        };
      }

      findHighDecibels();
    })
    .catch(function (err) {
      console.log("The following getUserMedia error occured: " + err);
    });
}

// curl -X POST "http://api.abilisense.com/v1/api/predict"
// -H "accept: application/json"
// -H "X-AbiliSense-API-Key: 0479e58c-3258-11e8-b467-4d41j4-Uriel"
// -H "content-type: multipart/form-data"
// -F "audiofile=@178a4397-37fe-4640-8726-173f04dbccdb.wav;type=audio/wav"
// -F "samplingrate=44100"

//Connection to API
