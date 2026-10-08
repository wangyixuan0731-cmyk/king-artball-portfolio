(() => {
  const root = document.documentElement;
  const screen = document.querySelector("#loading-screen");
  const home = document.querySelector("#home-screen");

  if (!screen || !root.classList.contains("loader-pending")) {
    if (screen) screen.hidden = true;
    return;
  }

  const runner = screen.querySelector(".loader-runner");
  const progress = screen.querySelector(".loader-progress");
  const progressFill = screen.querySelector(".loader-progress-fill");
  const progressValue = screen.querySelector(".loader-progress-value");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let animationFrame = 0;
  let finished = false;
  let lastFrame = -1;
  let lastPercent = -1;

  screen.hidden = false;
  document.body.classList.add("loading-active");
  if (home) home.inert = true;

  const setProgress = (percent) => {
    const rounded = Math.max(0, Math.min(100, Math.round(percent)));
    if (rounded === lastPercent) return;
    lastPercent = rounded;
    progressFill.style.width = `${rounded}%`;
    progressValue.textContent = String(rounded);
    progress.setAttribute("aria-valuenow", String(rounded));
  };

  const finish = () => {
    if (finished) return;
    finished = true;
    cancelAnimationFrame(animationFrame);
    setProgress(100);
    try {
      sessionStorage.setItem("king-artball-loader-seen", "1");
    } catch (_) {}
    screen.classList.add("is-leaving");
    window.setTimeout(() => {
      screen.hidden = true;
      root.classList.remove("loader-pending");
      document.body.classList.remove("loading-active");
      if (home) home.inert = false;
    }, reducedMotion ? 80 : 460);
  };

  const loadJson = async (url) => {
    const response = await fetch(url, { cache: "force-cache" });
    if (!response.ok) throw new Error(`Failed to load ${url}: ${response.status}`);
    return response.json();
  };

  const start = async () => {
    const startTime = performance.now();
    try {
      const [timeline, atlas] = await Promise.all([
        loadJson("loading/motion/build/timeline.json"),
        loadJson("loading/motion/final/loading-run-atlas.json"),
      ]);

      if (reducedMotion) {
        setProgress(100);
        window.setTimeout(finish, 360);
        return;
      }

      const atlasImage = new Image();
      atlasImage.src = `loading/motion/final/${atlas.asset}`;
      await atlasImage.decode();
      runner.style.backgroundImage = `url("${atlasImage.src}")`;
      runner.style.backgroundSize = `${atlas.columns * 100}% ${atlas.rows * 100}%`;

      const durationMs = timeline.loadingDuration * 1000;
      const tick = (now) => {
        const elapsed = Math.max(0, now - startTime);
        const percent = Math.min(100, (elapsed / durationMs) * 100);
        setProgress(percent);

        const frame = Math.floor((elapsed / 1000) * timeline.fps) % atlas.frameCount;
        if (frame !== lastFrame) {
          lastFrame = frame;
          const column = frame % atlas.columns;
          const row = Math.floor(frame / atlas.columns);
          const x = atlas.columns === 1 ? 0 : (column / (atlas.columns - 1)) * 100;
          const y = atlas.rows === 1 ? 0 : (row / (atlas.rows - 1)) * 100;
          runner.style.backgroundPosition = `${x}% ${y}%`;
        }

        if (elapsed >= durationMs) {
          finish();
          return;
        }
        animationFrame = requestAnimationFrame(tick);
      };

      animationFrame = requestAnimationFrame(tick);
    } catch (error) {
      console.warn("Loading animation fallback:", error);
      finish();
    }
  };

  start();
})();
