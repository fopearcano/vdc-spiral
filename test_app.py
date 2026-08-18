import functools
import threading
import urllib.request
import unittest
from http.server import ThreadingHTTPServer

from app import SpiralHandler


class SpiralServerTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.server = ThreadingHTTPServer(("127.0.0.1", 0), SpiralHandler)
        cls.thread = threading.Thread(target=cls.server.serve_forever, daemon=True)
        cls.thread.start()
        cls.base = f"http://127.0.0.1:{cls.server.server_port}"

    @classmethod
    def tearDownClass(cls):
        cls.server.shutdown()
        cls.server.server_close()

    def test_app_shell_is_served(self):
        with urllib.request.urlopen(self.base + "/") as response:
            body = response.read().decode()
        self.assertEqual(response.status, 200)
        self.assertIn("Story Geometry", body)
        self.assertIn('id="diagram"', body)
        self.assertNotIn(">About<", body)
        self.assertIn('id="themeBtn"', body)
        self.assertIn('id="fibScale"', body)
        self.assertIn('id="spiralLineStyle"', body)
        self.assertIn('id="goldenScaleNumber"', body)
        self.assertIn('max="5000"', body)

    def test_javascript_is_served(self):
        with urllib.request.urlopen(self.base + "/app.js") as response:
            body = response.read().decode()
        self.assertIn("drawSpirals", body)
        self.assertIn("fibonacciSquares", body)
        self.assertEqual(response.headers["Cache-Control"], "no-store")


if __name__ == "__main__":
    unittest.main()
