@echo off
setlocal
title CodeLab Academy - LAN Server
powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\start-lan.ps1" %*
set "LAN_EXIT=%ERRORLEVEL%"
if not "%LAN_EXIT%"=="0" (
    echo.
    echo CodeLab could not start. Read the message above.
    pause
)
endlocal & exit /b %LAN_EXIT%
