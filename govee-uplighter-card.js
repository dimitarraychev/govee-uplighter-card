/*
 * Govee Uplighter Card
 * Power, brightness, colors, light segments, scenes and music mode for a
 * Govee uplighter lamp in one standalone card. Mushroom or Bubble styling.
 * Works on a dashboard or inside a Bubble Card pop-up.
 */
const TAG = "govee-uplighter-card";
const EDITOR_TAG = "govee-uplighter-card-editor";
const CARD_VERSION = "0.1.0-beta";

const OFF_RGB = "142,142,147";
const WARM_RGB = "255,193,7";
const MUSIC_RGB = "175,82,222";
const UNAVAILABLE = ["unavailable", "unknown"];
const COLOR_MODES = ["hs", "xy", "rgb", "rgbw", "rgbww"];

const DEFAULT_COLORS = ["#ff3b30", "#ff9500", "#ffcc00", "#34c759", "#00c7be", "#007aff", "#af52de", "#ff2d92", "#ffffff"];
const DEFAULT_SCENES = [
  { option: "Sleep", icon: "mdi:power-sleep", color: "63,81,181" },
  { option: "Cornfield", icon: "mdi:corn", color: "255,193,7" },
  { option: "Desert", icon: "mdi:island", color: "76,175,80" },
  { option: "Venus", icon: "mdi:orbit", color: "255,87,34" },
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

        /* ---- sliders ---- */
        .slider {
          --pct: 0%; -webkit-appearance: none; appearance: none; width: 100%; height: 34px; margin: 0; border-radius: 17px;
          cursor: pointer; outline: none; touch-action: pan-y; display: block;
          background: linear-gradient(to right, rgba(var(--fill, var(--rgb)), .85) var(--pct), color-mix(in srgb, var(--primary-text-color) 10%, transparent) var(--pct));
        }
        .slider::-webkit-slider-runnable-track { height: 34px; background: transparent; }
        .slider::-webkit-slider-thumb { -webkit-appearance: none; width: 0; height: 34px; }
        .slider::-moz-range-track { height: 34px; background: transparent; }
        .slider::-moz-range-thumb { width: 0; height: 34px; border: none; }
        .slider.ct { background: linear-gradient(to right, #ff9d3a, #fff3e0 50%, #a8d0ff); }
        .slider.ct::-webkit-slider-thumb { width: 8px; height: 34px; border-radius: 4px; background: #fff; box-shadow: 0 0 0 2px rgba(0,0,0,.35); }
        .slider.ct::-moz-range-thumb { width: 8px; height: 34px; border-radius: 4px; background: #fff; box-shadow: 0 0 0 2px rgba(0,0,0,.35); }
        .slider[disabled] { opacity: .4; pointer-events: none; }

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
        .mus.dim .chips, .mus.dim .slider { opacity: .55; }

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
          <input class="slider" type="range" min="1" max="100" step="1" aria-label="Brightness" />
        </div>

        <div class="sec col" hidden>
          <div class="stitle"><ha-icon icon="mdi:palette"></ha-icon><span>Color</span></div>
          <div class="swatches"></div>
          <div class="ctwrap" hidden>
            <div class="stitle sm"><ha-icon icon="mdi:thermometer"></ha-icon><span>White temperature</span><b class="val"></b></div>
            <input class="slider ct" type="range" min="2000" max="9000" step="100" aria-label="White temperature" />
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
            <input class="slider" type="range" style="--fill:${MUSIC_RGB}" aria-label="Music sensitivity" />
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
      show_header: true,
      show_brightness: true,
      show_color: true,
      show_segments: true,
      show_scenes: true,
      show_music: true,
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
    const c = this._config || {};
    let n = c.show_header !== false ? 1 : 0;
    if (c.show_brightness !== false) n += 1;
    if (c.show_color !== false) n += 1;
    if (c.show_segments !== false) n += 1;
    if (c.show_scenes !== false) n += 2;
    if (c.show_music !== false) n += 2;
    return Math.max(n, 1);
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
      .map((s) => ({ option: s.option, name: s.name || s.option, icon: s.icon || "mdi:palette", rgb: toRgb(s.color) }));
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

  _wireSlider(el, key, valEl, fmt, send) {
    const pct = () => `${((Number(el.value) - Number(el.min)) / Math.max(Number(el.max) - Number(el.min), 1)) * 100}%`;
    el.addEventListener("pointerdown", () => { this._drag = key; });
    ["pointerup", "pointercancel", "blur"].forEach((ev) => el.addEventListener(ev, () => { if (this._drag === key) this._drag = null; }));
    el.addEventListener("input", () => {
      const v = Number(el.value);
      el.style.setProperty("--pct", pct());
      valEl.textContent = fmt(v);
      this._setPend(key, v);
      const now = Date.now();
      if (now - (this._lastSend[key] || 0) > 250) { this._lastSend[key] = now; send(v); }
    });
    el.addEventListener("change", () => {
      const v = Number(el.value);
      this._lastSend[key] = Date.now();
      this._setPend(key, v);
      send(v);
    });
  }

  _setSlider(el, key, v, min, max, step) {
    el.min = min; el.max = max; el.step = step;
    if (this._drag !== key) el.value = v;
    el.style.setProperty("--pct", `${((Number(v) - min) / Math.max(max - min, 1)) * 100}%`);
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
    const accent = override || (on ? (rgbStr && !nearWhite ? rgbStr : WARM_RGB) : OFF_RGB);

    const e = this._ents();
    const sceneSt = e.scene && hass.states[e.scene];
    const sceneOptions = sceneSt?.attributes?.options || [];
    const sceneCur = sceneSt && !UNAVAILABLE.includes(sceneSt.state) ? sceneSt.state : "";
    const curBase = baseName(sceneCur);

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
    const showHeader = cfg.show_header !== false;
    const opts = [
      showHeader, bubble, animate, cfg.show_brightness !== false, cfg.show_color !== false, cfg.show_segments !== false,
      cfg.show_scenes !== false, cfg.show_music !== false, cfg.show_scene_labels, cfg.show_scene_select !== false,
      cfg.show_random !== false, cfg.show_color_picker !== false,
    ];
    const key = JSON.stringify([m, opts]);
    if (key === this._key) return;
    this._key = key;

    this._card.classList.toggle("bubble", bubble);
    this._card.classList.toggle("static", !animate);
    this._head.hidden = !showHeader;
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
    this._bri.hidden = !(cfg.show_brightness !== false && m.hasBri);
    this._briVal.textContent = m.on || m.bri ? `${m.bri}%` : "Off";
    this._setSlider(this._briSlider, "bri", m.bri || 1, 1, 100, 1);

    // color + white temperature
    const showColor = cfg.show_color !== false && (m.hasColor || m.hasCt);
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
    const showSeg = cfg.show_segments !== false && m.segments.length > 0;
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
    const showScn = cfg.show_scenes !== false && m.hasScene;
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
    const showMus = cfg.show_music !== false && m.music.has;
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
  show_header: "Show header (icon, name, power button)",
  show_brightness: "Show brightness slider",
  show_color: "Show colors and white temperature",
  show_segments: "Show light segments",
  show_scenes: "Show scenes",
  show_music: "Show music mode",
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
  show_header: true,
  show_brightness: true,
  show_color: true,
  show_segments: true,
  show_scenes: true,
  show_music: true,
  show_random: true,
  show_scene_select: true,
  show_scene_labels: false,
  show_scene_in_header: false,
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
  { name: "show_header", selector: { boolean: {} } },
  { name: "show_brightness", selector: { boolean: {} } },
  { name: "show_color", selector: { boolean: {} } },
  { name: "show_segments", selector: { boolean: {} } },
  { name: "show_scenes", selector: { boolean: {} } },
  { name: "show_music", selector: { boolean: {} } },
];

const getBottomSchema = (cfg) => [
  ...(cfg.show_header !== false ? [{ name: "tap_action", selector: { ui_action: {} } }] : []),
  ...(cfg.show_scenes !== false
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
      { name: "show_color_picker", selector: { boolean: {} } },
      { name: "animation", selector: { boolean: {} } },
      { name: "coloring", selector: { boolean: {} } },
      { name: "icon_coloring", selector: { boolean: {} } },
    ],
  },
];

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
    this._scenes = new ListEditor(this, {
      title: "Quick scenes",
      empty: "No quick scenes. Add one below.",
      addText: "Add scene",
      labels: { option: "Scene", name: "Name (default: scene)", icon: "Icon", color: "Highlight color" },
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
      head: (s) => {
        const rgb = toRgb(s.color);
        return { icon: s.icon || "mdi:palette", name: s.name || s.option || "New scene", sub: s.option && s.name ? s.option : rgb ? `rgb(${rgb})` : "" };
      },
      toForm: (s) => ({ ...s, color: s.color != null ? (toRgb(s.color) || "").split(",").map(Number) : undefined }),
      fromForm: (v) => ({ ...v, color: Array.isArray(v.color) && v.color.length === 3 ? v.color : undefined }),
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

    const schemaKey = JSON.stringify([cfg.show_header !== false, cfg.show_scenes !== false]);
    if (schemaKey !== this._schemaKey) {
      this._schemaKey = schemaKey;
      this._bottom.schema = getBottomSchema(cfg);
    }
    this._bottom.data = data;

    // list editors
    this._colors.wrap.hidden = cfg.show_color === false;
    this._segments.wrap.hidden = cfg.show_segments === false;
    this._scenes.wrap.hidden = cfg.show_scenes === false;
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
