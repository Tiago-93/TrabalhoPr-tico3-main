/* ============================================================
   EventHub — Lógica Unificada (app.js)
   SPA: Register, Login, Dashboard, Recovery
   ============================================================ */

'use strict';

// ── CONFIG & STATE ──
const USERS_KEY   = 'eventhub_users';
const SESSION_KEY = 'eventhub_session';

// ── DOM ELEMENTS: VIEWS ──
const views = {
  register:  document.getElementById('view-register'),
  login:     document.getElementById('view-login'),
  dashboard: document.getElementById('view-dashboard')
};

// ── DOM ELEMENTS: REGISTO ──
const regForm     = document.getElementById('registerForm');
const regBtn      = document.getElementById('reg-btn');
const regNome     = document.getElementById('reg-nome');
const regEmail    = document.getElementById('reg-email');
const regPw       = document.getElementById('reg-pw');
const regCpw      = document.getElementById('reg-cpw');
const regSF       = document.getElementById('reg-sf');
const regSL       = document.getElementById('reg-sl');

// ── DOM ELEMENTS: LOGIN ──
const loginForm   = document.getElementById('loginForm');
const loginBtn    = document.getElementById('login-btn');
const loginEmail  = document.getElementById('login-email');
const loginPw     = document.getElementById('login-pw');
const rememberMe  = document.getElementById('rememberMe');
const loginAlert  = document.getElementById('loginAlert');
const loginAlertM = document.getElementById('loginAlertMsg');

// ── DOM ELEMENTS: DASHBOARD ──
const dashName    = document.getElementById('dash-name');
const sbName      = document.getElementById('sb-name');
const sbEmail     = document.getElementById('sb-email');
const sbAvatar    = document.getElementById('sb-avatar');
const sessUser    = document.getElementById('sess-user');
const sessEmail   = document.getElementById('sess-email');
const sessAt      = document.getElementById('sess-at');
const sessType    = document.getElementById('sess-type');

// ── INITIALIZATION ──
document.addEventListener('DOMContentLoaded', () => {
  initRouting();
  initValidation();
  initToggles();
  initModals();
  checkSession();
});

// ── ROUTING ──
function showView(viewId) {
  Object.values(views).forEach(v => v.classList.add('hidden'));
  views[viewId].classList.remove('hidden');
  window.scrollTo(0,0);
}

function initRouting() {
  document.getElementById('goLogin').addEventListener('click', e => { e.preventDefault(); showView('login'); });
  document.getElementById('goRegister').addEventListener('click', e => { e.preventDefault(); showView('register'); });
  document.getElementById('reg-goLogin').addEventListener('click', () => showView('login'));
}

function checkSession() {
  const session = getSession();
  if (session) {
    populateDashboard(session);
    showView('dashboard');
  } else {
    showView('register'); // Default view
  }
}

// ── UTILS ──
const getUsers = () => JSON.parse(localStorage.getItem(USERS_KEY)) || [];
const saveUsers = (users) => localStorage.setItem(USERS_KEY, JSON.stringify(users));
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
  grp.classList.remove('is-valid');
  grp.classList.add('is-error');
  if (err) err.textContent = msg;
  return false;
}

function setFieldValid(id) {
  const grp = document.getElementById(`grp-${id}`);
  const err = document.getElementById(`err-${id}`);
  grp.classList.remove('is-error');
  grp.classList.add('is-valid');
  if (err) err.textContent = '';
  return true;
}

function clearField(id) {
  const grp = document.getElementById(`grp-${id}`);
  const err = document.getElementById(`err-${id}`);
  grp.classList.remove('is-error', 'is-valid');
  if (err) err.textContent = '';
}

// ── VALIDATION ──
function initValidation() {
  // Real-time Registo
  regNome.addEventListener('blur', valRegNome);
  regEmail.addEventListener('blur', valRegEmail);
  regPw.addEventListener('input', valRegPw);
  regCpw.addEventListener('input', valRegCpw);

  // Clear errors on input
  [regNome, regEmail, loginEmail, loginPw].forEach(el => {
    el.addEventListener('input', () => {
      const id = el.id.replace('login-', 'login-').replace('reg-', 'reg-');
      clearField(id);
      if(id.startsWith('login')) loginAlert.classList.add('hidden');
    });
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
  if(hasLen) score++; if(hasLet) score++; if(hasNum) score++;
  if(val.length >= 12 && /[^a-zA-Z0-9]/.test(val)) score++;

  const levels = [
    { cls: '', lbl: '' },
    { cls: 's1', lbl: 'Fraca', col: '#f43f5e' },
    { cls: 's2', lbl: 'Média', col: '#f59e0b' },
    { cls: 's3', lbl: 'Boa', col: '#84cc16' },
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

  // Reset form
  loginBtn.disabled = false;
  loginBtn.querySelector('.btn-text').classList.remove('hidden');
  loginBtn.querySelector('.btn-spinner').classList.add('hidden');
  loginForm.reset();
});

// ── DASHBOARD LOGIC ──
function populateDashboard(s) {
  const firstName = s.nome.split(' ')[0];
  const initials = s.nome.split(' ').map(n => n[0]).slice(0,2).join('').toUpperCase();

  dashName.textContent = firstName;
  sbName.textContent = s.nome;
  sbEmail.textContent = s.email;
  sbAvatar.textContent = initials;
  sessUser.textContent = s.nome;
  sessEmail.textContent = s.email;
  sessAt.textContent = new Date(s.loginAt).toLocaleString('pt-PT');
  sessType.textContent = s.persistent ? 'Persistente (Lembrar-me)' : 'Temporária (Tab)';

  const hour = new Date().getHours();
  let greet = 'Bom dia';
  if(hour >= 12) greet = 'Boa tarde';
  if(hour >= 19) greet = 'Boa noite';
  document.querySelector('.dash-title').innerHTML = `${greet}, <span id="dash-name">${firstName}</span>! 👋`;
}

function logout() {
  localStorage.removeItem(SESSION_KEY);
  sessionStorage.removeItem(SESSION_KEY);
  showView('login');
}

document.getElementById('logoutBtn').addEventListener('click', logout);
document.getElementById('logoutBtnTop').addEventListener('click', logout);
document.getElementById('logoutBtnCard').addEventListener('click', logout);

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
    e.preventDefault();
    modal.classList.remove('hidden');
    recoverForm.classList.remove('hidden');
    recoverSucc.classList.add('hidden');
  });

  const close = () => modal.classList.add('hidden');
  document.getElementById('closeModal').addEventListener('click', close);
  document.getElementById('closeRecoverSuccess').addEventListener('click', close);
  modal.addEventListener('click', e => { if(e.target === modal) close(); });

  document.getElementById('sendRecoverBtn').addEventListener('click', async () => {
    const email = document.getElementById('recoverEmail').value.trim();
    if(!email || !email.includes('@')) return setFieldError('recover-email', 'Introduza um email válido.');

    const btn = document.getElementById('sendRecoverBtn');
    btn.disabled = true;
    btn.querySelector('.btn-spinner').classList.remove('hidden');

    await delay(1200);

    document.getElementById('recoverSentTo').textContent = email;
    recoverForm.classList.add('hidden');
    recoverSucc.classList.remove('hidden');
    btn.disabled = false;
    btn.querySelector('.btn-spinner').classList.add('hidden');
  });
}