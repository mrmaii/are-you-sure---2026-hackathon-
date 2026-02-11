(function () {
  var sidebar = document.getElementById("sidebar");
  var backdrop = document.getElementById("sidebar-backdrop");
  var toggle = document.getElementById("sidebar-toggle");
  var closeBtn = document.getElementById("sidebar-close");
  if (!sidebar || !backdrop || !toggle) return;

  function openSidebar() {
    sidebar.classList.add("open");
    backdrop.classList.add("open");
    if (toggle) toggle.classList.add("sidebar-toggle-hidden");
  }
  function closeSidebar() {
    sidebar.classList.remove("open");
    backdrop.classList.remove("open");
    if (toggle) toggle.classList.remove("sidebar-toggle-hidden");
  }

  toggle.addEventListener("click", openSidebar);
  if (closeBtn) closeBtn.addEventListener("click", closeSidebar);
  backdrop.addEventListener("click", closeSidebar);

  document.querySelectorAll(".mode-option[data-mode]").forEach(function (el) {
    el.addEventListener("click", function () {
      var mode = el.getAttribute("data-mode");
      if (mode === "hackathon") {
        document.body.classList.add("theme-hackathon");
        document.querySelectorAll(".mode-option[data-mode]").forEach(function (o) {
          o.classList.remove("bg-[#4285F4]/10", "border", "border-[#4285F4]/20");
          o.classList.add("disabled");
          var last = o.querySelector("span:last-child");
          if (last) last.textContent = "";
        });
        el.classList.remove("disabled");
        el.classList.add("bg-[#4285F4]/10", "border", "border-[#4285F4]/20");
        var label = el.querySelector("span:last-child");
        if (label) label.textContent = "当前";
        try {
          localStorage.setItem("app_mode", "hackathon");
        } catch (e) {}
        return;
      }
      if (el.classList.contains("disabled")) {
        if (window.showToast) window.showToast("该模式即将推出，敬请期待。", "blue");
      }
    });
  });

  (function applyThemeFromMode() {
    var mode = "light";
    try {
      var storedMode = localStorage.getItem("app_mode");
      if (storedMode === "hackathon") {
        mode = "hackathon";
      } else {
        localStorage.setItem("app_mode", "light");
      }
    } catch (e) {
      mode = "light";
    }
    if (mode === "hackathon") {
      document.body.classList.add("theme-hackathon");
    } else {
      document.body.classList.remove("theme-hackathon");
    }
  })();
})();

(function () {
  var cursor = document.getElementById("glass-cursor");
  if (!cursor) return;

  var mouseX = 0;
  var mouseY = 0;
  var cursorX = 0;
  var cursorY = 0;
  var delay = 0.15;

  document.addEventListener("mousemove", function (e) {
    mouseX = e.clientX;
    mouseY = e.clientY;
  });

  function animate() {
    cursorX += (mouseX - cursorX) * delay;
    cursorY += (mouseY - cursorY) * delay;
    var halfW = cursor.offsetWidth / 2;
    var halfH = cursor.offsetHeight / 2;
    cursor.style.transform = "translate3d(" + (cursorX - halfW) + "px, " + (cursorY - halfH) + "px, 0)";
    requestAnimationFrame(animate);
  }
  animate();
})();
