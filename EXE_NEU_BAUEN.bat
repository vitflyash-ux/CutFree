@echo off
rem Baut CutFree.exe neu (nötig, wenn der Editor geändert wurde)
cd /d "%~dp0"
python -m pip install --user --quiet pyinstaller
python -m PyInstaller --noconfirm --onefile --windowed --name CutFree --icon icon.ico --distpath . --workpath "%TEMP%\cutfree-build" --specpath "%TEMP%\cutfree-build" ^
  --add-data "%~dp0index.html;." --add-data "%~dp0style.css;." --add-data "%~dp0app.js;." --add-data "%~dp0sfx.js;." ^
  --add-data "%~dp0ai.js;." --add-data "%~dp0gl.js;." --add-data "%~dp0gl-transitions.json;." server.py
echo.
echo Fertig: CutFree.exe
pause
