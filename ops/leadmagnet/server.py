#!/usr/bin/env python3
"""Token-gated lead-magnet downloads for reeldemo.io.

POST /leadmagnet/claim  — insert waitlist row + return short-lived download URL
GET  /leadmagnet/download?t=... — validate token, X-Accel-Redirect to zip
GET  /leadmagnet/health — liveness
"""

from __future__ import annotations

import hashlib
import hmac
import json
import os
import re
import time
import urllib.error
import urllib.request
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import parse_qs, urlparse

EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
TOKEN_TTL_SEC = int(os.environ.get("LEADMAGNET_TOKEN_TTL", "900"))
ZIP_NAME = os.environ.get(
    "LEADMAGNET_ZIP_NAME", "reelsynth-genre-tables-500.zip"
)
PUBLIC_BASE = os.environ.get(
    "LEADMAGNET_PUBLIC_BASE", "https://supabase.reeldemo.io"
).rstrip("/")
HMAC_SECRET = os.environ["LEADMAGNET_HMAC_SECRET"].encode("utf-8")
SUPABASE_URL = os.environ.get(
    "SUPABASE_URL", "http://127.0.0.1:30592"
).rstrip("/")
SUPABASE_ANON_KEY = os.environ["SUPABASE_ANON_KEY"]
ALLOWED_ORIGINS = {
    o.strip()
    for o in os.environ.get(
        "LEADMAGNET_CORS_ORIGINS",
        "https://www.reeldemo.io,https://reeldemo.io,https://reeldemo.github.io,http://localhost:8080,http://127.0.0.1:8080",
    ).split(",")
    if o.strip()
}


def b64url(data: bytes) -> str:
    import base64

    return base64.urlsafe_b64encode(data).decode("ascii").rstrip("=")


def b64url_decode(data: str) -> bytes:
    import base64

    pad = "=" * (-len(data) % 4)
    return base64.urlsafe_b64decode(data + pad)


def sign_token(email: str, product: str, exp: int) -> str:
    payload = f"{email.lower()}|{product}|{exp}".encode("utf-8")
    sig = hmac.new(HMAC_SECRET, payload, hashlib.sha256).digest()
    return b64url(payload) + "." + b64url(sig)


def verify_token(token: str) -> tuple[str, str] | None:
    try:
        payload_b64, sig_b64 = token.split(".", 1)
        payload = b64url_decode(payload_b64)
        expected = hmac.new(HMAC_SECRET, payload, hashlib.sha256).digest()
        if not hmac.compare_digest(expected, b64url_decode(sig_b64)):
            return None
        email, product, exp_s = payload.decode("utf-8").split("|", 2)
        if int(exp_s) < int(time.time()):
            return None
        return email, product
    except Exception:
        return None


def waitlist_insert(email: str, product: str, source: str, focus: str, page: str) -> int:
    body = {
        "email": email,
        "product": product,
        "source": source,
        "utm": {"page": page, "touchpoint": "lead_magnet"},
    }
    if focus:
        body["focus"] = focus
    req = urllib.request.Request(
        SUPABASE_URL + "/rest/v1/plugin_waitlist",
        data=json.dumps(body).encode("utf-8"),
        method="POST",
        headers={
            "Content-Type": "application/json",
            "apikey": SUPABASE_ANON_KEY,
            "Authorization": "Bearer " + SUPABASE_ANON_KEY,
            "Prefer": "return=minimal",
            "Host": "supabase.reeldemo.io",
        },
    )
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            return int(resp.status)
    except urllib.error.HTTPError as e:
        return int(e.code)


class Handler(BaseHTTPRequestHandler):
    protocol_version = "HTTP/1.1"

    def log_message(self, fmt: str, *args) -> None:
        sys_stderr = __import__("sys").stderr
        sys_stderr.write(
            "%s - %s\n" % (self.address_string(), fmt % args)
        )

    def _cors(self) -> None:
        origin = self.headers.get("Origin", "")
        if origin in ALLOWED_ORIGINS:
            self.send_header("Access-Control-Allow-Origin", origin)
            self.send_header("Vary", "Origin")
            self.send_header("Access-Control-Allow-Methods", "POST, GET, OPTIONS")
            self.send_header("Access-Control-Allow-Headers", "Content-Type")

    def _json(self, code: int, obj: dict) -> None:
        raw = json.dumps(obj).encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(raw)))
        self._cors()
        self.end_headers()
        self.wfile.write(raw)

    def do_OPTIONS(self) -> None:
        self.send_response(204)
        self._cors()
        self.send_header("Content-Length", "0")
        self.end_headers()

    def do_GET(self) -> None:
        parsed = urlparse(self.path)
        if parsed.path in ("/leadmagnet/health", "/health"):
            self._json(200, {"ok": True})
            return
        if parsed.path == "/leadmagnet/download":
            qs = parse_qs(parsed.query)
            token = (qs.get("t") or [""])[0]
            verified = verify_token(token)
            if not verified:
                self._json(403, {"error": "invalid_or_expired_token"})
                return
            self.send_response(200)
            self.send_header(
                "Content-Type", "application/octet-stream"
            )
            self.send_header(
                "Content-Disposition",
                f'attachment; filename="{ZIP_NAME}"',
            )
            self.send_header(
                "X-Accel-Redirect", f"/internal/leadmagnet/{ZIP_NAME}"
            )
            self.send_header("Content-Length", "0")
            self.end_headers()
            return
        self._json(404, {"error": "not_found"})

    def do_POST(self) -> None:
        parsed = urlparse(self.path)
        if parsed.path != "/leadmagnet/claim":
            self._json(404, {"error": "not_found"})
            return
        length = int(self.headers.get("Content-Length") or "0")
        if length > 8192:
            self._json(413, {"error": "payload_too_large"})
            return
        try:
            data = json.loads(self.rfile.read(length) or b"{}")
        except json.JSONDecodeError:
            self._json(400, {"error": "invalid_json"})
            return

        email = str(data.get("email") or "").strip().lower()
        product = str(data.get("product") or "reelsynth_genre_tables").strip()
        source = str(data.get("source") or "reeldemo.github.io/reelsynth/wavetables").strip()
        focus = str(data.get("focus") or "").strip()
        page = str(data.get("page") or "/reelsynth/wavetables/").strip()

        if not EMAIL_RE.match(email) or len(email) > 254:
            self._json(400, {"error": "invalid_email"})
            return
        if not re.match(r"^[a-z0-9_]{3,64}$", product):
            self._json(400, {"error": "invalid_product"})
            return

        status = waitlist_insert(email, product, source, focus, page)
        if status not in (201, 204, 409):
            self._json(
                502,
                {"error": "waitlist_failed", "status": status},
            )
            return

        exp = int(time.time()) + TOKEN_TTL_SEC
        token = sign_token(email, product, exp)
        download_url = f"{PUBLIC_BASE}/leadmagnet/download?t={token}"
        self._json(
            200,
            {
                "download_url": download_url,
                "expires_at": exp,
                "already": status == 409,
            },
        )


def main() -> None:
    host = os.environ.get("LEADMAGNET_BIND", "127.0.0.1")
    port = int(os.environ.get("LEADMAGNET_PORT", "8791"))
    server = ThreadingHTTPServer((host, port), Handler)
    print(f"reeldemo-leadmagnet listening on {host}:{port}", flush=True)
    server.serve_forever()


if __name__ == "__main__":
    main()
