// L7 iHOME — marketing site behaviour
(function () {
  // Mobile nav toggle
  var header = document.getElementById("siteHeader");
  var toggle = document.getElementById("navToggle");
  if (toggle && header) {
    toggle.addEventListener("click", function () {
      header.classList.toggle("open");
    });
    header.querySelectorAll(".mainnav a").forEach(function (a) {
      a.addEventListener("click", function () { header.classList.remove("open"); });
    });
  }
})();
