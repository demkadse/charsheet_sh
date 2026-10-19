import { readFile, readdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import vm from "node:vm";

const root = fileURLToPath(new URL("../", import.meta.url));
const definitionsPath = path.join(root, "js/data/characters");
const context = vm.createContext({ window: {} });
const files = (await readdir(definitionsPath)).filter((file) => file.endsWith(".js")).sort();
for (const file of files) {
  vm.runInContext(await readFile(path.join(definitionsPath, file), "utf8"), context, { filename: file });
}
vm.runInContext(await readFile(path.join(root, "js/catalog.js"), "utf8"), context);
const template = await readFile(path.join(root, "templates/character.html"), "utf8");
const escape = (value = "") => String(value).replace(/[&<>"']/g, (character) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
})[character]);

function chapter(section, next) {
  return `        <article class="chapter-section content active" id="${escape(section.id)}" aria-labelledby="${escape(section.id)}-title">
          <p class="content-kicker">${escape(section.label)}</p>
          <h2 id="${escape(section.id)}-title" tabindex="-1">${escape(section.title)}</h2>
          <p class="content-lead">${escape(section.lead)}</p>
          <div class="content-body">
${section.paragraphs.map((paragraph) => `            <p>${escape(paragraph)}</p>`).join("\n")}
          </div>
${next ? `          <nav class="chapter-pagination" aria-label="Weiterlesen"><a class="chapter-next" href="#${escape(next.id)}">Nächstes Kapitel: ${escape(next.nav)} <span aria-hidden="true">→</span></a></nav>` : ""}
        </article>`;
}

let count = 0;
for (const character of Object.values(context.window.CHARACTERS)) {
  const published = character.published;
  const sections = published ? character.sections : [];
  const background = published ? context.window.optimizedImagePath(sections[0]?.background) : "";
  const subtitle = published ? character.subtitle : "Diese Charakterseite ist bereits vorbereitet, aber noch nicht veröffentlicht.";
  const values = {
    slug: escape(character.slug),
    name: escape(character.name),
    description: escape(subtitle),
    eyebrow: escape(published ? character.eyebrow : "Noch nicht freigegeben"),
    titleLine: escape(published ? character.titleLine : "Kommt später"),
    subtitle: escape(subtitle),
    background: escape(background),
    backgroundStyle: background ? escape(`background-image: linear-gradient(90deg, rgba(4, 6, 10, 0.78) 0%, rgba(4, 6, 10, 0.54) 34%, rgba(4, 6, 10, 0.12) 54%, rgba(4, 6, 10, 0) 70%), url("${background}")`) : "",
    navigation: sections.map((section) => `\n        <a class="menu-item" href="#${escape(section.id)}" data-section="${escape(section.id)}"><span class="menu-item-label">${escape(section.nav)}</span></a>`).join("") + "\n      ",
    chapters: published ? sections.map((section, index) => chapter(section, sections[index + 1])).join("\n") : `        <article class="content active"><p class="content-kicker">Hinweis</p><h2>Diese Geschichte wartet noch auf ihren Auftritt.</h2><p class="content-lead">${escape(subtitle)}</p><div class="content-body"><p>Du kannst jederzeit zur Auswahl zurückkehren und eine andere Geschichte öffnen.</p></div></article>`,
    definitionScript: published ? `  <script src="../js/data/characters/${escape(character.slug)}.js"></script>` : ""
  };
  const html = template.replace(/\{\{(\w+)\}\}/g, (_match, key) => {
    if (!(key in values)) throw new Error(`Unbekannter Platzhalter: ${key}`);
    return values[key];
  });
  await writeFile(path.join(root, "characters", `${character.slug}.html`), html, "utf8");
  count += 1;
}
console.log(`${count} Charakterseiten erzeugt.`);
