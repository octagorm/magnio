# Serves the game at http://localhost:8123 for development. Like
# `python3 -m http.server`, but tells the browser not to keep copies of the
# files, so a reload always gets the latest version of every script.
import functools
import http.server
import os

PORT = 8123


class NoCache(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store')
        super().end_headers()


if __name__ == '__main__':
    root = os.path.dirname(os.path.abspath(__file__))
    handler = functools.partial(NoCache, directory=root)
    print('Super Magnio: http://localhost:%d' % PORT)
    http.server.ThreadingHTTPServer(('', PORT), handler).serve_forever()
