(function () {
  "use strict";

  const loadedScripts = new Set(
    Array.from(document.scripts)
      .map((script) => script.getAttribute("src"))
      .filter(Boolean)
  );

  function waitForDomReady() {
    return new Promise((resolve) => {
      if (document.readyState !== "loading") {
        resolve();
        return;
      }

      let resolved = false;
      const done = () => {
        if (resolved) return;
        resolved = true;
        resolve();
      };

      document.addEventListener("DOMContentLoaded", done, { once: true });
      window.addEventListener("load", done, { once: true });
      
      // Safe fallback: force resolve after 20ms if events are missed
      setTimeout(done, 20);
    });
  }

  function showBootError(message) {
    const app = document.querySelector("#app") || document.body;
    const safeMessage = escapeHtml(String(message || "페이지를 불러오지 못했습니다."));
    app.innerHTML = `
      <div class="boot-panel boot-panel-error" role="alert">
        <strong>자료를 불러오지 못했습니다.</strong>
        <span>${safeMessage}</span>
      </div>
    `;
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function normalizeSrc(src) {
    const link = document.createElement("a");
    link.href = src;
    return link.href;
  }

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const normalized = normalizeSrc(src);
      if (loadedScripts.has(src) || loadedScripts.has(normalized)) {
        resolve();
        return;
      }

      const script = document.createElement("script");
      script.src = src;
      script.async = false;
      script.onload = () => {
        loadedScripts.add(src);
        loadedScripts.add(normalized);
        resolve();
      };
      script.onerror = () => reject(new Error(`${src} 파일을 불러오지 못했습니다.`));
      document.head.appendChild(script);
    });
  }

  async function loadSequential(scripts) {
    for (const src of scripts || []) {
      await loadScript(src);
    }
  }

  async function loadAfterAccess(options) {
    const {
      scripts = [],
      redirectTo = "login.html",
      userChipId = "userChip",
      domReadyBeforeScripts = true,
      onDenied,
      onError,
    } = options || {};

    try {
      if (!window.GaongilAuth) {
        throw new Error("인증 모듈을 찾을 수 없습니다.");
      }

      await window.GaongilAuth.ensureSeedUsers();
      const session = window.GaongilAuth.requirePageAccess(redirectTo);
      if (!session) {
        if (typeof onDenied === "function") onDenied();
        return false;
      }

      if (userChipId) {
        const mountChip = () => window.GaongilAuth.mountUserChip(userChipId);
        if (document.getElementById(userChipId)) mountChip();
        else waitForDomReady().then(mountChip);
      }

      if (domReadyBeforeScripts) await waitForDomReady();
      await loadSequential(scripts);
      return true;
    } catch (error) {
      console.error("[GaongilProtected]", error);
      if (typeof onError === "function") onError(error);
      else showBootError(error && error.message);
      return false;
    }
  }

  window.GaongilProtected = {
    loadAfterAccess,
    loadScript,
  };
})();
