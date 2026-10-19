const body = document.body;
const config = window.CHARACTERS?.[body.dataset.characterPage];
const shell = document.querySelector(".character-shell");
const chapterNav = document.getElementById("chapterNav");
const articles = Array.from(document.querySelectorAll(".chapter-section"));
const galleryGrid = document.getElementById("galleryGrid");
const openLegalButton = document.getElementById("openLegal");
const jumpToGalleryButton = document.getElementById("jumpToGallery");
const legalOverlay = document.getElementById("legalOverlay");
const galleryOverlay = document.getElementById("galleryOverlay");
const lightboxOverlay = document.getElementById("lightboxOverlay");
const lightboxImage = document.getElementById("lightboxImage");
const lightboxCaption = document.getElementById("lightboxCaption");
const lightboxTitle = document.getElementById("lightboxTitle");
const audioPanel = document.getElementById("audioPanel");
const audio = document.getElementById("bgm");
const audioTrackTitle = document.getElementById("audioTrackTitle");
const audioToggle = document.getElementById("audioToggle");
const audioStatus = document.getElementById("audioStatus");
const volumeSlider = document.getElementById("volumeSlider");
const dialogs = [legalOverlay, galleryOverlay, lightboxOverlay].filter(Boolean);
const dialogStack = [];
const returnFocus = new WeakMap();
let activeLayer = document.getElementById("pageBackgroundPrimary");
let inactiveLayer = document.getElementById("pageBackgroundSecondary");
let backgroundRequest = 0;
let backgroundTransitionTimer = null;
let galleryRendered = false;

function getFocusableElements(container) {
  return Array.from(container.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  )).filter((element) => !element.disabled && !element.closest("[inert]") && element.getClientRects().length);
}

function updateDialogs() {
  const active = dialogStack[dialogStack.length - 1];
  shell.inert = Boolean(active);
  dialogs.forEach((dialog) => {
    const open = dialogStack.includes(dialog);
    dialog.inert = Boolean(active && dialog !== active);
    dialog.setAttribute("aria-hidden", String(!open || dialog !== active));
    dialog.setAttribute("aria-modal", String(dialog === active));
  });
  body.classList.toggle("modal-open", Boolean(active));
}

function openDialog(dialog, trigger) {
  if (!dialog || dialogStack.includes(dialog)) return;
  returnFocus.set(dialog, trigger || document.activeElement);
  dialogStack.push(dialog);
  dialog.classList.remove("hidden");
  updateDialogs();
  (getFocusableElements(dialog)[0] || dialog).focus();
}

function closeDialog(dialog) {
  if (dialog !== dialogStack[dialogStack.length - 1]) return;
  dialogStack.pop();
  dialog.classList.add("hidden");
  updateDialogs();
  if (dialog === legalOverlay) openLegalButton.setAttribute("aria-expanded", "false");
  if (dialog === galleryOverlay) jumpToGalleryButton.setAttribute("aria-expanded", "false");
  if (dialog === lightboxOverlay) {
    lightboxImage.removeAttribute("src");
    lightboxImage.alt = "";
    lightboxCaption.textContent = "";
  }
  const active = dialogStack[dialogStack.length - 1];
  const trigger = returnFocus.get(dialog);
  if (trigger?.isConnected && (!active || active.contains(trigger))) {
    trigger.focus({ preventScroll: true });
  } else if (active) {
    (getFocusableElements(active)[0] || active).focus();
  }
}

function setBackground(originalPath) {
  const request = ++backgroundRequest;
  const imagePath = window.optimizedImagePath(originalPath);
  if (!imagePath || !activeLayer || activeLayer.dataset.image === imagePath) return;
  const preload = new Image();
  preload.onload = () => {
    if (request !== backgroundRequest) return;
    window.clearTimeout(backgroundTransitionTimer);
    const previousLayer = activeLayer;
    const nextLayer = inactiveLayer;
    nextLayer.style.backgroundImage = `linear-gradient(90deg, rgba(4, 6, 10, 0.78) 0%, rgba(4, 6, 10, 0.54) 34%, rgba(4, 6, 10, 0.12) 54%, rgba(4, 6, 10, 0) 70%), url("${imagePath}")`;
    nextLayer.dataset.image = imagePath;
    nextLayer.classList.add("is-active");
    previousLayer.classList.remove("is-active");
    activeLayer = nextLayer;
    inactiveLayer = previousLayer;
    backgroundTransitionTimer = window.setTimeout(() => {
      if (previousLayer !== activeLayer) {
        previousLayer.style.backgroundImage = "";
        previousLayer.dataset.image = "";
      }
      backgroundTransitionTimer = null;
    }, 700);
  };
  // Keep the last successful background when a file fails to load.
  preload.onerror = () => {};
  preload.src = imagePath;
}

function renderGallery() {
  if (galleryRendered) return;
  galleryRendered = true;
  const items = [
    ...config.sections.filter((section) => section.background).map((section) => ({
      image: section.background,
      title: section.galleryTitle || section.title,
      caption: section.galleryCaption || section.lead || ""
    })),
    ...(config.gallery || [])
  ];
  items.forEach((item) => {
    const figure = document.createElement("figure");
    figure.className = "gallery-card";
    const trigger = document.createElement("button");
    trigger.className = "gallery-trigger";
    trigger.type = "button";
    trigger.setAttribute("aria-label", `${item.title} in Großansicht öffnen`);
    const image = document.createElement("img");
    image.className = "gallery-image";
    image.loading = "lazy";
    image.src = window.optimizedImagePath(item.image, true);
    image.alt = `${config.name}: ${item.title}`;
    const caption = document.createElement("figcaption");
    caption.className = "gallery-meta";
    const heading = document.createElement("p");
    heading.className = "gallery-title";
    heading.textContent = item.title || "Galeriebild";
    const copy = document.createElement("p");
    copy.className = "gallery-caption";
    copy.textContent = item.caption || "";
    trigger.addEventListener("click", () => {
      lightboxImage.src = item.image;
      lightboxImage.alt = image.alt;
      lightboxTitle.textContent = item.title || "Galeriebild";
      lightboxCaption.textContent = item.caption || "";
      openDialog(lightboxOverlay, trigger);
    });
    caption.append(heading, copy);
    trigger.append(image);
    figure.append(trigger, caption);
    galleryGrid.append(figure);
  });
  if (!items.length) {
    const empty = document.createElement("p");
    empty.className = "gallery-empty";
    empty.textContent = "Weitere Eindrücke folgen.";
    galleryGrid.append(empty);
  }
}

function sectionFromHash() {
  let id = "";
  try {
    id = decodeURIComponent(window.location.hash.slice(1));
  } catch (_error) {
    // Malformed external fragments fall back to the first chapter.
  }
  return config.sections.find((section) => section.id === id) || config.sections[0];
}

function setActiveSection(section, moveFocus = false) {
  if (!section) return;
  articles.forEach((article) => {
    article.hidden = article.id !== section.id;
  });
  chapterNav.querySelectorAll("a[data-section]").forEach((link) => {
    const active = link.dataset.section === section.id;
    link.classList.toggle("active", active);
    if (active) link.setAttribute("aria-current", "step");
    else link.removeAttribute("aria-current");
  });
  setBackground(section.background);
  if (moveFocus) {
    document.getElementById(`${section.id}-title`)?.focus({ preventScroll: true });
    chapterNav.scrollIntoView({ block: "start", behavior: "instant" });
  }
}

function updateAudioUi(status) {
  const playing = !audio.paused;
  audioToggle.textContent = playing ? "Musik pausieren" : audio.hasAttribute("src") ? "Musik fortsetzen" : "Musik starten";
  audioToggle.setAttribute("aria-pressed", String(playing));
  audioStatus.textContent = status || (playing ? "Musik spielt." : audio.hasAttribute("src") ? "Musik ist pausiert." : "Musik wird erst beim Start geladen.");
}

openLegalButton.classList.remove("hidden");
openLegalButton.addEventListener("click", () => {
  openLegalButton.setAttribute("aria-expanded", "true");
  openDialog(legalOverlay, openLegalButton);
});
document.getElementById("closeLegal").addEventListener("click", () => closeDialog(legalOverlay));
document.getElementById("closeGalleryOverlay").addEventListener("click", () => closeDialog(galleryOverlay));
document.getElementById("closeLightboxOverlay").addEventListener("click", () => closeDialog(lightboxOverlay));
dialogs.forEach((dialog) => {
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) closeDialog(dialog);
  });
});
document.addEventListener("keydown", (event) => {
  const active = dialogStack[dialogStack.length - 1];
  if (!active) return;
  if (event.key === "Escape") {
    event.preventDefault();
    closeDialog(active);
  } else if (event.key === "Tab") {
    const elements = getFocusableElements(active);
    const first = elements[0];
    const last = elements[elements.length - 1];
    if (!first) {
      event.preventDefault();
      active.focus();
    } else if (!active.contains(document.activeElement) || (event.shiftKey && document.activeElement === first) || (!event.shiftKey && document.activeElement === last)) {
      event.preventDefault();
      (event.shiftKey ? last : first).focus();
    }
  }
});
document.addEventListener("focusin", (event) => {
  const active = dialogStack[dialogStack.length - 1];
  if (active && !active.contains(event.target)) (getFocusableElements(active)[0] || active).focus();
});

if (config?.published) {
  body.classList.add("js-enhanced");
  setActiveSection(sectionFromHash());
  document.querySelector(".layout").addEventListener("click", (event) => {
    const link = event.target.closest('a[href^="#"]');
    if (!link || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    const section = config.sections.find((item) => `#${item.id}` === link.getAttribute("href"));
    if (!section) return;
    event.preventDefault();
    if (window.location.hash !== `#${section.id}`) window.history.pushState(null, "", `#${section.id}`);
    setActiveSection(section, true);
  });
  window.addEventListener("hashchange", () => setActiveSection(sectionFromHash(), true));
  window.addEventListener("popstate", () => setActiveSection(sectionFromHash(), true));
  jumpToGalleryButton.classList.remove("hidden");
  jumpToGalleryButton.addEventListener("click", () => {
    renderGallery();
    jumpToGalleryButton.setAttribute("aria-expanded", "true");
    openDialog(galleryOverlay, jumpToGalleryButton);
  });
  if (config.audio?.src) {
    audioPanel.classList.remove("hidden");
    audioTrackTitle.textContent = config.audio.title || config.name;
    audio.volume = Number.parseFloat(volumeSlider.value);
    audioToggle.addEventListener("click", async () => {
      if (!audio.paused) {
        audio.pause();
        return;
      }
      if (!audio.hasAttribute("src")) audio.src = config.audio.src;
      try {
        await audio.play();
      } catch (_error) {
        updateAudioUi("Wiedergabe nicht möglich. Bitte erneut versuchen.");
      }
    });
    volumeSlider.addEventListener("input", () => { audio.volume = Number.parseFloat(volumeSlider.value); });
    audio.addEventListener("play", () => updateAudioUi());
    audio.addEventListener("pause", () => updateAudioUi());
    audio.addEventListener("error", () => updateAudioUi("Audiodatei konnte nicht geladen werden."));
  }
}
