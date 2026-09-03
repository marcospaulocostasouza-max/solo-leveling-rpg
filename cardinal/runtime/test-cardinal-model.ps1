$ErrorActionPreference = 'Stop'
$cardinalRoot = Resolve-Path (Join-Path $PSScriptRoot '..')
$config = Get-Content -LiteralPath (Join-Path $cardinalRoot 'config\model.json') -Raw | ConvertFrom-Json
$baseUrl = "http://$($config.host):$($config.port)"
$health = Invoke-RestMethod -Uri "$baseUrl/health" -TimeoutSec 5
Write-Host "[CARDINAL] Health: $($health | ConvertTo-Json -Compress)"
node (Join-Path $cardinalRoot 'runtime\cardinal-cli.js') 'Quem é você? Responda em uma frase.'
