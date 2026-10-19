/* CutFree – language switch (German / English).
   The editor is written in German. In English mode this layer translates every text in the page
   (text nodes, tooltips, placeholders, dialogs) on the fly, including everything added later. */
(function () {
  let lang = null;
  try { lang = localStorage.getItem('cutfree.lang'); } catch { }
  if (lang !== 'de' && lang !== 'en') lang = (navigator.language || 'en').toLowerCase().startsWith('de') ? 'de' : 'en';

  // Exact texts (compared after trimming and collapsing spaces)
  const D = {
    // Top bar, panels, toolbar
    'Medien': 'Media', 'Audio': 'Audio', 'Text': 'Text', 'Sticker': 'Stickers', 'Untertitel': 'Captions', 'Stimme': 'Voice', 'Effekte': 'Effects', 'Filter': 'Filters', 'Übergänge': 'Transitions',
    'Player': 'Player', 'Eigenschaften': 'Properties', '⬇ Exportieren': '⬇ Export', '＋ Neu': '＋ New', '✂ Teilen': '✂ Split', '⇤ Links weg': '⇤ Delete left', 'Rechts weg ⇥': 'Delete right ⇥',
    'Magnet': 'Snap', 'Lücken schließen': 'Close gaps', '〰 Kurve: Lautstärke': '〰 Curve: volume', '🎵 Kurve: Tonhöhe': '🎵 Curve: pitch',
    '9:16 (TikTok / Reels)': '9:16 (TikTok / Reels)', '16:9 (YouTube)': '16:9 (YouTube)', '1:1 (Quadrat)': '1:1 (Square)', '4:5 (Instagram)': '4:5 (Instagram)',
    'Hintergrund: Schwarz': 'Background: black', 'Hintergrund: Unschärfe': 'Background: blur', 'Hintergrund: Weiß': 'Background: white',
    'Videos, Bilder oder Audio hier reinziehen': 'Drop videos, images or audio here', '✓ Gespeichert': '✓ Saved', '⚠ Nicht gespeichert': '⚠ Not saved',
    '🎵 Tonhöhe wird berechnet…': '🎵 Calculating pitch…', '✓ Tonhöhe fertig': '✓ Pitch ready', 'Hauptspur': 'Main track', 'Overlay': 'Overlay',
    '⬅ Importiere links Medien und klicke auf ＋ – oder zieh Dateien direkt hierher.': '⬅ Import media on the left and click ＋ – or drag files straight here.',
    // Export dialog
    'Video exportieren': 'Export video', 'Dateiname': 'File name', 'Qualität': 'Quality', 'Normal (4 Mbit/s)': 'Normal (4 Mbit/s)', 'Hoch (8 Mbit/s)': 'High (8 Mbit/s)', 'Sehr hoch (16 Mbit/s)': 'Very high (16 Mbit/s)',
    'Bilder pro Sekunde': 'Frames per second', 'Ton während Export stumm': 'Mute sound during export', 'Abbrechen': 'Cancel', 'Export starten': 'Start export',
    'Export läuft in Echtzeit (ein 30-Sekunden-Video braucht ca. 30 Sekunden). Format: MP4, falls dein Browser es kann, sonst WebM.': 'Export runs in real time (a 30-second video takes about 30 seconds). Format: MP4 if your browser supports it, otherwise WebM.',
    // Empty properties panel
    'Wähle einen Clip in der Timeline aus,': 'Select a clip in the timeline', 'um ihn zu bearbeiten.': 'to edit it.', 'Tastenkürzel': 'Keyboard shortcuts', 'Leertaste · Abspielen': 'Space · Play',
    'S · Teilen Q/W · Links/Rechts weg': 'S · Split Q/W · Delete left/right', 'Entf · Löschen Strg+D · Duplizieren': 'Del · Delete Ctrl+D · Duplicate', 'Strg+Z / Strg+Y · Rückgängig': 'Ctrl+Z / Ctrl+Y · Undo',
    '← → · Bild für Bild': '← → · Frame by frame', 'Strg+Mausrad · Timeline zoomen': 'Ctrl+Wheel · Zoom timeline',
    // Media / audio library
    '＋ Importieren': '＋ Import', 'Video, Foto oder Audio – oder einfach reinziehen': 'Video, photo or audio – or just drag it in',
    'Noch keine Medien. Tipp: Klicke auf ＋ bei einem Clip, um ihn ans Ende der Hauptspur zu setzen.': 'No media yet. Tip: click ＋ on a clip to add it to the timeline.',
    '🔥 Soundeffects': '🔥 Sound effects', '📁 Meine Audios': '📁 My audio', 'Beats': 'Beats', 'Natur': 'Nature', 'Lustig (eigene)': 'Funny (built-in)', 'Lustig': 'Funny', 'Musik': 'Music',
    '＋ Audio importieren': '＋ Import audio', 'MP3, WAV, M4A … – oder ein Video, um nur den Ton zu nehmen': 'MP3, WAV, M4A … – or a video to use only its sound',
    'Songs von Spotify lassen sich nicht direkt einbauen (Kopierschutz). Wenn du einen Song als MP3-Datei hast, zieh ihn einfach hier rein.': 'Spotify songs can\'t be added directly (copy protection). If you have a song as an MP3 file, just drag it in here.',
    'Deine Dateien': 'Your files', '＋ Ton': '＋ Sound', 'Lizenzfreie Beats zum direkt Benutzen. Eigene Songs (MP3) gehen über „Meine Audios“.': 'Royalty-free beats ready to use. Your own songs (MP3) go under "My audio".',
    'Suchen: bruh, fart, vine boom …': 'Search: bruh, fart, vine boom …', 'Mehr laden': 'Load more', 'Lade Sounds…': 'Loading sounds…', 'Keine Sounds gefunden.': 'No sounds found.', '＋ Einfügen': '＋ Insert',
    '🔥 Trends (USA)': '🔥 Trending (USA)', 'Soundeffekte': 'Sound effects', 'Memes': 'Memes', 'Reaktionen': 'Reactions', 'TikTok-Trends': 'TikTok trends', 'Viral': 'Viral', 'Pranks': 'Pranks', 'Games': 'Games',
    'Filme': 'Movies', 'TV': 'TV', 'Anime & Manga': 'Anime & Manga', 'Sport': 'Sports', 'WhatsApp-Audios': 'WhatsApp audios', 'Politik': 'Politics',
    'Soundeffects nicht erreichbar. Starte den Editor über START.bat (Internet nötig).': 'Sound effects unavailable. Start the editor with CutFree.exe or START.bat (internet required).',
    'Du hast index.html direkt geöffnet – so gehen die Soundeffects nicht. Schließe den Tab und starte den Editor mit Doppelklick auf START.bat.': 'You opened index.html directly – sound effects don\'t work that way. Close the tab and start the editor by double-clicking START.bat.',
    // Built-in sounds
    'Regen': 'Rain', 'Gewitter': 'Thunderstorm', 'Wind': 'Wind', 'Meereswellen': 'Ocean waves', 'Lagerfeuer': 'Campfire', 'Vögel': 'Birds', 'Herzschlag': 'Heartbeat', 'Uhr tickt': 'Clock ticking', 'Applaus': 'Applause',
    'Furz (kurz)': 'Fart (short)', 'Furz (lang)': 'Fart (long)', 'Furz (nass)': 'Fart (wet)', 'Furz-Serie': 'Fart series', 'Rülpser': 'Burp', 'Doppel-Rülpser': 'Double burp', 'Quietschen': 'Squeak',
    'Pfeife hoch': 'Slide whistle up', 'Pfeife runter': 'Slide whistle down', 'Cartoon-Rennen': 'Cartoon run', 'Feder': 'Spring', 'Trommelwirbel': 'Drum roll', 'Klick': 'Click',
    'Benachrichtigung': 'Notification', 'Kasse': 'Cash register', 'Kamera': 'Camera', 'Spannung': 'Suspense',
    // Text & stickers
    '＋ Text hinzufügen': '＋ Add text', 'Klick auf einen Style = neuer Text am Abspielkopf. Ist ein Text ausgewählt, wird der Style darauf angewendet.': 'Click a style = new text at the playhead. If a text is selected, the style is applied to it.',
    'Meine Styles': 'My styles', 'Vorlagen': 'Templates', 'Klassisch': 'Classic', 'Kino': 'Cinema', 'Feuer': 'Fire', 'Schreibmaschine': 'Typewriter', 'Pastell': 'Pastel', 'Gelbe Box': 'Yellow box',
    'Klick = Sticker am Abspielkopf einfügen. Danach im Player verschieben (ziehen) und mit dem Mausrad größer/kleiner machen.': 'Click = insert sticker at the playhead. Then move it in the player (drag) and resize it with the mouse wheel.',
    'Text-Sticker': 'Text stickers', 'Beliebt': 'Popular', 'Gesichter': 'Faces', 'Gesten': 'Gestures', 'Herzen & Zeichen': 'Hearts & symbols', 'Tiere': 'Animals', 'Sachen': 'Things',
    'ABONNIEREN 🔔': 'SUBSCRIBE 🔔', 'TEIL 2': 'PART 2', 'ENDE': 'THE END', '🔥 KRASS 🔥': '🔥 INSANE 🔥', 'Text eingeben': 'Enter text',
    // Captions
    'Automatische Untertitel mit KI (Whisper) – läuft komplett': 'Automatic captions with AI (Whisper) – runs completely', 'gratis auf deinem PC': 'free on your PC',
    '. Beim ersten Mal wird das Modell einmalig geladen.': '. The model is downloaded once the first time.', 'Sprache': 'Language', 'Deutsch': 'German', 'Englisch': 'English',
    'Schweizerdeutsch (experimentell)': 'Swiss German (experimental)', 'Französisch': 'French', 'Italienisch': 'Italian', 'Spanisch': 'Spanish', 'Automatisch erkennen': 'Detect automatically',
    'Genauigkeit': 'Accuracy', 'Schnell (~40 MB)': 'Fast (~40 MB)', 'Ausgewogen (~80 MB, Wort-genau)': 'Balanced (~80 MB, word-accurate)', 'Beste Qualität (~250 MB, langsam)': 'Best quality (~250 MB, slow)',
    'Wörter/Zeile': 'Words/line', 'Position': 'Position', 'unten': 'bottom', 'oben': 'top', 'Mitte': 'center', 'Alte Untertitel ersetzen': 'Replace old captions',
    '✨ Untertitel automatisch erstellen': '✨ Create captions automatically', 'Ton wird vorbereitet…': 'Preparing audio…', 'Fertig! Klick einen Untertitel an, um ihn zu bearbeiten.': 'Done! Click a caption to edit it.',
    'Untertitel-Style': 'Caption style', 'Klick = als Standard für neue Untertitel + auf alle vorhandenen anwenden. Eigene Styles erstellst du rechts bei einem Text/Untertitel → „Als meinen Style speichern“.': 'Click = use as default for new captions + apply to all existing ones. Create your own styles on the right for a text/caption → "Save as my style".',
    'Kein Ton gefunden (Musik & Soundeffekte werden ignoriert).': 'No sound found (music & sound effects are ignored).', 'Keine Sprache erkannt.': 'No speech detected.',
    'Sprache wird erkannt… (kann etwas dauern)': 'Recognizing speech… (may take a while)', 'Stimme wird gesprochen…': 'Speaking…',
    // Voice
    'Text, der gesprochen werden soll': 'Text to be spoken', 'z.B. Hallo Leute, heute zeige ich euch was Krasses!': 'e.g. Hey guys, today I\'m showing you something crazy!',
    'Stimmen testen': 'Test voices', '– ▶ klicken = Probe hören': '– click ▶ to hear a sample', 'Ohne eigenen Text hörst du einen Beispielsatz. Beim allerersten Mal wird die KI-Stimme kurz geladen.': 'Without your own text you hear a sample sentence. The very first time, the AI voice is downloaded briefly.',
    'Auch als Untertitel einfügen': 'Also add as captions', '▶ Anhören': '▶ Listen', 'Stimme wird erzeugt…': 'Generating voice…', 'Stimme eingefügt ✔': 'Voice inserted ✔', 'Schreib zuerst einen Text': 'Write some text first',
    'Läuft gratis auf deinem PC (KI-Stimme „MMS“, ca. 30–40 MB einmalig). Die Effekte (Kind, Monster, Roboter …) werden direkt drübergerechnet und sind im Export drin.': 'Runs free on your PC (AI voice "MMS", about 30–40 MB once). The effects (kid, monster, robot …) are applied directly and included in the export.',
    'Normal': 'Normal', 'Kind': 'Kid', 'Chipmunk': 'Chipmunk', 'Oma / Opa': 'Grandma / Grandpa', 'Monster': 'Monster', 'Riese': 'Giant', 'Roboter': 'Robot', 'Alien': 'Alien', 'Telefon': 'Phone',
    'Echo-Halle': 'Echo hall', 'Heliumballon': 'Helium balloon', 'Dämon': 'Demon',
    // Effects, filters, transitions, animations
    'Die Vorschauen laufen live. Klick wendet den Effekt auf den ausgewählten Clip an (sonst auf den Clip am Abspielkopf).': 'Previews run live. Click applies the effect to the selected clip (otherwise to the clip at the playhead).',
    'Video-Effekte': 'Video effects', 'Animationen (Rein)': 'Animations (in)', 'Kein Effekt': 'No effect', 'Wackeln': 'Shake', 'Puls-Zoom': 'Pulse zoom', 'Langsamer Zoom': 'Slow zoom', 'Zoom-Hit': 'Zoom hit',
    'Filmkorn': 'Film grain', 'Blitz': 'Flash', 'Regenbogen': 'Rainbow', 'Stroboskop': 'Strobe', 'Schwanken': 'Wobble', 'Spiegeln': 'Mirror', 'Kino-Balken': 'Letterbox',
    'Original': 'Original', 'S/W': 'B/W', 'Kühl': 'Cool', 'Lebhaft': 'Vivid', 'Verblasst': 'Faded', 'Hell': 'Bright', 'Dunkel': 'Dark', 'Traum': 'Dream', 'Negativ': 'Negative',
    'Übergang wird am': 'The transition is added at the', 'Anfang': 'start', 'des ausgewählten Clips eingefügt (vom vorherigen Clip in diesen hinein).': 'of the selected clip (from the previous clip into it).',
    'Ausgewählten Übergang auf alle Clips der Hauptspur': 'Apply selected transition to all clips on the main track', 'Übergang suchen (z.B. cube, glitch, zoom, swirl …)': 'Search transitions (e.g. cube, glitch, zoom, swirl …)',
    'Basis': 'Basic', 'Profi ✨': 'Pro ✨', 'Keiner': 'None', 'Überblenden': 'Crossfade', 'Schwarzblende': 'Fade to black', 'Weißblitz': 'White flash', 'Schieben ←': 'Slide ←', 'Schieben →': 'Slide →',
    'Schieben ↑': 'Slide ↑', 'Schieben ↓': 'Slide ↓', 'Zoom rein': 'Zoom in', 'Zoom raus': 'Zoom out', 'Wischen': 'Wipe', 'Kreis': 'Circle', 'Drehen': 'Spin', 'Unschärfe': 'Blur',
    'Keine': 'None', 'Einblenden': 'Fade in', 'Zoom von groß': 'Zoom from large', 'Von unten': 'From bottom', 'Von oben': 'From top', 'Von rechts': 'From right', 'Von links': 'From left', 'Hüpfen': 'Bounce',
    'Schreibmaschine (Text)': 'Typewriter (text)', 'Übergang auf alle Clips angewendet': 'Transition applied to all clips', 'Wähle zuerst einen Clip mit Übergang aus': 'First select a clip with a transition',
    // Properties
    'Video': 'Video', 'Bild': 'Image', 'Farbe': 'Color', 'Maske': 'Mask', 'Greenscreen': 'Green screen', 'Animation': 'Animation', 'Ton': 'Audio', 'Styles': 'Styles', 'Soundeffekt': 'Sound effect',
    'Position & Größe': 'Position & size', 'Größe': 'Size', 'Drehung': 'Rotation', 'Deckkraft': 'Opacity', 'Zurücksetzen': 'Reset', 'Alle Keyframes löschen': 'Delete all keyframes',
    '◆ Keyframe setzen': '◆ Set keyframe', '◆ Keyframe entfernen': '◆ Remove keyframe', 'Kein weiterer Keyframe': 'No more keyframes', 'Noch keine Keyframes': 'No keyframes yet',
    'Tipp: Abspielkopf an den Anfang → ◆ setzen, Abspielkopf weiter → Größe/Position ändern = Bewegung & Zoom.': 'Tip: playhead at the start → ◆ set, move the playhead → change size/position = motion & zoom.',
    'Einpassen & Füllmethode': 'Fit & blend mode', 'Modus': 'Mode', 'Ganzes Bild (Einpassen)': 'Whole image (fit)', 'Bild füllen (Zuschneiden)': 'Fill frame (crop)', 'Füllmethode (Blend-Modus)': 'Blend mode',
    'Zuschneiden': 'Crop', 'Links': 'Left', 'Rechts': 'Right', 'Oben': 'Top', 'Unten': 'Bottom', 'Standbild': 'Freeze frame', '❄ Standbild am Abspielkopf einfügen (2 s)': '❄ Insert freeze frame at playhead (2 s)',
    '❄ Standbild': '❄ Freeze frame', 'Standbild eingefügt ❄': 'Freeze frame inserted ❄', 'Stell den Abspielkopf auf den Clip': 'Put the playhead on the clip', 'Bild ist noch nicht geladen': 'Image is not loaded yet',
    'Lumetri-Farbe': 'Lumetri color', 'Belichtung': 'Exposure', 'Kontrast': 'Contrast', 'Lichter': 'Highlights', 'Tiefen': 'Shadows', 'Temperatur': 'Temperature', 'Tönung': 'Tint', 'Sättigung': 'Saturation',
    'Dynamik': 'Vibrance', 'Teal & Orange': 'Teal & orange', 'Verblassen': 'Fade', 'Vignette': 'Vignette', 'Farbe zurücksetzen': 'Reset color', 'Intensität': 'Intensity', 'Anpassen': 'Adjust', 'Helligkeit': 'Brightness',
    'Neutral': 'Neutral', 'Kino (Teal & Orange)': 'Cinema (teal & orange)', 'Warm & weich': 'Warm & soft', 'Kalt': 'Cold', 'S/W Kontrast': 'B/W contrast', 'Knallig': 'Punchy', 'Dunkel & Moody': 'Dark & moody', 'Sommer': 'Summer',
    'Multiplizieren': 'Multiply', 'Negativ multiplizieren': 'Screen', 'Ineinanderkopieren': 'Overlay', 'Weiches Licht': 'Soft light', 'Hartes Licht': 'Hard light', 'Abdunkeln': 'Darken', 'Aufhellen': 'Lighten',
    'Farbig abwedeln': 'Color dodge', 'Farbig nachbelichten': 'Color burn', 'Differenz': 'Difference', 'Ausschluss': 'Exclusion', 'Farbton': 'Hue', 'Luminanz': 'Luminosity',
    'Zeigt nur einen Bereich des Clips (z.B. einen Kreis um ein Gesicht). „Umkehren“ blendet den Bereich stattdessen aus.': 'Shows only part of the clip (e.g. a circle around a face). "Invert" hides that area instead.',
    '▭ Rechteck': '▭ Rectangle', '◯ Kreis': '◯ Circle', 'Breite': 'Width', 'Höhe': 'Height', 'Weiche Kante': 'Feather', 'Umkehren': 'Invert',
    'Greenscreen (Chroma Key)': 'Green screen (chroma key)', 'Entfernt eine Farbe (z.B. grünen Hintergrund). Leg das Video auf eine Overlay-Spur über einen anderen Hintergrund.': 'Removes a color (e.g. a green background). Put the video on an overlay track above another background.',
    'Greenscreen an': 'Green screen on', 'Grün': 'Green', 'Blau': 'Blue', '💧 Pipette': '💧 Eyedropper', 'Stärke': 'Strength', 'Weichheit': 'Softness', 'Grünstich weg': 'Remove green spill',
    'Klick im Player auf die Farbe, die weg soll': 'Click the color you want to remove in the player', 'Farbe übernommen – mit „Stärke“ feinjustieren': 'Color picked – fine-tune with "Strength"',
    'Rein': 'In', 'Raus': 'Out', 'Dauer': 'Duration', 'Effekt & Übergang': 'Effect & transition', 'Effekt': 'Effect', 'Übergang (am Anfang)': 'Transition (at start)', 'Übergangszeit': 'Transition time',
    'Lautstärke': 'Volume', 'Ausblenden': 'Fade out', 'Lautstärke-Kurve': 'Volume curve', 'Langsam lauter': 'Slowly louder', 'Langsam leiser': 'Slowly quieter', 'Mitte leiser': 'Quieter in the middle',
    'Mitte lauter': 'Louder in the middle', 'Pulsieren': 'Pulse', 'Kurve zurücksetzen': 'Reset curve', 'Audio-Effekte': 'Audio effects', 'Tonhöhe': 'Pitch', 'Bass': 'Bass', 'Höhen': 'Treble',
    'Stimme klarer': 'Clearer voice', 'Hall': 'Reverb', 'Brummen/Rumpeln entfernen': 'Remove hum/rumble', 'Tonhöhen-Kurve': 'Pitch curve', 'Video-Tempo folgt der Kurve (wie Plattenspieler)': 'Video speed follows the curve (like a turntable)',
    'Langsam tiefer': 'Slowly lower', 'Langsam höher': 'Slowly higher', 'Tape-Stop am Ende': 'Tape stop at the end', 'Hochfahren am Anfang': 'Spin up at the start', 'Chipmunk-Mitte': 'Chipmunk middle',
    'Monster-Mitte': 'Monster middle', 'Sirene': 'Siren', '〰 Lautstärke-Kurve zeigen': '〰 Show volume curve', '🎵 Tonhöhen-Kurve zeigen': '🎵 Show pitch curve', 'Geschwindigkeit': 'Speed', 'Tempo': 'Speed',
    '♫ Audio trennen (als eigene Spur)': '♫ Detach audio (own track)', 'Clip': 'Clip', '⧉ Duplizieren': '⧉ Duplicate', '🗑 Löschen': '🗑 Delete',
    'Schrift': 'Font', 'Dicke': 'Weight', 'Kontur': 'Outline', 'Hintergrund': 'Background', 'Hintergrund an': 'Background on', 'Schatten': 'Shadow', 'GROSS': 'CAPS', 'Kursiv': 'Italic', 'HG-Deckkraft': 'BG opacity',
    'Leuchten': 'Glow', 'Wort-Hervorhebung (Karaoke)': 'Word highlight (karaoke)', 'Art': 'Type', 'Aus': 'Off', 'Wort einfärben': 'Color the word', 'Box hinter Wort': 'Box behind word',
    'Aktives Wort größer (Pop)': 'Active word bigger (pop)', 'Diesen Style auf ALLE Untertitel': 'Apply this style to ALL captions', '★ Als meinen Style speichern': '★ Save as my style', 'Name für deinen Style:': 'Name for your style:',
    // Curve help texts (split around bold words)
    'Auf dem Clip in der Timeline liegt eine': 'On the clip in the timeline there is a', 'gelbe Linie': 'yellow line', 'klicken': 'click', '= Punkt setzen,': '= add point,', 'Punkt ziehen': 'drag a point',
    '= lauter/leiser (oben 200 %, Mitte 100 %, unten stumm),': '= louder/quieter (top 200 %, middle 100 %, bottom muted),', 'Doppelklick': 'double-click',
    'Oben in der Timeline-Leiste auf': 'In the timeline toolbar, switch to', '„🎵 Kurve: Tonhöhe“': '"🎵 Curve: pitch"', 'An:': 'On:', 'Tiefer = Video und Ton werden': 'Lower = video and sound get',
    'langsamer': 'slower', ', höher =': ', higher =', 'schneller': 'faster', 'Aus:': 'Off:',
    '– wie eine Schallplatte oder Kassette. Die Clip-Länge bleibt gleich; zieh den Clip rechts länger, wenn du mehr vom Video sehen willst.': '– like a record or cassette. The clip length stays the same; drag the clip longer on the right if you want to see more of the video.',
    'Nur die Tonhöhe ändert sich, das Tempo bleibt gleich (wird kurz neu berechnet).': 'Only the pitch changes, the speed stays the same (recalculated briefly).',
    'Doppelklick = Punkt löschen': 'Double-click = delete point', 'stumm': 'muted', 'Original (Tempo 100 %)': 'Original (speed 100 %)',
    // Messages
    'Füge zuerst Medien hinzu': 'Add some media first', 'Kein Clip am Abspielkopf': 'No clip at the playhead', 'Nichts zum Rückgängigmachen': 'Nothing to undo', 'Wähle zuerst einen Clip in der Timeline aus': 'First select a clip in the timeline',
    'Neues Projekt': 'New project', 'Neues Projekt starten? Das aktuelle Projekt wird gelöscht.': 'Start a new project? The current project will be deleted.', 'Dein letztes Projekt wurde wiederhergestellt ✔': 'Your last project was restored ✔',
    'Spur ist gesperrt 🔒': 'Track is locked 🔒', 'KI-Modul nicht geladen': 'AI module not loaded', 'Abspielen fehlgeschlagen': 'Playback failed', 'Sound konnte nicht geladen werden': 'Sound could not be loaded',
    'Nichts zu exportieren': 'Nothing to export', 'Dein Browser kann leider nicht exportieren': 'Sorry, your browser can\'t export', 'Füge zuerst ein Video mit Ton hinzu': 'Add a video with sound first',
    '⚠ Der Editor wurde falsch geöffnet – darum fehlen die Soundeffects. Schließ diesen Tab und starte ihn mit Doppelklick auf': '⚠ The editor was opened the wrong way – that\'s why sound effects are missing. Close this tab and start it by double-clicking',
    '(im CutFree-Ordner).': '(in the CutFree folder).', 'Mein Projekt': 'My project',
  };
  // Tooltips/placeholders that differ from the same word used as visible text
  const A = {
    'Ausblenden': 'Hide', 'Stumm': 'Mute', 'Spur sperren': 'Lock track', 'Zum Anfang': 'Go to start', 'Abspielen (Leertaste)': 'Play (Space)', 'Zum Ende': 'Go to end', 'Vollbild': 'Fullscreen',
    'Rückgängig (Strg+Z)': 'Undo (Ctrl+Z)', 'Wiederholen (Strg+Y)': 'Redo (Ctrl+Y)', 'Teilen am Abspielkopf (S)': 'Split at playhead (S)', 'Links vom Abspielkopf löschen (Q)': 'Delete left of playhead (Q)',
    'Rechts vom Abspielkopf löschen (W)': 'Delete right of playhead (W)', 'Duplizieren (Strg+D)': 'Duplicate (Ctrl+D)', 'Löschen (Entf)': 'Delete (Del)', 'Marker setzen/entfernen (M)': 'Add/remove marker (M)',
    'Welche Kurve auf den Clips bearbeitet wird': 'Which curve is edited on the clips', 'Rauszoomen': 'Zoom out', 'Reinzoomen': 'Zoom in', 'Format': 'Format', 'Hintergrund': 'Background',
    'Neues, leeres Projekt': 'New, empty project', 'Dein Projekt wird automatisch gespeichert': 'Your project is saved automatically', 'Abspielen': 'Play', 'In die Timeline einfügen': 'Add to timeline',
    'An Abspielkopf einfügen': 'Insert at playhead', 'Nur den Ton aus dem Video einfügen': 'Insert only the sound of the video', 'Einfügen': 'Insert', 'Nur den Ton einfügen': 'Insert sound only',
    'Klicken zum Anhören': 'Click to listen', 'Vorheriger Keyframe': 'Previous keyframe', 'Nächster Keyframe': 'Next keyframe', 'Keyframe am Abspielkopf setzen/entfernen': 'Set/remove keyframe at playhead',
    'Farbe im Player anklicken': 'Click the color in the player', 'Löschen': 'Delete', 'Marker – Klick: hinspringen, Rechtsklick: löschen': 'Marker – click: jump, right-click: delete',
    'Doppelklick = Punkt löschen': 'Double-click = delete point',
  };
  const lauterLeiser = { 'lauter/leiser': 'louder/quieter', 'höher/tiefer': 'higher/lower' };
  const w = s => D[s] || s;
  // Texts with changing parts
  const P = [
    [/^(\d+) Datei\(en\) importiert$/, m => `${m[1]} file(s) imported`],
    [/^„(.+)“ eingefügt bei (.+)$/, m => `"${m[1]}" inserted at ${m[2]}`],
    [/^„(.+)“ lädt noch – gleich nochmal klicken$/, m => `"${m[1]}" is still loading – click again in a moment`],
    [/^„(.+)“: Dieses Videoformat kann der Editor evtl\. nicht anzeigen.*$/, m => `"${m[1]}": the editor may not be able to show this video format (e.g. iPhone HEVC). Tip: save it as MP4 (H.264).`],
    [/^Lade „(.+)“…$/, m => `Loading "${m[1]}"…`],
    [/^Ton aus „(.+)“ eingefügt$/, m => `Sound from "${m[1]}" inserted`],
    [/^Style „(.+)“ gewählt$/, m => `Style "${w(m[1])}" selected`],
    [/^Style „(.+)“ gespeichert ✔$/, m => `Style "${m[1]}" saved ✔`],
    [/^Export fertig ✔ \((.+) MB\)$/, m => `Export finished ✔ (${m[1]} MB)`],
    [/^(\d+) Wörter erkannt – Untertitel erstellt ✔$/, m => `${m[1]} words recognized – captions created ✔`],
    [/^Fehler: (.*)$/, m => `Error: ${m[1]}`],
    [/^Dateityp nicht unterstützt: (.*)$/, m => `File type not supported: ${m[1]}`],
    [/^(\d+) Sounds · Seite (\d+) von (\d+)$/, m => `${m[1]} sounds · page ${m[2]} of ${m[3]}`],
    [/^Start (.+) · Dauer (.+)$/, m => `Start ${m[1]} · Duration ${m[2]}`],
    [/^\(aktuell: (.+)\)$/, m => `(current: ${w(m[1])})`],
    [/^(\d+) Keyframes? – Regler ändern setzt automatisch einen Keyframe am Abspielkopf\.$/, m => `${m[1]} keyframe${m[1] === '1' ? '' : 's'} – moving a slider automatically sets a keyframe at the playhead.`],
    [/^▶ (.+) wird abgespielt$/, m => `▶ Playing ${w(m[1])}`],
    [/^Modell wird geladen… (\d+) \/ (\d+) MB$/, m => `Loading model… ${m[1]} / ${m[2]} MB`],
    [/^Sprache wird erkannt… (\d+)%$/, m => `Recognizing speech… ${m[1]}%`],
    [/^= Punkt löschen\.(?: Aktuell (\d+) Punkte\.)?$/, m => `= delete point.${m[1] ? ` Currently ${m[1]} points.` : ''}`],
    [/^umschalten, dann auf dem Clip die türkise Linie: klicken = Punkt, ziehen = höher\/tiefer \(±12 Halbtöne\), Doppelklick = löschen\.(?: Aktuell (\d+) Punkte\.)?$/,
      m => `then use the turquoise line on the clip: click = point, drag = higher/lower (±12 semitones), double-click = delete.${m[1] ? ` Currently ${m[1]} points.` : ''}`],
    [/^Klicken = Punkt setzen, ziehen = (.+)$/, m => `Click = add point, drag = ${lauterLeiser[m[1]] || m[1]}`],
    [/^(.+) Halbtöne · Tempo (.+)$/, m => `${m[1]} semitones · speed ${m[2]}`],
    [/^(.+) eingefügt$/, m => `${w(m[1])} inserted`],
    [/^KI konnte nicht starten \(Internet für den ersten Download nötig\): ?(.*)$/, m => `AI could not start (internet needed for the first download): ${m[1]}`],
  ];

  const norm = s => s.replace(/ /g, ' ').replace(/\s+/g, ' ').trim();
  function tr(s, attr) {
    if (lang === 'de' || !s || !/[A-Za-zÄÖÜäöü]/.test(s)) return s;
    const k = norm(s); if (!k) return s;
    let r = (attr && A[k]) || D[k] || A[k];
    if (r == null) for (const [re, f] of P) { const m = k.match(re); if (m) { r = f(m); break; } }
    if (r == null) { const m = k.match(/^([^\p{L}\d\s]+)\s+(.+)$/u); if (m && (D[m[2]] || A[m[2]])) r = m[1] + ' ' + (D[m[2]] || A[m[2]]); }   // "◐ Überblenden"
    if (r == null) return s;
    const lead = s.match(/^\s*/)[0], trail = s.match(/\s*$/)[0];
    return lead + r + trail;
  }

  const SKIP = new Set(['SCRIPT', 'STYLE', 'TEXTAREA', 'INPUT']);
  function doText(n) {
    const p = n.parentNode; if (!p || SKIP.has(p.nodeName)) return;
    if (n.__tr !== undefined && n.nodeValue === n.__tr) return;
    const t = tr(n.nodeValue); if (t !== n.nodeValue) { n.__tr = t; n.nodeValue = t; }
  }
  function doEl(el) {
    for (const a of ['title', 'placeholder']) {
      const v = el.getAttribute && el.getAttribute(a);
      if (v && el['__tr_' + a] !== v) { const t = tr(v, true); if (t !== v) { el['__tr_' + a] = t; el.setAttribute(a, t); } }
    }
  }
  function walk(root) {
    if (root.nodeType === 3) return doText(root);
    if (root.nodeType !== 1) return;
    doEl(root);   // auch bei Eingabefeldern: Platzhalter/Tooltips übersetzen
    if (SKIP.has(root.nodeName)) return;
    const it = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT);
    let n; while ((n = it.nextNode())) { if (n.nodeType === 3) doText(n); else doEl(n); }
  }
  function start() {
    if (lang === 'de') return;
    document.documentElement.lang = 'en';
    const pn = document.getElementById('projectName'); if (pn && pn.value === 'Mein Projekt') pn.value = 'My project';
    walk(document.body);
    new MutationObserver(list => {
      for (const m of list) {
        if (m.type === 'characterData') doText(m.target);
        else if (m.type === 'attributes') doEl(m.target);
        else m.addedNodes.forEach(walk);
      }
    }).observe(document.body, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ['title', 'placeholder'] });
    const oc = window.confirm.bind(window), op = window.prompt.bind(window);
    window.confirm = m => oc(tr(m));
    window.prompt = (m, d) => op(tr(m), d && d.replace(/^Mein Style/, 'My style'));
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();

  window.I18N = {
    get lang() { return lang; },
    t: s => tr(s),
    set(l) {
      try { localStorage.setItem('cutfree.lang', l); } catch { }
      const go = () => location.reload();
      if (window.CutFree && window.CutFree.saveNow) window.CutFree.saveNow().finally(go); else go();
    },
  };
})();
