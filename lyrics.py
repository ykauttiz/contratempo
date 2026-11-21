"""Play an LRC timeline locally, optionally sharing the current line via Discord RPC."""
import argparse
import math
import time
from pathlib import Path
from lrc import timeline

def play(lines, title, client, start, clock=time.monotonic, sleep=time.sleep, display=print):
    origin = clock() - start
    next_share = 0
    previous = -2
    shared = None
    index = -1
    while True:
        now = clock()
        elapsed = now - origin
        while index + 1 < len(lines) and lines[index + 1][0] <= elapsed:
            index += 1
        current = lines[index][1] if index >= 0 else ""
        if index != previous:
            display(current or "♪", flush=True)
            previous = index
        if client and current != shared and now >= next_share:
            details = (current or title or "♪")[:128]
            client.update(details=details if len(details) > 1 else "♪ " + details)
            next_share = now + 15
            shared = current
        if index == len(lines) - 1:
            return
        sleep(min(0.25, max(0, lines[index + 1][0] - elapsed)))


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("file", type=Path)
    parser.add_argument("--client-id", help="Discord application ID for optional desktop presence")
    parser.add_argument("--start", type=int, default=0, help="Start at this many seconds")
    output = parser.add_mutually_exclusive_group()
    output.add_argument("--html", type=Path, help="Create a local rehearsal page")
    output.add_argument("--vtt", type=Path, help="Export WebVTT subtitles")
    output.add_argument("--srt", type=Path, help="Export numbered SubRip subtitles")
    parser.add_argument("--last-duration", type=float, help="Seconds for a final subtitle without an end marker (default 3)")
    args = parser.parse_args()
    if args.last_duration is not None and (not (args.vtt or args.srt) or not math.isfinite(args.last_duration) or args.last_duration < 0.001):
        parser.error("--last-duration requires --vtt or --srt and at least one millisecond")
    target = args.html or args.vtt or args.srt
    if target and (args.client_id or args.start):
        parser.error("Export and playback options must be used separately")
    if args.start < 0:
        parser.error("--start must be at least zero")
    client = None
    try:
        if args.file.stat().st_size > 1024 * 1024:
            parser.error("LRC exceeds 1 MiB")
        lines = timeline(args.file.read_text(encoding="utf-8-sig"))
        if not lines:
            parser.error("No [mm:ss.xx] timestamps in this file")
        if target:
            from exports import rehearsal, subtitles
            if args.html:
                content = rehearsal(lines, args.file.stem)
            else:
                content = subtitles(lines, subrip=bool(args.srt), last_duration=args.last_duration or 3)
            with target.open("x", encoding="utf-8", newline="\n") as stream:
                stream.write(content)
            return
        if args.client_id:
            from pypresence import Presence
            client = Presence(args.client_id)
            client.connect()
        play(lines, args.file.stem, client, args.start)
    except KeyboardInterrupt:
        pass
    except Exception as exc:
        parser.exit(1, f"Contratempo: {exc}\n")
    finally:
        if client:
            try:
                client.close()
            except Exception:
                pass


if __name__ == "__main__":
    main()
