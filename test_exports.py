import json
import re
import unittest
from pathlib import Path
from exports import rehearsal, timestamp, webvtt
from lyrics import timeline


class ExportTests(unittest.TestCase):
    def test_vtt_handles_silence_markup_and_last_line(self):
        result = webvtt([(0, "<a> & b"), (1.25, ""), (3.5, "fim")])
        self.assertEqual(result, "WEBVTT\n\n00:00:00.000 --> 00:00:01.250\n&lt;a&gt; &amp; b\n\n00:00:03.500 --> 00:00:06.500\nfim\n")

    def test_hour_boundary(self):
        self.assertEqual(timestamp(3599.9996), "01:00:00.000")

    def test_user_text_round_trips_inside_script(self):
        line = "</script><p>olá</p>"
        html = rehearsal([(1, line)], line)
        payload = re.search(r'application/json">(.*?)</script>', html).group(1)
        self.assertNotIn("<", payload)
        self.assertEqual(json.loads(payload)["lines"], [[1, line]])

    def test_published_demo_matches_template(self):
        root = Path(__file__).parent
        score = timeline((root / "demo.lrc").read_text(encoding="utf8"))
        self.assertEqual((root / "docs/index.html").read_text(encoding="utf8"),
                         rehearsal(score, "Depois da chuva", "ensaio.mp3"))
        self.assertGreater((root / "docs/ensaio.mp3").stat().st_size, 0)
