"""Render rehearsal sheets and WebVTT from a normalized LRC timeline."""
import json
from html import escape
from pathlib import Path


def rehearsal(lines, title, audio=""):
    payload = json.dumps({"lines": lines, "title": title, "audio": audio}, ensure_ascii=False)
    template = Path(__file__).with_name("rehearsal.html").read_text(encoding="utf-8")
    return template.replace("__SCORE__", payload.replace("<", r"\u003c"))


def timestamp(seconds):
    minutes, ms = divmod(round(seconds * 1000), 60000)
    hours, minutes = divmod(minutes, 60)
    return f"{hours:02}:{minutes:02}:{ms // 1000:02}.{ms % 1000:03}"


def subtitles(lines, subrip=False):
    cues = [] if subrip else ["WEBVTT\n"]
    for index, (at, text) in enumerate(lines):
        if text:
            end = lines[index + 1][0] if index + 1 < len(lines) else at + 3
            times = f"{timestamp(at)} --> {timestamp(end)}"
            if subrip:
                times = f"{len(cues) + 1}\n" + times.replace(".", ",")
            cues.append(f"{times}\n{escape(text, quote=False)}\n")
    return "\n".join(cues)


def webvtt(lines):
    return subtitles(lines)
