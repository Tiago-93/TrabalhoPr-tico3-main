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
  details: document.getElementById('view-event-details'),
  agenda: document.getElementById('view-full-agenda')
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
let tempSessions = []; // Temp storage for sessions during event creation
let editingEventId = null; // To track which event we might be editing sessions for
let sessSpeakers = []; // Temp storage for speakers in the current session modal

const SPEAKERS_KEY = 'eh_speakers';
const getSpeakers = () => JSON.parse(localStorage.getItem(SPEAKERS_KEY) || '[]');
const saveSpeakers = (s) => localStorage.setItem(SPEAKERS_KEY, JSON.stringify(s));

// ── INITIALIZATION ──
document.addEventListener('DOMContentLoaded', () => {
  initRouting();
  initValidation();
  initToggles();
  initModals();
  initEventLogic();
  initDefaultSpeakers();
  checkSession();
});

function initDefaultSpeakers() {
  const speakers = getSpeakers();
  if (speakers.length === 0) {
    const defaults = [
      {
        id: 'spk1',
        nome: 'Dra. Ana Silva',
        bio: 'Especialista em Inteligência Artificial e Professora Catedrática no IST. Com mais de 15 anos de experiência, tem liderado projetos inovadores na área de Machine Learning.',
        contacto: 'ana.silva@exemplo.pt | linkedin.com/in/anasilva',
        foto: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&q=80'
      },
      {
        id: 'spk2',
        nome: 'Eng. Ricardo Pereira',
        bio: 'Arquiteto de Software na CloudTech. Especialista em infraestrutura escalável e micro-serviços. Orador habitual em conferências internacionais de tecnologia.',
        contacto: 'ricardo.p@cloudtech.com | @rpereira_tech',
        foto: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&q=80'
      },
      {
        id: 'spk3',
        nome: 'Maria João Santos',
        bio: 'Product Designer na DesignFlow. Focada em criar experiências de utilizador memoráveis e acessíveis. Mentora de UX/UI para startups.',
        contacto: 'mjsantos@designflow.io',
        foto: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&q=80'
      }
    ];
    saveSpeakers(defaults);
  }
}

// ── ROUTING ──
function showView(viewId, params = {}) {
  Object.values(views).forEach(v => v.classList.add('hidden'));
  views[viewId].classList.remove('hidden');

  // Close any open modals
  document.querySelectorAll('.modal-overlay').forEach(m => m.classList.add('hidden'));
  // Close search results
  const searchResults = document.getElementById('speaker-search-results');
  if (searchResults) searchResults.classList.add('hidden');

  // Update sidebar active state
  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.toggle('active', item.dataset.target === viewId);
  });

  window.scrollTo(0, 0);
  if (viewId === 'dashboard') populateDashboard(getSession());
  if (viewId === 'listEvents') populateEventsGrid();
  if (viewId === 'details') renderEventDetails(params.id);
  if (viewId === 'agenda') renderFullAgenda(params.id);
}

function initRouting() {
  document.getElementById('goLogin')?.addEventListener('click', e => { e.preventDefault(); showView('login'); });
  document.getElementById('goRegister')?.addEventListener('click', e => { e.preventDefault(); showView('register'); });
  document.getElementById('reg-goLogin')?.addEventListener('click', () => showView('login'));

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
  
  document.getElementById('btn-view-full-agenda').addEventListener('click', () => {
    const id = document.getElementById('ed-hero').dataset.eventId;
    showView('agenda', { id });
  });

  document.getElementById('btn-back-from-agenda').addEventListener('click', () => {
    const id = document.getElementById('ed-hero').dataset.eventId;
    showView('details', { id });
  });

  document.getElementById('btn-export-pdf').addEventListener('click', () => {
    window.print();
  });

  // Filters
  ['filter-day', 'filter-type', 'filter-speaker', 'filter-room'].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('change', () => {
        const evId = document.getElementById('ed-hero').dataset.eventId;
        renderFullAgenda(evId);
      });
    }
  });

  document.getElementById('ce-go-dash').addEventListener('click', () => {
    ceForm.classList.remove('hidden');
    document.getElementById('ce-success').classList.add('hidden');
    tempSessions = [];
    renderTempSessions();
    showView('dashboard');
  });

  // Session Modal
  document.getElementById('ce-add-session-btn').addEventListener('click', () => openSessionModal());
  document.getElementById('closeSessionModal').addEventListener('click', () => document.getElementById('sessionModal').classList.add('hidden'));
  document.getElementById('sessionForm').addEventListener('submit', handleSessionSubmit);
  document.getElementById('sess-tipo').addEventListener('change', (e) => {
    document.getElementById('lbl-sess-local').textContent = e.target.value === 'online' ? 'Link da Reunião *' : 'Sala / Local *';
  });
  document.getElementById('ed-add-session-inline').addEventListener('click', () => {
    const evId = document.getElementById('ed-hero').dataset.eventId;
    openSessionModal(evId);
  });

  // Speaker Logic
  document.getElementById('sess-speaker-search').addEventListener('input', handleSpeakerSearch);
  document.getElementById('btn-add-speaker-manual').addEventListener('click', () => document.getElementById('newSpeakerModal').classList.remove('hidden'));
  document.getElementById('closeNewSpeakerModal').addEventListener('click', () => document.getElementById('newSpeakerModal').classList.add('hidden'));
  document.getElementById('newSpeakerForm').addEventListener('submit', handleNewSpeakerSubmit);
  document.getElementById('closeProfileModal').addEventListener('click', () => document.getElementById('speakerProfileModal').classList.add('hidden'));

  // Close search results when clicking outside
  document.addEventListener('click', e => {
    const searchBox = document.querySelector('.speaker-search-box');
    const results = document.getElementById('speaker-search-results');
    if (searchBox && !searchBox.contains(e.target) && results) {
      results.classList.add('hidden');
    }
    
    // Close modals on clicking overlay
    if (e.target.classList.contains('modal-overlay')) {
      e.target.classList.add('hidden');
    }
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
    el.addEventListener('input', () => {
      clearField(el.id);
      if (el.id === 'ce-local') updateCreateMapPreview();
    });
  });
}

function updateCreateMapPreview() {
  const local = document.getElementById('ce-local').value.trim();
  const preview = document.getElementById('ce-map-preview');
  if (local && local.length > 3) {
    preview.src = `https://maps.google.com/maps?q=${encodeURIComponent(local)}&t=&z=13&ie=UTF8&iwloc=&output=embed`;
  } else {
    preview.src = 'about:blank';
  }
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

  if (dashName) dashName.textContent = firstName;
  if (sbName) sbName.textContent = s.nome;
  if (sbEmail) sbEmail.textContent = s.email;
  if (sbAvatar) sbAvatar.textContent = initials;
  if (sessUser) sessUser.textContent = s.nome;
  if (sessEmail) sessEmail.textContent = s.email;
  if (sessAt) sessAt.textContent = new Date(s.loginAt).toLocaleString('pt-PT');
  if (sessType) sessType.textContent = s.persistent ? 'Persistente (Lembrar-me)' : 'Temporária (Tab)';

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

  const elCount = document.getElementById('stat-events-count');
  const elBadge = document.getElementById('stat-events-badge');
  const elUpcoming = document.getElementById('stat-upcoming-count');
  const elPart = document.getElementById('stat-part-count');

  if (elCount) elCount.textContent = total;
  if (elBadge) elBadge.textContent = `+${events.length} este mês`;
  if (elUpcoming) elUpcoming.textContent = upcoming;
  if (elPart) elPart.textContent = (total * 25) + 12; // Just for visuals
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
  
  // Local & Map logic
  const localEl = document.getElementById('ed-local');
  const localFullEl = document.getElementById('ed-local-full');
  const localContainer = document.getElementById('ed-local-container');
  const mapSection = document.getElementById('ed-map-section');
  const mapFrame = document.getElementById('ed-map-frame');

  if (ev.local) {
    localEl.textContent = ev.local;
    localFullEl.textContent = ev.local;
    localContainer.classList.remove('hidden');
    mapSection.classList.remove('hidden');
    
    // Encode address for Google Maps embed (reliable no-key method)
    const encodedAddress = encodeURIComponent(ev.local);
    mapFrame.src = `https://maps.google.com/maps?q=${encodedAddress}&t=&z=13&ie=UTF8&iwloc=&output=embed`;
  } else {
    localContainer.classList.add('hidden');
    mapSection.classList.add('hidden');
  }

  // Link logic
  const linkEl = document.getElementById('ed-link');
  const linkUrlEl = document.getElementById('ed-link-url');
  const linkContainer = document.getElementById('ed-link-container');
  const linkSection = document.getElementById('ed-link-section');

  if (ev.link) {
    linkEl.href = ev.link;
    linkUrlEl.href = ev.link;
    linkUrlEl.textContent = ev.link;
    linkContainer.classList.remove('hidden');
    linkSection.classList.remove('hidden');
  } else {
    linkContainer.classList.add('hidden');
    linkSection.classList.add('hidden');
  }

  document.getElementById('ed-capac').textContent = ev.capac;

  const status = document.getElementById('ed-status');
  const isPast = new Date(ev.data) < new Date();
  status.className = `badge badge--${isPast ? 'done' : 'active'}`;
  status.textContent = isPast ? 'Concluído' : 'Publicado';

  const hero = document.getElementById('ed-hero');
  const img = ev.imgPreview || 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=1200&q=80';
  hero.style.backgroundImage = `url("${img}")`;
  hero.dataset.eventId = id;

  // Organizer info
  const orgName = ev.orgName || (getSession().nome);
  document.getElementById('ed-org-name').textContent = orgName;
  document.getElementById('ed-org-avatar').textContent = orgName.split(' ').map(n => n[0]).join('');

  // Agenda / Sessions
  renderAgenda(ev);
}

function renderAgenda(event) {
  const list = document.getElementById('ed-sessions-list');
  const addBtn = document.getElementById('ed-add-session-inline');
  const session = getSession();
  const isOrganizer = event.organizer === session?.userId;

  if (isOrganizer) addBtn.classList.remove('hidden');
  else addBtn.classList.add('hidden');

  if (!event.sessions || event.sessions.length === 0) {
    list.innerHTML = '<p class="empty-msg">Nenhuma sessão programada.</p>';
    return;
  }

  // Sort sessions by start time
  const sorted = [...event.sessions].sort((a, b) => a.inicio.localeCompare(b.inicio));

  list.innerHTML = sorted.map(s => `
    <div class="session-item">
      <div class="session-time">
        <span class="time-start">${s.inicio}</span>
        <span class="time-sep">-</span>
        <span class="time-end">${s.fim}</span>
      </div>
      <div class="session-info">
        <h4>${s.titulo}</h4>
        <p>${s.desc}</p>
        
        ${s.speakerIds && s.speakerIds.length > 0 ? `
          <div class="session-speakers">
            ${s.speakerIds.map(sid => {
              const spk = getSpeakers().find(x => x.id === sid);
              if (!spk) return '';
              const photo = spk.foto || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&q=80';
              return `
                <div class="speaker-badge" onclick="app.viewSpeaker('${spk.id}')" title="Ver perfil de ${spk.nome}">
                  <img src="${photo}" class="avatar-xs" alt="">
                  <span>${spk.nome}</span>
                </div>
              `;
            }).join('')}
          </div>
        ` : ''}

        <div class="session-meta">
          <span>${s.tipo === 'online' ? '🔗' : '📍'} ${s.local}</span>
          <span>👥 Máx: ${s.capacidade}</span>
        </div>
      </div>
      ${isOrganizer ? `
        <div class="session-actions">
          <button class="btn-icon" onclick="app.editSession('${event.id}', '${s.id}')" title="Editar">✏️</button>
          <button class="btn-icon btn-icon--danger" onclick="app.deleteSession('${event.id}', '${s.id}')" title="Eliminar">🗑️</button>
        </div>
      ` : ''}
    </div>
  `).join('');
}

function openSessionModal(eventId = null, sessionId = null) {
  const modal = document.getElementById('sessionModal');
  const form = document.getElementById('sessionForm');
  const title = document.getElementById('sessionModalTitle');
  const error = document.getElementById('sess-error');
  
  form.reset();
  error.textContent = '';
  editingEventId = eventId;
  sessSpeakers = [];
  
  if (sessionId) {
    title.textContent = 'Editar Sessão';
    const event = eventId ? getEvents().find(e => e.id === eventId) : null;
    const sess = event ? event.sessions.find(s => s.id === sessionId) : tempSessions.find(s => s.id === sessionId);
    
    if (sess) {
      document.getElementById('sess-id').value = sess.id;
      document.getElementById('sess-titulo').value = sess.titulo;
      document.getElementById('sess-desc').value = sess.desc;
      document.getElementById('sess-inicio').value = sess.inicio;
      document.getElementById('sess-fim').value = sess.fim;
      document.getElementById('sess-tipo').value = sess.tipo;
      document.getElementById('sess-capacidade').value = sess.capacidade;
      document.getElementById('sess-local').value = sess.local;
      document.getElementById('lbl-sess-local').textContent = sess.tipo === 'online' ? 'Link da Reunião *' : 'Sala / Local *';
      sessSpeakers = sess.speakerIds || [];
    }
  } else {
    title.textContent = 'Adicionar Sessão';
    document.getElementById('sess-id').value = '';
  }
  
  renderSessSpeakers();
  modal.classList.remove('hidden');
}

function handleSpeakerSearch(e) {
  const q = e.target.value.toLowerCase().trim();
  const results = document.getElementById('speaker-search-results');
  if (q.length < 2) { results.classList.add('hidden'); return; }

  const filtered = getSpeakers().filter(s => s.nome.toLowerCase().includes(q) && !sessSpeakers.includes(s.id));
  if (filtered.length === 0) { results.classList.add('hidden'); return; }

  results.innerHTML = filtered.map(s => `
    <div class="search-item" onclick="app.addSpeakerToSess('${s.id}')">
      <img src="${s.foto || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&q=80'}" class="avatar-xs" />
      <div class="search-item-info">
        <strong>${s.nome}</strong>
        <small>${s.contacto}</small>
      </div>
    </div>
  `).join('');
  results.classList.remove('hidden');
}

function renderSessSpeakers() {
  const container = document.getElementById('sess-speakers-list');
  const speakers = getSpeakers();
  container.innerHTML = sessSpeakers.map(id => {
    const s = speakers.find(x => x.id === id);
    return s ? `
      <div class="speaker-tag">
        <span>${s.nome}</span>
        <button type="button" onclick="app.removeSpeakerFromSess('${id}')">✕</button>
      </div>
    ` : '';
  }).join('');
}

function handleNewSpeakerSubmit(e) {
  e.preventDefault();
  const nome = document.getElementById('spk-nome').value.trim();
  const bio = document.getElementById('spk-bio').value.trim();
  const contacto = document.getElementById('spk-contacto').value.trim();
  const foto = document.getElementById('spk-foto').value.trim();

  const id = Math.random().toString(36).substr(2, 6);
  const speakers = getSpeakers();
  speakers.push({ id, nome, bio, contacto, foto });
  saveSpeakers(speakers);

  sessSpeakers.push(id);
  renderSessSpeakers();
  document.getElementById('newSpeakerModal').classList.add('hidden');
  document.getElementById('newSpeakerForm').reset();
}

function handleSessionSubmit(e) {
  e.preventDefault();
  const id = document.getElementById('sess-id').value || Math.random().toString(36).substr(2, 6);
  const titulo = document.getElementById('sess-titulo').value.trim();
  const desc = document.getElementById('sess-desc').value.trim();
  const inicio = document.getElementById('sess-inicio').value;
  const fim = document.getElementById('sess-fim').value;
  const tipo = document.getElementById('sess-tipo').value;
  const capacidade = parseInt(document.getElementById('sess-capacidade').value);
  const local = document.getElementById('sess-local').value.trim();
  const error = document.getElementById('sess-error');

  if (inicio >= fim) {
    error.textContent = 'A hora de fim deve ser após o início.';
    return;
  }

  const newSess = { id, titulo, desc, inicio, fim, tipo, capacidade, local, speakerIds: sessSpeakers };
  
  // Validation of conflicts
  const currentSessions = editingEventId ? (getEvents().find(e => e.id === editingEventId)?.sessions || []) : tempSessions;
  const otherSessions = currentSessions.filter(s => s.id !== id);
  
  const conflict = otherSessions.find(s => (inicio < s.fim) && (fim > s.inicio));
  if (conflict) {
    error.textContent = `Conflito de horário com a sessão: ${conflict.titulo}`;
    return;
  }

  if (editingEventId) {
    // Direct update of existing event
    const events = getEvents();
    const ev = events.find(e => e.id === editingEventId);
    if (ev) {
      const idx = ev.sessions ? ev.sessions.findIndex(s => s.id === id) : -1;
      if (idx > -1) ev.sessions[idx] = newSess;
      else {
        if (!ev.sessions) ev.sessions = [];
        ev.sessions.push(newSess);
      }
      saveEvents(events);
      renderAgenda(ev);
    }
  } else {
    // Update temp sessions for new event
    const idx = tempSessions.findIndex(s => s.id === id);
    if (idx > -1) tempSessions[idx] = newSess;
    else tempSessions.push(newSess);
    renderTempSessions();
  }

  document.getElementById('sessionModal').classList.add('hidden');
}

function renderTempSessions() {
  const list = document.getElementById('ce-sessions-list');
  if (tempSessions.length === 0) {
    list.classList.add('hidden');
    return;
  }
  
  list.classList.remove('hidden');
  const sorted = [...tempSessions].sort((a, b) => a.inicio.localeCompare(b.inicio));
  
  list.innerHTML = `
    <h4>Agenda Pré-visualização (${tempSessions.length} sessões)</h4>
    <div class="temp-sessions-grid">
      ${sorted.map(s => `
        <div class="temp-session-card">
          <div class="temp-sess-time">${s.inicio} - ${s.fim}</div>
          <div class="temp-sess-main">
            <strong>${s.titulo}</strong>
            <span>${s.tipo === 'online' ? '🔗' : '📍'} ${s.local}</span>
          </div>
          <div class="temp-sess-actions">
            <button type="button" onclick="app.editSession(null, '${s.id}')">✏️</button>
            <button type="button" onclick="app.deleteSession(null, '${s.id}')">🗑️</button>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

// Update Global helper
window.app = {
  visitEvent: (id) => showView('details', { id }),
  editSession: (eventId, sessionId) => openSessionModal(eventId, sessionId),
  deleteSession: (eventId, sessionId) => {
    if (!confirm('Deseja eliminar esta sessão?')) return;
    if (eventId) {
      const events = getEvents();
      const ev = events.find(e => e.id === eventId);
      if (ev) {
        ev.sessions = ev.sessions.filter(s => s.id !== sessionId);
        saveEvents(events);
        renderAgenda(ev);
      }
    } else {
      tempSessions = tempSessions.filter(s => s.id !== sessionId);
      renderTempSessions();
    }
  },
  addSpeakerToSess: (id) => {
    if (!sessSpeakers.includes(id)) {
      sessSpeakers.push(id);
      renderSessSpeakers();
    }
    document.getElementById('sess-speaker-search').value = '';
    document.getElementById('speaker-search-results').classList.add('hidden');
  },
  removeSpeakerFromSess: (id) => {
    sessSpeakers = sessSpeakers.filter(x => x !== id);
    renderSessSpeakers();
  },
  viewSpeaker: (id) => {
    const spk = getSpeakers().find(s => s.id === id);
    if (!spk) return;
    
    const events = getEvents();
    const speakerSessions = [];
    events.forEach(ev => {
      if (ev.sessions) {
        ev.sessions.forEach(sess => {
          if (sess.speakerIds && sess.speakerIds.includes(id)) {
            speakerSessions.push({ event: ev, session: sess });
          }
        });
      }
    });

    const modal = document.getElementById('speakerProfileModal');
    const content = document.getElementById('profile-content');
    
    content.innerHTML = `
      <div class="profile-header">
        <img src="${spk.foto || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&q=80'}" class="profile-avatar" />
        <div class="profile-info">
          <h2>${spk.nome}</h2>
          <p class="profile-bio">${spk.bio}</p>
          <div class="profile-contact">
            <strong>Contacto:</strong> ${spk.contacto}
          </div>
        </div>
      </div>
      <div class="profile-sessions">
        <h3>Sessões (${speakerSessions.length})</h3>
        <div class="profile-sessions-list">
          ${speakerSessions.length === 0 ? '<p>Nenhuma sessão associada ainda.</p>' : speakerSessions.map(item => `
            <div class="profile-sess-card" onclick="app.visitEvent('${item.event.id}')">
              <strong>${item.session.titulo}</strong>
              <span>${item.event.titulo}</span>
              <small>${item.session.inicio} - ${item.session.fim}</small>
            </div>
          `).join('')}
        </div>
      </div>
    `;
    
    modal.classList.remove('hidden');
  }
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
    const link = document.getElementById('ce-link').value.trim();
    const formato = document.getElementById('ce-formato').value;
    const capac = document.getElementById('ce-capacidade').value;
    const estado = ceForm.querySelector('input[name="ce-estado"]:checked').value;

    let valid = true;
    if (!titulo) valid = setFieldError('ce-titulo', 'Obrigatório.');
    if (!desc) valid = setFieldError('ce-desc', 'Obrigatório.');
    if (!data) valid = setFieldError('ce-data', 'Obrigatório.');
    else if (new Date(data) < new Date()) valid = setFieldError('ce-data', 'Data deve ser futura.');
    if (!local) valid = setFieldError('ce-local', 'Obrigatório.');
    // link is optional, but if present should be valid URL
    if (link && !link.startsWith('http')) valid = setFieldError('ce-link', 'URL inválido.');
    if (!formato) valid = setFieldError('ce-formato', 'Obrigatório.');
    if (!capac || capac < 1) valid = setFieldError('ce-capacidade', 'Inválido.');

    if (!valid) return;

    ceBtn.disabled = true;
    ceBtn.querySelector('.btn-text').classList.add('hidden');
    ceBtn.querySelector('.btn-spinner').classList.remove('hidden');

    await delay(1200);

    const eventId = Math.random().toString(36).substr(2, 6);
    const newEvent = {
      id: eventId, titulo, desc, data, local, link, formato, capac, estado,
      sessions: tempSessions,
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
    tempSessions = [];
    renderTempSessions();
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

// ── FULL AGENDA LOGIC ──
function renderFullAgenda(eventId) {
  const events = getEvents();
  // Ensure we have dummy data for testing if no events exist
  const dummy = [
    { 
      id: 'd1', 
      titulo: 'Workshop React', 
      data: '2026-05-15T10:00', 
      sessions: [
        { id: 's1', titulo: 'Abertura e Keynote', desc: 'Sessão de boas-vindas e apresentação dos temas principais.', inicio: '10:00', fim: '11:00', tipo: 'presencial', local: 'Auditório A', speakerIds: ['spk1'], capacidade: 100 },
        { id: 's2', titulo: 'Hooks Avançados', desc: 'Exploração profunda de useMemo, useCallback e hooks customizados.', inicio: '11:00', fim: '12:30', tipo: 'presencial', local: 'Auditório A', speakerIds: ['spk2'], capacidade: 50 },
        { id: 's3', titulo: 'CSS-in-JS vs Tailwind', desc: 'Painel de discussão sobre o futuro do styling em aplicações modernas.', inicio: '11:00', fim: '12:30', tipo: 'online', local: 'Zoom Room 1', speakerIds: ['spk3'], capacidade: 200 },
        { id: 's4', titulo: 'State Management 2026', desc: 'Zustand, Redux ou Context API? O que escolher.', inicio: '14:00', fim: '15:30', tipo: 'presencial', local: 'Sala B1', speakerIds: ['spk1', 'spk2'], capacidade: 40 }
      ] 
    }
  ];

  const ev = [...dummy, ...events].find(e => e.id === eventId);
  if (!ev) { showView('listEvents'); return; }

  document.getElementById('fa-event-title').textContent = ev.titulo;
  const dateObj = new Date(ev.data);
  document.getElementById('fa-event-date').textContent = dateObj.toLocaleDateString('pt-PT', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  const sessions = ev.sessions || [];
  const speakers = getSpeakers();

  // Populate Filters if empty
  const fSpeaker = document.getElementById('filter-speaker');
  const fRoom = document.getElementById('filter-room');
  
  if (fSpeaker.options.length <= 1) {
    const sessionSpeakerIds = [...new Set(sessions.flatMap(s => s.speakerIds || []))];
    sessionSpeakerIds.forEach(sid => {
      const spk = speakers.find(x => x.id === sid);
      if (spk) fSpeaker.add(new Option(spk.nome, sid));
    });
  }
  if (fRoom.options.length <= 1) {
    const rooms = [...new Set(sessions.map(s => s.local))];
    rooms.forEach(r => fRoom.add(new Option(r, r)));
  }

  // Filter Logic
  const valType = document.getElementById('filter-type').value;
  const valSpeaker = document.getElementById('filter-speaker').value;
  const valRoom = document.getElementById('filter-room').value;

  const filtered = sessions.filter(s => {
    if (valType !== 'all' && s.tipo !== valType) return false;
    if (valSpeaker !== 'all' && !(s.speakerIds || []).includes(valSpeaker)) return false;
    if (valRoom !== 'all' && s.local !== valRoom) return false;
    return true;
  });

  // Sort by time
  filtered.sort((a, b) => a.inicio.localeCompare(b.inicio));

  // Render Grid
  const grid = document.getElementById('agenda-calendar-grid');
  if (filtered.length === 0) {
    grid.innerHTML = `
      <div class="empty-state" style="padding: 60px; text-align: center;">
        <div class="success-icon" style="background: var(--surface-2); color: var(--text-muted);">🔍</div>
        <p>Nenhuma sessão corresponde aos filtros aplicados.</p>
        <button class="btn-text-sm" onclick="document.querySelectorAll('.agenda-filters select').forEach(s => s.value='all'); app.renderFullAgenda('${ev.id}')">Limpar Filtros</button>
      </div>
    `;
    return;
  }

  // Group by time slots
  const slots = {};
  filtered.forEach(s => {
    if (!slots[s.inicio]) slots[s.inicio] = [];
    slots[s.inicio].push(s);
  });

  grid.innerHTML = Object.entries(slots).sort((a,b) => a[0].localeCompare(b[0])).map(([time, sessList]) => `
    <div class="calendar-row">
      <div class="calendar-time">${time}</div>
      <div class="calendar-tracks">
        ${sessList.map(s => {
          const isParallel = sessList.length > 1;
          const sSpks = (s.speakerIds || []).map(sid => {
            const spk = speakers.find(x => x.id === sid);
            return spk ? `<span class="speaker-badge" onclick="event.stopPropagation(); app.viewSpeaker('${spk.id}')">${spk.nome}</span>` : '';
          }).join('');
          
          return `
            <div class="calendar-session-card" onclick="app.editSession('${ev.id}', '${s.id}')">
              ${isParallel ? '<span class="parallel-indicator">Paralela</span>' : ''}
              <h3>${s.titulo}</h3>
              <p>${s.desc}</p>
              <div class="card-meta-info">
                <span>${s.tipo === 'online' ? '🔗' : '📍'} ${s.local}</span>
                <div class="session-speakers" style="margin-top:0;">${sSpks}</div>
                <span title="Capacidade">👥 ${s.capacidade}</span>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `).join('');
}

// Add to window.app for filter cleaning
window.app.renderFullAgenda = renderFullAgenda;