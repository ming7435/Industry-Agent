param(
    [Parameter(Position = 0)][ValidateSet('start', 'status', 'stop')][string]$Action = 'status',
    [string]$RuntimeRoot = '',
    [int]$WaitSeconds = 90
)

$ErrorActionPreference = 'Stop'
if (-not $RuntimeRoot) {
    # Windows PowerShell 5.1 在参数默认值求值时还未设置 PSScriptRoot。
    $RuntimeRoot = Join-Path (Split-Path $PSScriptRoot -Parent) '.runtime/freecad'
}
$runtimePath = [IO.Path]::GetFullPath($RuntimeRoot)
$statePath = Join-Path $runtimePath 'runtime-state.json'
$freecadExe = Join-Path $runtimePath 'bin/FreeCAD.exe'
$state = $null
$ownedProcess = $null
if (Test-Path -LiteralPath $statePath) {
    $state = Get-Content -Raw -LiteralPath $statePath | ConvertFrom-Json
    $candidate = Get-Process -Id $state.pid -ErrorAction SilentlyContinue
    if ($candidate) {
        $actualStart = $candidate.StartTime.ToUniversalTime().Ticks
        $savedStart = ([datetime]$state.start_time_utc).ToUniversalTime().Ticks
        if (($candidate.Path -ine $freecadExe) -or
            ($state.executable -ine $freecadExe) -or
            ($actualStart -ne $savedStart)) {
            throw 'Saved process identity does not match this FreeCAD installation; no process was stopped.'
        }
        $ownedProcess = $candidate
    }
}

function Test-OwnedRpcReady($Process) {
    if (-not $Process) { return $false }
    try {
        $readyPathForCheck = Join-Path $runtimePath 'rpc-ready.json'
        if (-not (Test-Path -LiteralPath $readyPathForCheck -PathType Leaf)) { return $false }
        $readyForCheck = Get-Content -Raw -LiteralPath $readyPathForCheck | ConvertFrom-Json
        if ($readyForCheck.pid -ne $Process.Id -or $readyForCheck.host -ne '127.0.0.1' -or $readyForCheck.port -ne 9875) { return $false }
        $listenerForCheck = Get-NetTCPConnection -LocalPort 9875 -State Listen -ErrorAction SilentlyContinue |
            Where-Object { $_.OwningProcess -eq $Process.Id -and $_.LocalAddress -eq '127.0.0.1' }
        if (-not $listenerForCheck) { return $false }
        # 只调用无写入、无 GUI 任务的状态接口，不以进程或端口存在冒充就绪。
        $statusResponse = Invoke-WebRequest -Uri 'http://127.0.0.1:9875' -UseBasicParsing -Method Post `
            -ContentType 'text/xml' -TimeoutSec 3 `
            -Body '<methodCall><methodName>get_rpc_status</methodName><params/></methodCall>'
        $statusXml = [xml]$statusResponse.Content
        $membersForCheck = $statusXml.methodResponse.params.param.value.struct.member
        $successForCheck = ($membersForCheck | Where-Object { $_.name -eq 'success' }).value.boolean
        $serverForCheck = ($membersForCheck | Where-Object { $_.name -eq 'rpc_server' }).value.string
        $guiForCheck = ($membersForCheck | Where-Object { $_.name -eq 'gui_dispatch' }).value.struct.member
        $guiStateForCheck = ($guiForCheck | Where-Object { $_.name -eq 'state' }).value.string
        return ($successForCheck -eq '1' -and $serverForCheck -eq 'running' -and $guiStateForCheck -in @('healthy', 'busy'))
    } catch { return $false }
}

if ($Action -eq 'status') {
    [ordered]@{ running = [bool]$ownedProcess; pid = $(if ($ownedProcess) { $ownedProcess.Id } else { $null });
        rpc_ready = [bool](Test-OwnedRpcReady $ownedProcess);
        rpc_url = 'http://127.0.0.1:9875'; runtime_root = $runtimePath } | ConvertTo-Json -Compress
    exit 0
}

if ($Action -eq 'stop') {
    if ($ownedProcess) {
        Stop-Process -InputObject $ownedProcess
        $ownedProcess.WaitForExit(10000) | Out-Null
        if (-not $ownedProcess.HasExited) { throw 'The owned FreeCAD process did not exit.' }
    }
    if (Test-Path -LiteralPath $statePath) { Remove-Item -LiteralPath $statePath }
    [ordered]@{ running = $false; stopped = [bool]$ownedProcess } | ConvertTo-Json -Compress
    exit 0
}

if (-not (Test-Path -LiteralPath $freecadExe -PathType Leaf)) {
    throw "Missing FreeCAD.exe: $freecadExe. See docs/freecad-local-setup.md."
}
if ($ownedProcess) {
    $existingRpcReady = Test-OwnedRpcReady $ownedProcess
    [ordered]@{ running = $true; rpc_ready = [bool]$existingRpcReady;
        pid = $ownedProcess.Id; already_started = $true } | ConvertTo-Json -Compress
    if ($existingRpcReady) { exit 0 }
    # 不强行终止可能仍执行任务的 GUI；明确要求核对并安全重启。
    Write-Error 'FreeCAD process is running but RPC is not ready; verify the process before stop/start.'
    exit 1
}
$addon = Join-Path $runtimePath 'Mod/FreeCADMCP/rpc_server/rpc_server.py'
if (-not (Test-Path -LiteralPath $addon)) { throw "Missing MCP addon: $addon" }
$existingListener = Get-NetTCPConnection -LocalPort 9875 -State Listen -ErrorAction SilentlyContinue
if ($existingListener) { throw 'Port 9875 is already in use; no existing process was changed.' }

$bootstrap = Join-Path $PSScriptRoot 'freecad_bootstrap.FCMacro'
$stdout = Join-Path $runtimePath 'stdout.log'
$stderr = Join-Path $runtimePath 'stderr.log'
$readyPath = Join-Path $runtimePath 'rpc-ready.json'
if (Test-Path -LiteralPath $readyPath) { Remove-Item -LiteralPath $readyPath }
$previousRuntime = $env:INDUSTRY_FREECAD_RUNTIME_DIR
try {
    $env:INDUSTRY_FREECAD_RUNTIME_DIR = $runtimePath
    $arguments = @('--user-cfg', ('"' + (Join-Path $runtimePath 'user.cfg') + '"'),
        '--system-cfg', ('"' + (Join-Path $runtimePath 'system.cfg') + '"'),
        ('"' + $bootstrap + '"'))
    $process = Start-Process -FilePath $freecadExe -ArgumentList $arguments -WorkingDirectory $runtimePath `
        -WindowStyle Hidden -RedirectStandardOutput $stdout -RedirectStandardError $stderr -PassThru
} finally {
    $env:INDUSTRY_FREECAD_RUNTIME_DIR = $previousRuntime
}
[ordered]@{ pid = $process.Id; executable = $freecadExe;
    start_time_utc = $process.StartTime.ToUniversalTime().ToString('o') } |
    ConvertTo-Json | Set-Content -LiteralPath $statePath -Encoding UTF8
$deadline = [DateTime]::UtcNow.AddSeconds($WaitSeconds)
while ([DateTime]::UtcNow -lt $deadline) {
    $process.Refresh()
    if ($process.HasExited) { throw "FreeCAD exited during startup. See $stderr" }
    if (Test-Path -LiteralPath $readyPath) {
        $ready = Get-Content -Raw -LiteralPath $readyPath | ConvertFrom-Json
        if ($ready.pid -eq $process.Id -and $ready.host -eq '127.0.0.1' -and $ready.port -eq 9875 -and (Test-OwnedRpcReady $process)) {
            [ordered]@{ running = $true; rpc_ready = $true; pid = $process.Id;
                host = '127.0.0.1'; port = 9875; freecad_version = $ready.freecad_version } | ConvertTo-Json -Compress
            exit 0
        }
    }
    Start-Sleep -Milliseconds 250
}
throw "FreeCAD did not confirm RPC readiness within $WaitSeconds seconds. See $stderr and $stdout."
