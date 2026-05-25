'use strict';

const USERS_KEY = 'eventhub_users';
const SESSION_KEY = 'eventhub_session';
const EVENTS_KEY = 'eventhub_events';
const REGISTRATIONS_KEY = 'eventhub_registrations';

const views = {
  register: document.getElementById('view-register'),
  login: document.getElementById('view-login'),
  dashboard: document.getElementById('view-dashboard'),
  createEvent: document.getElementById('view-create-event'),
  listEvents: document.getElementById('view-list-events'),
  details: document.getElementById('view-event-details'),
<<<<<<< HEAD
  profile: document.getElementById('view-profile')
=======
  agenda: document.getElementById('view-full-agenda')
>>>>>>> 1b44220a63e13055672c6f0a336dba79992075c8
};

let tempSessions = [];
let editingEventId = null;

const getUsers = () => JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
const saveUsers = (users) => localStorage.setItem(USERS_KEY, JSON.stringify(users));
const getEvents = () => JSON.parse(localStorage.getItem(EVENTS_KEY) || '[]');
const saveEvents = (events) => localStorage.setItem(EVENTS_KEY, JSON.stringify(events));
const getRegistrations = () => JSON.parse(localStorage.getItem(REGISTRATIONS_KEY) || '[]');
const saveRegistrations = (regs) => localStorage.setItem(REGISTRATIONS_KEY, JSON.stringify(regs));
const getSession = () => JSON.parse(sessionStorage.getItem(SESSION_KEY) || 'null') || JSON.parse(localStorage.getItem(SESSION_KEY) || 'null');
const delay = (ms) => new Promise((res) => setTimeout(res, ms));

document.addEventListener('DOMContentLoaded', () => {
  seedEvents();
  initRouting();
  initValidation();
  initAuth();
  initEventLogic();
  initSessionModal();
  initRecovery();
  checkSession();
});

<<<<<<< HEAD
=======
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

>>>>>>> 1b44220a63e13055672c6f0a336dba79992075c8
function hashPassword(pw) {
  let hash = 0;
  for (let i = 0; i < pw.length; i++) hash = (Math.imul(31, hash) + pw.charCodeAt(i)) | 0;
  return `h_${hash.toString(36)}_${pw.length}`;
}

function seedEvents() {
  if (getEvents().length > 0) return;
  saveEvents([
    {
      id: 'd1',
      titulo: 'Workshop React',
      desc: 'Aprenda as bases do React e Hooks modernos num workshop pratico.',
      data: '2026-06-15T10:00',
      local: 'Online',
      formato: 'online',
      capac: 50,
      estado: 'publicado',
      orgName: 'Admin EventHub',
      organizer: 'admin',
      imgPreview: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=1200&q=80',
      sessions: [
        { id: 's1', titulo: 'Abertura e Keynote', desc: 'Boas-vindas e apresentacao dos temas principais.', inicio: '10:00', fim: '11:00', tipo: 'online', local: 'Zoom Room 1', capacidade: 50 },
        { id: 's2', titulo: 'Hooks Avancados', desc: 'Exploracao de useMemo, useCallback e hooks customizados.', inicio: '11:15', fim: '12:30', tipo: 'online', local: 'Zoom Room 1', capacidade: 50 }
      ]
    },
    {
      id: 'd2',
      titulo: 'Conferencia UX 2026',
      desc: 'Tendencias de design para o proximo ano com palestras e paineis.',
      data: '2026-06-22T09:30',
      local: 'Auditorio Lisboa',
      formato: 'presencial',
      capac: 120,
      estado: 'publicado',
      orgName: 'Admin EventHub',
      organizer: 'admin',
      imgPreview: 'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=1200&q=80',
      sessions: []
    }
  ]);
}

function showView(viewId, params = {}) {
  Object.values(views).forEach((v) => v?.classList.add('hidden'));
  views[viewId]?.classList.remove('hidden');

  document.querySelectorAll('.modal-overlay').forEach((m) => m.classList.add('hidden'));
  document.querySelectorAll('.nav-item').forEach((item) => item.classList.toggle('active', item.dataset.target === viewId));
  window.scrollTo(0, 0);

  if (viewId === 'dashboard') populateDashboard(getSession());
  if (viewId === 'listEvents') populateEventsGrid();
  if (viewId === 'details') renderEventDetails(params.id);
  if (viewId === 'profile') renderRegistrationHistory('profile-registration-history');
}

function initRouting() {
  document.getElementById('goLogin')?.addEventListener('click', (e) => { e.preventDefault(); showView('login'); });
  document.getElementById('goRegister')?.addEventListener('click', (e) => { e.preventDefault(); showView('register'); });
  document.getElementById('reg-goLogin')?.addEventListener('click', () => showView('login'));

  document.addEventListener('click', (e) => {
    const target = e.target.closest('[data-target]');
    if (!target) return;
    e.preventDefault();
    showView(target.dataset.target);
  });

  document.getElementById('btn-nav-create')?.addEventListener('click', () => showView('createEvent'));
  document.getElementById('btn-nav-create-le')?.addEventListener('click', () => showView('createEvent'));
  document.getElementById('btn-cancel-create')?.addEventListener('click', () => showView('dashboard'));
  document.getElementById('btn-back-from-details')?.addEventListener('click', () => showView('listEvents'));
  document.getElementById('logoutBtnTop')?.addEventListener('click', logout);
  document.getElementById('ce-go-dash')?.addEventListener('click', () => {
    document.getElementById('createEventForm').classList.remove('hidden');
    document.getElementById('ce-success').classList.add('hidden');
    tempSessions = [];
    renderTempSessions();
    showView('dashboard');
  });
}

function checkSession() {
  const session = getSession();
  if (session) showView('dashboard');
  else showView('register');
}

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

function initValidation() {
  document.querySelectorAll('input, textarea, select').forEach((el) => {
    el.addEventListener('input', () => clearField(el.id));
  });
}

function valRegNome() {
  const val = document.getElementById('reg-nome').value.trim();
  if (!val) return setFieldError('reg-nome', 'Nome obrigatorio.');
  if (val.length < 3 || !val.includes(' ')) return setFieldError('reg-nome', 'Introduza nome e apelido.');
  return setFieldValid('reg-nome');
}

function valRegEmail() {
  const val = document.getElementById('reg-email').value.trim().toLowerCase();
  if (!val) return setFieldError('reg-email', 'Email obrigatorio.');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(val)) return setFieldError('reg-email', 'Formato invalido.');
  if (getUsers().some((u) => u.email === val)) return setFieldError('reg-email', 'Email ja registado.');
  return setFieldValid('reg-email');
}

function valRegPw() {
  const val = document.getElementById('reg-pw').value;
  if (val.length < 8 || !/[a-zA-Z]/.test(val) || !/\d/.test(val)) return setFieldError('reg-pw', 'Minimo 8 caracteres, uma letra e um numero.');
  return setFieldValid('reg-pw');
}

function valRegCpw() {
  const cpw = document.getElementById('reg-cpw').value;
  const pw = document.getElementById('reg-pw').value;
  if (!cpw) return setFieldError('reg-cpw', 'Confirmacao obrigatoria.');
  if (cpw !== pw) return setFieldError('reg-cpw', 'As passwords nao coincidem.');
  return setFieldValid('reg-cpw');
}

function initAuth() {
  document.getElementById('registerForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!valRegNome() || !valRegEmail() || !valRegPw() || !valRegCpw()) return;

    const newUser = {
      id: Date.now().toString(36),
      nome: document.getElementById('reg-nome').value.trim(),
      email: document.getElementById('reg-email').value.trim().toLowerCase(),
      pw: hashPassword(document.getElementById('reg-pw').value),
      created: new Date().toISOString()
    };
    await delay(350);
    saveUsers([...getUsers(), newUser]);
    document.getElementById('reg-confirmedEmail').textContent = newUser.email;
    document.getElementById('reg-form').classList.add('hidden');
    document.getElementById('reg-success').classList.remove('hidden');
  });

  document.getElementById('loginForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value.trim().toLowerCase();
    const pw = document.getElementById('login-pw').value;
    const loginAlert = document.getElementById('loginAlert');
    const loginAlertM = document.getElementById('loginAlertMsg');

    if (!email) return setFieldError('login-email', 'Obrigatorio.');
    if (!pw) return setFieldError('login-pw', 'Obrigatorio.');

    await delay(350);
    const user = getUsers().find((u) => u.email === email && u.pw === hashPassword(pw));
    if (!user) {
      loginAlert.classList.remove('hidden');
      loginAlertM.textContent = 'Credenciais invalidas. Tente novamente.';
      return;
    }

    const session = { userId: user.id, nome: user.nome, email: user.email, loginAt: new Date().toISOString(), persistent: document.getElementById('rememberMe').checked };
    if (session.persistent) localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    else sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
    e.target.reset();
    const pendingRegistration = sessionStorage.getItem('eventhub_pending_registration');
    if (pendingRegistration) {
      sessionStorage.removeItem('eventhub_pending_registration');
      showView('details', { id: pendingRegistration });
      return;
    }
    showView('dashboard');
  });
}

function logout() {
  localStorage.removeItem(SESSION_KEY);
  sessionStorage.removeItem(SESSION_KEY);
  showView('login');
}

function populateDashboard(s) {
  if (!s) return;
  const firstName = s.nome.split(' ')[0];
  const initials = s.nome.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase();
  document.getElementById('dash-name').textContent = firstName;
  document.getElementById('sb-name').textContent = s.nome;
  document.getElementById('sb-email').textContent = s.email;
  document.getElementById('sb-avatar').textContent = initials;
  updateStats();
  renderRegistrationHistory('dashboard-registration-history');
}

function updateStats() {
  const session = getSession();
  const activeRegistrations = getRegistrations().filter((r) => r.userId === session?.userId && r.status === 'confirmada');
  document.getElementById('stat-events-count').textContent = getEvents().length;
  document.getElementById('stat-registrations-count').textContent = activeRegistrations.length;
}

function initEventLogic() {
  document.getElementById('createEventForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const titulo = document.getElementById('ce-titulo').value.trim();
    const desc = document.getElementById('ce-desc').value.trim();
    const data = document.getElementById('ce-data').value;
    const local = document.getElementById('ce-local').value.trim();
    const link = document.getElementById('ce-link').value.trim();
    const formato = document.getElementById('ce-formato').value;
    const capac = parseInt(document.getElementById('ce-capacidade').value, 10);
    const estado = document.querySelector('input[name="ce-estado"]:checked').value;

    let valid = true;
    if (!titulo) valid = setFieldError('ce-titulo', 'Obrigatorio.');
    if (!desc) valid = setFieldError('ce-desc', 'Obrigatorio.');
    if (!data) valid = setFieldError('ce-data', 'Obrigatorio.');
    else if (new Date(data) < new Date()) valid = setFieldError('ce-data', 'Data deve ser futura.');
    if (!local) valid = setFieldError('ce-local', 'Obrigatorio.');
    if (link && !/^https?:\/\//i.test(link)) valid = setFieldError('ce-link', 'URL invalido.');
    if (!capac || capac < 1) valid = setFieldError('ce-capacidade', 'Invalido.');
    if (!valid) return;

    await delay(350);
    const session = getSession();
    const eventId = Math.random().toString(36).slice(2, 8);
    const newEvent = {
      id: eventId,
      titulo,
      desc,
      data,
      local,
      link,
      formato,
      capac,
      estado,
      sessions: tempSessions,
      imgPreview: null,
      url: `https://eventhub.com/e/${eventId}`,
      organizer: session.userId,
      orgName: session.nome,
      createdAt: new Date().toISOString()
    };
    saveEvents([...getEvents(), newEvent]);

    document.getElementById('ce-event-url').textContent = newEvent.url;
    document.getElementById('createEventForm').classList.add('hidden');
    document.getElementById('ce-success').classList.remove('hidden');
    e.target.reset();
    tempSessions = [];
    renderTempSessions();
  });

  document.getElementById('btn-register-event')?.addEventListener('click', handleEventRegistration);
  document.getElementById('btn-cancel-registration')?.addEventListener('click', handleCancelRegistration);
}

function populateEventsGrid() {
  const grid = document.getElementById('events-grid');
  const events = getEvents();
  grid.innerHTML = events.map((ev) => {
    const d = new Date(ev.data);
    const status = getEventStatus(ev);
    const available = getAvailableSeats(ev);
    return `
      <article class="event-card" onclick="app.visitEvent('${ev.id}')">
        <div class="card-img">
          <img src="${ev.imgPreview || 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=900&q=80'}" alt="${escapeHtml(ev.titulo)}">
          <div class="card-status"><span class="badge badge--${status.cls}">${status.label}</span></div>
        </div>
        <div class="card-body">
          <h3>${escapeHtml(ev.titulo)}</h3>
          <p>${escapeHtml(ev.desc)}</p>
          <div class="card-meta">
            <span>📅 ${d.toLocaleString('pt-PT', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
            <span>📍 ${escapeHtml(ev.local)}</span>
            <span>👥 ${available} vagas disponiveis</span>
          </div>
        </div>
      </article>
    `;
  }).join('');
}

function renderEventDetails(id) {
  const ev = getEvents().find((e) => e.id === id);
  if (!ev) { showView('listEvents'); return; }

  const status = getEventStatus(ev);
  const hero = document.getElementById('ed-hero');
  hero.dataset.eventId = id;
  hero.style.backgroundImage = `url("${ev.imgPreview || 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=1200&q=80'}")`;

  document.getElementById('ed-titulo').textContent = ev.titulo;
  document.getElementById('ed-desc').textContent = ev.desc;
  document.getElementById('ed-data').textContent = `📅 ${new Date(ev.data).toLocaleString('pt-PT')}`;
  document.getElementById('ed-local').textContent = `📍 ${ev.local}`;
  document.getElementById('ed-capac').textContent = ev.capac;
  document.getElementById('ed-vagas').textContent = getAvailableSeats(ev);
  document.getElementById('ed-status').className = `badge badge--${status.cls}`;
  document.getElementById('ed-status').textContent = status.label;

  const orgName = ev.orgName || 'EventHub';
  document.getElementById('ed-org-name').textContent = orgName;
  document.getElementById('ed-org-avatar').textContent = orgName.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase();
  document.getElementById('ed-add-session-inline').classList.toggle('hidden', ev.organizer !== getSession()?.userId);
  document.getElementById('ed-add-session-inline').onclick = () => openSessionModal(ev.id);

  renderAgenda(ev);
  renderRegistrationState(ev);
}

function renderAgenda(event) {
  const list = document.getElementById('ed-sessions-list');
  if (!event.sessions || event.sessions.length === 0) {
    list.innerHTML = '<p class="empty-msg">Nenhuma sessao programada.</p>';
    return;
  }

  list.innerHTML = [...event.sessions].sort((a, b) => a.inicio.localeCompare(b.inicio)).map((s) => `
    <div class="session-item">
      <div class="session-time">${s.inicio}<br>${s.fim}</div>
      <div class="session-info">
        <h4>${escapeHtml(s.titulo)}</h4>
        <p>${escapeHtml(s.desc)}</p>
        <div class="session-meta"><span>${s.tipo === 'online' ? '🔗' : '📍'} ${escapeHtml(s.local)}</span><span>👥 Max: ${s.capacidade}</span></div>
      </div>
    </div>
  `).join('');
}

function getEventStatus(ev) {
  if (ev.estado === 'rascunho') return { cls: 'pending', label: 'Rascunho' };
  if (new Date(ev.data) < new Date()) return { cls: 'done', label: 'Concluido' };
  if (getAvailableSeats(ev) <= 0) return { cls: 'done', label: 'Esgotado' };
  return { cls: 'active', label: 'Publicado' };
}

function getActiveRegistrationsForEvent(eventId) {
  return getRegistrations().filter((r) => r.eventId === eventId && r.status === 'confirmada');
}

function getAvailableSeats(ev) {
  return Math.max(0, Number(ev.capac || 0) - getActiveRegistrationsForEvent(ev.id).length);
}

function findUserRegistration(eventId) {
  const session = getSession();
  if (!session) return null;
  return getRegistrations().find((r) => r.eventId === eventId && r.userId === session.userId && r.status === 'confirmada') || null;
}

async function handleEventRegistration() {
  const eventId = document.getElementById('ed-hero').dataset.eventId;
  const ev = getEvents().find((e) => e.id === eventId);
  const session = getSession();

  if (!session) {
    sessionStorage.setItem('eventhub_pending_registration', eventId);
    showView('login');
    return;
  }
  if (!ev) return;
  if (findUserRegistration(eventId)) return renderRegistrationState(ev);
  if (getAvailableSeats(ev) <= 0) {
    renderRegistrationMessage('Evento esgotado. Nao existem vagas disponiveis.');
    return;
  }

  const registration = {
    id: Math.random().toString(36).slice(2, 9),
    reference: makeReference(ev.id),
    eventId: ev.id,
    eventTitle: ev.titulo,
    eventDate: ev.data,
    userId: session.userId,
    userName: session.nome,
    userEmail: session.email,
    status: 'confirmada',
    createdAt: new Date().toISOString(),
    emailSentAt: new Date().toISOString()
  };

  await delay(250);
  saveRegistrations([...getRegistrations(), registration]);
  renderRegistrationState(ev);
  updateStats();
}

function handleCancelRegistration() {
  const eventId = document.getElementById('ed-hero').dataset.eventId;
  const ev = getEvents().find((e) => e.id === eventId);
  const registration = findUserRegistration(eventId);
  if (!registration || !confirm('Deseja cancelar esta inscricao?')) return;

  const regs = getRegistrations().map((r) => r.id === registration.id ? { ...r, status: 'cancelada', cancelledAt: new Date().toISOString() } : r);
  saveRegistrations(regs);
  renderRegistrationState(ev);
  updateStats();
}

function renderRegistrationState(ev) {
  const btnRegister = document.getElementById('btn-register-event');
  const btnCancel = document.getElementById('btn-cancel-registration');
  const confirmation = document.getElementById('registration-confirmation');
  const registration = findUserRegistration(ev.id);
  const session = getSession();
  const available = getAvailableSeats(ev);

  document.getElementById('ed-vagas').textContent = available;
  confirmation.classList.toggle('hidden', !registration);
  btnCancel.classList.toggle('hidden', !registration);

  if (registration) {
    btnRegister.textContent = 'Inscricao Confirmada';
    btnRegister.disabled = true;
    document.getElementById('reg-reference').textContent = registration.reference;
    document.getElementById('reg-email-sent').textContent = `Enviado para ${registration.userEmail} em ${new Date(registration.emailSentAt).toLocaleString('pt-PT')}`;
    renderRegistrationMessage('A sua inscricao esta confirmada.');
    return;
  }

  btnRegister.disabled = available <= 0;
  btnRegister.textContent = available <= 0 ? 'Evento Esgotado' : 'Inscrever-me Agora';
  renderRegistrationMessage(session ? 'Verificamos as vagas disponiveis antes de confirmar.' : 'Login obrigatorio para confirmar a inscricao.');
}

function renderRegistrationMessage(message) {
  document.getElementById('ed-registration-msg').textContent = message;
}

function makeReference(eventId) {
  const stamp = Date.now().toString(36).toUpperCase().slice(-5);
  const eventPart = eventId.toUpperCase().slice(0, 3).padEnd(3, 'X');
  return `EH-${eventPart}-${stamp}`;
}

function renderRegistrationHistory(containerId) {
  const container = document.getElementById(containerId);
  const session = getSession();
  if (!container || !session) return;

  const regs = getRegistrations()
    .filter((r) => r.userId === session.userId)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  if (regs.length === 0) {
    container.innerHTML = '<p class="empty-msg">Ainda nao existem inscricoes no historico.</p>';
    return;
  }

  container.innerHTML = regs.map((r) => {
    const ev = getEvents().find((event) => event.id === r.eventId);
    const status = r.status === 'confirmada' ? 'Confirmada' : 'Cancelada';
    return `
      <div class="registration-card ${r.status === 'cancelada' ? 'cancelled' : ''}">
        <div>
          <strong>${escapeHtml(r.eventTitle)}</strong>
          <span>Referencia: ${r.reference}</span>
          <span>Data: ${new Date(r.eventDate).toLocaleString('pt-PT')}</span>
          <span>Estado: ${status}</span>
        </div>
        ${ev ? `<button class="btn btn-secondary" onclick="app.visitEvent('${r.eventId}')">Ver evento</button>` : ''}
      </div>
    `;
  }).join('');
}

function initSessionModal() {
  document.getElementById('ce-add-session-btn')?.addEventListener('click', () => openSessionModal());
  document.getElementById('closeSessionModal')?.addEventListener('click', () => document.getElementById('sessionModal').classList.add('hidden'));
  document.getElementById('sess-tipo')?.addEventListener('change', (e) => {
    document.getElementById('lbl-sess-local').textContent = e.target.value === 'online' ? 'Link da Reuniao' : 'Sala / Local';
  });
  document.getElementById('sessionForm')?.addEventListener('submit', handleSessionSubmit);
}

function openSessionModal(eventId = null, sessionId = null) {
  const form = document.getElementById('sessionForm');
  form.reset();
  document.getElementById('sess-error').textContent = '';
  editingEventId = eventId;

  if (sessionId) {
    const sessions = eventId ? getEvents().find((e) => e.id === eventId)?.sessions || [] : tempSessions;
    const sess = sessions.find((s) => s.id === sessionId);
    if (sess) {
      document.getElementById('sess-id').value = sess.id;
      document.getElementById('sess-titulo').value = sess.titulo;
      document.getElementById('sess-desc').value = sess.desc;
      document.getElementById('sess-inicio').value = sess.inicio;
      document.getElementById('sess-fim').value = sess.fim;
      document.getElementById('sess-tipo').value = sess.tipo;
      document.getElementById('sess-capacidade').value = sess.capacidade;
      document.getElementById('sess-local').value = sess.local;
    }
  } else {
    document.getElementById('sess-id').value = '';
  }
  document.getElementById('sessionModal').classList.remove('hidden');
}

function handleSessionSubmit(e) {
  e.preventDefault();
  const id = document.getElementById('sess-id').value || Math.random().toString(36).slice(2, 8);
  const titulo = document.getElementById('sess-titulo').value.trim();
  const desc = document.getElementById('sess-desc').value.trim();
  const inicio = document.getElementById('sess-inicio').value;
  const fim = document.getElementById('sess-fim').value;
  const tipo = document.getElementById('sess-tipo').value;
  const capacidade = parseInt(document.getElementById('sess-capacidade').value, 10);
  const local = document.getElementById('sess-local').value.trim();
  const error = document.getElementById('sess-error');

  if (!titulo || !desc || !inicio || !fim || !capacidade || !local) {
    error.textContent = 'Preencha todos os campos obrigatorios.';
    return;
  }
  if (inicio >= fim) {
    error.textContent = 'A hora de fim deve ser apos o inicio.';
    return;
  }

  const newSess = { id, titulo, desc, inicio, fim, tipo, capacidade, local };
  const currentSessions = editingEventId ? getEvents().find((ev) => ev.id === editingEventId)?.sessions || [] : tempSessions;
  const conflict = currentSessions.filter((s) => s.id !== id).find((s) => inicio < s.fim && fim > s.inicio);
  if (conflict) {
    error.textContent = `Conflito de horario com a sessao: ${conflict.titulo}`;
    return;
  }

  if (editingEventId) {
    const events = getEvents();
    const ev = events.find((event) => event.id === editingEventId);
    if (ev) {
      const idx = ev.sessions.findIndex((s) => s.id === id);
      if (idx >= 0) ev.sessions[idx] = newSess;
      else ev.sessions.push(newSess);
      saveEvents(events);
      renderAgenda(ev);
    }
  } else {
    const idx = tempSessions.findIndex((s) => s.id === id);
    if (idx >= 0) tempSessions[idx] = newSess;
    else tempSessions.push(newSess);
    renderTempSessions();
  }
  document.getElementById('sessionModal').classList.add('hidden');
}

function renderTempSessions() {
  const list = document.getElementById('ce-sessions-list');
  if (!list) return;
  if (tempSessions.length === 0) {
    list.classList.add('hidden');
    list.innerHTML = '';
    return;
  }

  list.classList.remove('hidden');
  list.innerHTML = `
    <h4>Agenda Pre-visualizacao (${tempSessions.length} sessoes)</h4>
    <div class="temp-sessions-grid">
      ${tempSessions.map((s) => `
        <div class="temp-session-card">
          <div class="temp-sess-time">${s.inicio} - ${s.fim}</div>
          <strong>${escapeHtml(s.titulo)}</strong>
          <span>${s.tipo === 'online' ? '🔗' : '📍'} ${escapeHtml(s.local)}</span>
          <div class="temp-sess-actions">
            <button type="button" onclick="app.editSession(null, '${s.id}')">Editar</button>
            <button type="button" onclick="app.deleteSession(null, '${s.id}')">Eliminar</button>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

function initRecovery() {
  const modal = document.getElementById('recoverModal');
  const recoverForm = document.getElementById('recover-form-div');
  const recoverSucc = document.getElementById('recover-success-div');
  document.getElementById('forgotPwLink')?.addEventListener('click', (e) => {
    e.preventDefault();
    modal.classList.remove('hidden');
    recoverForm.classList.remove('hidden');
    recoverSucc.classList.add('hidden');
  });
  document.getElementById('closeModal')?.addEventListener('click', () => modal.classList.add('hidden'));
  document.getElementById('closeRecoverSuccess')?.addEventListener('click', () => modal.classList.add('hidden'));
  document.getElementById('sendRecoverBtn')?.addEventListener('click', async () => {
    const email = document.getElementById('recoverEmail').value.trim();
    if (!email || !email.includes('@')) return setFieldError('recover-email', 'Introduza um email valido.');
    await delay(250);
    document.getElementById('recoverSentTo').textContent = email;
    recoverForm.classList.add('hidden');
    recoverSucc.classList.remove('hidden');
  });
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (ch) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  }[ch]));
}

window.app = {
  visitEvent: (id) => showView('details', { id }),
  editSession: (eventId, sessionId) => openSessionModal(eventId, sessionId),
  deleteSession: (eventId, sessionId) => {
    if (!confirm('Deseja eliminar esta sessao?')) return;
    if (eventId) {
      const events = getEvents();
      const ev = events.find((e) => e.id === eventId);
      if (ev) {
        ev.sessions = ev.sessions.filter((s) => s.id !== sessionId);
        saveEvents(events);
        renderAgenda(ev);
      }
    } else {
      tempSessions = tempSessions.filter((s) => s.id !== sessionId);
      renderTempSessions();
    }
  }
<<<<<<< HEAD
};
=======
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
>>>>>>> 1b44220a63e13055672c6f0a336dba79992075c8
