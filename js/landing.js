const grid = document.getElementById("characterGrid");
const backgroundLayer = document.getElementById("landingBackground");
const characters = Object.values(window.CHARACTERS || {}).filter(
  (character) => character.published
);

if (grid) {
  const fallbackActive = characters[0]?.slug || "";
  const panelBySlug = new Map();

  function moveFocusToPanel(nextSlug) {
    const panel = panelBySlug.get(nextSlug);
    panel?.querySelector(".selection-link")?.focus();
  }

  function getNextSlug(currentSlug, direction) {
    const currentIndex = characters.findIndex((character) => character.slug === currentSlug);
    if (currentIndex === -1) {
      return fallbackActive;
    }

    const nextIndex = (currentIndex + direction + characters.length) % characters.length;
    return characters[nextIndex]?.slug || fallbackActive;
  }

  characters.forEach((character) => {
    const panel = document.createElement("article");
    panel.className = "selection-panel";
    panel.dataset.character = character.slug;
    panel.style.setProperty("--panel-accent", character.accent || "#8dd7ff");

    const link = document.createElement("a");
    link.className = "selection-link";
    link.href = `characters/${character.slug}.html`;
    link.setAttribute("aria-label", `${character.name} oeffnen`);

    const media = document.createElement("div");
    media.className = "selection-media";

    if (character.landingImage) {
      media.style.backgroundImage = `linear-gradient(180deg, rgba(7, 10, 15, 0.08), rgba(7, 10, 15, 0.72)), url("${character.landingImage}")`;
    } else {
      media.classList.add("is-placeholder");
    }

    const overlay = document.createElement("div");
    overlay.className = "selection-overlay";

    const copy = document.createElement("div");
    copy.className = "selection-copy";

    const top = document.createElement("div");
    top.className = "selection-top";

    const eyebrow = document.createElement("p");
    eyebrow.className = "eyebrow";
    eyebrow.textContent = character.name;

    const compactTitle = document.createElement("p");
    compactTitle.className = "selection-compact-title";
    compactTitle.textContent = `${character.sections?.length || 0} Kapitel`;

    top.append(eyebrow, compactTitle);

    const body = document.createElement("div");
    body.className = "selection-body";

    const title = document.createElement("h2");
    title.className = "selection-name";
    title.textContent = character.name;

    const cta = document.createElement("span");
    cta.className = "selection-cta";
    cta.textContent = "Charakter oeffnen";

    body.append(title);

    if (character.titleLine) {
      const subtitle = document.createElement("p");
      subtitle.className = "selection-titleline";
      subtitle.textContent = character.titleLine;
      body.append(subtitle);
    }

    const noteText = character.landingNote || character.subtitle || "";
    if (noteText) {
      const note = document.createElement("p");
      note.className = "selection-note";
      note.textContent = noteText;
      body.append(note);
    }

    body.append(cta);
    copy.append(top, body);
    link.append(media, overlay, copy);
    panel.append(link);
    grid.append(panel);
    panelBySlug.set(character.slug, panel);
  });

  const panels = Array.from(grid.querySelectorAll(".selection-panel"));

  function setActivePanel(slug) {
    const nextSlug = slug || fallbackActive;
    const nextCharacter = characters.find((character) => character.slug === nextSlug);

    panels.forEach((panel) => {
      panel.classList.toggle("is-active", panel.dataset.character === nextSlug);
    });

    grid.dataset.activeCharacter = nextSlug;

    if (backgroundLayer) {
      backgroundLayer.style.backgroundImage = nextCharacter?.landingImage
        ? `linear-gradient(180deg, rgba(3, 5, 8, 0.2), rgba(3, 5, 8, 0.82)), url("${nextCharacter.landingImage}")`
        : "";
    }

    document.body.style.setProperty("--accent", nextCharacter?.accent || "#8dd7ff");
  }

  panels.forEach((panel) => {
    panel.addEventListener("mouseenter", () => setActivePanel(panel.dataset.character));
    panel.addEventListener("focusin", () => setActivePanel(panel.dataset.character));
    panel.addEventListener("click", () => setActivePanel(panel.dataset.character));
  });

  grid.addEventListener("mouseleave", () => setActivePanel(fallbackActive));
  grid.addEventListener("keydown", (event) => {
    const currentSlug = grid.dataset.activeCharacter || fallbackActive;

    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      event.preventDefault();
      moveFocusToPanel(getNextSlug(currentSlug, 1));
      return;
    }

    if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      event.preventDefault();
      moveFocusToPanel(getNextSlug(currentSlug, -1));
      return;
    }

    if (event.key === "Home") {
      event.preventDefault();
      moveFocusToPanel(characters[0]?.slug || fallbackActive);
      return;
    }

    if (event.key === "End") {
      event.preventDefault();
      moveFocusToPanel(characters[characters.length - 1]?.slug || fallbackActive);
    }
  });

  setActivePanel(fallbackActive);
}
