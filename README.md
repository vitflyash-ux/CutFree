# âœ‚ CutFree â€“ free video editor

**CutFree is a free CapCut copy** â€“ a video editor for Windows that looks and works like CapCut: automatic subtitles, AI voices, sound effects, 130+ transitions, keyframes, green screen and more. It runs entirely on your PC â€“ no account, no subscription.

Made by **[@vitifly on TikTok](https://www.tiktok.com/@vitifly)** â€“ follow me for updates! ðŸŽ¬

> CutFree is an independent hobby project and is not affiliated with CapCut or ByteDance. "CapCut" is a trademark of ByteDance.

## â¬‡ Download

1. Click **Releases** on the right (or [here](../../releases/latest)).
2. Download **CutFree.exe** and double-click it.
3. If Windows shows "Windows protected your PC": click **More info â†’ Run anyway** (the file is not code-signed, which costs money).

Requirements: Windows 10/11 with Microsoft Edge (pre-installed).

> Note: the editor's interface is currently in German.

## Features

- **CapCut-style timeline:** split, trim, drag, snapping, markers, track lock, undo/redo
- **Automatic subtitles** (AI "Whisper", runs locally) with your own styles and karaoke word highlighting
- **AI text-to-speech voices** (kid, monster, robot, grandma â€¦) â€“ preview before inserting
- **Sound effects** (Myinstants library with search), nature sounds, beats, your own audio, audio from videos
- **130+ transitions** (including 123 pro transitions), effects, filters, animations â€“ all with live previews
- **Keyframes** (position, zoom, rotation), **green screen**, masks, crop, blend modes
- **Lumetri-style color grading** with ready-made looks
- **Volume and pitch curves** (turntable effect: lower pitch = slower video)
- **Auto-save** â€“ your project is back the next time you open the app
- **MP4 export**

## Where are projects saved?

Automatically on **your PC** (in CutFree's app storage under `%LOCALAPPDATA%\CutFree`). Every PC keeps its own project. Nothing is uploaded to a cloud.

## Privacy

- Videos, subtitles and voices are processed **locally**.
- Internet is only needed for: the one-time download of the AI models (Hugging Face), fonts (Google Fonts) and searching/loading sound effects (myinstants.com).
- There are **no API keys or passwords** in the app.

## Run or build it yourself (for developers)

```
python server.py          # starts the editor in your browser
BUILD_EXE.bat             # builds CutFree.exe (needs Python + PyInstaller)
```

A new release with the .exe is built automatically when a tag like `v1.0.0` is pushed (see `.github/workflows/build.yml`).

## Third-party software

See [THIRD_PARTY.md](THIRD_PARTY.md).
