/**
 * Unity LevelPlay (ironSource) playable adapter — the dapi protocol.
 * Delivery: one self-contained HTML file, max 5 MB, CTA via dapi.openStoreUrl().
 * The bridge waits for dapi readiness and viewability before starting the game.
 */

import type {
  BuildOutput,
  RomuAdapter,
  RomuPackage,
  ValidationIssue,
} from "@romujs/core";
import { levelplay } from "@romujs/specs";

export const levelplayAdapter: RomuAdapter = {
  name: "levelplay",
  spec: levelplay,

  bridge(): string {
    // dapi.openStoreUrl() takes no URL — the network injects the destination.
    return `window.__ROMU_BRIDGE__ = (function () {
  function domReady(cb) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", function () { cb(); });
    } else {
      cb();
    }
  }
  function whenViewable(cb) {
    if (typeof dapi !== "undefined" && dapi.isViewable && !dapi.isViewable()) {
      dapi.addEventListener("viewableChange", function once(event) {
        if (event && event.isViewable) {
          dapi.removeEventListener("viewableChange", once);
          cb();
        }
      });
    } else {
      cb();
    }
  }
  return {
    cta: function () {
      if (typeof dapi !== "undefined" && dapi.openStoreUrl) {
        dapi.openStoreUrl();
      } else {
        console.warn("[romu] dapi unavailable - CTA ignored outside the LevelPlay container");
      }
    },
    onReady: function (cb) {
      if (typeof dapi === "undefined") {
        domReady(cb);
      } else if (dapi.isReady && dapi.isReady()) {
        whenViewable(cb);
      } else {
        dapi.addEventListener("ready", function () { whenViewable(cb); });
      }
    },
    onVolumeChange: function (cb) {
      if (typeof dapi !== "undefined" && dapi.addEventListener) {
        // dapi reports percentages; the SDK contract is 0..1.
        dapi.addEventListener("audioVolumeChange", function (volume) {
          cb(typeof volume === "number" ? volume / 100 : 0);
        });
      }
    }
  };
})();`;
  },

  package(build: BuildOutput): RomuPackage {
    return {
      files: [
        { path: "playable.html", contents: Buffer.from(build.html, "utf8") },
      ],
      primary: "playable.html",
    };
  },

  validate(pkg: RomuPackage): ValidationIssue[] {
    const issues: ValidationIssue[] = [];
    const primary = pkg.files.find((f) => f.path === pkg.primary);
    if (!primary) return [];

    if (!primary.contents.toString("utf8").includes("dapi.openStoreUrl")) {
      issues.push({
        severity: "error",
        message:
          "dapi.openStoreUrl not found — LevelPlay playables must exit through dapi",
      });
    }

    return issues;
  },

  devMock(): string {
    // A fake dapi container: ready after a delay, viewable a beat later,
    // viewableChange delivers { isViewable } objects like the real one.
    return `window.dapi = (function () {
  var ready = false;
  var viewable = false;
  var listeners = {};
  function emit(event, payload) {
    (listeners[event] || []).slice().forEach(function (cb) { cb(payload); });
  }
  setTimeout(function () {
    ready = true;
    emit("ready");
    window.__ROMU_DEV__ && window.__ROMU_DEV__.log("[dapi-mock] ready");
    setTimeout(function () {
      viewable = true;
      emit("viewableChange", { isViewable: true });
      window.__ROMU_DEV__ && window.__ROMU_DEV__.log("[dapi-mock] viewable");
    }, 800);
  }, 300);
  window.__ROMU_ENV__ = {
    setVolume: function (volume) {
      window.__ROMU_DEV__ && window.__ROMU_DEV__.log("[dapi-mock] audioVolumeChange", volume);
      emit("audioVolumeChange", volume * 100);
    },
    setViewable: function (value) {
      viewable = value;
      window.__ROMU_DEV__ && window.__ROMU_DEV__.log("[dapi-mock] viewableChange", value);
      emit("viewableChange", { isViewable: value });
    }
  };
  return {
    isReady: function () { return ready; },
    isViewable: function () { return viewable; },
    getAudioVolume: function () { return 100; },
    addEventListener: function (event, cb) {
      (listeners[event] = listeners[event] || []).push(cb);
    },
    removeEventListener: function (event, cb) {
      listeners[event] = (listeners[event] || []).filter(function (x) { return x !== cb; });
    },
    openStoreUrl: function () {
      window.__ROMU_DEV__ && window.__ROMU_DEV__.toast("dapi.openStoreUrl()");
      console.log("[dapi-mock] openStoreUrl");
    }
  };
})();`;
  },
};

export default levelplayAdapter;
