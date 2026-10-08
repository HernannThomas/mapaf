@echo off
title Detener Microservicios SCADA
echo ======================================================================
echo   Deteniendo Microservicios SCADA SPS-01 en puertos 8000-8004...
echo ======================================================================

for %%P in (8000 8001 8002 8003 8004) do (
    for /f "tokens=5" %%a in ('netstat -aon ^| findstr :%%P ^| findstr LISTENING') do (
        echo Cerrando proceso PID %%a en puerto %%P...
        taskkill /F /PID %%a >nul 2>nul
    )
)

echo.
echo [OK] Todos los microservicios han sido detenidos.
pause
