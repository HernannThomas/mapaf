@echo off
setlocal enabledelayedexpansion
title SCADA SENA-CIES — Deploy a XAMPP

echo ======================================================================
echo   SCADA SEPARADOR SPS-01 — DESPLIEGUE A XAMPP
echo   Construye la app React y la copia a htdocs de XAMPP
echo ======================================================================
echo.

:: ─── Configuracion ────────────────────────────────────────────────────
:: Ruta raiz de XAMPP (cambiar si instalaste XAMPP en otra ubicacion)
set "XAMPP_ROOT=C:\xampp"
set "HTDOCS=%XAMPP_ROOT%\htdocs"
set "DEPLOY_DIR=%HTDOCS%\scada"

:: Directorio del proyecto (donde esta este script)
set "PROJECT_DIR=%~dp0.."

:: ─── Verificar que XAMPP este instalado ───────────────────────────────
if not exist "%HTDOCS%" (
    echo [ERROR] No se encontro XAMPP en: %XAMPP_ROOT%
    echo.
    echo   Opciones:
    echo   1. Instala XAMPP desde https://www.apachefriends.org/
    echo   2. O edita la variable XAMPP_ROOT en este script
    echo      para apuntar a tu instalacion de XAMPP.
    echo.
    pause
    exit /b 1
)

echo [OK] XAMPP encontrado en: %XAMPP_ROOT%
echo.

:: ─── Verificar Node.js ───────────────────────────────────────────────
where node >nul 2>nul
if !errorlevel! neq 0 (
    echo [ERROR] Node.js no esta instalado o no esta en el PATH.
    echo   Descargalo desde: https://nodejs.org/
    pause
    exit /b 1
)

for /f "tokens=*" %%v in ('node --version') do set NODE_VER=%%v
echo [OK] Node.js: %NODE_VER%

:: ─── Instalar dependencias si hace falta ─────────────────────────────
if not exist "%PROJECT_DIR%\node_modules" (
    echo [INFO] Instalando dependencias npm...
    pushd "%PROJECT_DIR%"
    call npm install
    popd
    if !errorlevel! neq 0 (
        echo [ERROR] Fallo npm install.
        pause
        exit /b 1
    )
)

:: ─── Build de produccion con Vite ────────────────────────────────────
echo.
echo [INFO] Construyendo la app React para XAMPP...
echo        (Esto puede tardar 30-60 segundos)
echo.

pushd "%PROJECT_DIR%"
set "DEPLOY_TARGET=xampp"
call npm run build
set BUILD_CODE=!errorlevel!
popd

if !BUILD_CODE! neq 0 (
    echo.
    echo [ERROR] El build fallo. Revisa los errores de TypeScript/Vite arriba.
    pause
    exit /b 1
)

echo.
echo [OK] Build completado en: %PROJECT_DIR%\dist
echo.

:: ─── Crear carpeta de despliegue ──────────────────────────────────────
if not exist "%DEPLOY_DIR%" (
    echo [INFO] Creando directorio: %DEPLOY_DIR%
    mkdir "%DEPLOY_DIR%"
)

:: ─── Copiar archivos del build ────────────────────────────────────────
echo [INFO] Copiando archivos del build a: %DEPLOY_DIR%
xcopy /E /I /Y "%PROJECT_DIR%\dist\*" "%DEPLOY_DIR%\" >nul
if !errorlevel! neq 0 (
    echo [ERROR] No se pudo copiar los archivos. Verifica permisos.
    pause
    exit /b 1
)
echo [OK] Archivos del build copiados.

:: ─── Copiar archivos de integracion XAMPP ────────────────────────────
echo [INFO] Copiando proxy PHP y configuracion de Apache...
copy /Y "%PROJECT_DIR%\xampp\api_proxy.php" "%DEPLOY_DIR%\api_proxy.php" >nul
copy /Y "%PROJECT_DIR%\xampp\.htaccess"     "%DEPLOY_DIR%\.htaccess"     >nul
echo [OK] api_proxy.php y .htaccess copiados.

:: ─── Verificar que Apache esta corriendo ─────────────────────────────
echo.
tasklist /FI "IMAGENAME eq httpd.exe" 2>nul | find /I "httpd.exe" >nul
if !errorlevel! equ 0 (
    echo [OK] Apache esta corriendo.
) else (
    echo [AVISO] Apache no parece estar corriendo.
    echo   Abre XAMPP Control Panel e inicia Apache antes de continuar.
)

:: ─── Resumen final ────────────────────────────────────────────────────
echo.
echo ======================================================================
echo   DESPLIEGUE COMPLETADO
echo ======================================================================
echo.
echo   URL de la aplicacion:  http://localhost/scada/
echo.
echo   IMPORTANTE: Los microservicios Python deben estar corriendo.
echo   Para iniciarlos ejecuta:  run.bat
echo.
echo   Flujo de datos:
echo     Navegador  -^>  Apache:80/scada  -^>  api_proxy.php  -^>  Python:8000
echo.
echo ======================================================================

:: Preguntar si abrir el navegador
set /p OPEN_BROWSER="Abrir http://localhost/scada/ en el navegador? (S/N): "
if /I "!OPEN_BROWSER!"=="S" (
    start "" "http://localhost/scada/"
)

endlocal
pause
