export const getTesterPage = (request, env) => {
  const html = `<!DOCTYPE html><html lang="id"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><meta name="theme-color" content="#263746"><title>DEKEKU API Tester</title><style>
:root{color-scheme:light;--nav:#263746;--blue:#0875bd;--ink:#263746;--muted:#6b7c8d;--line:#dce3e8;--bg:#f2f5f7;--green:#16834a;--red:#c0392b}
*{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0;background:var(--bg);color:var(--ink);font:14px/1.5 system-ui,-apple-system,"Segoe UI",sans-serif}button,input,textarea,select{font:inherit}button{cursor:pointer}
.topbar{height:54px;background:var(--nav);color:#fff;display:flex;align-items:center;gap:14px;padding:0 20px;position:sticky;top:0;z-index:10;box-shadow:0 2px 5px #16243126}.brand{font-size:17px;font-weight:700}.brand span{color:#8ed1ff}.top-subtitle{color:#c6d4df;font-size:12px;border-left:1px solid #526271;padding-left:14px}.top-spacer{flex:1}.origin-pill{font:12px ui-monospace,monospace;color:#d7e8f5;max-width:42vw;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.shell{display:grid;grid-template-columns:245px minmax(0,1fr);min-height:calc(100vh - 54px)}.sidebar{background:var(--nav);color:#d9e2e9;padding:17px 12px 28px;min-height:calc(100vh - 54px)}.side-title{font-size:10px;text-transform:uppercase;letter-spacing:1.1px;color:#91a4b4;font-weight:700;padding:13px 10px 6px}.side-link{display:flex;gap:10px;color:#dce6ed;text-decoration:none;padding:9px 11px;border-radius:4px;margin:2px 0;font-size:13px}.side-link:hover,.side-link.active{background:#344c60;color:#fff}.side-icon{width:18px;text-align:center;color:#9fc9e5}.side-note{margin:20px 8px 0;padding:12px;border:1px solid #496071;border-radius:5px;color:#b8c8d4;font-size:11px}
.main{min-width:0;padding:24px clamp(16px,3vw,38px) 48px;max-width:1500px;width:100%;margin:0 auto}.breadcrumb{font-size:12px;color:var(--muted);margin-bottom:12px}.breadcrumb strong{color:var(--blue)}.page-heading{display:flex;justify-content:space-between;gap:18px;margin-bottom:20px}.page-heading h1{font-size:23px;margin:0 0 4px;font-weight:500}.page-heading p{margin:0;color:var(--muted);font-size:13px}.connection{border:1px solid #b9dec9;background:#edf8f1;color:#226c43;padding:7px 11px;border-radius:4px;font-size:12px;white-space:nowrap}
.toolbar{display:flex;gap:5px;border-bottom:1px solid var(--line);margin-bottom:20px;overflow-x:auto}.toolbar a{padding:10px 14px;color:#526574;text-decoration:none;border-bottom:2px solid transparent;white-space:nowrap;font-size:13px}.toolbar a:hover,.toolbar a.active{color:var(--blue);border-color:var(--blue);background:#fff}
.summary-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;margin-bottom:20px}.summary{background:#fff;border:1px solid var(--line);border-radius:5px;padding:13px 15px}.summary small{display:block;color:var(--muted);font-size:11px;text-transform:uppercase}.summary strong{display:block;font-size:14px;margin-top:4px}
.panel{background:#fff;border:1px solid var(--line);border-radius:5px;margin:0 0 18px;scroll-margin-top:76px;box-shadow:0 1px 2px #1827340f}.panel-head{padding:12px 16px;background:#f8fafb;border-bottom:1px solid var(--line);display:flex;align-items:center;justify-content:space-between;gap:12px}.panel-head h2{font-size:14px;margin:0;font-weight:650;color:#31495a}.panel-head small{color:var(--muted);font-size:11px}.panel-body{padding:17px}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(270px,1fr));gap:14px}.form-group{margin-bottom:13px}label{display:block;margin-bottom:5px;font-weight:600;font-size:12px;color:#465b6b}
input,textarea,select{width:100%;padding:9px 10px;border:1px solid #c7d1d9;border-radius:4px;background:#fff;color:#263746;outline:none}input:focus,textarea:focus,select:focus{border-color:#66a9d6;box-shadow:0 0 0 2px #0875bd18}textarea{min-height:90px;resize:vertical;font:12px ui-monospace,monospace}
button{border:1px solid var(--blue);background:var(--blue);color:#fff;padding:8px 13px;border-radius:4px;font-weight:600;font-size:12px}button:hover{filter:brightness(.95)}button:disabled{opacity:.55;cursor:not-allowed}button.secondary{background:#fff;color:#36566c;border-color:#b9c7d1;margin-top:7px}button.danger{background:#fff;color:var(--red);border-color:#e1b8b4}.button-row,.action-stack{display:flex;gap:8px;flex-wrap:wrap}.button-row button,.action-stack button{width:auto}.token-area{background:#f5f8fa;border:1px solid #e0e7ec;padding:9px 11px;border-radius:4px;font-size:11px;color:#526574;overflow-wrap:anywhere}.result-wrap{background:#172b3a;border-radius:4px;overflow:hidden}.result-meta{padding:8px 12px;color:#b8d3e4;background:#203b4e;font:11px ui-monospace,monospace;display:flex;justify-content:space-between}.result-box{margin:0;padding:14px;color:#d6e9f5;font:12px/1.6 ui-monospace,Consolas,monospace;overflow:auto;white-space:pre-wrap;overflow-wrap:anywhere;min-height:150px;max-height:480px}.status{font-weight:650;color:#405a6d;font-size:12px}.help{font-size:11px;color:var(--muted);margin:5px 0 0}.section-label{font-size:11px;text-transform:uppercase;letter-spacing:.6px;color:#7b8d9a;margin:0 0 12px}.mobile-menu{display:none;background:transparent;border-color:#6b8293;padding:5px 9px}
@media(max-width:850px){.shell{grid-template-columns:1fr}.sidebar{display:none;min-height:0;padding:10px 12px}.sidebar.open{display:block}.side-note{display:none}.mobile-menu{display:inline-block}.main{padding:18px 14px 36px}.origin-pill{max-width:34vw}.summary-grid{grid-template-columns:1fr 1fr}}@media(max-width:520px){.topbar{padding:0 12px;gap:9px}.top-subtitle{display:none}.origin-pill{font-size:10px;max-width:38vw}.page-heading{display:block}.connection{display:inline-block;margin-top:10px}.summary-grid{grid-template-columns:1fr}.panel-body{padding:13px}.grid{grid-template-columns:1fr}}

.fm-project{display:grid;grid-template-columns:minmax(220px,1fr) auto;gap:10px;align-items:end;margin-bottom:16px}.fm-project-status{grid-column:1/-1;font-size:12px;color:var(--muted);padding:8px 10px;background:#f5f8fa;border:1px solid var(--line);border-radius:4px}.fm-toolbar{display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;padding:10px 0}.fm-path{font:12px ui-monospace,monospace;color:#36566c;overflow-wrap:anywhere}.fm-table-wrap{width:100%;overflow-x:auto;border:1px solid var(--line);border-radius:4px}.fm-table{width:100%;border-collapse:collapse;font-size:12px;min-width:520px}.fm-table th,.fm-table td{text-align:left;padding:10px 12px;border-bottom:1px solid #e8edf1}.fm-table th{background:#f5f8fa;color:#607383;font-size:10px;text-transform:uppercase;letter-spacing:.5px}.fm-table tr:last-child td{border-bottom:0}.fm-table button{padding:4px 8px}.fm-name{border:0;background:transparent;color:var(--blue);padding:0;font-weight:600;text-align:left}.fm-name:hover{text-decoration:underline}.fm-muted{color:var(--muted)}.fm-status{font-size:11px;color:var(--muted);padding:9px 2px}.fm-pagination{display:flex;align-items:center;gap:8px;justify-content:flex-end;padding-top:10px;font-size:11px;color:var(--muted)}.fm-pagination button{padding:5px 9px}.fm-editor{margin-top:16px;padding:14px;border:1px solid #cbd8e1;border-radius:5px;background:#f8fafb}.fm-editor[hidden]{display:none}.fm-editor textarea{min-height:260px}.fm-editor-head{display:flex;justify-content:space-between;gap:10px;align-items:center;margin-bottom:10px}.fm-editor-head strong{font-size:13px}.fm-editor-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:10px}.fm-danger{background:#fff!important;color:var(--red)!important;border-color:#e1b8b4!important}@media(max-width:520px){.fm-project{grid-template-columns:1fr}.fm-project-status{grid-column:auto}.fm-toolbar{align-items:flex-start}.fm-editor{padding:10px}.fm-editor textarea{min-height:220px}}
</style></head><body>
<header class="topbar"><button class="mobile-menu" id="mobileMenu" type="button" aria-label="Toggle navigation">☰</button><div class="brand"><span>DEKEKU</span> API</div><div class="top-subtitle">Database & API Tester</div><div class="top-spacer"></div><div class="origin-pill" id="apiOriginDisplay">Loading API origin...</div></header>
<div class="shell"><aside class="sidebar" id="sidebar"><div class="side-title">Workspace</div><a class="side-link active" href="#overview"><span class="side-icon">▦</span> Overview</a><div class="side-title">API Explorer</div><a class="side-link" href="#panel-public"><span class="side-icon">◉</span> Public API</a><a class="side-link" href="#panel-guestbook"><span class="side-icon">✎</span> Guestbook</a><div class="side-title">Access Control</div><a class="side-link" href="#panel-admin"><span class="side-icon">♙</span> Admin session</a><a class="side-link" href="#panel-user"><span class="side-icon">♧</span> User session</a><div class="side-title">Data Management</div><a class="side-link" href="#panel-files"><span class="side-icon">▤</span> File manager</a><a class="side-link" href="#panel-write"><span class="side-icon">⚙</span> Manual JSON operations</a><a class="side-link" href="#panel-response"><span class="side-icon">⌁</span> Response console</a><div class="side-note">API requests are restricted to this page's origin. Admin and User credentials use separate sessions.</div></aside>
<main class="main"><div class="breadcrumb">Server: <strong>DEKEKU API Gateway</strong> / Workspace / Tester</div>
<section id="overview"><div class="page-heading"><div><h1>API Tester</h1><p>Jelajahi endpoint, autentikasi, dan data API dalam satu workspace.</p></div><div class="connection">● Same-origin connection</div></div><nav class="toolbar" aria-label="Workspace tabs"><a class="active" href="#overview">Overview</a><a href="#panel-public">API Explorer</a><a href="#panel-write">Data operations</a><a href="#panel-response">Response console</a></nav><div class="summary-grid"><div class="summary"><small>Gateway</small><strong>DEKEKU API · v1</strong></div><div class="summary"><small>Request destination</small><strong>Same-origin only</strong></div><div class="summary"><small>Authentication</small><strong>Admin / User separated</strong></div></div></section>
<section class="panel" id="panel-public"><div class="panel-head"><h2>◉ Public API Explorer</h2><small>GET · No authentication</small></div><div class="panel-body"><p class="section-label">Available public endpoints</p><div class="action-stack"><button type="button" onclick="testApi('/api/v1/health')">Check Health</button><button type="button" class="secondary" onclick="testApi('/api/v1/github/repository')">Repository Metadata</button></div><div class="form-group" style="margin-top:18px;max-width:650px"><label for="readPath">Public file path</label><input type="text" id="readPath" value="public/data/guestbook/list.json"><p class="help">Path harus berada di area public yang diizinkan API.</p><button type="button" class="secondary" onclick="testRead()">Browse / Read file</button></div></div></section>
<section class="panel" id="panel-guestbook"><div class="panel-head"><h2>✎ Guestbook</h2><small>POST · Public submission</small></div><div class="panel-body"><div class="grid"><div class="form-group"><label for="gbName">Name</label><input type="text" id="gbName" value="Tester HTML"></div><div class="form-group"><label for="gbMessage">Message</label><textarea id="gbMessage">Halo dari Dashboard Tester!</textarea></div></div><button id="guestbookSubmit" type="button" onclick="testGuestbook()">Submit Guestbook</button><p class="help">Form hanya direset setelah server mengonfirmasi submission berhasil.</p></div></section>
<section class="panel" id="panel-admin"><div class="panel-head"><h2>♙ Admin session</h2><small>JWT · Administrative access</small></div><div class="panel-body"><div class="grid"><div class="form-group"><label for="loginUser">Username</label><input type="text" id="loginUser" value="admin" autocomplete="username"></div><div class="form-group"><label for="loginPass">Password</label><input type="password" id="loginPass" autocomplete="current-password"></div></div><div class="button-row"><button type="button" onclick="testLogin()">Login Admin</button><button type="button" class="secondary" onclick="clearToken()">Logout Admin</button></div><div id="tokenDisplay" style="margin-top:12px;display:none"><div class="token-area" id="activeTokenText">No active admin session.</div></div><p class="help">Admin JWT hanya disimpan di memori halaman dan tidak ditampilkan.</p></div></section>
<section class="panel" id="panel-user"><div class="panel-head"><h2>♧ User session</h2><small>JWT · User-scoped access</small></div><div class="panel-body"><div class="grid"><div class="form-group"><label for="userLoginUser">Username</label><input type="text" id="userLoginUser" autocomplete="username"></div><div class="form-group"><label for="userLoginPass">Password</label><input type="password" id="userLoginPass" autocomplete="current-password"></div></div><div class="button-row"><button type="button" onclick="testUserLogin()">Login User</button><button type="button" class="secondary" onclick="loadUserRepositories()">Load My Repositories</button><button type="button" class="danger" onclick="clearUserSession()">Logout User</button></div><div class="token-area" id="userSessionStatus" aria-live="polite" style="margin-top:12px">No active User session.</div></div></section>

<section class="panel" id="panel-files"><div class="panel-head"><h2>▤ Public JSON File Manager</h2><small>Admin JWT · Browse public/ · CRUD public/data/*.json</small></div><div class="panel-body">
<div class="fm-project"><div class="form-group" style="margin:0"><label for="projectOriginInput">Project Origin (canonical HTTPS)</label><input id="projectOriginInput" type="url" placeholder="https://example.com" autocomplete="url"><p class="help">Origin harus terdaftar sebagai exact entry di ALLOWED_ORIGINS dan memiliki /config.json yang valid.</p></div><button type="button" onclick="connectProject()">Connect project</button><div class="fm-project-status" id="projectConnectionStatus" aria-live="polite">No project selected. Enter a trusted project Origin to connect.</div></div>
<div class="fm-toolbar"><div><strong id="projectRepositoryLabel">No repository connected</strong><div class="fm-path" id="fileCurrentPath">public/data</div></div><div class="button-row"><button type="button" class="secondary" id="fileUpButton" onclick="goUpDirectory()" disabled>Up</button><button type="button" class="secondary" onclick="loadDirectory()">Refresh</button><button type="button" id="newJsonButton" onclick="startCreateFile()" disabled>New JSON</button></div></div>
<div class="fm-table-wrap"><table class="fm-table"><thead><tr><th>Name</th><th>Type</th><th>Size</th><th>SHA</th><th>Action</th></tr></thead><tbody id="fileTableBody"><tr><td colspan="5" class="fm-muted">Connect a project and login as Admin to browse files.</td></tr></tbody></table></div>
<div class="fm-pagination"><button type="button" class="secondary" id="filePrevButton" onclick="changeFilePage(-1)" disabled>Previous</button><span id="filePageLabel">Page 1 / 1</span><button type="button" class="secondary" id="fileNextButton" onclick="changeFilePage(1)" disabled>Next</button></div>
<div class="fm-status" id="fileManagerStatus" aria-live="polite">File operations are restricted to public/data/*.json.</div>
<div class="fm-editor" id="fileEditor" hidden><div class="fm-editor-head"><strong id="fileEditorTitle">JSON editor</strong><span class="fm-muted" id="fileEditorMeta"></span></div><div class="form-group" id="newFileNameGroup" hidden><label for="newFileName">New file name (.json)</label><input id="newFileName" type="text" placeholder="example.json" maxlength="100"></div><div class="form-group"><label for="fileJsonEditor">JSON content</label><textarea id="fileJsonEditor" spellcheck="false">{}</textarea></div><div class="fm-editor-actions"><button type="button" id="saveFileButton" onclick="saveManagedFile()">Save JSON</button><button type="button" class="danger fm-danger" id="deleteFileButton" onclick="deleteManagedFile()" hidden>Delete file</button><button type="button" class="secondary" onclick="closeFileEditor()">Cancel</button></div></div>
</div></section>
<section class="panel" id="panel-write"><div class="panel-head"><h2>▤ JSON file operations</h2><small>Admin JWT required · JSON only</small></div><div class="panel-body"><div class="grid"><div class="form-group"><label for="writeMethod">Operation</label><select id="writeMethod"><option value="POST">CREATE · POST</option><option value="PUT">UPDATE · PUT</option><option value="DELETE">DELETE · DELETE</option></select></div><div class="form-group"><label for="writePath">File path</label><input type="text" id="writePath" value="public/data/test-manual.json"></div></div><div class="form-group"><label for="writeContent">JSON content (CREATE / UPDATE)</label><textarea id="writeContent">{ "hello": "world", "updated": true }</textarea></div><div class="form-group"><label for="writeSha">File SHA (required for UPDATE / DELETE)</label><input type="text" id="writeSha" placeholder="40 hexadecimal characters"><p class="help">Gunakan SHA terbaru untuk mencegah overwrite versi yang berubah.</p></div><button type="button" onclick="testWrite()">Execute operation</button></div></section>
<section class="panel" id="panel-response"><div class="panel-head"><h2>⌁ Response console</h2><span class="status" id="responseStatus">Waiting for request</span></div><div class="panel-body"><div class="result-wrap"><div class="result-meta"><span>LAST API RESPONSE</span><span>JSON / TEXT</span></div><pre id="responseBody" class="result-box">No requests yet. Choose an action from the API Explorer or Data Management.</pre></div></div></section>
</main></div>
<script>

        const API_ORIGIN = window.location.origin;
        try { window.localStorage.removeItem('dekeku_jwt'); } catch {}
        let jwtToken = '';
        let userAccessToken = '';
        const USER_SESSION_KEY = 'dekeku_user_access_token';
        let guestbookSubmitting = false;


        function loadUserToken() {
            try {
                const token = window.sessionStorage.getItem(USER_SESSION_KEY);
                return typeof token === 'string' ? token : '';
            } catch {
                return '';
            }
        }

        function updateUserSessionUI() {
            const status = document.getElementById('userSessionStatus');
            if (status) {
                status.innerText = userAccessToken
                    ? 'User session active. Token is stored in this browser tab session only.'
                    : 'No active User session.';
            }
        }

        function clearUserSession(silent = false) {
            userAccessToken = '';
            try { window.sessionStorage.removeItem(USER_SESSION_KEY); } catch {}
            updateUserSessionUI();
            if (!silent) log('User session cleared.', 'LOGOUT');
        }

        function getApiUrl(path) {
            const currentOrigin = new URL(API_ORIGIN);
            const localHosts = ['localhost', '127.0.0.1', '[::1]'];
            if (currentOrigin.protocol !== 'https:' &&
                !(currentOrigin.protocol === 'http:' && localHosts.includes(currentOrigin.hostname))) {
                throw new Error('Dashboard API harus menggunakan HTTPS.');
            }
            if (typeof path !== 'string' || !path.startsWith('/api/v1/')) {
                throw new Error('Path API tidak valid.');
            }
            const url = new URL(path, API_ORIGIN);
            if (url.origin !== currentOrigin.origin || url.username || url.password) {
                throw new Error('Tujuan API tidak diizinkan.');
            }
            return url.toString();
        }

        function updateTokenUI() {
            const display = document.getElementById('tokenDisplay');
            const text = document.getElementById('activeTokenText');
            if (jwtToken) {
                display.style.display = 'block';
                text.innerText = 'Authenticated admin session active. Token is kept in memory only.';
            } else {
                display.style.display = 'none';
                text.innerText = '';
            }
        }

        function clearToken(silent = false) {
            jwtToken = '';
            updateTokenUI();
            if (!silent) log('Admin session cleared.', 'LOGOUT');
        }

        function redactSecrets(value) {
            if (Array.isArray(value)) return value.map(redactSecrets);
            if (value && typeof value === 'object') {
                const safe = {};
                for (const [key, item] of Object.entries(value)) {
                    safe[key] = /token|authorization|password|secret/i.test(key)
                        ? '[REDACTED]'
                        : redactSecrets(item);
                }
                return safe;
            }
            return value;
        }

        function log(msg, status = 'Waiting...') {
            document.getElementById('responseStatus').innerText = 'Status: ' + status;
            const safeMessage = redactSecrets(msg);
            document.getElementById('responseBody').innerText =
                typeof safeMessage === 'object' ? JSON.stringify(safeMessage, null, 2) : String(safeMessage);
        }

        async function performRequest(path, options = {}, session = 'public') {
            let url;
            try {
                url = getApiUrl(path);
            } catch (err) {
                log(err.message, 'REQUEST BLOCKED');
                return { status: 0, data: null };
            }

            log('Requesting: ' + new URL(url).pathname + '...', 'In Progress');
            const headers = new Headers(options.headers || {});
            headers.set('Accept', 'application/json');

            try {
                const response = await fetch(url, {
                    ...options,
                    headers,
                    redirect: 'error'
                });
                const responseText = await response.text();
                let data = null;
                if (responseText) {
                    try {
                        data = JSON.parse(responseText);
                    } catch {
                        data = { message: 'Server returned a non-JSON response.' };
                    }
                }

                if (response.status === 401) {
                    if (session === 'admin') clearToken(true);
                    if (session === 'user') clearUserSession(true);
                } else if (session === 'user' && response.status === 403 &&
                    data && data.error === 'User account is unavailable') {
                    clearUserSession(true);
                }
                log(data || {}, response.status + ' ' + response.statusText);
                return { status: response.status, data };
            } catch {
                log('Network request failed. Check the Development API and try again.', 'NETWORK ERROR');
                return { status: 0, data: null };
            }
        }

        async function apiRequest(path, options = {}) {
            const headers = new Headers(options.headers || {});
            headers.delete('Authorization');
            return performRequest(path, { ...options, headers }, 'public');
        }

        async function adminRequest(path, options = {}) {
            if (!jwtToken) {
                log('Silakan login admin terlebih dahulu.', 'AUTH REQUIRED');
                return { status: 401, data: null };
            }
            const headers = new Headers(options.headers || {});
            headers.set('Authorization', 'Bearer ' + jwtToken);
            if (selectedProjectOrigin) headers.set('X-DEKEKU-Project-Origin', selectedProjectOrigin);
            return performRequest(path, { ...options, headers }, 'admin');
        }

        async function userRequest(path, options = {}) {
            if (!userAccessToken) {
                log('Silakan login User terlebih dahulu.', 'AUTH REQUIRED');
                return { status: 401, data: null };
            }
            const headers = new Headers(options.headers || {});
            headers.set('Authorization', 'Bearer ' + userAccessToken);
            return performRequest(path, { ...options, headers }, 'user');
        }

        function testApi(path) {
            apiRequest(path);
        }

        function testRead() {
            const path = document.getElementById('readPath').value;
            apiRequest('/api/v1/github/file?path=' + encodeURIComponent(path));
        }

        async function testLogin() {
            const username = document.getElementById('loginUser').value.trim();
            const passwordInput = document.getElementById('loginPass');
            const password = passwordInput.value;
            if (!username || !password) {
                log('Username dan password wajib diisi.', 'VALIDATION ERROR');
                return;
            }

            const res = await apiRequest('/api/v1/admin/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
            passwordInput.value = '';

            if (res.status === 200 && res.data && typeof res.data.access_token === 'string' &&
                res.data.access_token.trim()) {
                jwtToken = res.data.access_token;
                updateTokenUI();
                if (selectedProjectOrigin) await loadDirectory(fileBrowserPath, 1);
                log({ success: true, message: 'Admin session established. Token is not displayed or persisted.' },
                    'LOGIN SUCCESS');
            } else if (res.status === 200) {
                clearToken();
                log('Login response did not contain a valid access_token.', 'INVALID RESPONSE');
            }
        }

        async function testUserLogin() {
            const username = document.getElementById('userLoginUser').value.trim();
            const passwordInput = document.getElementById('userLoginPass');
            const password = passwordInput.value;
            if (!username || !password) {
                log('Username dan password User wajib diisi.', 'VALIDATION ERROR');
                return;
            }

            const res = await apiRequest('/api/v1/user/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
            passwordInput.value = '';

            if (res.status === 200 && res.data && typeof res.data.access_token === 'string' &&
                res.data.access_token.trim()) {
                try {
                    window.sessionStorage.setItem(USER_SESSION_KEY, res.data.access_token);
                    userAccessToken = res.data.access_token;
                    updateUserSessionUI();
                    log({
                        success: true,
                        message: 'User session established. Token is stored in sessionStorage and is not displayed.',
                        user: res.data.user || null
                    }, 'USER LOGIN SUCCESS');
                } catch {
                    clearUserSession(true);
                    log('Browser sessionStorage is unavailable. User session was not saved.', 'STORAGE ERROR');
                }
            } else if (res.status === 200) {
                clearUserSession(true);
                log('User login response did not contain a valid access_token.', 'INVALID RESPONSE');
            }
        }

        async function loadUserRepositories() {
            const res = await userRequest('/api/v1/user/repositories');
            if (res.status === 200) log(res.data || {}, 'USER REPOSITORIES');
        }

        async function testGuestbook() {
            if (guestbookSubmitting) return;
            const nameInput = document.getElementById('gbName');
            const messageInput = document.getElementById('gbMessage');
            const submitButton = document.getElementById('guestbookSubmit');
            const name = nameInput.value.trim();
            const message = messageInput.value.trim();

            if (!name || !message) {
                log('Nama dan pesan wajib diisi.', 'VALIDATION ERROR');
                return;
            }

            guestbookSubmitting = true;
            submitButton.disabled = true;
            try {
                const res = await apiRequest('/api/v1/public/submit', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name, message })
                });
                if (res.status === 201 && res.data && res.data.success === true) {
                    nameInput.value = '';
                    messageInput.value = '';
                }
            } finally {
                guestbookSubmitting = false;
                submitButton.disabled = false;
            }
        }


        const PROJECT_ORIGIN_KEY = 'dekeku_tester_project_origin';
        let selectedProjectOrigin = '';
        let selectedProjectMetadata = null;
        let fileBrowserPath = 'public';
        let fileBrowserPage = 1;
        let fileBrowserTotalPages = 1;
        let managedFileMode = 'create';
        let managedFilePath = '';

        function normalizeProjectOrigin(value) {
            const raw = String(value || '').trim();
            let parsed;
            try { parsed = new URL(raw); } catch { throw new Error('Masukkan Origin HTTPS yang valid.'); }
            if (parsed.protocol !== 'https:' || parsed.origin !== raw || parsed.username || parsed.password ||
                parsed.port || parsed.pathname !== '/' || parsed.search || parsed.hash) {
                throw new Error('Gunakan Origin HTTPS canonical tanpa path, port, query, atau fragment.');
            }
            return parsed.origin;
        }

        function updateProjectConnectionUI(message) {
            const status = document.getElementById('projectConnectionStatus');
            const label = document.getElementById('projectRepositoryLabel');
            if (selectedProjectOrigin && selectedProjectMetadata) {
                status.textContent = message || ('Connected: ' + selectedProjectOrigin + ' → ' + selectedProjectMetadata.name);
                label.textContent = selectedProjectMetadata.name + ' · ' + selectedProjectMetadata.default_branch;
            } else {
                status.textContent = message || 'No project connected.';
                label.textContent = 'No repository connected';
            }
            document.getElementById('projectOriginInput').value = selectedProjectOrigin ||
                document.getElementById('projectOriginInput').value;
        }

        async function connectProject() {
            let origin;
            try {
                origin = normalizeProjectOrigin(document.getElementById('projectOriginInput').value);
            } catch (err) {
                log(err.message, 'PROJECT ORIGIN INVALID');
                return;
            }
            const result = await apiRequest('/api/v1/github/repository', {
                headers: { 'X-DEKEKU-Project-Origin': origin }
            });
            if (result.status !== 200 || !result.data || result.data.success !== true ||
                typeof result.data.name !== 'string' || typeof result.data.default_branch !== 'string') {
                updateProjectConnectionUI('Connection rejected. Verify the exact allowlisted Origin and its /config.json.');
                return;
            }
            selectedProjectOrigin = origin;
            selectedProjectMetadata = {
                name: result.data.name,
                default_branch: result.data.default_branch
            };
            try { window.sessionStorage.setItem(PROJECT_ORIGIN_KEY, origin); } catch {}
            fileBrowserPath = 'public';
            fileBrowserPage = 1;
            updateProjectConnectionUI();
            log({ success: true, project: selectedProjectMetadata.name, default_branch: selectedProjectMetadata.default_branch },
                'PROJECT CONNECTED');
            await loadDirectory();
        }

        function getSelectedProjectHeader(headers) {
            const result = new Headers(headers || {});
            if (selectedProjectOrigin) result.set('X-DEKEKU-Project-Origin', selectedProjectOrigin);
            return result;
        }

        async function loadDirectory(path = fileBrowserPath, page = fileBrowserPage) {
            if (!selectedProjectOrigin) {
                log('Connect a trusted project Origin first.', 'PROJECT REQUIRED');
                return;
            }
            if (!jwtToken) {
                log('Login Admin before browsing project files.', 'AUTH REQUIRED');
                return;
            }
            const query = '?path=' + encodeURIComponent(path) + '&page=' + page + '&per_page=100';
            const result = await adminRequest('/api/v1/admin/browse' + query);
            if (result.status !== 200 || !result.data || result.data.success !== true ||
                !Array.isArray(result.data.items)) {
                document.getElementById('fileManagerStatus').textContent = 'Unable to load directory. Check the Response console.';
                return;
            }
            fileBrowserPath = result.data.path;
            fileBrowserPage = result.data.page;
            fileBrowserTotalPages = result.data.total_pages || 1;
            renderDirectoryItems(result.data.items);
            document.getElementById('fileCurrentPath').textContent = fileBrowserPath;
            document.getElementById('fileUpButton').disabled = fileBrowserPath === 'public';
            document.getElementById('newJsonButton').disabled =
                !fileBrowserPath.startsWith('public/data/') && fileBrowserPath !== 'public/data';
            document.getElementById('filePageLabel').textContent =
                'Page ' + fileBrowserPage + ' / ' + fileBrowserTotalPages;
            document.getElementById('filePrevButton').disabled = fileBrowserPage <= 1;
            document.getElementById('fileNextButton').disabled = fileBrowserPage >= fileBrowserTotalPages;
            document.getElementById('fileManagerStatus').textContent =
                result.data.total_items + ' entries' + (result.data.truncated ? ' · upstream listing is truncated at 1,000 entries' : '');
        }

        function renderDirectoryItems(items) {
            const body = document.getElementById('fileTableBody');
            body.replaceChildren();
            if (!items.length) {
                const row = document.createElement('tr');
                const cell = document.createElement('td');
                cell.colSpan = 5;
                cell.className = 'fm-muted';
                cell.textContent = 'This directory is empty.';
                row.appendChild(cell);
                body.appendChild(row);
                return;
            }
            for (const item of items) {
                const row = document.createElement('tr');
                const nameCell = document.createElement('td');
                const nameButton = document.createElement('button');
                nameButton.type = 'button';
                nameButton.className = 'fm-name';
                nameButton.textContent = (item.type === 'dir' ? '▸ ' : '▤ ') + item.name;
                if (item.type === 'dir') {
                    nameButton.addEventListener('click', () => loadDirectory(item.path, 1));
                } else {
                    nameButton.disabled = !(item.path.startsWith('public/data/') && item.name.toLowerCase().endsWith('.json'));
                    nameButton.addEventListener('click', () => openManagedFile(item.path));
                }
                nameCell.appendChild(nameButton);
                const typeCell = document.createElement('td');
                typeCell.textContent = item.type || 'unknown';
                const sizeCell = document.createElement('td');
                sizeCell.textContent = item.type === 'dir' ? '—' : String(item.size || 0) + ' B';
                const shaCell = document.createElement('td');
                shaCell.className = 'fm-muted';
                shaCell.textContent = item.sha ? item.sha.slice(0, 10) + '…' : '—';
                const actionCell = document.createElement('td');
                if (item.type === 'dir') {
                    const openButton = document.createElement('button');
                    openButton.type = 'button';
                    openButton.className = 'secondary';
                    openButton.textContent = 'Open';
                    openButton.addEventListener('click', () => loadDirectory(item.path, 1));
                    actionCell.appendChild(openButton);
                } else if (item.path.startsWith('public/data/') && item.name.toLowerCase().endsWith('.json')) {
                    const editButton = document.createElement('button');
                    editButton.type = 'button';
                    editButton.textContent = 'Edit';
                    editButton.addEventListener('click', () => openManagedFile(item.path));
                    actionCell.appendChild(editButton);
                } else {
                    actionCell.textContent = 'Read only';
                    actionCell.className = 'fm-muted';
                }
                row.append(nameCell, typeCell, sizeCell, shaCell, actionCell);
                body.appendChild(row);
            }
        }

        async function changeFilePage(offset) {
            const nextPage = fileBrowserPage + offset;
            if (nextPage < 1 || nextPage > fileBrowserTotalPages) return;
            await loadDirectory(fileBrowserPath, nextPage);
        }

        async function goUpDirectory() {
            if (fileBrowserPath === 'public') return;
            const parts = fileBrowserPath.split('/');
            parts.pop();
            await loadDirectory(parts.join('/') || 'public', 1);
        }

        function startCreateFile() {
            if (!fileBrowserPath.startsWith('public/data/') && fileBrowserPath !== 'public/data') {
                log('CREATE is only available inside public/data/.', 'PATH RESTRICTED');
                return;
            }
            managedFileMode = 'create';
            managedFilePath = '';
            document.getElementById('fileEditorTitle').textContent = 'Create JSON file';
            document.getElementById('fileEditorMeta').textContent = 'New file · public/data/';
            document.getElementById('newFileNameGroup').hidden = false;
            document.getElementById('newFileName').value = '';
            document.getElementById('fileJsonEditor').value = '{\n  \n}';
            document.getElementById('deleteFileButton').hidden = true;
            document.getElementById('fileEditor').hidden = false;
            document.getElementById('newFileName').focus();
        }

        async function openManagedFile(path) {
            if (!selectedProjectOrigin || !jwtToken) {
                log('Connect a project and login as Admin first.', 'AUTH REQUIRED');
                return;
            }
            const result = await adminRequest('/api/v1/admin/write/file?path=' + encodeURIComponent(path));
            if (result.status !== 200 || !result.data || result.data.success !== true ||
                !Object.prototype.hasOwnProperty.call(result.data, 'content')) return;
            managedFileMode = 'update';
            managedFilePath = result.data.path;
            document.getElementById('fileEditorTitle').textContent = 'Edit JSON file';
            document.getElementById('fileEditorMeta').textContent =
                managedFilePath + ' · ' + result.data.size + ' B · SHA ' + result.data.sha.slice(0, 10) + '…';
            document.getElementById('newFileNameGroup').hidden = true;
            document.getElementById('fileJsonEditor').value = JSON.stringify(result.data.content, null, 2);
            document.getElementById('deleteFileButton').hidden = false;
            document.getElementById('fileEditor').hidden = false;
            document.getElementById('fileEditor').scrollIntoView({ behavior: 'smooth', block: 'start' });
        }

        function closeFileEditor() {
            document.getElementById('fileEditor').hidden = true;
            managedFilePath = '';
        }

        function parseManagedJson() {
            let value;
            try { value = JSON.parse(document.getElementById('fileJsonEditor').value); }
            catch { throw new Error('JSON syntax is invalid.'); }
            if (typeof value !== 'object' || value === null) {
                throw new Error('JSON root must be an object or array.');
            }
            return value;
        }

        async function saveManagedFile() {
            if (!selectedProjectOrigin || !jwtToken) {
                log('Connect a project and login as Admin first.', 'AUTH REQUIRED');
                return;
            }
            let content;
            try { content = parseManagedJson(); }
            catch (err) { log(err.message, 'JSON VALIDATION ERROR'); return; }

            let path = managedFilePath;
            if (managedFileMode === 'create') {
                const name = document.getElementById('newFileName').value.trim();
                if (!/^[A-Za-z0-9][A-Za-z0-9._-]{0,94}\.json$/i.test(name)) {
                    log('File name must be a simple .json name without folders.', 'FILENAME INVALID');
                    return;
                }
                path = fileBrowserPath + '/' + name;
                const result = await adminRequest('/api/v1/admin/write/create', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ path, content })
                });
                if (result.status === 200 && result.data && result.data.success === true) {
                    closeFileEditor();
                    await loadDirectory(fileBrowserPath, fileBrowserPage);
                }
                return;
            }

            const shaResult = await adminRequest('/api/v1/admin/write/sha?path=' + encodeURIComponent(path));
            if (shaResult.status !== 200 || !shaResult.data || typeof shaResult.data.sha !== 'string') return;
            const result = await adminRequest('/api/v1/admin/write/update', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ path, content, sha: shaResult.data.sha })
            });
            if (result.status === 200 && result.data && result.data.success === true) {
                closeFileEditor();
                await loadDirectory(fileBrowserPath, fileBrowserPage);
            }
        }

        async function deleteManagedFile() {
            if (managedFileMode !== 'update' || !managedFilePath) return;
            if (!window.confirm('Delete ' + managedFilePath + '? This action cannot be undone.')) return;
            const shaResult = await adminRequest('/api/v1/admin/write/sha?path=' + encodeURIComponent(managedFilePath));
            if (shaResult.status !== 200 || !shaResult.data || typeof shaResult.data.sha !== 'string') return;
            const result = await adminRequest('/api/v1/admin/write/delete', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ path: managedFilePath, sha: shaResult.data.sha })
            });
            if (result.status === 200 && result.data && result.data.success === true) {
                closeFileEditor();
                await loadDirectory(fileBrowserPath, fileBrowserPage);
            }
        }

        function testWrite() {
            const method = document.getElementById('writeMethod').value;
            const path = document.getElementById('writePath').value;
            const contentRaw = document.getElementById('writeContent').value;
            const sha = document.getElementById('writeSha').value;

            let endpoint = '';
            if (method === 'POST') endpoint = '/api/v1/admin/write/create';
            else if (method === 'PUT') endpoint = '/api/v1/admin/write/update';
            else endpoint = '/api/v1/admin/write/delete';

            const body = { path };
            if (method !== 'DELETE') {
                try {
                    body.content = JSON.parse(contentRaw);
                } catch {
                    log('Invalid JSON content.', 'UI ERROR');
                    return;
                }
            }
            if (method !== 'POST') body.sha = sha;

            adminRequest(endpoint, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });
        }

        document.getElementById('apiOriginDisplay').innerText = API_ORIGIN;
        try {
            const savedProjectOrigin = window.sessionStorage.getItem(PROJECT_ORIGIN_KEY);
            if (savedProjectOrigin) {
                selectedProjectOrigin = normalizeProjectOrigin(savedProjectOrigin);
                document.getElementById('projectOriginInput').value = selectedProjectOrigin;
                updateProjectConnectionUI('Saved project Origin for this tab. Press Connect project to verify it.');
            }
        } catch {}
        userAccessToken = loadUserToken();
        updateTokenUI();
        updateUserSessionUI();

    
const sidebar=document.getElementById('sidebar');const mobileMenu=document.getElementById('mobileMenu');if(mobileMenu)mobileMenu.addEventListener('click',()=>sidebar.classList.toggle('open'));
document.querySelectorAll('.side-link,.toolbar a').forEach(link=>link.addEventListener('click',()=>{document.querySelectorAll('.side-link,.toolbar a').forEach(item=>item.classList.remove('active'));link.classList.add('active');if(window.innerWidth<=850)sidebar.classList.remove('open');}));
</script></body></html>`;

  return new Response(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "X-Content-Type-Options": "nosniff"
    }
  });
};
