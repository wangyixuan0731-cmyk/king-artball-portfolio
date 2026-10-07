(async () => {
  const root = document.querySelector(".experience-page");
  if (!root) return;

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let timeline;
  let atlas;

  try {
    const [timelineResponse, atlasResponse] = await Promise.all([
      fetch("motion/build/timeline.json", { cache: "no-store" }),
      fetch("motion/final/avatar-peek-atlas.json", { cache: "no-store" })
    ]);
    if (!timelineResponse.ok || !atlasResponse.ok) throw new Error("motion data unavailable");
    timeline = await timelineResponse.json();
    atlas = await atlasResponse.json();
  } catch {
    root.classList.add("peek-motion-fallback");
    return;
  }

  root.style.setProperty("--peek-duration", `${timeline.loopDuration}s`);
  root.style.setProperty("--peek-delay-left", `${timeline.actors.bottomLeft.delay}s`);
  root.style.setProperty("--peek-delay-right", `${timeline.actors.topRight.delay}s`);
  const framePosition = (frame) => {
    if (atlas.frameCount <= 1) return "0% 0%";
    return `${(frame / (atlas.frameCount - 1)) * 100}% 0%`;
  };
  root.style.setProperty("--peek-left-position", framePosition(timeline.actors.bottomLeft.frame));
  root.style.setProperty("--peek-right-position", framePosition(timeline.actors.topRight.frame));

  const syncPlayback = () => {
    root.classList.toggle("peek-motion-reduced", reducedMotion.matches);
    root.classList.toggle("peek-motion-active", !reducedMotion.matches && !document.hidden);
  };

  const observer = new IntersectionObserver(
    ([entry]) => {
      root.dataset.visible = entry.isIntersecting ? "true" : "false";
      root.classList.toggle(
        "peek-motion-active",
        entry.isIntersecting && !reducedMotion.matches && !document.hidden
      );
    },
    { threshold: 0.08 }
  );

  observer.observe(root);
  document.addEventListener("visibilitychange", syncPlayback);
  reducedMotion.addEventListener?.("change", syncPlayback);
  syncPlayback();
})();
