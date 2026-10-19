# Compatibility only. text-to-cad has no GUI/RPC process to start or stop.
param(
    [Parameter(Position = 0)][ValidateSet('start', 'status', 'stop')][string]$Action = 'status',
    [string]$RuntimeRoot = '',
    [int]$WaitSeconds = 90
)
$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path $PSScriptRoot -Parent
$cadPython = $env:CADGEN_PYTHON
if (-not $cadPython) { $cadPython = Join-Path $projectRoot '.venv/Scripts/python.exe' }
& $cadPython (Join-Path $PSScriptRoot 'text_to_cad_runtime.py') $Action
exit $LASTEXITCODE
