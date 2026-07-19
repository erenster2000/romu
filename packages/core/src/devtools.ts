import type { RomuAdapter } from "./adapter.js";
import type { RomuConfig } from "./config.js";
import { simulatorBridge } from "./simulator.js";

/** The environment `romu dev` is emulating for a given page load. */
export const SIMULATOR = "simulator";

/**
 * Shared helpers every injected dev script can rely on:
 * `__ROMU_DEV__.log` and `__ROMU_DEV__.toast`.
 */
export function devHelpers(): string {
  return `window.__ROMU_DEV__ = {
  log: function () { console.log.apply(console, arguments); },
  toast: function (message) {
    var el = document.createElement("div");
    el.textContent = message;
    el.style.cssText =
      "position:fixed;top:12px;left:50%;transform:translateX(-50%);" +
      "background:#111;color:#fff;padding:8px 14px;border-radius:8px;" +
      "font:13px system-ui,sans-serif;z-index:99999;opacity:.95;pointer-events:none";
    var mount = function () { document.body.appendChild(el); setTimeout(function () { el.remove(); }, 2200); };
    if (document.body) { mount(); } else { document.addEventListener("DOMContentLoaded", mount); }
  }
};`;
}

/**
 * Picks the LAN URL a phone can actually reach. Multi-interface machines
 * (VPNs, VMs, container bridges) surface bogus addresses first, so prefer
 * real private ranges and never loopback: 192.168.* > 10.* > 172.16-31.*.
 */
export function pickLanUrl(urls: string[]): string | undefined {
  const score = (url: string): number => {
    if (url.includes("//127.")) return -1;
    if (url.includes("//192.168.")) return 3;
    if (/\/\/10\./.test(url)) return 2;
    if (/\/\/172\.(1[6-9]|2\d|3[01])\./.test(url)) return 1;
    return 0;
  };
  return urls
    .filter((url) => score(url) >= 0)
    .sort((a, b) => score(b) - score(a))[0];
}

/**
 * Viewport presets for the phone-framed preview. Small Android first — the
 * audience playables actually run for — so taşma bugs show up by default.
 */
export const DEVICES: { id: string; label: string }[] = [
  { id: "360x640", label: "Android S (360×640)" },
  { id: "390x844", label: "Phone M (390×844)" },
  { id: "430x932", label: "Phone L (430×932)" },
  { id: "768x1024", label: "Tablet (768×1024)" },
];

export interface FrameState {
  /** Preset id, e.g. "360x640". */
  device: string;
  landscape: boolean;
}

/**
 * The dev overlay: a tiny corner badge that expands into a panel with the
 * environment picker, the device-frame picker, chaos controls (volume /
 * viewability via the environment hooks — reached inside the preview iframe
 * when framed), and the size HUD. Collapsed state persists in localStorage;
 * Ctrl+. hides the overlay entirely. Never captures input outside its box.
 */
export function devPanel(
  networks: string[],
  selected: string,
  frame: FrameState | null = null,
): string {
  const options = [SIMULATOR, ...networks];
  return `(function () {
  var LS = "romu-dev-overlay";
  var root, panel, badge;

  function el(tag, css, text) {
    var node = document.createElement(tag);
    if (css) node.style.cssText = css;
    if (text) node.textContent = text;
    return node;
  }
  function chip(label, onClick) {
    var b = el("button",
      "background:#222;color:#fff;border:1px solid #444;border-radius:5px;" +
      "font:11px system-ui;padding:3px 8px;cursor:pointer", label);
    b.onclick = onClick;
    return b;
  }
  function row(label) {
    var r = el("div", "display:flex;gap:5px;align-items:center;margin-top:7px");
    r.appendChild(el("span", "opacity:.6;min-width:52px;font:11px system-ui", label));
    return r;
  }

  function mount() {
    root = el("div",
      "position:fixed;bottom:12px;right:12px;z-index:99999;color:#fff;" +
      "font:12px system-ui,sans-serif;display:flex;flex-direction:column;align-items:flex-end;gap:6px");

    panel = el("div",
      "background:#111;border:1px solid #333;border-radius:10px;padding:10px 12px;" +
      "min-width:310px;box-shadow:0 4px 20px rgba(0,0,0,.4);display:none");

    var FRAME = ${JSON.stringify(frame)};
    var NETWORK = ${JSON.stringify(selected)};

    function navigate(network, device, landscape) {
      var url;
      if (device === "none") {
        url = new URL(location.origin + "/");
      } else {
        url = new URL(location.origin + "/__romu/frame");
        url.searchParams.set("device", device);
        if (landscape) url.searchParams.set("land", "1");
      }
      if (network !== ${JSON.stringify(SIMULATOR)}) url.searchParams.set("network", network);
      location.href = url.toString();
    }

    // environment row
    var envRow = row("env");
    var select = el("select",
      "background:#222;color:#fff;border:1px solid #444;border-radius:4px;font:12px system-ui;flex:1");
    ${JSON.stringify(options)}.forEach(function (id) {
      var option = document.createElement("option");
      option.value = id;
      option.textContent = id;
      if (id === NETWORK) option.selected = true;
      select.appendChild(option);
    });
    select.onchange = function () {
      navigate(select.value, FRAME ? FRAME.device : "none", FRAME ? FRAME.landscape : false);
    };
    envRow.appendChild(select);
    panel.appendChild(envRow);

    // device-frame row
    var devRow = row("device");
    var devSelect = el("select",
      "background:#222;color:#fff;border:1px solid #444;border-radius:4px;font:12px system-ui;flex:1");
    [{ id: "none", label: "no frame" }].concat(${JSON.stringify(DEVICES)}).forEach(function (d) {
      var option = document.createElement("option");
      option.value = d.id;
      option.textContent = d.label;
      if (FRAME ? d.id === FRAME.device : d.id === "none") option.selected = true;
      devSelect.appendChild(option);
    });
    devSelect.onchange = function () {
      navigate(NETWORK, devSelect.value, FRAME ? FRAME.landscape : false);
    };
    devRow.appendChild(devSelect);
    if (FRAME) {
      devRow.appendChild(chip("rotate", function () {
        navigate(NETWORK, FRAME.device, !FRAME.landscape);
      }));
    }
    panel.appendChild(devRow);

    // chaos rows — hooks live in the game page; inside the preview iframe
    // when framed, so resolve them lazily at click time.
    function getEnv() {
      var iframe = document.getElementById("__romu_frame__");
      var win = iframe && iframe.contentWindow ? iframe.contentWindow : window;
      return win.__ROMU_ENV__;
    }
    var hasEnv = FRAME ? true : !!window.__ROMU_ENV__;
    if (hasEnv) {
      var volRow = row("volume");
      var slider = el("input",
        "flex:1;accent-color:#e94560;cursor:pointer");
      slider.type = "range";
      slider.min = "0";
      slider.max = "100";
      slider.value = "100";
      var volLabel = el("span", "min-width:30px;text-align:right;font:11px ui-monospace,monospace", "100");
      slider.oninput = function () {
        volLabel.textContent = slider.value;
        var env = getEnv();
        if (env && env.setVolume) env.setVolume(Number(slider.value) / 100);
      };
      volRow.appendChild(slider);
      volRow.appendChild(volLabel);
      panel.appendChild(volRow);

      var viewRow = row("ad");
      viewRow.title = "Simulates the container hiding the ad (user scrolled away). The game should pause.";
      var adVisible = true;
      var toggle = chip("hide ad", function () {
        var env = getEnv();
        if (!env || !env.setViewable) return;
        adVisible = !adVisible;
        env.setViewable(adVisible);
        toggle.textContent = adVisible ? "hide ad" : "show ad";
      });
      viewRow.appendChild(toggle);
      panel.appendChild(viewRow);
    }

    // size HUD — one aligned row per network with a budget bar
    var sizeBox = el("div", "margin-top:7px");
    var sizeHead = row("size");
    var sizeStatus = el("span", "opacity:.5;flex:1", "not measured");
    var measureBtn = chip("measure", function () {
      sizeStatus.textContent = "building\\u2026";
      fetch("/__romu/measure")
        .then(function (r) { return r.json(); })
        .then(function (results) {
          sizeStatus.textContent = "";
          sizeBox.querySelectorAll(".romu-size-row").forEach(function (n) { n.remove(); });
          results.forEach(function (r) {
            var line = el("div",
              "display:flex;gap:8px;align-items:center;margin-top:5px");
            line.className = "romu-size-row";
            line.appendChild(el("span", "min-width:64px;font:11px ui-monospace,monospace", r.network));
            var track = el("div",
              "flex:1;height:6px;background:#2a2a2a;border-radius:3px;overflow:hidden");
            var color = r.pct < 60 ? "#3fb27f" : r.pct < 90 ? "#e0a63c" : "#e94560";
            var fill = el("div", "height:100%;border-radius:3px;background:" + color);
            fill.style.width = Math.min(r.pct, 100) + "%";
            track.appendChild(fill);
            line.appendChild(track);
            line.appendChild(el("span",
              "font:11px ui-monospace,monospace;opacity:.85;min-width:96px;text-align:right",
              r.pretty.replace(" / ", "\\u2009/\\u2009") ));
            line.appendChild(el("span",
              "font:11px ui-monospace,monospace;min-width:34px;text-align:right", r.pct + "%"));
            sizeBox.appendChild(line);
          });
        })
        .catch(function () { sizeStatus.textContent = "measure failed"; });
    });
    sizeHead.appendChild(sizeStatus);
    sizeHead.appendChild(measureBtn);
    sizeBox.appendChild(sizeHead);
    panel.appendChild(sizeBox);

    var hint = el("div", "opacity:.4;margin-top:8px;font:10px system-ui", "Ctrl+. hides \\u00b7 romu dev");
    panel.appendChild(hint);

    badge = el("button",
      "width:30px;height:30px;border-radius:50%;border:1px solid #333;background:#111;" +
      "color:#fff;font:bold 13px system-ui;cursor:pointer;box-shadow:0 2px 10px rgba(0,0,0,.35)", "R");
    badge.title = "Romu dev panel";
    badge.onclick = function () {
      var open = panel.style.display === "none";
      panel.style.display = open ? "block" : "none";
      try { localStorage.setItem(LS, open ? "open" : "closed"); } catch (e) {}
    };

    root.appendChild(panel);
    root.appendChild(badge);
    document.body.appendChild(root);

    try {
      if (localStorage.getItem(LS) === "open") panel.style.display = "block";
      if (localStorage.getItem(LS) === "hidden") root.style.display = "none";
    } catch (e) {}

    document.addEventListener("keydown", function (event) {
      if (event.ctrlKey && event.key === ".") {
        var hidden = root.style.display === "none";
        root.style.display = hidden ? "flex" : "none";
        try { localStorage.setItem(LS, hidden ? "closed" : "hidden"); } catch (e) {}
      }
    });
  }

  if (document.body) mount(); else document.addEventListener("DOMContentLoaded", mount);
})();`;
}

/**
 * The phone-framed preview shell: a dark page centering a bezeled iframe at
 * the chosen viewport, with the overlay panel controlling both the frame and
 * the game inside it. The iframe loads the normal dev page with __framed=1
 * so the game gets its environment scripts but no second overlay.
 */
export function frameShell(
  networks: string[],
  selected: string,
  frame: FrameState,
): string {
  const preset = DEVICES.find((d) => d.id === frame.device) ?? DEVICES[0];
  const [w = 360, h = 640] = (preset as { id: string }).id
    .split("x")
    .map(Number);
  const width = frame.landscape ? h : w;
  const height = frame.landscape ? w : h;
  const gameUrl =
    selected === SIMULATOR
      ? "/?__framed=1"
      : `/?__framed=1&network=${encodeURIComponent(selected)}`;
  const label = `${preset?.label ?? frame.device}${frame.landscape ? " · landscape" : ""} — ${selected}`;

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<title>romu preview</title>
<style>
  html, body { margin: 0; height: 100%; background: #17171d; }
  body { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 14px; font: 12px system-ui, sans-serif; color: #888; }
  .bezel { background: #000; border: 2px solid #333; border-radius: 26px; padding: 14px 10px; box-shadow: 0 12px 40px rgba(0,0,0,.5); }
  iframe { display: block; width: ${width}px; height: ${height}px; border: 0; border-radius: 14px; background: #1a1a2e; }
</style>
<script>${devHelpers()}</script>
<script>${devPanel(networks, selected, frame)}</script>
</head>
<body>
<div class="bezel"><iframe id="__romu_frame__" src="${gameUrl}"></iframe></div>
<div>${label}</div>
</body>
</html>`;
}

/**
 * Everything to inject for one page load: helpers, then the environment
 * (network mock + that network's real bridge, or the generic simulator),
 * then the overlay panel (unless disabled). Pure — easy to test.
 */
export function devScripts(
  requested: string,
  config: RomuConfig,
  adapters: RomuAdapter[],
  { overlay = true }: { overlay?: boolean } = {},
): { selected: string; scripts: string[] } {
  const mockable = adapters.filter((a) => a.devMock);
  const networks = mockable.map((a) => a.name);
  const adapter = mockable.find((a) => a.name === requested);
  const selected = adapter ? requested : SIMULATOR;

  const scripts = [devHelpers()];
  if (adapter?.devMock) {
    scripts.push(adapter.devMock(), adapter.bridge(config));
  } else {
    scripts.push(simulatorBridge(config));
  }
  if (overlay) scripts.push(devPanel(networks, selected));
  return { selected, scripts };
}
