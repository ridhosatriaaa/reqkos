@echo off
title Roome - Rekomendasi Kost Server Runner
echo ==============================================
echo   Menjalankan Backend Python dan Frontend Vite
echo ==============================================

cd /d "%~dp0"

echo 1. Memulai Server Backend Python (Port 8000)...
start "Backend Python API" cmd /k ".\\.venv\\Scripts\\python.exe app.py --mode api"

timeout /t 2 >nul

echo 2. Memulai Server Frontend Vite (Port 5173)...
cd /d "%~dp0frontend"
set npm_config_cache=D:\npm-cache
start "Frontend Vite" cmd /k "npm run dev"

echo ==============================================
echo Server aktif!
echo Backend : http://localhost:8000
echo Frontend: http://localhost:5173
echo ==============================================
pause
