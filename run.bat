@echo off
setlocal enabledelayedexpansion
title SCADA Separador SPS-01 - Microservicios Python

echo ======================================================================
echo   SISTEMA SCADA SEPARADOR DE PRUEBA SPS-01 — SENA CIES
echo   Arquitectura de Microservicios Desacoplados (Python)
echo ======================================================================
echo.

:: Detectar ejecutable de Python
set "PYTHON_CMD="

:: 1. Verificar si existe el Python portable configurado
if exist "C:\Users\Hernann thomas\python311\python.exe" (
    set "PYTHON_CMD=C:\Users\Hernann thomas\python311\python.exe"
) else (
    where python >nul 2>nul
    if !errorlevel! equ 0 (
        set "PYTHON_CMD=python"
    ) else (
        where py >nul 2>nul
        if !errorlevel! equ 0 (
            set "PYTHON_CMD=py"
        )
    )
)

if "%PYTHON_CMD%"=="" (
    echo [ERROR] No se encontro Python instalado.
    echo Asegurese de contar con Python 3.10+ en el sistema.
    pause
    exit /b 1
)

echo [OK] Utilizando interprete Python: %PYTHON_CMD%
echo.
echo Iniciando orquestador de microservicios:
echo   - Microservicio Telemetria    : Puerto 8001
echo   - Microservicio Produccion    : Puerto 8002
echo   - Microservicio Alertas       : Puerto 8003
echo   - Microservicio Equipos/Assets: Puerto 8004
echo   - API Gateway y Dashboard HMI : Puerto 8000
echo.

"%PYTHON_CMD%" run_microservices.py

endlocal
