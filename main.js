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
          '</div><img src="' + esc(m.img) + '" alt="' + esc(m.name) + '"></div>' +
          '<div class="model-body"><div class="name">' + esc(m.name) + '</div>' +
          '<div class="meta">' + esc(m.meta) + '</div></div></a>';
      }).join("");
    }

    // Spec
    text("spec.eyebrow", c.spec.eyebrow);
    text("spec.title", c.spec.title);
    text("spec.stat1Label", c.spec.stat1Label);
    text("spec.stat2Label", c.spec.stat2Label);
    text("spec.stat2Value", c.spec.stat2Value);
    text("spec.imgCode", c.spec.imgCode);
    text("spec.imgTag", c.spec.imgTag);
    text("spec.callout1", c.spec.callout1);
    text("spec.callout2", c.spec.callout2);
    img("spec.img", c.spec.img);
    var stat1 = document.querySelector('[data-cms="spec.stat1Value"]');
    if (stat1) stat1.innerHTML = esc(c.spec.stat1Value) + " <small>" + esc(c.spec.stat1Unit) + "</small>";
    var rows = document.getElementById("specRows");
    if (rows && c.spec.rows) {
      rows.innerHTML = c.spec.rows.map(function (r) {
        return '<div class="spec-row"><span class="k">' + esc(r.k) + '</span>' +
          '<span class="v">' + esc(r.v) + (r.unit ? "<small>" + esc(r.unit) + "</small>" : "") + "</span></div>";
      }).join("");
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
  }

  fetch("content.json?v=" + Date.now())
    .then(function (r) { return r.ok ? r.json() : null; })
    .then(function (c) { if (c) apply(c); })
    .catch(function () { /* static fallback already rendered */ });
})();
