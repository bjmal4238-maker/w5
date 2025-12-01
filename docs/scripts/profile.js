// profile.js — منظف ومختصر: نفس السلوك تماماً (localStorage, preview, upload, server PUT fallback/timeout)
(() => {
  const PLACEHOLDER = 'https://via.placeholder.com/160';
  const KEY_AVATAR = 'avatarUrl', KEY_AVATAR_TS = 'avatarUrl_updated_at', KEY_NAME = 'displayName', KEY_BIO = 'bio';
  const username = localStorage.getItem('username');
  if (!username) { window.location.href = '/'; return; }

  // DOM
  const $ = id => document.getElementById(id);
  const profileForm = $('profileForm'), displayNameInput = $('displayName'), avatarUrlInput = $('avatarUrl'),
        bioInput = $('bio'), profileAvatarLarge = $('profileAvatarLarge'), profileAvatarLargeSmall = $('profileAvatarLargeSmall'),
        displayNameHeading = $('displayNameHeading'), usernameLabel = $('usernameLabel'),
        clearProfileBtn = $('clearProfile'), profileBtn = $('profileBtn'), logoutBtn = $('logoutBtn'),
        userAvatarHeader = $('userAvatar'), avatarFileInput = $('avatarFile'), avatarPreviewWrap = $('avatarPreviewWrap'),
        themeSelect = $('themeSelect');

  // helpers
  const safeSet = (el, url) => { if (!el) return; el.onerror = null; el.src = url || PLACEHOLDER; el.onerror = () => { el.onerror = null; el.src = PLACEHOLDER; }; };
  const safeSetLocal = (k,v) => { try { localStorage.setItem(k, v); } catch(_){} };
  const safeRemoveLocal = k => { try { localStorage.removeItem(k); } catch(_){} };

  function applyUI(name, avatar, bio) {
    if (displayNameHeading) displayNameHeading.textContent = name || username;
    if (usernameLabel) usernameLabel.textContent = `@${username}`;
    safeSet(profileAvatarLarge, avatar); safeSet(profileAvatarLargeSmall, avatar);
    if (userAvatarHeader) safeSet(userAvatarHeader, avatar);
  }

  function readLocal() {
    return {
      name: localStorage.getItem(KEY_NAME) || username,
      avatar: localStorage.getItem(KEY_AVATAR) || PLACEHOLDER,
      bio: localStorage.getItem(KEY_BIO) || ''
    };
  }

  // load (local first, then try server non-blocking)
  function loadProfile() {
    const local = readLocal();
    if (displayNameInput) displayNameInput.value = local.name;
    if (avatarUrlInput) avatarUrlInput.value = local.avatar;
    if (bioInput) bioInput.value = local.bio;
    applyUI(local.name, local.avatar, local.bio);

    // try server (silent fallback)
    fetch(`${location.protocol}//${location.host}/api/profile?username=${encodeURIComponent(username)}`)
      .then(r => { if (!r.ok) throw 0; return r.json(); })
      .then(data => {
        const name = data.displayName || local.name;
        const avatar = data.avatarUrl || local.avatar;
        const bio = data.bio || local.bio;
        if (displayNameInput) displayNameInput.value = name;
        if (avatarUrlInput) avatarUrlInput.value = avatar;
        if (bioInput) bioInput.value = bio;
        applyUI(name, avatar, bio);
      })
      .catch(()=>{/* ignore - already showing local */});
  }

  // upload file -> dataURL
  function handleFileUpload(file) {
    if (!file) return;
    if (!file.type || !file.type.startsWith('image/')) { Swal.fire({icon:'error', title:'Please upload an image file.'}); return; }
    const r = new FileReader();
    r.onload = e => {
      const url = e.target.result;
      if (avatarUrlInput) avatarUrlInput.value = url;
      applyUI((displayNameInput && displayNameInput.value) || username, url, (bioInput && bioInput.value) || '');
    };
    r.readAsDataURL(file);
  }

  // save locally + try server with timeout, show toasts
  function saveProfile(e) {
    if (e && e.preventDefault) e.preventDefault();
    const name = (displayNameInput && displayNameInput.value.trim()) || username;
    const avatar = (avatarUrlInput && avatarUrlInput.value.trim()) || PLACEHOLDER;
    const bio = (bioInput && bioInput.value.trim()) || '';
    safeSetLocal(KEY_NAME, name); safeSetLocal(KEY_AVATAR, avatar); safeSetLocal(KEY_BIO, bio); safeSetLocal(KEY_AVATAR_TS, Date.now().toString());
    applyUI(name, avatar, bio);
    window.dispatchEvent(new CustomEvent('avatarChanged', { detail: { avatarUrl: avatar } }));

    // server persist (non-blocking, short timeout)
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2200);
    fetch(`${location.protocol}//${location.host}/api/profile`, {
      method: 'PUT',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ username, displayName: name, avatarUrl: avatar, bio }),
      signal: controller.signal
    }).then(r => { clearTimeout(timeout); Swal.fire({ toast:true, position:'bottom-end', icon: r.ok ? 'success' : 'info', title: r.ok ? 'Saved (local & server)' : 'Saved locally', showConfirmButton:false, timer:1400 }); })
      .catch(()=> { clearTimeout(timeout); Swal.fire({ toast:true, position:'bottom-end', icon:'info', title:'Saved locally', showConfirmButton:false, timer:1200 }); });
  }

  function clearProfile() {
    safeRemoveLocal(KEY_NAME); safeRemoveLocal(KEY_AVATAR); safeRemoveLocal(KEY_BIO);
    safeSetLocal(KEY_AVATAR_TS, Date.now().toString());
    loadProfile();
    Swal.fire({ toast:true, position:'bottom-end', icon:'success', title:'Profile reset', showConfirmButton:false, timer:1200 });
  }

  // init
  document.addEventListener('DOMContentLoaded', () => {
    loadProfile();

    if (avatarPreviewWrap && avatarFileInput) avatarPreviewWrap.addEventListener('click', () => avatarFileInput.click());
    if (avatarFileInput) avatarFileInput.addEventListener('change', ev => { const f = ev.target.files && ev.target.files[0]; if (f) handleFileUpload(f); });
    if (avatarUrlInput) avatarUrlInput.addEventListener('input', e => applyUI((displayNameInput && displayNameInput.value) || username, e.target.value.trim() || PLACEHOLDER, (bioInput && bioInput.value) || ''));
    if (profileForm) profileForm.addEventListener('submit', saveProfile);
    if (clearProfileBtn) clearProfileBtn.addEventListener('click', clearProfile);
    if (profileBtn) profileBtn.addEventListener('click', () => { window.location.href = '/pages/dashboard.html'; });
    if (logoutBtn) logoutBtn.addEventListener('click', () => { safeRemoveLocal('username'); window.location.href = '/'; });

    if (themeSelect) {
      const t = localStorage.getItem('theme') || 'dark';
      document.body.setAttribute('data-theme', t); themeSelect.value = t;
      themeSelect.addEventListener('change', e => { const v = e.target.value; localStorage.setItem('theme', v); document.body.setAttribute('data-theme', v); });
    }

    // cross-tab updates
    window.addEventListener('storage', (e) => {
      if ([KEY_AVATAR, KEY_AVATAR_TS, KEY_NAME, KEY_BIO].includes(e.key)) {
        const local = readLocal();
        if (displayNameInput) displayNameInput.value = local.name;
        if (avatarUrlInput) avatarUrlInput.value = local.avatar;
        if (bioInput) bioInput.value = local.bio;
        applyUI(local.name, local.avatar, local.bio);
      }
    });

    // same-tab custom event
    window.addEventListener('avatarChanged', ev => {
      const url = ev?.detail?.avatarUrl || localStorage.getItem(KEY_AVATAR) || PLACEHOLDER;
      safeSet(profileAvatarLarge, url); safeSet(profileAvatarLargeSmall, url);
      if (userAvatarHeader) safeSet(userAvatarHeader, url);
    });
  });
})();
