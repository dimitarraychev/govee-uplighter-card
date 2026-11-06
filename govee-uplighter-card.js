/*
 * Govee Uplighter Card
 * Power, brightness, colors, light segments, scenes and music mode for a
 * Govee uplighter lamp in one standalone card. Mushroom or Bubble styling.
 * Works on a dashboard or inside a Bubble Card pop-up.
 */
const TAG = "govee-uplighter-card";
const EDITOR_TAG = "govee-uplighter-card-editor";
const CARD_VERSION = "0.2.1-beta";

const OFF_RGB = "142,142,147";
const WARM_RGB = "255,193,7";
const MUSIC_RGB = "175,82,222";
const UNAVAILABLE = ["unavailable", "unknown"];
const COLOR_MODES = ["hs", "xy", "rgb", "rgbw", "rgbww"];

const DEFAULT_COLORS = ["#ff3b30", "#ff9500", "#ffcc00", "#34c759", "#00c7be", "#007aff", "#af52de", "#ff2d92", "#ffffff"];
// Default highlight color per scene (the "Govee Effect Color Map"), as [r, g, b].
// A color set on a scene in the card config always wins over this map.
const SCENE_COLOR_MAP = {
  "Sleep": [255, 145, 15], "Dracarys": [255, 69, 0], "Green Reign": [76, 175, 80],
  "Fire & Blood": [183, 28, 28], "Fire": [255, 87, 34], "Venus": [255, 150, 40],
  "Neptune": [30, 60, 200], "Earth B": [46, 139, 87], "Nebula": [156, 39, 176],
  "Starry Sky": [25, 25, 112], "Meteor": [255, 140, 0], "Milky Way": [75, 0, 130],
  "Space Walk": [0, 31, 63], "Cosmic Echoes": [138, 43, 226], "Interstellar Voyage": [63, 81, 181],
  "Vast Cosmos": [48, 25, 52], "Mercury": [169, 169, 169], "Earth": [65, 105, 225],
  "Mars": [193, 68, 14], "Jupiter": [222, 184, 135], "Saturn": [238, 220, 130],
  "Uranus": [127, 255, 212], "Dusk": [255, 94, 77], "Desert": [255, 128, 0],
  "Star": [255, 255, 224], "Water Drop": [135, 206, 250], "Sunset": [255, 99, 71],
  "Sunrise": [255, 193, 7], "Aurora": [0, 255, 170], "Aurora B": [0, 230, 190],
  "Aurora C": [0, 210, 210], "Aurora D": [0, 190, 230], "Sunny": [255, 215, 0],
  "Forest": [34, 139, 34], "Ocean": [0, 119, 190], "Sunset Glow": [255, 87, 34],
  "Rainbow": [216, 27, 96], "Cornfield": [255, 104, 0], "Glacier": [176, 224, 230],
  "Bonfire": [255, 87, 34], "Stream": [100, 181, 246], "Cherry blossoms": [255, 183, 197],
  "Waterfall": [33, 150, 243], "Firefly": [255, 235, 59], "Snowing": [224, 247, 250],
  "Moonlight": [197, 202, 233], "Ghost": [178, 223, 219], "Christmas B": [211, 47, 47],
  "Halloween B": [255, 111, 0], "Heartbeat": [229, 57, 53], "New Years": [255, 215, 0],
  "Christmas": [211, 47, 47], "Candy Cane": [211, 47, 47], "Candy Cane B": [211, 47, 47],
  "Christmas Bell": [198, 40, 40], "Halloween": [255, 111, 0], "Graveyard": [69, 90, 100],
  "Easter": [186, 104, 200], "Easter Egg": [186, 104, 200], "Thanksgiving": [230, 126, 34],
  "Carnival": [233, 30, 99], "Valentine's Day": [233, 30, 99], "Father's Day": [33, 150, 243],
  "Mother's Day": [244, 143, 177], "Saint Patrick's Day": [67, 160, 71], "Birthday": [33, 150, 243],
  "Family Day": [255, 202, 58], "Party": [216, 27, 96], "Dance Party": [171, 71, 188],
  "Candlelight": [255, 152, 0], "Mother's Hug": [244, 143, 177], "White Light": [255, 244, 229],
  "Leisure": [0, 150, 136], "Soothing": [129, 212, 250], "Mysterious": [74, 20, 140],
  "Healing": [38, 166, 154], "Peaceful": [144, 202, 249], "Spritual": [149, 117, 205],
  "Joyful": [255, 235, 59], "Meditation": [179, 157, 219], "Dreamland": [206, 147, 216],
  "Gradient": [0, 172, 193], "Breathe": [100, 181, 246], "Twinkle": [255, 249, 196],
  "Graffiti": [233, 30, 99], "Flow": [3, 169, 244], "Alternate": [158, 158, 158],
  "Gleam": [255, 193, 7], "Cover": [117, 117, 117], "Colorful": [216, 27, 96],
  "Crossing": [0, 150, 136], "Yoga": [129, 199, 132], "Colorful Clouds": [206, 147, 216],
  "Moonlight Sprinkles": [197, 202, 233], "Floating Mist": [144, 164, 174], "Radiance": [255, 202, 40],
  "Wheat Wave": [255, 163, 51], "Mild": [255, 241, 224], "Refreshing": [0, 191, 165],
  "Clear Sky": [79, 195, 247], "Moonlit Night": [26, 35, 126], "Fascination": [186, 104, 200],
  "Spring Tour": [174, 213, 129], "Dreamlike": [179, 157, 219], "Blue Sky & White Clouds": [100, 181, 246],
  "Dense fog": [176, 190, 197], "Flash": [255, 255, 255], "Gary": [158, 158, 158],
  "Judy": [240, 98, 146], "Nick": [66, 133, 244], "ZDP Duo": [149, 117, 205],
  "ZDP Trio": [149, 117, 205], "Wave": [3, 155, 229], "Snow flake": [224, 247, 250],
  "Spring Wind": [174, 213, 129], "Sky": [79, 195, 247], "Falling Petals": [255, 183, 197],
  "Raining": [96, 125, 139], "Karst Cave": [69, 90, 100], "Mountain Forest": [27, 94, 32],
  "Feather": [236, 239, 241], "Spring": [174, 213, 129], "Summer": [255, 202, 40],
  "Fall": [230, 126, 34], "Winter": [178, 235, 242], "Lake": [0, 105, 146],
  "Reading": [255, 224, 178], "Night Light": [92, 107, 192], "Morning": [255, 213, 79],
  "Afternoon": [255, 179, 0], "Fish tank": [0, 172, 193], "Goldfish": [255, 152, 0],
  "Train": [96, 125, 139], "Kitchen Aromas": [255, 183, 77], "Smudge": [141, 110, 99],
  "Rubik's Cube": [216, 27, 96], "Interlaced": [3, 169, 244], "Swing": [255, 202, 40],
  "Pumpkin Spice": [230, 126, 34], "Christmas Baubles": [211, 47, 47], "Christmas Eve": [26, 35, 126],
  "Santa Hat": [211, 47, 47], "Christmas Stripe": [211, 47, 47], "Christmas Stripe B": [67, 160, 71],
  "Christmas Stripe C": [255, 215, 0], "Christmas Stripe D": [211, 47, 47], "Christmas Gift": [211, 47, 47],
  "Christmas Wreath": [67, 160, 71], "Snow House": [224, 247, 250], "Christmas Tree": [67, 160, 71],
  "Gingerbread Man": [141, 110, 99], "Christmas Stocking": [211, 47, 47], "Santa Claus": [211, 47, 47],
  "Grim Graveyard": [69, 90, 100], "Poison": [124, 179, 66], "Lightning Bats": [69, 90, 100],
  "Halloween Witches": [106, 27, 154], "Accompany": [255, 202, 40], "Night": [26, 35, 126],
};
const SCENE_COLORS = Object.fromEntries(
  Object.entries(SCENE_COLOR_MAP).map(([k, v]) => [k.toLowerCase(), v.join(",")])
);
const DEFAULT_SCENES = [
  { option: "Sleep", icon: "mdi:power-sleep" },
  { option: "Cornfield", icon: "mdi:corn" },
  { option: "Desert", icon: "mdi:island" },
  { option: "Venus", icon: "mdi:orbit" },
];
const SEGMENT_ICONS = [
  ["ripple", "mdi:waves"],
  ["side", "mdi:border-vertical"],
  ["bottom", "mdi:arrow-collapse-down"],
  ["top", "mdi:arrow-collapse-up"],
  ["dream", "mdi:television-ambient-light"],
];

const esc = (s) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const cap = (s) => String(s ?? "").replace(/_/g, " ").replace(/^./, (c) => c.toUpperCase());
// Govee duplicates scenes as "Sleep" and "Sleep (1)": compare without the suffix
const baseName = (s) => String(s ?? "").replace(/\s*\(\d+\)\s*$/, "").trim().toLowerCase();

// Accepts "#rgb", "#rrggbb", "r,g,b", "rgb(r,g,b)" or [r,g,b] -> "r,g,b"
const toRgb = (c) => {
  if (Array.isArray(c) && c.length === 3 && c.every((n) => Number.isFinite(Number(n)))) return c.map((n) => Math.round(Number(n))).join(",");
  if (typeof c !== "string") return null;
  const s = c.trim();
  const hex = s.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (hex) {
    let h = hex[1];
    if (h.length === 3) h = h.split("").map((x) => x + x).join("");
    return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)).join(",");
  }
  const m = s.match(/^(?:rgb\()?\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)?$/i);
  return m ? `${m[1]},${m[2]},${m[3]}` : null;
};
const rgbToHex = (rgb) => "#" + String(rgb).split(",").map((n) => Math.max(0, Math.min(255, Number(n))).toString(16).padStart(2, "0")).join("");
const segIcon = (key) => (SEGMENT_ICONS.find(([k]) => String(key).toLowerCase().includes(k)) || [0, "mdi:led-strip-variant"])[1];

// ---------- sections ----------
// The header is pinned on top, it can only be shown or hidden. The other
// sections can be shown, hidden and reordered. `sections` in the config is an
// ordered list of ids; hide one with `- id: music` + `show: false`. Sections
// that are not listed are hidden. Without `sections` the old show_* keys apply.
const SECTION_IDS = ["header", "brightness", "color", "segments", "scenes", "music"];
const SECTION_META = {
  header: { icon: "mdi:page-layout-header", label: "Header" },
  brightness: { icon: "mdi:brightness-6", label: "Brightness" },
  color: { icon: "mdi:palette", label: "Colors and white temperature" },
  segments: { icon: "mdi:led-strip-variant", label: "Light segments" },
  scenes: { icon: "mdi:auto-fix", label: "Scenes" },
  music: { icon: "mdi:music", label: "Music mode" },
};
function effectiveSections(cfg) {
  if (Array.isArray(cfg.sections)) {
    const seen = new Set();
    const out = [];
    cfg.sections.forEach((x) => {
      const o = typeof x === "string" ? { id: x } : x;
      if (!o || !SECTION_IDS.includes(o.id) || seen.has(o.id)) return;
      seen.add(o.id);
      out.push({ id: o.id, show: o.show !== false });
    });
    SECTION_IDS.forEach((id) => { if (!seen.has(id)) out.push({ id, show: false }); });
    // the header always stays on top
    return [out.find((x) => x.id === "header"), ...out.filter((x) => x.id !== "header")];
  }
  return SECTION_IDS.map((id) => ({ id, show: cfg[`show_${id}`] !== false }));
}
const resolveSections = (cfg) => effectiveSections(cfg).filter((x) => x.show).map((x) => x.id);

// ---------- entity discovery ----------
// The Govee entities share the light's name: light.<base>, switch.<base>_ripple_light,
// select.<base>_scene, ... so everything can be found from the light alone.
let _discoverCache = { key: "", value: null };
function discover(hass, entityId) {
  const states = hass?.states || {};
  const ids = Object.keys(states);
  const key = `${entityId}|${ids.length}`;
  if (_discoverCache.key === key) return _discoverCache.value;
  const base = String(entityId || "").split(".")[1] || "";
  const pick = (domain, suffix) => (states[`${domain}.${base}_${suffix}`] ? `${domain}.${base}_${suffix}` : null);
  const musicSwitch = pick("switch", "music_mode");
  const segments = ids
    .filter((id) => id.startsWith(`switch.${base}_`) && id !== musicSwitch)
    .sort((x, y) => {
      // known segments first in a sensible order, the rest alphabetical
      const rank = (id) => { const i = SEGMENT_ICONS.findIndex(([k]) => id.includes(k)); return i < 0 ? 99 : i; };
      return rank(x) - rank(y) || x.localeCompare(y);
    })
    .map((id) => {
      const suffix = id.split(".")[1].slice(base.length + 1);
      return { entity: id, name: cap(suffix.replace(/_light$/, "")), icon: segIcon(suffix) };
    });
  const value = {
    scene: pick("select", "scene"),
    musicMode: pick("select", "music_mode"),
    sensitivity: pick("number", "music_sensitivity"),
    musicSwitch,
    segments,
  };
  _discoverCache = { key, value };
  return value;
}

class GoveeUplighterCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._pend = {};
    this._lastSend = {};
    this._drag = null;
    this.shadowRoot.innerHTML = `
      <style>
        :host { display: block; }
        ha-card {
          --rgb: ${OFF_RGB};
          --icon-rgb: ${OFF_RGB};
          position: relative; overflow: hidden; box-sizing: border-box; padding: 12px;
          display: flex; flex-direction: column; gap: 12px;
          background: rgba(var(--rgb), .06);
          border: none; box-shadow: none;
          -webkit-backdrop-filter: blur(12px); backdrop-filter: blur(12px);
          transition: background .3s;
          color: var(--primary-text-color);
        }
        ha-card:not(.off) { background: rgba(var(--rgb), .08); }
        ha-card.active { animation: glow 3s ease-in-out infinite; }
        @keyframes glow {
          0%, 100% { box-shadow: inset 0 0 10px rgba(var(--rgb), .15); }
          50% { box-shadow: inset 0 0 25px rgba(var(--rgb), .38); }
        }
        @media (prefers-reduced-motion: reduce) {
          ha-card.active { animation: none; box-shadow: inset 0 0 14px rgba(var(--rgb), .22); }
        }
        ha-card.active.static { animation: none; box-shadow: inset 0 0 14px rgba(var(--rgb), .22); }
        ha-card.unavail .sec { opacity: .5; pointer-events: none; }
        [hidden] { display: none !important; }
        button { font-family: inherit; }
        .head:focus, .head:focus-visible, button:focus, select:focus { outline: none; }
        ha-card.kbd .head:focus-visible, ha-card.kbd button:focus-visible, ha-card.kbd select:focus-visible { outline: 2px solid rgb(var(--rgb)); outline-offset: 2px; }

        /* ---- header ---- */
        .head { display: flex; align-items: center; gap: 12px; cursor: pointer; -webkit-tap-highlight-color: transparent; border-radius: 16px; }
        .tile {
          flex: none; width: 65px; height: 65px; border-radius: 50%;
          margin: -18px -4px 0 -18px;
          display: flex; align-items: center; justify-content: center;
          color: rgb(var(--icon-rgb)); background: rgba(var(--icon-rgb), .2);
          transition: color .3s, background .3s;
        }
        .tile ha-icon { --mdc-icon-size: 44px; display: flex; }
        .info { flex: 1; min-width: 0; }
        .name { font-size: 14px; font-weight: 500; line-height: 1.5; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .sub { font-size: 12px; line-height: 1.5; color: var(--secondary-text-color); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .pwr {
          all: unset; box-sizing: border-box; cursor: pointer; flex: none; width: 44px; height: 44px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center; --mdc-icon-size: 24px;
          color: var(--secondary-text-color); background: color-mix(in srgb, var(--primary-text-color) 8%, transparent);
          transition: background .2s, color .2s, transform .1s; -webkit-tap-highlight-color: transparent;
        }
        .pwr:active { transform: scale(.9); }
        .pwr.on { color: rgb(var(--icon-rgb)); background: rgba(var(--icon-rgb), .2); }
        .pwr[disabled] { opacity: .3; pointer-events: none; }

        /* ---- sections ---- */
        .sec {
          box-sizing: border-box; padding: 10px 12px 12px; border-radius: 16px; display: flex; flex-direction: column; gap: 10px;
          background: color-mix(in srgb, var(--primary-text-color) 6%, transparent);
        }
        .stitle {
          display: flex; align-items: center; gap: 6px; min-height: 22px; font-size: 12px; font-weight: 600;
          letter-spacing: .4px; text-transform: uppercase; color: var(--secondary-text-color); --mdc-icon-size: 18px;
        }
        .stitle span { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .stitle b { font-weight: 600; letter-spacing: 0; text-transform: none; font-size: 13px; color: var(--primary-text-color); font-variant-numeric: tabular-nums; }
        .stitle.sm { margin-top: 2px; }

        /* ---- sliders (custom, so dragging works on iOS) ---- */
        .slider {
          --pct: 0%; position: relative; height: 34px; border-radius: 17px; cursor: pointer; outline: none;
          touch-action: pan-y; user-select: none; -webkit-user-select: none; -webkit-tap-highlight-color: transparent;
          background: linear-gradient(to right, rgba(var(--fill, var(--rgb)), .85) var(--pct), color-mix(in srgb, var(--primary-text-color) 16%, transparent) var(--pct));
          box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--primary-text-color) 10%, transparent);
        }
        .slider .thumb {
          position: absolute; top: 8px; bottom: 8px; width: 4px; border-radius: 2px; background: #fff; pointer-events: none;
          left: clamp(8px, calc(var(--pct) - 10px), calc(100% - 12px)); box-shadow: 0 0 3px rgba(0,0,0,.45);
        }
        .slider.ct { background: linear-gradient(to right, #ff9d3a, #fff3e0 50%, #a8d0ff); }
        .slider.ct .thumb {
          top: 0; bottom: 0; width: 8px; border-radius: 4px; left: clamp(0px, calc(var(--pct) - 4px), calc(100% - 8px));
          box-shadow: 0 0 0 2px rgba(0,0,0,.35);
        }
        ha-card.kbd .slider:focus-visible { outline: 2px solid rgb(var(--rgb)); outline-offset: 2px; }

        /* ---- color swatches ---- */
        .swatches { display: flex; flex-wrap: wrap; gap: 8px; }
        .sw {
          all: unset; box-sizing: border-box; position: relative; cursor: pointer; width: 30px; height: 30px; border-radius: 50%;
          background: rgb(var(--c)); box-shadow: inset 0 0 0 1px rgba(0,0,0,.18); transition: transform .1s, box-shadow .2s;
          display: flex; align-items: center; justify-content: center; -webkit-tap-highlight-color: transparent;
        }
        .sw:active { transform: scale(.9); }
        .sw.active { box-shadow: 0 0 0 2px var(--card-background-color, #1c1c1c), 0 0 0 4px rgb(var(--c)); }
        .sw.custom { background: conic-gradient(#ff3b30, #ffcc00, #34c759, #00c7be, #007aff, #af52de, #ff3b30); color: #fff; --mdc-icon-size: 16px; }
        .sw.custom ha-icon { filter: drop-shadow(0 0 2px rgba(0,0,0,.6)); }
        .sw.custom input { position: absolute; inset: 0; width: 100%; height: 100%; opacity: 0; cursor: pointer; border: 0; padding: 0; }

        /* ---- segment tiles ---- */
        .tiles { display: grid; grid-template-columns: repeat(auto-fit, minmax(86px, 1fr)); gap: 8px; }
        .seg {
          all: unset; box-sizing: border-box; cursor: pointer; min-height: 62px; border-radius: 14px; padding: 8px 6px;
          display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 2px; text-align: center; min-width: 0;
          color: var(--secondary-text-color); --mdc-icon-size: 24px; -webkit-tap-highlight-color: transparent;
          background: color-mix(in srgb, var(--primary-text-color) 5%, transparent);
          transition: background .2s, color .2s, box-shadow .2s, transform .1s;
        }
        .seg:active { transform: scale(.95); }
        .seg b { font-size: 12px; font-weight: 600; max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: var(--primary-text-color); }
        .seg small { font-size: 10.5px; opacity: .8; }
        .seg.on { color: rgb(var(--rgb)); background: rgba(var(--rgb), .2); box-shadow: inset 0 0 0 1px rgba(var(--rgb), .4); }
        .seg[disabled] { opacity: .4; pointer-events: none; }

        /* ---- scenes ---- */
        .scenes { display: grid; grid-template-columns: repeat(var(--n, 1), 1fr); gap: 6px; }
        .sbtn {
          all: unset; box-sizing: border-box; cursor: pointer; min-height: 46px; border-radius: 14px; min-width: 0; padding: 4px;
          display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 1px;
          color: var(--secondary-text-color); --mdc-icon-size: 24px; -webkit-tap-highlight-color: transparent;
          background: color-mix(in srgb, var(--primary-text-color) 5%, transparent);
          transition: background .2s, color .2s, box-shadow .2s, transform .1s;
        }
        .sbtn:active { transform: scale(.94); }
        .sbtn span { font-size: 10.5px; font-weight: 600; max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .sbtn.active { color: rgb(var(--s-rgb, var(--rgb))); background: rgba(var(--s-rgb, var(--rgb)), .2); box-shadow: inset 0 0 0 1px rgba(var(--s-rgb, var(--rgb)), .45); }
        .sel {
          width: 100%; height: 40px; box-sizing: border-box; border: none; border-radius: 12px; padding: 0 12px; font-size: 14px;
          color: var(--primary-text-color); background: color-mix(in srgb, var(--primary-text-color) 8%, transparent); cursor: pointer;
        }
        .sel option { color: #000; }

        /* ---- music ---- */
        .tgl {
          all: unset; box-sizing: border-box; cursor: pointer; flex: none; position: relative; width: 38px; height: 22px; border-radius: 11px;
          background: color-mix(in srgb, var(--primary-text-color) 22%, transparent); transition: background .2s;
        }
        .tgl::after { content: ""; position: absolute; top: 2px; left: 2px; width: 18px; height: 18px; border-radius: 50%; background: #fff; transition: transform .2s; box-shadow: 0 1px 3px rgba(0,0,0,.35); }
        .tgl.on { background: rgb(${MUSIC_RGB}); }
        .tgl.on::after { transform: translateX(16px); }
        .chips { display: flex; flex-wrap: wrap; gap: 6px; }
        .chip {
          all: unset; box-sizing: border-box; cursor: pointer; padding: 7px 14px; border-radius: 999px; font-size: 13px; font-weight: 500;
          color: var(--secondary-text-color); background: color-mix(in srgb, var(--primary-text-color) 6%, transparent);
          transition: background .2s, color .2s, box-shadow .2s; -webkit-tap-highlight-color: transparent;
        }
        .chip.active { color: rgb(${MUSIC_RGB}); background: rgba(${MUSIC_RGB}, .2); box-shadow: inset 0 0 0 1px rgba(${MUSIC_RGB}, .45); }
        .mus.dim .chips, .mus.dim .slider { opacity: .6; }

        /* ---------- Bubble Card style ---------- */
        ha-card.bubble, ha-card.bubble:not(.off) {
          border: none; border-radius: 32px; padding: 8px; gap: 8px;
          background: var(--ha-card-background, var(--card-background-color, rgba(30,30,30,1)));
          -webkit-backdrop-filter: none; backdrop-filter: none;
        }
        ha-card.bubble .head { border-radius: 28px; }
        ha-card.bubble .tile { width: 40px; height: 40px; margin: 0; background: rgba(var(--icon-rgb), .2); }
        ha-card.bubble .tile ha-icon { --mdc-icon-size: 24px; }
        ha-card.bubble .sec { border-radius: 24px; }
        ha-card.bubble .seg, ha-card.bubble .sbtn { border-radius: 20px; }
        ha-card.bubble .sel { border-radius: 20px; }
        ha-card.bubble .slider { border-radius: 17px; }
      </style>
      <ha-card>
        <div class="head" tabindex="0" role="button">
          <div class="tile"><ha-icon></ha-icon></div>
          <div class="info"><div class="name"></div><div class="sub"></div></div>
          <button class="pwr" aria-label="Toggle power"><ha-icon icon="mdi:power"></ha-icon></button>
        </div>

        <div class="sec bri" hidden>
          <div class="stitle"><ha-icon icon="mdi:brightness-6"></ha-icon><span>Brightness</span><b class="val"></b></div>
          <div class="slider" role="slider" tabindex="0" aria-label="Brightness"><div class="thumb"></div></div>
        </div>

        <div class="sec col" hidden>
          <div class="stitle"><ha-icon icon="mdi:palette"></ha-icon><span>Color</span></div>
          <div class="swatches"></div>
          <div class="ctwrap" hidden>
            <div class="stitle sm"><ha-icon icon="mdi:thermometer"></ha-icon><span>White temperature</span><b class="val"></b></div>
            <div class="slider ct" role="slider" tabindex="0" aria-label="White temperature"><div class="thumb"></div></div>
          </div>
        </div>

        <div class="sec sgm" hidden>
          <div class="stitle"><ha-icon icon="mdi:led-strip-variant"></ha-icon><span>Lights</span></div>
          <div class="tiles"></div>
        </div>

        <div class="sec scn" hidden>
          <div class="stitle"><ha-icon icon="mdi:auto-fix"></ha-icon><span>Scenes</span><b class="val"></b></div>
          <div class="scenes"></div>
          <select class="sel" aria-label="All scenes"></select>
        </div>

        <div class="sec mus" hidden>
          <div class="stitle"><ha-icon icon="mdi:music"></ha-icon><span>Music mode</span><button class="tgl" role="switch" aria-label="Music mode"></button></div>
          <div class="chips"></div>
          <div class="sens">
            <div class="stitle sm"><ha-icon icon="mdi:tune-vertical"></ha-icon><span>Sensitivity</span><b class="val"></b></div>
            <div class="slider" role="slider" tabindex="0" style="--fill:${MUSIC_RGB}" aria-label="Music sensitivity"><div class="thumb"></div></div>
          </div>
        </div>
      </ha-card>`;
    const $ = (s) => this.shadowRoot.querySelector(s);
    this._card = $("ha-card");
    this._head = $(".head");
    this._tile = $(".tile ha-icon");
    this._name = $(".name");
    this._sub = $(".sub");
    this._pwr = $(".pwr");
    this._bri = $(".bri");
    this._briSlider = $(".bri .slider");
    this._briVal = $(".bri .val");
    this._col = $(".col");
    this._sw = $(".swatches");
    this._ctWrap = $(".ctwrap");
    this._ctSlider = $(".ctwrap .slider");
    this._ctVal = $(".ctwrap .val");
    this._sgm = $(".sgm");
    this._tiles = $(".tiles");
    this._scn = $(".scn");
    this._scnVal = $(".scn .val");
    this._scenes = $(".scenes");
    this._sel = $(".sel");
    this._mus = $(".mus");
    this._tgl = $(".tgl");
    this._chips = $(".chips");
    this._sens = $(".sens");
    this._sensSlider = $(".sens .slider");
    this._sensVal = $(".sens .val");

    // keyboard focus ring only for keyboard users
    this.shadowRoot.addEventListener("pointerdown", () => this._card.classList.remove("kbd"), true);
    this.shadowRoot.addEventListener("keydown", (e) => { if (e.key === "Tab") this._card.classList.add("kbd"); }, true);

    this._head.addEventListener("click", (e) => {
      if (e.target.closest(".pwr")) return;
      this._runAction(this._config.tap_action || { action: "more-info" });
      if (e.detail) this._head.blur();
    });
    this._head.addEventListener("keydown", (e) => {
      if (e.target !== this._head) return;
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); this._runAction(this._config.tap_action || { action: "more-info" }); }
    });
    this._pwr.addEventListener("click", (e) => {
      e.stopPropagation();
      this._call("light", "toggle", { entity_id: this._config.entity });
    });

    this._wireSlider(this._briSlider, "bri", this._briVal, (v) => `${v}%`, (v) =>
      this._call("light", "turn_on", { entity_id: this._config.entity, brightness_pct: v }));
    this._wireSlider(this._ctSlider, "ct", this._ctVal, (v) => `${v} K`, (v) =>
      this._call("light", "turn_on", { entity_id: this._config.entity, color_temp_kelvin: v }));
    this._wireSlider(this._sensSlider, "sens", this._sensVal, (v) => String(v), (v) => {
      const id = this._ents().sensitivity;
      if (id) this._call("number", "set_value", { entity_id: id, value: v });
    });

    this._sw.addEventListener("click", (e) => {
      const b = e.target.closest("[data-c]");
      if (b) this._setColor(b.dataset.c);
    });
    this._sw.addEventListener("change", (e) => {
      if (e.target.matches("input[type=color]")) this._setColor(toRgb(e.target.value));
    });
    this._tiles.addEventListener("click", (e) => {
      const b = e.target.closest("[data-e]");
      if (b) this._call("homeassistant", "toggle", { entity_id: b.dataset.e });
    });
    this._scenes.addEventListener("click", (e) => {
      const b = e.target.closest("[data-s]");
      if (!b) return;
      if (b.dataset.s === "random") this._randomScene();
      else this._setScene(this._sceneList()[Number(b.dataset.s)]?.option);
    });
    this._sel.addEventListener("change", () => this._setScene(this._sel.value, true));
    this._tgl.addEventListener("click", () => {
      const id = this._ents().musicSwitch;
      if (id) this._call("homeassistant", "toggle", { entity_id: id });
    });
    this._chips.addEventListener("click", (e) => {
      const b = e.target.closest("[data-o]");
      const id = this._ents().musicMode;
      if (b && id) this._call("select", "select_option", { entity_id: id, option: b.dataset.o });
    });
  }

  // ---------- HA integration ----------
  static getConfigElement() {
    return document.createElement(EDITOR_TAG);
  }

  static getStubConfig(hass, entities, entitiesFallback) {
    const isLight = (id) => typeof id === "string" && id.startsWith("light.");
    const all = [...(entities || []), ...(entitiesFallback || []), ...Object.keys(hass?.states || {})].filter(isLight);
    const e = all.find((id) => /uplighter|govee/i.test(id)) || all[0];
    return { entity: e || "light.living_room_uplighter_lamp" };
  }

  setConfig(config) {
    if (!config || !config.entity) throw new Error("You need to define a light entity");
    this._config = {
      tap_action: { action: "more-info" },
      ...config,
    };
    this._key = null;
    if (this._hass) this._render();
  }

  set hass(hass) {
    this._hass = hass;
    this._render();
  }

  getCardSize() {
    const vis = resolveSections(this._config || {});
    const size = { header: 1, brightness: 1, color: 1, segments: 1, scenes: 2, music: 2 };
    return Math.max(vis.reduce((n, id) => n + size[id], 0), 1);
  }
  getGridOptions() { return { columns: 12, min_columns: 4 }; }

  // ---------- helpers ----------
  _call(domain, service, data) { this._hass.callService(domain, service, data); }

  _ents() {
    const c = this._config;
    const d = discover(this._hass, c.entity);
    const base = c.entity.split(".")[1] || "";
    const segments = Array.isArray(c.segments)
      ? c.segments
          .map((s) => (typeof s === "string" ? { entity: s } : s))
          .filter((s) => s && s.entity)
          .map((s) => {
            const suffix = String(s.entity.split(".")[1] || "");
            const short = suffix.startsWith(base + "_") ? suffix.slice(base.length + 1) : suffix;
            const fn = this._hass.states[s.entity]?.attributes?.friendly_name;
            return {
              entity: s.entity,
              name: s.name || (suffix ? cap(short.replace(/_light$/, "")) : fn || s.entity),
              icon: s.icon || segIcon(short),
            };
          })
      : d.segments;
    return {
      scene: c.scene_entity || d.scene,
      musicMode: c.music_mode_entity || d.musicMode,
      sensitivity: c.music_sensitivity_entity || d.sensitivity,
      musicSwitch: c.music_switch || d.musicSwitch,
      segments,
    };
  }

  _sceneList() {
    const list = Array.isArray(this._config.scenes) ? this._config.scenes : DEFAULT_SCENES;
    return list
      .map((s) => (typeof s === "string" ? { option: s } : s))
      .filter((s) => s && s.option)
      .map((s) => ({
        option: s.option,
        name: s.name || s.option,
        icon: s.icon || "mdi:palette",
        // configured color first, then the Govee color map
        rgb: toRgb(s.color) || SCENE_COLORS[baseName(s.option)] || null,
      }));
  }

  _colorList() {
    const list = Array.isArray(this._config.colors) ? this._config.colors : DEFAULT_COLORS;
    return list.map(toRgb).filter(Boolean);
  }

  // value being sent but not yet confirmed by Home Assistant
  _pv(key, real) {
    const p = this._pend[key];
    if (!p) return real;
    if (Date.now() - p.t > 3000 || p.v === real) { delete this._pend[key]; return real; }
    return p.v;
  }
  _setPend(key, v) {
    this._pend[key] = { v, t: Date.now() };
    clearTimeout(this._pendTimer);
    this._pendTimer = setTimeout(() => { this._key = null; this._render(); }, 3100);
  }

  // Pointer based slider. Native range inputs can only be dragged by their thumb on iOS,
  // so this handles taps and drags anywhere on the track. Vertical swipes still scroll the page.
  _wireSlider(el, key, valEl, fmt, send) {
    const calc = (clientX) => {
      const r = el.getBoundingClientRect();
      const { _min: min, _max: max } = el;
      const step = el._step || 1;
      const ratio = r.width ? Math.min(1, Math.max(0, (clientX - r.left) / r.width)) : 0;
      let v = Math.round((min + ratio * (max - min) - min) / step) * step + min;
      v = Math.min(max, Math.max(min, v));
      const dec = String(step).includes(".") ? String(step).split(".")[1].length : 0;
      return Number(v.toFixed(dec));
    };
    const show = (v) => {
      el._v = v;
      this._paintSlider(el);
      valEl.textContent = fmt(v);
      this._setPend(key, v);
    };
    const live = (v) => {
      show(v);
      const now = Date.now();
      if (now - (this._lastSend[key] || 0) > 250) { this._lastSend[key] = now; send(v); }
    };
    const commit = (v) => { this._lastSend[key] = Date.now(); show(v); send(v); };
    let st = null;
    const stop = () => { if (this._drag === key) this._drag = null; st = null; };

    el.addEventListener("pointerdown", (e) => {
      if (e.pointerType === "mouse" && e.button !== 0) return;
      st = { id: e.pointerId, x: e.clientX, y: e.clientY, drag: e.pointerType === "mouse" };
      this._drag = key;
      try { el.setPointerCapture(e.pointerId); } catch (err) { /* not supported */ }
      if (st.drag) live(calc(e.clientX));
    });
    el.addEventListener("pointermove", (e) => {
      if (!st || e.pointerId !== st.id) return;
      if (!st.drag) {
        const dx = Math.abs(e.clientX - st.x);
        if (dx > 6 && dx > Math.abs(e.clientY - st.y)) st.drag = true;
        else return;
      }
      const v = calc(e.clientX);
      if (v !== el._v) live(v);
    });
    el.addEventListener("pointerup", (e) => {
      if (!st || e.pointerId !== st.id) return;
      commit(calc(e.clientX)); // a tap sets the value too
      stop();
    });
    el.addEventListener("pointercancel", () => {
      if (st && st.drag) commit(el._v); // the browser took over (e.g. scroll): keep what was set
      stop();
    });
    el.addEventListener("keydown", (e) => {
      const step = el._step || 1;
      const big = Math.max(step, (el._max - el._min) / 10);
      const d = { ArrowLeft: -step, ArrowDown: -step, ArrowRight: step, ArrowUp: step, PageDown: -big, PageUp: big }[e.key];
      let v;
      if (d !== undefined) v = Math.min(el._max, Math.max(el._min, el._v + d));
      else if (e.key === "Home") v = el._min;
      else if (e.key === "End") v = el._max;
      else return;
      e.preventDefault();
      show(v);
      clearTimeout(this._keyTimer);
      this._keyTimer = setTimeout(() => send(v), 300);
    });
  }

  _paintSlider(el) {
    const range = Math.max(el._max - el._min, 1);
    el.style.setProperty("--pct", `${((el._v - el._min) / range) * 100}%`);
    el.setAttribute("aria-valuemin", el._min);
    el.setAttribute("aria-valuemax", el._max);
    el.setAttribute("aria-valuenow", el._v);
  }

  _setSlider(el, key, v, min, max, step) {
    el._min = min; el._max = max; el._step = step;
    if (this._drag !== key || el._v == null) el._v = v;
    this._paintSlider(el);
  }

  _setColor(rgb) {
    if (!rgb) return;
    const arr = String(rgb).split(",").map(Number);
    this._call("light", "turn_on", { entity_id: this._config.entity, rgb_color: arr });
  }

  _findOption(options, wanted) {
    if (!wanted) return wanted;
    if (options.includes(wanted)) return wanted;
    const n = baseName(wanted);
    return options.find((o) => baseName(o) === n) || wanted;
  }

  _setScene(option, exact) {
    const id = this._ents().scene;
    if (!id || !option) return;
    const options = this._hass.states[id]?.attributes?.options || [];
    this._call("select", "select_option", { entity_id: id, option: exact ? option : this._findOption(options, option) });
  }

  _randomScene() {
    const a = this._config.random_action;
    if (a && a.action && a.action !== "none") { this._runAction(a); return; }
    const id = this._ents().scene;
    const st = id && this._hass.states[id];
    if (!st) return;
    const cur = baseName(st.state);
    const pool = (st.attributes.options || []).filter((o) => baseName(o) !== cur && baseName(o) !== "none");
    if (pool.length) this._call("select", "select_option", { entity_id: id, option: pool[Math.floor(Math.random() * pool.length)] });
  }

  _runAction(a) {
    const entityId = a.entity || this._config.entity;
    switch (a.action) {
      case "navigate":
        if (!a.navigation_path) return;
        if (a.navigation_replace) history.replaceState(null, "", a.navigation_path);
        else history.pushState(null, "", a.navigation_path);
        window.dispatchEvent(new CustomEvent("location-changed", { detail: { replace: !!a.navigation_replace } }));
        break;
      case "more-info":
        this.dispatchEvent(new CustomEvent("hass-more-info", { detail: { entityId }, bubbles: true, composed: true }));
        break;
      case "toggle":
        this._call("homeassistant", "toggle", { entity_id: entityId });
        break;
      case "perform-action":
      case "call-service": {
        const svc = a.perform_action || a.service;
        if (!svc) return;
        const [domain, service] = svc.split(".");
        const data = a.data || a.service_data || {};
        const hasTarget = a.target && Object.keys(a.target).length;
        const defaults = ["light", "switch", "select", "number"].includes(domain) ? { entity_id: entityId } : undefined;
        this._hass.callService(domain, service, data, hasTarget ? a.target : defaults);
        break;
      }
      case "url":
        if (a.url_path) window.open(a.url_path, "_blank");
        break;
      default:
        break;
    }
  }

  // ---------- model ----------
  _model() {
    const cfg = this._config;
    const hass = this._hass;
    const st = hass.states[cfg.entity];
    if (!st) return { missing: true, name: cfg.name || cfg.entity };
    const a = st.attributes || {};
    const unavailable = UNAVAILABLE.includes(st.state);
    const on = st.state === "on";
    const modes = Array.isArray(a.supported_color_modes) ? a.supported_color_modes : [];
    const hasColor = !modes.length || modes.some((x) => COLOR_MODES.includes(x));
    const hasCt = !modes.length || modes.includes("color_temp");
    const hasBri = !modes.length || modes.some((x) => x !== "onoff");

    const briReal = on ? (a.brightness != null ? Math.max(1, Math.round((a.brightness / 255) * 100)) : 100) : 0;
    const bri = this._pv("bri", briReal);
    const ctMin = Number(a.min_color_temp_kelvin) || 2000;
    const ctMax = Number(a.max_color_temp_kelvin) || 9000;
    const ctReal = Number(a.color_temp_kelvin) || Math.round((ctMin + ctMax) / 2);
    const ct = this._pv("ct", ctReal);

    const rgbArr = Array.isArray(a.rgb_color) ? a.rgb_color : null;
    const rgbStr = on && rgbArr ? rgbArr.join(",") : null;
    const nearWhite = rgbArr && rgbArr.every((n) => n > 240);
    const override = toRgb(cfg.color);
    const e = this._ents();
    const sceneSt = e.scene && hass.states[e.scene];
    const sceneOptions = sceneSt?.attributes?.options || [];
    const sceneCur = sceneSt && !UNAVAILABLE.includes(sceneSt.state) ? sceneSt.state : "";
    const curBase = baseName(sceneCur);
    // optionally tint the card with the active scene's color
    const sceneTint = cfg.scene_accent && sceneCur && curBase !== "none"
      ? this._sceneList().find((x) => baseName(x.option) === curBase)?.rgb || SCENE_COLORS[curBase] || null
      : null;
    const accent = override || (on ? (sceneTint || (rgbStr && !nearWhite ? rgbStr : WARM_RGB)) : OFF_RGB);

    const parts = [];
    if (unavailable) parts.push("Unavailable");
    else if (!on) parts.push("Off");
    else {
      parts.push("On");
      if (hasBri) parts.push(`${bri}%`);
      if (cfg.show_scene_in_header && sceneCur && curBase !== "none") parts.push(sceneCur);
    }

    const musicSw = e.musicSwitch && hass.states[e.musicSwitch];
    const musicOn = musicSw?.state === "on";
    const modeSt = e.musicMode && hass.states[e.musicMode];
    const sensSt = e.sensitivity && hass.states[e.sensitivity];
    const sMin = Number(sensSt?.attributes?.min) || 0;
    const sMax = Number(sensSt?.attributes?.max) || 100;
    const sStep = Number(sensSt?.attributes?.step) || 1;
    const sensReal = sensSt && !UNAVAILABLE.includes(sensSt.state) ? Number(sensSt.state) : sMin;
    const sens = this._pv("sens", sensReal);

    return {
      name: cfg.name ?? a.friendly_name ?? cfg.entity,
      icon: cfg.icon || "mdi:floor-lamp",
      sub: parts.join(" · "),
      on, unavailable,
      accent: cfg.coloring === false ? "var(--ha-card-background, var(--card-background-color))" : accent,
      iconRgb: cfg.icon_coloring === false || !on ? OFF_RGB : accent,
      hasBri, hasColor, hasCt, bri, ct, ctMin, ctMax,
      rgb: rgbStr,
      colors: this._colorList(),
      segments: e.segments.map((s) => {
        const ss = hass.states[s.entity];
        return { ...s, on: ss?.state === "on", unavail: !ss || UNAVAILABLE.includes(ss.state) };
      }),
      scenes: this._sceneList().map((s) => ({ ...s, active: !!sceneCur && baseName(s.option) === curBase })),
      hasScene: !!sceneSt,
      sceneOptions,
      sceneCur,
      music: {
        has: !!(musicSw || modeSt || sensSt),
        hasSwitch: !!musicSw,
        on: musicOn,
        options: modeSt?.attributes?.options || [],
        mode: modeSt && !UNAVAILABLE.includes(modeSt.state) ? modeSt.state : "",
        hasSens: !!sensSt,
        sens, sMin, sMax, sStep,
      },
    };
  }

  // ---------- render ----------
  _render() {
    if (!this._config || !this._hass) return;
    const cfg = this._config;
    const m = this._model();
    const bubble = cfg.card_style === "bubble";
    const animate = cfg.animation !== false;
    const sections = resolveSections(cfg);
    const vis = new Set(sections);
    const showHeader = vis.has("header");
    const opts = [
      sections, bubble, animate, cfg.show_scene_labels, cfg.show_scene_select !== false,
      cfg.show_random !== false, cfg.show_color_picker !== false,
    ];
    const key = JSON.stringify([m, opts]);
    if (key === this._key) return;
    this._key = key;

    this._card.classList.toggle("bubble", bubble);
    this._card.classList.toggle("static", !animate);
    this._head.hidden = !showHeader;
    const els = { header: this._head, brightness: this._bri, color: this._col, segments: this._sgm, scenes: this._scn, music: this._mus };
    SECTION_IDS.forEach((id) => {
      const i = sections.indexOf(id);
      els[id].style.order = id === "header" ? -1 : i < 0 ? 99 : i;
    });
    this._name.textContent = m.name;
    if (m.missing) {
      this._sub.textContent = "Entity not found";
      [this._bri, this._col, this._sgm, this._scn, this._mus].forEach((s) => { s.hidden = true; });
      return;
    }

    this._card.style.setProperty("--rgb", m.accent);
    this._card.style.setProperty("--icon-rgb", m.iconRgb);
    this._card.classList.toggle("off", !m.on);
    this._card.classList.toggle("active", m.on);
    this._card.classList.toggle("unavail", m.unavailable);
    this._tile.setAttribute("icon", m.icon);
    this._sub.textContent = m.sub;
    this._pwr.classList.toggle("on", m.on);
    this._pwr.disabled = m.unavailable;

    // brightness
    this._bri.hidden = !(vis.has("brightness") && m.hasBri);
    this._briVal.textContent = m.on || m.bri ? `${m.bri}%` : "Off";
    this._setSlider(this._briSlider, "bri", m.bri || 1, 1, 100, 1);

    // color + white temperature
    const showColor = vis.has("color") && (m.hasColor || m.hasCt);
    this._col.hidden = !showColor;
    this._sw.hidden = !m.hasColor;
    if (m.hasColor) {
      const swKey = JSON.stringify([m.colors, cfg.show_color_picker !== false]);
      if (swKey !== this._swKey) {
        this._swKey = swKey;
        this._sw.innerHTML =
          m.colors.map((c) => `<button class="sw" data-c="${esc(c)}" style="--c:${esc(c)}" aria-label="Color ${esc(rgbToHex(c))}"></button>`).join("") +
          (cfg.show_color_picker !== false
            ? `<label class="sw custom" title="Custom color"><ha-icon icon="mdi:eyedropper-variant"></ha-icon><input type="color" aria-label="Custom color"></label>`
            : "");
      }
      this._sw.querySelectorAll("button.sw").forEach((b) => b.classList.toggle("active", !!m.rgb && b.dataset.c === m.rgb));
      const picker = this._sw.querySelector("input[type=color]");
      if (picker && m.rgb) picker.value = rgbToHex(m.rgb);
    }
    this._ctWrap.hidden = !m.hasCt;
    if (m.hasCt) {
      this._ctVal.textContent = `${m.ct} K`;
      this._setSlider(this._ctSlider, "ct", m.ct, m.ctMin, m.ctMax, 100);
    }

    // segments
    const showSeg = vis.has("segments") && m.segments.length > 0;
    this._sgm.hidden = !showSeg;
    if (showSeg) {
      const segKey = JSON.stringify(m.segments.map((s) => [s.entity, s.name, s.icon]));
      if (segKey !== this._segKey) {
        this._segKey = segKey;
        this._tiles.innerHTML = m.segments
          .map((s) => `<button class="seg" data-e="${esc(s.entity)}" title="${esc(s.name)}"><ha-icon icon="${esc(s.icon)}"></ha-icon><b>${esc(s.name)}</b><small></small></button>`)
          .join("");
      }
      this._tiles.querySelectorAll(".seg").forEach((b, i) => {
        const s = m.segments[i];
        b.classList.toggle("on", s.on);
        b.disabled = s.unavail;
        b.querySelector("small").textContent = s.unavail ? "Unavailable" : s.on ? "On" : "Off";
      });
    }

    // scenes
    const showScn = vis.has("scenes") && m.hasScene;
    this._scn.hidden = !showScn;
    if (showScn) {
      const labels = !!cfg.show_scene_labels;
      const random = cfg.show_random !== false;
      const scnKey = JSON.stringify([m.scenes.map((s) => [s.option, s.name, s.icon, s.rgb]), labels, random]);
      if (scnKey !== this._scnKey) {
        this._scnKey = scnKey;
        this._scenes.innerHTML =
          m.scenes
            .map((s, i) => `<button class="sbtn" data-s="${i}" title="${esc(s.name)}" style="${s.rgb ? `--s-rgb:${s.rgb}` : ""}"><ha-icon icon="${esc(s.icon)}"></ha-icon>${labels ? `<span>${esc(s.name)}</span>` : ""}</button>`)
            .join("") +
          (random ? `<button class="sbtn" data-s="random" title="Random scene" style="--s-rgb:255,235,59"><ha-icon icon="mdi:dice-multiple"></ha-icon>${labels ? `<span>Random</span>` : ""}</button>` : "");
        this._scenes.style.setProperty("--n", Math.max(m.scenes.length + (random ? 1 : 0), 1));
      }
      this._scenes.hidden = m.scenes.length === 0 && !random;
      this._scenes.querySelectorAll(".sbtn[data-s]").forEach((b) => {
        const s = m.scenes[Number(b.dataset.s)];
        b.classList.toggle("active", !!s && s.active);
      });
      this._scnVal.textContent = m.sceneCur && baseName(m.sceneCur) !== "none" ? m.sceneCur : "";
      const showSel = cfg.show_scene_select !== false && m.sceneOptions.length > 0;
      this._sel.hidden = !showSel;
      if (showSel) {
        const optKey = JSON.stringify(m.sceneOptions);
        if (optKey !== this._optKey) {
          this._optKey = optKey;
          this._sel.innerHTML = m.sceneOptions.map((o) => `<option value="${esc(o)}">${esc(o)}</option>`).join("");
        }
        this._sel.value = m.sceneCur;
      }
    }

    // music mode
    const showMus = vis.has("music") && m.music.has;
    this._mus.hidden = !showMus;
    if (showMus) {
      const mu = m.music;
      this._mus.classList.toggle("dim", mu.hasSwitch && !mu.on);
      this._tgl.hidden = !mu.hasSwitch;
      this._tgl.classList.toggle("on", mu.on);
      this._tgl.setAttribute("aria-checked", mu.on ? "true" : "false");
      this._chips.hidden = mu.options.length === 0;
      const chipKey = JSON.stringify(mu.options);
      if (chipKey !== this._chipKey) {
        this._chipKey = chipKey;
        this._chips.innerHTML = mu.options.map((o) => `<button class="chip" data-o="${esc(o)}">${esc(o)}</button>`).join("");
      }
      this._chips.querySelectorAll(".chip").forEach((b) => b.classList.toggle("active", b.dataset.o === mu.mode));
      this._sens.hidden = !mu.hasSens;
      if (mu.hasSens) {
        this._sensVal.textContent = String(mu.sens);
        this._setSlider(this._sensSlider, "sens", mu.sens, mu.sMin, mu.sMax, mu.sStep);
      }
    }
  }
}

// ---------- Visual editor ----------
const EDITOR_LABELS = {
  entity: "Light entity",
  name: "Name",
  icon: "Icon",
  tap_action: "Header tap action",
  scene_entity: "Scene select (auto-detected)",
  music_switch: "Music mode switch (auto-detected)",
  music_mode_entity: "Music mode select (auto-detected)",
  music_sensitivity_entity: "Music sensitivity number (auto-detected)",
  show_random: "Show random scene button",
  random_action: "Random button action (default: pick a random scene)",
  show_scene_select: "Show list of all scenes",
  show_scene_labels: "Show names under scene icons",
  show_scene_in_header: "Show current scene in the header",
  scene_accent: "Tint the card with the active scene's color (from the color map)",
  show_color_picker: "Show custom color picker",
  card_style: "Card style (icon, icon box and borders)",
  color: "Accent color override (e.g. #2196f3)",
  animation: "Glow animation",
  coloring: "Card coloring follows the light color",
  icon_coloring: "Icon coloring follows the light color",
  // list item forms
  option: "Scene",
  color_rgb: "Color",
  swatch: "Color",
};

const EDITOR_DEFAULTS = {
  show_random: true,
  show_scene_select: true,
  show_scene_labels: false,
  show_scene_in_header: false,
  scene_accent: false,
  show_color_picker: true,
  card_style: "mushroom",
  animation: true,
  coloring: true,
  icon_coloring: true,
};
// lists where an empty array means "none" and must stay in the YAML
const KEEP_EMPTY = ["segments", "scenes", "colors"];

const schemaNames = (schema) => schema.flatMap((s) => (s.schema ? schemaNames(s.schema) : s.name ? [s.name] : []));

const getTopSchema = () => [
  { name: "entity", required: true, selector: { entity: { domain: "light" } } },
  { name: "name", selector: { text: {} } },
  { name: "icon", selector: { icon: {} } },
];

const getBottomSchema = (cfg) => {
  const vis = resolveSections(cfg);
  return [
  ...(vis.includes("header") ? [{ name: "tap_action", selector: { ui_action: {} } }] : []),
  ...(vis.includes("scenes")
    ? [
        {
          type: "expandable",
          name: "scene_options",
          title: "Scene options",
          flatten: true,
          schema: [
            { name: "show_random", selector: { boolean: {} } },
            { name: "random_action", selector: { ui_action: { default_action: "none" } } },
            { name: "show_scene_select", selector: { boolean: {} } },
            { name: "show_scene_labels", selector: { boolean: {} } },
          ],
        },
      ]
    : []),
  {
    type: "expandable",
    name: "entities",
    title: "Entities (leave empty to auto-detect)",
    flatten: true,
    schema: [
      { name: "scene_entity", selector: { entity: { domain: "select" } } },
      { name: "music_switch", selector: { entity: { domain: "switch" } } },
      { name: "music_mode_entity", selector: { entity: { domain: "select" } } },
      { name: "music_sensitivity_entity", selector: { entity: { domain: ["number", "input_number"] } } },
    ],
  },
  {
    type: "expandable",
    name: "advanced",
    title: "Advanced settings",
    flatten: true,
    schema: [
      {
        name: "card_style",
        selector: { select: { mode: "dropdown", options: [{ value: "mushroom", label: "Mushroom" }, { value: "bubble", label: "Bubble" }] } },
      },
      { name: "color", selector: { text: {} } },
      { name: "show_scene_in_header", selector: { boolean: {} } },
      { name: "scene_accent", selector: { boolean: {} } },
      { name: "show_color_picker", selector: { boolean: {} } },
      { name: "animation", selector: { boolean: {} } },
      { name: "coloring", selector: { boolean: {} } },
      { name: "icon_coloring", selector: { boolean: {} } },
    ],
  },
  ];
};

const isEmpty = (v) =>
  v === "" || v == null || (Array.isArray(v) && v.length === 0) ||
  (typeof v === "object" && !Array.isArray(v) && Object.keys(v).length === 0);
const cleanObj = (o) => {
  const c = { ...o };
  for (const k of Object.keys(c)) if (isEmpty(c[k])) delete c[k];
  return c;
};

const EDITOR_CSS = `
  .gu-list { margin: 16px 0; }
  .gu-h { display: flex; align-items: center; font-size: 14px; font-weight: 500; color: var(--primary-text-color); margin-bottom: 8px; }
  .gu-h span { flex: 1; }
  .gu-reset { all: unset; cursor: pointer; font-size: 12px; color: var(--primary-color); }
  .gu-row { border: 1px solid var(--divider-color); border-radius: 12px; margin-bottom: 8px; overflow: hidden; background: var(--card-background-color); }
  .gu-rh { display: flex; align-items: center; gap: 4px; padding: 6px 4px 6px 12px; cursor: pointer; }
  .gu-rh > ha-icon { --mdc-icon-size: 22px; margin-right: 8px; color: var(--secondary-text-color); }
  .gu-sw { width: 22px; height: 22px; border-radius: 50%; margin-right: 8px; flex: none; box-shadow: inset 0 0 0 1px rgba(0,0,0,.2); }
  .gu-rh .t { flex: 1; min-width: 0; }
  .gu-rh .n { font-size: 14px; color: var(--primary-text-color); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .gu-rh .s { font-size: 12px; color: var(--secondary-text-color); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .gu-ib { all: unset; box-sizing: border-box; cursor: pointer; width: 32px; height: 32px; flex: none; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: var(--secondary-text-color); --mdc-icon-size: 20px; }
  .gu-ib:hover { background: var(--secondary-background-color); color: var(--primary-text-color); }
  .gu-ib[disabled] { opacity: .3; pointer-events: none; }
  .gu-ib.del:hover { color: var(--error-color, #db4437); }
  .gu-body { padding: 12px; border-top: 1px solid var(--divider-color); }
  .gu-add { all: unset; box-sizing: border-box; cursor: pointer; width: 100%; display: flex; align-items: center; justify-content: center; gap: 6px; padding: 10px; border: 1px dashed var(--divider-color); border-radius: 12px; color: var(--primary-color); font-size: 14px; font-weight: 500; --mdc-icon-size: 20px; }
  .gu-add:hover { background: var(--secondary-background-color); }
  .gu-pin { width: 68px; height: 32px; flex: none; display: flex; align-items: center; justify-content: center; color: var(--secondary-text-color); --mdc-icon-size: 18px; }
  .gu-tgl { all: unset; box-sizing: border-box; cursor: pointer; flex: none; position: relative; width: 38px; height: 22px; border-radius: 11px; margin: 0 8px 0 4px; background: var(--disabled-color, #bdbdbd); transition: background .2s; }
  .gu-tgl::after { content: ""; position: absolute; top: 2px; left: 2px; width: 18px; height: 18px; border-radius: 50%; background: #fff; transition: transform .2s; box-shadow: 0 1px 3px rgba(0,0,0,.35); }
  .gu-tgl.on { background: var(--primary-color); }
  .gu-tgl.on::after { transform: translateX(16px); }
  .gu-row.hidden-sec .t, .gu-row.hidden-sec > .gu-rh > ha-icon { opacity: .55; }
  .gu-empty { font-size: 13px; color: var(--secondary-text-color); margin-bottom: 8px; }
`;

// Reorderable list of expandable rows, each with a ha-form. Used for colors,
// segments and scenes. `list` shown is the effective one (config or defaults),
// the first edit writes it into the YAML, "Reset to default" removes it again.
class ListEditor {
  constructor(host, o) {
    this.o = o;
    this.open = -1;
    this.structKey = null;
    this.rows = [];
    this.wrap = document.createElement("div");
    this.wrap.className = "gu-list";
    host.appendChild(this.wrap);
  }

  update(list, custom, hass) {
    this.hass = hass;
    this.list = list;
    this.custom = custom;
    const key = JSON.stringify([list.length, this.open, custom]);
    if (key !== this.structKey) { this.structKey = key; this._build(); return; }
    this.rows.forEach((r, i) => {
      this._fill(r, list[i]);
      if (r.form) { r.form.hass = hass; r.form.schema = this.o.schema(); r.form.data = this.o.toForm(list[i]); }
    });
  }

  _fill(ref, item) {
    const h = this.o.head(item);
    if (h.swatch) { ref.sw.style.background = h.swatch; ref.sw.hidden = false; ref.ic.hidden = true; }
    else { ref.sw.hidden = true; ref.ic.hidden = false; ref.ic.setAttribute("icon", h.icon || "mdi:circle-small"); }
    ref.n.textContent = h.name;
    ref.s.textContent = h.sub || "";
  }

  _build() {
    const o = this.o;
    const wrap = this.wrap;
    wrap.innerHTML = "";
    this.rows = [];
    const head = document.createElement("div");
    head.className = "gu-h";
    head.innerHTML = `<span></span>`;
    head.firstChild.textContent = o.title;
    if (this.custom) {
      const reset = document.createElement("button");
      reset.className = "gu-reset";
      reset.textContent = "Reset to default";
      reset.addEventListener("click", () => { this.open = -1; o.commit(null); });
      head.appendChild(reset);
    }
    wrap.appendChild(head);
    if (!this.list.length) {
      const e = document.createElement("div");
      e.className = "gu-empty";
      e.textContent = o.empty;
      wrap.appendChild(e);
    }
    this.list.forEach((item, i) => {
      const open = this.open === i;
      const row = document.createElement("div");
      row.className = "gu-row";
      const rh = document.createElement("div");
      rh.className = "gu-rh";
      rh.innerHTML = `
        <ha-icon></ha-icon><div class="gu-sw" hidden></div>
        <div class="t"><div class="n"></div><div class="s"></div></div>
        <button class="gu-ib" data-a="up" title="Move up" ${i === 0 ? "disabled" : ""}><ha-icon icon="mdi:arrow-up"></ha-icon></button>
        <button class="gu-ib" data-a="down" title="Move down" ${i === this.list.length - 1 ? "disabled" : ""}><ha-icon icon="mdi:arrow-down"></ha-icon></button>
        <button class="gu-ib del" data-a="del" title="Delete"><ha-icon icon="mdi:delete-outline"></ha-icon></button>
        <ha-icon icon="${open ? "mdi:chevron-up" : "mdi:chevron-down"}" style="--mdc-icon-size:22px;margin:0 6px 0 2px;color:var(--secondary-text-color)"></ha-icon>`;
      const ref = { ic: rh.querySelector("ha-icon"), sw: rh.querySelector(".gu-sw"), n: rh.querySelector(".n"), s: rh.querySelector(".s"), form: null };
      this._fill(ref, item);
      rh.addEventListener("click", (e) => {
        const a = e.target.closest("[data-a]")?.dataset.a;
        if (!a) { this.open = open ? -1 : i; this.structKey = null; this.update(this.list, this.custom, this.hass); return; }
        e.stopPropagation();
        const cur = [...this.list];
        if (a === "del") { cur.splice(i, 1); this.open = -1; }
        else {
          const j = a === "up" ? i - 1 : i + 1;
          if (j < 0 || j >= cur.length) return;
          [cur[i], cur[j]] = [cur[j], cur[i]];
          if (this.open === i) this.open = j;
          else if (this.open === j) this.open = i;
        }
        o.commit(cur);
      });
      row.appendChild(rh);
      if (open) {
        const body = document.createElement("div");
        body.className = "gu-body";
        const form = document.createElement("ha-form");
        form.computeLabel = (s) => o.labels[s.name] || EDITOR_LABELS[s.name] || s.name;
        form.hass = this.hass;
        form.schema = o.schema();
        form.data = o.toForm(item);
        form.addEventListener("value-changed", (ev) => {
          ev.stopPropagation();
          const cur = [...this.list];
          cur[i] = o.fromForm(ev.detail.value, cur[i]);
          o.commit(cur);
        });
        body.appendChild(form);
        row.appendChild(body);
        ref.form = form;
      }
      wrap.appendChild(row);
      this.rows.push(ref);
    });
    const add = document.createElement("button");
    add.className = "gu-add";
    add.innerHTML = `<ha-icon icon="mdi:plus"></ha-icon>`;
    add.append(o.addText);
    add.addEventListener("click", () => {
      const cur = [...this.list, o.newItem()];
      this.open = cur.length - 1;
      o.commit(cur);
    });
    wrap.appendChild(add);
  }
}

// Rows to show/hide and reorder the card's sections.
class SectionsEditor {
  constructor(host, commit) {
    this.commit = commit;
    this.wrap = document.createElement("div");
    this.wrap.className = "gu-list";
    host.appendChild(this.wrap);
  }

  update(list, custom) {
    const wrap = this.wrap;
    wrap.innerHTML = "";
    const head = document.createElement("div");
    head.className = "gu-h";
    const t = document.createElement("span");
    t.textContent = "Sections";
    head.appendChild(t);
    if (custom) {
      const reset = document.createElement("button");
      reset.className = "gu-reset";
      reset.textContent = "Reset to default";
      reset.addEventListener("click", () => this.commit(null));
      head.appendChild(reset);
    }
    wrap.appendChild(head);
    list.forEach((it, i) => {
      const meta = SECTION_META[it.id];
      const pinned = it.id === "header";
      const row = document.createElement("div");
      row.className = "gu-row" + (it.show ? "" : " hidden-sec");
      const rh = document.createElement("div");
      rh.className = "gu-rh";
      rh.style.cursor = "default";
      rh.innerHTML = `
        <ha-icon icon="${meta.icon}"></ha-icon>
        <div class="t"><div class="n"></div><div class="s"></div></div>
        ${
          pinned
            ? `<span class="gu-pin" title="The header always stays on top"><ha-icon icon="mdi:pin-outline"></ha-icon></span>`
            : `<button class="gu-ib" data-a="up" title="Move up" ${i <= 1 ? "disabled" : ""}><ha-icon icon="mdi:arrow-up"></ha-icon></button>
               <button class="gu-ib" data-a="down" title="Move down" ${i === list.length - 1 ? "disabled" : ""}><ha-icon icon="mdi:arrow-down"></ha-icon></button>`
        }
        <button class="gu-tgl${it.show ? " on" : ""}" data-a="tgl" role="switch" aria-checked="${it.show}" title="${it.show ? "Hide" : "Show"}"></button>`;
      rh.querySelector(".n").textContent = meta.label;
      rh.querySelector(".s").textContent = pinned ? (it.show ? "Shown, always on top" : "Hidden") : it.show ? "Shown" : "Hidden";
      rh.addEventListener("click", (e) => {
        const a = e.target.closest("[data-a]")?.dataset.a;
        if (!a) return;
        const cur = list.map((x) => ({ ...x }));
        if (a === "tgl") cur[i].show = !cur[i].show;
        else {
          const j = a === "up" ? i - 1 : i + 1;
          if (j < 1 || j >= cur.length) return; // never above the header
          [cur[i], cur[j]] = [cur[j], cur[i]];
        }
        this.commit(cur);
      });
      row.appendChild(rh);
      wrap.appendChild(row);
    });
  }
}

class GoveeUplighterCardEditor extends HTMLElement {
  setConfig(config) {
    this._config = config;
    this._sync();
  }

  set hass(hass) {
    this._hass = hass;
    if (this._built) {
      this._top.hass = hass;
      this._bottom.hass = hass;
    } else this._sync();
  }

  _emit(config) {
    const c = { ...config };
    for (const [k, v] of Object.entries(EDITOR_DEFAULTS)) if (c[k] === v) delete c[k];
    for (const k of Object.keys(c)) {
      if (KEEP_EMPTY.includes(k) && Array.isArray(c[k])) continue;
      if (isEmpty(c[k])) delete c[k];
    }
    this.dispatchEvent(new CustomEvent("config-changed", { detail: { config: c }, bubbles: true, composed: true }));
  }

  _makeForm(schema, onChange) {
    const f = document.createElement("ha-form");
    f.computeLabel = (s) => EDITOR_LABELS[s.name] || s.name;
    f.addEventListener("value-changed", (ev) => { ev.stopPropagation(); onChange(ev.detail.value); });
    f.hass = this._hass;
    f.schema = schema;
    return f;
  }

  _commitList(key) {
    return (list) => {
      const c = { ...this._config };
      if (list === null) delete c[key];
      else c[key] = list.map((x) => (typeof x === "object" && !Array.isArray(x) ? cleanObj(x) : x));
      this._emit(c);
    };
  }

  _build() {
    this._built = true;
    const style = document.createElement("style");
    style.textContent = EDITOR_CSS;
    this.appendChild(style);

    const onFormChange = (getSchema) => (value) => {
      const config = { ...this._config };
      for (const n of schemaNames(getSchema())) {
        if (value[n] === undefined) delete config[n];
        else config[n] = value[n];
      }
      this._emit(config);
    };
    this._top = this._makeForm(getTopSchema(), onFormChange(() => getTopSchema()));
    this.appendChild(this._top);

    // sections: show / hide / reorder
    this._sections = new SectionsEditor(this, (list) => {
      const c = { ...this._config };
      for (const id of SECTION_IDS) delete c[`show_${id}`];
      if (list === null) delete c.sections;
      else c.sections = list.map((x) => (x.show ? x.id : { id: x.id, show: false }));
      this._emit(c);
    });

    // colors
    this._colors = new ListEditor(this, {
      title: "Colors",
      empty: "No colors. Add one below.",
      addText: "Add color",
      labels: {},
      schema: () => [{ name: "color", selector: { color_rgb: {} } }],
      head: (c) => {
        const rgb = toRgb(c);
        return { swatch: rgb ? `rgb(${rgb})` : "", name: rgb ? rgbToHex(rgb) : "Color", sub: "" };
      },
      toForm: (c) => ({ color: (toRgb(c) || "255,255,255").split(",").map(Number) }),
      fromForm: (v) => rgbToHex(toRgb(v.color) || "255,255,255"),
      newItem: () => "#ffffff",
      commit: this._commitList("colors"),
    });

    // segments
    this._segments = new ListEditor(this, {
      title: "Light segments",
      empty: "No segments found. Add one below or check the light entity.",
      addText: "Add segment",
      labels: { entity: "Switch entity", name: "Name", icon: "Icon" },
      schema: () => [
        { name: "entity", required: true, selector: { entity: { domain: "switch" } } },
        { name: "name", selector: { text: {} } },
        { name: "icon", selector: { icon: {} } },
      ],
      head: (s) => ({
        icon: s.icon || "mdi:led-strip-variant",
        name: s.name || s.entity || "New segment",
        sub: s.entity || "Pick a switch entity",
      }),
      toForm: (s) => s,
      fromForm: (v) => v,
      newItem: () => ({ icon: "mdi:led-strip-variant" }),
      commit: this._commitList("segments"),
    });

    // scenes
    const mapRgb = (option) => SCENE_COLORS[baseName(option)] || null;
    this._scenes = new ListEditor(this, {
      title: "Quick scenes",
      empty: "No quick scenes. Add one below.",
      addText: "Add scene",
      labels: { option: "Scene", name: "Name (default: scene)", icon: "Icon", color: "Highlight color (default: from color map)" },
      schema: () => {
        const id = this._config.scene_entity || discover(this._hass, this._config.entity || "").scene;
        const options = (id && this._hass?.states?.[id]?.attributes?.options) || [];
        return [
          { name: "option", required: true, selector: { select: { mode: "dropdown", custom_value: true, options: options.map((o) => ({ value: o, label: o })) } } },
          { name: "name", selector: { text: {} } },
          { name: "icon", selector: { icon: {} } },
          { name: "color", selector: { color_rgb: {} } },
        ];
      },
      head: (sc) => {
        const custom = toRgb(sc.color);
        const sub = custom ? "Custom color" : mapRgb(sc.option) ? "Color from map" : "";
        return { icon: sc.icon || "mdi:palette", name: sc.name || sc.option || "New scene", sub: sc.option && sc.name ? `${sc.option}${sub ? " · " + sub : ""}` : sub };
      },
      // the form shows the effective color, but a color equal to the map's is not written
      toForm: (sc) => {
        const rgb = toRgb(sc.color) || mapRgb(sc.option);
        return { ...sc, color: rgb ? rgb.split(",").map(Number) : undefined };
      },
      fromForm: (v) => {
        const rgb = Array.isArray(v.color) && v.color.length === 3 ? v.color.join(",") : null;
        return { ...v, color: rgb && rgb !== mapRgb(v.option) ? v.color : undefined };
      },
      newItem: () => ({ icon: "mdi:palette" }),
      commit: this._commitList("scenes"),
    });

    this._bottom = this._makeForm([], onFormChange(() => getBottomSchema(this._config)));
    this.appendChild(this._bottom);
  }

  _sync() {
    if (!this._config || !this._hass) return;
    if (!this._built) this._build();
    this._top.hass = this._bottom.hass = this._hass;
    const cfg = this._config;
    const data = { ...EDITOR_DEFAULTS, ...cfg };
    this._top.data = data;

    const vis = resolveSections(cfg);
    const schemaKey = JSON.stringify([vis.includes("header"), vis.includes("scenes")]);
    if (schemaKey !== this._schemaKey) {
      this._schemaKey = schemaKey;
      this._bottom.schema = getBottomSchema(cfg);
    }
    this._bottom.data = data;

    // list editors
    this._sections.update(effectiveSections(cfg), Array.isArray(cfg.sections));
    this._colors.wrap.hidden = !vis.includes("color");
    this._segments.wrap.hidden = !vis.includes("segments");
    this._scenes.wrap.hidden = !vis.includes("scenes");
    const d = discover(this._hass, cfg.entity || "");
    this._colors.update(Array.isArray(cfg.colors) ? cfg.colors : DEFAULT_COLORS, Array.isArray(cfg.colors), this._hass);
    this._segments.update(
      Array.isArray(cfg.segments) ? cfg.segments.map((s) => (typeof s === "string" ? { entity: s } : s)) : d.segments,
      Array.isArray(cfg.segments),
      this._hass
    );
    this._scenes.update(
      (Array.isArray(cfg.scenes) ? cfg.scenes : DEFAULT_SCENES).map((s) => (typeof s === "string" ? { option: s } : s)),
      Array.isArray(cfg.scenes),
      this._hass
    );
  }
}

if (!customElements.get(TAG)) customElements.define(TAG, GoveeUplighterCard);
if (!customElements.get(EDITOR_TAG)) customElements.define(EDITOR_TAG, GoveeUplighterCardEditor);
window.customCards = window.customCards || [];
if (!window.customCards.some((c) => c.type === TAG)) {
  window.customCards.push({
    type: TAG,
    name: "Govee Uplighter Card",
    description: "Standalone card for a Govee uplighter lamp: power, brightness, colors, light segments, scenes and music mode. Mushroom or Bubble styling.",
    preview: true,
  });
}
console.info(`%c GOVEE-UPLIGHTER-CARD %c v${CARD_VERSION} `, "color:white;background:#FF9800;font-weight:700", "color:#FF9800;background:white");
