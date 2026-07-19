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
 * The dev overlay: a tiny corner badge that expands into a panel with the
 * environment picker, chaos buttons (volume / viewability via
 * `window.__ROMU_ENV__`), and the size HUD (POST-free GET to
 * /__romu/measure). Collapsed state persists in localStorage; Ctrl+. hides
 * the overlay entirely. Never captures input outside its own box.
 */
export function devPanel(networks: string[], selected: string): string {
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

    // environment row
    var envRow = row("env");
    var select = el("select",
      "background:#222;color:#fff;border:1px solid #444;border-radius:4px;font:12px system-ui;flex:1");
    ${JSON.stringify(options)}.forEach(function (id) {
      var option = document.createElement("option");
      option.value = id;
      option.textContent = id;
      if (id === ${JSON.stringify(selected)}) option.selected = true;
      select.appendChild(option);
    });
    select.onchange = function () {
      var url = new URL(location.href);
      if (select.value === ${JSON.stringify(SIMULATOR)}) url.searchParams.delete("network");
      else url.searchParams.set("network", select.value);
      location.href = url.toString();
    };
    envRow.appendChild(select);
    panel.appendChild(envRow);

    // chaos rows — only when the current environment exposes hooks
    var env = window.__ROMU_ENV__;
    if (env && env.setVolume) {
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
        env.setVolume(Number(slider.value) / 100);
      };
      volRow.appendChild(slider);
      volRow.appendChild(volLabel);
      panel.appendChild(volRow);
    }
    if (env && env.setViewable) {
      var viewRow = row("ad");
      viewRow.title = "Simulates the container hiding the ad (user scrolled away). The game should pause.";
      var adVisible = true;
      var toggle = chip("hide ad", function () {
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
