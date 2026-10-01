const SESSION_KEY = 'talentflow_ai_session';
const THEME_KEY = 'talentflow_theme';
const SETTINGS_KEY = 'talentflow_ai_settings_v1';
const MAX_RESUME_SIZE = 10 * 1024 * 1024;
const RESUME_EXTENSIONS = ['.pdf', '.doc', '.docx'];

const demoData = {
  candidates: [
    { id: 1, name: 'Aarav Mehta', email: 'aarav@example.com', role: 'Frontend Developer', experience: '3 years', score: 94, stage: 'Interview', applied_date: '2026-09-25', source: 'LinkedIn' },
    { id: 2, name: 'Priya Shah', email: 'priya@example.com', role: 'Python Developer', experience: '2 years', score: 91, stage: 'Screening', applied_date: '2026-09-24', source: 'Referral' },
    { id: 3, name: 'Rohan Patil', email: 'rohan@example.com', role: 'DevOps Engineer', experience: '4 years', score: 88, stage: 'Shortlisted', applied_date: '2026-09-23', source: 'Indeed' },
    { id: 4, name: 'Sneha Kulkarni', email: 'sneha@example.com', role: 'Data Analyst', experience: '2 years', score: 86, stage: 'Applied', applied_date: '2026-09-22', source: 'Website' },
    { id: 5, name: 'Vikram Joshi', email: 'vikram@example.com', role: 'Backend Developer', experience: '5 years', score: 82, stage: 'Offer', applied_date: '2026-09-20', source: 'LinkedIn' }
  ],
  jobs: [
    { id: 1, title: 'Frontend Developer', department: 'Engineering', location: 'Mumbai / Hybrid', type: 'Full-time', applicants: 18 },
    { id: 2, title: 'Python Developer', department: 'Engineering', location: 'Remote', type: 'Full-time', applicants: 12 },
    { id: 3, title: 'Data Analyst', department: 'Analytics', location: 'Pune / Hybrid', type: 'Full-time', applicants: 9 }
  ],
  interviews: [
    { id: 1, candidate: 'Aarav Mehta', role: 'Frontend Developer', date: '2026-09-28', time: '10:30 AM', interviewer: 'Neha Sharma', status: 'Scheduled', link: 'https://meet.google.com/' },
    { id: 2, candidate: 'Rohan Patil', role: 'DevOps Engineer', date: '2026-09-29', time: '2:00 PM', interviewer: 'Rahul Verma', status: 'Pending', link: 'https://meet.google.com/' },
    { id: 3, candidate: 'Priya Shah', role: 'Python Developer', date: '2026-09-30', time: '11:00 AM', interviewer: 'Anita Rao', status: 'Scheduled', link: 'https://meet.google.com/' }
  ]
};

let state = {
  candidates: [],
  jobs: [],
  interviews: [],
  applications: [],
  settings: loadSettings()
};

let currentUser = null;
let revealObserver;

function readSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (_) {
    return null;
  }
}

function persistSession(sessionData) {
  if (!sessionData) {
    localStorage.removeItem(SESSION_KEY);
    return;
  }
  localStorage.setItem(SESSION_KEY, JSON.stringify(sessionData));
}

currentUser = readSession()?.user || null;

const $ = (id) => document.getElementById(id);
const esc = (s) => String(s ?? '').replace(/[&<>'"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[c]));

const api = {
  async request(path, options = {}) {
    const opts = { ...options };
    const session = readSession();
    const headers = { ...(opts.headers || {}) };

    if (session && session.token) {
      headers.Authorization = `Bearer ${session.token}`;
    }

    if (opts.body && typeof opts.body !== 'string' && !(opts.body instanceof FormData)) {
      opts.body = JSON.stringify(opts.body);
      opts.headers = { 'Content-Type': 'application/json', ...headers };
    } else {
      opts.headers = headers;
    }

    const res = await fetch(path, opts);
    const text = await res.text();
    let json = null;
    try { json = text ? JSON.parse(text) : null; } catch (_) { json = null; }
    if (!res.ok) {
      const msg = (json && json.message) || `Request failed (${res.status})`;
      const err = new Error(msg);
      err.status = res.status;
      err.body = json;
      throw err;
    }
    return json;
  },
  login(email, password) {
    return this.request('/api/auth/login', { method: 'POST', body: { email, password } });
  },
  register(name, email, password) {
    return this.request('/api/auth/register', {
      method: 'POST',
      body: { name, email, password }
    });
  },
  register(payload) {
    return this.request('/api/auth/register', { method: 'POST', body: payload });
  },
  getCandidates(params = {}) {
    const qs = new URLSearchParams(params).toString();
    return this.request(`/api/candidates${qs ? '?' + qs : ''}`);
  },
  createCandidate(body) {
    return this.request('/api/candidates', { method: 'POST', body });
  },
  updateCandidate(id, body) {
    return this.request(`/api/candidates/${id}`, { method: 'PATCH', body });
  },
  getJobs() {
    return this.request('/api/jobs');
  },
  createJob(body) {
    return this.request('/api/jobs', { method: 'POST', body });
  },
  getInterviews() {
    return this.request('/api/interviews');
  },
  createInterview(body) {
    return this.request('/api/interviews', { method: 'POST', body });
  },
  createApplication(body) {
    return this.request('/api/applications', { method: 'POST', body });
  },
  getApplication(id) {
    return this.request(`/api/applications/${id}`);
  },
  screen(candidateId, jobId) {
    return this.request('/api/screening', { method: 'POST', body: { candidateId, jobId } });
  },
  async uploadResume(file, candidateId) {
    const fd = new FormData();
    fd.append('file', file);
    if (candidateId) fd.append('candidateId', String(candidateId));
    return this.request('/api/resumes/upload', { method: 'POST', body: fd });
  }
};

function loadSettings() {
  try {
    return JSON.parse(localStorage.getItem(SETTINGS_KEY)) || { ai: true, notifications: true, compact: false };
  } catch (_) {
    return { ai: true, notifications: true, compact: false };
  }
}
function saveSettings() {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(state.settings));
}

function updateThemeLogos() {
  const sourceAttribute = document.body.classList.contains('dark-mode') ? 'darkSrc' : 'lightSrc';
  document.querySelectorAll('.brand-logo').forEach((logo) => {
    logo.src = logo.dataset[sourceAttribute];
  });
}

function showToast(message, kind = 'info') {
  const el = document.createElement('div');
  el.className = 'toast ' + kind;
  el.textContent = message;
  $('toastContainer').appendChild(el);
  setTimeout(() => el.remove(), 2800);
}
function initials(name) {
  return String(name || 'Admin').split(' ').map((x) => x[0]).join('').slice(0, 2).toUpperCase();
}
function fmtDate(v) {
  if (!v) return '—';
  const s = typeof v === 'string' ? v.slice(0, 10) : new Date(v).toISOString().slice(0, 10);
  return new Date(s + 'T00:00:00').toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}
function stageClass(stage) {
  return String(stage || '').toLowerCase().replace(/\s/g, '-');
}

function useDemoFallback(err) {
  console.warn('API unreachable, using demo fallback —', err && err.message);
  state.candidates = JSON.parse(JSON.stringify(demoData.candidates));
  state.jobs = JSON.parse(JSON.stringify(demoData.jobs));
  state.interviews = JSON.parse(JSON.stringify(demoData.interviews));
}

async function refreshAll() {
  try {
    const [candidates, jobs, interviews] = await Promise.all([
      api.getCandidates().catch(() => JSON.parse(JSON.stringify(demoData.candidates))),
      api.getJobs().catch(() => JSON.parse(JSON.stringify(demoData.jobs))),
      api.getInterviews().catch(() => JSON.parse(JSON.stringify(demoData.interviews)))
    ]);
    state.candidates = candidates || [];
    state.jobs = jobs || [];
    state.interviews = interviews || [];
    if (!state.candidates.length && !state.jobs.length && !state.interviews.length) {
      useDemoFallback(new Error('Empty responses'));
    }
  } catch (err) {
    useDemoFallback(err);
  }
}

function initAuth() {
  if (currentUser) {
    $('authScreen').classList.add('hidden');
    $('app').classList.remove('hidden');
    updateUserUI();
    refreshAll().then(renderAll);
  }
  $('showRegister').onclick = () => {
    $('loginPanel').classList.add('hidden');
    $('registerPanel').classList.remove('hidden');
  };
  $('showLogin').onclick = () => {
    $('registerPanel').classList.add('hidden');
    $('loginPanel').classList.remove('hidden');
  };
  document.querySelectorAll('.password-toggle').forEach((btn) => {
    btn.onclick = () => {
      const input = $(btn.dataset.target);
      input.type = input.type === 'password' ? 'text' : 'password';
      btn.textContent = input.type === 'password' ? 'Show' : 'Hide';
    };
  });
  $('loginForm').onsubmit = async (e) => {
    e.preventDefault();
    const email = $('loginEmail').value.trim();
    const pass = $('loginPassword').value;
    try {
      const result = await api.login(email, pass);
      const session = { token: result.token, user: result.user };
      currentUser = result.user;
      persistSession(session);
      $('authScreen').classList.add('hidden');
      $('app').classList.remove('hidden');
      updateUserUI();
      await refreshAll();
      renderAll();
      showToast(result.message || 'Welcome to TalentFlow AI', 'success');
    } catch (err) {
      showToast(err.message || 'Invalid credentials', 'error');
    }
  };
  
  $('registerForm').onsubmit = async (e) => {
    e.preventDefault();

    const firstName = $('registerFirstName').value.trim();
    const lastName = $('registerLastName').value.trim();
    const email = $('registerEmail').value.trim();
    const password = $('registerPassword').value;
    const confirmPassword = $('registerConfirmPassword').value;

    if (password !== confirmPassword) {
      return showToast('Passwords do not match', 'error');
    }

    const name = `${firstName} ${lastName}`.trim();

    try {
      const result = await api.register(name, email, password);

      currentUser = result.user || { name, email };

      localStorage.setItem(
        SESSION_KEY,
        JSON.stringify({
          ...currentUser,
          token: result.token
        })
      );

      $('authScreen').classList.add('hidden');
      $('app').classList.remove('hidden');

      updateUserUI();
      await refreshAll();
      renderAll();

      showToast('Account created successfully', 'success');
    } catch (err) {
      showToast(err.message || 'Unable to create account', 'error');
    }
  };

  $('forgotPassword').onclick = () => showToast('Password reset instructions would be sent to your email.');
}

function updateUserUI() {
  const u = currentUser || { name: 'Admin', email: 'admin@talentflowai.com' };
  $('sidebarUserName').textContent = u.name;
  $('sidebarUserEmail').textContent = u.email;
  $('sidebarAvatar').textContent = initials(u.name);
  $('welcomeName').textContent = (u.name || 'Admin').split(' ')[0];
}

function initNavigation() {
  document.querySelectorAll('.nav-item[data-page]').forEach((btn) => btn.onclick = () => navigate(btn.dataset.page));
  document.querySelectorAll('[data-page-link]').forEach((btn) => btn.onclick = () => navigate(btn.dataset.pageLink));
  $('mobileMenu').onclick = () => {
    $('sidebar').classList.toggle('open');
    $('sidebarOverlay').classList.toggle('open');
  };
  $('sidebarOverlay').onclick = () => {
    $('sidebar').classList.remove('open');
    $('sidebarOverlay').classList.remove('open');
  };
  $('logoutButton').onclick = () => {
    persistSession(null);
    currentUser = null;
    location.reload();
  };
}

function navigate(page) {
  document.querySelectorAll('.page').forEach((p) => p.classList.remove('active'));
  const target = $('page-' + page);
  if (target) target.classList.add('active');
  document.querySelectorAll('.nav-item[data-page]').forEach((b) => b.classList.toggle('active', b.dataset.page === page));
  const titles = {
    dashboard: 'Recruitment Dashboard',
    candidates: 'Candidates',
    jobs: 'Job Openings',
    interviews: 'Scheduled Interviews',
    pipeline: 'Candidate Pipeline',
    analytics: 'Recruitment Analytics',
    settings: 'Settings'
  };
  $('pageTitle').textContent = titles[page] || 'TalentFlow AI';
  $('sidebar').classList.remove('open');
  $('sidebarOverlay').classList.remove('open');
  renderAll();
  revealActivePage();
}

function revealActivePage() {
  const page = document.querySelector('.page.active');
  if (!page) return;

  const items = page.querySelectorAll(
    ':scope > *, .stats-grid > *, .dashboard-grid > *, .jobs-grid > *, .interview-list > *, .pipeline-board > *, .analytics-grid > *'
  );
  items.forEach((item, index) => {
    item.classList.remove('is-visible');
    item.classList.add('reveal-item');
    item.style.setProperty('--reveal-delay', `${(index % 5) * 65}ms`);
    if (revealObserver) revealObserver.observe(item);
    else item.classList.add('is-visible');
  });
}

function renderStats() {
  const c = state.candidates;
  $('totalCandidates').textContent = c.length;
  $('shortlistedCandidates').textContent = c.filter((x) => ['Shortlisted', 'Interview', 'Offer'].includes(x.stage)).length;
  $('totalInterviews').textContent = state.interviews.length;
  $('totalHired').textContent = c.filter((x) => x.stage === 'Hired').length;
  $('interviewNavCount').textContent = state.interviews.length;
}

function renderDashboard() {
  const list = state.interviews.slice(0, 4);
  $('dashboardInterviews').innerHTML = list.length
    ? list.map((i) => `<div class="interview-card"><div><h4>${esc(i.candidate)}</h4><p>${esc(i.role)}</p><p>${fmtDate(i.date)} · ${esc(i.time)} · ${esc(i.interviewer)}</p></div><span class="tag">${esc(i.status)}</span></div>`).join('')
    : '<p class="ai-main-text">No interviews scheduled.</p>';
  $('recentCandidateBody').innerHTML = state.candidates.slice(0, 5).map((c) => `<tr><td><strong>${esc(c.name)}</strong><br><small>${esc(c.email)}</small></td><td>${esc(c.role)}</td><td><strong>${c.score}%</strong></td><td><span class="tag">${esc(c.stage)}</span></td><td>${fmtDate(c.applied_date || c.applied)}</td><td><button class="link-button" data-candidate="${c.id}">View</button></td></tr>`).join('');
  bindCandidateButtons();
}

function renderCandidates() {
  const q = ($('candidateSearch').value || '').toLowerCase();
  const status = $('candidateStatusFilter').value;
  const role = $('candidateRoleFilter').value;
  const sort = $('candidateSort').value;
  let arr = state.candidates.filter((c) => {
    const hay = `${c.name} ${c.email} ${c.role}`.toLowerCase();
    const qOK = !q || hay.includes(q);
    const sOK = status === 'all' || c.stage === status;
    const rOK = role === 'all' || c.role === role;
    return qOK && sOK && rOK;
  });
  if (sort === 'score') arr.sort((a, b) => b.score - a.score);
  else if (sort === 'name') arr.sort((a, b) => a.name.localeCompare(b.name));
  else arr.sort((a, b) => String(b.applied_date || b.applied || '').localeCompare(String(a.applied_date || a.applied || '')));
  $('candidateResultCount').textContent = `${arr.length} candidate${arr.length !== 1 ? 's' : ''}`;
  $('candidateTableBody').innerHTML = arr.map((c) => `<tr><td><strong>${esc(c.name)}</strong><br><small>${esc(c.email)}</small></td><td>${esc(c.role)}</td><td>${esc(c.experience)}</td><td><strong>${c.score}%</strong></td><td><span class="tag">${esc(c.stage)}</span></td><td>${fmtDate(c.applied_date || c.applied)}</td><td><button class="link-button" data-candidate="${c.id}">View</button></td></tr>`).join('');
  bindCandidateButtons();
}

function renderJobs() {
  $('jobsGrid').innerHTML = state.jobs.map((j) => `<div class="job-card"><span class="section-kicker">${esc(j.department)}</span><h3>${esc(j.title)}</h3><p>${esc(j.location)} · ${esc(j.type)}</p><div class="job-meta"><span class="tag">${j.applicants} applicants</span><span class="tag">Open</span></div></div>`).join('');
}

function renderInterviews() {
  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  $('todayInterviews').textContent = state.interviews.filter((i) => String(i.date).slice(0, 10) === today).length;
  $('weekInterviews').textContent = state.interviews.length;
  $('pendingInterviews').textContent = state.interviews.filter((i) => i.status === 'Pending').length;
  $('interviewList').innerHTML = state.interviews.map((i) => `<div class="interview-card"><div><h4>${esc(i.candidate)}</h4><p>${esc(i.role)} · ${esc(i.interviewer)}</p><p>${fmtDate(i.date)} · ${esc(i.time)}</p></div><div><span class="tag">${esc(i.status)}</span><br><button class="link-button" data-interview="${i.id}">Open</button></div></div>`).join('');
  document.querySelectorAll('[data-interview]').forEach((b) => b.onclick = () => openInterview(+b.dataset.interview));
}

function renderPipeline() {
  const stages = ['Applied', 'Screening', 'Shortlisted', 'Interview', 'Offer', 'Hired'];
  $('pipelineBoard').innerHTML = stages.map((s) => `<div class="pipeline-column"><h4>${s} <span class="pipeline-count">(${state.candidates.filter((c) => c.stage === s).length})</span></h4>${state.candidates.filter((c) => c.stage === s).map((c) => `<div class="pipeline-card"><strong>${esc(c.name)}</strong><span>${esc(c.role)}</span><span>AI Match ${c.score}%</span></div>`).join('') || '<span class="pipeline-count">No candidates</span>'}</div>`).join('');
}

function renderAnalytics() {
  const stages = ['Applied', 'Screening', 'Shortlisted', 'Interview', 'Offer', 'Hired'];
  $('funnelChart').innerHTML = stages.map((s) => {
    const n = state.candidates.filter((c) => c.stage === s).length;
    const pct = state.candidates.length ? Math.round((n / state.candidates.length) * 100) : 0;
    return `<div class="chart-row"><span class="chart-label">${s}</span><div class="chart-bar"><div class="chart-fill" style="width:${pct}%"></div></div><span class="chart-value">${n}</span></div>`;
  }).join('');
  const sources = {};
  state.candidates.forEach((c) => { sources[c.source || 'Unknown'] = (sources[c.source || 'Unknown'] || 0) + 1; });
  const entries = Object.entries(sources);
  $('sourceChart').innerHTML = entries.length ? entries.map(([s, n]) => {
    const pct = state.candidates.length ? Math.round((n / state.candidates.length) * 100) : 0;
    return `<div class="chart-row"><span class="chart-label">${esc(s)}</span><div class="chart-bar"><div class="chart-fill" style="width:${pct}%"></div></div><span class="chart-value">${n}</span></div>`;
  }).join('') : '<p class="ai-main-text">No source data yet.</p>';
}

function renderSettings() {
  $('settingAI').checked = !!state.settings.ai;
  $('settingNotifications').checked = !!state.settings.notifications;
  $('settingCompact').checked = !!state.settings.compact;
  document.body.classList.toggle('compact-tables', !!state.settings.compact);
}

function populateRoleFilter() {
  const select = $('candidateRoleFilter');
  const value = select.value;
  const roles = [...new Set(state.candidates.map((c) => c.role).filter(Boolean))];
  select.innerHTML = '<option value="all">All positions</option>' + roles.map((r) => `<option value="${esc(r)}">${esc(r)}</option>`).join('');
  select.value = roles.includes(value) ? value : 'all';
}

function bindCandidateButtons() {
  document.querySelectorAll('[data-candidate]').forEach((b) => b.onclick = () => openCandidate(+b.dataset.candidate));
}

function renderAll() {
  renderStats();
  renderDashboard();
  populateRoleFilter();
  renderCandidates();
  renderJobs();
  renderInterviews();
  renderPipeline();
  renderAnalytics();
  renderSettings();
  revealActivePage();
}

function openCandidate(id) {
  const c = state.candidates.find((x) => x.id === id);
  if (!c) return;
  const resumeMarkup = c.resume && c.resume.filename
    ? `<p><strong>Resume:</strong> ${esc(c.resume.filename)}</p>`
    : '<p>No resume uploaded</p>';
  openModal('CANDIDATE', 'Candidate Profile',
    `<div>
      <h3>${esc(c.name)}</h3>
      <p class="ai-main-text">${esc(c.email)} · ${esc(c.experience)}</p>
      <div class="job-meta">
        <span class="tag">${esc(c.role)}</span>
        <span class="tag">AI Match ${c.score}%</span>
        <span class="tag">${esc(c.stage)}</span>
      </div>
      <hr style="border:0;border-top:1px solid var(--line);margin:18px 0">
      ${resumeMarkup}
      <label>Update stage</label>
      <select id="candidateStageEdit" class="form-control">
        ${['Applied', 'Screening', 'Shortlisted', 'Interview', 'Offer', 'Hired', 'Rejected'].map((s) => `<option ${s === c.stage ? 'selected' : ''}>${s}</option>`).join('')}
      </select>
      <button class="primary-button" id="saveCandidateStage" style="margin-top:14px">Save Changes</button>
    </div>`);
  $('saveCandidateStage').onclick = async () => {
    const newStage = $('candidateStageEdit').value;
    try {
      await api.updateCandidate(c.id, { stage: newStage });
      showToast('Candidate stage updated', 'success');
    } catch (err) {
      showToast(err.message || 'Could not update stage — saved locally', 'error');
    }
    c.stage = newStage;
    closeModal();
    renderAll();
  };
}

function openInterview(id) {
  const i = state.interviews.find((x) => x.id === id);
  if (!i) return;
  openModal('INTERVIEW', 'Interview Details',
    `<h3>${esc(i.candidate)}</h3>
     <p class="ai-main-text">${esc(i.role)}</p>
     <p><strong>Date:</strong> ${fmtDate(i.date)}<br><strong>Time:</strong> ${esc(i.time)}<br><strong>Interviewer:</strong> ${esc(i.interviewer)}</p>
     <a class="primary-button" style="display:inline-block;text-decoration:none" href="${esc(i.link)}" target="_blank">Open Meeting</a>`);
}

function openModal(kicker, title, body) {
  $('modalKicker').textContent = kicker;
  $('modalTitle').textContent = title;
  $('modalBody').innerHTML = body;
  $('modalOverlay').classList.add('active');
}
function closeModal() {
  $('modalOverlay').classList.remove('active');
}

function addCandidate() {
  openModal('TALENT POOL', 'Add Candidate',
    `<form class="modal-form" id="candidateForm">
      <div><label>Name</label><input id="newName" required></div>
      <div><label>Email</label><input type="email" id="newEmail" required></div>
      <div><label>Position</label><input id="newRole" required></div>
      <div><label>Experience</label><input id="newExperience" placeholder="e.g. 2 years" required></div>
      <div><label>AI Match</label><input id="newScore" type="number" min="0" max="100" value="85" required></div>
      <div><label for="newResume">Resume</label><input id="newResume" type="file" accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"></div>
      <button class="primary-button" id="addCandidateSubmit" type="submit">Add Candidate</button>
    </form>`);
  $('candidateForm').onsubmit = async (e) => {
    e.preventDefault();
    const file = $('newResume').files[0];
    if (file) {
      const extension = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();
      if (!RESUME_EXTENSIONS.includes(extension)) {
        return showToast('Choose a PDF, DOC, or DOCX resume.', 'error');
      }
      if (file.size > MAX_RESUME_SIZE) {
        return showToast('Resume must be 10 MB or smaller.', 'error');
      }
    }

    const payload = {
      name: $('newName').value,
      email: $('newEmail').value,
      role: $('newRole').value,
      experience: $('newExperience').value,
      score: +$('newScore').value
    };
    const submitButton = $('addCandidateSubmit');
    submitButton.disabled = true;
    submitButton.textContent = 'Adding...';
    let created;
    try {
      created = await api.createCandidate(payload);
    } catch (err) {
      submitButton.disabled = false;
      submitButton.textContent = 'Add Candidate';
      return showToast('Could not create candidate. Please try again.', 'error');
    }

    let resume;
    if (file) {
      submitButton.textContent = 'Uploading resume...';
      try {
        resume = await api.uploadResume(file, created.id);
      } catch (err) {
        await refreshAll();
        if (!state.candidates.some((candidate) => String(candidate.id) === String(created.id))) {
          state.candidates.unshift(created);
        }
        closeModal();
        navigate('candidates');
        return showToast('Candidate added, but the resume upload failed.', 'error');
      }
    }

    await refreshAll();
    const savedCandidate = state.candidates.find((candidate) => String(candidate.id) === String(created.id));
    if (savedCandidate && resume) savedCandidate.resume = resume;
    if (!savedCandidate) state.candidates.unshift({ ...created, ...(resume ? { resume } : {}) });
    closeModal();
    navigate('candidates');
    showToast('Candidate added', 'success');
  };
}

function addJob() {
  openModal('RECRUITMENT', 'Create Job',
    `<form class="modal-form" id="jobForm">
      <div><label>Job Title</label><input id="jobTitle" required></div>
      <div><label>Department</label><input id="jobDept" required></div>
      <div><label>Location</label><input id="jobLocation" required></div>
      <div><label>Type</label>
        <select id="jobType">
          <option>Full-time</option><option>Part-time</option><option>Contract</option>
        </select>
      </div>
      <button class="primary-button">Create Job</button>
    </form>`);
  $('jobForm').onsubmit = async (e) => {
    e.preventDefault();
    const payload = {
      title: $('jobTitle').value,
      department: $('jobDept').value,
      location: $('jobLocation').value,
      type: $('jobType').value
    };
    try {
      const created = await api.createJob(payload);
      state.jobs.unshift(created);
      showToast('Job opening created', 'success');
    } catch (err) {
      const fallback = { id: Date.now(), ...payload, applicants: 0 };
      state.jobs.unshift(fallback);
      showToast('API unavailable. Job saved for this session only.', 'info');
    }
    closeModal();
    navigate('jobs');
  };
}

function scheduleInterview() {
  const options = state.candidates.map((c) => `<option value="${c.id}">${esc(c.name)} — ${esc(c.role)}</option>`).join('');
  openModal('INTERVIEW MANAGEMENT', 'Schedule Interview',
    `<form class="modal-form" id="interviewForm">
      <div><label>Candidate</label><select id="intCandidate">${options || '<option value="">No candidates</option>'}</select></div>
      <div><label>Date</label><input type="date" id="intDate" required></div>
      <div><label>Time</label><input type="text" id="intTime" placeholder="10:30 AM" required></div>
      <div><label>Interviewer</label><input id="intInterviewer" required></div>
      <button class="primary-button">Schedule Interview</button>
    </form>`);
  $('interviewForm').onsubmit = async (e) => {
    e.preventDefault();
    const cid = +$('intCandidate').value;
    const c = state.candidates.find((x) => x.id === cid);
    if (!c) return showToast('Please select a candidate', 'error');
    const payload = {
      candidate: c.name,
      role: c.role,
      date: $('intDate').value,
      time: $('intTime').value,
      interviewer: $('intInterviewer').value
    };
    try {
      const created = await api.createInterview(payload);
      state.interviews.push(created);
      showToast('Interview scheduled', 'success');
    } catch (err) {
      const fallback = { id: Date.now(), ...payload, status: 'Scheduled', link: 'https://meet.google.com/' };
      state.interviews.push(fallback);
      showToast('API unavailable. Interview saved for this session only.', 'info');
    }
    closeModal();
    navigate('interviews');
  };
}

function initActions() {
  document.querySelectorAll('[data-action="add-candidate"]').forEach((b) => b.onclick = addCandidate);
  document.querySelectorAll('[data-action="add-job"]').forEach((b) => b.onclick = addJob);
  document.querySelectorAll('[data-action="schedule-interview"]').forEach((b) => b.onclick = scheduleInterview);
  $('modalClose').onclick = closeModal;
  $('modalOverlay').onclick = (e) => { if (e.target === $('modalOverlay')) closeModal(); };
  $('themeToggle').onclick = () => {
    document.body.classList.toggle('dark-mode');
    localStorage.setItem(THEME_KEY, document.body.classList.contains('dark-mode') ? 'dark' : 'light');
    updateThemeLogos();
  };
  if (localStorage.getItem(THEME_KEY) === 'dark') document.body.classList.add('dark-mode');
  updateThemeLogos();
  $('notificationButton').onclick = () => {
    $('notificationPanel').classList.toggle('hidden');
    $('notificationDot').style.display = 'none';
  };
  $('clearNotifications').onclick = () => {
    $('notificationList').innerHTML = '<p style="padding:15px;color:var(--muted);font-size:12px">No new notifications.</p>';
  };
  $('generateInsight').onclick = async () => {
    const total = state.candidates.length;
    const avg = total ? Math.round(state.candidates.reduce((a, c) => a + (Number(c.score) || 0), 0) / total) : 0;
    let extra = '';
    try {
      const top = state.candidates[0];
      if (top) {
        const r = await api.screen(top.id);
        if (r) extra = ` Screening for ${top.name}: ${r.recommendation} (${r.score}%).`;
      }
    } catch (_) { /* ignore */ }
    $('aiInsightContent').innerHTML = `<p class="ai-main-text"><strong>${total} candidates</strong> are currently in the talent pool with an average AI match of <strong>${avg}%</strong>. ${state.interviews.length} interviews are scheduled. Review high-match candidates first and keep interview stages moving.${extra}</p>`;
    showToast('AI insight generated', 'success');
  };
  $('globalSearch').oninput = (e) => {
    const q = e.target.value.trim();
    if (q) {
      navigate('candidates');
      $('candidateSearch').value = q;
      renderCandidates();
    }
  };
  ['candidateSearch', 'candidateStatusFilter', 'candidateRoleFilter', 'candidateSort'].forEach((id) => $(id).addEventListener('input', renderCandidates));
  $('settingAI').onchange = (e) => { state.settings.ai = e.target.checked; saveSettings(); };
  $('settingNotifications').onchange = (e) => { state.settings.notifications = e.target.checked; saveSettings(); };
  $('settingCompact').onchange = (e) => { state.settings.compact = e.target.checked; saveSettings(); renderSettings(); };
  $('resetData').onclick = async () => {
    if (!confirm('Reset all demo recruitment data?')) return;
    state.candidates = JSON.parse(JSON.stringify(demoData.candidates));
    state.jobs = JSON.parse(JSON.stringify(demoData.jobs));
    state.interviews = JSON.parse(JSON.stringify(demoData.interviews));
    renderAll();
    showToast('Demo data reset locally. Re-seed the database to reset persisted rows.', 'info');
  };
}

function boot() {
  if ('IntersectionObserver' in window) {
    revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
  }
  initAuth();
  initNavigation();
  initActions();
  if (!currentUser) {
    $('app').classList.add('hidden');
    $('authScreen').classList.remove('hidden');
  } else {
    $('authScreen').classList.add('hidden');
    $('app').classList.remove('hidden');
  }
}
boot();
