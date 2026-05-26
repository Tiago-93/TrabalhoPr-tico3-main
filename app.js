'use strict';

const USERS_KEY = 'eventhub_users';
const SESSION_KEY = 'eventhub_session';
const EVENTS_KEY = 'eventhub_events';
const REGISTRATIONS_KEY = 'eventhub_registrations';
const FEEDBACK_KEY = 'eventhub_session_feedback';
const SPEAKERS_KEY = 'eventhub_speakers';

const views = {
  register: document.getElementById('view-register'),
  login: document.getElementById('view-login'),
  dashboard: document.getElementById('view-dashboard'),
  createEvent: document.getElementById('view-create-event'),
  listEvents: document.getElementById('view-list-events'),
  details: document.getElementById('view-event-details'),
  profile: document.getElementById('view-profile'),
  adminSpeakers: document.getElementById('view-admin-speakers')
};

let tempSessions = [];
let tempSessionOradores = [];
let editingEventId = null;

const getUsers = () => JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
const saveUsers = (users) => localStorage.setItem(USERS_KEY, JSON.stringify(users));
const getEvents = () => JSON.parse(localStorage.getItem(EVENTS_KEY) || '[]');
const saveEvents = (events) => localStorage.setItem(EVENTS_KEY, JSON.stringify(events));
const getRegistrations = () => JSON.parse(localStorage.getItem(REGISTRATIONS_KEY) || '[]');
const saveRegistrations = (regs) => localStorage.setItem(REGISTRATIONS_KEY, JSON.stringify(regs));
const getFeedback = () => JSON.parse(localStorage.getItem(FEEDBACK_KEY) || '[]');
const saveFeedback = (feedback) => localStorage.setItem(FEEDBACK_KEY, JSON.stringify(feedback));
const getSpeakers = () => JSON.parse(localStorage.getItem(SPEAKERS_KEY) || '[]');
const saveSpeakers = (speakers) => localStorage.setItem(SPEAKERS_KEY, JSON.stringify(speakers));
const getSession = () => JSON.parse(sessionStorage.getItem(SESSION_KEY) || 'null') || JSON.parse(localStorage.getItem(SESSION_KEY) || 'null');
const delay = (ms) => new Promise((res) => setTimeout(res, ms));

document.addEventListener('DOMContentLoaded', () => {
  seedEvents();
  seedSpeakers();
  seedAdmin();
  initRouting();
  initValidation();
  initAuth();
  initEventLogic();
  initImageUpload();
  initSessionModal();
  initSpeakerModal();
  initAdminSpeakersView();
  initLocationMaps();
  initRecovery();
  checkSession();
});

function seedAdmin() {
  const users = getUsers();
  if (users.some((u) => u.email === 'admin@eventhub.com')) return;
  saveUsers([...users, {
    id: 'admin',
    nome: 'Admin EventHub',
    email: 'admin@eventhub.com',
    pw: hashPassword('Admin1234'),
    isAdmin: true,
    created: new Date().toISOString()
  }]);
}

function seedSpeakers() {
  if (getSpeakers().length > 0) return;
  saveSpeakers([
    { id: 'spk1', nome: 'Ana Costa', bio: 'Especialista em React com 8 anos de experiencia em projetos de grande escala.', foto: '', contacto: 'ana.costa@techdev.pt' },
    { id: 'spk2', nome: 'Bruno Ferreira', bio: 'UX Designer e investigador de usabilidade com foco em acessibilidade.', foto: '', contacto: 'bruno@uxlab.pt' }
  ]);
}

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
        { id: 's1', titulo: 'Abertura e Keynote', desc: 'Boas-vindas e apresentacao dos temas principais.', inicio: '10:00', fim: '11:00', tipo: 'online', local: 'Zoom Room 1', capacidade: 50, oradores: ['spk1'] },
        { id: 's2', titulo: 'Hooks Avancados', desc: 'Exploracao de useMemo, useCallback e hooks customizados.', inicio: '11:15', fim: '12:30', tipo: 'online', local: 'Zoom Room 1', capacidade: 50, oradores: ['spk1', 'spk2'] }
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

  updateAdminNav();
  if (viewId === 'dashboard') populateDashboard(getSession());
  if (viewId === 'listEvents') populateEventsGrid();
  if (viewId === 'details') renderEventDetails(params.id);
  if (viewId === 'profile') renderRegistrationHistory('profile-registration-history');
  if (viewId === 'adminSpeakers') renderAdminSpeakers();
}

function updateAdminNav() {
  const session = getSession();
  document.querySelectorAll('.admin-only-nav').forEach((el) => {
    el.classList.toggle('hidden', !session?.isAdmin);
  });
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
    resetImageUpload();
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

    const session = { userId: user.id, nome: user.nome, email: user.email, isAdmin: user.isAdmin || false, loginAt: new Date().toISOString(), persistent: document.getElementById('rememberMe').checked };
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
  updateAdminNav();
  updateStats();
  renderRegistrationHistory('dashboard-registration-history');
}

function renderAdminSpeakers() {
  const session = getSession();
  if (!session?.isAdmin) { showView('dashboard'); return; }

  const el = (id) => document.getElementById(id);
  if (el('as-name')) {
    const initials = session.nome.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase();
    el('as-name').textContent = session.nome;
    el('as-email').textContent = session.email;
    el('as-avatar').textContent = initials;
  }

  const speakers = getSpeakers();
  const list = el('admin-speakers-list');
  if (!list) return;

  if (speakers.length === 0) {
    list.innerHTML = '<p class="empty-msg">Nenhum orador registado. Clique em "+ Novo Orador" para criar.</p>';
    return;
  }

  list.innerHTML = speakers.map((sp) => `
    <div class="speaker-admin-card">
      <div class="speaker-admin-avatar">
        ${sp.foto ? `<img src="${escapeHtml(sp.foto)}" alt="${escapeHtml(sp.nome)}" />` : `<span>${escapeHtml(sp.nome.split(' ').map((n) => n[0]).slice(0, 2).join(''))}</span>`}
      </div>
      <div class="speaker-admin-info">
        <strong>${escapeHtml(sp.nome)}</strong>
        <span>${sp.contacto ? escapeHtml(sp.contacto) : 'Sem contacto'}</span>
        ${sp.bio ? `<p>${escapeHtml(sp.bio)}</p>` : ''}
      </div>
      <div class="speaker-admin-actions">
        <button type="button" class="btn btn-secondary btn-sm" onclick="app.editSpeakerAdmin('${sp.id}')">Editar</button>
        <button type="button" class="btn btn-danger btn-sm" onclick="app.deleteSpeakerAdmin('${sp.id}')">Eliminar</button>
      </div>
    </div>
  `).join('');
}

function initAdminSpeakersView() {
  document.getElementById('btn-admin-create-speaker')?.addEventListener('click', () => openSpeakerModal());
  document.getElementById('btn-admin-logout')?.addEventListener('click', logout);
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
      imgPreview: selectedImageDataUrl || null,
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
    resetImageUpload();
    tempSessions = [];
    renderTempSessions();
  });

  document.getElementById('btn-register-event')?.addEventListener('click', handleEventRegistration);
  document.getElementById('btn-cancel-registration')?.addEventListener('click', handleCancelRegistration);
  document.getElementById('stats-period-filter')?.addEventListener('change', () => {
    const eventId = document.getElementById('ed-hero').dataset.eventId;
    const ev = getEvents().find((item) => item.id === eventId);
    if (ev) renderEventStats(ev);
  });
  document.getElementById('stats-type-filter')?.addEventListener('change', () => {
    const eventId = document.getElementById('ed-hero').dataset.eventId;
    const ev = getEvents().find((item) => item.id === eventId);
    if (ev) renderEventStats(ev);
  });
  document.getElementById('btn-export-stats-pdf')?.addEventListener('click', exportEventStatsPdf);
  document.getElementById('btn-export-stats-excel')?.addEventListener('click', exportEventStatsExcel);
  document.getElementById('btn-export-agenda-pdf')?.addEventListener('click', exportAgendaPdf);
  ['af-tipo', 'af-orador', 'af-sala'].forEach((id) => {
    document.getElementById(id)?.addEventListener('change', () => {
      const eventId = document.getElementById('ed-hero').dataset.eventId;
      const ev = getEvents().find((item) => item.id === eventId);
      if (ev) renderAgenda(ev);
    });
  });
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

  const edMap = document.getElementById('ed-local-map');
  if (edMap) {
    const isPhysical = ev.formato !== 'online' && ev.local && ev.local.toLowerCase() !== 'online';
    if (isPhysical) geocodeAndShowMap('ed-local-map', ev.local);
    else edMap.classList.add('hidden');
  }

  renderAgenda(ev);
  renderRegistrationState(ev);
  renderEventStats(ev);
}

function renderAgenda(event) {
  const list = document.getElementById('ed-sessions-list');
  renderOrganizerFeedback(event);
  renderAgendaFilters(event);

  if (!event.sessions || event.sessions.length === 0) {
    list.innerHTML = '<p class="empty-msg">Nenhuma sessao programada.</p>';
    return;
  }

  const tipoFilter = document.getElementById('af-tipo')?.value || '';
  const oradorFilter = document.getElementById('af-orador')?.value || '';
  const salaFilter = document.getElementById('af-sala')?.value || '';

  let sessions = [...event.sessions].sort((a, b) => a.inicio.localeCompare(b.inicio));
  if (tipoFilter) sessions = sessions.filter((s) => s.tipo === tipoFilter);
  if (oradorFilter) sessions = sessions.filter((s) => (s.oradores || []).includes(oradorFilter));
  if (salaFilter) sessions = sessions.filter((s) => s.local === salaFilter);

  const parallelIds = new Set();
  const all = event.sessions;
  for (let i = 0; i < all.length; i++) {
    for (let j = i + 1; j < all.length; j++) {
      if (all[i].inicio < all[j].fim && all[i].fim > all[j].inicio) {
        parallelIds.add(all[i].id);
        parallelIds.add(all[j].id);
      }
    }
  }

  const isOrganizer = event.organizer === getSession()?.userId;
  const allSpeakers = getSpeakers();

  list.innerHTML = sessions.map((s) => {
    const stats = getSessionFeedbackStats(event.id, s.id);
    const feedbackBlock = renderSessionFeedbackBlock(event, s, stats);
    const sessionSpeakers = (s.oradores || []).map((id) => allSpeakers.find((sp) => sp.id === id)).filter(Boolean);
    const speakersHtml = sessionSpeakers.length
      ? `<div class="session-speakers">${sessionSpeakers.map((sp) => `
          <button type="button" class="speaker-chip" onclick="app.openSpeakerProfile('${sp.id}', '${event.id}')">
            ${sp.foto ? `<img src="${escapeHtml(sp.foto)}" alt="${escapeHtml(sp.nome)}" class="speaker-avatar" />` : `<span class="speaker-avatar-initials">${escapeHtml(sp.nome.split(' ').map((n) => n[0]).slice(0, 2).join(''))}</span>`}
            <span>${escapeHtml(sp.nome)}</span>
          </button>`).join('')}</div>`
      : '';
    const actionsHtml = isOrganizer
      ? `<div class="session-actions">
          <button type="button" class="btn-sm btn-secondary" onclick="app.editSession('${event.id}', '${s.id}')">Editar</button>
          <button type="button" class="btn-sm btn-danger" onclick="app.deleteSession('${event.id}', '${s.id}')">Eliminar</button>
        </div>`
      : '';
    return `
    <div class="session-item${parallelIds.has(s.id) ? ' session-parallel' : ''}">
      <div class="session-time">${s.inicio}<br>${s.fim}</div>
      <div class="session-info">
        <h4>${escapeHtml(s.titulo)}${parallelIds.has(s.id) ? ' <span class="parallel-badge">Paralela</span>' : ''}</h4>
        <p>${escapeHtml(s.desc)}</p>
        <div class="session-meta">
          <span>${s.tipo === 'online' ? '🔗' : '📍'} ${escapeHtml(s.local)}</span>
          <span>👥 ${s.capacidade} vagas</span>
        </div>
        ${speakersHtml}
        ${actionsHtml}
        <div class="session-feedback-summary">
          <strong>${stats.average ? `${stats.average.toFixed(1)} / 5` : 'Sem classificacoes'}</strong>
          <span>${renderStars(stats.average || 0)} ${stats.count} feedback${stats.count === 1 ? '' : 's'}</span>
        </div>
        ${feedbackBlock}
      </div>
    </div>`;
  }).join('') || '<p class="empty-msg">Nenhuma sessao para os filtros selecionados.</p>';
}

function renderAgendaFilters(event) {
  const bar = document.getElementById('agenda-filter-bar');
  if (!bar) return;
  const sessions = event.sessions || [];
  bar.classList.toggle('hidden', sessions.length === 0);
  if (sessions.length === 0) return;

  const allSpeakers = getSpeakers();
  const oradorSel = document.getElementById('af-orador');
  const salaSel = document.getElementById('af-sala');
  const curOrador = oradorSel?.value || '';
  const curSala = salaSel?.value || '';

  const oradoresIds = [...new Set(sessions.flatMap((s) => s.oradores || []))];
  oradorSel.innerHTML = '<option value="">Todos os oradores</option>' +
    oradoresIds.map((id) => {
      const sp = allSpeakers.find((s) => s.id === id);
      return sp ? `<option value="${id}" ${curOrador === id ? 'selected' : ''}>${escapeHtml(sp.nome)}</option>` : '';
    }).join('');

  const salas = [...new Set(sessions.map((s) => s.local))];
  salaSel.innerHTML = '<option value="">Todas as salas</option>' +
    salas.map((sala) => `<option value="${escapeHtml(sala)}" ${curSala === sala ? 'selected' : ''}>${escapeHtml(sala)}</option>`).join('');
}

function exportAgendaPdf() {
  window.print();
}

function initSpeakerModal() {
  document.getElementById('closeSpeakerModal')?.addEventListener('click', () => document.getElementById('speakerModal').classList.add('hidden'));
  document.getElementById('speakerForm')?.addEventListener('submit', handleSpeakerSubmit);
  document.getElementById('closeSpeakerProfileModal')?.addEventListener('click', () => document.getElementById('speakerProfileModal').classList.add('hidden'));
}

function openSpeakerModal(speakerId = null) {
  const form = document.getElementById('speakerForm');
  form.reset();
  document.getElementById('spk-error').textContent = '';
  document.getElementById('speakerModalTitle').textContent = speakerId ? 'Editar Orador' : 'Criar Orador';
  if (speakerId) {
    const sp = getSpeakers().find((s) => s.id === speakerId);
    if (sp) {
      document.getElementById('spk-id').value = sp.id;
      document.getElementById('spk-nome').value = sp.nome;
      document.getElementById('spk-bio').value = sp.bio || '';
      document.getElementById('spk-foto').value = sp.foto || '';
      document.getElementById('spk-contacto').value = sp.contacto || '';
    }
  } else {
    document.getElementById('spk-id').value = '';
    const searchVal = document.getElementById('sess-orador-search')?.value.trim() || '';
    if (searchVal) document.getElementById('spk-nome').value = searchVal;
  }
  document.getElementById('speakerModal').classList.remove('hidden');
}

function handleSpeakerSubmit(e) {
  e.preventDefault();
  const id = document.getElementById('spk-id').value || Math.random().toString(36).slice(2, 9);
  const nome = document.getElementById('spk-nome').value.trim();
  const bio = document.getElementById('spk-bio').value.trim();
  const foto = document.getElementById('spk-foto').value.trim();
  const contacto = document.getElementById('spk-contacto').value.trim();
  if (!nome) { document.getElementById('spk-error').textContent = 'Nome obrigatorio.'; return; }

  const speakers = getSpeakers();
  const isEdit = speakers.some((s) => s.id === id);
  const newSpk = { id, nome, bio, foto, contacto };
  saveSpeakers(isEdit ? speakers.map((s) => s.id === id ? newSpk : s) : [...speakers, newSpk]);

  const sessionModalOpen = !document.getElementById('sessionModal').classList.contains('hidden');
  if (!isEdit && sessionModalOpen) addOradorToSession(id);

  document.getElementById('speakerModal').classList.add('hidden');
  renderSessionOradores();
  const searchEl = document.getElementById('sess-orador-search');
  if (searchEl) { searchEl.value = ''; }
  document.getElementById('sess-orador-results')?.classList.add('hidden');

  if (!views.adminSpeakers?.classList.contains('hidden')) renderAdminSpeakers();
}

function renderOradorResults(query) {
  const resultsEl = document.getElementById('sess-orador-results');
  if (!resultsEl) return;
  const allSpeakers = getSpeakers();
  const available = allSpeakers.filter((sp) => !tempSessionOradores.includes(sp.id));
  const results = query
    ? available.filter((sp) => sp.nome.toLowerCase().includes(query))
    : available;

  if (results.length === 0 && allSpeakers.length === 0) {
    resultsEl.innerHTML = `<div class="speaker-no-results">Nenhum orador criado ainda. <button type="button" class="btn-link" onclick="app.openSpeakerModal()">Criar orador</button></div>`;
  } else if (results.length === 0) {
    resultsEl.innerHTML = `<div class="speaker-no-results">Sem resultados. <button type="button" class="btn-link" onclick="app.openSpeakerModal()">Criar novo orador</button></div>`;
  } else {
    resultsEl.innerHTML = results.map((sp) => `
      <div class="speaker-result-item">
        <span>${escapeHtml(sp.nome)}</span>
        <button type="button" class="btn-sm btn-primary" onclick="app.addOrador('${sp.id}')">Associar</button>
      </div>`).join('');
  }
  resultsEl.classList.remove('hidden');
}

function handleOradorSearchFocus() {
  renderOradorResults('');
}

function handleOradorSearch(e) {
  const query = e.target.value.trim().toLowerCase();
  const resultsEl = document.getElementById('sess-orador-results');
  if (!query) { renderOradorResults(''); return; }
  renderOradorResults(query);
}

function addOradorToSession(speakerId) {
  if (!tempSessionOradores.includes(speakerId)) tempSessionOradores.push(speakerId);
  renderSessionOradores();
  const searchEl = document.getElementById('sess-orador-search');
  if (searchEl) searchEl.value = '';
  document.getElementById('sess-orador-results')?.classList.add('hidden');
}

function removeOradorFromSession(speakerId) {
  tempSessionOradores = tempSessionOradores.filter((id) => id !== speakerId);
  renderSessionOradores();
}

function renderSessionOradores() {
  const chips = document.getElementById('sess-oradores-chips');
  if (!chips) return;
  const selected = tempSessionOradores.map((id) => getSpeakers().find((s) => s.id === id)).filter(Boolean);
  chips.innerHTML = selected.length
    ? selected.map((sp) => `
        <div class="speaker-chip-selected">
          <span>${escapeHtml(sp.nome)}</span>
          <button type="button" onclick="app.removeOrador('${sp.id}')" title="Remover">×</button>
        </div>`).join('')
    : '<span class="speaker-empty-hint">Nenhum orador associado</span>';
}

function openSpeakerProfile(speakerId, eventId) {
  const modal = document.getElementById('speakerProfileModal');
  const content = document.getElementById('speaker-profile-content');
  const sp = getSpeakers().find((s) => s.id === speakerId);
  if (!sp) return;
  const ev = getEvents().find((e) => e.id === eventId);
  const sessions = ev ? (ev.sessions || []).filter((s) => (s.oradores || []).includes(speakerId)) : [];
  content.innerHTML = `
    <div class="speaker-profile">
      <div class="speaker-profile-header">
        ${sp.foto ? `<img src="${escapeHtml(sp.foto)}" alt="${escapeHtml(sp.nome)}" class="speaker-profile-photo" />` : `<div class="speaker-avatar-lg">${escapeHtml(sp.nome.split(' ').map((n) => n[0]).slice(0, 2).join(''))}</div>`}
        <div>
          <h3>${escapeHtml(sp.nome)}</h3>
          ${sp.contacto ? `<p class="speaker-contact">✉ ${escapeHtml(sp.contacto)}</p>` : ''}
        </div>
      </div>
      ${sp.bio ? `<p class="speaker-bio">${escapeHtml(sp.bio)}</p>` : ''}
      <h4>Sessoes neste evento (${sessions.length})</h4>
      ${sessions.length
        ? `<ul class="speaker-sessions-list">${sessions.map((s) => `<li><strong>${escapeHtml(s.titulo)}</strong> — ${s.inicio}–${s.fim} | ${s.tipo === 'online' ? '🔗' : '📍'} ${escapeHtml(s.local)}</li>`).join('')}</ul>`
        : '<p class="empty-msg">Sem sessoes neste evento.</p>'}
    </div>`;
  modal.classList.remove('hidden');
}

function renderSessionFeedbackBlock(event, session, stats) {
  const activeRegistration = findUserRegistration(event.id);
  const userFeedback = findUserFeedback(event.id, session.id);
  const canEdit = userFeedback ? isFeedbackEditable(userFeedback) : true;
  const userRating = userFeedback?.rating || 0;
  const userComment = userFeedback?.comment || '';
  const message = !activeRegistration
    ? '<p class="feedback-lock">Inscreva-se no evento para deixar feedback sobre esta sessao.</p>'
    : (!canEdit ? '<p class="feedback-lock">O periodo de edicao de 24h terminou. O seu feedback fica guardado.</p>' : '');

  const form = activeRegistration && canEdit ? `
    <form class="feedback-form" onsubmit="app.submitSessionFeedback(event, '${event.id}', '${session.id}')">
      <div class="star-input" aria-label="Classificacao por estrelas">
        ${[5, 4, 3, 2, 1].map((value) => `
          <input type="radio" id="fb-${session.id}-${value}" name="rating-${session.id}" value="${value}" ${userRating === value ? 'checked' : ''} required>
          <label for="fb-${session.id}-${value}" title="${value} estrelas">★</label>
        `).join('')}
      </div>
      <textarea name="comment" maxlength="500" rows="3" placeholder="Comentario opcional (max. 500 caracteres)">${escapeHtml(userComment)}</textarea>
      <div class="feedback-actions">
        <span>${userFeedback ? 'Pode editar durante 24h apos enviar.' : 'O comentario fica listado como moderado.'}</span>
        <button class="btn btn-secondary" type="submit">${userFeedback ? 'Atualizar feedback' : 'Enviar feedback'}</button>
      </div>
    </form>
  ` : '';

  return `
    <div class="session-feedback">
      <div class="feedback-header">
        <h5>Feedback da sessao</h5>
        <span>Media: ${stats.average ? stats.average.toFixed(1) : '--'} (${stats.count})</span>
      </div>
      ${message}
      ${form}
      ${renderModeratedComments(event.id, session.id)}
    </div>
  `;
}

function renderStars(value) {
  const rounded = Math.round(value);
  return Array.from({ length: 5 }, (_, i) => i < rounded ? '★' : '☆').join('');
}

function getSessionFeedback(eventId, sessionId) {
  return getFeedback().filter((item) => item.eventId === eventId && item.sessionId === sessionId && item.status === 'moderado');
}

function getSessionFeedbackStats(eventId, sessionId) {
  const items = getSessionFeedback(eventId, sessionId);
  const total = items.reduce((sum, item) => sum + Number(item.rating || 0), 0);
  return {
    average: items.length ? total / items.length : 0,
    count: items.length
  };
}

function findUserFeedback(eventId, sessionId) {
  const session = getSession();
  if (!session) return null;
  return getFeedback().find((item) => item.eventId === eventId && item.sessionId === sessionId && item.userId === session.userId) || null;
}

function isFeedbackEditable(feedback) {
  const changedAt = new Date(feedback.updatedAt || feedback.createdAt).getTime();
  return Date.now() - changedAt <= 24 * 60 * 60 * 1000;
}

function renderModeratedComments(eventId, sessionId) {
  const comments = getSessionFeedback(eventId, sessionId)
    .filter((item) => item.comment)
    .sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt));

  if (comments.length === 0) return '<p class="feedback-empty">Ainda nao existem comentarios moderados.</p>';

  return `
    <div class="feedback-comments">
      ${comments.map((item) => `
        <article class="feedback-comment">
          <div><strong>${escapeHtml(item.userName)}</strong><span>${renderStars(item.rating)} ${item.rating}/5</span></div>
          <p>${escapeHtml(item.comment)}</p>
        </article>
      `).join('')}
    </div>
  `;
}

function handleSessionFeedbackSubmit(e, eventId, sessionId) {
  e.preventDefault();
  const ev = getEvents().find((event) => event.id === eventId);
  const session = getSession();
  const registration = findUserRegistration(eventId);
  if (!ev || !session || !registration) {
    alert('Apenas participantes inscritos podem deixar feedback.');
    return;
  }

  const form = e.target;
  const rating = Number(new FormData(form).get(`rating-${sessionId}`));
  const comment = String(new FormData(form).get('comment') || '').trim();
  if (rating < 1 || rating > 5) {
    alert('Escolha uma classificacao entre 1 e 5 estrelas.');
    return;
  }
  if (comment.length > 500) {
    alert('O comentario deve ter no maximo 500 caracteres.');
    return;
  }

  const feedback = getFeedback();
  const existing = feedback.find((item) => item.eventId === eventId && item.sessionId === sessionId && item.userId === session.userId);
  if (existing && !isFeedbackEditable(existing)) {
    alert('O periodo de edicao de 24h terminou.');
    renderAgenda(ev);
    return;
  }

  const sessionInfo = ev.sessions.find((item) => item.id === sessionId);
  const now = new Date().toISOString();
  const entry = {
    id: existing?.id || Math.random().toString(36).slice(2, 9),
    eventId,
    eventTitle: ev.titulo,
    sessionId,
    sessionTitle: sessionInfo?.titulo || 'Sessao',
    organizerId: ev.organizer,
    userId: session.userId,
    userName: session.nome,
    userEmail: session.email,
    rating,
    comment,
    status: 'moderado',
    createdAt: existing?.createdAt || now,
    updatedAt: now,
    organizerNotifiedAt: now
  };

  const next = existing ? feedback.map((item) => item.id === existing.id ? entry : item) : [...feedback, entry];
  saveFeedback(next);
  alert(`Feedback enviado. O organizador recebeu uma notificacao sobre "${entry.sessionTitle}".`);
  renderAgenda(ev);
  renderEventStats(ev);
}

function renderOrganizerFeedback(event) {
  const card = document.getElementById('organizer-feedback-card');
  const list = document.getElementById('organizer-feedback-list');
  const session = getSession();
  if (!card || !list) return;

  const isOrganizer = event.organizer === session?.userId;
  card.classList.toggle('hidden', !isOrganizer);
  if (!isOrganizer) return;

  const notifications = getFeedback()
    .filter((item) => item.eventId === event.id)
    .sort((a, b) => new Date(b.organizerNotifiedAt) - new Date(a.organizerNotifiedAt));

  if (notifications.length === 0) {
    list.innerHTML = '<p class="empty-msg">Ainda nao recebeu feedback.</p>';
    return;
  }

  list.innerHTML = notifications.map((item) => `
    <div class="organizer-feedback-item">
      <strong>${escapeHtml(item.sessionTitle)}</strong>
      <span>${renderStars(item.rating)} ${item.rating}/5 por ${escapeHtml(item.userName)}</span>
      <small>Notificado em ${new Date(item.organizerNotifiedAt).toLocaleString('pt-PT')}</small>
    </div>
  `).join('');
}

function renderEventStats(event) {
  const section = document.getElementById('event-stats-section');
  const session = getSession();
  if (!section) return;

  const isOrganizer = event.organizer === session?.userId;
  section.classList.toggle('hidden', !isOrganizer);
  if (!isOrganizer) return;

  const stats = buildEventStats(event);
  const grid = document.getElementById('event-stats-grid');
  grid.innerHTML = `
    <div class="stats-kpi"><span>Total inscritos</span><strong>${stats.totalConfirmed}</strong><small>${stats.totalCancelled} cancelada${stats.totalCancelled === 1 ? '' : 's'}</small></div>
    <div class="stats-kpi"><span>Taxa presenca</span><strong>${stats.attendanceRate}%</strong><small>confirmadas / total</small></div>
    <div class="stats-kpi"><span>Feedback medio</span><strong>${stats.avgRating ? stats.avgRating.toFixed(1) : '--'}</strong><small>${stats.feedbackCount} resposta${stats.feedbackCount === 1 ? '' : 's'}</small></div>
    <div class="stats-kpi"><span>Sessao popular</span><strong>${escapeHtml(stats.mostPopular?.titulo || '--')}</strong><small>${stats.mostPopular?.score || 0} interacoes</small></div>
  `;

  renderRegistrationTimeline(stats.timeline);
  renderSessionComparison(stats.sessions);
}

function buildEventStats(event) {
  const periodFilter = document.getElementById('stats-period-filter')?.value || 'all';
  const typeFilter = document.getElementById('stats-type-filter')?.value || 'all';
  const since = periodFilter === 'all' ? null : Date.now() - Number(periodFilter) * 24 * 60 * 60 * 1000;
  const inPeriod = (iso) => !since || new Date(iso).getTime() >= since;

  const eventRegs = getRegistrations().filter((reg) => reg.eventId === event.id && inPeriod(reg.createdAt));
  const confirmed = eventRegs.filter((reg) => reg.status === 'confirmada');
  const cancelled = eventRegs.filter((reg) => reg.status === 'cancelada');
  const eventFeedback = getFeedback().filter((item) => item.eventId === event.id && inPeriod(item.updatedAt || item.createdAt));
  const feedbackTotal = eventFeedback.reduce((sum, item) => sum + Number(item.rating || 0), 0);
  const filteredSessions = (event.sessions || []).filter((sess) => typeFilter === 'all' || sess.tipo === typeFilter);
  const sessions = filteredSessions.map((sess) => {
    const sessionFeedback = eventFeedback.filter((item) => item.sessionId === sess.id);
    const avgRating = sessionFeedback.length
      ? sessionFeedback.reduce((sum, item) => sum + Number(item.rating || 0), 0) / sessionFeedback.length
      : 0;
    const estimatedParticipation = Math.min(confirmed.length, Number(sess.capacidade || confirmed.length || 0));
    return {
      id: sess.id,
      titulo: sess.titulo,
      tipo: sess.tipo,
      participation: estimatedParticipation,
      feedbackCount: sessionFeedback.length,
      avgRating,
      score: estimatedParticipation + sessionFeedback.length
    };
  });

  const totalRegs = confirmed.length + cancelled.length;
  return {
    totalConfirmed: confirmed.length,
    totalCancelled: cancelled.length,
    attendanceRate: totalRegs ? Math.round((confirmed.length / totalRegs) * 100) : 0,
    avgRating: eventFeedback.length ? feedbackTotal / eventFeedback.length : 0,
    feedbackCount: eventFeedback.length,
    mostPopular: [...sessions].sort((a, b) => b.score - a.score)[0],
    timeline: buildRegistrationTimeline(confirmed),
    sessions
  };
}

function buildRegistrationTimeline(registrations) {
  const buckets = new Map();
  registrations.forEach((reg) => {
    const key = new Date(reg.createdAt).toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit' });
    buckets.set(key, (buckets.get(key) || 0) + 1);
  });
  const entries = [...buckets.entries()];
  if (entries.length > 0) return entries.map(([label, value]) => ({ label, value }));
  return [{ label: 'Sem dados', value: 0 }];
}

function renderRegistrationTimeline(timeline) {
  const container = document.getElementById('stats-registration-chart');
  const max = Math.max(1, ...timeline.map((item) => item.value));
  container.innerHTML = timeline.map((item) => {
    const height = Math.max(8, Math.round((item.value / max) * 120));
    return `
      <div class="chart-column">
        <div class="chart-bar" style="height:${height}px"></div>
        <strong>${item.value}</strong>
        <span>${escapeHtml(item.label)}</span>
      </div>
    `;
  }).join('');
}

function renderSessionComparison(sessions) {
  const container = document.getElementById('stats-session-comparison');
  if (!sessions.length) {
    container.innerHTML = '<p class="empty-msg">Nao existem sessoes para os filtros selecionados.</p>';
    return;
  }

  const maxParticipation = Math.max(1, ...sessions.map((item) => item.participation));
  container.innerHTML = sessions.map((item) => {
    const participationWidth = Math.round((item.participation / maxParticipation) * 100);
    const feedbackWidth = Math.round((item.avgRating / 5) * 100);
    return `
      <div class="comparison-row">
        <div class="comparison-title"><strong>${escapeHtml(item.titulo)}</strong><span>${escapeHtml(item.tipo)}</span></div>
        <div class="comparison-metric"><span>Participacao ${item.participation}</span><div><i style="width:${participationWidth}%"></i></div></div>
        <div class="comparison-metric feedback"><span>Feedback ${item.avgRating ? item.avgRating.toFixed(1) : '--'} / 5</span><div><i style="width:${feedbackWidth}%"></i></div></div>
      </div>
    `;
  }).join('');
}

function exportEventStatsExcel() {
  const eventId = document.getElementById('ed-hero').dataset.eventId;
  const event = getEvents().find((item) => item.id === eventId);
  if (!event) return;
  if (event.organizer !== getSession()?.userId) {
    alert('Apenas o organizador pode exportar estatisticas deste evento.');
    return;
  }

  const stats = buildEventStats(event);
  const rows = [
    ['Evento', event.titulo],
    ['Total inscritos', stats.totalConfirmed],
    ['Taxa presenca', `${stats.attendanceRate}%`],
    ['Feedback medio', stats.avgRating ? stats.avgRating.toFixed(2) : ''],
    [],
    ['Sessao', 'Tipo', 'Participacao', 'Feedback medio', 'Total feedback'],
    ...stats.sessions.map((item) => [
      item.titulo,
      item.tipo,
      item.participation,
      item.avgRating ? item.avgRating.toFixed(2) : '',
      item.feedbackCount
    ])
  ];
  const csv = rows.map((row) => row.map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `eventhub-estatisticas-${event.id}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
}

function exportEventStatsPdf() {
  const eventId = document.getElementById('ed-hero').dataset.eventId;
  const event = getEvents().find((item) => item.id === eventId);
  if (!event) return;
  if (event.organizer !== getSession()?.userId) {
    alert('Apenas o organizador pode exportar estatisticas deste evento.');
    return;
  }
  window.print();
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
  renderAgenda(ev);
  renderEventStats(ev);
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
  renderAgenda(ev);
  renderEventStats(ev);
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
  document.getElementById('sess-orador-search')?.addEventListener('input', handleOradorSearch);
  document.getElementById('sess-orador-search')?.addEventListener('focus', handleOradorSearchFocus);
  document.getElementById('btn-novo-orador')?.addEventListener('click', () => openSpeakerModal());
  document.addEventListener('click', (e) => {
    const search = document.getElementById('sess-orador-search');
    const results = document.getElementById('sess-orador-results');
    if (search && results && !search.contains(e.target) && !results.contains(e.target)) {
      results.classList.add('hidden');
    }
  });
}

function openSessionModal(eventId = null, sessionId = null) {
  const form = document.getElementById('sessionForm');
  form.reset();
  document.getElementById('sess-error').textContent = '';
  document.getElementById('sess-orador-results')?.classList.add('hidden');
  editingEventId = eventId;
  tempSessionOradores = [];

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
      tempSessionOradores = [...(sess.oradores || [])];
    }
  } else {
    document.getElementById('sess-id').value = '';
  }
  renderSessionOradores();
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

  const newSess = { id, titulo, desc, inicio, fim, tipo, capacidade, local, oradores: [...tempSessionOradores] };
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

let selectedImageDataUrl = null;

function initImageUpload() {
  const area = document.getElementById('ce-img-upload-area');
  const input = document.getElementById('ce-img-upload');
  const removeBtn = document.getElementById('ce-img-remove');
  if (!area || !input) return;

  area.addEventListener('click', (e) => {
    if (e.target === removeBtn || removeBtn?.contains(e.target)) return;
    input.click();
  });

  input.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file || !file.type.startsWith('image/')) return;
    selectedImageDataUrl = await resizeImage(file, 1200, 0.78);
    showImagePreview(selectedImageDataUrl);
  });

  removeBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    resetImageUpload();
  });
}

function resizeImage(file, maxWidth, quality) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        const ratio = Math.min(maxWidth / img.width, 1);
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * ratio);
        canvas.height = Math.round(img.height * ratio);
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  });
}

function showImagePreview(dataUrl) {
  const preview = document.getElementById('ce-img-preview');
  const placeholder = document.getElementById('ce-upload-placeholder');
  const removeBtn = document.getElementById('ce-img-remove');
  if (preview) { preview.src = dataUrl; preview.classList.add('has-image'); }
  if (placeholder) placeholder.classList.add('hidden');
  if (removeBtn) removeBtn.classList.remove('hidden');
}

function resetImageUpload() {
  selectedImageDataUrl = null;
  const preview = document.getElementById('ce-img-preview');
  const placeholder = document.getElementById('ce-upload-placeholder');
  const removeBtn = document.getElementById('ce-img-remove');
  const input = document.getElementById('ce-img-upload');
  if (preview) { preview.src = ''; preview.classList.remove('has-image'); }
  if (placeholder) placeholder.classList.remove('hidden');
  if (removeBtn) removeBtn.classList.add('hidden');
  if (input) input.value = '';
}

const mapInstances = {};
let locationDebounceTimer = null;

function initLocationMaps() {
  if (typeof L === 'undefined') return;
  document.getElementById('ce-local')?.addEventListener('input', (e) => {
    const query = e.target.value.trim();
    clearTimeout(locationDebounceTimer);
    const mapEl = document.getElementById('ce-local-map');
    if (!mapEl) return;
    if (query.length < 3) { mapEl.classList.add('hidden'); return; }
    locationDebounceTimer = setTimeout(() => geocodeAndShowMap('ce-local-map', query), 800);
  });
}

function geocodeAndShowMap(containerId, query) {
  if (typeof L === 'undefined') return;
  fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`, {
    headers: { 'Accept-Language': 'pt' }
  })
    .then((r) => r.json())
    .then((data) => {
      if (!data || !data.length) return;
      const lat = parseFloat(data[0].lat);
      const lon = parseFloat(data[0].lon);
      const container = document.getElementById(containerId);
      if (!container) return;
      container.classList.remove('hidden');

      if (mapInstances[containerId]) {
        mapInstances[containerId].map.setView([lat, lon], 14);
        mapInstances[containerId].marker.setLatLng([lat, lon]).setPopupContent(query).openPopup();
        setTimeout(() => mapInstances[containerId].map.invalidateSize(), 100);
      } else {
        const map = L.map(containerId).setView([lat, lon], 14);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        }).addTo(map);
        const marker = L.marker([lat, lon]).addTo(map).bindPopup(query).openPopup();
        mapInstances[containerId] = { map, marker };
        setTimeout(() => map.invalidateSize(), 100);
      }
    })
    .catch(() => {});
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
  submitSessionFeedback: handleSessionFeedbackSubmit,
  addOrador: addOradorToSession,
  removeOrador: removeOradorFromSession,
  openSpeakerModal: openSpeakerModal,
  openSpeakerProfile: openSpeakerProfile,
  editSpeakerAdmin: (id) => openSpeakerModal(id),
  deleteSpeakerAdmin: (id) => {
    if (!confirm('Deseja eliminar este orador? Sera removido de todas as sessoes.')) return;
    saveSpeakers(getSpeakers().filter((s) => s.id !== id));
    const events = getEvents();
    events.forEach((ev) => {
      if (ev.sessions) ev.sessions.forEach((sess) => { sess.oradores = (sess.oradores || []).filter((sid) => sid !== id); });
    });
    saveEvents(events);
    renderAdminSpeakers();
  },
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
};
