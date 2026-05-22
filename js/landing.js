const grid = document.getElementById("characterGrid");
const characters = Object.values(window.CHARACTERS || {}).filter(
  (character) => character.published
);

if (grid) {
  const fallbackActive = characters[0]?.slug || "";

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

    top.append(eyebrow);

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
  });

  const panels = Array.from(grid.querySelectorAll(".selection-panel"));

  function setActivePanel(slug) {
    const nextSlug = slug || fallbackActive;
    panels.forEach((panel) => {
      panel.classList.toggle("is-active", panel.dataset.character === nextSlug);
    });
  }

  panels.forEach((panel) => {
    panel.addEventListener("mouseenter", () => setActivePanel(panel.dataset.character));
    panel.addEventListener("focusin", () => setActivePanel(panel.dataset.character));
  });

  grid.addEventListener("mouseleave", () => setActivePanel(fallbackActive));
  setActivePanel(fallbackActive);
}
