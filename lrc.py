"""Read line-timed LRC into a stable, millisecond-accurate timeline."""
import re
from itertools import groupby

STAMP = re.compile(r"\[(\d+):([0-5]\d)(?:[.:](\d{1,3}))?\]")


def timeline(source):
    source = source.lstrip("\ufeff")
    offset = re.search(r"^\[offset:([+-]?\d+)\]\s*$", source, re.MULTILINE | re.I)
    shift = int(offset[1]) if offset else 0
    entries = []
    for line in source.splitlines():
        line = line.lstrip()
        prefix = re.match(r"^(?:\[\d+:[0-5]\d(?:[.:]\d{1,3})?\])+", line)
        stamps = list(STAMP.finditer(prefix[0])) if prefix else []
        if stamps:
            lyric = line[stamps[-1].end():].strip()
            for stamp in stamps:
                minutes, seconds, fraction = stamp.groups()
                moment = int(minutes) * 60000 + int(seconds) * 1000 + int((fraction or "").ljust(3, "0"))
                entries.append((max(0, moment - shift) / 1000, lyric))
    entries.sort(key=lambda entry: entry[0])
    return [(at, " / ".join(text for _, text in group if text))
            for at, group in groupby(entries, key=lambda entry: entry[0])]
