(() => {
  const progress = document.querySelector(".scroll-progress");
  const dialog = document.querySelector("#source-dialog");
  const openButton = document.querySelector("#open-source");
  const closeButton = document.querySelector("#close-source");

  const updateProgress = () => {
    const distance = document.documentElement.scrollHeight - window.innerHeight;
    const value = distance > 0 ? (window.scrollY / distance) * 100 : 0;
    progress.style.width = `${Math.min(100, Math.max(0, value))}%`;
  };

  const openDialog = () => {
    dialog.showModal();
    document.body.classList.add("modal-open");
    closeButton.focus();
  };

  const closeDialog = () => dialog.close();

  window.addEventListener("scroll", updateProgress, { passive: true });
  window.addEventListener("resize", updateProgress);
  openButton.addEventListener("click", openDialog);
  closeButton.addEventListener("click", closeDialog);
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) closeDialog();
  });
  dialog.addEventListener("close", () => {
    document.body.classList.remove("modal-open");
    openButton.focus();
  });
  dialog.addEventListener("cancel", () => {
    document.body.classList.remove("modal-open");
  });
  updateProgress();
})();
