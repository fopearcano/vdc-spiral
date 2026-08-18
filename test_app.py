import threading
import urllib.request
import unittest
from http.server import ThreadingHTTPServer

from app import DEFAULT_PORT, SpiralHandler


class SpiralServerTest(unittest.TestCase):
    def test_default_port(self):
        self.assertEqual(DEFAULT_PORT, 8003)

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
        self.assertIn('id="chapterList"', body)
        self.assertIn('id="sceneList"', body)
        self.assertIn('id="circlesOn"', body)
        self.assertIn("Double-click for properties", body)
        self.assertIn('id="projectsPanel"', body)
        self.assertIn('id="newProject"', body)
        self.assertIn('id="recentProjects"', body)

    def test_javascript_is_served(self):
        with urllib.request.urlopen(self.base + "/app.js") as response:
            body = response.read().decode()
        self.assertIn("drawSpirals", body)
        self.assertIn("fibonacciSquares", body)
        self.assertIn("fibonacciSpiralPath", body)
        self.assertIn("drawEntities", body)
        self.assertIn("Math.min(20", body)
        self.assertIn("addEventListener('dblclick'", body)
        self.assertIn("function saveProject", body)
        self.assertIn("function openProject", body)
        self.assertEqual(response.headers["Cache-Control"], "no-store")


if __name__ == "__main__":
    unittest.main()
