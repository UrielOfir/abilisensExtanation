chrome.runtime.onInstalled.addListener(function () {
  window.open("index.html");
});

chrome.runtime.onMessage.addListener(
  function(req){
    if (req==="Recording allowed") startWorking(); 
  });

  function startWorking(){
    console.log("we are working")
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

    const mediaRecorder = new MediaRecorder(stream);
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
      };
    }

    findHighDecibels();
  })
  .catch(function (err) {
    console.log("The following getUserMedia error occured: " + err);
  });
    
  }



//Connection to API
// fetch('https://cors-anywhere.herokuapp.com/http://api.abilisense.com/predict',
//     { headers: {"X-AbiliSense-API-Key": "0479e58c-3258-11e8-b467-4d41j4-Uriel"}})
//   .then(response => {response.json();
//                       console.log("fetch running");
//   })
//   .then(data => console.log(data, response));
