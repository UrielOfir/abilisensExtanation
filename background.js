chrome.runtime.onInstalled.addListener(function () {
  window.open("index.html");

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

let allowRecord = true;
let decibelsThreshold;
if (localStorage.decibelsThreshold === undefined) decibelsThreshold = -25;
else decibelsThreshold= localStorage.decibelsThreshold;

chrome.runtime.onMessage.addListener(function (req) {
  if (req === "Recording allowed") run();
  if (req === "Allow record: true") allowRecord = true;
  if (req === "Allow record: false") allowRecord = false;
  if (req.match(/Decibels threshold:/) !== null) {
    decibelsThreshold = req.match(/-?\d+/g)[0];
    decibelsThreshold = parseInt(decibelsThreshold);
  }
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
  if (allowRecord) {
    let highDecibelsFound = false;
    setInterval (()=>{if (!highDecibelsFound) {
      highDecibelsFound = findHighDecibels(analyser);
      if (highDecibelsFound) record(audioRecorder);
    }},500);
    audioRecorder.onComplete = function (audioRecorder, blob) {
      fetchBlob(blob);
      processStream(analyser, audioRecorder);
    };
  } else setTimeout(() => processStream(analyser, audioRecorder), 500);
}

function createAnalyser(ctx) {
  const analyser = ctx.createAnalyser();
  analyser.fftSize = 2048;
  return analyser;
}

function findHighDecibels(analyser) {
  const dataArray = new Float32Array(analyser.frequencyBinCount);
  analyser.getFloatFrequencyData(dataArray);
  filter = dataArray.filter((threshold) => threshold > decibelsThreshold);
  if (filter.length > 0) return true;
  else return false;
}

function record(audioRecorder) {
  console.log("we record");
  audioRecorder.startRecording();
  setTimeout(() => {
    audioRecorder.finishRecording();
  }, 8 * 1000);
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
