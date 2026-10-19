"""Generate web assets without changing originals; --check verifies freshness."""

import argparse
import hashlib
import html
import json
from pathlib import Path
import re
import sys

from fontTools import subset
from fontTools.ttLib import TTFont
from PIL import Image, ImageOps


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "assets" / "optimized"
MANIFEST = OUTPUT / "manifest.json"
SETTINGS = {"image_max": 2560, "thumbnail_max": 640, "quality": 88, "method": 6}


def sha256(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def relative(path):
    return path.relative_to(ROOT).as_posix()


def inputs():
    return sorted((ROOT / "assets" / "characters").rglob("*.png")) + sorted(
        (ROOT / "assets" / "fonts").glob("*.ttf")
    )


def needed_codepoints():
    # Latin Extended, typography and every literal character in the website.
    points = set(range(0x250)) | set(range(0x2000, 0x2070)) | set(range(0x2190, 0x2200))
    sources = [ROOT / "index.html"]
    for folder, suffix in (("characters", "*.html"), ("js", "*.js"), ("css", "*.css")):
        sources.extend(sorted((ROOT / folder).rglob(suffix)))
    for path in sources:
        text = html.unescape(path.read_text(encoding="utf-8"))
        points.update(map(ord, text))
        for match in re.finditer(r"\\u(?:\{([0-9a-fA-F]{1,6})\}|([0-9a-fA-F]{4}))", text):
            points.add(int(match.group(1) or match.group(2), 16))
    return points


def font_points(path):
    with TTFont(path) as font:
        return set(font.getBestCmap())


def verify_entry(source, entry, points):
    if entry["source_sha256"] != sha256(source):
        raise ValueError(f"Original changed: {relative(source)}")
    for output in entry["outputs"]:
        path = ROOT / output["path"]
        if sha256(path) != output["sha256"]:
            raise ValueError(f"Derivative changed: {output['path']}")
        if source.suffix == ".png":
            with Image.open(path) as image:
                image.load()
                if image.format != "WEBP" or list(image.size) != output["size"]:
                    raise ValueError(f"Invalid image: {output['path']}")
        else:
            required = font_points(source) & points
            missing = required - font_points(path)
            if missing:
                raise ValueError(f"Missing font characters: {output['path']}: {sorted(missing)}")


def generate_image(source, target):
    outputs = []
    with Image.open(source) as original:
        original.load()
        image = ImageOps.exif_transpose(original).convert("RGBA" if "A" in original.getbands() else "RGB")
        for path, limit in ((target, SETTINGS["image_max"]), (target.with_suffix(".thumb.webp"), SETTINGS["thumbnail_max"])):
            result = image.copy()
            result.thumbnail((limit, limit), Image.Resampling.LANCZOS)
            result.save(path, "WEBP", quality=SETTINGS["quality"], method=SETTINGS["method"])
            outputs.append({"path": relative(path), "sha256": sha256(path), "bytes": path.stat().st_size, "size": list(result.size)})
    return outputs


def generate_font(source, target, points):
    options = subset.Options()
    options.flavor = "woff2"
    options.recalc_timestamp = False
    with TTFont(source, recalcTimestamp=False) as font:
        subsetter = subset.Subsetter(options=options)
        subsetter.populate(unicodes=points)
        subsetter.subset(font)
        font.flavor = "woff2"
        font.save(target)
    return [{"path": relative(target), "sha256": sha256(target), "bytes": target.stat().st_size}]


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check", action="store_true", help="Verify only; fail on stale or invalid derivatives")
    args = parser.parse_args()
    previous = json.loads(MANIFEST.read_text(encoding="utf-8")) if MANIFEST.exists() else {}
    current = inputs()
    if not current:
        raise ValueError("No source assets found")
    hashes = {relative(path): sha256(path) for path in current}
    points = needed_codepoints()
    old_entries = {entry["source"]: entry for entry in previous.get("assets", [])}
    if args.check:
        if previous.get("settings") != SETTINGS or set(old_entries) != set(hashes):
            raise ValueError("Manifest settings or source file list is stale; run generation")
        for source in current:
            verify_entry(source, old_entries[relative(source)], points)
        print(f"OK: {len(current)} originals, derivatives, dimensions and font glyphs verified")
        return

    entries = []
    for source in current:
        key = relative(source)
        old = old_entries.get(key)
        if old and previous.get("settings") == SETTINGS:
            try:
                verify_entry(source, old, points)
                entries.append(old)
                continue
            except (OSError, ValueError):
                pass
        suffix = ".webp" if source.suffix == ".png" else ".woff2"
        target = OUTPUT / source.relative_to(ROOT / "assets").with_suffix(suffix)
        target.parent.mkdir(parents=True, exist_ok=True)
        outputs = generate_image(source, target) if source.suffix == ".png" else generate_font(source, target, points)
        entry = {"source": key, "source_sha256": hashes[key], "source_bytes": source.stat().st_size, "outputs": outputs}
        verify_entry(source, entry, points)
        entries.append(entry)
        print(f"Generated {relative(target)}", flush=True)

    if hashes != {relative(path): sha256(path) for path in inputs()}:
        raise ValueError("Original assets changed during generation; rerun against current originals")
    MANIFEST.parent.mkdir(parents=True, exist_ok=True)
    MANIFEST.write_text(json.dumps({"version": 1, "settings": SETTINGS, "assets": entries}, indent=2) + "\n", encoding="utf-8")
    before = sum(entry["source_bytes"] for entry in entries)
    after = sum(output["bytes"] for entry in entries for output in entry["outputs"])
    print(f"{len(entries)} originals: {before:,} bytes -> {after:,} bytes including thumbnails ({100 * (1 - after / before):.1f}% smaller)")


if __name__ == "__main__":
    try:
        main()
    except (OSError, ValueError) as error:
        print(f"ERROR: {error}", file=sys.stderr)
        sys.exit(1)
