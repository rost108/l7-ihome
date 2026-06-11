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

  // ---- CMS: content.json overrides the static markup ----
  // The HTML ships with the same content as a fallback, so the page
  // works (and stays indexable) even if the fetch fails.

  function text(sel, value) {
    var el = document.querySelector('[data-cms="' + sel + '"]');
    if (el && value != null) el.textContent = value;
  }
  function img(sel, value) {
    var el = document.querySelector('[data-cms-img="' + sel + '"]');
    if (el && value) el.src = value;
  }

  var ICONS = {
    spark: '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9L12 3Z"/><path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8L19 15Z"/></svg>',
    layers: '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2 2 7l10 5 10-5-10-5Z"/><path d="M2 12l10 5 10-5"/><path d="M2 17l10 5 10-5"/></svg>',
    bolt: '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2 3 14h9l-1 8 10-12h-9l1-8Z"/></svg>',
    building: '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M6 22V4a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v18"/><path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"/><path d="M16 22h2a2 2 0 0 0 2-2v-9a2 2 0 0 0-2-2h-2"/><path d="M9 6h2M9 10h2M9 14h2"/></svg>'
  };

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }

  function apply(c) {
    // Hero
    text("hero.badge", c.hero.badge);
    text("hero.title1", c.hero.title1);
    text("hero.title2", c.hero.title2);
    text("hero.lead", c.hero.lead);
    text("hero.phone", c.hero.phone);
    text("hero.site", c.hero.site);
    text("hero.imgCode", c.hero.imgCode);
    text("hero.imgTag", c.hero.imgTag);
    text("hero.callout1", c.hero.callout1);
    text("hero.callout2", c.hero.callout2);
    img("hero.img", c.hero.img);
    text("nav.phone", c.hero.phone);

    // Models
    text("models.eyebrow", c.models.eyebrow);
    text("models.title", c.models.title);
    var grid = document.getElementById("modelsGrid");
    if (grid && c.models.items) {
      grid.innerHTML = c.models.items.map(function (m) {
        return '<a class="model-card" href="model.html?id=' + encodeURIComponent(m.slug || "") + '">' +
          '<div class="model-figure"><div class="badges">' +
          '<span class="badge badge--ink">' + esc(m.code) + '</span>' +
          (m.tag ? '<span class="badge badge--brand">' + esc(m.tag) + '</span>' : '') +
          '</div><img loading="lazy" decoding="async" src="' + esc(m.img) + '" alt="' + esc(m.name) + '"></div>' +
          '<div class="model-body"><div class="name">' + esc(m.name) + '</div>' +
          '<div class="meta">' + esc(m.meta) + '</div></div></a>';
      }).join("");
    }

    // Spec — slider over all models
    text("spec.eyebrow", c.spec.eyebrow);
    var slider = document.getElementById("specSlider");
    if (slider && c.models.items && c.models.items.length) {
      slider.innerHTML = c.models.items.map(function (m) {
        return '<div class="spec-slide">' +
          '<div class="spec-visual">' +
          '<div class="badges"><span class="badge badge--ink">' + esc(m.code) + "</span>" +
          (m.tag ? '<span class="badge badge--brand">' + esc(m.tag) + "</span>" : "") +
          '</div><img loading="lazy" decoding="async" src="' + esc(m.img) + '" alt="' + esc(m.name) + '">' +
          (m.callout1 ? '<span class="callout callout--glass">' + esc(m.callout1) + "</span>" : "") +
          (m.callout2 ? '<span class="callout callout--alloy">' + esc(m.callout2) + "</span>" : "") +
          "</div>" +
          '<div class="spec-facts">' +
          "<h2>" + esc(m.name) + "</h2>" +
          '<div class="stat-tiles">' +
          '<div class="stat-tile"><span class="eyebrow">' + esc(m.stat1Label || "Корисна площа") + '</span><div class="val">' +
          esc(m.stat1Value || "") + (m.stat1Unit ? " <small>" + esc(m.stat1Unit) + "</small>" : "") + "</div></div>" +
          '<div class="stat-tile"><span class="eyebrow">' + esc(m.stat2Label || "Гостей") + '</span><div class="val">' + esc(m.stat2Value || "") + "</div></div>" +
          "</div>" +
          "<div>" + (m.rows || []).map(function (r) {
            return '<div class="spec-row"><span class="k">' + esc(r.k) + '</span>' +
              '<span class="v">' + esc(r.v) + (r.unit ? "<small>" + esc(r.unit) + "</small>" : "") + "</span></div>";
          }).join("") + "</div>" +
          '<a class="btn btn--ghost btn--sm spec-more" href="model.html?id=' + encodeURIComponent(m.slug || "") + '">Детальніше про ' + esc(m.name) + " →</a>" +
          "</div></div>";
      }).join("");
      initSpecSlider(c.models.items.length);
    }

    // Statement
    text("statement.eyebrow", c.statement.eyebrow);
    text("statement.text", c.statement.text);
    img("statement.img", c.statement.img);

    // Business
    text("business.eyebrow", c.business.eyebrow);
    text("business.title", c.business.title);
    var adv = document.getElementById("advGrid");
    if (adv && c.business.items) {
      adv.innerHTML = c.business.items.map(function (b) {
        return '<div class="adv"><div class="ic">' + (ICONS[b.icon] || ICONS.spark) + "</div>" +
          "<div><h3>" + esc(b.title) + "</h3><p>" + esc(b.text) + "</p></div></div>";
      }).join("");
    }

    // Contact
    text("contact.eyebrow", c.contact.eyebrow);
    text("contact.title1", c.contact.title1);
    text("contact.title2", c.contact.title2);
    text("contact.phone", c.contact.phone);
    text("contact.site", c.contact.site);
    var tel = document.getElementById("contactTel");
    if (tel && c.contact.phone) tel.href = "tel:" + c.contact.phone.replace(/[^+\d]/g, "");
    var foot = document.querySelector('[data-cms="footer.phone"]');
    if (foot && c.contact.phone) foot.textContent = "© " + new Date().getFullYear() + " L7 iHOME · " + c.contact.phone;

    // fill model select in the lead form
    var sel = document.getElementById("leadModel");
    if (sel && c.models && c.models.items) {
      c.models.items.forEach(function (m) {
        var o = document.createElement("option");
        o.value = m.name; o.textContent = m.name + (m.meta ? " (" + m.meta + ")" : "");
        sel.appendChild(o);
      });
      var pre = new URLSearchParams(location.search).get("model");
      if (pre) sel.value = pre;
    }

    initLeadForm((c.settings && c.settings.web3formsKey) || "");
    initAnalytics((c.settings && c.settings.gaId) || "");
  }

  // ---- lead form → Web3Forms (заявки приходять на email) ----
  var leadInited = false;
  function initLeadForm(key) {
    var form = document.getElementById("leadForm");
    var done = document.getElementById("leadDone");
    var note = document.getElementById("leadNote");
    if (!form || leadInited) return;
    leadInited = true;

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var name = form.name.value.trim();
      var phone = form.phone.value.trim();
      note.classList.remove("err");

      if (!name) { note.textContent = "Вкажіть, будь ласка, ваше ім’я."; note.classList.add("err"); form.name.focus(); return; }
      if (phone.replace(/[^\d]/g, "").length < 9) { note.textContent = "Вкажіть коректний номер телефону."; note.classList.add("err"); form.phone.focus(); return; }

      var btn = form.querySelector(".lead-submit");
      btn.disabled = true; btn.textContent = "Надсилаємо…";

      if (!key) {
        // Ключ форми ще не налаштовано в адмінці — не втрачаємо заявку
        console.warn("L7: web3formsKey не налаштовано в content.json → settings.web3formsKey");
        showDone();
        return;
      }

      var payload = {
        access_key: key,
        subject: "Нова заявка з сайту L7 iHOME",
        from_name: "L7 iHOME — сайт",
        "Ім’я": name,
        "Телефон": phone,
        "Модель": form.model.value || "—",
        "Коментар": form.message.value.trim() || "—"
      };

      fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(payload)
      })
        .then(function (r) { return r.json(); })
        .then(function (res) {
          if (res.success) {
            if (window.gtag) window.gtag("event", "generate_lead", { model: form.model.value || "" });
            showDone();
          } else { throw new Error(res.message || "fail"); }
        })
        .catch(function () {
          note.textContent = "Не вдалося надіслати. Зателефонуйте нам або спробуйте ще раз.";
          note.classList.add("err");
          btn.disabled = false; btn.textContent = "Залишити заявку →";
        });

      function showDone() { form.hidden = true; done.hidden = false; }
    });
  }

  // ---- Google Analytics (GA4) — підключається лише якщо вказано ID ----
  var gaInited = false;
  function initAnalytics(id) {
    if (!id || gaInited || !/^G-/.test(id)) return;
    gaInited = true;
    var s = document.createElement("script");
    s.async = true;
    s.src = "https://www.googletagmanager.com/gtag/js?id=" + encodeURIComponent(id);
    document.head.appendChild(s);
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag("js", new Date());
    window.gtag("config", id);
  }

  // ---- hero: обертовий подіум 360 (з дизайну "Капсула 360°") ----
  (function () {
    var podiumEl = document.getElementById("heroPodium");
    var playBtn = document.getElementById("heroPlay");
    if (!podiumEl || !playBtn) return;

    var reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    var ICON_PAUSE = '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/></svg>';
    var ICON_PLAY = '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M7 4l13 8-13 8V4z"/></svg>';

    var playing = true;
    try { playing = localStorage.getItem("l7_turntable_playing") !== "0"; } catch (e) {}
    if (reduce) playing = false;

    var last = performance.now();
    var angle = 0;
    var SPEED = 26; // deg/sec

    function render(now) {
      var dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (playing) angle = (angle + dt * SPEED) % 360;
      podiumEl.style.setProperty("--spin", angle.toFixed(2) + "deg");
      requestAnimationFrame(render);
    }

    function setPlaying(v) {
      playing = v;
      playBtn.innerHTML = v ? ICON_PAUSE : ICON_PLAY;
      playBtn.setAttribute("aria-label", v ? "Пауза" : "Відтворити");
      try { localStorage.setItem("l7_turntable_playing", v ? "1" : "0"); } catch (e) {}
    }
    playBtn.addEventListener("click", function () { setPlaying(!playing); });

    setPlaying(playing);
    if (!reduce) requestAnimationFrame(function (t) { last = t; render(t); });
  })();

  // ---- spec slider: native scroll-snap + arrows + dots ----
  function initSpecSlider(count) {
    var slider = document.getElementById("specSlider");
    var dots = document.getElementById("specDots");
    var prev = document.getElementById("specPrev");
    var next = document.getElementById("specNext");
    if (!slider || !dots) return;

    dots.innerHTML = "";
    for (var i = 0; i < count; i++) {
      var b = document.createElement("button");
      b.type = "button";
      b.setAttribute("aria-label", "Модель " + (i + 1));
      if (i === 0) b.className = "active";
      (function (idx) {
        b.addEventListener("click", function () {
          slider.scrollTo({ left: idx * slider.clientWidth, behavior: "smooth" });
        });
      })(i);
      dots.appendChild(b);
    }

    function current() {
      return Math.round(slider.scrollLeft / slider.clientWidth);
    }
    function go(delta) {
      var idx = Math.max(0, Math.min(count - 1, current() + delta));
      slider.scrollTo({ left: idx * slider.clientWidth, behavior: "smooth" });
    }
    if (prev) prev.onclick = function () { go(-1); };
    if (next) next.onclick = function () { go(1); };

    var ticking = false;
    slider.addEventListener("scroll", function () {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () {
        ticking = false;
        var idx = current();
        var all = dots.querySelectorAll("button");
        for (var j = 0; j < all.length; j++) all[j].classList.toggle("active", j === idx);
      });
    });
  }

  fetch("content.json?v=" + Date.now())
    .then(function (r) { return r.ok ? r.json() : null; })
    .then(function (c) { if (c) apply(c); })
    .catch(function () { /* static fallback already rendered */ });
})();
