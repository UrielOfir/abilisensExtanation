let btn = document.querySelector("#btn");
btn.checked = !!localStorage.getItem("working");

btn.checked ? chrome.browserAction.setIcon({path: "images/abiIcon.png"}) : chrome.browserAction.setIcon({path: "images/abiIconGray.png"});

let meter = document.querySelector("meter");
meter.value = -100;

chrome.runtime.onMessage.addListener(function (req) {
    if (req.match(/Current decibels:/) !== null) {
        if (btn.checked) {
            meter.value = req.match(/-?\d+/g)[0];
        }
    }
});

let decibelsRangeView = document.querySelector("#decibels");
let decibelsValueView = document.querySelector("#decibelsValue");
if (localStorage.getItem("decibelsThreshold") === null) {
    decibelsRangeView.value = -25;
} else {
    decibelsRangeView.value = localStorage.getItem("decibelsThreshold");
}
decibelsValueView.innerHTML = decibelsRangeView.value;

document.addEventListener("DOMContentLoaded", function () {
    btn.addEventListener("change", () => {
        chrome.runtime.sendMessage({
            action: "Allow record?",
            value: btn.checked
        });
        if (btn.checked) {
            chrome.browserAction.setIcon({path: "images/abiIcon.png"});
        } else {
            chrome.browserAction.setIcon({path: "images/abiIconGray.png"});
            meter.value = -100;
        }
    });
    decibelsRangeView.oninput = () => {
        localStorage.setItem("decibelsThreshold", decibelsRangeView.value)
        decibelsValueView.innerHTML = decibelsRangeView.value;
        chrome.runtime.sendMessage({
            action: "Decibels threshold:",
            value: decibelsRangeView.value
        });
    };
});
