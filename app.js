  /* ============================================================
   EventHub — Lógica Unificada (app.js)
   SPA: Register, Login, Dashboard, Recovery, Create Event, List, Details
   ============================================================ */

'use strict';

// ── CONFIG & STATE ──
const USERS_KEY = 'eventhub_users';
const SESSION_KEY = 'eventhub_session';
const EVENTS_KEY = 'eventhub_events';

// ── DOM ELEMENTS: VIEWS ──
const views = {
  register: document.getElementById('view-register'),
  login: document.getElementById('view-login'),
  dashboard: document.getElementById('view-dashboard'),
  createEvent: document.getElementById('view-create-event'),
  listEvents: document.getElementById('view-list-events'),
  details: document.getElementById('view-event-details')
};

// ── DOM ELEMENTS: REGISTO ──
const regForm = document.getElementById('registerForm');
const regBtn = document.getElementById('reg-btn');
const regNome = document.getElementById('reg-nome');
const regEmail = document.getElementById('reg-email');
const regPw = document.getElementById('reg-pw');
const regCpw = document.getElementById('reg-cpw');
const regSF = document.getElementById('reg-sf');
const regSL = document.getElementById('reg-sl');

// ── DOM ELEMENTS: LOGIN ──
const loginForm = document.getElementById('loginForm');
const loginBtn = document.getElementById('login-btn');
const loginEmail = document.getElementById('login-email');
const loginPw = document.getElementById('login-pw');
const rememberMe = document.getElementById('rememberMe');
const loginAlert = document.getElementById('loginAlert');
const loginAlertM = document.getElementById('loginAlertMsg');

// ── DOM ELEMENTS: DASHBOARD ──
const dashName = document.getElementById('dash-name');
const sbName = document.getElementById('sb-name');
const sbEmail = document.getElementById('sb-email');
const sbAvatar = document.getElementById('sb-avatar');
const sessUser = document.getElementById('sess-user');
const sessEmail = document.getElementById('sess-email');
const sessAt = document.getElementById('sess-at');
const sessType = document.getElementById('sess-type');

// ── DOM ELEMENTS: CRIAR EVENTO ──
const ceForm = document.getElementById('createEventForm');
const ceBtn = document.getElementById('ce-submit-btn');
const ceImgInput = document.getElementById('ce-imagem');
const ceImgPreview = document.getElementById('ce-img-preview');
const ceUploadUI = document.getElementById('ce-upload-ui');
const ceDropzone = document.getElementById('ce-img-dropzone');

// ── INITIALIZATION ──
document.addEventListener('DOMContentLoaded', () => {
  initRouting();
  initValidation();
  initToggles();
  initModals();
  initEventLogic();
  checkSession();
});

// ── ROUTING ──
function showView(viewId, params = {}) {
  Object.values(views).forEach(v => v.classList.add('hidden'));
  views[viewId].classList.remove('hidden');

  // Update sidebar active state
  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.toggle('active', item.dataset.target === viewId);
  });

  window.scrollTo(0, 0);
  if (viewId === 'dashboard') populateDashboard(getSession());
  if (viewId === 'listEvents') populateEventsGrid();
  if (viewId === 'details') renderEventDetails(params.id);
}

function initRouting() {
  document.getElementById('goLogin').addEventListener('click', e => { e.preventDefault(); showView('login'); });
  document.getElementById('goRegister').addEventListener('click', e => { e.preventDefault(); showView('register'); });
  document.getElementById('reg-goLogin').addEventListener('click', () => showView('login'));

  // Handle ALL sidebar and navigation links with data-target
  document.addEventListener('click', e => {
    const target = e.target.closest('[data-target]');
    if (target) {
      e.preventDefault();
      showView(target.dataset.target);
    }
  });

  document.getElementById('btn-nav-create').addEventListener('click', () => showView('createEvent'));
  document.getElementById('btn-nav-create-le').addEventListener('click', () => showView('createEvent'));
  document.getElementById('nav-back-dash')?.addEventListener('click', e => { e.preventDefault(); showView('dashboard'); });
  document.getElementById('btn-cancel-create').addEventListener('click', () => showView('dashboard'));
  document.getElementById('btn-back-from-details').addEventListener('click', () => showView('listEvents'));

  document.getElementById('ce-go-dash').addEventListener('click', () => {
    ceForm.classList.remove('hidden');
    document.getElementById('ce-success').classList.add('hidden');
    showView('dashboard');
  });
}

function checkSession() {
  const session = getSession();
  if (session) {
    populateDashboard(session);
    showView('dashboard');
  } else {
    showView('register');
  }
}

// ── UTILS ──
const getUsers = () => JSON.parse(localStorage.getItem(USERS_KEY)) || [];
const saveUsers = (users) => localStorage.setItem(USERS_KEY, JSON.stringify(users));
const getEvents = () => JSON.parse(localStorage.getItem(EVENTS_KEY)) || [];
const saveEvents = (events) => localStorage.setItem(EVENTS_KEY, JSON.stringify(events));
const getSession = () => JSON.parse(sessionStorage.getItem(SESSION_KEY)) || JSON.parse(localStorage.getItem(SESSION_KEY));
const delay = (ms) => new Promise(res => setTimeout(res, ms));

function hashPassword(pw) {
  let hash = 0;
  for (let i = 0; i < pw.length; i++) hash = (Math.imul(31, hash) + pw.charCodeAt(i)) | 0;
  return `h_${hash.toString(36)}_${pw.length}`;
}

// ── FIELD STATES ──
function setFieldError(id, msg) {
  const grp = document.getElementById(`grp-${id}`);
  const err = document.getElementById(`err-${id}`);
  if (grp) { grp.classList.remove('is-valid'); grp.classList.add('is-error'); }
  if (err) err.textContent = msg;
  return false;
}

function setFieldValid(id) {
  const grp = document.getElementById(`grp-${id}`);
  const err = document.getElementById(`err-${id}`);
  if (grp) { grp.classList.remove('is-error'); grp.classList.add('is-valid'); }
  if (err) err.textContent = '';
  return true;
}

function clearField(id) {
  const grp = document.getElementById(`grp-${id}`);
  const err = document.getElementById(`err-${id}`);
  if (grp) grp.classList.remove('is-error', 'is-valid');
  if (err) err.textContent = '';
}

// ── VALIDATION ──
function initValidation() {
  regNome.addEventListener('blur', valRegNome);
  regEmail.addEventListener('blur', valRegEmail);
  regPw.addEventListener('input', valRegPw);
  regCpw.addEventListener('input', valRegCpw);

  [regNome, regEmail, loginEmail, loginPw].forEach(el => {
    el.addEventListener('input', () => {
      const id = el.id.replace('login-', 'login-').replace('reg-', 'reg-');
      clearField(id);
      if (id.startsWith('login')) loginAlert.classList.add('hidden');
    });
  });

  ceForm.querySelectorAll('input, textarea, select').forEach(el => {
    el.addEventListener('input', () => clearField(el.id));
  });
}

function valRegNome() {
  const val = regNome.value.trim();
  if (!val) return setFieldError('reg-nome', 'Nome obrigatório.');
  if (val.length < 3 || !val.includes(' ')) return setFieldError('reg-nome', 'Introduza nome e apelido.');
  return setFieldValid('reg-nome');
}

function valRegEmail() {
  const val = regEmail.value.trim().toLowerCase();
  if (!val) return setFieldError('reg-email', 'Email obrigatório.');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(val)) return setFieldError('reg-email', 'Formato inválido.');
  if (getUsers().some(u => u.email === val)) return setFieldError('reg-email', 'Email já registado.');
  return setFieldValid('reg-email');
}

function valRegPw() {
  const val = regPw.value;
  const hasLen = val.length >= 8;
  const hasLet = /[a-zA-Z]/.test(val);
  const hasNum = /\d/.test(val);

  document.getElementById('req-len').classList.toggle('ok', hasLen);
  document.getElementById('req-letter').classList.toggle('ok', hasLet);
  document.getElementById('req-number').classList.toggle('ok', hasNum);

  let score = 0;
  if (hasLen) score++; if (hasLet) score++; if (hasNum) score++;
  if (val.length >= 12 && /[^a-zA-Z0-9]/.test(val)) score++;

  const levels = [
    { cls: '', lbl: '' }, { cls: 's1', lbl: 'Fraca', col: '#f43f5e' },
    { cls: 's2', lbl: 'Média', col: '#f59e0b' }, { cls: 's3', lbl: 'Boa', col: '#84cc16' },
    { cls: 's4', lbl: 'Forte', col: '#22c55e' }
  ];
  const lvl = levels[Math.min(score, 4)];
  regSF.className = `strength-fill ${lvl.cls}`;
  regSL.textContent = lvl.lbl;
  regSL.style.color = lvl.col || '';

  if (!hasLen || !hasLet || !hasNum) return setFieldError('reg-pw', '');
  return setFieldValid('reg-pw');
}

function valRegCpw() {
  if (!regCpw.value) return setFieldError('reg-cpw', 'Confirmação obrigatória.');
  if (regCpw.value !== regPw.value) return setFieldError('reg-cpw', 'As passwords não coincidem.');
  return setFieldValid('reg-cpw');
}

// ── REGISTO SUBMIT ──
regForm.addEventListener('submit', async e => {
  e.preventDefault();
  if (!valRegNome() || !valRegEmail() || !valRegPw() || !valRegCpw()) return;

  regBtn.disabled = true;
  regBtn.querySelector('.btn-text').classList.add('hidden');
  regBtn.querySelector('.btn-spinner').classList.remove('hidden');

  await delay(1000);

  const newUser = {
    id: Date.now().toString(36),
    nome: regNome.value.trim(),
    email: regEmail.value.trim().toLowerCase(),
    pw: hashPassword(regPw.value),
    created: new Date().toISOString()
  };

  const users = getUsers();
  users.push(newUser);
  saveUsers(users);

  document.getElementById('reg-confirmedEmail').textContent = newUser.email;
  document.getElementById('reg-confirmedName').textContent = newUser.nome.split(' ')[0];
  document.getElementById('reg-form').classList.add('hidden');
  document.getElementById('reg-success').classList.remove('hidden');
});

// ── LOGIN SUBMIT ──
loginForm.addEventListener('submit', async e => {
  e.preventDefault();
  const email = loginEmail.value.trim().toLowerCase();
  const pw = loginPw.value;

  if (!email) return setFieldError('login-email', 'Obrigatório.');
  if (!pw) return setFieldError('login-pw', 'Obrigatório.');

  loginBtn.disabled = true;
  loginBtn.querySelector('.btn-text').classList.add('hidden');
  loginBtn.querySelector('.btn-spinner').classList.remove('hidden');

  await delay(1000);

  const user = getUsers().find(u => u.email === email && u.pw === hashPassword(pw));

  if (!user) {
    loginBtn.disabled = false;
    loginBtn.querySelector('.btn-text').classList.remove('hidden');
    loginBtn.querySelector('.btn-spinner').classList.add('hidden');
    loginAlert.classList.remove('hidden');
    loginAlertM.textContent = 'Credenciais inválidas. Tente novamente.';
    return;
  }

  const session = {
    userId: user.id,
    nome: user.nome,
    email: user.email,
    loginAt: new Date().toISOString(),
    persistent: rememberMe.checked
  };

  if (rememberMe.checked) localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  else sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));

  populateDashboard(session);
  showView('dashboard');

  loginBtn.disabled = false;
  loginBtn.querySelector('.btn-text').classList.remove('hidden');
  loginBtn.querySelector('.btn-spinner').classList.add('hidden');
  loginForm.reset();
});

// ── DASHBOARD & POPULATION ──
function populateDashboard(s) {
  if (!s) return;
  const firstName = s.nome.split(' ')[0];
  const initials = s.nome.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();

  const syncSB = (idPrefix) => {
    const n = document.getElementById(`sb-name-${idPrefix}`);
    const e = document.getElementById(`sb-email-${idPrefix}`);
    const a = document.getElementById(`sb-avatar-${idPrefix}`);
    if (n) n.textContent = s.nome;
    if (e) e.textContent = s.email;
    if (a) a.textContent = initials;
  };

  dashName.textContent = firstName;
  sbName.textContent = s.nome;
  sbEmail.textContent = s.email;
  sbAvatar.textContent = initials;
  sessUser.textContent = s.nome;
  sessEmail.textContent = s.email;
  sessAt.textContent = new Date(s.loginAt).toLocaleString('pt-PT');
  sessType.textContent = s.persistent ? 'Persistente (Lembrar-me)' : 'Temporária (Tab)';

  syncSB('ce'); syncSB('le');

  updateStats();
  populateEventsTable();

  const hour = new Date().getHours();
  let greet = 'Bom dia';
  if (hour >= 12) greet = 'Boa tarde';
  if (hour >= 19) greet = 'Boa noite';
  document.querySelector('.dash-title').innerHTML = `${greet}, <span id="dash-name">${firstName}</span>! 👋`;
}

function updateStats() {
  const events = getEvents();
  const dummy = [{}, {}]; // Simulate 2 dummy events
  const total = events.length + dummy.length;
  const upcoming = events.filter(e => new Date(e.data) > new Date()).length + dummy.length;

  document.getElementById('stat-events-count').textContent = total;
  document.getElementById('stat-events-badge').textContent = `+${events.length} este mês`;
  document.getElementById('stat-upcoming-count').textContent = upcoming;
  document.getElementById('stat-part-count').textContent = (total * 25) + 12; // Just for visuals
}

function populateEventsTable() {
  const tbody = document.getElementById('events-table-body');
  if (!tbody) return;
  const events = getEvents();
  const dummy = [
    { titulo: 'Workshop React', data: '2026-05-15T10:00', capac: 42, estado: 'publicado' },
    { titulo: 'Conferência UX', data: '2026-05-22T09:30', capac: 130, estado: 'publicado' }
  ];
  const all = [...dummy, ...events].slice(-6).reverse();
  tbody.innerHTML = all.map(ev => {
    const d = new Date(ev.data);
    const dateStr = d.toLocaleDateString('pt-PT', { day: '2-digit', month: 'short' });
    const isPast = d < new Date();
    const statusCls = ev.estado === 'rascunho' ? 'pending' : (isPast ? 'done' : 'active');
    const statusLbl = ev.estado === 'rascunho' ? 'Rascunho' : (isPast ? 'Concluído' : 'Ativo');
    return `<tr><td><strong>${ev.titulo}</strong></td><td>${dateStr}</td><td>${ev.capac || 0}</td><td><span class="badge badge--${statusCls}">${statusLbl}</span></td></tr>`;
  }).join('');
}

function populateEventsGrid() {
  const grid = document.getElementById('events-grid');
  if (!grid) return;
  const events = getEvents();
  const dummy = [
    { id: 'd1', titulo: 'Workshop React', desc: 'Aprenda as bases do React e Hooks modernos.', data: '2026-05-15T10:00', local: 'Online', formato: 'online', capac: 50, estado: 'publicado' },
    { id: 'd2', titulo: 'Conferência UX 2026', desc: 'As tendências de design para o próximo ano.', data: '2026-05-22T09:30', local: 'Lisboa', formato: 'presencial', capac: 200, estado: 'publicado' }
  ];
  const all = [...dummy, ...events];
  grid.innerHTML = all.map(ev => {
    const d = new Date(ev.data);
    const dateStr = d.toLocaleString('pt-PT', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
    const isPast = d < new Date();
    const statusCls = ev.estado === 'rascunho' ? 'pending' : (isPast ? 'done' : 'active');
    const statusLbl = ev.estado === 'rascunho' ? 'Rascunho' : (isPast ? 'Concluído' : 'Ativo');
    const imgUrl = ev.imgPreview || 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=500&q=80';

    return `
      <article class="event-card fade-up" onclick="app.visitEvent('${ev.id}')">
        <div class="card-img">
          <img src="${imgUrl}" alt="${ev.titulo}">
          <div class="card-status"><span class="badge badge--${statusCls}">${statusLbl}</span></div>
        </div>
        <div class="card-body">
          <h3>${ev.titulo}</h3>
          <p>${ev.desc}</p>
          <div class="card-meta">
            <div class="meta-item">📅 ${dateStr}</div>
            <div class="meta-item">📍 ${ev.local}</div>
          </div>
        </div>
      </article>
    `;
  }).join('');
}

function renderEventDetails(id) {
  const events = getEvents();
  const dummy = [
    { id: 'd1', titulo: 'Workshop React', desc: 'Aprenda as bases do React e Hooks modernos. Neste workshop prático, vamos construir uma aplicação do zero usando as melhores práticas da indústria.', data: '2026-05-15T10:00', local: 'Online', formato: 'online', capac: 50, estado: 'publicado', orgName: 'Admin EventHub' },
    { id: 'd2', titulo: 'Conferência UX 2026', desc: 'As tendências de design para o próximo ano. Palestras com designers seniores de empresas como Google, Meta e Spotify.', data: '2026-05-22T09:30', local: 'Auditório Lisboa', formato: 'presencial', capac: 200, estado: 'publicado', orgName: 'Admin EventHub' }
  ];

  let ev = [...dummy, ...events].find(e => e.id === id);
  if (!ev) { showView('listEvents'); return; }

  // Populate UI
  document.getElementById('ed-titulo').textContent = ev.titulo;
  document.getElementById('ed-desc').textContent = ev.desc;
  document.getElementById('ed-data').textContent = new Date(ev.data).toLocaleString('pt-PT');
  document.getElementById('ed-local').textContent = ev.local;
  document.getElementById('ed-local-full').textContent = ev.local;
  document.getElementById('ed-capac').textContent = ev.capac;

  const status = document.getElementById('ed-status');
  const isPast = new Date(ev.data) < new Date();
  status.className = `badge badge--${isPast ? 'done' : 'active'}`;
  status.textContent = isPast ? 'Concluído' : 'Publicado';

  const hero = document.getElementById('ed-hero');
  const img = ev.imgPreview || 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=1200&q=80';
  hero.style.backgroundImage = `url("${img}")`;

  // Organizer info
  const orgName = ev.orgName || (getSession().nome);
  document.getElementById('ed-org-name').textContent = orgName;
  document.getElementById('ed-org-avatar').textContent = orgName.split(' ').map(n => n[0]).join('');
}

// Global helper for onclick
window.app = {
  visitEvent: (id) => showView('details', { id })
};

function logout() {
  localStorage.removeItem(SESSION_KEY);
  sessionStorage.removeItem(SESSION_KEY);
  showView('login');
}

document.getElementById('logoutBtn').addEventListener('click', logout);
document.getElementById('logoutBtnTop').addEventListener('click', logout);
document.getElementById('logoutBtnCard').addEventListener('click', logout);

// ── EVENT LOGIC ──
function initEventLogic() {
  ceDropzone.addEventListener('click', () => ceImgInput.click());
  ceImgInput.addEventListener('change', e => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = e => {
        ceImgPreview.src = e.target.result;
        ceImgPreview.classList.remove('hidden');
        ceUploadUI.classList.add('hidden');
        ceForm.dataset.img = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  });

  ceForm.addEventListener('submit', async e => {
    e.preventDefault();
    const titulo = document.getElementById('ce-titulo').value.trim();
    const desc = document.getElementById('ce-desc').value.trim();
    const data = document.getElementById('ce-data').value;
    const local = document.getElementById('ce-local').value.trim();
    const formato = document.getElementById('ce-formato').value;
    const capac = document.getElementById('ce-capacidade').value;
    const estado = ceForm.querySelector('input[name="ce-estado"]:checked').value;

    let valid = true;
    if (!titulo) valid = setFieldError('ce-titulo', 'Obrigatório.');
    if (!desc) valid = setFieldError('ce-desc', 'Obrigatório.');
    if (!data) valid = setFieldError('ce-data', 'Obrigatório.');
    else if (new Date(data) < new Date()) valid = setFieldError('ce-data', 'Data deve ser futura.');
    if (!local) valid = setFieldError('ce-local', 'Obrigatório.');
    if (!formato) valid = setFieldError('ce-formato', 'Obrigatório.');
    if (!capac || capac < 1) valid = setFieldError('ce-capacidade', 'Inválido.');

    if (!valid) return;

    ceBtn.disabled = true;
    ceBtn.querySelector('.btn-text').classList.add('hidden');
    ceBtn.querySelector('.btn-spinner').classList.remove('hidden');

    await delay(1200);

    const eventId = Math.random().toString(36).substr(2, 6);
    const newEvent = {
      id: eventId, titulo, desc, data, local, formato, capac, estado,
      imgPreview: ceForm.dataset.img || null,
      url: `https://eventhub.com/e/${eventId}`,
      organizer: getSession().userId,
      createdAt: new Date().toISOString()
    };

    const events = getEvents();
    events.push(newEvent);
    saveEvents(events);

    document.getElementById('ce-event-url').textContent = newEvent.url;
    // Add click to visit event directly from success
    document.getElementById('ce-event-url').style.cursor = 'pointer';
    document.getElementById('ce-event-url').onclick = () => window.app.visitEvent(eventId);

    ceForm.classList.add('hidden');
    document.getElementById('ce-success').classList.remove('hidden');

    ceBtn.disabled = false;
    ceBtn.querySelector('.btn-text').classList.remove('hidden');
    ceBtn.querySelector('.btn-spinner').classList.add('hidden');
    ceForm.reset();
    delete ceForm.dataset.img;
    ceImgPreview.classList.add('hidden');
    ceUploadUI.classList.remove('hidden');
  });
}

// ── UI TOGGLES ──
function initToggles() {
  document.querySelectorAll('.toggle-pw').forEach(btn => {
    btn.addEventListener('click', () => {
      const input = document.getElementById(btn.dataset.target);
      const isPw = input.type === 'password';
      input.type = isPw ? 'text' : 'password';
      btn.textContent = isPw ? '🔒' : '👁';
    });
  });
}

// ── MODALS ──
function initModals() {
  const modal = document.getElementById('recoverModal');
  const recoverForm = document.getElementById('recover-form-div');
  const recoverSucc = document.getElementById('recover-success-div');
  document.getElementById('forgotPwLink').addEventListener('click', e => {
    e.preventDefault(); modal.classList.remove('hidden'); recoverForm.classList.remove('hidden'); recoverSucc.classList.add('hidden');
  });
  const close = () => modal.classList.add('hidden');
  document.getElementById('closeModal').addEventListener('click', close);
  document.getElementById('closeRecoverSuccess').addEventListener('click', close);
  modal.addEventListener('click', e => { if (e.target === modal) close(); });
  document.getElementById('sendRecoverBtn').addEventListener('click', async () => {
    const email = document.getElementById('recoverEmail').value.trim();
    if (!email || !email.includes('@')) return setFieldError('recover-email', 'Introduza um email válido.');
    const btn = document.getElementById('sendRecoverBtn');
    btn.disabled = true; btn.querySelector('.btn-spinner').classList.remove('hidden');
    await delay(1200);
    document.getElementById('recoverSentTo').textContent = email;
    recoverForm.classList.add('hidden'); recoverSucc.classList.remove('hidden');
    btn.disabled = false; btn.querySelector('.btn-spinner').classList.add('hidden');
  });
}
