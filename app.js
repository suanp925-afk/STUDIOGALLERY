// Personal Image Gallery (front-end simulation)
// Stores users and images in localStorage. Session in sessionStorage.
// Uses SubtleCrypto SHA-256 for password hashing.

(() => {
  // Constants
  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
  const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif'];

  // DOM
  const authSection = document.getElementById('auth');
  const gallerySection = document.getElementById('gallery');
  const loginForm = document.getElementById('login-form');
  const registerForm = document.getElementById('register-form');
  const showRegisterBtn = document.getElementById('show-register');
  const showLoginBtn = document.getElementById('show-login');
  const loginUsername = document.getElementById('login-username');
  const loginPassword = document.getElementById('login-password');
  const regUsername = document.getElementById('reg-username');
  const regPassword = document.getElementById('reg-password');
  const regPasswordConfirm = document.getElementById('reg-password-confirm');

  const greeting = document.getElementById('greeting');
  const fileInput = document.getElementById('file-input');
  const galleryGrid = document.getElementById('gallery-grid');
  const emptyState = document.getElementById('empty-state');
  const logoutBtn = document.getElementById('logout-btn');
  const exportBtn = document.getElementById('export-btn');

  // Modal
  const modal = document.getElementById('modal');
  const modalImage = document.getElementById('modal-image');
  const modalCaption = document.getElementById('modal-caption');
  const modalClose = document.getElementById('modal-close');
  const modalPrev = document.getElementById('modal-prev');
  const modalNext = document.getElementById('modal-next');
  const modalDelete = document.getElementById('modal-delete');

  // State
  let currentUser = null; // username string
  let images = []; // array of {id,name,dataUrl,uploadedAt}
  let currentIndex = -1;

  // Utilities
  function uid() {
    return Math.random().toString(36).slice(2, 10);
  }

  async function sha256Hex(text) {
    const enc = new TextEncoder();
    const data = enc.encode(text);
    const hashBuf = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuf));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  function usersKey() { return 'gallery_users_v1'; }
  function imagesKeyFor(username) { return `gallery_images_v1_${username}`; }
  function sessionKey() { return 'gallery_session_v1'; }

  function loadUsers() {
    try {
      const raw = localStorage.getItem(usersKey());
      return raw ? JSON.parse(raw) : {};
    } catch (e) { return {}; }
  }
  function saveUsers(obj) {
    localStorage.setItem(usersKey(), JSON.stringify(obj));
  }

  function loadImagesFor(user) {
    try {
      const raw = localStorage.getItem(imagesKeyFor(user));
      return raw ? JSON.parse(raw) : [];
    } catch (e) { return []; }
  }
  function saveImagesFor(user, arr) {
    localStorage.setItem(imagesKeyFor(user), JSON.stringify(arr));
  }

  function saveSession(user) {
    sessionStorage.setItem(sessionKey(), JSON.stringify({ user }));
  }
  function clearSession() {
    sessionStorage.removeItem(sessionKey());
  }
  function loadSession() {
    try {
      const raw = sessionStorage.getItem(sessionKey());
      const obj = raw ? JSON.parse(raw) : null;
      return obj ? obj.user : null;
    } catch (e) { return null; }
  }

  // Initialization: create demo account if not exists
  (async function createDemoAccount() {
    const users = loadUsers();
    if (!users.demo) {
      const demoHash = await sha256Hex('demo123');
      users.demo = demoHash;
      saveUsers(users);
    }
  })();

  // UI helpers
  function show(elem) { elem.classList.remove('hidden'); }
  function hide(elem) { elem.classList.add('hidden'); }

  function showGalleryFor(user) {
    currentUser = user;
    images = loadImagesFor(user);
    greeting.textContent = `Hi, ${user}`;
    hide(authSection);
    show(gallerySection);
    renderGrid();
    saveSession(user);
  }

  function showAuth() {
    currentUser = null;
    images = [];
    hide(gallerySection);
    show(authSection);
    clearSession();
    // show login by default
    loginForm.classList.remove('hidden');
    registerForm.classList.add('hidden');
  }

  function renderGrid() {
    galleryGrid.innerHTML = '';
    if (!images || images.length === 0) {
      show(emptyState);
    } else {
      hide(emptyState);
      images.forEach((img, idx) => {
        const cont = document.createElement('div');
        cont.className = 'thumb card';
        const im = document.createElement('img');
        im.src = img.dataUrl;
        im.alt = img.name || `Image ${idx+1}`;
        im.tabIndex = 0;
        im.addEventListener('click', () => openModal(idx));
        im.addEventListener('keypress', (e) => { if (e.key === 'Enter') openModal(idx); });

        const meta = document.createElement('div');
        meta.className = 'meta';
        const name = document.createElement('div');
        name.className = 'name';
        name.textContent = img.name || 'Untitled';
        const d = document.createElement('div');
        d.className = 'muted small';
        d.textContent = new Date(img.uploadedAt).toLocaleString();

        meta.appendChild(name);
        meta.appendChild(d);

        cont.appendChild(im);
        cont.appendChild(meta);
        galleryGrid.appendChild(cont);
      });
    }
  }

  // Modal functions
  function openModal(index) {
    currentIndex = index;
    const img = images[index];
    modalImage.src = img.dataUrl;
    modalCaption.textContent = `${img.name || 'Untitled'} · Uploaded ${new Date(img.uploadedAt).toLocaleString()}`;
    show(modal);
    modal.setAttribute('aria-hidden', 'false');
    modal.focus();
  }

  function closeModal() {
    hide(modal);
    modal.setAttribute('aria-hidden', 'true');
    modalImage.src = '';
    currentIndex = -1;
  }

  function showPrev() {
    if (images.length === 0) return;
    currentIndex = (currentIndex - 1 + images.length) % images.length;
    openModal(currentIndex);
  }
  function showNext() {
    if (images.length === 0) return;
    currentIndex = (currentIndex + 1) % images.length;
    openModal(currentIndex);
  }
  function deleteCurrent() {
    if (currentIndex < 0 || currentIndex >= images.length) return;
    if (!confirm('Delete this image?')) return;
    images.splice(currentIndex, 1);
    saveImagesFor(currentUser, images);
    if (images.length === 0) {
      closeModal();
    } else {
      currentIndex = Math.min(currentIndex, images.length - 1);
      openModal(currentIndex);
    }
    renderGrid();
  }

  // File upload handling
  function handleFiles(fileList) {
    if (!currentUser) {
      alert('You must be logged in to upload images.');
      return;
    }
    const files = Array.from(fileList);
    const validFiles = [];
    for (const f of files) {
      if (!ALLOWED_TYPES.includes(f.type)) {
        alert(`Skipping ${f.name}: unsupported file type.`);
        continue;
      }
      if (f.size > MAX_FILE_SIZE) {
        alert(`Skipping ${f.name}: file too large (max 5MB).`);
        continue;
      }
      validFiles.push(f);
    }
    if (validFiles.length === 0) return;

    // Read files as data URLs
    const readers = validFiles.map(f => new Promise((res, rej) => {
      const r = new FileReader();
      r.onload = () => res({ name: f.name, dataUrl: r.result });
      r.onerror = rej;
      r.readAsDataURL(f);
    }));

    Promise.all(readers).then(results => {
      const now = Date.now();
      for (const r of results) {
        images.unshift({
          id: uid(),
          name: r.name,
          dataUrl: r.dataUrl,
          uploadedAt: now
        });
      }
      saveImagesFor(currentUser, images);
      renderGrid();
    }).catch(err => {
      console.error('File read error', err);
      alert('Error reading files.');
    });
  }

  // Export
  function exportImages() {
    if (!currentUser) return;
    const data = {
      exportedAt: new Date().toISOString(),
      user: currentUser,
      images
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gallery_${currentUser}_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  // Event handlers
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = loginUsername.value.trim();
    const pwd = loginPassword.value;
    if (!username || !pwd) return alert('Provide username and password.');
    const users = loadUsers();
    if (!users[username]) return alert('No such user.');
    const hash = await sha256Hex(pwd);
    if (hash !== users[username]) return alert('Incorrect password.');
    showGalleryFor(username);
    loginForm.reset();
  });

  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = regUsername.value.trim();
    const pwd = regPassword.value;
    const confirmPwd = regPasswordConfirm.value;
    if (!username || !pwd) return alert('Provide username and password.');
    if (pwd !== confirmPwd) return alert('Passwords do not match.');
    const users = loadUsers();
    if (users[username]) return alert('Username already exists.');
    const hash = await sha256Hex(pwd);
    users[username] = hash;
    saveUsers(users);
    // create empty images list for the user
    saveImagesFor(username, []);
    alert('Account created. You can now log in.');
    registerForm.reset();
    // show login
    registerForm.classList.add('hidden');
    loginForm.classList.remove('hidden');
  });

  showRegisterBtn.addEventListener('click', () => {
    loginForm.classList.add('hidden');
    registerForm.classList.remove('hidden');
  });
  showLoginBtn.addEventListener('click', () => {
    registerForm.classList.add('hidden');
    loginForm.classList.remove('hidden');
  });

  fileInput.addEventListener('change', (e) => {
    handleFiles(e.target.files);
    fileInput.value = '';
  });

  logoutBtn.addEventListener('click', () => {
    if (confirm('Log out?')) {
      clearSession();
      showAuth();
    }
  });

  modalClose.addEventListener('click', closeModal);
  modalPrev.addEventListener('click', showPrev);
  modalNext.addEventListener('click', showNext);
  modalDelete.addEventListener('click', deleteCurrent);

  // keyboard
  document.addEventListener('keydown', (e) => {
    if (modal.classList.contains('hidden')) return;
    if (e.key === 'Escape') closeModal();
    if (e.key === 'ArrowLeft') showPrev();
    if (e.key === 'ArrowRight') showNext();
    if (e.key === 'Delete') deleteCurrent();
  });

  // click outside to close
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });

  exportBtn.addEventListener('click', exportImages);

  // Restore session if present
  (function tryRestoreSession() {
    const user = loadSession();
    if (user) {
      // verify user still exists
      const users = loadUsers();
      if (users[user]) {
        showGalleryFor(user);
        return;
      } else {
        clearSession();
      }
    }
    showAuth();
  })();
})();
