document.querySelectorAll(".copy").forEach(function (b) {
  b.addEventListener("click", function () {
    var t = b.parentElement.querySelector("code").textContent;
    var done = function () { b.textContent = "คัดลอกแล้ว"; setTimeout(function () { b.textContent = "คัดลอก"; }, 1500); };
    if (navigator.clipboard) navigator.clipboard.writeText(t).then(done);
    else { var a = document.createElement("textarea"); a.value = t; document.body.appendChild(a); a.select(); document.execCommand("copy"); a.remove(); done(); }
  });
});
