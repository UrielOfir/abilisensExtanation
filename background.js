chrome.runtime.onInstalled.addListener(function () {
  window.open("index.html");

  let re = new RegExp("ab+c");
  chrome.declarativeContent.onPageChanged.removeRules(undefined, function () {
    chrome.declarativeContent.onPageChanged.addRules([
      {
        conditions: [
          new chrome.declarativeContent.PageStateMatcher({
            pageUrl: { urlContains: ":" },
          }),
        ],
        actions: [new chrome.declarativeContent.ShowPageAction()],
      },
    ]);
  });
});

chrome.runtime.onMessage.addListener(function (req) {
  if (req === "Recording allowed") startWorking();
});

function run() {
  const ctx = new AudioContext({
    sampleRate: 44100,
  });
  navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
    const source = ctx.createMediaStreamSource(stream);
    audioRecorder = new WebAudioRecorder(source, {
      workerDir: "/", // must end with slash
      numChannels: 1,
    });
    const analyser = createAnalyser(ctx);
    source.connect(analyser);
    processStream(analyser, audioRecorder);
  });
}

function processStream(analyser, audioRecorder) {
  if (findHighDecibels(analyser)) {
    console.log("higeDec");
    record(audioRecorder);
    audioRecorder.onComplete = function (audioRecorder, blob) {
      console.log(blob);
      fetchBlob(blob);
      processStream(analyser, audioRecorder);
    };
  }
  else{
    setTimeout(processStream(analyser, audioRecorder),200);
  }
}

function createAnalyser(ctx) {
  const analyser = ctx.createAnalyser();
  analyser.fftSize = 2048;
  return analyser;
}

function findHighDecibels(analyser) {
  const dataArray = new Float32Array(analyser.frequencyBinCount);
  analyser.getFloatFrequencyData(dataArray);
  filter = dataArray.filter((threshold) => threshold > -25);
  if (filter.length > 0) {
    return true;
  } else {
    return false;
  }
}

function record(audioRecorder) {
  console.log("we record");
  audioRecorder.startRecording();
  setTimeout(() => {
    audioRecorder.finishRecording();
  }, 5 * 1000);
}

function fetchBlob(blob) {
  console.log("fetch");
  const bodyB = new FormData();
  bodyB.append("audiofile", blob);
  bodyB.append("samplingrate", "44100");
  fetch("http://api.abilisense.com/v1/api/predict", {
    method: "POST",
    headers: {
      "X-Abilisense-Api-Key": "0479e58c-3258-11e8-b467-4d41j4-Uriel",
    },
    body: bodyB,
  })
    .then((resp) => resp.json())
    .then((r) => console.log(r));
}

///-----------------------

function startWorking() {
  navigator.mediaDevices
    .getUserMedia({ audio: true })
    .then(function (stream) {
      const ctx = new AudioContext({
        sampleRate: 44100,
      });

      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      source.connect(analyser);

      audioRecorder = new WebAudioRecorder(source, {
        workerDir: "/", // must end with slash
        numChannels: 1,
      });

      analyser.fftSize = 2048;
      let bufferLength = analyser.frequencyBinCount;
      window._dataArray = new Float32Array(bufferLength);

      findHighDecibels();

      function findHighDecibels() {
        analyser.getFloatFrequencyData(window._dataArray);
        let filter = window._dataArray.filter((threshold) => threshold > -100);
        if (filter.length > 0) {
          record();
          setTimeout(findHighDecibels, 9 * 1000);
        } else setTimeout(findHighDecibels, 0);
      }

      function record() {
        audioRecorder.startRecording();
        setTimeout(() => {
          audioRecorder.finishRecording();
        }, 8 * 1000);
        audioRecorder.onComplete = function (audioRecorder, blob) {
          console.log(blob);
          fetchBlob(blob);
        };
      }

      const fetchBlob = (blob) => {
        const bodyB = new FormData();
        bodyB.append("audiofile", blob);
        bodyB.append("samplingrate", "44100");
        fetch("http://api.abilisense.com/v1/api/predict", {
          method: "POST",
          headers: {
            "X-Abilisense-Api-Key": "0479e58c-3258-11e8-b467-4d41j4-Uriel",
          },
          body: bodyB,
        })
          .then((resp) => resp.json())
          .then((r) => console.log(r));
      };
    })
    .catch(function (err) {
      console.log("The following getUserMedia error occured: " + err);
    });
}
