@echo off
setlocal
title CodeLab Academy - Stop LAN Server
powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\start-lan.ps1" -Stop
set "LAN_EXIT=%ERRORLEVEL%"
if not "%LAN_EXIT%"=="0" pause
endlocal & exit /b %LAN_EXIT%
