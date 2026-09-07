# down.ps1 — Encerra os processos do backend e frontend no Windows PowerShell
if (Test-Path ".pids\backend.pid") {
    $backendPid = Get-Content ".pids\backend.pid" -Raw
    $backendPid = $backendPid.Trim()
    if ($backendPid) {
        Write-Host "⏹ Parando backend (PID $backendPid)..." -ForegroundColor Yellow
        Stop-Process -Id ([int]$backendPid) -Force -ErrorAction SilentlyContinue
    }
}

if (Test-Path ".pids\frontend.pid") {
    $frontendPid = Get-Content ".pids\frontend.pid" -Raw
    $frontendPid = $frontendPid.Trim()
    if ($frontendPid) {
        Write-Host "⏹ Parando frontend (PID $frontendPid)..." -ForegroundColor Yellow
        Stop-Process -Id ([int]$frontendPid) -Force -ErrorAction SilentlyContinue
    }
}

# Limpa processos que possam ter ficado presos nas portas 8000 e 3000
$ports = @(8000, 3000)
foreach ($port in $ports) {
    $conns = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
    if ($conns) {
        foreach ($conn in $conns) {
            Stop-Process -Id $conn.OwningProcess -Force -ErrorAction SilentlyContinue
        }
    }
}

Remove-Item -Recurse -Force ".pids" -ErrorAction SilentlyContinue
Write-Host "✅ Serviços parados." -ForegroundColor Green
