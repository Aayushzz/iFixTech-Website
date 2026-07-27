/* ==========================================================================
   iFixTech — repair price estimator
   Fully independent of catalog.js / app.js: this file owns its own data,
   its own state, and builds its own markup into the #estimator div that
   sits inside the hero's "Start your quote" card (the .device box) — see
   index.html. Nothing scrolls: the flow plays out in that one card, in
   place. Nothing here reads or writes styles.css, catalog.js or app.js,
   and it never touches localStorage — all state lives in one object
   (`state`) for the lifetime of the page.

   Every class name here is prefixed `ifxest-` (not just `est-`) because
   styles.css already has unrelated, unused leftover rules named `.est`,
   `.est-form`, `.est-price`, `.est-note` and `.est-result` from an earlier
   draft of the site. Reusing that prefix would silently inherit those
   dead styles, so this file avoids it entirely rather than touching
   styles.css.

   PRICING — real lookup, not a formula
     Every model has a `repairs` object keyed by repair type, sourced from
     "Price List.xlsx". Each value is one of:
       a number  -> shown as "$123"
       "quote"   -> shown as "Call for quote" (not priced yet)
       null      -> this repair isn't offered on this model at all, so the
                    option is left out of the list entirely (e.g. Samsung
                    phones have no LCD screen tier, only Soft OLED + OEM)
       any other string (e.g. "Up to $170") -> shown exactly as written

     Screen repairs on phones are TIERED: `screen: { lcd, oled, oem }`.
     When more than one tier is priced for a model, the result view shows
     ALL of them at once, labelled LCD / Soft OLED (Recommended) / OEM.

   FLOW
     Device -> Brand -> Model -> Issue -> Result
   Any entry flagged `isOther: true` (at ANY level) skips straight to a
   "request a custom quote" form instead of continuing the flow. A brand
   with exactly one model (or a device with exactly one real brand) is
   auto-selected and that step is never shown ("never show an empty
   step" applies to single-option steps too — there's nothing to pick).
   ========================================================================== */

(function () {
  "use strict";

  var root = document.getElementById("estimator");
  if (!root) return;

  /* ------------------------------------------------------------------
     ISSUE SETS — the repair types priced for each device category, in
     the same order/keys as catalog.js's ISSUE_SETS so both wizards on
     this page agree with each other. `key` must match a property name
     inside every model's `repairs` object for that category. `tiered`
     means the value is `{ lcd, oled, oem }` instead of a single price.
     ------------------------------------------------------------------ */
  var PHONE_ISSUES = [
    { label: "Screen repair",      icon: "💥", key: "screen", tiered: true },
    { label: "Battery",            icon: "🔋", key: "battery" },
    { label: "Back glass",         icon: "🪟", key: "backGlass" },
    { label: "Charging port",      icon: "🔌", key: "chargingPort" },
    { label: "Rear camera",        icon: "📷", key: "rearCamera" },
    { label: "Water damage",       icon: "💧", key: "waterDamage" },
    { label: "Board repair / data recovery", icon: "💾", key: "boardRepair" },
    { label: "Something else",     icon: "❓", isOther: true }
  ];

  var TABLET_ISSUES = [
    { label: "Glass / digitizer",  icon: "🪟", key: "glass" },
    { label: "LCD / screen assembly", icon: "💥", key: "lcd" },
    { label: "Battery",            icon: "🔋", key: "battery" },
    { label: "Charging port",      icon: "🔌", key: "chargingPort" },
    { label: "Board repair / data recovery", icon: "💾", key: "boardRepair" },
    { label: "Something else",     icon: "❓", isOther: true }
  ];

  var LAPTOP_ISSUES = [
    { label: "Screen",             icon: "💥", key: "screen" },
    { label: "Battery",            icon: "🔋", key: "battery" },
    { label: "Keyboard",           icon: "⌨️", key: "keyboard" },
    { label: "Liquid damage",      icon: "💧", key: "liquidDamage" },
    { label: "Board repair",       icon: "🛠️", key: "boardRepair" },
    { label: "Data recovery",      icon: "💾", key: "dataRecovery" },
    { label: "Something else",     icon: "❓", isOther: true }
  ];

  var CONSOLE_ISSUES = [
    { label: "HDMI port",          icon: "🔌", key: "hdmi" },
    { label: "Won't power on (diagnostic)", icon: "⚡", key: "noPower" },
    { label: "Deep clean + thermal", icon: "🔥", key: "deepClean" },
    { label: "Hazard fee (infestation/corrosion)", icon: "☣️", key: "hazard" },
    { label: "Something else",     icon: "❓", isOther: true }
  ];

  var WATCH_ISSUES = [
    { label: "Cracked screen",     icon: "💥", key: "screen" },
    { label: "Battery",            icon: "🔋", key: "battery" },
    { label: "Back glass",         icon: "🪟", key: "backGlass" },
    { label: "Water damage",       icon: "💧", key: "waterDamage" },
    { label: "Won't turn on / board repair", icon: "⚡", key: "boardRepair" },
    { label: "Something else",     icon: "❓", isOther: true }
  ];

  /* Quote-only repairs object shared by every model in a category with no
     pricing on file yet (Windows/Mac laptops, Nintendo, etc.) — one object
     per category so a typo can't leave a key out of sync with its issues. */
  var ALL_QUOTE = {
    phone:   { screen: { lcd: "quote", oled: "quote", oem: "quote" }, battery: "quote", backGlass: "quote", chargingPort: "quote", rearCamera: "quote", waterDamage: "quote", boardRepair: "quote" },
    tablet:  { glass: "quote", lcd: "quote", battery: "quote", chargingPort: "quote", boardRepair: "quote" },
    laptop:  { screen: "quote", battery: "quote", keyboard: "quote", liquidDamage: "quote", boardRepair: "quote", dataRecovery: "quote" },
    console: { hdmi: "quote", noPower: "quote", deepClean: "quote", hazard: "quote" },
    watch:   { screen: "quote", battery: "quote", backGlass: "quote", waterDamage: "quote", boardRepair: "quote" }
  };

  var DEVICES = [
    {
      label: "Phone", icon: "📱", issues: PHONE_ISSUES,
      brands: [
        { label: "Apple", models: [
          { label: "iPhone 17 Pro Max", repairs: { screen: { lcd: 120, oled: 250, oem: 420 }, battery: 140, backGlass: 120, chargingPort: null, rearCamera: 170, waterDamage: "quote", boardRepair: "quote" } },
          { label: "iPhone 17 Pro", repairs: { screen: { lcd: 120, oled: 230, oem: 420 }, battery: 140, backGlass: 120, chargingPort: 160, rearCamera: 170, waterDamage: "quote", boardRepair: "quote" } },
          { label: "iPhone 17", repairs: { screen: { lcd: 120, oled: 200, oem: 380 }, battery: 130, backGlass: 120, chargingPort: null, rearCamera: 150, waterDamage: "quote", boardRepair: "quote" } },
          { label: "iPhone 17e", repairs: { screen: { lcd: 90, oled: 160, oem: 180 }, battery: 100, backGlass: 120, chargingPort: 120, rearCamera: 130, waterDamage: "quote", boardRepair: "quote" } },
          { label: "iPhone Air", repairs: { screen: { lcd: null, oled: 230, oem: 380 }, battery: 130, backGlass: 120, chargingPort: 150, rearCamera: 170, waterDamage: "quote", boardRepair: "quote" } },
          { label: "iPhone 16 Pro Max", repairs: { screen: { lcd: 110, oled: 230, oem: 400 }, battery: 120, backGlass: 120, chargingPort: 140, rearCamera: 140, waterDamage: "quote", boardRepair: "quote" } },
          { label: "iPhone 16 Pro", repairs: { screen: { lcd: 110, oled: 200, oem: 330 }, battery: 120, backGlass: 120, chargingPort: 140, rearCamera: 140, waterDamage: "quote", boardRepair: "quote" } },
          { label: "iPhone 16 Plus", repairs: { screen: { lcd: 110, oled: 180, oem: 250 }, battery: 120, backGlass: 120, chargingPort: 130, rearCamera: 140, waterDamage: "quote", boardRepair: "quote" } },
          { label: "iPhone 16", repairs: { screen: { lcd: 100, oled: 160, oem: 280 }, battery: 120, backGlass: 120, chargingPort: 120, rearCamera: 130, waterDamage: "quote", boardRepair: "quote" } },
          { label: "iPhone 16e", repairs: { screen: { lcd: 90, oled: 160, oem: 180 }, battery: 100, backGlass: 120, chargingPort: 120, rearCamera: 130, waterDamage: "quote", boardRepair: "quote" } },
          { label: "iPhone 15 Pro Max", repairs: { screen: { lcd: 110, oled: 160, oem: 300 }, battery: 120, backGlass: 120, chargingPort: 120, rearCamera: 140, waterDamage: "quote", boardRepair: "quote" } },
          { label: "iPhone 15 Pro", repairs: { screen: { lcd: 100, oled: 160, oem: 300 }, battery: 120, backGlass: 120, chargingPort: 120, rearCamera: 140, waterDamage: "quote", boardRepair: "quote" } },
          { label: "iPhone 15 Plus", repairs: { screen: { lcd: 100, oled: 160, oem: 250 }, battery: 100, backGlass: 120, chargingPort: 120, rearCamera: 120, waterDamage: "quote", boardRepair: "quote" } },
          { label: "iPhone 15", repairs: { screen: { lcd: 100, oled: 160, oem: 250 }, battery: 100, backGlass: 120, chargingPort: 110, rearCamera: 120, waterDamage: "quote", boardRepair: "quote" } },
          { label: "iPhone 14 Pro Max", repairs: { screen: { lcd: 110, oled: 160, oem: 300 }, battery: 120, backGlass: 120, chargingPort: 100, rearCamera: 140, waterDamage: "quote", boardRepair: "quote" } },
          { label: "iPhone 14 Pro", repairs: { screen: { lcd: 100, oled: 160, oem: 250 }, battery: 120, backGlass: 120, chargingPort: 100, rearCamera: 140, waterDamage: "quote", boardRepair: "quote" } },
          { label: "iPhone 14 Plus", repairs: { screen: { lcd: 100, oled: 150, oem: 250 }, battery: 120, backGlass: 100, chargingPort: 100, rearCamera: 130, waterDamage: "quote", boardRepair: "quote" } },
          { label: "iPhone 14", repairs: { screen: { lcd: 90, oled: 150, oem: 200 }, battery: 100, backGlass: 100, chargingPort: 100, rearCamera: 130, waterDamage: "quote", boardRepair: "quote" } },
          { label: "iPhone 13 Pro Max", repairs: { screen: { lcd: 100, oled: 160, oem: 220 }, battery: 120, backGlass: 100, chargingPort: 100, rearCamera: 130, waterDamage: "quote", boardRepair: "quote" } },
          { label: "iPhone 13 Pro", repairs: { screen: { lcd: 100, oled: 160, oem: 200 }, battery: 110, backGlass: 100, chargingPort: 100, rearCamera: 130, waterDamage: "quote", boardRepair: "quote" } },
          { label: "iPhone 13", repairs: { screen: { lcd: 90, oled: 150, oem: 170 }, battery: 110, backGlass: 90, chargingPort: 100, rearCamera: 110, waterDamage: "quote", boardRepair: "quote" } },
          { label: "iPhone 13 mini", repairs: { screen: { lcd: 90, oled: null, oem: 200 }, battery: 110, backGlass: 90, chargingPort: 100, rearCamera: 110, waterDamage: "quote", boardRepair: "quote" } },
          { label: "iPhone 12 Pro Max", repairs: { screen: { lcd: 90, oled: 150, oem: 210 }, battery: 110, backGlass: 90, chargingPort: 90, rearCamera: 130, waterDamage: "quote", boardRepair: "quote" } },
          { label: "iPhone 12 Pro", repairs: { screen: { lcd: 80, oled: 140, oem: 170 }, battery: 100, backGlass: 90, chargingPort: 90, rearCamera: 150, waterDamage: "quote", boardRepair: "quote" } },
          { label: "iPhone 12", repairs: { screen: { lcd: 80, oled: 140, oem: 170 }, battery: 100, backGlass: 90, chargingPort: 90, rearCamera: 100, waterDamage: "quote", boardRepair: "quote" } },
          { label: "iPhone 12 mini", repairs: { screen: { lcd: 90, oled: 140, oem: 170 }, battery: 90, backGlass: 90, chargingPort: 90, rearCamera: 100, waterDamage: "quote", boardRepair: "quote" } },
          { label: "iPhone 11 Pro Max", repairs: { screen: { lcd: 80, oled: 140, oem: 170 }, battery: 90, backGlass: 80, chargingPort: 80, rearCamera: 100, waterDamage: "quote", boardRepair: "quote" } },
          { label: "iPhone 11 Pro", repairs: { screen: { lcd: 80, oled: 140, oem: 160 }, battery: 90, backGlass: 80, chargingPort: 80, rearCamera: 100, waterDamage: "quote", boardRepair: "quote" } },
          { label: "iPhone 11", repairs: { screen: { lcd: null, oled: 90, oem: 120 }, battery: 80, backGlass: 80, chargingPort: 80, rearCamera: 80, waterDamage: "quote", boardRepair: "quote" } },
          { label: "iPhone XR", repairs: { screen: { lcd: null, oled: 90, oem: 120 }, battery: 80, backGlass: 80, chargingPort: 80, rearCamera: 80, waterDamage: "quote", boardRepair: "quote" } },
          { label: "iPhone XS Max", repairs: { screen: { lcd: 80, oled: 120, oem: 150 }, battery: 80, backGlass: 80, chargingPort: 80, rearCamera: 70, waterDamage: "quote", boardRepair: "quote" } },
          { label: "iPhone XS", repairs: { screen: { lcd: 80, oled: 120, oem: 140 }, battery: 80, backGlass: 80, chargingPort: 80, rearCamera: 70, waterDamage: "quote", boardRepair: "quote" } },
          { label: "iPhone X", repairs: { screen: { lcd: 80, oled: 120, oem: 140 }, battery: 80, backGlass: 80, chargingPort: 80, rearCamera: 70, waterDamage: "quote", boardRepair: "quote" } },
          { label: "iPhone SE (2022)", repairs: { screen: { lcd: null, oled: 70, oem: 80 }, battery: 70, backGlass: 70, chargingPort: 70, rearCamera: 60, waterDamage: "quote", boardRepair: "quote" } },
          { label: "iPhone SE (2020)", repairs: { screen: { lcd: null, oled: 70, oem: 80 }, battery: 70, backGlass: 70, chargingPort: 70, rearCamera: 60, waterDamage: "quote", boardRepair: "quote" } },
          { label: "iPhone 8 Plus", repairs: { screen: { lcd: null, oled: 80, oem: 100 }, battery: 70, backGlass: 70, chargingPort: 70, rearCamera: 60, waterDamage: "quote", boardRepair: "quote" } },
          { label: "iPhone 8", repairs: { screen: { lcd: null, oled: 70, oem: 80 }, battery: 70, backGlass: 70, chargingPort: 70, rearCamera: 60, waterDamage: "quote", boardRepair: "quote" } },
          { label: "iPhone 7 Plus", repairs: { screen: { lcd: null, oled: 80, oem: 100 }, battery: 60, backGlass: null, chargingPort: 70, rearCamera: 60, waterDamage: "quote", boardRepair: "quote" } },
          { label: "iPhone 7", repairs: { screen: { lcd: null, oled: 70, oem: 80 }, battery: 60, backGlass: null, chargingPort: 70, rearCamera: 60, waterDamage: "quote", boardRepair: "quote" } }
        ]},
        { label: "Samsung", models: [
          { label: "Galaxy S26 Ultra", repairs: { screen: { lcd: null, oled: 220, oem: 350 }, battery: 100, backGlass: 90, chargingPort: 90, rearCamera: "quote", waterDamage: "quote", boardRepair: "quote" } },
          { label: "Galaxy S26+", repairs: { screen: { lcd: null, oled: 220, oem: 330 }, battery: 100, backGlass: 90, chargingPort: 90, rearCamera: "quote", waterDamage: "quote", boardRepair: "quote" } },
          { label: "Galaxy S26 FE", repairs: { screen: { lcd: null, oled: null, oem: null }, battery: 100, backGlass: 90, chargingPort: 90, rearCamera: "quote", waterDamage: "quote", boardRepair: "quote" } },
          { label: "Galaxy S26", repairs: { screen: { lcd: null, oled: null, oem: 260 }, battery: 100, backGlass: 90, chargingPort: 90, rearCamera: "quote", waterDamage: "quote", boardRepair: "quote" } },
          { label: "Galaxy S25 Ultra", repairs: { screen: { lcd: null, oled: 220, oem: 330 }, battery: 100, backGlass: 90, chargingPort: 90, rearCamera: "quote", waterDamage: "quote", boardRepair: "quote" } },
          { label: "Galaxy S25+", repairs: { screen: { lcd: null, oled: 170, oem: 270 }, battery: 100, backGlass: 90, chargingPort: 90, rearCamera: "quote", waterDamage: "quote", boardRepair: "quote" } },
          { label: "Galaxy S25 Edge", repairs: { screen: { lcd: null, oled: 250, oem: 350 }, battery: 100, backGlass: 90, chargingPort: 90, rearCamera: "quote", waterDamage: "quote", boardRepair: "quote" } },
          { label: "Galaxy S25", repairs: { screen: { lcd: null, oled: 200, oem: 230 }, battery: 100, backGlass: 90, chargingPort: 90, rearCamera: "quote", waterDamage: "quote", boardRepair: "quote" } },
          { label: "Galaxy S24 Ultra", repairs: { screen: { lcd: null, oled: 220, oem: 320 }, battery: 100, backGlass: 90, chargingPort: 90, rearCamera: "quote", waterDamage: "quote", boardRepair: "quote" } },
          { label: "Galaxy S24+", repairs: { screen: { lcd: null, oled: 200, oem: 240 }, battery: 100, backGlass: 90, chargingPort: 90, rearCamera: "quote", waterDamage: "quote", boardRepair: "quote" } },
          { label: "Galaxy S24", repairs: { screen: { lcd: null, oled: 200, oem: 230 }, battery: 100, backGlass: 70, chargingPort: 90, rearCamera: "quote", waterDamage: "quote", boardRepair: "quote" } },
          { label: "Galaxy S23 Ultra", repairs: { screen: { lcd: null, oled: 180, oem: 320 }, battery: 100, backGlass: 70, chargingPort: 80, rearCamera: "quote", waterDamage: "quote", boardRepair: "quote" } },
          { label: "Galaxy S23+", repairs: { screen: { lcd: null, oled: 160, oem: 230 }, battery: 100, backGlass: 70, chargingPort: 80, rearCamera: "quote", waterDamage: "quote", boardRepair: "quote" } },
          { label: "Galaxy S23", repairs: { screen: { lcd: null, oled: 180, oem: 240 }, battery: 100, backGlass: 70, chargingPort: 80, rearCamera: "quote", waterDamage: "quote", boardRepair: "quote" } },
          { label: "Galaxy S22 Ultra", repairs: { screen: { lcd: null, oled: 170, oem: 320 }, battery: 100, backGlass: 70, chargingPort: 80, rearCamera: "quote", waterDamage: "quote", boardRepair: "quote" } },
          { label: "Galaxy S22", repairs: { screen: { lcd: null, oled: 200, oem: 240 }, battery: 80, backGlass: 70, chargingPort: 80, rearCamera: "quote", waterDamage: "quote", boardRepair: "quote" } },
          { label: "Galaxy S21 Ultra", repairs: { screen: { lcd: null, oled: 180, oem: 260 }, battery: 80, backGlass: 70, chargingPort: 70, rearCamera: "quote", waterDamage: "quote", boardRepair: "quote" } },
          { label: "Galaxy S21 FE", repairs: { screen: { lcd: null, oled: 120, oem: 220 }, battery: 80, backGlass: 70, chargingPort: 70, rearCamera: "quote", waterDamage: "quote", boardRepair: "quote" } },
          { label: "Galaxy S21", repairs: { screen: { lcd: null, oled: 170, oem: 220 }, battery: 80, backGlass: 70, chargingPort: 70, rearCamera: "quote", waterDamage: "quote", boardRepair: "quote" } },
          { label: "Galaxy S20 Ultra", repairs: { screen: { lcd: null, oled: 170, oem: 270 }, battery: 80, backGlass: 60, chargingPort: 70, rearCamera: "quote", waterDamage: "quote", boardRepair: "quote" } },
          { label: "Galaxy S20+", repairs: { screen: { lcd: null, oled: 150, oem: 220 }, battery: 80, backGlass: 60, chargingPort: 70, rearCamera: "quote", waterDamage: "quote", boardRepair: "quote" } },
          { label: "Galaxy S20FE", repairs: { screen: { lcd: null, oled: 120, oem: 160 }, battery: 80, backGlass: 60, chargingPort: 70, rearCamera: "quote", waterDamage: "quote", boardRepair: "quote" } },
          { label: "Galaxy S20", repairs: { screen: { lcd: null, oled: 170, oem: 220 }, battery: 80, backGlass: 60, chargingPort: 70, rearCamera: "quote", waterDamage: "quote", boardRepair: "quote" } },
          { label: "Galaxy Note 20 Ultra", repairs: { screen: { lcd: null, oled: 180, oem: 300 }, battery: 80, backGlass: 60, chargingPort: 70, rearCamera: "quote", waterDamage: "quote", boardRepair: "quote" } }
        ]},
        { label: "Google", models: [
          { label: "Pixel 10 Pro XL", repairs: { screen: { lcd: null, oled: null, oem: 250 }, battery: 100, backGlass: "quote", chargingPort: "quote", rearCamera: "quote", waterDamage: "quote", boardRepair: "quote" } },
          { label: "Pixel 10 Pro", repairs: { screen: { lcd: null, oled: null, oem: 200 }, battery: 100, backGlass: "quote", chargingPort: "quote", rearCamera: "quote", waterDamage: "quote", boardRepair: "quote" } },
          { label: "Pixel 10/10A", repairs: { screen: { lcd: null, oled: null, oem: 200 }, battery: 100, backGlass: "quote", chargingPort: "quote", rearCamera: "quote", waterDamage: "quote", boardRepair: "quote" } },
          { label: "Pixel 9 Pro XL", repairs: { screen: { lcd: null, oled: 180, oem: 250 }, battery: 100, backGlass: "quote", chargingPort: "quote", rearCamera: "quote", waterDamage: "quote", boardRepair: "quote" } },
          { label: "Pixel 9 Pro", repairs: { screen: { lcd: null, oled: null, oem: 190 }, battery: 80, backGlass: "quote", chargingPort: "quote", rearCamera: "quote", waterDamage: "quote", boardRepair: "quote" } },
          { label: "Pixel 9/9A", repairs: { screen: { lcd: null, oled: null, oem: 220 }, battery: 80, backGlass: "quote", chargingPort: "quote", rearCamera: "quote", waterDamage: "quote", boardRepair: "quote" } },
          { label: "Pixel 8 Pro", repairs: { screen: { lcd: null, oled: 140, oem: 240 }, battery: 80, backGlass: "quote", chargingPort: "quote", rearCamera: "quote", waterDamage: "quote", boardRepair: "quote" } },
          { label: "Pixel 8", repairs: { screen: { lcd: null, oled: 140, oem: 200 }, battery: 80, backGlass: "quote", chargingPort: "quote", rearCamera: "quote", waterDamage: "quote", boardRepair: "quote" } },
          { label: "Pixel 7 Pro", repairs: { screen: { lcd: null, oled: 140, oem: 250 }, battery: 70, backGlass: "quote", chargingPort: "quote", rearCamera: "quote", waterDamage: "quote", boardRepair: "quote" } },
          { label: "Pixel 7", repairs: { screen: { lcd: null, oled: 140, oem: 220 }, battery: 70, backGlass: "quote", chargingPort: "quote", rearCamera: "quote", waterDamage: "quote", boardRepair: "quote" } },
          { label: "Pixel 6 Pro", repairs: { screen: { lcd: null, oled: 140, oem: 220 }, battery: 70, backGlass: "quote", chargingPort: "quote", rearCamera: "quote", waterDamage: "quote", boardRepair: "quote" } },
          { label: "Pixel 6", repairs: { screen: { lcd: null, oled: 140, oem: 200 }, battery: 70, backGlass: "quote", chargingPort: "quote", rearCamera: "quote", waterDamage: "quote", boardRepair: "quote" } },
          { label: "Pixel 6a", repairs: { screen: { lcd: null, oled: 160, oem: 180 }, battery: 70, backGlass: "quote", chargingPort: "quote", rearCamera: "quote", waterDamage: "quote", boardRepair: "quote" } }
        ]},
        /* Not on the price list (grouped there as "Other Android — Call For
           Quote") — kept selectable since it's an existing brand on the
           site, but quote-only until it's priced. */
        { label: "Motorola", models: [
          { label: "Edge 50", repairs: ALL_QUOTE.phone }, { label: "Edge 40", repairs: ALL_QUOTE.phone },
          { label: "Moto G", repairs: ALL_QUOTE.phone }, { label: "Razr", repairs: ALL_QUOTE.phone }
        ]},
        { label: "Other brand", icon: "❓", isOther: true }
      ]
    },
    {
      label: "Tablet", icon: "📟", issues: TABLET_ISSUES,
      brands: [
        { label: "Apple", models: [
          { label: "iPad Pro 12.9\" 5th/6th Gen", repairs: { glass: null, lcd: 320, battery: 140, chargingPort: 120, boardRepair: "quote" } },
          { label: "iPad Pro 12.9\" 3rd/4th Gen", repairs: { glass: null, lcd: 240, battery: 120, chargingPort: 120, boardRepair: "quote" } },
          { label: "iPad Pro 12.9\" 2nd Gen", repairs: { glass: null, lcd: 350, battery: 120, chargingPort: 120, boardRepair: "quote" } },
          { label: "iPad Pro 12.9\" 1st Gen", repairs: { glass: null, lcd: 240, battery: 120, chargingPort: 100, boardRepair: "quote" } },
          { label: "iPad Pro 11\" 3rd/4th Gen", repairs: { glass: null, lcd: 240, battery: 120, chargingPort: 120, boardRepair: "quote" } },
          { label: "iPad Pro 11\" 2nd/1st Gen", repairs: { glass: null, lcd: 220, battery: 120, chargingPort: 100, boardRepair: "quote" } },
          { label: "iPad Pro 10.5", repairs: { glass: null, lcd: 160, battery: 120, chargingPort: 100, boardRepair: "quote" } },
          { label: "iPad Pro 9.7", repairs: { glass: null, lcd: 160, battery: 120, chargingPort: 100, boardRepair: "quote" } },
          { label: "iPad Air 4th/5th Gen", repairs: { glass: null, lcd: 240, battery: 120, chargingPort: 120, boardRepair: "quote" } },
          { label: "iPad A16 / 10", repairs: { glass: 140, lcd: 200, battery: 120, chargingPort: 120, boardRepair: "quote" } },
          { label: "iPad 7/8/9", repairs: { glass: 120, lcd: 80, battery: 100, chargingPort: 120, boardRepair: "quote" } },
          { label: "iPad 6", repairs: { glass: 100, lcd: 70, battery: 100, chargingPort: 120, boardRepair: "quote" } }
        ]},
        { label: "Samsung", models: [
          { label: "Galaxy Tab S9 Ultra", repairs: ALL_QUOTE.tablet }, { label: "Galaxy Tab S9", repairs: ALL_QUOTE.tablet },
          { label: "Galaxy Tab S8", repairs: ALL_QUOTE.tablet }, { label: "Galaxy Tab A9", repairs: ALL_QUOTE.tablet },
          { label: "Galaxy Tab A8", repairs: ALL_QUOTE.tablet }
        ]},
        { label: "Amazon", models: [
          { label: "Fire HD 10", repairs: ALL_QUOTE.tablet }, { label: "Fire HD 8", repairs: ALL_QUOTE.tablet }
        ]},
        { label: "Lenovo", models: [ { label: "Lenovo Tab", repairs: ALL_QUOTE.tablet } ] },
        { label: "Other brand", icon: "❓", isOther: true }
      ]
    },
    {
      label: "Laptop", icon: "💻", issues: LAPTOP_ISSUES,
      brands: [
        /* Laptop repairs are quoted after an in-person or photo diagnostic —
           boards, panels and keyboards vary too much by exact SKU to price
           blind. Every entry is quote-only until real numbers are added. */
        { label: "Apple", models: [
          { label: "MacBook Air M3", repairs: ALL_QUOTE.laptop }, { label: "MacBook Air M2", repairs: ALL_QUOTE.laptop },
          { label: "MacBook Air M1", repairs: ALL_QUOTE.laptop }, { label: "MacBook Pro 14\" (M-Series)", repairs: ALL_QUOTE.laptop },
          { label: "MacBook Pro 16\" (M-Series)", repairs: ALL_QUOTE.laptop }, { label: "MacBook Pro 13\" (Intel)", repairs: ALL_QUOTE.laptop },
          { label: "iMac 24", repairs: ALL_QUOTE.laptop }
        ]},
        { label: "Dell",   models: [ { label: "Any Dell model", repairs: ALL_QUOTE.laptop } ] },
        { label: "HP",     models: [ { label: "Any HP model", repairs: ALL_QUOTE.laptop } ] },
        { label: "Lenovo", models: [ { label: "Any Lenovo model", repairs: ALL_QUOTE.laptop } ] },
        { label: "ASUS",   models: [ { label: "Any ASUS model", repairs: ALL_QUOTE.laptop } ] },
        { label: "Acer",   models: [ { label: "Any Acer model", repairs: ALL_QUOTE.laptop } ] },
        { label: "Microsoft Surface", models: [ { label: "Any Surface model", repairs: ALL_QUOTE.laptop } ] },
        { label: "Other brand", icon: "❓", isOther: true }
      ]
    },
    {
      label: "Console", icon: "🎮", issues: CONSOLE_ISSUES,
      brands: [
        { label: "Sony", models: [
          { label: "PlayStation 5 / Slim / Pro", repairs: { hdmi: 130, noPower: "Up to $170", deepClean: 100, hazard: 60 } },
          { label: "PlayStation 4", repairs: ALL_QUOTE.console },
          { label: "DualSense controller", repairs: ALL_QUOTE.console }
        ]},
        { label: "Microsoft", models: [
          { label: "Xbox Series X/S", repairs: { hdmi: 130, noPower: "Up to $170", deepClean: 100, hazard: 60 } },
          { label: "Xbox One", repairs: ALL_QUOTE.console },
          { label: "Xbox controller", repairs: ALL_QUOTE.console }
        ]},
        /* Not on the price list — quote-only until priced. */
        { label: "Nintendo", models: [
          { label: "Switch 2", repairs: ALL_QUOTE.console }, { label: "Switch OLED", repairs: ALL_QUOTE.console },
          { label: "Switch", repairs: ALL_QUOTE.console }, { label: "Switch Lite", repairs: ALL_QUOTE.console },
          { label: "Joy-Con pair", repairs: ALL_QUOTE.console }
        ]},
        { label: "Other brand", icon: "❓", isOther: true }
      ]
    },
    {
      /* Not covered by Price List.xlsx at all — every repair is quote-only. */
      label: "Smartwatch", icon: "⌚", issues: WATCH_ISSUES,
      brands: [
        { label: "Apple", models: [
          { label: "Apple Watch Ultra", repairs: ALL_QUOTE.watch }, { label: "Series 9 / 10", repairs: ALL_QUOTE.watch },
          { label: "Series 6-8", repairs: ALL_QUOTE.watch }, { label: "Watch SE", repairs: ALL_QUOTE.watch }
        ]},
        { label: "Samsung", models: [
          { label: "Galaxy Watch Ultra", repairs: ALL_QUOTE.watch }, { label: "Galaxy Watch", repairs: ALL_QUOTE.watch }
        ]},
        { label: "Garmin", models: [ { label: "Garmin watch", repairs: ALL_QUOTE.watch } ] },
        { label: "Other brand", icon: "❓", isOther: true }
      ]
    },
    { label: "Something else", icon: "❓", isOther: true }
  ];

  /* Which tier is "recommended" and carries DisplayShield (our 1-year
     breakage warranty) depends on brand, not tier: iPhones get it on Soft
     OLED, every other phone brand gets it on OEM — see PHONE_SHIELD_TIER. */
  var SCREEN_TIERS = [
    { key: "lcd",  label: "Aftermarket LCD" },
    { key: "oled", label: "Soft OLED" },
    { key: "oem",  label: "OEM / Genuine" }
  ];
  var PHONE_SHIELD_TIER = { Apple: "oled", Samsung: "oem", Google: "oem", Motorola: "oem" };

  var ORDER = ["device", "brand", "model", "issue"];

  /* ------------------------------------------------------------------
     STATE — the one object. step/selections/history all live here;
     nothing is written to localStorage, so a refresh always starts over.
     ------------------------------------------------------------------ */
  var state = {
    step: "device",
    device: null,
    brand: null,
    model: null,
    issue: null,
    tier: null,      /* which screen tier (LCD/OLED/OEM) they chose to book, if any */
    shown: [],
    hasPainted: false
  };

  var refs = {};

  function realOptions(list) { return list.filter(function (o) { return !o.isOther; }); }

  /* Every repairs value is a number (real price), "quote" (not priced),
     null (not offered — caller filters these out before display) or a
     verbatim string like "Up to $170". */
  function priceText(v) {
    if (typeof v === "number") return "$" + v;
    if (v === "quote") return "Call for quote";
    return v;
  }

  function lowestTierPrice(screen) {
    var nums = SCREEN_TIERS.map(function (t) { return screen[t.key]; }).filter(function (v) { return typeof v === "number"; });
    return nums.length ? Math.min.apply(null, nums) : null;
  }

  /* True if the model offers this repair at all — i.e. at least one tier
     isn't null. A brand with every tier priced "quote" (nothing on file
     yet, e.g. Motorola) still counts as offered: it shows "Call for
     quote" rather than disappearing from the list. */
  function anyTierOffered(screen) {
    return SCREEN_TIERS.some(function (t) { return screen[t.key] !== null && typeof screen[t.key] !== "undefined"; });
  }

  function el(tag, cls) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    return e;
  }

  var FORMSPREE_ENDPOINT = "https://formspree.io/f/mjgnrpda";

  /* Submits a form to Formspree over fetch instead of a full-page POST, so
     the hero card never navigates away and keeps showing its own inline
     status message. `opts.subject` becomes the notification email
     subject; `opts.extra` are additional key/value pairs appended to the
     submission (e.g. the exact device/issue/tier context, which isn't a
     visible field); `opts.onSuccess` runs once Formspree confirms. */
  function submitToFormspree(form, msgEl, opts) {
    opts = opts || {};
    var data = new FormData(form);
    if (opts.subject) data.append("_subject", opts.subject);
    if (opts.extra) {
      Object.keys(opts.extra).forEach(function (k) { data.append(k, opts.extra[k]); });
    }

    msgEl.hidden = false;
    msgEl.textContent = "Sending…";

    fetch(FORMSPREE_ENDPOINT, {
      method: "POST",
      body: data,
      headers: { "Accept": "application/json" }
    }).then(function (res) {
      if (res.ok) {
        msgEl.textContent = opts.successText || "✓ Thanks, we'll be in touch shortly.";
        if (opts.onSuccess) opts.onSuccess();
        return;
      }
      return res.json().catch(function () { return null; }).then(function (json) {
        var detail = (json && json.errors && json.errors.length) ? json.errors.map(function (er) { return er.message; }).join(", ") : "Something went wrong.";
        msgEl.textContent = "✗ " + detail + " Please call us instead at (704) 293-4468.";
      });
    }).catch(function () {
      msgEl.textContent = "✗ Couldn't send that. Check your connection, or call us at (704) 293-4468.";
    });
  }

  /* ------------------------------------------------------------------
     SHELL — built once. Everything that changes between steps lives
     inside refs.body / refs.question, repainted by display().
     ------------------------------------------------------------------ */
  function buildShell() {
    root.innerHTML = "";

    var topbar = el("div", "ifxest-topbar");
    var backBtn = document.createElement("button");
    backBtn.type = "button";
    backBtn.className = "ifxest-back";
    backBtn.textContent = "← Back";
    backBtn.hidden = true;
    backBtn.addEventListener("click", goBack);

    var progress = el("div", "ifxest-progress");
    progress.setAttribute("aria-hidden", "true");
    var progressFill = document.createElement("i");
    progress.appendChild(progressFill);

    var resetBtn = document.createElement("button");
    resetBtn.type = "button";
    resetBtn.className = "ifxest-reset";
    resetBtn.textContent = "Start over";
    resetBtn.hidden = true;
    resetBtn.addEventListener("click", reset);

    topbar.appendChild(backBtn);
    topbar.appendChild(progress);
    topbar.appendChild(resetBtn);

    var trail = el("p", "ifxest-trail");
    trail.setAttribute("aria-hidden", "true");
    trail.hidden = true;

    /* h4, not h3: this nests under the device box's own "Start your
       quote" <h3> rather than duplicating a page-section heading. */
    var question = document.createElement("h4");
    question.className = "ifxest-question";
    question.tabIndex = -1;

    var body = el("div", "ifxest-body");

    root.appendChild(topbar);
    root.appendChild(trail);
    root.appendChild(question);
    root.appendChild(body);

    refs = { backBtn: backBtn, resetBtn: resetBtn, progressFill: progressFill, trail: trail, question: question, body: body };
  }

  function setQuestion(text) { refs.question.textContent = text; }

  function setOptions(list, onPick, metaFn) {
    refs.body.innerHTML = "";
    refs.body.appendChild(renderOptionList(list, onPick, metaFn));
  }

  function renderOptionList(list, onPick, metaFn) {
    var wrap = el("div", "ifxest-options");
    wrap.setAttribute("role", "group");
    wrap.setAttribute("aria-label", refs.question.textContent);

    list.forEach(function (opt) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "ifxest-opt" + (opt.isOther ? " ifxest-opt-other" : "");

      var icon = el("span", "ifxest-opt-icon");
      icon.setAttribute("aria-hidden", "true");
      icon.textContent = opt.icon || "•";

      var text = el("span", "ifxest-opt-text");
      var label = el("span", "ifxest-opt-label");
      label.textContent = opt.label;
      text.appendChild(label);

      if (!opt.isOther && metaFn) {
        var meta = el("span", "ifxest-opt-meta");
        meta.textContent = metaFn(opt);
        text.appendChild(meta);
      }

      btn.appendChild(icon);
      btn.appendChild(text);
      btn.addEventListener("click", function () { onPick(opt); });
      wrap.appendChild(btn);
    });

    wrap.addEventListener("keydown", handleArrowNav);
    return wrap;
  }

  /* A plain tile grid doesn't work once a brand has 20-40 models (every
     iPhone/Galaxy/Pixel) — it just turns into a wall of buttons. This
     renders a single <select> instead; used for Phone models only (see
     paintModel), where the model lists are long. */
  function setModelDropdown(models, onPick) {
    refs.body.innerHTML = "";

    var wrap = el("div", "ifxest-select-wrap");
    var label = document.createElement("label");
    label.className = "ifxest-select-label";
    label.textContent = "Select your model";

    var select = document.createElement("select");
    select.className = "ifxest-select";

    var placeholder = document.createElement("option");
    placeholder.value = "";
    placeholder.textContent = "Choose a model…";
    placeholder.disabled = true;
    placeholder.selected = true;
    select.appendChild(placeholder);

    models.forEach(function (m, i) {
      var opt = document.createElement("option");
      opt.value = String(i);
      opt.textContent = m.label;
      select.appendChild(opt);
    });

    select.addEventListener("change", function () {
      if (select.value === "") return;
      onPick(models[parseInt(select.value, 10)]);
    });

    label.appendChild(select);
    wrap.appendChild(label);
    refs.body.appendChild(wrap);
  }

  function handleArrowNav(e) {
    var keys = ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Home", "End"];
    if (keys.indexOf(e.key) === -1) return;
    var buttons = Array.prototype.slice.call(e.currentTarget.querySelectorAll("button"));
    var i = buttons.indexOf(document.activeElement);
    if (i === -1) return;
    var next = null;
    if (e.key === "ArrowDown" || e.key === "ArrowRight") next = buttons[(i + 1) % buttons.length];
    else if (e.key === "ArrowUp" || e.key === "ArrowLeft") next = buttons[(i - 1 + buttons.length) % buttons.length];
    else if (e.key === "Home") next = buttons[0];
    else if (e.key === "End") next = buttons[buttons.length - 1];
    if (next) { e.preventDefault(); next.focus(); }
  }

  function updateChrome() {
    refs.backBtn.hidden = state.shown.length <= 1;
    refs.resetBtn.hidden = state.shown.length <= 1;

    var idx = ORDER.indexOf(state.step);
    var pct = (state.step === "result" || state.step === "other" || state.step === "booking") ? 100 : Math.round(((idx < 0 ? 0 : idx) / ORDER.length) * 100);
    refs.progressFill.style.width = pct + "%";

    var parts = [];
    if (state.device && !state.device.isOther) parts.push(state.device.label);
    if (state.brand && !state.brand.isOther) parts.push(state.brand.label);
    if (state.model && !state.model.isOther) parts.push(state.model.label);
    refs.trail.textContent = parts.join(" › ");
    refs.trail.hidden = parts.length === 0;
  }

  function moveFocus() {
    if (!state.hasPainted) { state.hasPainted = true; return; }
    refs.question.focus();
  }

  /* ------------------------------------------------------------------
     STEP DISPATCH
     ------------------------------------------------------------------ */
  function display(name) {
    state.step = name;
    if (state.shown[state.shown.length - 1] !== name) state.shown.push(name);

    if (name === "device") paintDevice();
    else if (name === "brand") paintBrand();
    else if (name === "model") paintModel();
    else if (name === "issue") paintIssue();
    else if (name === "result") paintResult();
    else if (name === "other") paintOther();
    else if (name === "booking") paintBooking();

    updateChrome();
    moveFocus();
  }

  function paintDevice() {
    setQuestion("What kind of device is it?");
    setOptions(DEVICES, function (picked) {
      if (picked.isOther) { toOther(); return; }
      state.device = picked;
      advanceBrand();
    });
  }

  function paintBrand() {
    setQuestion("Who makes your " + state.device.label.toLowerCase() + "?");
    setOptions(state.device.brands, function (picked) {
      if (picked.isOther) { toOther(); return; }
      state.brand = picked;
      advanceModel();
    });
  }

  function paintModel() {
    setQuestion("Which " + state.brand.label + " model?");
    var onPick = function (picked) {
      if (picked.isOther) { toOther(); return; }
      state.model = picked;
      advanceIssue();
    };
    /* Phones have 12-40 models per brand — a dropdown keeps the page from
       turning into a wall of tiles. Every other category's model lists are
       short enough that tiles still read fine. */
    if (state.device.label === "Phone") { setModelDropdown(state.brand.models, onPick); return; }
    setOptions(state.brand.models, onPick);
  }

  /* Which issues actually apply to the selected model: a tiered (screen)
     issue shows if at least one tier is offered (priced OR quote-only); a
     plain issue shows unless its value is null (not offered on this model
     at all). */
  function availableIssues() {
    return state.device.issues.filter(function (is) {
      if (is.isOther) return true;
      var val = state.model.repairs[is.key];
      if (is.tiered) return anyTierOffered(val);
      return val !== null;
    });
  }

  function paintIssue() {
    setQuestion("What's wrong with it?");
    setOptions(availableIssues(), function (picked) {
      if (picked.isOther) { toOther(); return; }
      state.issue = picked;
      state.tier = null;
      display("result");
    }, function (issue) {
      var val = state.model.repairs[issue.key];
      if (!issue.tiered) return priceText(val);
      var lo = lowestTierPrice(val);
      return lo !== null ? "from $" + lo : "Call for quote";
    });
  }

  /* Each tier is its own button: tapping a price books that specific
     option (LCD vs Soft OLED vs OEM), so booking always carries the exact
     service the customer picked rather than a generic "screen repair". */
  function renderTiers(screen, shieldTierKey, onBook) {
    var wrap = el("div", "ifxest-tiers");
    SCREEN_TIERS.forEach(function (t) {
      var val = screen[t.key];
      if (val === null || typeof val === "undefined") return;
      var isShield = t.key === shieldTierKey;
      var sub = isShield ? "Recommended · DisplayShield: 1-Year Breakage Warranty"
              : (t.key === "oem" ? "Genuine part, ordered in" : "");
      var row = document.createElement("button");
      row.type = "button";
      row.className = "ifxest-tier" + (isShield ? " ifxest-tier-reco" : "");

      var label = el("div", "ifxest-tier-label");
      var strong = document.createElement("b");
      strong.textContent = t.label;
      label.appendChild(strong);
      if (isShield) {
        var tag = el("span", "ifxest-tier-tag");
        tag.textContent = "Recommended";
        label.appendChild(tag);
      }
      if (sub) {
        var subEl = el("span", "ifxest-tier-sub");
        subEl.textContent = sub;
        label.appendChild(subEl);
      }

      var price = el("div", "ifxest-tier-price" + (val === "quote" ? " is-quote" : ""));
      price.textContent = priceText(val);

      row.appendChild(label);
      row.appendChild(price);
      row.addEventListener("click", function () { onBook(t, val); });
      wrap.appendChild(row);
    });
    return wrap;
  }

  function paintResult() {
    setQuestion("Your estimate");

    refs.body.innerHTML = "";
    var panel = el("div", "ifxest-result");
    var val = state.model.repairs[state.issue.key];

    if (state.issue.tiered) {
      var shieldTierKey = PHONE_SHIELD_TIER[state.brand.label] || "oem";
      panel.appendChild(renderTiers(val, shieldTierKey, function (tier, price) {
        state.tier = { key: tier.key, label: tier.label, price: price };
        display("booking");
      }));
      var tapHint = el("p", "ifxest-note");
      tapHint.textContent = "Tap a price above to book that option.";
      panel.appendChild(tapHint);
    } else {
      var price = el("div", "ifxest-price");
      price.textContent = priceText(val);
      panel.appendChild(price);
    }

    var summary = el("p", "ifxest-summary");
    var b = document.createElement("b");
    b.textContent = state.model.label;
    summary.appendChild(b);
    summary.appendChild(document.createTextNode(" · " + state.issue.label.toLowerCase()));

    var note = el("p", "ifxest-note");
    note.textContent = "Ballpark based on typical parts and labour. We confirm the exact price free of charge before starting any work.";

    var cta = el("div", "ifxest-cta");
    if (!state.issue.tiered) {
      var bookBtn = document.createElement("button");
      bookBtn.type = "button";
      bookBtn.className = "btn btn-primary";
      bookBtn.textContent = "Book this repair";
      bookBtn.addEventListener("click", function () { state.tier = null; display("booking"); });
      cta.appendChild(bookBtn);
    }

    var phone = findPhoneLink();
    if (phone) {
      var callBtn = document.createElement("a");
      callBtn.className = "btn btn-ghost";
      callBtn.href = phone.href;
      callBtn.textContent = "Call " + phone.text;
      cta.appendChild(callBtn);
    }

    panel.appendChild(summary);
    panel.appendChild(note);
    panel.appendChild(cta);
    refs.body.appendChild(panel);
  }

  /* ------------------------------------------------------------------
     BOOKING — reached by tapping "Book this repair" (or a tier's price)
     on the result screen. Captures name/email/phone/preferred date+time
     right here in the hero card instead of sending the customer down to
     the bottom-of-page form, and submits straight to Formspree so the
     shop gets the exact device/repair/tier picked along with it.
     ------------------------------------------------------------------ */
  function paintBooking() {
    setQuestion("Book your repair");
    refs.body.innerHTML = "";

    var price = state.tier ? state.tier.price : state.model.repairs[state.issue.key];
    var serviceLine = state.model.label + " · " + state.issue.label.toLowerCase() +
      (state.tier ? " (" + state.tier.label + ")" : "") + " · " + priceText(price);

    var summary = el("div", "ifxest-booking-summary");
    var line1 = document.createElement("p");
    var strong = document.createElement("b");
    strong.textContent = state.model.label;
    line1.appendChild(strong);
    line1.appendChild(document.createTextNode(" · " + state.issue.label.toLowerCase() + (state.tier ? " (" + state.tier.label + ")" : "")));
    var line2 = el("p", "ifxest-booking-price");
    line2.textContent = priceText(price);
    summary.appendChild(line1);
    summary.appendChild(line2);

    var form = document.createElement("form");
    form.className = "ifxest-form";
    form.action = FORMSPREE_ENDPOINT;
    form.method = "POST";
    form.noValidate = true;

    form.appendChild(formField("Your name", "text", "name", "", true, "name"));
    form.appendChild(formField("Email", "email", "email", "", true, "email"));
    form.appendChild(formField("Phone number", "tel", "phone", "", true, "tel"));

    var dateRow = el("div", "ifxest-form-row");
    dateRow.appendChild(formField("Preferred date", "date", "date", "", true, ""));
    dateRow.appendChild(formField("Preferred time", "time", "time", "", true, ""));
    form.appendChild(dateRow);

    var submit = document.createElement("button");
    submit.type = "submit";
    submit.className = "btn btn-primary";
    submit.textContent = "Request this booking";
    form.appendChild(submit);

    var msg = el("p", "ifxest-form-msg");
    msg.setAttribute("role", "status");
    msg.hidden = true;
    form.appendChild(msg);

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var fields = form.querySelectorAll("input, button[type=submit]");
      submitToFormspree(form, msg, {
        subject: "New booking request: " + state.model.label + " " + state.issue.label,
        successText: "✓ Thanks, we'll call or email you to confirm your appointment.",
        extra: { service: serviceLine, device_category: state.device.label, brand: state.brand && !state.brand.isOther ? state.brand.label : "" },
        onSuccess: function () { for (var i = 0; i < fields.length; i++) fields[i].disabled = true; }
      });
    });

    refs.body.appendChild(summary);
    refs.body.appendChild(form);
  }

  function paintOther() {
    setQuestion("Let's get you a real quote");

    refs.body.innerHTML = "";
    var note = el("p", "ifxest-note");
    note.textContent = "We couldn't find an exact match. Tell us a bit more and we'll follow up with a firm price.";

    var parts = [];
    if (state.device && !state.device.isOther) parts.push(state.device.label);
    if (state.brand && !state.brand.isOther) parts.push(state.brand.label);
    if (state.model && !state.model.isOther) parts.push(state.model.label);
    var deviceGuess = parts.join(" ");

    var form = document.createElement("form");
    form.className = "ifxest-form";
    form.action = FORMSPREE_ENDPOINT;
    form.method = "POST";
    form.noValidate = true;

    form.appendChild(formField("Your name", "text", "name", "", true, "name"));
    form.appendChild(formField("Phone number", "tel", "phone", "", true, "tel"));
    form.appendChild(formField("Device description", "text", "device", deviceGuess, false, ""));
    form.appendChild(formTextarea("What's wrong with it?", "issue"));

    var submit = document.createElement("button");
    submit.type = "submit";
    submit.className = "btn btn-primary";
    submit.textContent = "Send my quote request";
    form.appendChild(submit);

    var msg = el("p", "ifxest-form-msg");
    msg.setAttribute("role", "status");
    msg.hidden = true;
    form.appendChild(msg);

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var fields = form.querySelectorAll("input, textarea, button[type=submit]");
      submitToFormspree(form, msg, {
        subject: "New custom quote request: " + (deviceGuess || "device"),
        successText: "✓ Thanks, we'll follow up shortly.",
        onSuccess: function () { for (var i = 0; i < fields.length; i++) fields[i].disabled = true; }
      });
    });

    refs.body.appendChild(note);
    refs.body.appendChild(form);
  }

  function formField(labelText, type, name, value, required, autocomplete) {
    var label = document.createElement("label");
    label.className = "ifxest-field";
    var span = document.createElement("span");
    span.textContent = labelText;
    var input = document.createElement("input");
    input.type = type;
    input.name = name;
    input.value = value;
    if (required) input.required = true;
    if (autocomplete) input.autocomplete = autocomplete;
    label.appendChild(span);
    label.appendChild(input);
    return label;
  }

  function formTextarea(labelText, name) {
    var label = document.createElement("label");
    label.className = "ifxest-field";
    var span = document.createElement("span");
    span.textContent = labelText;
    var textarea = document.createElement("textarea");
    textarea.name = name;
    textarea.rows = 3;
    label.appendChild(span);
    label.appendChild(textarea);
    return label;
  }

  function findPhoneLink() {
    var a = document.querySelector('a[href^="tel:"]');
    if (!a) return null;
    return { href: a.getAttribute("href"), text: a.textContent.trim() };
  }

  /* ------------------------------------------------------------------
     AUTO-ADVANCE — never show a step with zero real choices, and skip
     straight through any step that only has exactly one.
     ------------------------------------------------------------------ */
  function advanceBrand() {
    var real = realOptions(state.device.brands);
    if (real.length === 0) { toOther(); return; }
    if (real.length === 1) { state.brand = real[0]; advanceModel(); return; }
    display("brand");
  }

  function advanceModel() {
    var real = realOptions(state.brand.models);
    if (real.length === 0) { toOther(); return; }
    if (real.length === 1) { state.model = real[0]; advanceIssue(); return; }
    display("model");
  }

  function advanceIssue() {
    var real = realOptions(availableIssues());
    if (real.length === 0) { toOther(); return; }
    display("issue");
  }

  function toOther() { display("other"); }

  /* ------------------------------------------------------------------
     NAVIGATION — `state.shown` only ever contains steps a user actually
     saw, so Back and Start over transparently skip over anything that
     was auto-advanced through.
     ------------------------------------------------------------------ */
  function goTo(stepName) {
    var idx = ORDER.indexOf(stepName);
    if (idx !== -1) {
      for (var i = idx; i < ORDER.length; i++) state[ORDER[i]] = null;
    }
    var sIdx = state.shown.indexOf(stepName);
    if (sIdx !== -1) state.shown.length = sIdx;
    display(stepName);
  }

  function goBack() {
    if (state.shown.length <= 1) return;
    state.shown.pop();
    var prev = state.shown[state.shown.length - 1];
    state.shown.pop();
    goTo(prev);
  }

  function reset() {
    state.device = state.brand = state.model = state.issue = state.tier = null;
    state.shown = [];
    display("device");
  }

  buildShell();
  display("device");
})();
