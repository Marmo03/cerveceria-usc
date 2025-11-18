@echo off
echo ========================================
echo  INICIANDO BACKEND CERVECERIA USC
echo ========================================
echo.
cd /d "%~dp0"
echo Directorio actual: %CD%
echo.
echo Iniciando servidor...
npx tsx src/server.ts
echo.
echo El servidor se ha detenido.
pause
