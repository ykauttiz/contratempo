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
    for width in (320, 375, 1280):
        page = browser.new_page(viewport={"width": width, "height": 840}, reduced_motion="reduce")
        errors = []
        page.on("pageerror", lambda error: errors.append(str(error)))
        page.goto(f"http://127.0.0.1:{server.server_port}/")
        assert page.evaluate("!!document.querySelector('link[rel~=icon]')"), "falta o ícone da página"
        assert page.evaluate("(document.querySelector('meta[name=description]')?.content || '').length >= 50"), "falta a descrição da página"
        theme = page.get_by_role("combobox", name="Tema da interface")
        for mode in ("dark", "light"):
            theme.select_option(mode)
            expect(page.locator("html")).to_have_attribute("data-theme", mode)
            assert page.evaluate("getComputedStyle(document.documentElement).colorScheme") == mode
            assert page.evaluate("document.documentElement.scrollWidth <= innerWidth")
        page.reload()
        expect(theme).to_have_value("light")
        theme.select_option("system")
        page.emulate_media(color_scheme="dark")
        expect(page.locator("html")).to_have_attribute("data-theme", "dark")
        page.emulate_media(color_scheme="light")
        expect(page.locator("html")).to_have_attribute("data-theme", "light")
        page.reload()
        page.keyboard.press("Tab")
        expect(page.locator(".skip")).to_be_focused()
        page.keyboard.press("Enter")
        assert page.evaluate("location.hash === document.querySelector('.skip').hash")
        assert page.evaluate("document.documentElement.scrollWidth <= innerWidth")
        page.wait_for_function("audio.readyState >= 1")
        if os.environ.get("CAPTURAR_DEMO") == "1":
            captures = root / "capturas"
            captures.mkdir(exist_ok=True)
            page.screenshot(path=captures / f"demo-{width}.png", animations="disabled")

        # Exercise the local recording flow. The standard-library HTTP fixture
        # does not support byte-range requests for seeking in a remote MP3.
        page.locator("#upload").set_input_files(root / "docs/ensaio.mp3")
        page.wait_for_function("audio.currentSrc.startsWith('blob:') && audio.readyState >= 2")
        assert page.evaluate("document.documentElement.scrollWidth <= innerWidth")
        search = page.locator("#verse-search")
        search.fill("audio")
        expect(page.locator("#lines button:visible")).to_have_count(1)
        expect(page.locator("#lines button:visible")).to_contain_text("áudio")
        page.locator("#lines button:visible").press("Home")
        expect(page.locator("#lines button:visible")).to_be_focused()
        search.fill("inexistente")
        expect(page.locator("#verse-count")).to_contain_text("Nenhum trecho")
        search.fill("")
        page.locator("#lines button").nth(1).click()
        page.locator("#verse-loop").click()
        expect(page.locator("#range")).to_contain_text("00:03.000 até 00:06.000")
        page.locator("#clear").click()
        page.locator("#wave-load").click()
        expect(page.locator("#wave-box")).to_be_visible()
        page.locator("#mark-a").click()
        page.locator("#lines button").nth(2).click()
        page.locator("#mark-b").click()
        expect(page.locator("#range")).to_contain_text("00:03.000 até 00:06.000")
        page.locator("#training").select_option("2")
        page.locator("audio").evaluate("el => {el.currentTime = 5.9; return el.play()}")
        page.wait_for_function("!audio.paused && audio.currentTime >= 3 && audio.currentTime < 4")
        expect(page.locator("#training-count")).to_contain_text("Volta")
        page.locator("audio").evaluate("el => el.pause()")
        page.locator("#clear").click()
        page.locator("#lines button").nth(1).focus()
        page.keyboard.press("ArrowDown")
        page.keyboard.press("Enter")
        expect(page.locator("#current")).to_have_text("Na curva da madrugada")
        page.locator("#previous-cue").click()
        expect(page.locator("#current")).to_have_text("A chuva ficou pra trás")
        page.locator("#next-cue").click()
        expect(page.locator("#current")).to_have_text("Na curva da madrugada")
        page.locator("#speed").select_option(".75")
        assert page.locator("audio").evaluate("el => el.playbackRate") == .75
        page.locator("#present").click()
        page.keyboard.press("Escape")
        expect(page.locator(".queue")).to_be_visible()
        page.locator("#lrc").set_input_files({"name": "Palavras.lrc", "mimeType": "text/plain",
                                             "buffer": "[00:01]<00:01.00>olá <00:01.40>mundo\n[00:03]Fim".encode()})
        expect(page.locator("h1")).to_have_text("Palavras")
        expect(page.locator("#status")).to_contain_text("Marcas de palavra removidas")
        expect(page.locator(".queue")).to_contain_text("olá mundo")
        expect(page.locator(".queue")).not_to_contain_text("<00:01")
        page.locator("#lrc").set_input_files({"name": "Letra.lrc", "mimeType": "text/plain",
                                             "buffer": "[00:01]Olá & <você>\n[00:03]Fim".encode()})
        expect(page.locator("h1")).to_have_text("Letra")
        page.locator("#lrc").set_input_files({"name": "invalido.lrc", "mimeType": "text/plain", "buffer": b"bad"})
        expect(page.locator("#status")).to_contain_text("Nenhum verso")
        expect(page.locator("h1")).to_have_text("Letra")
        page.get_by_text("Editar letra e sincronização", exact=True).click()
        page.locator("#offset").fill("500")
        page.locator("#tap").click()
        expect(page.locator("#status")).to_contain_text("Aplique as mudanças")
        expect(page.locator("#offset")).to_have_value("500")
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
        page.locator("#saved-name").fill("Ensaio principal")
        page.locator("#library-add").click()
        expect(page.locator("#library-select option")).to_have_count(1)
        page.locator("#library-add").click()
        expect(page.locator("#status")).to_contain_text("Já existe")
        page.locator("#keep").click()
        page.reload()
        page.get_by_text("Guardar ou retomar sessão", exact=True).click()
        page.locator("#resume").click()
        expect(page.locator("#training")).to_have_value("2")
        expect(page.locator("h1")).to_have_text("Letra")
        expect(page.locator("#lines time").first).to_have_text("00:00.500")
        page.locator("#lrc").set_input_files({"name":"Longa.lrc","mimeType":"text/plain",
            "buffer":"\n".join(f"[{i//60:02d}:{i%60:02d}]Linha {i}" for i in range(10000)).encode()})
        expect(page.locator("#queue-page")).to_have_text("1 / 167")
        expect(page.locator("#lines button")).to_have_count(60)
        expect(page.locator("#cue option")).to_have_count(0)
        page.locator("#lines button").first.press("End")
        expect(page.locator("#lines button").last).to_be_focused()
        expect(page.locator("#lines button").last).to_contain_text("Linha 9999")
        expect(page.locator("#lines button")).to_have_count(40)
        page.goto(f"http://127.0.0.1:{server.server_port}/portfolio/")
        page.keyboard.press("Tab")
        expect(page.locator(".skip")).to_be_focused()
        page.keyboard.press("Enter")
        assert page.evaluate("location.hash === '#projetos'")
        assert page.evaluate("document.documentElement.scrollWidth <= innerWidth")
        projects = page.locator(".project")
        expect(projects).to_have_count(4)
        for project in projects.all():
            project.locator("summary").press("Enter")
            expect(project.locator("details p")).to_be_visible()
            preview = project.locator("img")
            assert page.request.get(preview.evaluate("image => image.src")).ok
        if os.environ.get("CAPTURAR_DEMO") == "1":
            page.screenshot(path=captures / f"portfolio-{width}.png", full_page=True, animations="disabled")
        assert not errors, errors
        page.close()
    server.shutdown()
    server.server_close()
    browser.close()
