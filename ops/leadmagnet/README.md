# Token-gated Genre Tables lead magnet

Zip lives on blackpearl at `/var/lib/reeldemo-leadmagnet/` (not GitHub).
Email claim + short-lived download URL is served under `https://supabase.reeldemo.io/leadmagnet/`.

## Deploy (blackpearl)

```bash
sudo mkdir -p /opt/reeldemo-leadmagnet /etc/reeldemo-leadmagnet /var/lib/reeldemo-leadmagnet
sudo cp ops/leadmagnet/server.py /opt/reeldemo-leadmagnet/server.py
sudo cp ops/leadmagnet/reeldemo-leadmagnet.service /etc/systemd/system/
# Create /etc/reeldemo-leadmagnet/env from env.example (HMAC + anon key)
sudo cp ops/leadmagnet/nginx-reeldemo-supabase.conf /etc/nginx/gitlab-edge/
sudo cp ops/leadmagnet/nginx-reeldemo-supabase-http.conf /etc/nginx/gitlab-edge/
# Ensure both confs are included from nginx.conf, then:
sudo nginx -t -c /etc/nginx/gitlab-edge/nginx.conf
sudo systemctl daemon-reload
sudo systemctl enable --now reeldemo-leadmagnet
sudo systemctl reload nginx-gitlab-edge
```

## API

- `POST /leadmagnet/claim` JSON `{email, product, source?, focus?, page?}` → `{download_url, expires_at, already}`
- `GET /leadmagnet/download?t=...` → `X-Accel-Redirect` to the zip
