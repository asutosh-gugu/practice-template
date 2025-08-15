const themeToggle = document.getElementById('themeToggle');
const body = document.body;
const menuToggle = document.getElementById('menuToggle');
const navbar = document.querySelector('.navbar');
const scrollTopBtn = document.getElementById('scrollTop');

/*
  Weather integration (OpenWeatherMap)
  - Get a free API key: https://home.openweathermap.org/users/sign_up
  - Replace OWM_API_KEY below with your key.
  - For production keep the key on a server / proxy to avoid exposing it.
*/
const OWM_API_KEY = 'REPLACE_WITH_YOUR_API_KEY'; // <-- put your key here
const DEFAULT_CITY = 'New Delhi'; // change if you want a different fallback city

// Utility
const $ = id => document.getElementById(id);
function capitalize(s){ return s ? s.charAt(0).toUpperCase() + s.slice(1) : s; }

// Update weather display
function renderWeather(data){
  const el = $('weather');
  if(!el || !data) return;
  try{
    const temp = Math.round(data.main.temp);
    const desc = capitalize(data.weather[0].description);
    const icon = data.weather[0].icon;
    const iconUrl = `https://openweathermap.org/img/wn/${icon}@2x.png`;
    el.innerHTML = `
      <img src="${iconUrl}" alt="${desc}" style="width:40px;height:40px;vertical-align:middle;margin-right:6px;">
      <strong>${temp}°C</strong> — ${desc} <span style="opacity:.8">(${data.name})</span>
    `;
  }catch(e){
    el.textContent = 'Weather: unavailable';
  }
}

// Fetch helpers
async function fetchWeatherByCoords(lat, lon){
  const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${OWM_API_KEY}`;
  const res = await fetch(url);
  if(!res.ok) throw new Error('Weather fetch failed');
  return res.json();
}
async function fetchWeatherByCity(city){
  const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&units=metric&appid=${OWM_API_KEY}`;
  const res = await fetch(url);
  if(!res.ok) throw new Error('Weather fetch failed');
  return res.json();
}

// Try geolocation -> IP lookup -> fallback city
async function loadWeather(){
  const el = $('weather');
  if(!el) return;
  el.textContent = 'Weather: loading...';
  // Quick guard if API key not set
  if(!OWM_API_KEY || OWM_API_KEY === 'REPLACE_WITH_YOUR_API_KEY'){
    el.textContent = 'Weather: set OWM_API_KEY in script.js';
    return;
  }

  // 1) navigator.geolocation
  const tryGeolocation = () => new Promise((resolve, reject) => {
    if(!navigator.geolocation) return reject();
    navigator.geolocation.getCurrentPosition(
      pos => resolve({lat: pos.coords.latitude, lon: pos.coords.longitude}),
      () => reject(),
      {timeout:8000}
    );
  });

  try{
    const coords = await tryGeolocation();
    const data = await fetchWeatherByCoords(coords.lat, coords.lon);
    renderWeather(data);
    return;
  }catch(_){ /* fallback next */ }

  // 2) IP-based lookup (no key, best-effort)
  try{
    const ipRes = await fetch('https://ipapi.co/json/');
    if(ipRes.ok){
      const ipData = await ipRes.json();
      if(ipData && ipData.latitude && ipData.longitude){
        const data = await fetchWeatherByCoords(ipData.latitude, ipData.longitude);
        renderWeather(data);
        return;
      }
    }
  }catch(_){ /* fallback next */ }

  // 3) fallback city
  try{
    const data = await fetchWeatherByCity(DEFAULT_CITY);
    renderWeather(data);
    return;
  }catch(err){
    el.textContent = 'Weather: unavailable';
    console.error('Weather load failed', err);
  }
}

// Clock
function updateClock(){
  const el = document.getElementById('clock');
  if(!el) return;
  const d = new Date();
  el.textContent = d.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'});
}
setInterval(updateClock, 1000);
updateClock();

/* ---------- Robust animated theme toggle (creates button if missing) ---------- */
(function initThemeToggle(){
  // ensure navbar container to attach the button if it's not in HTML
  const navbar = document.querySelector('.navbar') || document.querySelector('header') || document.body;

  // find existing button or create one
  let btn = document.getElementById('themeToggle');
  if(!btn){
    btn = document.createElement('button');
    btn.id = 'themeToggle';
    btn.type = 'button';
    btn.setAttribute('aria-label', 'Toggle theme');
    btn.title = 'Toggle theme';
    // append at end of navbar
    navbar.appendChild(btn);
  }

  // inject animated icon markup (keeps CSS untouched)
  btn.innerHTML = '<span class="toggle-icon" aria-hidden="true"><span class="moon">🌙</span><span class="sun">☀️</span></span>';

  // apply theme state
  function applyTheme(isLight){
    document.documentElement.classList.toggle('light', !!isLight);
    btn.classList.toggle('is-light', !!isLight);
    btn.setAttribute('aria-pressed', !!isLight);
    btn.title = isLight ? 'Switch to dark mode' : 'Switch to light mode';
  }

  // restore saved preference or use OS preference
  try{
    const saved = localStorage.getItem('site-theme');
    if(saved === 'light' || saved === 'dark'){
      applyTheme(saved === 'light');
    } else if (window.matchMedia) {
      applyTheme(window.matchMedia('(prefers-color-scheme: light)').matches);
    } else {
      applyTheme(false);
    }
  }catch(e){
    applyTheme(false);
  }

  // click toggles theme and persists
  btn.addEventListener('click', () => {
    const willBeLight = !document.documentElement.classList.contains('light');
    applyTheme(willBeLight);
    try { localStorage.setItem('site-theme', willBeLight ? 'light' : 'dark'); } catch(e){}
    // tactile animation
    if(btn.animate) {
      btn.animate(
        [{ transform: 'scale(1)' }, { transform: 'scale(1.06)' }, { transform: 'scale(1)' }],
        { duration: 220, easing: 'ease' }
      );
    }
  });

  // keyboard support (Space / Enter)
  btn.addEventListener('keydown', (e) => {
    if(e.key === ' ' || e.key === 'Enter'){ e.preventDefault(); btn.click(); }
  });
})();

// Menu toggle (mobile)
document.getElementById('menuToggle')?.addEventListener('click', () => {
  const nav = document.getElementById('navLinks');
  if(!nav) return;
  nav.style.display = nav.style.display === 'flex' || nav.style.display === 'block' ? 'none' : 'flex';
});

// Scroll top
const scrollBtn = document.getElementById('scrollTop');
scrollBtn?.addEventListener('click', () => window.scrollTo({top:0, behavior:'smooth'}));
window.addEventListener('scroll', () => {
  if(!scrollBtn) return;
  scrollBtn.style.display = window.scrollY > 200 ? 'block' : 'none';
});

// Jarvis quick response (enhanced to support opening YouTube and scrolling)
const jarvis = document.getElementById('jarvisAgent');
const jarvisResp = document.getElementById('jarvisResponse');

jarvis?.addEventListener('click', () => {
  if(!jarvisResp) return;

  // Provide helpful quick actions
  jarvisResp.innerHTML = `
    Jarvis: Commands — 
    <button id="show3D" class="mini">Show 3D</button>
    <button id="openYt" class="mini">Open YouTube</button>
    <span style="display:block;margin-top:8px;font-size:.9rem;color:#cfe9ff;">Tip: You can also click the channel banner to visit saugamming1209.</span>
  `;

  // attach handlers to newly created buttons
  document.getElementById('openYt')?.addEventListener('click', () => {
    window.open('https://www.youtube.com/@saugamming1209', '_blank', 'noopener');
  });

  document.getElementById('show3D')?.addEventListener('click', () => {
    const el = document.getElementById('showcase');
    if(el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  });
});

// keep keyboard activation
jarvis?.addEventListener('keydown', (e) => { if(e.key === 'Enter' || e.key === ' ') jarvis.click(); });

// Accessibility: focus outlines
document.addEventListener('keydown', (e) => {
  if(e.key === 'Tab') document.documentElement.classList.add('show-focus');
});

// Start weather load
loadWeather();

// OBJ/GLB (Three.js) viewer - prefers GLB (mystic_sorceress_set_3d_angry_animation.glb) then falls back to OBJ/MTL
import * as THREE from 'https://unpkg.com/three@0.158.0/build/three.module.js';
import { GLTFLoader } from 'https://unpkg.com/three@0.158.0/examples/jsm/loaders/GLTFLoader.js';
import { OBJLoader } from 'https://unpkg.com/three@0.158.0/examples/jsm/loaders/OBJLoader.js';
import { MTLLoader } from 'https://unpkg.com/three@0.158.0/examples/jsm/loaders/MTLLoader.js';
import { OrbitControls } from 'https://unpkg.com/three@0.158.0/examples/jsm/controls/OrbitControls.js';

async function init3DViewer(){
  const container = document.getElementById('objViewer');
  if(!container) return;

  // renderer / scene / camera / lights / controls
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(container.clientWidth, container.clientHeight);
  container.innerHTML = '';
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 1000);
  camera.position.set(0, 1.2, 3);

  const hemi = new THREE.HemisphereLight(0xffffff, 0x444444, 0.9);
  const dir = new THREE.DirectionalLight(0xffffff, 0.9);
  dir.position.set(5,10,7);
  scene.add(hemi, dir);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.minDistance = 0.6;
  controls.maxDistance = 8;

  const glbPath = './mystic_sorceress_set_3d_angry_animation.glb';
  const objPath = './mystic_sorceress_set_3d_angry_animation.obj';
  const mtlPath = './mystic_sorceress_set_3d_angry_animation.mtl';

  let mixer = null;
  let modelRoot = null;

  try{
    // prefer GLB if present
    let glbExists = false;
    try {
      const head = await fetch(glbPath, { method: 'HEAD' });
      glbExists = head.ok;
    } catch(e) { glbExists = false; }

    if(glbExists){
      const loader = new GLTFLoader();
      const gltf = await new Promise((resolve, reject) => {
        loader.load(glbPath, g => resolve(g), undefined, err => reject(err));
      });

      modelRoot = gltf.scene || gltf.scenes[0];
      // scale & center
      const box = new THREE.Box3().setFromObject(modelRoot);
      const size = box.getSize(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z) || 1;
      const scale = 1.2 / maxDim;
      modelRoot.scale.setScalar(scale);
      box.setFromObject(modelRoot);
      const center = box.getCenter(new THREE.Vector3());
      modelRoot.position.sub(center);

      scene.add(modelRoot);

      // play animations if available
      if(gltf.animations && gltf.animations.length){
        mixer = new THREE.AnimationMixer(modelRoot);
        gltf.animations.forEach(clip => {
          const action = mixer.clipAction(clip);
          action.play();
        });
      }

    } else {
      // fallback: try OBJ (and optional MTL)
      const objLoader = new OBJLoader();

      let mtlExists = false;
      try {
        const head = await fetch(mtlPath, { method: 'HEAD' });
        mtlExists = head.ok;
      } catch(e){ mtlExists = false; }

      if(mtlExists){
        const mtlLoader = new MTLLoader();
        const materials = await new Promise((resolve, reject) => {
          mtlLoader.load(mtlPath, m => resolve(m), undefined, err => reject(err));
        });
        materials.preload();
        objLoader.setMaterials(materials);
      }

      modelRoot = await new Promise((resolve, reject) => {
        objLoader.load(objPath, obj => resolve(obj), undefined, err => reject(err));
      });

      // center & scale
      const box = new THREE.Box3().setFromObject(modelRoot);
      const size = box.getSize(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z) || 1;
      const scale = 1.2 / maxDim;
      modelRoot.scale.setScalar(scale);
      box.setFromObject(modelRoot);
      const center = box.getCenter(new THREE.Vector3());
      modelRoot.position.sub(center);

      scene.add(modelRoot);
    }

    // animation loop
    const clock = new THREE.Clock();
    function animate(){
      requestAnimationFrame(animate);
      const delta = clock.getDelta();
      if(mixer) mixer.update(delta);
      // gentle auto-rotate if no animation/mixer
      if(modelRoot && !mixer) modelRoot.rotation.y += 0.004;
      controls.update();
      renderer.render(scene, camera);
    }
    animate();

    // responsive
    window.addEventListener('resize', () => {
      const w = container.clientWidth, h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    });

  }catch(err){
    console.error('3D model load failed', err);
    container.innerHTML = '<div class="obj-fallback">Cannot load 3D model — check filename or console</div>';
  }
}

init3DViewer();

/* ---------- Chat widget: draggable, minimizable, movable, WhatsApp ---------- */
(function initChatWidgetAdvanced(){
  const PHONE = '919178937264';
  const widget = document.getElementById('chatWidget');
  if(!widget) return;

  const panel = document.getElementById('chatPanel');
  const toggle = document.getElementById('chatToggle');
  const closeBtn = document.getElementById('chatClose');
  const minimizeBtn = document.getElementById('chatMinimize');
  const sendBtn = document.getElementById('chatSend');
  const nameEl = document.getElementById('chatName');
  const msgEl = document.getElementById('chatMessage');
  const handle = document.getElementById('chatHandle');

  // Restore saved position and state
  try {
    const pos = JSON.parse(localStorage.getItem('chat-widget-pos') || 'null');
    if(pos && typeof pos.left === 'number' && typeof pos.top === 'number'){
      widget.style.left = pos.left + 'px';
      widget.style.top = pos.top + 'px';
      widget.classList.add('moved');
    }
    const mini = localStorage.getItem('chat-widget-minimized') === '1';
    if(mini) widget.classList.add('minimized');
  }catch(e){}

  // open/close toggle
  toggle.addEventListener('click', () => {
    const wasHidden = panel.hidden;
    panel.hidden = !panel.hidden;
    if(!panel.hidden) {
      widget.classList.remove('minimized');
      msgEl.focus();
    }
  });

  // Close / Minimize buttons
  closeBtn?.addEventListener('click', () => { panel.hidden = true; });
  minimizeBtn?.addEventListener('click', () => {
    const isMin = widget.classList.toggle('minimized');
    // hide panel contents visually when minimized (keeps header visible)
    panel.hidden = false;
    localStorage.setItem('chat-widget-minimized', isMin ? '1' : '0');
  });

  // Send to WhatsApp (uses wa.me)
  sendBtn?.addEventListener('click', async () => {
    const name = (nameEl?.value || '').trim();
    const text = (msgEl?.value || '').trim();
    if(!text){ msgEl.focus(); return; }
    const pre = name ? `${name} says:` : 'Visitor:';
    const full = `${pre} ${text} — from website (saugamming1209)`;
    const encoded = encodeURIComponent(full);
    const waUrl = `https://wa.me/${PHONE}?text=${encoded}`;
    window.open(waUrl, '_blank', 'noopener');

    // optional backend post
    try{
      await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name || null, message: text, via: 'whatsapp_click' })
      });
    }catch(e){}
    msgEl.value = '';
    // minimize after sending
    widget.classList.add('minimized');
    localStorage.setItem('chat-widget-minimized', '1');
  });

  // Dragging logic (pointer events)
  let dragging = false;
  let pointerId = null;
  let startX = 0, startY = 0, startLeft = 0, startTop = 0;

  function clamp(v, min, max){ return Math.max(min, Math.min(max, v)); }

  handle.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    dragging = true;
    pointerId = e.pointerId;
    handle.setPointerCapture(pointerId);
    const rect = widget.getBoundingClientRect();
    startX = e.clientX;
    startY = e.clientY;
    startLeft = rect.left;
    startTop = rect.top;
    widget.classList.add('dragging');
  });

  document.addEventListener('pointermove', (e) => {
    if(!dragging || e.pointerId !== pointerId) return;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    let newLeft = Math.round(startLeft + dx);
    let newTop = Math.round(startTop + dy);

    // clamp inside viewport
    const vw = Math.max(window.innerWidth || 0, 320);
    const vh = Math.max(window.innerHeight || 0, 200);
    const wRect = widget.getBoundingClientRect();
    const widgetW = wRect.width, widgetH = wRect.height;
    newLeft = clamp(newLeft, 8, vw - widgetW - 8);
    newTop  = clamp(newTop, 8, vh - widgetH - 8);

    widget.style.left = newLeft + 'px';
    widget.style.top  = newTop + 'px';
    widget.style.right = 'auto';
    widget.style.bottom = 'auto';
    widget.classList.add('moved');
  });

  document.addEventListener('pointerup', (e) => {
    if(!dragging || e.pointerId !== pointerId) return;
    dragging = false;
    try{ handle.releasePointerCapture(pointerId); }catch(e){}
    pointerId = null;
    widget.classList.remove('dragging');

    // save position
    const rect = widget.getBoundingClientRect();
    try {
      localStorage.setItem('chat-widget-pos', JSON.stringify({ left: Math.round(rect.left), top: Math.round(rect.top) }));
    }catch(e){}
  });

  // Close on Escape / outside click (but not when minimized)
  document.addEventListener('keydown', (e) => {
    if(e.key === 'Escape' && !panel.hidden) panel.hidden = true;
  });
  document.addEventListener('click', (e) => {
    if(panel.hidden) return;
    const target = e.target;
    if(!widget.contains(target)) panel.hidden = true;
  });

  // Make header double-click restore from minimized
  handle.addEventListener('dblclick', () => {
    const was = widget.classList.toggle('minimized');
    localStorage.setItem('chat-widget-minimized', was ? '1' : '0');
    panel.hidden = false;
  });
})();
