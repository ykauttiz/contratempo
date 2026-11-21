"""Build the GitHub Pages demo using the same template as the offline CLI."""
from pathlib import Path

from exports import rehearsal
from lrc import timeline


if __name__ == "__main__":
    root = Path(__file__).resolve().parent
    lines = timeline((root / "demo.lrc").read_text(encoding="utf-8-sig"))
    (root / "docs/index.html").write_text(
        rehearsal(lines, "Depois da chuva", "ensaio.mp3"), encoding="utf-8"
    )
