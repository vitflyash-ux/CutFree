@echo off
cd /d "%~dp0"
title CutFree - dieses Fenster offen lassen
python server.py
echo.
echo Der Editor wurde beendet oder konnte nicht starten (siehe Meldung oben).
pause
