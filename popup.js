let btn = document.querySelector("#btn");
btn.checked = localStorage.working === undefined ? true : localStorage.working;

let decibelsRangeView = document.querySelector("#decibels");
let decibelsValueView = document.querySelector("#decibelsValue");
if (localStorage.decibelsThreshold === undefined) decibelsRangeView.value = -25;
else decibelsRangeView.value = localStorage.decibelsThreshold;
decibelsValueView.innerHTML = decibelsRangeView.value;

document.addEventListener("DOMContentLoaded", function () {
    btn.addEventListener("change", () => {
        chrome.runtime.sendMessage("Allow record: " + btn.checked);
        localStorage.working = btn.checked;
    });
    decibelsRangeView.oninput = () => {
        localStorage.decibelsThreshold = decibelsRangeView.value;
        decibelsValueView.innerHTML = decibelsRangeView.value;
        chrome.runtime.sendMessage(
            "Decibels threshold: " + decibelsRangeView.value
        );
    };
});
