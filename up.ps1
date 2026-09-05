# up.ps1 — Inicia backend e frontend em segundo plano no Windows PowerShell
$backendPort = if ($env:BACKEND_PORT) { $env:BACKEND_PORT } else { 8000 }
$frontendPort = if ($env:FRONTEND_PORT) { $env:FRONTEND_PORT } else { 3000 }

Write-Host "▶ Subindo backend na porta $backendPort..." -ForegroundColor Cyan
$backendProc = Start-Process -FilePath ".\backend\.venv\Scripts\python.exe" -ArgumentList "manage.py runserver $backendPort" -WorkingDirectory ".\backend" -PassThru -WindowStyle Hidden

Write-Host "▶ Subindo frontend na porta $frontendPort..." -ForegroundColor Cyan
$frontendProc = Start-Process -FilePath "npm.cmd" -ArgumentList "run dev -- --port $frontendPort" -WorkingDirectory ".\frontend" -PassThru -WindowStyle Hidden

New-Item -ItemType Directory -Force -Path ".pids" | Out-Null
$backendProc.Id | Out-File -FilePath ".pids\backend.pid" -Encoding ascii
$frontendProc.Id | Out-File -FilePath ".pids\frontend.pid" -Encoding ascii

Write-Host ""
Write-Host "✅ Serviços iniciados com sucesso:" -ForegroundColor Green
Write-Host "   Backend  → http://localhost:$backendPort (PID $($backendProc.Id))" -ForegroundColor Green
Write-Host "   Frontend → http://localhost:$frontendPort (PID $($frontendProc.Id))" -ForegroundColor Green
Write-Host ""
Write-Host "   Para parar: .\down.ps1" -ForegroundColor Yellow
