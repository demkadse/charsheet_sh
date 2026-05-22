const slug = document.body.dataset.characterPage || "";
const config = window.CHARACTERS?.[slug];
const body = document.body;
const shell = document.querySelector(".character-shell");
const title = document.getElementById("characterTitle");
const eyebrow = document.getElementById("characterEyebrow");
const titleLine = document.getElementById("characterTitleLine");
const subtitle = document.getElementById("characterSubtitle");
const chapterNav = document.getElementById("chapterNav");
const contentArticle = document.getElementById("contentArticle");
const sectionLabel = document.getElementById("sectionLabel");
const sectionTitle = document.getElementById("sectionTitle");
const sectionLead = document.getElementById("sectionLead");
const sectionBody = document.getElementById("sectionBody");
const galleryGrid = document.getElementById("galleryGrid");
const openLegalButton = document.getElementById("openLegal");
const closeLegalButton = document.getElementById("closeLegal");
const jumpToGalleryButton = document.getElementById("jumpToGallery");
const closeGalleryOverlayButton = document.getElementById("closeGalleryOverlay");
const closeLightboxOverlayButton = document.getElementById("closeLightboxOverlay");
const legalOverlay = document.getElementById("legalOverlay");
const galleryOverlay = document.getElementById("galleryOverlay");
const lightboxOverlay = document.getElementById("lightboxOverlay");
const lightboxImage = document.getElementById("lightboxImage");
const lightboxCaption = document.getElementById("lightboxCaption");
const lightboxTitle = document.getElementById("lightboxTitle");
const audioConsent = document.getElementById("audioConsent");
const acceptAudioButton = document.getElementById("acceptAudio");
const declineAudioButton = document.getElementById("declineAudio");
const audioPanel = document.getElementById("audioPanel");
const audio = document.getElementById("bgm");
const audioToggle = document.getElementById("audioToggle");
const audioStatus = document.getElementById("audioStatus");
const volumeSlider = document.getElementById("volumeSlider");
const primary = document.getElementById("pageBackgroundPrimary");
const secondary = document.getElementById("pageBackgroundSecondary");

let activeDialog = null;
let activeLayer = primary;
let inactiveLayer = secondary;
let shellTransitionTimer = null;
let backgroundTransitionTimer = null;
let sectionTransitionTimer = null;

function hasOpenDialog() {
  return [legalOverlay, galleryOverlay, lightboxOverlay, audioConsent].some(
    (overlay) => overlay && !overlay.classList.contains("hidden")
  );
}

function getOpenDialog() {
  return [audioConsent, lightboxOverlay, galleryOverlay, legalOverlay].find(
    (overlay) => overlay && !overlay.classList.contains("hidden")
  ) || null;
}

function getFocusableElements(container) {
  return Array.from(
    container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
  ).filter((element) => !element.hasAttribute("disabled"));
}

function openDialog(dialog, trigger) {
  if (!dialog) {
    return;
  }

  activeDialog = dialog;
  dialog.dataset.returnFocus = trigger?.id || "";
  dialog.classList.remove("hidden");
  dialog.setAttribute("aria-hidden", "false");
  body.classList.add("modal-open");
  getFocusableElements(dialog)[0]?.focus();
}

function closeDialog(dialog) {
  if (!dialog || dialog.classList.contains("hidden")) {
    return;
  }

  dialog.classList.add("hidden");
  dialog.setAttribute("aria-hidden", "true");
  activeDialog = getOpenDialog();

  if (dialog === legalOverlay) {
    openLegalButton?.setAttribute("aria-expanded", "false");
  }

  if (dialog === galleryOverlay) {
    jumpToGalleryButton?.setAttribute("aria-expanded", "false");
  }

  if (dialog === lightboxOverlay) {
    lightboxImage.src = "";
    lightboxImage.alt = "";
    lightboxCaption.textContent = "";
  }

  if (dialog === audioConsent) {
    audioToggle?.focus();
  }

  body.classList.toggle("modal-open", hasOpenDialog());

  const returnFocusId = dialog.dataset.returnFocus;
  if (returnFocusId && dialog !== audioConsent) {
    document.getElementById(returnFocusId)?.focus();
  }
}

function trapFocus(event) {
  if (!activeDialog || event.key !== "Tab") {
    return;
  }

  const focusableElements = getFocusableElements(activeDialog);
  if (!focusableElements.length) {
    event.preventDefault();
    return;
  }

  const first = focusableElements[0];
  const last = focusableElements[focusableElements.length - 1];

  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}

function startShellTransition(duration = 680) {
  if (!shell) {
    return;
  }

  if (shellTransitionTimer) {
    clearTimeout(shellTransitionTimer);
  }

  shell.classList.add("is-transitioning");
  shellTransitionTimer = window.setTimeout(() => {
    shell.classList.remove("is-transitioning");
    shellTransitionTimer = null;
  }, duration);
}

function setMenuItemContent(item, section) {
  item.replaceChildren();

  const label = document.createElement("span");
  label.className = "menu-item-label";
  label.textContent = section.nav;
  item.append(label);
}

function setBackground(imagePath) {
  if (!imagePath) {
    if (backgroundTransitionTimer) {
      clearTimeout(backgroundTransitionTimer);
      backgroundTransitionTimer = null;
    }

    activeLayer.classList.remove("is-active");
    activeLayer.style.backgroundImage = "";
    inactiveLayer.classList.remove("is-active");
    inactiveLayer.style.backgroundImage = "";
    return;
  }

  if (activeLayer.style.backgroundImage.includes(imagePath)) {
    return;
  }

  const preload = new Image();
  const previousActive = activeLayer;
  const nextLayer = inactiveLayer;

  preload.onload = () => {
    if (backgroundTransitionTimer) {
      clearTimeout(backgroundTransitionTimer);
      backgroundTransitionTimer = null;
    }

    nextLayer.style.backgroundImage = `linear-gradient(180deg, rgba(4, 6, 10, 0.32), rgba(4, 6, 10, 0.48)), url("${imagePath}")`;
    nextLayer.classList.add("is-active");
    previousActive.classList.remove("is-active");

    activeLayer = nextLayer;
    inactiveLayer = previousActive;

    backgroundTransitionTimer = window.setTimeout(() => {
      inactiveLayer.style.backgroundImage = "";
      backgroundTransitionTimer = null;
    }, 700);
  };

  preload.onerror = () => {
    nextLayer.style.backgroundImage = "";
  };

  preload.src = imagePath;
}

function renderGallery(sections) {
  galleryGrid.replaceChildren();

  const withImages = sections.filter((section) => section.background);
  if (!withImages.length) {
    const empty = document.createElement("p");
    empty.className = "gallery-empty";
    empty.textContent = "Weitere Eindrücke folgen.";
    galleryGrid.append(empty);
    return;
  }

  withImages.forEach((section) => {
    const figure = document.createElement("figure");
    figure.className = "gallery-card";

    const trigger = document.createElement("button");
    trigger.className = "gallery-trigger";
    trigger.type = "button";
    trigger.setAttribute("aria-label", `${section.galleryTitle || section.title} in Großansicht öffnen`);

    const image = document.createElement("img");
    image.className = "gallery-image";
    image.loading = "lazy";
    image.src = section.background;
    image.alt = `${config.name}: ${section.galleryTitle || section.title}`;

    const caption = document.createElement("figcaption");
    caption.className = "gallery-meta";

    const heading = document.createElement("p");
    heading.className = "gallery-title";
    heading.textContent = section.galleryTitle || section.title;

    const copy = document.createElement("p");
    copy.className = "gallery-caption";
    copy.textContent = section.galleryCaption || section.lead || "";

    trigger.addEventListener("click", () => {
      lightboxImage.src = section.background;
      lightboxImage.alt = image.alt;
      if (lightboxTitle) {
        lightboxTitle.textContent = section.galleryTitle || section.title || "Galeriebild";
      }
      lightboxCaption.textContent = copy.textContent;
      openDialog(lightboxOverlay, jumpToGalleryButton);
    });

    caption.append(heading, copy);
    trigger.append(image);
    figure.append(trigger, caption);
    galleryGrid.append(figure);
  });
}

function renderSection(section) {
  sectionLabel.textContent = section.label || "";
  sectionTitle.textContent = section.title || "";
  sectionLead.textContent = section.lead || "";
  sectionBody.replaceChildren(
    ...section.paragraphs.map((paragraph) => {
      const p = document.createElement("p");
      p.textContent = paragraph;
      return p;
    })
  );

  sectionLabel.hidden = !section.label;
  sectionTitle.hidden = !section.title;
  sectionLead.hidden = !section.lead;
}

function setActiveSection(sectionId) {
  const nextSection =
    config.sections.find((section) => section.id === sectionId) || config.sections[0];

  if (!nextSection) {
    return;
  }

  Array.from(chapterNav.querySelectorAll("button")).forEach((button) => {
    const active = button.dataset.section === nextSection.id;
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", String(active));
  });

  startShellTransition();

  if (sectionTransitionTimer) {
    clearTimeout(sectionTransitionTimer);
    sectionTransitionTimer = null;
  }

  contentArticle.classList.remove("active");

  window.requestAnimationFrame(() => {
    renderSection(nextSection);
    contentArticle.classList.add("active");
  });

  sectionTransitionTimer = window.setTimeout(() => {
    sectionTransitionTimer = null;
  }, 430);

  setBackground(nextSection.background);
  if (nextSection.id) {
    window.history.replaceState(null, "", `#${nextSection.id}`);
  }
}

function buildNavigation(sections) {
  sections.forEach((section, index) => {
    const button = document.createElement("button");
    button.className = "menu-item";
    button.type = "button";
    button.dataset.section = section.id;
    button.setAttribute("aria-pressed", String(index === 0));
    setMenuItemContent(button, section);
    button.addEventListener("click", () => setActiveSection(section.id));
    chapterNav.append(button);
  });
}

function updateAudioUi(statusOverride) {
  const playing = !audio.paused;
  audioToggle.textContent = playing ? "\u23F8 Pause" : "\u25B6 Play";
  audioToggle.setAttribute("aria-pressed", String(playing));
  if (!audio.currentSrc) {
    audioStatus.textContent = "Kein Audiotitel verfügbar.";
    return;
  }

  audioStatus.textContent = statusOverride || (playing ? "Musik spielt." : "Musik ist pausiert.");
}

async function playAudio() {
  try {
    await audio.play();
    return true;
  } catch (_error) {
    updateAudioUi("Wiedergabe wurde vom Browser blockiert.");
    return false;
  }
}

if (config?.published) {
  body.dataset.character = config.slug;
  title.textContent = config.name;
  eyebrow.textContent = config.eyebrow;
  titleLine.textContent = config.titleLine;
  subtitle.textContent = config.subtitle;
  document.title = `${config.name} | Charsheet`;

  buildNavigation(config.sections);
  renderGallery(config.sections);
  const initialSectionId = window.location.hash.replace(/^#/, "");
  setActiveSection(initialSectionId || config.sections[0]?.id);

  if (config.audio && audioPanel && audio && audioToggle && audioStatus && volumeSlider) {
    audioPanel.classList.remove("hidden");
    audio.src = config.audio;
    audio.volume = Number.parseFloat(volumeSlider.value) || 0.75;
    updateAudioUi();

    audioToggle.addEventListener("click", async () => {
      if (audio.paused) {
        const started = await playAudio();
        if (!started) {
          return;
        }
      } else {
        audio.pause();
      }

      updateAudioUi();
    });

    volumeSlider.addEventListener("input", () => {
      audio.volume = Number.parseFloat(volumeSlider.value) || 0;
    });

    audio.addEventListener("play", () => {
      updateAudioUi();
    });
    audio.addEventListener("pause", () => {
      updateAudioUi();
    });
    audio.addEventListener("loadedmetadata", () => {
      audioPanel.classList.remove("is-error");
      audioToggle.disabled = false;
      volumeSlider.disabled = false;
      updateAudioUi("Musik bereit.");
    });
    audio.addEventListener("error", () => {
      audioToggle.disabled = true;
      volumeSlider.disabled = true;
      audioPanel.classList.add("is-error");
      updateAudioUi("Audiodatei konnte nicht geladen werden.");
    });

    acceptAudioButton?.addEventListener("click", async () => {
      closeDialog(audioConsent);
      await playAudio();
    });

    declineAudioButton?.addEventListener("click", () => {
      closeDialog(audioConsent);
      audio.pause();
      updateAudioUi();
    });

    openDialog(audioConsent, audioToggle);
  } else {
    audioPanel.classList.add("hidden");
  }

  openLegalButton?.addEventListener("click", () => {
    openLegalButton.setAttribute("aria-expanded", "true");
    openDialog(legalOverlay, openLegalButton);
  });

  closeLegalButton?.addEventListener("click", () => {
    closeDialog(legalOverlay);
  });

  jumpToGalleryButton?.addEventListener("click", () => {
    jumpToGalleryButton.setAttribute("aria-expanded", "true");
    openDialog(galleryOverlay, jumpToGalleryButton);
  });

  closeGalleryOverlayButton?.addEventListener("click", () => {
    closeDialog(galleryOverlay);
  });

  closeLightboxOverlayButton?.addEventListener("click", () => {
    closeDialog(lightboxOverlay);
  });

  [legalOverlay, galleryOverlay, lightboxOverlay, audioConsent].forEach((overlay) => {
    overlay?.addEventListener("click", (event) => {
      if (event.target === overlay) {
        closeDialog(overlay);
      }
    });
  });

  document.addEventListener("keydown", (event) => {
    trapFocus(event);

    if (event.key === "Escape" && activeDialog) {
      closeDialog(activeDialog);
    }
  });
} else {
  document.title = "Charakter nicht gefunden";
  body.innerHTML = "";
}
