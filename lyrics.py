"""Play an LRC timeline locally, optionally sharing the current line via Discord RPC."""
import argparse
import re
import time
from pathlib import Path
from itertools import groupby

STAMP = re.compile(r"\[(\d+):([0-5]\d)(?:[.:](\d{1,3}))?\]")


def timeline(source):
    offset = re.search(r"^\[offset:([+-]?\d+)\]\s*$", source, re.MULTILINE | re.I)
    shift = int(offset[1]) / 1000 if offset else 0
    entries = []
    for line in source.splitlines():
        stamps = list(STAMP.finditer(line))
        if stamps:
            lyric = line[stamps[-1].end():].strip()
            for stamp in stamps:
                minutes, seconds, fraction = stamp.groups()
                moment = int(minutes) * 60 + int(seconds) + int((fraction or "").ljust(3, "0")) / 1000
                entries.append((max(0, moment - shift), lyric))
    entries.sort(key=lambda entry: entry[0])
    return [(at, " / ".join(text for _, text in group if text))
            for at, group in groupby(entries, key=lambda entry: entry[0])]


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
    args = parser.parse_args()
    if args.start < 0:
        parser.error("--start must be at least zero")
    client = None
    try:
        lines = timeline(args.file.read_text(encoding="utf-8-sig"))
        if not lines:
            parser.error("No [mm:ss.xx] timestamps in this file")
        if args.client_id:
            from pypresence import Presence
            client = Presence(args.client_id)
            client.connect()
        play(lines, args.file.stem, client, args.start)
    except KeyboardInterrupt:
        pass
    except Exception as exc:
        parser.exit(1, f"Lyrics Sync: {exc}\n")
    finally:
        if client:
            try:
                client.close()
            except Exception:
                pass


if __name__ == "__main__":
    main()
