let btn = document.querySelector("#btn");
let decibelsRangeView = document.querySelector("#decibels");
let decibelsValueView = document.querySelector("#decibelsValue");
if (window.decibelsThreshold === undefined) decibelsRangeView.value = -25;
else decibelsRangeView.value = window.decibelsThreshold;
decibelsValueView.innerHTML = decibelsRangeView.value;

document.addEventListener("DOMContentLoaded", function () {
  btn.addEventListener("change", () => {
    chrome.runtime.sendMessage("Allow record: " + btn.checked);
  });
  decibelsRangeView.oninput = () => {
      window.decibelsThreshold = decibelsRangeView.value;
   decibelsValueView.innerHTML = decibelsRangeView.value;
    chrome.runtime.sendMessage(
      "Decibels threshold: " + decibelsRangeView.value
    );
  };
});
