import unittest

from exports import subtitles
from lrc import timeline


class FormatTests(unittest.TestCase):
    def test_metadata_and_brackets_inside_lyrics(self):
        source = "\ufeff[offset:100]\n[ti:[20:00]Song]\n[00:01.100]me [02:03]\n[00:01:100]você"
        self.assertEqual(timeline(source), [(1, "me [02:03] / você")])

    def test_last_cue_and_plain_subrip(self):
        line = 'ação "A" & <B> --> C'
        self.assertEqual(subtitles([(3600, line)], True, 0.75),
                         '1\n01:00:00,000 --> 01:00:00,750\n' + line + '\n')
        self.assertIn('ação "A" &amp; &lt;B&gt; --&gt; C', subtitles([(0, line)]))
