const grid = document.getElementById("characterGrid");
const fallbackList = document.getElementById("characterFallback");
const characters = Object.values(window.CHARACTERS || {}).filter(
  (character) => character.published
);

if (grid && characters.length) {
  const fallbackActive = characters[0]?.slug || "";
  const panelBySlug = new Map();
  grid.replaceChildren();
  grid.style.setProperty("--selection-expanded-grow", String(Math.max(1, characters.length - 1)));

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
    link.setAttribute("aria-label", `${character.name} öffnen`);

    const media = document.createElement("div");
    media.className = "selection-media";

    if (character.landingImage) {
      media.style.backgroundImage = `url("${window.optimizedImagePath(character.landingImage)}")`;
    } else {
      media.classList.add("is-placeholder");
    }

    const overlay = document.createElement("div");
    overlay.className = "selection-overlay";

    const copy = document.createElement("div");
    copy.className = "selection-copy";

    const details = document.createElement("div");
    details.className = "selection-details";

    const body = document.createElement("div");
    body.className = "selection-details-inner";

    const title = document.createElement("h2");
    title.className = "selection-name";
    title.textContent = character.name;

    const cta = document.createElement("span");
    cta.className = "selection-cta";
    cta.textContent = "Geschichte öffnen";

    if (character.titleLine) {
      const subtitle = document.createElement("p");
      subtitle.className = "selection-titleline";
      subtitle.textContent = character.titleLine;
      body.append(subtitle);
    }

    const noteText = character.landingNote || character.subtitle?.split(". ")[0] || "";
    if (noteText) {
      const note = document.createElement("p");
      note.className = "selection-note";
      note.textContent = /[.!?]$/.test(noteText) ? noteText : `${noteText}.`;
      body.append(note);
    }

    const chapters = document.createElement("p");
    chapters.className = "selection-chapters";
    chapters.textContent = `${character.sections?.length || 0} Kapitel`;

    body.append(chapters, cta);
    details.append(body);
    copy.append(title, details);
    link.append(media, overlay, copy);
    panel.append(link);
    grid.append(panel);
    panelBySlug.set(character.slug, panel);
  });

  const panels = Array.from(grid.querySelectorAll(".selection-panel"));

  function setActivePanel(slug) {
    const nextSlug = slug || fallbackActive;
    panels.forEach((panel) => {
      const active = panel.dataset.character === nextSlug;
      panel.classList.toggle("is-active", active);
      panel.querySelector(".selection-details")?.setAttribute("aria-hidden", String(!active));
    });

    grid.dataset.activeCharacter = nextSlug;
  }

  panels.forEach((panel) => {
    panel.addEventListener("mouseenter", () => setActivePanel(panel.dataset.character));
    panel.addEventListener("focusin", () => setActivePanel(panel.dataset.character));
    panel.addEventListener("click", () => setActivePanel(panel.dataset.character));
  });

  grid.addEventListener("keydown", (event) => {
    if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) {
      return;
    }

    const currentSlug = event.target.closest(".selection-panel")?.dataset.character
      || grid.dataset.activeCharacter || fallbackActive;

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
  document.body.classList.add("js-enhanced");
  fallbackList?.setAttribute("hidden", "hidden");
}
