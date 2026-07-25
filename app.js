/* ==========================================================================
   iFixTech — app logic
   Requires catalog.js to be loaded first (it provides CATALOG, ISSUE_SETS
   and BRAND_IMAGES).

   Contains: the quote wizard, the hero launcher, the form fallback,
   the footer year, and scroll reveal. No pricing data lives here — every
   price comes straight out of a model's `repairs` object in catalog.js.
   ========================================================================== */

/* Screen repairs on phones can have up to three priced tiers. This is the
   display order + labelling for all three; a model that only has some of
   them priced (e.g. Samsung has no LCD tier) just shows fewer rows — see
   renderTiers(). Which tier is "recommended" and carries DisplayShield
   (our 1-year breakage warranty) depends on brand, not tier: iPhones get
   it on Soft OLED, every other phone brand gets it on OEM — see
   PHONE_SHIELD_TIER below. */
var FORMSPREE_ENDPOINT = "https://formspree.io/f/mjgnrpda";

/* Submits a form to Formspree over fetch instead of a full-page POST, so
   the page never navigates away and each form's own inline status message
   keeps working. `opts.subject` becomes the notification email subject;
   `opts.onSuccess` runs once Formspree confirms (used to disable fields). */
function submitToFormspree(form, msgEl, opts){
  opts = opts || {};
  var data = new FormData(form);
  if (opts.subject) data.append("_subject", opts.subject);

  msgEl.hidden = false;
  msgEl.style.display = "block";
  msgEl.textContent = "Sending…";

  fetch(FORMSPREE_ENDPOINT, {
    method: "POST",
    body: data,
    headers: { "Accept": "application/json" }
  }).then(function(res){
    if (res.ok){
      msgEl.textContent = opts.successText || "✓ Thanks, we'll be in touch shortly.";
      if (opts.onSuccess) opts.onSuccess();
      return;
    }
    return res.json().catch(function(){ return null; }).then(function(json){
      var detail = (json && json.errors && json.errors.length) ? json.errors.map(function(er){ return er.message; }).join(", ") : "Something went wrong.";
      msgEl.textContent = "✗ " + detail + " Please call us instead at (704) 293-4468.";
    });
  }).catch(function(){
    msgEl.textContent = "✗ Couldn't send that. Check your connection, or call us at (704) 293-4468.";
  });
}

var SCREEN_TIERS = [
  { key: "lcd",  label: "Aftermarket LCD" },
  { key: "oled", label: "Soft OLED" },
  { key: "oem",  label: "OEM / Genuine" }
];
var PHONE_SHIELD_TIER = { Apple: "oled", Samsung: "oem", Google: "oem", Motorola: "oem" };

function initWizard(root){
  if (!root) return null;

  var grid    = root.querySelector(".wiz-grid");
  var qEl     = root.querySelector(".wiz-q");
  var body    = root.querySelector(".wiz-body");
  var result  = root.querySelector(".wiz-result");
  var crumbs  = root.querySelector(".wiz-crumbs");
  var backBtn = root.querySelector(".wiz-back");
  var resetBtn= root.querySelector(".wiz-reset");
  var bar     = root.querySelector(".wiz-bar i");
  var resLeftTemplate = result.querySelector(".res-left").innerHTML;

  var pick = { category: null, brand: null, model: null, issue: null };
  var step = 0;                       /* 0 cat, 1 brand, 2 model, 3 issue, 4 result/other */

  /* ------------------------------------------------------------------
     PRICE FORMATTING — every value in a model's `repairs` object is a
     number (real price), the string "quote" (not priced yet), null
     (this repair isn't offered on this model at all) or some other
     string to show verbatim (e.g. "Up to $170").
     ------------------------------------------------------------------ */
  function priceText(v){
    if (typeof v === "number") return "$" + v;
    if (v === "quote") return "Call for quote";
    return v; /* verbatim string, e.g. "Up to $170" */
  }

  function lowestTierPrice(screen){
    var nums = SCREEN_TIERS.map(function(t){ return screen[t.key]; }).filter(function(v){ return typeof v === "number"; });
    return nums.length ? Math.min.apply(null, nums) : null;
  }

  /* True if the model offers this repair at all — i.e. at least one tier
     isn't null. A brand with every tier priced "quote" (nothing on file
     yet, e.g. Motorola) still counts as offered: it shows "Call for
     quote" rather than disappearing from the list. */
  function anyTierOffered(screen){
    return SCREEN_TIERS.some(function(t){ return screen[t.key] !== null && typeof screen[t.key] !== "undefined"; });
  }

  /* Renders a photo if one is supplied, otherwise the drawn illustration.
     If the photo 404s the illustration is swapped back in, so a missing
     file never shows a broken image on the live site. */
  function art(icon, img, alt, fit){
    var svg = '<svg viewBox="0 0 48 48" aria-hidden="true"><use href="#i-' + icon + '"/></svg>';
    if (!img) return svg;
    return '<img src="' + img + '" alt="' + alt + '" loading="lazy" decoding="async"' +
           (fit === "contain" ? ' class="fit-contain"' : '') +
           ' onerror="this.parentNode.innerHTML=' + "'" +
           svg.replace(/'/g, "&#39;") + "'" + '">';
  }

  function tile(opts){
    var b = document.createElement("button");
    b.type = "button";
    b.className = "tile";
    var inner = '';
    if (opts.img){
      inner += '<div class="tile-art' + (opts.fit === "contain" ? ' is-logo' : '') + '">' +
               art(opts.icon, opts.img, opts.name, opts.fit) + '</div>';
    } else if (opts.word){
      inner += '<div class="tile-art"><span class="tile-word">' + opts.word + '</span></div>';
    } else {
      inner += '<div class="tile-art">' + art(opts.icon, null, opts.name) + '</div>';
    }
    inner += '<div class="tile-name">' + opts.name + '</div>';
    if (opts.meta) inner += '<div class="tile-meta">' + opts.meta + '</div>';
    b.innerHTML = inner;
    b.onclick = opts.onClick;
    return b;
  }

  /* Long model lists (every iPhone/Galaxy/Pixel) render as a single
     dropdown instead of a wall of tiles — see step 2 in render(). */
  function modelDropdown(models, onPick){
    var wrap = document.createElement("div");
    wrap.className = "wiz-select-wrap";

    var label = document.createElement("label");
    label.className = "wiz-select-label";
    label.textContent = "Select your model";

    var select = document.createElement("select");
    select.className = "wiz-select";

    var placeholder = document.createElement("option");
    placeholder.value = "";
    placeholder.textContent = "Choose a model…";
    placeholder.disabled = true;
    placeholder.selected = true;
    select.appendChild(placeholder);

    models.forEach(function(m, i){
      var opt = document.createElement("option");
      opt.value = String(i);
      opt.textContent = m.n;
      select.appendChild(opt);
    });

    select.addEventListener("change", function(){
      if (select.value === "") return;
      onPick(models[parseInt(select.value, 10)]);
    });

    label.appendChild(select);
    wrap.appendChild(label);
    return wrap;
  }

  function chrome(){
    bar.style.width = (Math.min(step, 4) / 4 * 100) + "%";
    backBtn.hidden = (step === 0);
    resetBtn.hidden = (step === 0);

    crumbs.innerHTML = "";
    var trail = [];
    if (pick.category) trail.push({ label: pick.category, to: 1 });
    if (pick.brand)    trail.push({ label: pick.brand,    to: 2 });
    if (pick.model)    trail.push({ label: pick.model.n,  to: 3 });
    if (pick.issue)    trail.push({ label: pick.issue.n,  to: 4 });

    trail.forEach(function(c, idx){
      var li = document.createElement("li");
      var b = document.createElement("button");
      b.type = "button";
      b.textContent = c.label;
      b.onclick = function(){ goTo(idx); };
      li.appendChild(b);
      crumbs.appendChild(li);
    });
  }

  /* jump back to a given step, clearing everything after it */
  function goTo(n){
    if (n <= 0){ pick.category = null; }
    if (n <= 1){ pick.brand = null; }
    if (n <= 2){ pick.model = null; pick.forceOther = false; }
    if (n <= 3){ pick.issue = null; }
    step = n;
    render();
  }

  function render(){
    result.hidden = true;
    body.hidden = false;
    grid.innerHTML = "";

    if (step === 0){
      qEl.textContent = "What kind of device is it?";
      Object.keys(CATALOG).forEach(function(name){
        grid.appendChild(tile({
          name: name,
          icon: CATALOG[name].icon,
          img: CATALOG[name].img,
          onClick: function(){ pick.category = name; step = 1; render(); }
        }));
      });

    } else if (step === 1){
      qEl.textContent = "Who makes your " + pick.category.toLowerCase() + "?";
      var brands = CATALOG[pick.category].brands;
      Object.keys(brands).forEach(function(name){
        grid.appendChild(tile({
          name: name,
          img: BRAND_IMAGES[name],         /* falls back to a wordmark tile */
          fit: "contain",                  /* logos are fitted, never cropped */
          word: name,
          onClick: function(){ pick.brand = name; step = 2; render(); }
        }));
      });

    } else if (step === 2){
      qEl.textContent = "Which " + pick.brand + " model?";
      var models = CATALOG[pick.category].brands[pick.brand];
      var onPickModel = function(m){
        pick.model = m;
        if (m.isOther) { step = 4; render(); return; }
        step = 3; render();
      };
      /* Phones run 12-40 models per brand — a dropdown keeps the grid from
         turning into a wall of tiles. Every other category's model lists
         (and "Other brand"'s single not-sure-what-model fallback) are
         short enough that tiles still read fine. */
      if (pick.category === "Phone" && models.length > 1){
        grid.appendChild(modelDropdown(models, onPickModel));
      } else {
        models.forEach(function(m){
          grid.appendChild(tile({
            name: m.n,
            icon: CATALOG[pick.category].icon,
            img: m.img,
            onClick: function(){ onPickModel(m); }
          }));
        });
      }

    } else if (step === 3){
      qEl.textContent = "What's wrong with it?";
      var shown = 0;
      ISSUE_SETS[CATALOG[pick.category].issues].forEach(function(is){
        var val = pick.model.repairs[is.key];
        if (is.tiered){
          if (!anyTierOffered(val)) return; /* not offered on this model at all — hide it */
          var lo = lowestTierPrice(val);
          shown++;
          grid.appendChild(tile({
            name: is.n, icon: is.icon, meta: lo !== null ? "from $" + lo : "Call for quote",
            onClick: function(){ pick.issue = is; step = 4; render(); }
          }));
          return;
        }
        if (val === null) return; /* repair not offered on this model — hide it */
        shown++;
        grid.appendChild(tile({
          name: is.n, icon: is.icon, meta: priceText(val),
          onClick: function(){ pick.issue = is; step = 4; render(); }
        }));
      });
      if (!shown){
        /* Nothing priced or offered for this model at all — send to quote form. */
        step = 4; pick.forceOther = true; render();
      }

    } else {
      if (pick.model.isOther || pick.forceOther) { showOtherForm(); return; }
      showResult();
      return;
    }

    chrome();
  }

  function renderTiers(screen, shieldTierKey){
    var wrap = document.createElement("div");
    wrap.className = "res-tiers";
    SCREEN_TIERS.forEach(function(t){
      var val = screen[t.key];
      if (val === null || typeof val === "undefined") return; /* tier not offered on this model */
      var isShield = t.key === shieldTierKey;
      var sub = isShield ? "Recommended · DisplayShield: 1-Year Breakage Warranty"
              : (t.key === "oem" ? "Genuine part, ordered in" : "");
      var row = document.createElement("div");
      row.className = "res-tier" + (isShield ? " is-reco" : "");

      var label = document.createElement("div");
      label.className = "res-tier-label";
      label.innerHTML = t.label + (isShield ? '<span class="res-tier-tag">Recommended</span>' : '') +
        (sub ? '<span class="res-tier-sub">' + sub + '</span>' : '');

      var price = document.createElement("div");
      price.className = "res-tier-price" + (val === "quote" ? " is-quote" : "");
      price.textContent = priceText(val);

      row.appendChild(label);
      row.appendChild(price);
      wrap.appendChild(row);
    });
    return wrap;
  }

  function showResult(){
    body.hidden = true;
    result.hidden = false;

    var resLeft = result.querySelector(".res-left");
    resLeft.innerHTML = resLeftTemplate; /* undo any earlier showOtherForm() markup */
    var priceEl = result.querySelector(".res-price");

    var isTiered = !!pick.issue.tiered;
    priceEl.hidden = isTiered;
    if (isTiered){
      var shieldTierKey = PHONE_SHIELD_TIER[pick.brand] || "oem";
      priceEl.parentNode.insertBefore(renderTiers(pick.model.repairs[pick.issue.key], shieldTierKey), priceEl.nextSibling);
    } else {
      priceEl.textContent = priceText(pick.model.repairs[pick.issue.key]);
    }

    result.querySelector(".res-sum").innerHTML =
      "<b>" + pick.model.n + "</b> · " + pick.issue.n.toLowerCase() +
      ". Most repairs like this are done the same day.";

    /* Tiered phone screens show their own DisplayShield badge per-row
       above; this generic panel is only for tablets (single-price "lcd"
       repairs), which the price list marks as 1-year-warranty-covered
       outright with no tier choice involved. */
    var isScreen = pick.issue.key === "lcd";
    result.querySelector(".res-shield").hidden = !isScreen;

    result.querySelector(".res-art").innerHTML =
      art(CATALOG[pick.category].icon, pick.model.img, pick.model.n);

    chrome();
  }

  /* ------------------------------------------------------------------
     "Not sure / other" fallback — used whenever a brand/model has no
     real catalog entry, or a model turns out to have nothing priced or
     offered at all. Renders a small lead-capture form in place of a price.
     ------------------------------------------------------------------ */
  function showOtherForm(){
    body.hidden = true;
    result.hidden = false;

    var resLeft = result.querySelector(".res-left");
    resLeft.innerHTML =
      '<div class="res-cap">Let’s get you a real quote</div>' +
      '<p class="res-sum">We couldn’t find an exact price on file for this. Tell us a bit more and we’ll follow up with a firm quote.</p>';

    var parts = [];
    if (pick.category) parts.push(pick.category);
    if (pick.brand) parts.push(pick.brand);
    if (pick.model && !pick.model.isOther) parts.push(pick.model.n);
    var deviceGuess = parts.join(" ");

    var form = document.createElement("form");
    form.className = "wiz-otherform";
    form.action = FORMSPREE_ENDPOINT;
    form.method = "POST";
    form.noValidate = true;
    form.innerHTML =
      '<label>Your name<input type="text" name="name" required autocomplete="name"></label>' +
      '<label>Phone number<input type="tel" name="phone" required autocomplete="tel"></label>' +
      '<label>Device description<input type="text" name="device" value="' + deviceGuess.replace(/"/g, "&quot;") + '"></label>' +
      '<label>What’s wrong with it?<textarea name="issue" rows="3"></textarea></label>' +
      '<button type="submit" class="btn btn-primary">Send my quote request</button>' +
      '<p class="wiz-other-msg" role="status" hidden></p>';

    form.addEventListener("submit", function(e){
      e.preventDefault();
      var msg = form.querySelector(".wiz-other-msg");
      var fields = form.querySelectorAll("input, textarea, button[type=submit]");
      submitToFormspree(form, msg, {
        subject: "New custom quote request: " + (deviceGuess || pick.category || "device"),
        successText: "✓ Thanks, we'll follow up shortly.",
        onSuccess: function(){ for (var i = 0; i < fields.length; i++) fields[i].disabled = true; }
      });
    });

    resLeft.appendChild(form);

    result.querySelector(".res-art").innerHTML = pick.category ? art(CATALOG[pick.category].icon, null, pick.category) : "";
    result.querySelector(".res-right .btn-primary").setAttribute("href", "#quote");

    chrome();
  }

  backBtn.onclick = function(){ goTo(Math.max(0, step - 1)); };
  resetBtn.onclick = function(){ goTo(0); };

  render();

  return {
    /* used by the hero launcher tiles */
    start: function(category){
      goTo(0);
      if (CATALOG[category]){ pick.category = category; step = 1; render(); }
      root.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };
}

var wizard = initWizard(document.getElementById("wizard"));

/* hero launcher tiles jump straight into the wizard */
var jumps = document.querySelectorAll("[data-jump]");
for (var j = 0; j < jumps.length; j++){
  (function(btn){
    btn.onclick = function(){ if (wizard) wizard.start(btn.getAttribute("data-jump")); };
  })(jumps[j]);
}

/* -------- quote form: submits to Formspree over fetch -------- */
/* The form is bound here rather than with an inline onsubmit attribute,
   so all behaviour lives in this file. The <form> keeps a real
   action/method (see index.html) as a plain-HTML-POST fallback in case
   JavaScript fails to load. */
function handleQuote(e){
  e.preventDefault();
  var form = e.target;
  var msg = document.getElementById("formMsg");
  var fields = form.querySelectorAll("input, textarea, button[type=submit]");
  submitToFormspree(form, msg, {
    subject: "New quote request from iFixTech website",
    successText: "✓ Thanks, we'll reply with a firm price and the next available slot.",
    onSuccess: function(){ for (var i = 0; i < fields.length; i++) fields[i].disabled = true; }
  });
  return false;
}

var quoteForm = document.getElementById("quoteForm");
if (quoteForm) quoteForm.addEventListener("submit", handleQuote);

document.getElementById("yr").textContent = new Date().getFullYear();

var io = new IntersectionObserver(function(entries){
  entries.forEach(function(en){
    if (en.isIntersecting){ en.target.classList.add("in"); io.unobserve(en.target); }
  });
}, { threshold: 0.12 });
var rv = document.querySelectorAll(".reveal");
for (var k = 0; k < rv.length; k++) io.observe(rv[k]);
