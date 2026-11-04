#!/usr/bin/env python3
"""Serwer podglądu: zawsze świeże pliki (Cache-Control: no-store)."""
import http.server, socketserver, functools, sys

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 5173


class Handler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        super().end_headers()

    def log_message(self, fmt, *args):
        sys.stderr.write("%s - %s\n" % (self.address_string(), fmt % args))


handler = functools.partial(Handler, directory=".")
socketserver.TCPServer.allow_reuse_address = True
with socketserver.ThreadingTCPServer(("0.0.0.0", PORT), handler) as httpd:
    print(f"LuminoOS — podgląd na http://0.0.0.0:{PORT} (bez cache)", flush=True)
    httpd.serve_forever()
