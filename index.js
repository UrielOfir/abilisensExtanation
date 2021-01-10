if (navigator.mediaDevices) {
    if (navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices
            .getUserMedia({
                audio: true,
            })
            .then(() => {
                    if (!!localStorage.getItem("working")) {
                        chrome.runtime.sendMessage({action: "Allow record:", value: true});
                    }
                    window.close();
                }
            ).catch(function (err) {
            console.error("The following getUserMedia error occurred: " + err);
        })
    } else {
        console.error("getUserMedia not supported on your browser!");
    }
} else {
    console.error("getUserMedia not supported on your browser!");
}
