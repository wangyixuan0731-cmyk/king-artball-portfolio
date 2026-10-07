(() => {
  const page = document.querySelector(".experience-page");
  const bubble = document.querySelector(".story-bubble");
  const closeButton = document.querySelector(".bubble-close");
  const timelineButtons = [...document.querySelectorAll(".timeline-stop")];
  const panels = [...document.querySelectorAll(".story-panel")];

  if (!page || !bubble || !closeButton || !timelineButtons.length) return;

  const closeStory = () => {
    bubble.hidden = true;
    bubble.dataset.origin = "";
    timelineButtons.forEach((button) => {
      button.classList.remove("is-active");
      button.setAttribute("aria-expanded", "false");
    });
  };

  const openStory = (button) => {
    const storyId = button.dataset.story;
    const wasOpen = !bubble.hidden && button.classList.contains("is-active");

    if (wasOpen) {
      closeStory();
      return;
    }

    panels.forEach((panel) => {
      panel.hidden = panel.id !== `story-${storyId}`;
    });

    timelineButtons.forEach((item) => {
      const active = item === button;
      item.classList.toggle("is-active", active);
      item.setAttribute("aria-expanded", String(active));
    });

    bubble.dataset.origin = storyId;
    bubble.hidden = false;
    bubble.classList.remove("is-opening");
    requestAnimationFrame(() => bubble.classList.add("is-opening"));
  };

  timelineButtons.forEach((button) => {
    button.addEventListener("click", () => openStory(button));
  });

  closeButton.addEventListener("click", closeStory);
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !bubble.hidden) closeStory();
  });
})();
