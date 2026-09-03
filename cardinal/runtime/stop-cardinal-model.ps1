$ErrorActionPreference = 'Stop'
$pidFile = Join-Path $PSScriptRoot 'llama-server.pid'
if (!(Test-Path -LiteralPath $pidFile)) { Write-Host '[CARDINAL] Nenhum PID de servidor gerenciado foi encontrado.'; exit 0 }
$serverPid = [int](Get-Content -LiteralPath $pidFile -Raw).Trim()
$process = Get-Process -Id $serverPid -ErrorAction SilentlyContinue
if ($process -and $process.ProcessName -match '^llama-(server|server-impl)$') {
    Stop-Process -Id $serverPid
    Write-Host "[CARDINAL] Servidor PID $serverPid encerrado."
} else { Write-Host '[CARDINAL] O processo registrado não está mais ativo; nenhum processo foi encerrado.' }
Remove-Item -LiteralPath $pidFile -ErrorAction SilentlyContinue
