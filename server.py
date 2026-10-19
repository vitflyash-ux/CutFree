"""CutFree – kleiner lokaler Server.
Liefert den Editor aus und holt Sounds von myinstants.com (der Browser darf das wegen CORS nicht direkt)."""
import html
import json
import re
import sys
import urllib.parse
import urllib.request
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

MI = 'https://www.myinstants.com'
UA = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) CutFree'}
ITEM = re.compile(r"background-color:\s*(#[0-9A-Fa-f]{3,6})[^>]*>\s*</div>\s*<button[^>]*?play\('(/media/sounds/[^']+)'[^>]*?title=\"Play (.*?) sound\"", re.S)
TOTAL = re.compile(r'Page \d+ of (\d+)')
audio_cache = {}
# Als .exe liegen die Editor-Dateien im entpackten PyInstaller-Ordner
BASE = getattr(sys, '_MEIPASS', None) or __import__('os').path.dirname(__import__('os').path.abspath(__file__))


def fetch(url):
    with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=20) as r:
        return r.read(), r.headers.get('Content-Type', '')


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *a, **kw):
        super().__init__(*a, directory=BASE, **kw)

    def log_message(self, *a):
        pass

    def end_headers(self):
        # Nie alte Editor-Dateien aus dem Browser-Cache verwenden
        if not self.path.startswith('/api/mi-audio'):
            self.send_header('Cache-Control', 'no-store')
        super().end_headers()

    def send_json(self, obj, code=200):
        body = json.dumps(obj).encode()
        self.send_response(code)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Content-Length', str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        u = urllib.parse.urlparse(self.path)
        q = urllib.parse.parse_qs(u.query)
        if u.path == '/api/ping':
            return self.send_json({'ok': True})
        if u.path == '/api/mi':
            return self.list_sounds(q)
        if u.path == '/api/mi-audio':
            return self.audio(q)
        return super().do_GET()

    def list_sounds(self, q):
        page = max(1, int(q.get('page', ['1'])[0] or 1))
        search = q.get('q', [''])[0].strip()
        cat = q.get('cat', ['sound effects'])[0]
        if search:
            url = f"{MI}/en/search/?name={urllib.parse.quote(search)}&page={page}"
        elif cat == 'trending':
            url = f"{MI}/en/index/us/?page={page}"
        else:
            url = f"{MI}/en/categories/{urllib.parse.quote(cat)}/us/?page={page}"
        try:
            raw, _ = fetch(url)
        except Exception as e:  # z.B. letzte Seite überschritten oder kein Internet
            return self.send_json({'items': [], 'pages': page - 1, 'error': str(e)})
        text = raw.decode('utf-8', 'replace')
        items, seen = [], set()
        for color, path, name in ITEM.findall(text):
            if path in seen:
                continue
            seen.add(path)
            items.append({'name': html.unescape(name), 'path': path, 'color': color})
        m = TOTAL.search(text)
        # Seite 1 nennt keine Gesamtzahl – bei voller Seite einfach "es gibt mehr" melden
        pages = int(m.group(1)) if m else (page + 1 if len(items) >= 30 else page)
        self.send_json({'items': items, 'pages': pages})

    def audio(self, q):
        path = q.get('f', [''])[0]
        if not path.startswith('/media/sounds/') or '..' in path:
            return self.send_json({'error': 'bad path'}, 400)
        try:
            if path not in audio_cache:
                audio_cache[path] = fetch(MI + urllib.parse.quote(path))
            data, ctype = audio_cache[path]
        except Exception as e:
            return self.send_json({'error': str(e)}, 502)
        self.send_response(200)
        self.send_header('Content-Type', ctype or 'audio/mpeg')
        self.send_header('Content-Length', str(len(data)))
        self.send_header('Cache-Control', 'max-age=86400')
        self.end_headers()
        self.wfile.write(data)


class Server(ThreadingHTTPServer):
    """Belegt den Port exklusiv. (Python erlaubt unter Windows sonst, dass zwei Server denselben Port
    teilen – dann antwortet mal der eine, mal der andere, und das Projekt scheint verschwunden.)"""
    allow_reuse_address = False

    def server_bind(self):
        import socket
        if hasattr(socket, 'SO_EXCLUSIVEADDRUSE'):
            self.socket.setsockopt(socket.SOL_SOCKET, socket.SO_EXCLUSIVEADDRUSE, 1)
        super().server_bind()


def cutfree_running(port):
    try:
        with urllib.request.urlopen(f'http://127.0.0.1:{port}/api/ping', timeout=1.5) as r:
            return json.loads(r.read()).get('ok') is True
    except Exception:
        return False


def find_edge():
    import os
    for root in (os.environ.get('ProgramFiles(x86)'), os.environ.get('ProgramFiles'), os.environ.get('LocalAppData')):
        if root:
            p = os.path.join(root, 'Microsoft', 'Edge', 'Application', 'msedge.exe')
            if os.path.exists(p):
                return p
    return None


def run_app():
    """Startet CutFree wie ein eigenes Programm: Server im Hintergrund + App-Fenster (Edge ohne Adressleiste).
    Wird das Fenster geschlossen, beendet sich auch das Programm."""
    import os
    import subprocess
    import threading
    import webbrowser
    # Immer Port 8765 benutzen, damit das gespeicherte Projekt (hängt am Port) gefunden wird.
    # Läuft dort schon ein CutFree (z.B. START.bat), einfach mitbenutzen.
    server, port = None, 8765
    if not cutfree_running(8765):
        for port in range(8765, 8800):
            try:
                server = Server(('127.0.0.1', port), Handler)
                break
            except OSError:
                continue
        if not server:
            return
        threading.Thread(target=server.serve_forever, daemon=True).start()
    url = f'http://localhost:{port}/index.html'
    edge = find_edge()
    if edge:
        profile = os.path.join(os.environ.get('LocalAppData', BASE), 'CutFree', 'fenster')
        os.makedirs(profile, exist_ok=True)
        # Eigenes Profil → eigener Edge-Prozess, auf dessen Ende wir warten können
        proc = subprocess.Popen([edge, f'--app={url}', f'--user-data-dir={profile}', '--no-first-run',
                                 '--no-default-browser-check', '--start-maximized', '--autoplay-policy=no-user-gesture-required'])
        proc.wait()
        # Falls Edge den Start an einen anderen Prozess übergibt, weiterlaufen solange das Fenster offen ist
        import time
        while is_profile_running(profile):
            time.sleep(2)
    else:
        webbrowser.open(url)
        threading.Event().wait()


def is_profile_running(profile):
    import subprocess
    try:
        out = subprocess.run(['powershell', '-NoProfile', '-Command',
                              "(Get-CimInstance Win32_Process -Filter \"Name='msedge.exe'\").CommandLine"],
                             capture_output=True, text=True, timeout=15, creationflags=0x08000000).stdout
    except Exception:
        return False
    return profile.lower() in out.lower()


if __name__ == '__main__':
    import os
    import webbrowser
    if getattr(sys, 'frozen', False) or '--app' in sys.argv:
        run_app()
        sys.exit(0)
    os.chdir(BASE)
    fixed = len(sys.argv) > 1
    start = int(sys.argv[1]) if fixed else 8765
    if not fixed and cutfree_running(start):
        print(f'CutFree laeuft schon auf http://localhost:{start}/index.html')
        webbrowser.open(f'http://localhost:{start}/index.html')
        sys.exit(0)
    server = None
    for port in ([start] if fixed else range(start, start + 30)):
        try:
            server = Server(('127.0.0.1', port), Handler)
            break
        except OSError:
            continue
    if not server:
        sys.exit('Kein freier Port gefunden.')
    url = f'http://localhost:{port}/index.html'
    print(f'CutFree laeuft auf {url}')
    print('Dieses Fenster offen lassen, solange du schneidest.')
    if not fixed:
        webbrowser.open(url)
    server.serve_forever()
