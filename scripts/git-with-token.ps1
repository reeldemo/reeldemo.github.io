# Run git or gh with GH_TOKEN from the shared reeldemo .env.local (no global git config).
param(
    [string]$EnvFile = "C:\Users\Julian\Documents\Programming\reeldemo.io\.env.local",
    [Parameter(ValueFromRemainingArguments = $true)]
    [string[]]$CommandArgs
)

$ErrorActionPreference = "Stop"

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

if ($CommandArgs.Count -eq 0) {
    Write-Error "Usage: git-with-token.ps1 <git|gh> <args...>"
    exit 1
}

$token = Get-GhTokenFromEnvFile -Path $EnvFile
$env:GITHUB_TOKEN = $token
$env:GH_TOKEN = $token

$tool = $CommandArgs[0]
$toolArgs = @()
if ($CommandArgs.Count -gt 1) {
    $toolArgs = $CommandArgs[1..($CommandArgs.Count - 1)]
}

if ($tool -eq "gh") {
    & gh @toolArgs
    exit $LASTEXITCODE
}

if ($tool -eq "git") {
    $header = "AUTHORIZATION: bearer $token"
    & git -c "http.https://github.com/.extraHeader=$header" @toolArgs
    exit $LASTEXITCODE
}

Write-Error "First argument must be 'git' or 'gh', got: $tool"
exit 1
