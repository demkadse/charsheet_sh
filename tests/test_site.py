"""Desktop regressions. Run: python -B -m unittest discover -s tests -v.

Requires Python 3.12+, Node 18+, Playwright and installed Microsoft Edge.
The local HTTP server uses an ephemeral loopback port and writes no files.
"""

from functools import partial
from html.parser import HTMLParser
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
import json
from pathlib import Path
import re
import subprocess
import threading
import unittest
from urllib.parse import unquote, urlsplit

from playwright.sync_api import sync_playwright


ROOT = Path(__file__).resolve().parents[1]


class QuietHandler(SimpleHTTPRequestHandler):
    def log_message(self, *_args):
        pass

    def copyfile(self, source, outputfile):
        try:
            super().copyfile(source, outputfile)
        except (ConnectionResetError, ConnectionAbortedError, BrokenPipeError):
            # Closing a lightbox or context intentionally cancels media transfers.
            pass


def css_urls(css):
    # HTMLParser has already decoded entities such as &quot; in style attributes.
    return [next(value for value in match if value).strip() for match in re.findall(
        r'''url\(\s*(?:"([^"]+)"|'([^']+)'|([^\s'"\)][^\)]*?))\s*\)''', css,
        flags=re.IGNORECASE
    )]


class LocalLinks(HTMLParser):
    def __init__(self):
        super().__init__()
        self.links = []

    def handle_starttag(self, _tag, attrs):
        for name, value in attrs:
            if name in ("href", "src", "data-image") and value:
                self.links.append(value)
            elif name == "style" and value:
                self.links.extend(css_urls(value))


class LocalLinksTests(unittest.TestCase):
    def test_extracts_backgrounds_and_original_links_including_html_entities(self):
        parser = LocalLinks()
        parser.feed('''<div data-image="../missing-background.webp"
          style="background-image: linear-gradient(90deg, #000, transparent),
            url(&quot;../missing background.webp&quot;), url('../second.webp')"></div>
          <a href="../index.html"><img src="../preview.webp"></a>''')
        self.assertCountEqual(parser.links, [
            "../missing-background.webp", "../missing background.webp", "../second.webp",
            "../index.html", "../preview.webp"
        ])

    def test_extracts_unquoted_and_quoted_stylesheet_urls(self):
        self.assertEqual(css_urls('''background: URL( ../image.webp );
          src: url("../font with spaces.woff2"); color: rgba(0, 0, 0, .5);'''),
          ["../image.webp", "../font with spaces.woff2"])


class SiteTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        config_script = """
          const fs = require('node:fs'); const vm = require('node:vm');
          const context = vm.createContext({window:{}});
          for (const file of fs.readdirSync('js/data/characters').sort()) {
            if (file.endsWith('.js')) vm.runInContext(fs.readFileSync('js/data/characters/'+file,'utf8'),context);
          }
          vm.runInContext(fs.readFileSync('js/catalog.js','utf8'),context);
          console.log(JSON.stringify(context.window.CHARACTERS));
        """
        cls.characters = json.loads(subprocess.check_output(
            ["node", "-e", config_script], cwd=ROOT, text=True, encoding="utf-8"
        ))
        scripts = re.findall(r'<script src="js/data/characters/([^"/]+)\.js"',
                             (ROOT / "index.html").read_text(encoding="utf-8"))
        cls.selection_slugs = [slug for slug in scripts if cls.characters[slug]["published"]]
        assert cls.selection_slugs == ["aeva", "demetria", "tezanji"]
        cls.server = ThreadingHTTPServer(
            ("127.0.0.1", 0), partial(QuietHandler, directory=str(ROOT))
        )
        cls.thread = threading.Thread(target=cls.server.serve_forever, daemon=True)
        cls.thread.start()
        cls.base = f"http://127.0.0.1:{cls.server.server_port}"
        cls.playwright = sync_playwright().start()
        cls.browser = cls.playwright.chromium.launch(channel="msedge", headless=True)

    @classmethod
    def tearDownClass(cls):
        cls.browser.close()
        cls.playwright.stop()
        cls.server.shutdown()
        cls.server.server_close()
        cls.thread.join()

    def setUp(self):
        self.context = self.browser.new_context(
            viewport={"width": 1440, "height": 900}, reduced_motion="reduce"
        )
        self.page = self.context.new_page()
        self.errors = []
        self.page.on("pageerror", lambda error: self.errors.append(str(error)))

    def tearDown(self):
        self.context.close()
        self.assertEqual(self.errors, [], "Unexpected browser JavaScript errors")

    def open_character(self, slug="aeva", fragment=""):
        self.page.goto(f"{self.base}/characters/{slug}.html{fragment}")
        self.page.evaluate("document.fonts.ready")

    def open_selection(self):
        self.page.mouse.move(-10, -10)
        self.page.goto(f"{self.base}/index.html")
        self.page.evaluate("document.fonts.ready")

    def assert_active_selection(self, slug, focused=False):
        # Even reduced-motion transitions finish asynchronously; measure their end state.
        self.page.evaluate("""async () => {
          for (let quietFrames = 0; quietFrames < 2;) {
            await new Promise(requestAnimationFrame);
            const animations = document.getAnimations();
            quietFrames = animations.length ? 0 : quietFrames + 1;
            await Promise.all(animations.map(animation => animation.finished.catch(() => {})));
          }
        }""")
        self.assertEqual(self.page.locator(".selection-panel.is-active").count(), 1)
        active = self.page.locator(".selection-panel.is-active")
        self.assertEqual(active.get_attribute("data-character"), slug)
        self.assertEqual(active.locator(".selection-details").get_attribute("aria-hidden"), "false")
        self.assertEqual(self.page.locator('.selection-details[aria-hidden="false"]').count(), 1)
        if focused:
            self.assertTrue(active.locator("a").evaluate("el => el === document.activeElement"))

    def assert_chapter(self, chapter):
        self.page.wait_for_function(
            "id => document.querySelectorAll('.chapter-section:not([hidden])').length === 1 "
            "&& !document.getElementById(id).hidden", arg=chapter
        )
        self.assertEqual(self.page.locator('#chapterNav [aria-current="step"]').get_attribute("href"), f"#{chapter}")

    def test_generated_pages_match_template_and_are_deterministic(self):
        result = subprocess.run(
            ["node", "--experimental-vm-modules", "tests/check-generated.mjs"],
            cwd=ROOT, text=True, capture_output=True, encoding="utf-8"
        )
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)

    def test_every_local_page_font_and_character_asset_exists(self):
        def check(link, parent):
            parsed = urlsplit(link)
            if parsed.scheme or parsed.netloc or not parsed.path:
                return
            target = (parent / unquote(parsed.path)).resolve()
            self.assertTrue(target.is_relative_to(ROOT), f"Link escapes project: {link}")
            self.assertTrue(target.is_file(), f"Missing local asset: {target}")

        for html in [ROOT / "index.html", *sorted((ROOT / "characters").glob("*.html"))]:
            parser = LocalLinks()
            parser.feed(html.read_text(encoding="utf-8"))
            for link in parser.links:
                check(link, html.parent)
        for link in css_urls((ROOT / "css/styles.css").read_text(encoding="utf-8")):
            check(link, ROOT / "css")
        for character in self.characters.values():
            if not character["published"]:
                continue
            images = [(character["landingImage"], ROOT)]
            images += [(section["background"], ROOT / "characters") for section in character["sections"]]
            images += [(item["image"], ROOT / "characters") for item in character.get("gallery", [])]
            for image, parent in images:
                for variant in (image, image.replace("assets/characters/", "assets/optimized/characters/").replace(".png", ".webp"), image.replace("assets/characters/", "assets/optimized/characters/").replace(".png", ".thumb.webp")):
                    check(variant, parent)
            if character.get("audio"):
                check(character["audio"]["src"], ROOT / "characters")

    def test_demetria_selection_prolog_and_gallery_load_their_distinct_images(self):
        image_directory = "/assets/optimized/characters/demetria/gallery/"
        selection_path = image_directory + "demetria_sel.webp"
        prolog_path = image_directory + "demetria_prolog.webp"
        thumbnail_path = image_directory + "demetria_prolog.thumb.webp"
        original_path = "/assets/characters/demetria/gallery/demetria_prolog.png"
        responses = {}
        self.page.on("response", lambda response: responses.update({urlsplit(response.url).path: response.status}))

        def assert_background_loaded(page, selector, path):
            self.assertIn(self.base + path, page.locator(selector).evaluate(
                "element => getComputedStyle(element).backgroundImage"
            ))
            # Backgrounds have no naturalWidth; decode the displayed resource as an image.
            self.assertTrue(page.evaluate("""async path => {
              const image = new Image(); image.src = path;
              await image.decode(); return image.naturalWidth > 0 && image.naturalHeight > 0;
            }""", path))

        self.open_selection()
        self.page.locator('[data-character="demetria"] a').focus()
        self.assert_active_selection("demetria", focused=True)
        assert_background_loaded(self.page, '[data-character="demetria"] .selection-media', selection_path)
        self.assertEqual(responses.get(selection_path), 200)
        self.assertNotIn(prolog_path, responses, "Selection should not request the chapter artwork")

        self.open_character("demetria", "#prolog")
        self.assert_chapter("prolog")
        assert_background_loaded(self.page, ".page-background-layer.is-active", prolog_path)
        self.assertEqual(responses.get(prolog_path), 200)
        self.assertTrue(self.page.locator(".page-background-layer.is-active").get_attribute("data-image").endswith(prolog_path))
        self.page.locator("#jumpToGallery").click()
        preview = self.page.locator("#galleryGrid img").first
        self.page.wait_for_function("""() => {
          const image = document.querySelector('#galleryGrid img');
          return image.complete && image.naturalWidth > 0;
        }""")
        self.assertEqual(urlsplit(preview.get_attribute("src")).path, ".." + thumbnail_path)
        self.assertEqual(responses.get(thumbnail_path), 200)
        self.page.locator(".gallery-trigger").first.click()
        self.page.wait_for_function("""() => {
          const image = document.getElementById('lightboxImage');
          return image.complete && image.naturalWidth > 0;
        }""")
        self.assertEqual(self.page.locator("#lightboxImage").evaluate("image => new URL(image.currentSrc).pathname"), original_path)
        self.assertEqual(responses.get(original_path), 200)

        context = self.browser.new_context(java_script_enabled=False)
        try:
            page = context.new_page()
            with page.expect_response(self.base + prolog_path) as prolog_response:
                page.goto(f"{self.base}/characters/demetria.html#prolog")
            self.assertEqual(prolog_response.value.status, 200)
            self.assertTrue(page.locator("#prolog").is_visible())
            assert_background_loaded(page, ".page-background-layer.is-active", prolog_path)
        finally:
            context.close()

    def test_all_published_chapters_are_complete_and_readable_without_javascript(self):
        context = self.browser.new_context(java_script_enabled=False, viewport={"width": 1440, "height": 900})
        try:
            page = context.new_page()
            page.goto(f"{self.base}/index.html")
            self.assertEqual(page.locator(".fallback-card:visible").evaluate_all("links => links.map(link => link.getAttribute('href'))"),
                             [f"characters/{slug}.html" for slug in self.selection_slugs])
            fallback = page.locator(".fallback-list").bounding_box()
            self.assertLess(fallback["y"], 100,
                            "Without JS, character links must start near the top of the page")
            for link in page.locator(".fallback-card").all():
                self.assertTrue(link.is_visible())
                self.assertLess(link.bounding_box()["y"], 900)
            page.locator('.fallback-card[href="characters/aeva.html"]').click()
            self.assertTrue(page.url.endswith("/characters/aeva.html"))
            for slug, character in self.characters.items():
                if not character["published"]:
                    continue
                with self.subTest(character=slug):
                    page.goto(f"{self.base}/characters/{slug}.html")
                    self.assertEqual(page.locator(".chapter-section:visible").count(), len(character["sections"]))
                    for section in character["sections"]:
                        article = page.locator(f'#{section["id"]}')
                        self.assertEqual(article.locator("h2").inner_text(), section["title"])
                        self.assertEqual(article.locator(".content-lead").inner_text(), section["lead"])
                        self.assertEqual(article.locator(".content-body p").all_inner_texts(), section["paragraphs"])
                        self.assertEqual(page.locator(f'#chapterNav a[href="#{section["id"]}"]').count(), 1)
                    self.assertEqual(page.locator(".chapter-next").count(), len(character["sections"]) - 1)
                    self.assertTrue(page.locator("footer noscript").is_visible())
                    self.assertFalse(page.locator("#audioPanel").is_visible())
        finally:
            context.close()

    def test_unpublished_character_has_no_chapters_but_usable_legal_dialog(self):
        self.open_character("brixxli")
        self.assertEqual(self.page.locator(".chapter-section, #chapterNav a").count(), 0)
        self.assertIn("noch nicht veröffentlicht", self.page.locator("#characterSubtitle").inner_text())
        self.assertFalse(self.page.locator("#audioPanel").is_visible())
        self.assertFalse(self.page.locator("#jumpToGallery").is_visible())
        self.page.locator("#openLegal").click()
        self.assertTrue(self.page.locator("#legalOverlay").is_visible())
        self.assertTrue(self.page.locator(".character-shell").evaluate("el => el.inert"))
        self.page.keyboard.press("Escape")
        self.assertFalse(self.page.locator("#legalOverlay").is_visible())
        self.assertTrue(self.page.locator("#openLegal").evaluate("el => el === document.activeElement"))

    def test_direct_link_next_browser_history_and_external_hash_changes(self):
        self.open_character(fragment="#second")
        self.assert_chapter("second")
        self.page.locator("#second .chapter-next").click()
        self.assertTrue(self.page.url.endswith("#third"))
        self.assert_chapter("third")
        self.page.go_back()
        self.assert_chapter("second")
        self.page.go_forward()
        self.assert_chapter("third")
        self.page.evaluate("location.hash = '#prolog'")
        self.assert_chapter("prolog")
        for fragment in ("#unknown", "#%E0%A4%A"):
            self.page.evaluate("hash => location.hash = hash", fragment)
            self.assert_chapter("prolog")

    def test_gallery_restores_exact_focus_and_keeps_keyboard_in_active_dialog(self):
        self.open_character()
        self.assertEqual(self.page.locator("#galleryGrid img").count(), 0)
        self.page.locator("#jumpToGallery").click()
        triggers = self.page.locator(".gallery-trigger")
        self.assertGreaterEqual(triggers.count(), 3)
        selected = triggers.nth(1)
        selected.click()
        self.assertTrue(self.page.locator("#galleryOverlay").evaluate("el => el.inert"))
        self.assertTrue(self.page.locator("#lightboxImage").get_attribute("src").endswith(".png"))
        self.page.keyboard.press("Tab")
        self.assertTrue(self.page.locator("#closeLightboxOverlay").evaluate("el => el === document.activeElement"))
        self.page.keyboard.press("Escape")
        self.assertFalse(self.page.locator("#lightboxOverlay").is_visible())
        self.assertTrue(self.page.locator("#galleryOverlay").is_visible())
        self.assertTrue(selected.evaluate("el => el === document.activeElement"))
        self.assertIsNone(self.page.locator("#lightboxImage").get_attribute("src"))
        for _ in range(triggers.count() + 3):
            self.page.keyboard.press("Tab")
            self.assertTrue(self.page.evaluate("document.getElementById('galleryOverlay').contains(document.activeElement)"))
        self.page.locator("#closeGalleryOverlay").focus()
        self.page.keyboard.press("Shift+Tab")
        self.assertTrue(triggers.last.evaluate("el => el === document.activeElement"))
        self.page.keyboard.press("Escape")
        self.assertTrue(self.page.locator("#jumpToGallery").evaluate("el => el === document.activeElement"))
        self.assertFalse(self.page.locator(".character-shell").evaluate("el => el.inert"))

    def test_audio_and_original_images_load_only_after_explicit_action(self):
        requests = []
        self.page.on("request", lambda request: requests.append(request.url))
        self.page.goto(f"{self.base}/index.html", wait_until="networkidle")
        self.assertFalse(any(urlsplit(url).path.lower().endswith((".png", ".ttf", ".mp3")) for url in requests), requests)
        self.open_character()
        self.page.wait_for_load_state("networkidle")
        self.assertIsNone(self.page.locator("#bgm").get_attribute("src"))
        self.assertEqual(self.page.locator("#galleryGrid img").count(), 0)
        self.assertFalse(any(urlsplit(url).path.lower().endswith((".png", ".ttf", ".mp3")) for url in requests), requests)
        with self.page.expect_request("**/*.thumb.webp"):
            self.page.locator("#jumpToGallery").click()
        self.page.wait_for_load_state("networkidle")
        self.assertTrue(any(".thumb.webp" in url for url in requests))
        self.assertFalse(any(urlsplit(url).path.lower().endswith((".png", ".ttf", ".mp3")) for url in requests), requests)
        with self.page.expect_request("**/*.png"):
            self.page.locator(".gallery-trigger").first.click()
        self.page.keyboard.press("Escape")
        self.page.keyboard.press("Escape")
        with self.page.expect_request("**/*.mp3"):
            self.page.locator("#audioToggle").click()
        self.assertTrue(self.page.locator("#bgm").get_attribute("src").endswith(".mp3"))

    def test_out_of_order_background_response_never_overwrites_current_chapter(self):
        self.open_character()
        held = []
        self.page.route("**/aeva_2.webp", lambda route: held.append(route))
        self.page.locator('#chapterNav a[href="#second"]').click()
        self.page.wait_for_function("location.hash === '#second'")
        self.assertEqual(len(held), 1)
        self.page.locator('#chapterNav a[href="#third"]').click()
        self.page.wait_for_function("document.querySelector('.page-background-layer.is-active').dataset.image.endsWith('aeva_3.webp')")
        second_image = ROOT / "assets/optimized/characters/aeva/gallery/aeva_2.webp"
        held.pop().fulfill(status=200, content_type="image/webp", body=second_image.read_bytes())
        self.page.wait_for_load_state("networkidle")
        self.assert_chapter("third")
        self.assertTrue(self.page.locator(".page-background-layer.is-active").get_attribute("data-image").endswith("aeva_3.webp"))

    def test_return_to_loaded_background_cancels_pending_other_chapter(self):
        self.open_character()
        held = []
        self.page.route("**/aeva_2.webp", lambda route: held.append(route))
        self.page.locator('#chapterNav a[href="#second"]').click()
        self.assertEqual(len(held), 1)
        self.page.locator('#chapterNav a[href="#prolog"]').click()
        held.pop().fulfill(status=200, content_type="image/webp", body=(ROOT / "assets/optimized/characters/aeva/gallery/aeva_2.webp").read_bytes())
        self.page.wait_for_load_state("networkidle")
        self.assert_chapter("prolog")
        self.assertTrue(self.page.locator(".page-background-layer.is-active").get_attribute("data-image").endswith("aeva_1.webp"))

    def test_failed_background_keeps_last_successful_image(self):
        self.open_character()
        self.page.route("**/aeva_2.webp", lambda route: route.abort())
        self.page.locator('#chapterNav a[href="#second"]').click()
        self.page.wait_for_load_state("networkidle")
        self.assert_chapter("second")
        self.assertTrue(self.page.locator(".page-background-layer.is-active").get_attribute("data-image").endswith("aeva_1.webp"))

    def test_desktop_reading_column_alignment_and_footer_do_not_overlap(self):
        for width in (1024, 1280, 1440, 1920):
            self.page.set_viewport_size({"width": width, "height": 900})
            for slug, character in self.characters.items():
                if not character["published"]:
                    continue
                with self.subTest(width=width, character=slug):
                    self.open_character(slug)
                    geometry = self.page.evaluate("""() => {
                      const box = selector => { const r = document.querySelector(selector).getBoundingClientRect(); return {left:r.left,right:r.right,top:r.top,bottom:r.bottom}; };
                      return {title:box('#characterTitle'),nav:box('#chapterNav'),content:box('.content-box'),footer:box('.footer-actions'),
                        overflow:document.documentElement.scrollWidth > document.documentElement.clientWidth,
                        clipped: [...document.querySelectorAll('.content-body, .menu, .header-topbar')].some(el => el.scrollWidth > el.clientWidth + 1)};
                    }""")
                    for target in ("nav", "content", "footer"):
                        self.assertAlmostEqual(geometry["title"]["left"], geometry[target]["left"], delta=1)
                    self.assertLessEqual(geometry["nav"]["bottom"], geometry["content"]["top"])
                    self.assertGreaterEqual(geometry["footer"]["top"], geometry["content"]["bottom"])
                    self.assertLess(geometry["content"]["right"], width * .6, "Reading column must leave the right-hand image visible")
                    self.assertFalse(geometry["overflow"], geometry)
                    self.assertFalse(geometry["clipped"], geometry)

    def test_selection_has_only_the_three_selected_characters_with_native_links(self):
        self.open_selection()
        self.assert_active_selection("demetria")
        panels = self.page.locator(".selection-panel")
        self.assertEqual(panels.count(), len(self.selection_slugs))
        self.assertEqual(self.page.locator(".selection-link").count(), len(self.selection_slugs))
        self.assertEqual(self.page.locator("h1").count(), 1)
        self.assertLessEqual(self.page.locator("h1").bounding_box()["height"], 2)
        self.assertEqual(self.page.locator("#landingBackground, .landing-background-layer, .landing-aurora").count(), 0)
        for slug, character in self.characters.items():
            if slug not in self.selection_slugs:
                continue
            panel = self.page.locator(f'.selection-panel[data-character="{slug}"]')
            self.assertEqual(panel.locator("h2").count(), 1)
            self.assertEqual(panel.locator("h2").text_content(), character["name"])
            self.assertEqual(panel.locator("a").get_attribute("href"), f"characters/{slug}.html")
            self.assertEqual(panel.locator("a").get_attribute("aria-label"), f'{character["name"]} öffnen')
            panel.locator("a").focus()
            with self.page.expect_navigation():
                self.page.keyboard.press("Enter")
            self.assertTrue(self.page.url.endswith(f"/characters/{slug}.html"))
            self.page.go_back()
        self.assertEqual(panels.evaluate_all("panels => panels.map(panel => panel.dataset.character)"),
                         self.selection_slugs)

    def test_selection_fills_desktop_and_gives_each_hovered_character_equal_space(self):
        for width, height in ((1024, 768), (1280, 720), (1440, 900), (1920, 1080), (2560, 1080)):
            self.page.set_viewport_size({"width": width, "height": height})
            self.open_selection()
            expanded_widths = []
            for slug in self.selection_slugs:
                with self.subTest(viewport=(width, height), active=slug):
                    panel = self.page.locator(f'.selection-panel[data-character="{slug}"]')
                    panel.hover()
                    self.assert_active_selection(slug)
                    self.page.wait_for_function("""() => {
                      const active = document.querySelector('.selection-panel.is-active');
                      return Math.abs(active.getBoundingClientRect().width - innerWidth / 2) < 3;
                    }""")
                    geometry = self.page.evaluate("""() => {
                      const rect = el => { const r=el.getBoundingClientRect(); return {left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width}; };
                      const panels = [...document.querySelectorAll('.selection-panel')];
                      return {grid:rect(document.getElementById('characterGrid')),
                        documentWidth:document.documentElement.scrollWidth,
                        documentHeight:document.documentElement.scrollHeight,
                        panels:panels.map(panel => ({...rect(panel),active:panel.classList.contains('is-active'),
                          text:[...panel.querySelectorAll('.selection-name, .selection-details-inner > *')]
                            .filter(el => getComputedStyle(el).visibility !== 'hidden')
                            .map(el => { const range=document.createRange();range.selectNodeContents(el);return {text:el.textContent,...rect(range)}; })}))};
                    }""")
                    self.assertAlmostEqual(geometry["grid"]["left"], 0, delta=1)
                    self.assertAlmostEqual(geometry["grid"]["top"], 0, delta=1)
                    self.assertAlmostEqual(geometry["grid"]["right"], width, delta=1)
                    self.assertAlmostEqual(geometry["grid"]["bottom"], height, delta=1)
                    self.assertLessEqual(geometry["documentWidth"], width)
                    self.assertLessEqual(geometry["documentHeight"], height)
                    previous_right = 0
                    closed_widths = []
                    for measured in geometry["panels"]:
                        self.assertAlmostEqual(measured["left"], previous_right, delta=1)
                        previous_right = measured["right"]
                        if measured["active"]:
                            expanded_widths.append(measured["width"])
                            self.assertGreater(measured["width"], width * .49)
                        else:
                            closed_widths.append(measured["width"])
                        for text in measured["text"]:
                            self.assertGreaterEqual(text["left"], measured["left"] - 1, text)
                            self.assertLessEqual(text["right"], measured["right"] + 1, text)
                            self.assertGreaterEqual(text["top"], measured["top"] - 1, text)
                            self.assertLessEqual(text["bottom"], measured["bottom"] + 1, text)
                    self.assertLess(max(closed_widths) - min(closed_widths), 2)
            self.assertLess(max(expanded_widths) - min(expanded_widths), 2)

    def test_selection_retains_hover_and_keyboard_moves_from_focused_card(self):
        self.open_selection()
        self.page.keyboard.press("Tab")
        self.assert_active_selection("aeva", focused=True)
        self.page.keyboard.press("Tab")
        self.assert_active_selection("demetria", focused=True)
        self.page.keyboard.press("Shift+Tab")
        self.assert_active_selection("aeva", focused=True)
        self.page.keyboard.press("ArrowRight")
        self.assert_active_selection("demetria", focused=True)
        self.page.locator('.selection-panel[data-character="aeva"]').hover()
        self.assert_active_selection("aeva")
        self.assertTrue(self.page.locator('[data-character="demetria"] a').evaluate("el => el === document.activeElement"))
        self.page.mouse.move(-10, -10)
        self.assert_active_selection("aeva")
        self.page.keyboard.press("ArrowRight")
        self.assert_active_selection("tezanji", focused=True)
        for key, slug in (("ArrowDown", "aeva"), ("ArrowUp", "tezanji"),
                          ("ArrowLeft", "demetria"), ("Home", "aeva"),
                          ("ArrowLeft", self.selection_slugs[-1]), ("ArrowRight", "aeva"),
                          ("End", self.selection_slugs[-1])):
            self.page.keyboard.press(key)
            self.assert_active_selection(slug, focused=True)
        # Modifier shortcuts belong to the browser; the selection must not consume them.
        for modifier in ("altKey", "ctrlKey", "metaKey", "shiftKey"):
            result = self.page.locator(f'[data-character="{self.selection_slugs[-1]}"] a').evaluate("""(el, modifier) => {
              const event = new KeyboardEvent('keydown', {key:'ArrowLeft',bubbles:true,cancelable:true,[modifier]:true});
              return el.dispatchEvent(event);
            }""", modifier)
            self.assertTrue(result, f"Selection consumed {modifier}+ArrowLeft")
            self.assert_active_selection(self.selection_slugs[-1], focused=True)

    def test_selection_reduced_motion_and_short_desktop_remain_readable_by_scrolling(self):
        self.page.set_viewport_size({"width": 1024, "height": 300})
        self.open_selection()
        self.assertTrue(self.page.evaluate("matchMedia('(prefers-reduced-motion: reduce)').matches"))
        for slug in self.selection_slugs:
            with self.subTest(character=slug):
                self.page.locator(f'[data-character="{slug}"] a').focus()
                self.assert_active_selection(slug, focused=True)
                self.page.locator(f'[data-character="{slug}"] .selection-cta').scroll_into_view_if_needed()
                measured = self.page.locator(f'[data-character="{slug}"]').evaluate("""panel => {
                  const r=panel.getBoundingClientRect();
                  const cta=panel.querySelector('.selection-cta').getBoundingClientRect();
                  return {scroll:scrollY,documentHeight:document.documentElement.scrollHeight,
                    ctaTop:cta.top,ctaBottom:cta.bottom,panelTop:r.top,panelBottom:r.bottom,
                    clipped:panel.scrollHeight > panel.clientHeight + 1,
                    durations:[...panel.querySelectorAll('*'),panel].flatMap(el => getComputedStyle(el).transitionDuration.split(',').map(parseFloat))};
                }""")
                self.assertGreater(measured["documentHeight"], 300)
                self.assertGreater(measured["scroll"], 0)
                self.assertGreaterEqual(measured["ctaTop"], 0)
                self.assertLessEqual(measured["ctaBottom"], 300)
                self.assertFalse(measured["clipped"], measured)
                self.assertLessEqual(max(measured["durations"]), .001)


if __name__ == "__main__":
    unittest.main()
