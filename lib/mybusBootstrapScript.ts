/** Inline script in root layout — demo session + static-host asset paths only (skipped on localhost dev). */
export const MYBUS_BOOTSTRAP_SCRIPT = `
(function () {
  var pathSegments = location.pathname.replace(/\\/+$/, "").split("/").filter(Boolean);
  var isSubpathDeploy = pathSegments.length > 0 && !/^index\\.html?$/i.test(pathSegments[pathSegments.length - 1]);
  var needsPathPatch = location.protocol === "file:" || (location.protocol.startsWith("http") && isSubpathDeploy);

  if (needsPathPatch) {
    try {
      function relNext(path) {
        if (!path || path.indexOf("/_next/") !== 0) return path;
        return "." + path;
      }
      document.querySelectorAll("link[href], script[src]").forEach(function (el) {
        var href = el.getAttribute("href");
        var src = el.getAttribute("src");
        if (href && href.indexOf("/_next/") === 0) el.setAttribute("href", relNext(href));
        if (src && src.indexOf("/_next/") === 0) el.setAttribute("src", relNext(src));
      });
    } catch (e) {}
  }

  try {
    var SESSION = "mybus_operator_session";
    var PENDING = "mybus_pending_demo_v1";
    function demoUser(kind) {
      if (kind === "owner") {
        return {
          id: "OP-DEMO",
          email: "demo@mybus.in",
          name: "Demo Owner",
          role: "Fleet owner",
          company: "MY BUS Transit Pvt Ltd",
          accountKind: "owner",
        };
      }
      return {
        id: "OP-DEMO-COUNTER",
        email: "counter@mybus.in",
        name: "Demo Counter",
        role: "Counter operator",
        company: "MY BUS Transit Pvt Ltd",
        accountKind: "counter",
      };
    }
    var pending = sessionStorage.getItem(PENDING);
    if (pending) {
      sessionStorage.removeItem(PENDING);
      var pk = pending.trim().toLowerCase() === "owner" ? "owner" : "counter";
      localStorage.setItem(SESSION, JSON.stringify(demoUser(pk)));
    }
    var params = new URLSearchParams(location.search);
    if (params.has("email") || params.has("password")) {
      params.delete("email");
      params.delete("password");
      var cleanQs = params.toString();
      history.replaceState(null, "", location.pathname + (cleanQs ? "?" + cleanQs : "") + location.hash);
    }
    var demo = params.get("demo");
    if (demo) {
      demo = demo.trim().toLowerCase();
      var kind = demo === "owner" ? "owner" : demo === "operator" || demo === "counter" ? "counter" : null;
      if (kind) {
        localStorage.setItem(SESSION, JSON.stringify(demoUser(kind)));
        params.delete("demo");
        var qs = params.toString();
        history.replaceState(null, "", location.pathname + (qs ? "?" + qs : "") + location.hash);
      }
    }
  } catch (e) {}

  window.__MYBUS_BOOT = Date.now();

  if (!needsPathPatch) return;

  function isAppChunk(el) {
    if (!el || el.tagName !== "SCRIPT") return false;
    var s = el.src || el.getAttribute("src") || "";
    if (/hot-update|webpack\\.hot-update/i.test(s)) return false;
    return /[\\/]_next[\\/]static[\\/]/.test(s);
  }

  function showScriptFail() {
    if (window.__MYBUS_READY) return;
    if (sessionStorage.getItem("mybus-dismiss-load-warning") === "1") return;
    var el = document.getElementById("mybus-script-fail");
    if (el) el.style.display = "flex";
  }

  window.addEventListener(
    "error",
    function (ev) {
      if (!ev || !ev.target) return;
      if (isAppChunk(ev.target)) showScriptFail();
    },
    true
  );

  document.addEventListener("DOMContentLoaded", function () {
    var btn = document.getElementById("mybus-dismiss-load-warning");
    if (!btn) return;
    btn.addEventListener("click", function () {
      try {
        sessionStorage.setItem("mybus-dismiss-load-warning", "1");
      } catch (e) {}
      var el = document.getElementById("mybus-script-fail");
      if (el) el.style.display = "none";
    });
  });
})();
`.trim();
