import unittest

from exports import subtitles
from lrc import timeline


class FormatTests(unittest.TestCase):
    def test_metadata_and_brackets_inside_lyrics(self):
        source = "\ufeff[offset:100]\n[ti:[20:00]Song]\n[00:01.100]me [02:03]\n[00:01:100]você"
        self.assertEqual(timeline(source), [(1, "me [02:03] / você")])

    def test_enhanced_word_stamps_are_not_part_of_the_lyric(self):
        self.assertEqual(timeline("[00:01.00]<00:01.00>olá <00:01.40>mundo"), [(1, "olá mundo")])
        self.assertEqual(timeline("[00:02.00]<00:02.00>\n[00:03.00]fim"), [(2, ""), (3, "fim")])
        self.assertEqual(timeline("[00:01.00][00:05.00]<00:01.00>a<00:01.50>b"), [(1, "a b"), (5, "a b")])
        # Texto comum entre < > não é marca de tempo e deve ser preservado.
        self.assertEqual(timeline("[00:04.00]a <3 b <B> <1:99>"), [(4, "a <3 b <B> <1:99>")])

    def test_word_stamps_do_not_reach_subtitles(self):
        lines = timeline("[00:00.00]<00:00.00>olá <00:00.50>mundo")
        self.assertEqual(subtitles(lines, False, 2), "WEBVTT\n\n00:00:00.000 --> 00:00:02.000\nolá mundo\n")
        self.assertNotIn("&lt;", subtitles(lines, True, 2))

    def test_last_cue_and_plain_subrip(self):
        line = 'ação "A" & <B> --> C'
        self.assertEqual(subtitles([(3600, line)], True, 0.75),
                         '1\n01:00:00,000 --> 01:00:00,750\n' + line + '\n')
        self.assertIn('ação "A" &amp; &lt;B&gt; --&gt; C', subtitles([(0, line)]))
