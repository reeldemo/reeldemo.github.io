# Development

## Git authentication

All reeldemo GitHub org repos use a shared personal access token stored locally (never committed).

1. Create `C:\Users\Julian\Documents\Programming\reeldemo.io\.env.local`
2. Add one line: `GH_TOKEN=<your-github-pat>`

The token needs `repo` scope for private repos, or `public_repo` for public-only work.

### Helper scripts

From this repo (or any repo that ships the same `scripts/` wrappers):

```powershell
# Generic git/gh wrapper (no global git config changes)
.\scripts\git-with-token.ps1 git fetch
.\scripts\git-with-token.ps1 git push origin main
.\scripts\git-with-token.ps1 gh pr list

# Shortcuts
.\scripts\push.ps1 origin main
.\scripts\pull.ps1 origin main
```

Other clones under `C:\Users\Julian\Documents\Programming\github\reeldemo\` include thin wrappers that call the shared `.env.local` path above.

Auth is applied per command via `http.https://github.com/.extraHeader` — nothing is written to global or repo `git config`.
