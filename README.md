# Govee Uplighter Card for Home Assistant

A standalone, highly customizable Home Assistant Lovelace card designed specifically for **Govee uplighter lamps** (and similar multi-segment smart floor lamps). It combines power, smooth brightness control, color picking, light segment toggles, scene selection, and music sync mode into a single polished card.

Supports both standard **Mushroom-inspired** styling and **Bubble Card** styling for clean dashboard integrations or pop-up menus.

---

## Features

* **Unified Control:** Manage power, brightness, color temperature, and color states in one clean layout.
* **Segment Toggling:** Automatically discovers and lists individual lamp segments (e.g., ripple, side, top, bottom, dream effects) for precise multi-zone control.
* **Scene Management:** Built-in preset buttons plus a full dropdown selector for custom Govee scene options. Includes a random scene switcher option.
* **Music Sync Mode:** Toggle music reactive modes on/off, switch music reactivity styles (chips), and adjust sensitivity sliders.
* **Styling Options:** Choose between classic **Mushroom** styling or **Bubble Card** popup style, with toggleable background lighting glow animation.
* **Auto-Discovery:** Automatically detects related switches, select entities, and number sliders associated with the base Govee light entity.

---

## Installation (Manual)

1. Download the card script file (e.g., `govee-uplighter-card.js`) and place it in your Home Assistant `www` directory (e.g., `/config/www/govee-uplighter-card.js`).
2. Add it as a JavaScript module resource in your Home Assistant dashboard:
   * Go to **Settings** > **Dashboards** > **Resources** > **Add Resource**.
   * URL: `/local/govee-uplighter-card.js`
   * Resource type: `Module`
   *(Alternatively, if using YAML dashboard configuration)*:
   ```yaml
   resources:
     - url: /local/govee-uplighter-card.js
       type: module
   ```
   
## Usage & Configuration

Add a new custom card to your Lovelace dashboard using the following YAML configuration structure:

```yaml
type: custom:govee-uplighter-card
entity: light.living_room_uplighter_lamp
card_style: mushroom # or 'bubble'
animation: true
show_header: true
show_brightness: true
show_color: true
show_segments: true
show_scenes: true
show_music: true
```

### Configuration Options

| Name | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| **`entity`** | string | **Required** | The main light entity of your Govee uplighter. |
| **`card_style`** | string | `mushroom` | Card visual style: mushroom or bubble. |
| **`animation`** | boolean | `true` | Enables subtle glowing background animation when the lamp is on. |
| **`show_header`** | boolean | `true` | Shows the top header row (icon, name, state, power button). |
| **`show_brightness`** | boolean | `true` | Shows the brightness slider section. |
| **`show_color`** | boolean | `true` | Shows the color swatches and white color temperature slider. |
| **`show_segments`** | boolean | `true` | Shows discovered segment control tiles. |
| **`show_scenes`** | boolean | `true` | Shows preset scene buttons and scene dropdown. |
| **`show_music`** | boolean | `true` | Shows the music mode toggle switch, chips, and sensitivity slider. |
| **`tap_action`** | object | `more-info` | Action triggered when clicking the card header (e.g., more-info, navigate, call-service). |
