import subprocess
import sys
import tempfile
import unittest
from pathlib import Path


class SubtitleCLI(unittest.TestCase):
    def test_srt_export_and_existing_destination(self):
        with tempfile.TemporaryDirectory() as tmp:
            src = Path(tmp, "song.lrc")
            dst = src.with_suffix(".srt")
            src.write_text("[00:01.25]Olá\n[00:02]\n[00:03]Fim", encoding="utf8")
            cmd = [sys.executable, str(Path(__file__).with_name("lyrics.py")), str(src), "--srt", str(dst)]
            subprocess.run(cmd, check=True)
            expected = "1\n00:00:01,250 --> 00:00:02,000\nOlá\n\n2\n00:00:03,000 --> 00:00:06,000\nFim\n"
            self.assertEqual(dst.read_text(encoding="utf8"), expected)
            self.assertNotEqual(subprocess.run(cmd, capture_output=True).returncode, 0)
            self.assertEqual(dst.read_text(encoding="utf8"), expected)
