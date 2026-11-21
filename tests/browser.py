"""Run the published demo through Chromium, including a touch-sized viewport."""
import os
import shutil
from pathlib import Path
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from threading import Thread
from tempfile import TemporaryDirectory
from playwright.sync_api import sync_playwright, expect

root = Path(__file__).resolve().parents[1]
with sync_playwright() as engine, TemporaryDirectory() as folder:
    command = os.environ.get("CONTRATEMPO_BROWSER")
    binary = shutil.which(command) if command else None
    if command and not binary:
        raise RuntimeError(f"Browser unavailable: {command}")
    backend = engine.firefox if os.environ.get("CONTRATEMPO_ENGINE") == "firefox" else engine.chromium
    browser = backend.launch(executable_path=binary)
    server = ThreadingHTTPServer(("127.0.0.1", 0), partial(SimpleHTTPRequestHandler, directory=root / "docs"))
    Thread(target=server.serve_forever, daemon=True).start()
    for width in (375, 1280):
        page = browser.new_page(viewport={"width": width, "height": 840}, reduced_motion="reduce")
        errors = []
        page.on("pageerror", lambda error: errors.append(str(error)))
        page.goto(f"http://127.0.0.1:{server.server_port}/")
        page.wait_for_function("audio.readyState >= 1")
        assert page.evaluate("document.documentElement.scrollWidth <= innerWidth")
        page.locator("#lines button").nth(1).click()
        page.locator("#wave-load").click()
        expect(page.locator("#wave-box")).to_be_visible()
        page.locator("#mark-a").click()
        page.locator("#lines button").nth(2).click()
        page.locator("#mark-b").click()
        expect(page.locator("#range")).to_contain_text("00:03.000 até 00:06.000")
        page.locator("audio").evaluate("el => {el.currentTime = 5.9; return el.play()}")
        page.wait_for_function("!audio.paused && audio.currentTime >= 3 && audio.currentTime < 4")
        page.locator("audio").evaluate("el => el.pause()")
        page.locator("#clear").click()
        page.locator("#lines button").nth(1).focus()
        page.keyboard.press("ArrowDown")
        page.keyboard.press("Enter")
        expect(page.locator("#current")).to_have_text("Na curva da madrugada")
        page.locator("#speed").select_option(".75")
        assert page.locator("audio").evaluate("el => el.playbackRate") == .75
        page.locator("#present").click()
        page.keyboard.press("Escape")
        expect(page.locator(".queue")).to_be_visible()
        page.locator("#lrc").set_input_files({"name": "Letra.lrc", "mimeType": "text/plain",
                                             "buffer": "[00:01]Olá & <você>\n[00:03]Fim".encode()})
        expect(page.locator("h1")).to_have_text("Letra")
        page.locator("#lrc").set_input_files({"name": "invalido.lrc", "mimeType": "text/plain", "buffer": b"bad"})
        expect(page.locator("#status")).to_contain_text("Nenhum verso")
        expect(page.locator("h1")).to_have_text("Letra")
        page.get_by_text("Editar letra e sincronização", exact=True).click()
        page.locator("#offset").fill("500")
        page.locator("#apply").click()
        expect(page.locator("#editor")).to_have_value("[00:00.500]Olá & <você>\n[00:02.500]Fim\n")
        page.locator("#undo").click()
        page.locator("#redo").click()
        for fmt, expected in (("SRT", "Olá & <você>"), ("WebVTT", "Olá &amp; &lt;você&gt;"), ("LRC", "[00:00.500]")):
            page.locator("#format").select_option(fmt)
            with page.expect_download() as download:
                page.locator("#save").click()
            path = Path(folder, download.value.suggested_filename)
            download.value.save_as(path)
            assert expected in path.read_text(encoding="utf-8")
        page.locator("#lrc").set_input_files(path)
        expect(page.locator("#lines time").first).to_have_text("00:00.500")
        page.get_by_text("Guardar ou retomar sessão", exact=True).click()
        page.locator("#keep").click()
        page.reload()
        page.get_by_text("Guardar ou retomar sessão", exact=True).click()
        page.locator("#resume").click()
        expect(page.locator("h1")).to_have_text("Letra")
        expect(page.locator("#lines time").first).to_have_text("00:00.500")
        assert not errors, errors
        page.close()
    server.shutdown()
    server.server_close()
    browser.close()
