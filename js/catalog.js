const definitions = Array.isArray(window.CHARACTER_DEFINITIONS)
  ? window.CHARACTER_DEFINITIONS
  : [];

window.CHARACTERS = definitions.reduce((characters, definition) => {
  if (definition?.slug) {
    characters[definition.slug] = definition;
  }

  return characters;
}, {});

window.optimizedImagePath = (imagePath, thumbnail = false) => imagePath
  ? imagePath.replace("assets/characters/", "assets/optimized/characters/")
    .replace(/\.png$/i, thumbnail ? ".thumb.webp" : ".webp")
  : "";
