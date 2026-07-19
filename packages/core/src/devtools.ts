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
 * The floating environment picker. Changing it reloads the page with
 * ?network=<id>, which the dev server reads per request.
 */
export function devToolbar(networks: string[], selected: string): string {
  const options = [SIMULATOR, ...networks];
  return `(function () {
  function mount() {
    var bar = document.createElement("div");
    bar.style.cssText =
      "position:fixed;bottom:12px;right:12px;z-index:99999;" +
      "background:#111;color:#fff;padding:6px 10px;border-radius:8px;" +
      "font:12px system-ui,sans-serif;display:flex;gap:6px;align-items:center;opacity:.92";
    var label = document.createElement("span");
    label.textContent = "romu env";
    var select = document.createElement("select");
    select.style.cssText = "background:#222;color:#fff;border:1px solid #444;border-radius:4px;font:12px system-ui";
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
    bar.appendChild(label);
    bar.appendChild(select);
    document.body.appendChild(bar);
  }
  if (document.body) mount(); else document.addEventListener("DOMContentLoaded", mount);
})();`;
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
 * Everything to inject for one page load: helpers, then the environment
 * (network mock + that network's real bridge, or the generic simulator),
 * then the picker. Pure — easy to test.
 */
export function devScripts(
  requested: string,
  config: RomuConfig,
  adapters: RomuAdapter[],
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
  scripts.push(devToolbar(networks, selected));
  return { selected, scripts };
}
