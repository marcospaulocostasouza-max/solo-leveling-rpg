param(
    [int]$GpuLayers = 20,
    [int]$ContextSize = 16384,
    [switch]$Background
)

$ErrorActionPreference = 'Stop'
$cardinalRoot = Resolve-Path (Join-Path $PSScriptRoot '..')
$projectRoot = Resolve-Path (Join-Path $cardinalRoot '..')
$config = Get-Content -LiteralPath (Join-Path $cardinalRoot 'config\model.json') -Raw | ConvertFrom-Json
$serverLocal = Join-Path $PSScriptRoot 'llama.cpp\llama-server.exe'
$serverCommand = Get-Command llama-server -ErrorAction SilentlyContinue
$server = if (Test-Path -LiteralPath $serverLocal) { $serverLocal } elseif ($serverCommand) { $serverCommand.Source } else { throw 'llama-server não foi encontrado. Defina-o no PATH ou em cardinal/runtime/llama.cpp/.' }

$model = $env:CARDINAL_MODEL_PATH
if (!$model -and $config.model_path) { $model = Join-Path $projectRoot $config.model_path }
if (!$model) {
    $cacheRoot = Join-Path $env:USERPROFILE '.cache\huggingface\hub\models--openresearchtools--Qwen3.5-4B-Instruct-GGUF\snapshots'
    $model = Get-ChildItem -LiteralPath $cacheRoot -Recurse -Filter '*Q4_K_M.gguf' -ErrorAction SilentlyContinue | Select-Object -First 1 -ExpandProperty FullName
}
if (!$model -or !(Test-Path -LiteralPath $model)) { throw 'Qwen3.5-4B-Instruct Q4_K_M não foi encontrado. Defina CARDINAL_MODEL_PATH para o GGUF já instalado.' }

$arguments = @('-m', $model, '--no-mmproj', '-c', $ContextSize, '-ngl', $GpuLayers, '--host', $config.host, '--port', $config.port)
Write-Host "[CARDINAL] Runtime: $server"
Write-Host "[CARDINAL] Modelo: $model"
Write-Host "[CARDINAL] API local: http://$($config.host):$($config.port) | contexto=$ContextSize | gpu_layers=$GpuLayers"
if ($Background) {
    $log = Join-Path $cardinalRoot 'logs\llama-server.log'
    $errorLog = Join-Path $cardinalRoot 'logs\llama-server-error.log'
    $process = Start-Process -FilePath $server -ArgumentList $arguments -WorkingDirectory $projectRoot -WindowStyle Hidden -RedirectStandardOutput $log -RedirectStandardError $errorLog -PassThru
    Set-Content -LiteralPath (Join-Path $cardinalRoot 'runtime\llama-server.pid') -Value $process.Id
    Write-Host "[CARDINAL] Servidor iniciado em segundo plano (PID $($process.Id))."
    return
}
& $server @arguments
