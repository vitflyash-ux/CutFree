# ✂ CutFree – gratis Video-Editor

**CutFree ist eine kostenlose CapCut-Kopie** – ein Video-Editor für Windows, der aussieht und funktioniert wie CapCut: mit automatischen Untertiteln, KI-Stimmen, Soundeffekten, über 130 Übergängen, Keyframes, Greenscreen und mehr. Läuft komplett auf deinem PC, ohne Konto und ohne Abo.

Gemacht von **[@vitifly auf TikTok](https://www.tiktok.com/@vitifly)** – folg mir für Updates! 🎬

> CutFree ist ein eigenständiges Hobby-Projekt und hat nichts mit CapCut oder ByteDance zu tun. „CapCut“ ist eine Marke von ByteDance.

## ⬇ Download

1. Rechts auf **Releases** klicken (oder [hier](../../releases/latest)).
2. **CutFree.exe** herunterladen und doppelklicken.
3. Falls Windows „Der Computer wurde durch Windows geschützt“ zeigt: **Weitere Informationen → Trotzdem ausführen** (die Datei ist nicht kostenpflichtig signiert).

Voraussetzung: Windows 10/11 mit Microsoft Edge (ist vorinstalliert).

## Funktionen

- **Timeline wie CapCut:** Teilen, Zuschneiden, Ziehen, Magnet, Marker, Spuren sperren, Rückgängig
- **Automatische Untertitel** (KI „Whisper“, läuft lokal) mit eigenen Styles und Karaoke-Wort-Hervorhebung
- **KI-Stimmen** aus Text (Kind, Monster, Roboter, Oma …) – vorher anhören
- **Soundeffekte** (Myinstants-Bibliothek mit Suche), Natur-Sounds, Beats, eigene Audios, Ton aus Videos
- **Über 130 Übergänge** (inkl. 123 Profi-Übergänge), Effekte, Filter, Animationen – alle mit Live-Vorschau
- **Keyframes** (Bewegung, Zoom, Drehung), **Greenscreen**, Masken, Zuschneiden, Füllmethoden
- **Lumetri-Farbkorrektur** mit fertigen Looks
- **Lautstärke- und Tonhöhen-Kurven** (Plattenspieler-Effekt: tiefer = langsamer)
- **Automatisches Speichern** – dein Projekt ist beim nächsten Start wieder da
- **Export als MP4**

## Wo werden Projekte gespeichert?

Automatisch auf **deinem PC** (im Programm-Speicher von CutFree unter `%LOCALAPPDATA%\CutFree`). Jeder PC hat sein eigenes Projekt. Es wird nichts in eine Cloud hochgeladen.

## Datenschutz

- Videos, Untertitel und Stimmen werden **lokal** verarbeitet.
- Internet wird nur gebraucht für: einmaligen Download der KI-Modelle (Hugging Face), Schriftarten (Google Fonts) und das Suchen/Laden von Soundeffekten (myinstants.com).
- Es gibt **keine API-Schlüssel oder Passwörter** im Programm.

## Selbst starten / bauen (für Entwickler)

```
python server.py          # startet den Editor im Browser
EXE_NEU_BAUEN.bat         # baut CutFree.exe (braucht Python + PyInstaller)
```

Ein neues Release mit .exe entsteht automatisch, wenn ein Tag wie `v1.0.0` gepusht wird (siehe `.github/workflows/build.yml`).

## Drittanbieter

Siehe [THIRD_PARTY.md](THIRD_PARTY.md).
