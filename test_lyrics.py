import unittest
from unittest.mock import Mock
from lyrics import play, timeline


class LyricsTest(unittest.TestCase):
    def test_offset_chorus_and_metadata(self):
        self.assertEqual(timeline("[ti:x]\n[offset:250]\n[00:02.5][01:01.50]hi"),
                         [(2.25, "hi"), (61.25, "hi")])

    def test_empty_and_invalid(self):
        self.assertEqual(timeline("hello\n[00:70]invalid"), [])

    def test_simultaneous_and_silence(self):
        self.assertEqual(timeline("[00:00]a\n[00:00]b\n[00:01]"), [(0, "a / b"), (1, "")])

    def test_seek_and_throttle(self):
        now = [0]
        def advance(seconds):
            now[0] += seconds
        client, display = Mock(), Mock()
        play([(0, "intro"), (2, "verse"), (3, "bridge"), (18, "chorus")],
             "song", client, 2, lambda: now[0], advance, display)
        self.assertEqual([call.args[0] for call in display.call_args_list], ["verse", "bridge", "chorus"])
        self.assertEqual([call.kwargs["details"] for call in client.update.call_args_list], ["verse", "bridge"])
