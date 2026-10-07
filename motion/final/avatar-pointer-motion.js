(() => {
  const wrap = document.querySelector(".avatar-wrap");
  const sprite = document.querySelector(".avatar-motion");
  if (!wrap || !sprite) return;

  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
  if (reducedMotion.matches) return;

  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  const smoothDamp = (current, target, velocity, smoothTime, maxSpeed, deltaTime) => {
    const safeTime = Math.max(0.0001, smoothTime);
    const omega = 2 / safeTime;
    const x = omega * deltaTime;
    const decay = 1 / (1 + x + 0.48 * x * x + 0.235 * x * x * x);
    const maxChange = maxSpeed * safeTime;
    const change = clamp(current - target, -maxChange, maxChange);
    const limitedTarget = current - change;
    const temp = (velocity + omega * change) * deltaTime;
    let nextVelocity = (velocity - omega * temp) * decay;
    let nextPosition = limitedTarget + (change + temp) * decay;
    if ((target - current > 0) === (nextPosition > target)) {
      nextPosition = target;
      nextVelocity = 0;
    }
    return [nextPosition, nextVelocity];
  };

  const atlasUrl = "motion/final/avatar-direction-atlas.webp";
  const manifestUrl = "motion/final/avatar-direction-atlas.json";
  const timelineUrl = "motion/build/timeline.json";
  const atlas = new Image();
  atlas.src = atlasUrl;

  Promise.all([
    fetch(manifestUrl).then((response) => {
      if (!response.ok) throw new Error("atlas manifest failed");
      return response.json();
    }),
    fetch(timelineUrl).then((response) => {
      if (!response.ok) throw new Error("timeline failed");
      return response.json();
    }),
    atlas.decode(),
  ]).then(([manifest, timeline]) => {
    if (manifest.frameCount !== 9 || manifest.columns !== 3 || manifest.rows !== 3) {
      throw new Error("unexpected pointer atlas");
    }
    if (timeline.type !== "grid-2d" || timeline.states.length !== manifest.frameCount) {
      throw new Error("unexpected pointer timeline");
    }

    const stateAt = new Map(timeline.states.map((state) => [`${state.row}:${state.column}`, state]));
    const threshold = timeline.grid.threshold;
    sprite.style.backgroundImage = `url("${atlasUrl}")`;
    sprite.style.backgroundSize = `${manifest.columns * 100}% ${manifest.rows * 100}%`;

    let pointerX = innerWidth / 2;
    let pointerY = innerHeight / 2;
    let pointerActive = false;
    let targetX = 0;
    let targetY = 0;
    let currentX = 0;
    let currentY = 0;
    let velocityX = 0;
    let velocityY = 0;
    let lastTime = 0;
    let lastFrame = -1;
    let raf = 0;
    let visible = true;

    const renderFrame = (row, column) => {
      const state = stateAt.get(`${row}:${column}`);
      if (!state || state.frame === lastFrame) return;
      const x = manifest.columns === 1 ? 0 : (column / (manifest.columns - 1)) * 100;
      const y = manifest.rows === 1 ? 0 : (row / (manifest.rows - 1)) * 100;
      sprite.style.backgroundPosition = `${x}% ${y}%`;
      lastFrame = state.frame;
      wrap.dataset.motionState = state.id;
    };

    const quantize = (value) => value < -threshold ? 0 : value > threshold ? 2 : 1;

    const loop = (now) => {
      raf = 0;
      if (!visible || document.hidden) return;
      const rect = wrap.getBoundingClientRect();
      const horizontalRange = Math.max(innerWidth * 0.36, rect.width);
      const verticalRange = Math.max(innerHeight * 0.38, rect.height);
      targetX = pointerActive
        ? clamp((pointerX - (rect.left + rect.width / 2)) / horizontalRange, -1, 1)
        : 0;
      targetY = pointerActive
        ? clamp((pointerY - (rect.top + rect.height * 0.42)) / verticalRange, -1, 1)
        : 0;

      const deltaTime = lastTime ? Math.min((now - lastTime) / 1000, 1 / 30) : 1 / 60;
      lastTime = now;
      [currentX, velocityX] = smoothDamp(currentX, targetX, velocityX, 0.12, 5.5, deltaTime);
      [currentY, velocityY] = smoothDamp(currentY, targetY, velocityY, 0.12, 5.5, deltaTime);
      renderFrame(quantize(currentY), quantize(currentX));

      if (
        Math.abs(targetX - currentX) > 0.002 ||
        Math.abs(targetY - currentY) > 0.002 ||
        Math.abs(velocityX) > 0.002 ||
        Math.abs(velocityY) > 0.002
      ) raf = requestAnimationFrame(loop);
    };

    const schedule = () => {
      if (!raf && visible && !document.hidden) raf = requestAnimationFrame(loop);
    };

    addEventListener("pointermove", (event) => {
      pointerActive = true;
      pointerX = event.clientX;
      pointerY = event.clientY;
      schedule();
    }, { passive: true });

    addEventListener("mouseout", (event) => {
      if (event.relatedTarget) return;
      pointerActive = false;
      schedule();
    });

    addEventListener("blur", () => {
      pointerActive = false;
      schedule();
    });

    document.addEventListener("visibilitychange", schedule);
    new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) schedule();
    }).observe(wrap);
    new ResizeObserver(schedule).observe(wrap);

    renderFrame(1, 1);
    wrap.classList.add("motion-ready");
  }).catch(() => {
    wrap.classList.remove("motion-ready");
  });
})();
