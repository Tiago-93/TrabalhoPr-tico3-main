/* ============================================================
   app.js — Lógica de Registo de Utilizador
   User Story: Como utilizador, quero registar-me no sistema
   para aceder às funcionalidades de gestão de eventos.
   ============================================================ */

'use strict';

// ── Chave de armazenamento no localStorage ──
const USERS_KEY = 'eventhub_users';

// ── Selecionar elementos DOM ──
const form         = document.getElementById('registerForm');
const submitBtn    = document.getElementById('submitBtn');
const btnText      = submitBtn.querySelector('.btn-text');
const btnSpinner   = submitBtn.querySelector('.btn-spinner');
const formState    = document.getElementById('formState');
const successState = document.getElementById('successState');

const nomeInput    = document.getElementById('nome');
const emailInput   = document.getElementById('email');
const pwInput      = document.getElementById('password');
const confirmInput = document.getElementById('confirm');

// Força da password
const strengthFill  = document.getElementById('strengthFill');
const strengthLabel = document.getElementById('strengthLabel');

// Requisitos da password
const reqLen    = document.getElementById('req-len');
const reqLetter = document.getElementById('req-letter');
const reqNumber = document.getElementById('req-number');

// Toggle visibilidade passwords
document.getElementById('togglePw').addEventListener('click', () => toggleVisibility(pwInput, 'togglePw'));
document.getElementById('toggleConfirm').addEventListener('click', () => toggleVisibility(confirmInput, 'toggleConfirm'));

// ── Utilitários ──

/**
 * Devolve a lista de utilizadores registados no localStorage.
 * @returns {Array<{id, nome, email, passwordHash, createdAt, confirmed}>}
 */
function getUsers() {
  try {
    return JSON.parse(localStorage.getItem(USERS_KEY)) || [];
  } catch {
    return [];
  }
}

/**
 * Guarda a lista de utilizadores no localStorage.
 * @param {Array} users
 */
function saveUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

/**
 * Gera um ID único simples (UUID v4 simplificado).
 * @returns {string}
 */
function generateId() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0;
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
  });
}

/**
 * Hash simples da password (simulação — em produção usar bcrypt).
 * @param {string} pw
 * @returns {string}
 */
function hashPassword(pw) {
  let hash = 0;
  for (let i = 0; i < pw.length; i++) {
    hash = (Math.imul(31, hash) + pw.charCodeAt(i)) | 0;
  }
  return `hash_${hash.toString(36)}_${pw.length}`;
}

/**
 * Alterna a visibilidade do campo password.
 * @param {HTMLInputElement} input
 * @param {string} btnId
 */
function toggleVisibility(input, btnId) {
  const btn = document.getElementById(btnId);
  const eyeOn  = btn.querySelector('.eye-on');
  const eyeOff = btn.querySelector('.eye-off');
  const isHidden = input.type === 'password';
  input.type = isHidden ? 'text' : 'password';
  btn.setAttribute('aria-label', isHidden ? 'Ocultar password' : 'Mostrar password');
  eyeOn.classList.toggle('hidden', isHidden);
  eyeOff.classList.toggle('hidden', !isHidden);
}

// ── Validações ──

/**
 * Valida o nome completo.
 * Regras: não vazio, mínimo 2 palavras.
 */
function validateNome() {
  const val = nomeInput.value.trim();
  const group = document.getElementById('group-nome');
  const err   = document.getElementById('nome-error');

  if (!val) {
    return setFieldError(group, err, 'O nome completo é obrigatório.');
  }
  if (val.length < 3) {
    return setFieldError(group, err, 'O nome deve ter pelo menos 3 caracteres.');
  }
  if (!/\s/.test(val)) {
    return setFieldError(group, err, 'Introduza o seu nome completo (nome e apelido).');
  }
  return setFieldValid(group, err);
}

/**
 * Valida o formato do email e verifica se já está registado.
 */
function validateEmail() {
  const val = emailInput.value.trim();
  const group = document.getElementById('group-email');
  const err   = document.getElementById('email-error');

  if (!val) {
    return setFieldError(group, err, 'O email é obrigatório.');
  }
  // RFC-5322 simplificado
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  if (!emailRegex.test(val)) {
    return setFieldError(group, err, 'Formato de email inválido. Ex: nome@dominio.com');
  }

  // Verificar se email já está registado
  const users = getUsers();
  const exists = users.some(u => u.email.toLowerCase() === val.toLowerCase());
  if (exists) {
    return setFieldError(group, err, 'Este email já se encontra registado no sistema.');
  }

  return setFieldValid(group, err);
}

/**
 * Valida a password:
 * – Mínimo 8 caracteres
 * – Pelo menos uma letra
 * – Pelo menos um número
 */
function validatePassword() {
  const val   = pwInput.value;
  const group = document.getElementById('group-password');
  const err   = document.getElementById('password-error');

  if (!val) {
    resetStrength();
    return setFieldError(group, err, 'A password é obrigatória.');
  }

  const hasLen    = val.length >= 8;
  const hasLetter = /[a-zA-ZÀ-ÿ]/.test(val);
  const hasNumber = /\d/.test(val);

  // Atualizar requisitos visuais
  reqLen.classList.toggle('ok', hasLen);
  reqLetter.classList.toggle('ok', hasLetter);
  reqNumber.classList.toggle('ok', hasNumber);

  // Calcular força
  updateStrength(val, hasLen, hasLetter, hasNumber);

  if (!hasLen) {
    return setFieldError(group, err, 'A password deve ter pelo menos 8 caracteres.');
  }
  if (!hasLetter) {
    return setFieldError(group, err, 'A password deve conter pelo menos uma letra.');
  }
  if (!hasNumber) {
    return setFieldError(group, err, 'A password deve conter pelo menos um número.');
  }

  return setFieldValid(group, err);
}

/**
 * Valida a confirmação da password.
 */
function validateConfirm() {
  const val   = confirmInput.value;
  const group = document.getElementById('group-confirm');
  const err   = document.getElementById('confirm-error');

  if (!val) {
    return setFieldError(group, err, 'A confirmação de password é obrigatória.');
  }
  if (val !== pwInput.value) {
    return setFieldError(group, err, 'As passwords não coincidem. Verifique e tente novamente.');
  }
  return setFieldValid(group, err);
}

// ── Força da Password ──

/**
 * Calcula e exibe a força da password.
 */
function updateStrength(pw, hasLen, hasLetter, hasNumber) {
  let score = 0;
  if (hasLen)    score++;
  if (hasLetter) score++;
  if (hasNumber) score++;
  if (pw.length >= 12 && /[^a-zA-Z0-9]/.test(pw)) score++;

  const levels = [
    { cls: '', label: '' },
    { cls: 's1', label: 'Fraca',  color: '#f43f5e' },
    { cls: 's2', label: 'Média',  color: '#f59e0b' },
    { cls: 's3', label: 'Boa',    color: '#84cc16' },
    { cls: 's4', label: 'Forte',  color: '#22c55e' },
  ];

  const lvl = levels[Math.min(score, 4)];
  strengthFill.className = `strength-fill ${lvl.cls}`;
  strengthLabel.textContent = lvl.label;
  if (lvl.color) strengthLabel.style.color = lvl.color;
}

function resetStrength() {
  strengthFill.className = 'strength-fill';
  strengthLabel.textContent = '';
  [reqLen, reqLetter, reqNumber].forEach(r => r.classList.remove('ok'));
}

// ── Estado dos campos ──

function setFieldError(group, errEl, message) {
  group.classList.remove('is-valid');
  group.classList.add('is-error');
  errEl.textContent = message;
  return false;
}

function setFieldValid(group, errEl) {
  group.classList.remove('is-error');
  group.classList.add('is-valid');
  errEl.textContent = '';
  return true;
}

function clearField(group, errEl) {
  group.classList.remove('is-valid', 'is-error');
  errEl.textContent = '';
}

// ── Eventos de validação em tempo real ──

nomeInput.addEventListener('blur', validateNome);
nomeInput.addEventListener('input', () => {
  if (document.getElementById('group-nome').classList.contains('is-error')) validateNome();
});

emailInput.addEventListener('blur', validateEmail);
emailInput.addEventListener('input', () => {
  const group = document.getElementById('group-email');
  clearField(group, document.getElementById('email-error'));
});

pwInput.addEventListener('input', () => {
  validatePassword();
  // Revalidar confirmação se já preenchida
  if (confirmInput.value) validateConfirm();
});
pwInput.addEventListener('blur', validatePassword);

confirmInput.addEventListener('input', () => {
  if (confirmInput.value) validateConfirm();
});
confirmInput.addEventListener('blur', validateConfirm);

// ── Submissão do Formulário ──

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  // Validar todos os campos
  const nomeOk    = validateNome();
  const emailOk   = validateEmail();
  const pwOk      = validatePassword();
  const confirmOk = validateConfirm();

  if (!nomeOk || !emailOk || !pwOk || !confirmOk) {
    // Focar no primeiro campo inválido
    const firstError = form.querySelector('.is-error input');
    if (firstError) firstError.focus();
    return;
  }

  // Mostrar estado de carregamento
  setLoading(true);

  // Simular latência de rede (0.8s)
  await delay(800);

  // Criar utilizador
  const newUser = {
    id:           generateId(),
    nome:         nomeInput.value.trim(),
    email:        emailInput.value.trim().toLowerCase(),
    passwordHash: hashPassword(pwInput.value),
    createdAt:    new Date().toISOString(),
    confirmed:    false,
    token:        generateId(),
  };

  // Guardar no localStorage
  const users = getUsers();
  users.push(newUser);
  saveUsers(users);

  // Simular envio de email de confirmação
  simulateConfirmationEmail(newUser);

  setLoading(false);
  showSuccess(newUser);
});

// ── Helpers ──

function setLoading(isLoading) {
  submitBtn.disabled = isLoading;
  btnText.classList.toggle('hidden', isLoading);
  btnSpinner.classList.toggle('hidden', !isLoading);
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Simula o envio de email de confirmação.
 * Em produção, esta chamada seria feita ao servidor.
 */
function simulateConfirmationEmail(user) {
  const emailData = {
    to:        user.email,
    subject:   'Confirme a sua conta — EventHub',
    body:      `Olá ${user.nome}, obrigado por se registar! Token: ${user.token}`,
    sentAt:    new Date().toISOString(),
    delivered: true,
  };
  // Guardar registo do email simulado
  const emailLog = JSON.parse(localStorage.getItem('eventhub_emails') || '[]');
  emailLog.push(emailData);
  localStorage.setItem('eventhub_emails', JSON.stringify(emailLog));
  console.info('📧 Email de confirmação simulado:', emailData);
}

/**
 * Exibe o estado de sucesso após registo.
 */
function showSuccess(user) {
  formState.classList.add('hidden');
  successState.classList.remove('hidden');
  document.getElementById('confirmedEmail').textContent = user.email;
  document.getElementById('confirmedName').textContent  = user.nome.split(' ')[0];
}

// ── Link "Ir para Login" ──
document.getElementById('goLoginBtn').addEventListener('click', (e) => {
  e.preventDefault();
  // Em modo single-file: mostrar alerta informativo
  alert('Funcionalidade de login em desenvolvimento.\nO seu registo foi guardado com sucesso!');
});

// ── Link "Já tem conta?" ──
document.getElementById('switchToLogin').addEventListener('click', (e) => {
  e.preventDefault();
  alert('Funcionalidade de login em desenvolvimento.\nRegistos guardados: ' + getUsers().length);
});
