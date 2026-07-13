# Custom domain: reeldemo.io → GitHub Pages

This site is published from [reeldemo/reeldemo.github.io](https://github.com/reeldemo/reeldemo.github.io) via GitHub Pages. The apex domain is wired through the repo `CNAME` file and registrar DNS.

## Current DNS (verified 2026-07-13)

```bash
dig reeldemo.io +short
# 185.199.108.153
# 185.199.109.153
# 185.199.110.153
# 185.199.111.153

dig www.reeldemo.io +short
# reeldemo.github.io.
# (same four GitHub Pages A records)
```

**Status:** Apex and `www` both resolve to GitHub Pages. HTTPS works; `https://reeldemo.io` redirects to `https://www.reeldemo.io`.

Quick smoke test:

```bash
curl -sI https://reeldemo.io/kaleidoscope/samples/neon-city.jpg | grep -E 'HTTP|location'
curl -sL -o /dev/null -w "%{http_code}\n" https://reeldemo.github.io/kaleidoscope/samples/neon-city.jpg
# expect 200
```

## Registrar setup (if changing DNS)

### Apex (`reeldemo.io`)

Add **four A records** pointing at GitHub Pages:

| Type | Name | Value |
|------|------|-------|
| A | `@` | `185.199.108.153` |
| A | `@` | `185.199.109.153` |
| A | `@` | `185.199.110.153` |
| A | `@` | `185.199.111.153` |

### `www` (recommended)

| Type | Name | Value |
|------|------|-------|
| CNAME | `www` | `reeldemo.github.io` |

Do **not** remove existing records for other subdomains (see below).

## GitHub Pages settings

1. Repo → **Settings** → **Pages**
2. Source: deploy from `main` branch (root).
3. **Custom domain:** `reeldemo.io` (matches [`CNAME`](../CNAME) in this repo).
4. Enable **Enforce HTTPS** once DNS has propagated and GitHub shows the domain as verified.

## Repo `CNAME` file

[`CNAME`](../CNAME) must contain exactly:

```
reeldemo.io
```

Commit to `main`; GitHub Pages serves it on each deploy.

## Subdomain conflicts

Other services may use subdomains of `reeldemo.io`. **Do not** point a wildcard `*` at GitHub Pages unless you intend every subdomain to serve this static site.

Before editing apex/`www` records, list existing DNS:

```bash
dig reeldemo.io ANY +short
# or check your registrar's DNS panel
```

Examples of records to **leave alone** (if present): `supabase.reeldemo.io`, `api.reeldemo.io`, mail (`MX`), or any app-specific CNAMEs. Only the apex A records and optional `www` CNAME should target GitHub Pages for this site.

## Verification checklist

After DNS or Pages changes (allow up to ~24h for propagation):

```bash
dig reeldemo.io +short
dig www.reeldemo.io +short
curl -sI https://reeldemo.io/ | grep -E 'HTTP|location'
curl -sL -o /dev/null -w "%{http_code}\n" https://www.reeldemo.io/kaleidoscope/#demo
```

In GitHub: Pages settings should show **DNS check successful** and a valid TLS certificate.

## Related

- [GitHub: Managing a custom domain for your GitHub Pages site](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site)
