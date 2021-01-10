chrome.runtime.onInstalled.addListener(function () {
    window.open("index.html");

    chrome.declarativeContent.onPageChanged.removeRules(undefined, function () {
        chrome.declarativeContent.onPageChanged.addRules([
            {
                conditions: [
                    new chrome.declarativeContent.PageStateMatcher({
                        pageUrl: {urlContains: ":"},
                    }),
                ],
                actions: [new chrome.declarativeContent.ShowPageAction()],
            },
        ]);
    });
});

let allowRecord = !!localStorage.getItem("working");
let decibelsThreshold;
if (localStorage.getItem("decibelsThreshold") === null) decibelsThreshold = -25;
else decibelsThreshold = localStorage.getItem("decibelsThreshold");

chrome.runtime.onMessage.addListener(function (req) {
    if (req.action === "Allow record?") {
        allowRecord = req.value;
        if (req.value) {

            localStorage.setItem("working", "true");
            run();
        } else {
            localStorage.removeItem("working");
        }
    }
    if (req.action === "Decibels threshold:") {
        decibelsThreshold = req.value;
    }
});

function run() {
    console.log("we run");
    const ctx = new AudioContext({
        sampleRate: 44100,
    });
    navigator.mediaDevices.getUserMedia({audio: true}).then((stream) => {
        const source = ctx.createMediaStreamSource(stream);
        let audioRecorder = new WebAudioRecorder(source, {
            workerDir: "/", // must end with slash
            numChannels: 1,
        });
        const analyser = createAnalyser(ctx);
        source.connect(analyser);

        chrome.runtime.onMessage.addListener(req => {
            if (req.action === "Allow record?" && req.value === false) {
                stream.getTracks().forEach(function (track) {
                    track.stop();
                });
                audioRecorder.onComplete = () => {
                };
            }

        });
        currentDecibels.runAnalyser(analyser);

        processStream(currentDecibels, audioRecorder, stream);
    })
}

const currentDecibels = {
    value: 0,
    runAnalyser: function (analyser) {
        const dataArray = new Float32Array(analyser.frequencyBinCount);
        const checkIntervals = setInterval(() => {
            analyser.getFloatFrequencyData(dataArray);
            let indexOfMaxValue = dataArray.reduce((iMax, x, i, arr) => x > arr[iMax] ? i : iMax, 0);
            this.value = dataArray[indexOfMaxValue];
            chrome.runtime.sendMessage("Current decibels: " + currentDecibels.value);
            if (!allowRecord) {
                clearInterval(checkIntervals);
            }
        }, 100)
    }
}

function processStream(currentDecibels, audioRecorder, stream) {
    findHighDecibels(currentDecibels).then(() => {
        record(currentDecibels, audioRecorder);
    });
    audioRecorder.onComplete = function (audioRecorder, blob) {
        fetchBlob(blob).then((response) => {
            if (typeof response !== "object") {
                alert(response);
            }
        }).then(() => processStream(currentDecibels, audioRecorder, stream));
    }


}

function createAnalyser(ctx) {
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 2048;
    return analyser;
}


const findHighDecibels = function (currentDecibels) {

    return new Promise((resolve) => {
        const checkIntervals = setInterval(() => {
            if (currentDecibels.value > decibelsThreshold) {
                clearInterval(checkIntervals);
                resolve(true);
            }
        }, 500)
    })
}

const findLowDecibels = function (currentDecibels) {
    return new Promise((resolve) => {
        const checkIntervals = setInterval(() => {
            if (currentDecibels.value < decibelsThreshold || !allowRecord) {
                clearInterval(checkIntervals);
                resolve(currentDecibels);
            }
        }, 500);
        setTimeout(() => {
            clearInterval(checkIntervals);
            resolve(true);
        }, 7 * 1000);
    })
}

function record(currentDecibels, audioRecorder) {
    console.log("we record " + new Date);
    audioRecorder.startRecording();
    findLowDecibels(currentDecibels).then(() => {
        setTimeout(() => {
            audioRecorder.finishRecording();
        }, 1000)
    });
}

function fetchBlob(blob) {
    console.log("fetch " + new Date);
    const bodyB = new FormData();
    bodyB.append("audiofile", blob);
    bodyB.append("samplingrate", "44100");
    return fetch("http://api.abilisense.com/v1/api/predict", {
        method: "POST",
        headers: {
            "X-Abilisense-Api-Key": "0479e58c-3258-11e8-b467-4d41j4-Uriel",
        },
        body: bodyB,
    })
        .then((resp) =>
            resp.json())
}
