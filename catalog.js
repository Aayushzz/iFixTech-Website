
/* ==========================================================================
   iFixTech — CATALOG DATA
   Loaded BEFORE app.js. This file holds nothing but data: devices, brands,
   models, repair types and REAL prices, sourced from "Price List.xlsx".
   Edit it freely without touching app.js.

   ---------------------------------------------------------------------------
   HOW PRICING WORKS (real lookup, not a formula)
     Every model has a `repairs` object keyed by repair type. Each value is
     one of:
       a number   -> shown as "$123"
       "quote"    -> shown as "Call for quote" (no price on file yet)
       null       -> that repair isn't offered on this model at all, so it's
                     left out of the list entirely (e.g. Samsung phones have
                     no LCD screen tier, only Soft OLED + OEM)
       any other string (e.g. "Up to $170") -> shown exactly as written

     Screen repairs on phones/tablets are TIERED: `screen: { lcd, oled, oem }`
     (phones) or a plain `lcd` number (tablets, one tier). When a model has
     more than one tier priced, the estimator shows ALL of them at once,
     labelled LCD / Soft OLED (Recommended) / OEM.

   To reprice something, edit the number here — nothing else needs to change.
   To add a model, copy a sibling object and fill in its `repairs`.
   ---------------------------------------------------------------------------
   ADDING IMAGES
     Brands   -> add a path to BRAND_IMAGES below
     Models   -> add an `img` key: { n:"iPhone 15 Pro", repairs:{...},
                                     img:"images/devices/iphone-15-pro.jpg" }
     Anything without an image falls back to a drawn illustration or a
     wordmark automatically, so you can add photos a few at a time.
   ========================================================================== */

/* ------------------------------------------------------------------
   REPAIR TYPES per device category. `key` must match a property name
   inside every model's `repairs` object for that category. `tiered:true`
   means the price is an object of { lcd, oled, oem } instead of a
   single value, and the result view shows every priced tier at once.
   ------------------------------------------------------------------ */
var ISSUE_SETS = {
  phone: [
    { n: "Screen repair",              icon: "screen",   key: "screen", tiered: true },
    { n: "Battery",                    icon: "battery",  key: "battery" },
    { n: "Back glass",                 icon: "glass",    key: "backGlass" },
    { n: "Charging port",              icon: "port",     key: "chargingPort" },
    { n: "Rear camera",                icon: "camera",   key: "rearCamera" },
    { n: "Water damage",               icon: "water",    key: "waterDamage" },
    { n: "Board repair / data recovery", icon: "data",   key: "boardRepair" }
  ],
  tablet: [
    { n: "Glass / digitizer",          icon: "glass",    key: "glass" },
    { n: "LCD / screen assembly",      icon: "screen",   key: "lcd" },
    { n: "Battery",                    icon: "battery",  key: "battery" },
    { n: "Charging port",              icon: "port",     key: "chargingPort" },
    { n: "Board repair / data recovery", icon: "data",   key: "boardRepair" }
  ],
  laptop: [
    { n: "Screen",                     icon: "screen",   key: "screen" },
    { n: "Battery",                    icon: "battery",  key: "battery" },
    { n: "Keyboard",                   icon: "keyboard", key: "keyboard" },
    { n: "Liquid damage",              icon: "water",    key: "liquidDamage" },
    { n: "Board repair",               icon: "data",     key: "boardRepair" },
    { n: "Data recovery",              icon: "data",     key: "dataRecovery" }
  ],
  console: [
    { n: "HDMI port",                  icon: "hdmi",     key: "hdmi" },
    { n: "Won't power on (diagnostic)",icon: "power",    key: "noPower" },
    { n: "Deep clean + thermal",       icon: "heat",      key: "deepClean" },
    { n: "Hazard fee (infestation/corrosion)", icon: "water", key: "hazard" }
  ],
  watch: [
    { n: "Cracked screen",             icon: "screen",   key: "screen" },
    { n: "Battery",                    icon: "battery",  key: "battery" },
    { n: "Back glass",                 icon: "glass",    key: "backGlass" },
    { n: "Water damage",               icon: "water",    key: "waterDamage" },
    { n: "Won't turn on / board repair", icon: "power",  key: "boardRepair" }
  ]
};

/* ------------------------------------------------------------------
   BRAND IMAGES
   Brands repeat across categories (Apple appears under Phone, Tablet,
   Laptop and Smartwatch), so their artwork lives in one map rather than
   being repeated. Drop a file in images/brands/ and add it here.
   Leave a brand out and it falls back to a clean wordmark tile.
   Logos are fitted (never cropped) and centred on a white tile.
   ------------------------------------------------------------------ */
var BRAND_IMAGES = {
  // "Apple":     "images/brands/apple.svg",
  // "Samsung":   "images/brands/samsung.svg",
  // "Google":    "images/brands/google.svg",
  // "Motorola":  "images/brands/motorola.svg",
  // "Dell":      "images/brands/dell.svg",
  // "HP":        "images/brands/hp.svg",
  // "Lenovo":    "images/brands/lenovo.svg",
  // "Sony":      "images/brands/sony.svg",
  // "Microsoft": "images/brands/microsoft.svg",
  // "Nintendo":  "images/brands/nintendo.svg"
};

var CATALOG = {
  "Phone": {
    icon: "phone", issues: "phone",
    brands: {
      "Apple": [
        { n: "iPhone 17 Pro Max", repairs: { screen: { lcd: 119, oled: 249, oem: 419 }, battery: 140, backGlass: 120, chargingPort: null, rearCamera: 170, waterDamage: "quote", boardRepair: "quote" } },
        { n: "iPhone 17 Pro", repairs: { screen: { lcd: 119, oled: 229, oem: 419 }, battery: 140, backGlass: 120, chargingPort: 160, rearCamera: 170, waterDamage: "quote", boardRepair: "quote" } },
        { n: "iPhone 17", repairs: { screen: { lcd: 119, oled: 199, oem: 379 }, battery: 130, backGlass: 120, chargingPort: null, rearCamera: 150, waterDamage: "quote", boardRepair: "quote" } },
        { n: "iPhone 17e", repairs: { screen: { lcd: 90, oled: 159, oem: 180 }, battery: 100, backGlass: 120, chargingPort: 120, rearCamera: 130, waterDamage: "quote", boardRepair: "quote" } },
        { n: "iPhone Air", repairs: { screen: { lcd: null, oled: 229, oem: 379 }, battery: 130, backGlass: 120, chargingPort: 150, rearCamera: 170, waterDamage: "quote", boardRepair: "quote" } },
        { n: "iPhone 16 Pro Max", repairs: { screen: { lcd: 109, oled: 229, oem: 399 }, battery: 120, backGlass: 120, chargingPort: 140, rearCamera: 140, waterDamage: "quote", boardRepair: "quote" } },
        { n: "iPhone 16 Pro", repairs: { screen: { lcd: 109, oled: 199, oem: 329 }, battery: 120, backGlass: 120, chargingPort: 140, rearCamera: 140, waterDamage: "quote", boardRepair: "quote" } },
        { n: "iPhone 16 Plus", repairs: { screen: { lcd: 109, oled: 179, oem: 249 }, battery: 120, backGlass: 120, chargingPort: 130, rearCamera: 140, waterDamage: "quote", boardRepair: "quote" } },
        { n: "iPhone 16", repairs: { screen: { lcd: 99, oled: 159, oem: 279 }, battery: 120, backGlass: 120, chargingPort: 120, rearCamera: 130, waterDamage: "quote", boardRepair: "quote" } },
        { n: "iPhone 16e", repairs: { screen: { lcd: 90, oled: 160, oem: 180 }, battery: 100, backGlass: 120, chargingPort: 120, rearCamera: 130, waterDamage: "quote", boardRepair: "quote" } },
        { n: "iPhone 15 Pro Max", repairs: { screen: { lcd: 109, oled: 159, oem: 299 }, battery: 120, backGlass: 120, chargingPort: 120, rearCamera: 140, waterDamage: "quote", boardRepair: "quote" } },
        { n: "iPhone 15 Pro", repairs: { screen: { lcd: 99, oled: 159, oem: 299 }, battery: 120, backGlass: 120, chargingPort: 120, rearCamera: 140, waterDamage: "quote", boardRepair: "quote" } },
        { n: "iPhone 15 Plus", repairs: { screen: { lcd: 99, oled: 159, oem: 249 }, battery: 100, backGlass: 120, chargingPort: 120, rearCamera: 120, waterDamage: "quote", boardRepair: "quote" } },
        { n: "iPhone 15", repairs: { screen: { lcd: 99, oled: 159, oem: 249 }, battery: 100, backGlass: 120, chargingPort: 110, rearCamera: 120, waterDamage: "quote", boardRepair: "quote" } },
        { n: "iPhone 14 Pro Max", repairs: { screen: { lcd: 109, oled: 159, oem: 299 }, battery: 120, backGlass: 120, chargingPort: 100, rearCamera: 140, waterDamage: "quote", boardRepair: "quote" } },
        { n: "iPhone 14 Pro", repairs: { screen: { lcd: 99, oled: 159, oem: 249 }, battery: 120, backGlass: 120, chargingPort: 100, rearCamera: 140, waterDamage: "quote", boardRepair: "quote" } },
        { n: "iPhone 14 Plus", repairs: { screen: { lcd: 99, oled: 149, oem: 249 }, battery: 120, backGlass: 100, chargingPort: 100, rearCamera: 130, waterDamage: "quote", boardRepair: "quote" } },
        { n: "iPhone 14", repairs: { screen: { lcd: 89, oled: 149, oem: 199 }, battery: 100, backGlass: 100, chargingPort: 100, rearCamera: 130, waterDamage: "quote", boardRepair: "quote" } },
        { n: "iPhone 13 Pro Max", repairs: { screen: { lcd: 99, oled: 159, oem: 219 }, battery: 120, backGlass: 100, chargingPort: 100, rearCamera: 130, waterDamage: "quote", boardRepair: "quote" } },
        { n: "iPhone 13 Pro", repairs: { screen: { lcd: 99, oled: 159, oem: 199 }, battery: 110, backGlass: 100, chargingPort: 100, rearCamera: 130, waterDamage: "quote", boardRepair: "quote" } },
        { n: "iPhone 13", repairs: { screen: { lcd: 89, oled: 149, oem: 169 }, battery: 110, backGlass: 90, chargingPort: 100, rearCamera: 110, waterDamage: "quote", boardRepair: "quote" } },
        { n: "iPhone 13 mini", repairs: { screen: { lcd: 90, oled: null, oem: 200 }, battery: 110, backGlass: 90, chargingPort: 100, rearCamera: 110, waterDamage: "quote", boardRepair: "quote" } },
        { n: "iPhone 12 Pro Max", repairs: { screen: { lcd: 90, oled: 149, oem: 210 }, battery: 110, backGlass: 90, chargingPort: 90, rearCamera: 130, waterDamage: "quote", boardRepair: "quote" } },
        { n: "iPhone 12 Pro", repairs: { screen: { lcd: 80, oled: 139, oem: 170 }, battery: 100, backGlass: 90, chargingPort: 90, rearCamera: 150, waterDamage: "quote", boardRepair: "quote" } },
        { n: "iPhone 12", repairs: { screen: { lcd: 80, oled: 140, oem: 170 }, battery: 100, backGlass: 90, chargingPort: 90, rearCamera: 100, waterDamage: "quote", boardRepair: "quote" } },
        { n: "iPhone 12 mini", repairs: { screen: { lcd: 90, oled: 140, oem: 170 }, battery: 90, backGlass: 90, chargingPort: 90, rearCamera: 100, waterDamage: "quote", boardRepair: "quote" } },
        { n: "iPhone 11 Pro Max", repairs: { screen: { lcd: 80, oled: 140, oem: 170 }, battery: 90, backGlass: 80, chargingPort: 80, rearCamera: 100, waterDamage: "quote", boardRepair: "quote" } },
        { n: "iPhone 11 Pro", repairs: { screen: { lcd: 80, oled: 140, oem: 160 }, battery: 90, backGlass: 80, chargingPort: 80, rearCamera: 100, waterDamage: "quote", boardRepair: "quote" } },
        { n: "iPhone 11", repairs: { screen: { lcd: null, oled: 90, oem: 120 }, battery: 80, backGlass: 80, chargingPort: 80, rearCamera: 80, waterDamage: "quote", boardRepair: "quote" } },
        { n: "iPhone XR", repairs: { screen: { lcd: null, oled: 90, oem: 120 }, battery: 80, backGlass: 80, chargingPort: 80, rearCamera: 80, waterDamage: "quote", boardRepair: "quote" } },
        { n: "iPhone XS Max", repairs: { screen: { lcd: 80, oled: 120, oem: 150 }, battery: 75, backGlass: 80, chargingPort: 80, rearCamera: 70, waterDamage: "quote", boardRepair: "quote" } },
        { n: "iPhone XS", repairs: { screen: { lcd: 80, oled: 120, oem: 140 }, battery: 75, backGlass: 80, chargingPort: 80, rearCamera: 70, waterDamage: "quote", boardRepair: "quote" } },
        { n: "iPhone X", repairs: { screen: { lcd: 80, oled: 120, oem: 140 }, battery: 75, backGlass: 80, chargingPort: 80, rearCamera: 70, waterDamage: "quote", boardRepair: "quote" } },
        { n: "iPhone SE (2022)", repairs: { screen: { lcd: null, oled: 70, oem: 80 }, battery: 70, backGlass: 70, chargingPort: 70, rearCamera: 60, waterDamage: "quote", boardRepair: "quote" } },
        { n: "iPhone SE (2020)", repairs: { screen: { lcd: null, oled: 70, oem: 80 }, battery: 70, backGlass: 70, chargingPort: 70, rearCamera: 60, waterDamage: "quote", boardRepair: "quote" } },
        { n: "iPhone 8 Plus", repairs: { screen: { lcd: null, oled: 80, oem: 100 }, battery: 70, backGlass: 70, chargingPort: 70, rearCamera: 60, waterDamage: "quote", boardRepair: "quote" } },
        { n: "iPhone 8", repairs: { screen: { lcd: null, oled: 70, oem: 80 }, battery: 70, backGlass: 70, chargingPort: 70, rearCamera: 60, waterDamage: "quote", boardRepair: "quote" } },
        { n: "iPhone 7 Plus", repairs: { screen: { lcd: null, oled: 80, oem: 100 }, battery: 60, backGlass: null, chargingPort: 70, rearCamera: 60, waterDamage: "quote", boardRepair: "quote" } },
        { n: "iPhone 7", repairs: { screen: { lcd: null, oled: 70, oem: 80 }, battery: 60, backGlass: null, chargingPort: 70, rearCamera: 60, waterDamage: "quote", boardRepair: "quote" } }
      ],
      "Samsung": [
        { n: "Galaxy S26 Ultra", repairs: { screen: { lcd: null, oled: 220, oem: 350 }, battery: 100, backGlass: 90, chargingPort: 90, rearCamera: "quote", waterDamage: "quote", boardRepair: "quote" } },
        { n: "Galaxy S26+", repairs: { screen: { lcd: null, oled: 220, oem: 330 }, battery: 100, backGlass: 90, chargingPort: 90, rearCamera: "quote", waterDamage: "quote", boardRepair: "quote" } },
        { n: "Galaxy S26 FE", repairs: { screen: { lcd: null, oled: null, oem: null }, battery: 100, backGlass: 90, chargingPort: 90, rearCamera: "quote", waterDamage: "quote", boardRepair: "quote" } },
        { n: "Galaxy S26", repairs: { screen: { lcd: null, oled: null, oem: 260 }, battery: 100, backGlass: 90, chargingPort: 90, rearCamera: "quote", waterDamage: "quote", boardRepair: "quote" } },
        { n: "Galaxy S25 Ultra", repairs: { screen: { lcd: null, oled: 220, oem: 330 }, battery: 100, backGlass: 90, chargingPort: 90, rearCamera: "quote", waterDamage: "quote", boardRepair: "quote" } },
        { n: "Galaxy S25+", repairs: { screen: { lcd: null, oled: 170, oem: 270 }, battery: 100, backGlass: 90, chargingPort: 90, rearCamera: "quote", waterDamage: "quote", boardRepair: "quote" } },
        { n: "Galaxy S25 Edge", repairs: { screen: { lcd: null, oled: 250, oem: 350 }, battery: 100, backGlass: 90, chargingPort: 90, rearCamera: "quote", waterDamage: "quote", boardRepair: "quote" } },
        { n: "Galaxy S25", repairs: { screen: { lcd: null, oled: 200, oem: 230 }, battery: 100, backGlass: 90, chargingPort: 90, rearCamera: "quote", waterDamage: "quote", boardRepair: "quote" } },
        { n: "Galaxy S24 Ultra", repairs: { screen: { lcd: null, oled: 220, oem: 320 }, battery: 100, backGlass: 90, chargingPort: 90, rearCamera: "quote", waterDamage: "quote", boardRepair: "quote" } },
        { n: "Galaxy S24+", repairs: { screen: { lcd: null, oled: 200, oem: 240 }, battery: 100, backGlass: 90, chargingPort: 90, rearCamera: "quote", waterDamage: "quote", boardRepair: "quote" } },
        { n: "Galaxy S24", repairs: { screen: { lcd: null, oled: 200, oem: 230 }, battery: 100, backGlass: 70, chargingPort: 90, rearCamera: "quote", waterDamage: "quote", boardRepair: "quote" } },
        { n: "Galaxy S23 Ultra", repairs: { screen: { lcd: null, oled: 175, oem: 320 }, battery: 100, backGlass: 70, chargingPort: 80, rearCamera: "quote", waterDamage: "quote", boardRepair: "quote" } },
        { n: "Galaxy S23+", repairs: { screen: { lcd: null, oled: 160, oem: 230 }, battery: 100, backGlass: 70, chargingPort: 80, rearCamera: "quote", waterDamage: "quote", boardRepair: "quote" } },
        { n: "Galaxy S23", repairs: { screen: { lcd: null, oled: 180, oem: 240 }, battery: 100, backGlass: 70, chargingPort: 80, rearCamera: "quote", waterDamage: "quote", boardRepair: "quote" } },
        { n: "Galaxy S22 Ultra", repairs: { screen: { lcd: null, oled: 170, oem: 320 }, battery: 100, backGlass: 70, chargingPort: 80, rearCamera: "quote", waterDamage: "quote", boardRepair: "quote" } },
        { n: "Galaxy S22", repairs: { screen: { lcd: null, oled: 200, oem: 240 }, battery: 80, backGlass: 70, chargingPort: 80, rearCamera: "quote", waterDamage: "quote", boardRepair: "quote" } },
        { n: "Galaxy S21 Ultra", repairs: { screen: { lcd: null, oled: 175, oem: 260 }, battery: 80, backGlass: 70, chargingPort: 70, rearCamera: "quote", waterDamage: "quote", boardRepair: "quote" } },
        { n: "Galaxy S21 FE", repairs: { screen: { lcd: null, oled: 120, oem: 220 }, battery: 80, backGlass: 70, chargingPort: 70, rearCamera: "quote", waterDamage: "quote", boardRepair: "quote" } },
        { n: "Galaxy S21", repairs: { screen: { lcd: null, oled: 170, oem: 220 }, battery: 80, backGlass: 70, chargingPort: 70, rearCamera: "quote", waterDamage: "quote", boardRepair: "quote" } },
        { n: "Galaxy S20 Ultra", repairs: { screen: { lcd: null, oled: 170, oem: 270 }, battery: 80, backGlass: 60, chargingPort: 70, rearCamera: "quote", waterDamage: "quote", boardRepair: "quote" } },
        { n: "Galaxy S20+", repairs: { screen: { lcd: null, oled: 150, oem: 220 }, battery: 80, backGlass: 60, chargingPort: 70, rearCamera: "quote", waterDamage: "quote", boardRepair: "quote" } },
        { n: "Galaxy S20FE", repairs: { screen: { lcd: null, oled: 120, oem: 160 }, battery: 80, backGlass: 60, chargingPort: 70, rearCamera: "quote", waterDamage: "quote", boardRepair: "quote" } },
        { n: "Galaxy S20", repairs: { screen: { lcd: null, oled: 170, oem: 220 }, battery: 80, backGlass: 60, chargingPort: 70, rearCamera: "quote", waterDamage: "quote", boardRepair: "quote" } },
        { n: "Galaxy Note 20 Ultra", repairs: { screen: { lcd: null, oled: 180, oem: 300 }, battery: 80, backGlass: 60, chargingPort: 70, rearCamera: "quote", waterDamage: "quote", boardRepair: "quote" } }
      ],
      "Google": [
        { n: "Pixel 10 Pro XL", repairs: { screen: { lcd: null, oled: null, oem: 250 }, battery: 100, backGlass: "quote", chargingPort: "quote", rearCamera: "quote", waterDamage: "quote", boardRepair: "quote" } },
        { n: "Pixel 10 Pro", repairs: { screen: { lcd: null, oled: null, oem: 200 }, battery: 100, backGlass: "quote", chargingPort: "quote", rearCamera: "quote", waterDamage: "quote", boardRepair: "quote" } },
        { n: "Pixel 10/10A", repairs: { screen: { lcd: null, oled: null, oem: 200 }, battery: 100, backGlass: "quote", chargingPort: "quote", rearCamera: "quote", waterDamage: "quote", boardRepair: "quote" } },
        { n: "Pixel 9 Pro XL", repairs: { screen: { lcd: null, oled: 175, oem: 250 }, battery: 100, backGlass: "quote", chargingPort: "quote", rearCamera: "quote", waterDamage: "quote", boardRepair: "quote" } },
        { n: "Pixel 9 Pro", repairs: { screen: { lcd: null, oled: null, oem: 190 }, battery: 80, backGlass: "quote", chargingPort: "quote", rearCamera: "quote", waterDamage: "quote", boardRepair: "quote" } },
        { n: "Pixel 9/9A", repairs: { screen: { lcd: null, oled: null, oem: 220 }, battery: 80, backGlass: "quote", chargingPort: "quote", rearCamera: "quote", waterDamage: "quote", boardRepair: "quote" } },
        { n: "Pixel 8 Pro", repairs: { screen: { lcd: null, oled: 140, oem: 240 }, battery: 80, backGlass: "quote", chargingPort: "quote", rearCamera: "quote", waterDamage: "quote", boardRepair: "quote" } },
        { n: "Pixel 8", repairs: { screen: { lcd: null, oled: 140, oem: 200 }, battery: 80, backGlass: "quote", chargingPort: "quote", rearCamera: "quote", waterDamage: "quote", boardRepair: "quote" } },
        { n: "Pixel 7 Pro", repairs: { screen: { lcd: null, oled: 140, oem: 250 }, battery: 70, backGlass: "quote", chargingPort: "quote", rearCamera: "quote", waterDamage: "quote", boardRepair: "quote" } },
        { n: "Pixel 7", repairs: { screen: { lcd: null, oled: 140, oem: 220 }, battery: 70, backGlass: "quote", chargingPort: "quote", rearCamera: "quote", waterDamage: "quote", boardRepair: "quote" } },
        { n: "Pixel 6 Pro", repairs: { screen: { lcd: null, oled: 140, oem: 220 }, battery: 70, backGlass: "quote", chargingPort: "quote", rearCamera: "quote", waterDamage: "quote", boardRepair: "quote" } },
        { n: "Pixel 6", repairs: { screen: { lcd: null, oled: 140, oem: 200 }, battery: 70, backGlass: "quote", chargingPort: "quote", rearCamera: "quote", waterDamage: "quote", boardRepair: "quote" } },
        { n: "Pixel 6a", repairs: { screen: { lcd: null, oled: 160, oem: 180 }, battery: 70, backGlass: "quote", chargingPort: "quote", rearCamera: "quote", waterDamage: "quote", boardRepair: "quote" } }
      ],
      /* Not on the price list (grouped there under "Other Android — Call
         For Quote") — kept as its own brand since we already have the logo,
         but every repair is quote-only until it's priced. */
      "Motorola": [
        { n: "Edge 50", repairs: { screen: { lcd: "quote", oled: "quote", oem: "quote" }, battery: "quote", backGlass: "quote", chargingPort: "quote", rearCamera: "quote", waterDamage: "quote", boardRepair: "quote" } },
        { n: "Edge 40", repairs: { screen: { lcd: "quote", oled: "quote", oem: "quote" }, battery: "quote", backGlass: "quote", chargingPort: "quote", rearCamera: "quote", waterDamage: "quote", boardRepair: "quote" } },
        { n: "Moto G", repairs: { screen: { lcd: "quote", oled: "quote", oem: "quote" }, battery: "quote", backGlass: "quote", chargingPort: "quote", rearCamera: "quote", waterDamage: "quote", boardRepair: "quote" } },
        { n: "Razr", repairs: { screen: { lcd: "quote", oled: "quote", oem: "quote" }, battery: "quote", backGlass: "quote", chargingPort: "quote", rearCamera: "quote", waterDamage: "quote", boardRepair: "quote" } }
      ],
      "Other brand": [ { n: "Not sure / other", isOther: true } ]
    }
  },
  "Tablet": {
    icon: "tablet", issues: "tablet",
    brands: {
      "Apple": [
        { n: "iPad Pro 12.9\" 5th/6th Gen", repairs: { glass: null, lcd: 320, battery: 140, chargingPort: 120, boardRepair: "quote" } },
        { n: "iPad Pro 12.9\" 3rd/4th Gen", repairs: { glass: null, lcd: 240, battery: 120, chargingPort: 120, boardRepair: "quote" } },
        { n: "iPad Pro 12.9\" 2nd Gen", repairs: { glass: null, lcd: 350, battery: 120, chargingPort: 120, boardRepair: "quote" } },
        { n: "iPad Pro 12.9\" 1st Gen", repairs: { glass: null, lcd: 240, battery: 120, chargingPort: 100, boardRepair: "quote" } },
        { n: "iPad Pro 11\" 3rd/4th Gen", repairs: { glass: null, lcd: 240, battery: 120, chargingPort: 120, boardRepair: "quote" } },
        { n: "iPad Pro 11\" 2nd/1st Gen", repairs: { glass: null, lcd: 220, battery: 120, chargingPort: 100, boardRepair: "quote" } },
        { n: "iPad Pro 10.5", repairs: { glass: null, lcd: 160, battery: 120, chargingPort: 100, boardRepair: "quote" } },
        { n: "iPad Pro 9.7", repairs: { glass: null, lcd: 160, battery: 120, chargingPort: 100, boardRepair: "quote" } },
        { n: "iPad Air 4th/5th Gen", repairs: { glass: null, lcd: 240, battery: 120, chargingPort: 120, boardRepair: "quote" } },
        { n: "iPad A16 / 10", repairs: { glass: 140, lcd: 200, battery: 120, chargingPort: 120, boardRepair: "quote" } },
        { n: "iPad 7/8/9", repairs: { glass: 120, lcd: 80, battery: 100, chargingPort: 120, boardRepair: "quote" } },
        { n: "iPad 6", repairs: { glass: 100, lcd: 70, battery: 100, chargingPort: 120, boardRepair: "quote" } }
      ],
      "Samsung": [
        { n: "Galaxy Tab S9 Ultra", repairs: { glass: "quote", lcd: "quote", battery: "quote", chargingPort: "quote", boardRepair: "quote" } },
        { n: "Galaxy Tab S9", repairs: { glass: "quote", lcd: "quote", battery: "quote", chargingPort: "quote", boardRepair: "quote" } },
        { n: "Galaxy Tab S8", repairs: { glass: "quote", lcd: "quote", battery: "quote", chargingPort: "quote", boardRepair: "quote" } },
        { n: "Galaxy Tab A9", repairs: { glass: "quote", lcd: "quote", battery: "quote", chargingPort: "quote", boardRepair: "quote" } },
        { n: "Galaxy Tab A8", repairs: { glass: "quote", lcd: "quote", battery: "quote", chargingPort: "quote", boardRepair: "quote" } }
      ],
      "Amazon": [
        { n: "Fire HD 10", repairs: { glass: "quote", lcd: "quote", battery: "quote", chargingPort: "quote", boardRepair: "quote" } },
        { n: "Fire HD 8", repairs: { glass: "quote", lcd: "quote", battery: "quote", chargingPort: "quote", boardRepair: "quote" } }
      ],
      "Lenovo": [
        { n: "Lenovo Tab", repairs: { glass: "quote", lcd: "quote", battery: "quote", chargingPort: "quote", boardRepair: "quote" } }
      ],
      "Other brand": [ { n: "Not sure / other", isOther: true } ]
    }
  },
  "Laptop": {
    icon: "laptop", issues: "laptop",
    brands: {
      /* Windows + Mac laptop repairs are priced after an in-person or photo
         diagnostic (boards, panels and keyboards vary too much by exact
         model/SKU to quote blind) — every entry here is quote-only for now.
         Add real numbers per model here the same way phones/tablets are done. */
      "Apple": [
        { n: "MacBook Air M3", repairs: { screen: "quote", battery: "quote", keyboard: "quote", liquidDamage: "quote", boardRepair: "quote", dataRecovery: "quote" } },
        { n: "MacBook Air M2", repairs: { screen: "quote", battery: "quote", keyboard: "quote", liquidDamage: "quote", boardRepair: "quote", dataRecovery: "quote" } },
        { n: "MacBook Air M1", repairs: { screen: "quote", battery: "quote", keyboard: "quote", liquidDamage: "quote", boardRepair: "quote", dataRecovery: "quote" } },
        { n: "MacBook Pro 14\" (M-Series)", repairs: { screen: "quote", battery: "quote", keyboard: "quote", liquidDamage: "quote", boardRepair: "quote", dataRecovery: "quote" } },
        { n: "MacBook Pro 16\" (M-Series)", repairs: { screen: "quote", battery: "quote", keyboard: "quote", liquidDamage: "quote", boardRepair: "quote", dataRecovery: "quote" } },
        { n: "MacBook Pro 13\" (Intel)", repairs: { screen: "quote", battery: "quote", keyboard: "quote", liquidDamage: "quote", boardRepair: "quote", dataRecovery: "quote" } },
        { n: "iMac 24", repairs: { screen: "quote", battery: "quote", keyboard: "quote", liquidDamage: "quote", boardRepair: "quote", dataRecovery: "quote" } }
      ],
      "Dell":     [ { n: "Any Dell model", repairs: { screen: "quote", battery: "quote", keyboard: "quote", liquidDamage: "quote", boardRepair: "quote", dataRecovery: "quote" } } ],
      "HP":       [ { n: "Any HP model", repairs: { screen: "quote", battery: "quote", keyboard: "quote", liquidDamage: "quote", boardRepair: "quote", dataRecovery: "quote" } } ],
      "Lenovo":   [ { n: "Any Lenovo model", repairs: { screen: "quote", battery: "quote", keyboard: "quote", liquidDamage: "quote", boardRepair: "quote", dataRecovery: "quote" } } ],
      "ASUS":     [ { n: "Any ASUS model", repairs: { screen: "quote", battery: "quote", keyboard: "quote", liquidDamage: "quote", boardRepair: "quote", dataRecovery: "quote" } } ],
      "Acer":     [ { n: "Any Acer model", repairs: { screen: "quote", battery: "quote", keyboard: "quote", liquidDamage: "quote", boardRepair: "quote", dataRecovery: "quote" } } ],
      "Microsoft Surface": [ { n: "Any Surface model", repairs: { screen: "quote", battery: "quote", keyboard: "quote", liquidDamage: "quote", boardRepair: "quote", dataRecovery: "quote" } } ],
      "Other brand": [ { n: "Not sure / other", isOther: true } ]
    }
  },
  "Console": {
    icon: "console", issues: "console",
    brands: {
      "Sony": [
        { n: "PlayStation 5 / Slim / Pro", repairs: { hdmi: 130, noPower: "Up to $170", deepClean: 100, hazard: 60 } },
        { n: "PlayStation 4", repairs: { hdmi: "quote", noPower: "quote", deepClean: "quote", hazard: "quote" } },
        { n: "DualSense controller", repairs: { hdmi: "quote", noPower: "quote", deepClean: "quote", hazard: "quote" } }
      ],
      "Microsoft": [
        { n: "Xbox Series X/S", repairs: { hdmi: 130, noPower: "Up to $170", deepClean: 100, hazard: 60 } },
        { n: "Xbox One", repairs: { hdmi: "quote", noPower: "quote", deepClean: "quote", hazard: "quote" } },
        { n: "Xbox controller", repairs: { hdmi: "quote", noPower: "quote", deepClean: "quote", hazard: "quote" } }
      ],
      /* Not on the price list — quote-only until priced. */
      "Nintendo": [
        { n: "Switch 2", repairs: { hdmi: "quote", noPower: "quote", deepClean: "quote", hazard: "quote" } },
        { n: "Switch OLED", repairs: { hdmi: "quote", noPower: "quote", deepClean: "quote", hazard: "quote" } },
        { n: "Switch", repairs: { hdmi: "quote", noPower: "quote", deepClean: "quote", hazard: "quote" } },
        { n: "Switch Lite", repairs: { hdmi: "quote", noPower: "quote", deepClean: "quote", hazard: "quote" } },
        { n: "Joy-Con pair", repairs: { hdmi: "quote", noPower: "quote", deepClean: "quote", hazard: "quote" } }
      ],
      "Other brand": [ { n: "Not sure / other", isOther: true } ]
    }
  },
  /* Not covered by Price List.xlsx at all — every repair is quote-only. */
  "Smartwatch": {
    icon: "watch", issues: "watch",
    brands: {
      "Apple":   [
        { n: "Apple Watch Ultra", repairs: { screen: "quote", battery: "quote", backGlass: "quote", waterDamage: "quote", boardRepair: "quote" } },
        { n: "Series 9 / 10", repairs: { screen: "quote", battery: "quote", backGlass: "quote", waterDamage: "quote", boardRepair: "quote" } },
        { n: "Series 6-8", repairs: { screen: "quote", battery: "quote", backGlass: "quote", waterDamage: "quote", boardRepair: "quote" } },
        { n: "Watch SE", repairs: { screen: "quote", battery: "quote", backGlass: "quote", waterDamage: "quote", boardRepair: "quote" } }
      ],
      "Samsung": [
        { n: "Galaxy Watch Ultra", repairs: { screen: "quote", battery: "quote", backGlass: "quote", waterDamage: "quote", boardRepair: "quote" } },
        { n: "Galaxy Watch", repairs: { screen: "quote", battery: "quote", backGlass: "quote", waterDamage: "quote", boardRepair: "quote" } }
      ],
      "Garmin": [ { n: "Garmin watch", repairs: { screen: "quote", battery: "quote", backGlass: "quote", waterDamage: "quote", boardRepair: "quote" } } ],
      "Other brand": [ { n: "Not sure / other", isOther: true } ]
    }
  }
};
