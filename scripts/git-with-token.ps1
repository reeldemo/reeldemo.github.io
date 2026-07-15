# Run git or gh with GH_TOKEN from the shared reeldemo .env.local (no global git config).
# Optional: set REELDEMO_ENV_FILE to override the default .env.local path.

$ErrorActionPreference = "Stop"

$DefaultEnvFile = "C:\Users\Julian\Documents\Programming\reeldemo.io\.env.local"
$EnvFile = if ($env:REELDEMO_ENV_FILE) { $env:REELDEMO_ENV_FILE } else { $DefaultEnvFile }

function Get-GhTokenFromEnvFile {
    param([string]$Path)

    if (-not (Test-Path -LiteralPath $Path)) {
        throw "Env file not found: $Path"
    }

    foreach ($line in Get-Content -LiteralPath $Path) {
        if ($line -match '^\s*GH_TOKEN\s*=\s*(.+)\s*$') {
            return $Matches[1].Trim().Trim('"').Trim("'")
        }
    }

    throw "GH_TOKEN not found in $Path"
}

if ($args.Count -eq 0) {
    Write-Error "Usage: git-with-token.ps1 <git|gh> <args...>"
    exit 1
}

$token = Get-GhTokenFromEnvFile -Path $EnvFile
$env:GITHUB_TOKEN = $token
$env:GH_TOKEN = $token

$tool = $args[0]
$toolArgs = @()
if ($args.Count -gt 1) {
    $toolArgs = $args[1..($args.Count - 1)]
}

if ($tool -eq "gh") {
    & gh @toolArgs
    exit $LASTEXITCODE
}

if ($tool -eq "git") {
    $env:GIT_TERMINAL_PROMPT = "0"
    $insteadOf = "url.https://x-access-token:$token@github.com/.insteadOf=https://github.com/"
    & git -c credential.helper= -c credential.https://github.com.helper= -c $insteadOf @toolArgs
    exit $LASTEXITCODE
}

Write-Error "First argument must be 'git' or 'gh', got: $tool"
exit 1
