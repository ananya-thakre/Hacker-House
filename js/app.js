tha/* ============================================================
   HH GOA 2026 — Builder ID / Frame Generator
   Vanilla JS. No build step, no dependencies, nothing uploaded.
   ============================================================ */
  (() => {
    'use strict';

    /* ----------------------------------------------------------
       0. Constants: regex, theme palettes, builder-class map
    ---------------------------------------------------------- */
    const RE = {
      name: /^[A-Za-z][A-Za-z\s.'-]{1,49}$/,
      email: /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/,
      xhandle: /^@?\w{1,15}$/,
      stack: /^[A-Za-z0-9,&+./\-\s]{2,60}$/,
      // India-first mobile check (10 digits starting 6-9, optional +91/91 prefix)
      phoneIN: /^(?:\+?91)?[6-9]\d{9}$/,
      // generic international fallback
      phoneIntl: /^\+?[1-9]\d{7,14}$/
    };

    const THEMES = {
      goa: { bgTop: '#0B6839', bgMid: '#09552E', bgBottom: '#074524', accent: '#FEE101', accent2: '#FF0080', ink: '#ffffff', inkDim: '#B9E2CE', line: 'rgba(255,255,255,.16)', sun: true },
      night: { bgTop: '#132038', bgMid: '#0b1526', bgBottom: '#070c16', accent: '#8ec4ff', accent2: '#6fcf97', ink: '#eef3fb', inkDim: '#93a6c2', line: 'rgba(238,243,251,.25)', sun: false },
      sand: { bgTop: '#f1e4c4', bgMid: '#e6d09d', bgBottom: '#d8bc80', accent: '#a1472e', accent2: '#12362a', ink: '#241a0d', inkDim: '#6f5c3a', line: 'rgba(36,26,13,.22)', sun: true }
    };

    const CLASS_MAP = [
      { kws: ['react', 'vue', 'angular', 'frontend', 'front-end', 'front end', 'css', 'tailwind', 'ui', 'ux', 'design', 'figma'], label: 'Interface Alchemist' },
      { kws: ['node', 'express', 'django', 'flask', 'backend', 'back-end', 'back end', 'api', 'server', 'microservice'], label: 'Systems Architect' },
      { kws: ['ml', 'ai', 'model', 'llm', 'pytorch', 'tensorflow', 'data science', 'nlp'], label: 'Signal Whisperer' },
      { kws: ['data', 'sql', 'analytics', 'pipeline', 'etl', 'warehouse'], label: 'Data Cartographer' },
      { kws: ['android', 'ios', 'flutter', 'swift', 'kotlin', 'mobile', 'react native'], label: 'Pocket Engineer' },
      { kws: ['solidity', 'web3', 'blockchain', 'smart contract', 'ethereum', 'defi'], label: 'Chain Smith' },
      { kws: ['security', 'pentest', 'hack', 'ctf', 'infosec'], label: 'Perimeter Runner' },
      { kws: ['product', 'pm', 'strategy', 'growth'], label: 'Product Navigator' },
      { kws: ['hardware', 'iot', 'embedded', 'arduino', 'robotics'], label: 'Circuit Nomad' },
      { kws: ['devops', 'cloud', 'aws', 'docker', 'kubernetes', 'infra'], label: 'Infra Wrangler' }
    ];

    /* ----------------------------------------------------------
       1. State
    ---------------------------------------------------------- */
    const state = {
      format: 'pfp',        // pfp | id | team
      teamSize: 1,           // 1..3, only meaningful for team
      theme: 'goa',
      filter: 'natural',
      autoClass: true,
      builders: [
        mkBuilder(true),
        mkBuilder(false),
        mkBuilder(false)
      ]
    };

    function mkBuilder(isPrimary) {
      return {
        isPrimary,
        name: '', email: '', phone: '', xhandle: '', stack: '', builderClass: '',
        img: null, zoom: 100, offsetX: 0, offsetY: 0
      };
    }

    /* ----------------------------------------------------------
       2. DOM refs
    ---------------------------------------------------------- */
    const $ = sel => document.querySelector(sel);
    const canvas = $('#cardCanvas');
    const ctx = canvas.getContext('2d');
    const toastEl = $('#toast');
    let toastTimer = null;

    /* ----------------------------------------------------------
       3. Boot line typing effect (hero)
    ---------------------------------------------------------- */
    (function bootType() {
      const el = $('#bootLine');
      const full = '>> connecting to HACKER_HOUSE_GOA_2026 … link established. drop a photo below.';
      let i = 0;
      const tick = () => {
        el.textContent = full.slice(0, i);
        i++;
        if (i <= full.length) setTimeout(tick, 18);
      };
      tick();
    })();

    /* ----------------------------------------------------------
       4. Toast
    ---------------------------------------------------------- */
    function toast(msg, ms = 2600) {
      toastEl.textContent = msg;
      toastEl.hidden = false;
      clearTimeout(toastTimer);
      toastTimer = setTimeout(() => { toastEl.hidden = true; }, ms);
    }

    /* ----------------------------------------------------------
       5. Validation helpers
    ---------------------------------------------------------- */
    function normalizePhone(v) { return v.replace(/[\s\-()]/g, ''); }

    function validateField(kind, value, required) {
      const v = (value || '').trim();
      if (!v) return required ? { ok: false, msg: fieldRequiredMsg(kind) } : { ok: true, msg: '' };

      switch (kind) {
        case 'name':
          return RE.name.test(v) ? { ok: true, msg: '' }
            : { ok: false, msg: 'Letters, spaces, apostrophes and hyphens only — 2 to 50 characters.' };
        case 'email':
          return RE.email.test(v) ? { ok: true, msg: '' }
            : { ok: false, msg: 'Enter a valid email, like name@domain.com.' };
        case 'phone': {
          const norm = normalizePhone(v);
          if (RE.phoneIN.test(norm) || RE.phoneIntl.test(norm)) return { ok: true, msg: '' };
          return { ok: false, msg: 'Enter a valid 10-digit mobile number, e.g. 98765 43210.' };
        }
        case 'xhandle':
          return RE.xhandle.test(v) ? { ok: true, msg: '' }
            : { ok: false, msg: '1–15 letters, numbers or underscores — the @ is optional.' };
        case 'stack':
          return RE.stack.test(v) ? { ok: true, msg: '' }
            : { ok: false, msg: 'Letters, numbers and , & / - are fine — 2 to 60 characters.' };
        default:
          return { ok: true, msg: '' };
      }
    }

    function fieldRequiredMsg(kind) {
      return {
        name: 'Your name is required.',
        email: 'Email is required.',
        phone: 'Phone number is required.',
        stack: 'Tell us your primary stack.'
      }[kind] || 'This field is required.';
    }

    function wireValidation(inputEl, msgEl, kind, required, onValid) {
      const run = () => {
        const res = validateField(kind, inputEl.value, required);
        inputEl.classList.toggle('is-invalid', !res.ok);
        inputEl.classList.toggle('is-valid', res.ok && inputEl.value.trim().length > 0);
        msgEl.textContent = res.ok ? '' : res.msg;
        msgEl.classList.toggle('is-valid', res.ok);
        if (onValid) onValid(inputEl.value);
        scheduleRender();
        updateGating();
        return res.ok;
      };
      inputEl.addEventListener('input', run);
      inputEl.addEventListener('blur', run);
      return run;
    }

    /* ----------------------------------------------------------
       6. Builder-class auto-suggestion
    ---------------------------------------------------------- */
    function suggestClass(stackRaw) {
      const s = (stackRaw || '').toLowerCase();
      if (!s.trim()) return '';
      let best = null, bestScore = 0;
      for (const entry of CLASS_MAP) {
        const score = entry.kws.reduce((acc, kw) => acc + (s.includes(kw) ? 1 : 0), 0);
        if (score > bestScore) { bestScore = score; best = entry.label; }
      }
      return best || 'Full-Stack Nomad';
    }

    /* ----------------------------------------------------------
       7. Primary field wiring
    ---------------------------------------------------------- */
    const nameInput = $('#name');
    const emailInput = $('#email');
    const phoneInput = $('#phone');
    const xInput = $('#xhandle');
    const stackInput = $('#stack');
    const classInput = $('#builderClass');

    wireValidation(nameInput, $('#msg-name'), 'name', true, v => { state.builders[0].name = v; });
    wireValidation(emailInput, $('#msg-email'), 'email', true, v => { state.builders[0].email = v; });
    wireValidation(phoneInput, $('#msg-phone'), 'phone', true, v => { state.builders[0].phone = v; });
    wireValidation(xInput, $('#msg-xhandle'), 'xhandle', false, v => { state.builders[0].xhandle = v; });
    wireValidation(stackInput, $('#msg-stack'), 'stack', true, v => {
      state.builders[0].stack = v;
      if (state.autoClass) {
        classInput.value = suggestClass(v);
        state.builders[0].builderClass = classInput.value;
      }
    });
    classInput.addEventListener('input', () => {
      state.autoClass = false;
      state.builders[0].builderClass = classInput.value;
      scheduleRender();
    });

    /* ----------------------------------------------------------
       8. Format tabs / team size tabs / filter / theme tabs
    ---------------------------------------------------------- */
    function setActiveSegment(container, selector, value, attr) {
      container.querySelectorAll('.segmented__btn').forEach(btn => {
        const on = btn.dataset[attr] === value;
        btn.classList.toggle('is-active', on);
        btn.setAttribute('aria-selected', on ? 'true' : 'false');
      });
    }

    const teamSizeGroup = $('#teamSizeGroup');
    const teamUploaders = $('#teamUploaders');
    const teamFields = $('#teamFields');

    $('#formatTabs').addEventListener('click', e => {
      const btn = e.target.closest('.segmented__btn');
      if (!btn) return;
      state.format = btn.dataset.format;
      setActiveSegment($('#formatTabs'), '.segmented__btn', state.format, 'format');
      teamSizeGroup.hidden = state.format !== 'team';
      rebuildTeamBlocks();
      resizeCanvasForFormat();
      scheduleRender();
      updateGating();
    });

    $('#teamSizeTabs').addEventListener('click', e => {
      const btn = e.target.closest('.segmented__btn');
      if (!btn) return;
      state.teamSize = parseInt(btn.dataset.size, 10);
      setActiveSegment($('#teamSizeTabs'), '.segmented__btn', String(state.teamSize), 'size');
      rebuildTeamBlocks();
      scheduleRender();
      updateGating();
    });

    $('#filterTabs').addEventListener('click', e => {
      const btn = e.target.closest('.segmented__btn');
      if (!btn) return;
      state.filter = btn.dataset.filter;
      setActiveSegment($('#filterTabs'), '.segmented__btn', state.filter, 'filter');
      scheduleRender();
    });

    $('#themeTabs').addEventListener('click', e => {
      const btn = e.target.closest('.segmented__btn');
      if (!btn) return;
      state.theme = btn.dataset.theme;
      setActiveSegment($('#themeTabs'), '.segmented__btn', state.theme, 'theme');
      updateSiteThemeVariables(state.theme);
      scheduleRender();
    });

    function updateSiteThemeVariables(themeName) {
      const root = document.documentElement;
      if (themeName === 'goa') {
        root.style.setProperty('--bg', '#0b1f1c');
        root.style.setProperty('--bg-2', '#0e2420');
        root.style.setProperty('--surface', '#11291f');
        root.style.setProperty('--surface-2', '#17352a');
        root.style.setProperty('--ink', '#f4eee1');
        root.style.setProperty('--ink-dim', '#94a89f');
        root.style.setProperty('--brass', '#e8a33d');
        root.style.setProperty('--brass-dim', '#8a6a2e');
        root.style.setProperty('--coral', '#ff6b4a');
        root.style.setProperty('--mint', '#6fcf97');
        root.style.setProperty('--line', 'rgba(244,238,225,.12)');
        root.style.setProperty('--line-strong', 'rgba(244,238,225,.22)');
      } else if (themeName === 'night') {
        root.style.setProperty('--bg', '#070c16');
        root.style.setProperty('--bg-2', '#0b1526');
        root.style.setProperty('--surface', '#132038');
        root.style.setProperty('--surface-2', '#1d2e4d');
        root.style.setProperty('--ink', '#eef3fb');
        root.style.setProperty('--ink-dim', '#93a6c2');
        root.style.setProperty('--brass', '#8ec4ff');
        root.style.setProperty('--brass-dim', '#4f7fb8');
        root.style.setProperty('--coral', '#ff7b72');
        root.style.setProperty('--mint', '#6fcf97');
        root.style.setProperty('--line', 'rgba(238,243,251,.12)');
        root.style.setProperty('--line-strong', 'rgba(238,243,251,.22)');
      } else if (themeName === 'sand') {
        root.style.setProperty('--bg', '#d8bc80');
        root.style.setProperty('--bg-2', '#e6d09d');
        root.style.setProperty('--surface', '#f1e4c4');
        root.style.setProperty('--surface-2', '#ffffff');
        root.style.setProperty('--ink', '#241a0d');
        root.style.setProperty('--ink-dim', '#6f5c3a');
        root.style.setProperty('--brass', '#a1472e');
        root.style.setProperty('--brass-dim', '#6a2a1a');
        root.style.setProperty('--coral', '#e0533c');
        root.style.setProperty('--mint', '#12362a');
        root.style.setProperty('--line', 'rgba(36,26,13,.12)');
        root.style.setProperty('--line-strong', 'rgba(36,26,13,.22)');
      }
    }

    function resizeCanvasForFormat() {
      if (state.format === 'pfp') { canvas.width = 1080; canvas.height = 1080; }
      else if (state.format === 'id') { canvas.width = 1080; canvas.height = 1350; }
      else { canvas.width = 1600; canvas.height = 1000; }
    }

    /* ----------------------------------------------------------
       9. Teammate blocks (duo/trio, team format only)
    ---------------------------------------------------------- */
    function rebuildTeamBlocks() {
      teamUploaders.innerHTML = '';
      teamFields.innerHTML = '';
      if (state.format !== 'team' || state.teamSize < 2) return;

      for (let i = 1; i < state.teamSize; i++) {
        const slot = i; // 1 or 2
        const b = state.builders[slot];

        const uploaderWrap = document.createElement('div');
        uploaderWrap.className = 'field-group team-block';
        uploaderWrap.innerHTML = `
        <span class="team-block__label">Builder ${slot + 1} of ${state.teamSize}</span>
        <label class="field-label">Photo <span class="req">*</span></label>
        <div class="uploader" id="uploader-${slot}" data-slot="${slot}">
          <input type="file" accept="image/png,image/jpeg,image/webp,image/heic,image/heif" id="fileInput-${slot}" class="uploader__input" hidden />
          <div class="uploader__drop" id="drop-${slot}">
            <div class="uploader__empty">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M12 16V4M12 4L7 9M12 4l5 5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/><path d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>
              <p>Drop a photo, or</p>
              <div class="uploader__btns">
                <button type="button" class="btn btn--tiny" data-action="choose">Choose file</button>
                <button type="button" class="btn btn--tiny btn--tiny-ghost" data-action="selfie">📸 Selfie</button>
              </div>
            </div>
            <img class="uploader__preview" hidden alt="" />
          </div>
        </div>`;
        teamUploaders.appendChild(uploaderWrap);
        wireUploader(slot);

        const fieldsWrap = document.createElement('div');
        fieldsWrap.className = 'field-row';
        fieldsWrap.innerHTML = `
        <div class="field-group">
          <label class="field-label" for="name-${slot}">Name <span class="req">*</span></label>
          <input class="text-input" id="name-${slot}" type="text" placeholder="Teammate name" maxlength="50" value="${escapeAttr(b.name)}" />
          <p class="field-msg" id="msg-name-${slot}" role="alert"></p>
        </div>
        <div class="field-group">
          <label class="field-label" for="stack-${slot}">Stack / role <span class="req">*</span></label>
          <input class="text-input" id="stack-${slot}" type="text" placeholder="e.g. Backend, DevOps" maxlength="60" value="${escapeAttr(b.stack)}" />
          <p class="field-msg" id="msg-stack-${slot}" role="alert"></p>
        </div>`;
        teamFields.appendChild(fieldsWrap);

        wireValidation($(`#name-${slot}`), $(`#msg-name-${slot}`), 'name', true, v => { b.name = v; });
        wireValidation($(`#stack-${slot}`), $(`#msg-stack-${slot}`), 'stack', true, v => {
          b.stack = v; b.builderClass = suggestClass(v);
        });
      }
    }

    function escapeAttr(s) { return (s || '').replace(/"/g, '&quot;'); }

    /* ----------------------------------------------------------
       10. Photo upload / drag&drop / selfie
    ---------------------------------------------------------- */
    function wireUploader(slot) {
      const root = document.getElementById(`uploader-${slot}`);
      const drop = root.querySelector('.uploader__drop');
      const input = root.querySelector('.uploader__input');
      const previewImg = root.querySelector('.uploader__preview');
      const emptyState = root.querySelector('.uploader__empty');
      let panControls = root.querySelector('.pan-controls');

      drop.addEventListener('click', (e) => {
        if (e.target.closest('[data-action="selfie"]')) return openSelfie(slot);
        if (e.target.closest('[data-action="remove"]')) return;
        input.click();
      });

      root.addEventListener('dragover', e => { e.preventDefault(); drop.classList.add('is-dragover'); });
      root.addEventListener('dragleave', () => drop.classList.remove('is-dragover'));
      root.addEventListener('drop', e => {
        e.preventDefault();
        drop.classList.remove('is-dragover');
        const file = e.dataTransfer.files && e.dataTransfer.files[0];
        if (file) loadFileIntoSlot(slot, file);
      });

      input.addEventListener('change', () => {
        const file = input.files && input.files[0];
        if (file) loadFileIntoSlot(slot, file);
      });

      if (panControls) {
        panControls.querySelector('[data-action="remove"]').addEventListener('click', (e) => {
          e.stopPropagation();
          state.builders[slot].img = null;
          previewImg.hidden = true; previewImg.src = '';
          emptyState.hidden = false;
          panControls.hidden = true;
          scheduleRender(); updateGating();
        });
        const zoomRange = panControls.querySelector('.zoom-range');
        zoomRange.addEventListener('input', () => {
          state.builders[slot].zoom = parseInt(zoomRange.value, 10);
          scheduleRender();
        });
      }
    }

    function loadFileIntoSlot(slot, file) {
      if (!file.type.startsWith('image/')) {
        toast('That file isn\u2019t an image — try a JPG, PNG or WebP.');
        return;
      }
      const reader = new FileReader();
      reader.onload = () => setSlotImage(slot, reader.result);
      reader.onerror = () => toast('Couldn\u2019t read that photo — try another file.');
      reader.readAsDataURL(file);
    }

    function setSlotImage(slot, dataUrl) {
      const img = new Image();
      img.onload = () => {
        state.builders[slot].img = img;
        state.builders[slot].zoom = 100;
        state.builders[slot].offsetX = 0;
        state.builders[slot].offsetY = 0;

        const root = document.getElementById(`uploader-${slot}`);
        const previewImg = root.querySelector('.uploader__preview');
        const emptyState = root.querySelector('.uploader__empty');
        previewImg.src = dataUrl; previewImg.hidden = false;
        emptyState.hidden = true;
        const panControls = root.querySelector('.pan-controls');
        if (panControls) panControls.hidden = false;

        scheduleRender();
        updateGating();
      };
      img.onerror = () => toast('This browser can\u2019t preview that format — try a JPG, PNG or WebP.');
      img.src = dataUrl;
    }

    /* ---- selfie modal ---- */
    const selfieModal = $('#selfieModal');
    const selfieVideo = $('#selfieVideo');
    const selfieCanvas = $('#selfieCanvas');
    const selfieError = $('#selfieError');
    let selfieStream = null;
    let selfieTargetSlot = 0;

    async function openSelfie(slot) {
      selfieTargetSlot = slot;
      selfieModal.hidden = false;
      selfieError.hidden = true;
      try {
        selfieStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false });
        selfieVideo.srcObject = selfieStream;
      } catch (err) {
        selfieError.hidden = false;
        selfieError.textContent = 'Camera unavailable — allow camera access, or use Choose file instead.';
      }
    }

    function closeSelfie() {
      selfieModal.hidden = true;
      if (selfieStream) { selfieStream.getTracks().forEach(t => t.stop()); selfieStream = null; }
    }

    $('#closeSelfie').addEventListener('click', closeSelfie);
    selfieModal.addEventListener('click', e => { if (e.target === selfieModal) closeSelfie(); });

    $('#captureSelfie').addEventListener('click', () => {
      if (!selfieStream) { toast('Camera isn\u2019t active yet.'); return; }
      const w = selfieVideo.videoWidth, h = selfieVideo.videoHeight;
      if (!w || !h) return;
      selfieCanvas.width = w; selfieCanvas.height = h;
      const sctx = selfieCanvas.getContext('2d');
      sctx.translate(w, 0); sctx.scale(-1, 1); // mirror to match preview
      sctx.drawImage(selfieVideo, 0, 0, w, h);
      const dataUrl = selfieCanvas.toDataURL('image/png');
      setSlotImage(selfieTargetSlot, dataUrl);
      closeSelfie();
      toast('Selfie captured.');
    });

    /* primary (slot 0) uploader wiring */
    wireUploader(0);

    /* ----------------------------------------------------------
       11. Canvas drag-to-reposition (pfp / id formats, slot 0)
    ---------------------------------------------------------- */
    let dragging = false, dragStart = null;
    canvas.addEventListener('pointerdown', e => {
      if (state.format === 'team' || !state.builders[0].img) return;
      dragging = true;
      dragStart = { x: e.clientX, y: e.clientY, ox: state.builders[0].offsetX, oy: state.builders[0].offsetY };
      canvas.setPointerCapture(e.pointerId);
    });
    canvas.addEventListener('pointermove', e => {
      if (!dragging) return;
      const rect = canvas.getBoundingClientRect();
      const dx = (e.clientX - dragStart.x) / rect.width * 2;
      const dy = (e.clientY - dragStart.y) / rect.height * 2;
      const b = state.builders[0];
      b.offsetX = clamp(dragStart.ox - dx, -1, 1);
      b.offsetY = clamp(dragStart.oy - dy, -1, 1);
      scheduleRender();
    });
    ['pointerup', 'pointercancel', 'pointerleave'].forEach(ev =>
      canvas.addEventListener(ev, () => { dragging = false; }));

    function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

    /* ----------------------------------------------------------
       12. Deterministic hash + pseudo-random (for barcode / ref code)
    ---------------------------------------------------------- */
    function hashStr(str) {
      let h = 5381;
      for (let i = 0; i < str.length; i++) h = ((h << 5) + h) + str.charCodeAt(i);
      return Math.abs(h >>> 0);
    }
    function mulberry32(seed) {
      return function () {
        seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
        let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
      };
    }

    function refCode(name) {
      const h = hashStr(name || 'builder');
      return 'HHG26-' + h.toString(36).toUpperCase().slice(0, 5);
    }

    /* ----------------------------------------------------------
       13. Rendering — photo box (cover fit + pan/zoom + filter)
    ---------------------------------------------------------- */
    function renderPhotoBox(mainCtx, builder, dx, dy, dw, dh, radius, filter, theme) {
      const off = document.createElement('canvas');
      off.width = Math.round(dw); off.height = Math.round(dh);
      const octx = off.getContext('2d');

      if (builder.img) {
        const img = builder.img;
        const scaleBase = Math.max(dw / img.width, dh / img.height);
        const scale = scaleBase * ((builder.zoom || 100) / 100);
        const sw = dw / scale, sh = dh / scale;
        const extraW = img.width - sw, extraH = img.height - sh;
        const sx = clamp(extraW / 2 + (builder.offsetX || 0) * (extraW / 2), 0, Math.max(0, img.width - sw));
        const sy = clamp(extraH / 2 + (builder.offsetY || 0) * (extraH / 2), 0, Math.max(0, img.height - sh));
        octx.drawImage(img, sx, sy, sw, sh, 0, 0, dw, dh);

        if (filter === 'cel') {
          const id = octx.getImageData(0, 0, off.width, off.height);
          const d = id.data;
          const levels = 5, step = 255 / (levels - 1);
          for (let i = 0; i < d.length; i += 4) {
            d[i] = Math.round(Math.round(d[i] / step) * step);
            d[i + 1] = Math.round(Math.round(d[i + 1] / step) * step);
            d[i + 2] = Math.round(Math.round(d[i + 2] / step) * step);
          }
          octx.putImageData(id, 0, 0);
        } else if (filter === 'riso') {
          const id = octx.getImageData(0, 0, off.width, off.height);
          const d = id.data;
          const c1 = hexToRgb(theme.accent2), c2 = hexToRgb(theme.accent);
          for (let i = 0; i < d.length; i += 4) {
            const lum = (0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]) / 255;
            d[i] = c1.r + (c2.r - c1.r) * lum;
            d[i + 1] = c1.g + (c2.g - c1.g) * lum;
            d[i + 2] = c1.b + (c2.b - c1.b) * lum;
          }
          octx.putImageData(id, 0, 0);
          // slight misregistration pass for a riso feel
          octx.globalCompositeOperation = 'multiply';
          octx.globalAlpha = 0.35;
          octx.drawImage(off, -3, 2);
          octx.globalAlpha = 1; octx.globalCompositeOperation = 'source-over';
        }
      } else {
        octx.fillStyle = 'rgba(255,255,255,.06)';
        octx.fillRect(0, 0, off.width, off.height);
      }

      mainCtx.save();
      roundRectPath(mainCtx, dx, dy, dw, dh, radius);
      mainCtx.clip();
      mainCtx.drawImage(off, dx, dy);
      mainCtx.restore();
    }

    function hexToRgb(hex) {
      const h = hex.replace('#', '');
      return { r: parseInt(h.slice(0, 2), 16), g: parseInt(h.slice(2, 4), 16), b: parseInt(h.slice(4, 6), 16) };
    }

    function roundRectPath(c, x, y, w, h, r) {
      c.beginPath();
      c.moveTo(x + r, y);
      c.arcTo(x + w, y, x + w, y + h, r);
      c.arcTo(x + w, y + h, x, y + h, r);
      c.arcTo(x, y + h, x, y, r);
      c.arcTo(x, y, x + w, y, r);
      c.closePath();
    }

    /* ----------------------------------------------------------
       14. Rendering — background, chrome, barcode, गोवा sticker
    ---------------------------------------------------------- */
    function drawBackground(c, w, h, theme) {
      const g = c.createLinearGradient(0, 0, w * 0.3, h);
      g.addColorStop(0, theme.bgTop);
      g.addColorStop(0.55, theme.bgMid);
      g.addColorStop(1, theme.bgBottom);
      c.fillStyle = g;
      c.fillRect(0, 0, w, h);

      if (theme.sun) {
        const cx = w * 0.82, cy = h * 0.12, r = Math.max(w, h) * 0.34;
        const sg = c.createRadialGradient(cx, cy, 0, cx, cy, r);
        sg.addColorStop(0, hexA(theme.accent, 0.35));
        sg.addColorStop(1, hexA(theme.accent, 0));
        c.fillStyle = sg;
        c.fillRect(0, 0, w, h);
      }

      // faint dot grain
      c.save();
      c.globalAlpha = 0.05;
      c.fillStyle = theme.ink;
      const step = Math.round(w / 55);
      for (let y = step / 2; y < h; y += step) {
        for (let x = (y / step % 2 ? step / 2 : 0); x < w; x += step) {
          c.beginPath(); c.arc(x, y, 1.1, 0, Math.PI * 2); c.fill();
        }
      }
      c.restore();
    }

    function hexA(hex, a) {
      const { r, g, b } = hexToRgb(hex);
      return `rgba(${r},${g},${b},${a})`;
    }

    function drawPerforation(c, w, h, x, theme) {
      c.save();
      c.fillStyle = hexA('#000000', 0.001); // no-op to keep API shape consistent
      c.strokeStyle = theme.line;
      const n = 26, top = h * 0.08, bottom = h * 0.92, gap = (bottom - top) / n;
      for (let i = 0; i <= n; i++) {
        const y = top + i * gap;
        c.beginPath(); c.arc(x, y, 4, 0, Math.PI * 2);
        c.fillStyle = theme === THEMES.sand ? theme.bgBottom : '#081712';
        c.fill();
      }
      c.restore();
    }

    function drawBarcode(c, x, y, w, h, seedStr, theme) {
      const rand = mulberry32(hashStr(seedStr));
      let cx = x;
      c.save();
      while (cx < x + w) {
        const bw = 1 + Math.floor(rand() * 6);
        const tall = rand() > 0.25;
        c.fillStyle = rand() > 0.7 ? theme.accent : theme.ink;
        c.globalAlpha = 0.55 + rand() * 0.4;
        c.fillRect(cx, y + (tall ? 0 : h * 0.3), bw, tall ? h : h * 0.7);
        cx += bw + 2;
      }
      c.restore();
    }

    function drawGoaSticker(c, x, y, size, theme, rot = -8) {
      c.save();
      c.translate(x, y);
      c.rotate(rot * Math.PI / 180);

      c.font = `700 ${size}px 'Noto Sans Devanagari', sans-serif`;
      c.textAlign = 'center';
      c.textBaseline = 'middle';

      // Draw thick neon pink sticker backing outline
      c.strokeStyle = '#FF007F';
      c.lineWidth = size * 0.35;
      c.lineJoin = 'round';
      c.lineCap = 'round';
      c.strokeText('गोवा', 0, 0);

      // Fill text area with pink
      c.fillStyle = '#FF007F';
      c.fillText('गोवा', 0, 0);

      // Draw inner bright yellow text on top
      c.fillStyle = '#FFDC00';
      c.fillText('गोवा', 0, 0);

      c.restore();
    }

    function drawVectorPalmTree(c, x, y, scale, flip = false) {
      c.save();
      c.translate(x, y);
      if (flip) c.scale(-scale, scale);
      else c.scale(scale, scale);

      // 1. Draw trunk (white fill, black stroke)
      c.fillStyle = '#ffffff';
      c.strokeStyle = '#000000';
      c.lineWidth = 3.5;
      c.lineJoin = 'round';

      c.beginPath();
      c.moveTo(0, 0);
      c.quadraticCurveTo(-15, -80, -35, -160);
      c.lineTo(-20, -162);
      c.quadraticCurveTo(-5, -80, 15, 0);
      c.closePath();
      c.fill();
      c.stroke();

      // Trunk segments / ridges
      c.beginPath();
      for (let i = 1; i <= 6; i++) {
        const t = i / 7;
        const ty = -160 * t;
        const rx = -15 * t * t;
        c.moveTo(rx - 8, ty);
        c.lineTo(rx + 8, ty);
      }
      c.stroke();

      // 2. Draw leaves
      const leafColors = ['#00A859', '#8DC63F', '#009245'];
      const leaves = [
        { rot: -1.2 },
        { rot: -0.6 },
        { rot: -0.1 },
        { rot: 0.4 },
        { rot: 0.9 },
        { rot: 1.4 }
      ];

      leaves.forEach((lf, idx) => {
        c.save();
        c.translate(-27, -161); // crown center
        c.rotate(lf.rot);

        // Draw leaf blade
        c.fillStyle = leafColors[idx % leafColors.length];
        c.beginPath();
        c.moveTo(0, 0);
        c.bezierCurveTo(-20, -40, -50, -40, -80, 0);
        c.bezierCurveTo(-50, 20, -20, 20, 0, 0);
        c.closePath();
        c.fill();
        c.stroke();

        // Leaf spine/vein
        c.beginPath();
        c.moveTo(0, 0);
        c.quadraticCurveTo(-40, 0, -80, 0);
        c.strokeStyle = '#ffffff';
        c.lineWidth = 2;
        c.stroke();

        c.restore();
      });

      c.restore();
    }

    function drawCardTag(c, text, x, y, bg, textStyle, textColor, borderCol = '#000000', borderWidth = 3) {
      c.save();
      c.font = textStyle;
      const metrics = c.measureText(text);
      const textW = metrics.width;
      const fontH = parseInt(textStyle, 10) || 20;
      const padX = 16;
      const padY = 6;
      const boxW = textW + padX * 2;
      const boxH = fontH + padY * 2;

      // Draw box
      c.fillStyle = bg;
      c.strokeStyle = borderCol;
      c.lineWidth = borderWidth;
      c.lineJoin = 'round';

      roundRectPath(c, x, y, boxW, boxH, 8);
      c.fill();
      c.stroke();

      // Draw text
      c.fillStyle = textColor;
      c.textAlign = 'left';
      c.textBaseline = 'middle';
      c.fillText(text, x + padX, y + padY + fontH / 2 + 1);

      c.restore();
      return boxH;
    }

    function drawPalmTree(c, x, y, scale, color, alpha) {
      c.save();
      c.translate(x, y);
      c.scale(scale, scale);
      c.globalAlpha = alpha;
      c.fillStyle = color;
      c.strokeStyle = color;

      // Curved trunk
      c.beginPath();
      c.moveTo(0, 0);
      c.quadraticCurveTo(-15, -60, -30, -120);
      c.quadraticCurveTo(-35, -125, -30, -128);
      c.quadraticCurveTo(-10, -70, 10, 0);
      c.closePath();
      c.fill();

      // Trunk ridges
      c.lineWidth = 1.5;
      for (let i = 1; i <= 6; i++) {
        const t = i / 7;
        const ry = -120 * t;
        const rx = -15 * t * t;
        c.beginPath();
        c.arc(rx, ry, 3.5, 0, Math.PI, true);
        c.stroke();
      }

      // Coconuts
      c.beginPath();
      c.arc(-26, -118, 7, 0, Math.PI * 2);
      c.arc(-18, -122, 6, 0, Math.PI * 2);
      c.arc(-32, -126, 6.5, 0, Math.PI * 2);
      c.fill();

      // 6 palm fronds (leaves)
      const fronds = [
        { curveX: -80, curveY: -150, endX: -130, endY: -130 },
        { curveX: -80, curveY: -180, endX: -110, endY: -180 },
        { curveX: -40, curveY: -200, endX: -50, endY: -210 },
        { curveX: 0, curveY: -200, endX: 10, endY: -200 },
        { curveX: 40, curveY: -180, endX: 70, endY: -170 },
        { curveX: 30, curveY: -140, endX: 50, endY: -110 }
      ];

      fronds.forEach(f => {
        c.save();
        c.lineWidth = 2.5;
        c.beginPath();
        c.moveTo(-30, -124);
        c.quadraticCurveTo(f.curveX, f.curveY, f.endX, f.endY);
        c.stroke();

        // Leaflets branching off
        const steps = 14;
        for (let i = 1; i <= steps; i++) {
          const t = i / steps;
          const sx = (1 - t) * (1 - t) * (-30) + 2 * (1 - t) * t * f.curveX + t * t * f.endX;
          const sy = (1 - t) * (1 - t) * (-124) + 2 * (1 - t) * t * f.curveY + t * t * f.endY;

          c.beginPath();
          c.moveTo(sx, sy);
          const dx = (f.endX - -30) * 0.15 + (i % 2 === 0 ? 5 : -5);
          const dy = 12 + (i % 3) * 2;
          c.lineTo(sx + dx, sy + dy);
          c.stroke();
        }
        c.restore();
      });

      c.restore();
    }

    function drawCoconutSticker(c, x, y, scale, theme, rotAngle = 0) {
      c.save();
      c.translate(x, y);
      c.rotate(rotAngle * Math.PI / 180);
      c.scale(scale, scale);

      // Background leaves
      c.fillStyle = theme.accent === '#e8a33d' ? '#275240' : theme.accent;
      c.globalAlpha = 0.55;

      c.beginPath();
      c.ellipse(-15, -15, 8, 22, -Math.PI / 4, 0, Math.PI * 2);
      c.fill();

      c.beginPath();
      c.ellipse(15, -15, 8, 22, Math.PI / 4, 0, Math.PI * 2);
      c.fill();

      c.globalAlpha = 1;

      // Whole coconut (left)
      c.fillStyle = theme.accent;
      c.beginPath();
      c.arc(-16, 5, 20, 0, Math.PI * 2);
      c.fill();
      c.strokeStyle = theme.bgTop;
      c.lineWidth = 2;
      c.stroke();

      // Coconut eyes
      c.fillStyle = theme.bgTop;
      c.beginPath();
      c.arc(-22, 0, 2.5, 0, Math.PI * 2);
      c.arc(-14, -4, 2.5, 0, Math.PI * 2);
      c.arc(-14, 4, 2.5, 0, Math.PI * 2);
      c.fill();

      // Half coconut (right)
      c.fillStyle = theme.accent;
      c.beginPath();
      c.arc(14, 12, 18, 0, Math.PI * 2);
      c.fill();
      c.stroke();

      // White flesh
      c.fillStyle = '#ffffff';
      c.beginPath();
      c.arc(14, 12, 14, 0, Math.PI * 2);
      c.fill();

      // Core water
      c.fillStyle = theme.bgMid;
      c.beginPath();
      c.arc(14, 12, 10, 0, Math.PI * 2);
      c.fill();

      // Straw
      c.strokeStyle = theme.accent2;
      c.lineWidth = 3;
      c.lineCap = 'round';
      c.beginPath();
      c.moveTo(10, 8);
      c.lineTo(0, -14);
      c.lineTo(-6, -16);
      c.stroke();

      c.restore();
    }

    function wrapText(c, text, x, y, maxWidth, lineHeight) {
      const words = (text || '').split(' ');
      let line = '', ly = y, lines = 0;
      for (const word of words) {
        const test = line ? line + ' ' + word : word;
        if (c.measureText(test).width > maxWidth && line) {
          c.fillText(line, x, ly);
          line = word; ly += lineHeight; lines++;
          if (lines > 2) return ly;
        } else line = test;
      }
      if (line) c.fillText(line, x, ly);
      return ly;
    }

    /* ----------------------------------------------------------
       15. Master render
    ---------------------------------------------------------- */
    let rafPending = false;
    function scheduleRender() {
      if (rafPending) return;
      rafPending = true;
      requestAnimationFrame(() => { rafPending = false; render(); });
    }

    function render() {
      const theme = THEMES[state.theme];
      const w = canvas.width, h = canvas.height;
      ctx.clearRect(0, 0, w, h);
      drawBackground(ctx, w, h, theme);

      if (state.format === 'pfp') renderPFP(theme, w, h);
      else if (state.format === 'id') renderID(theme, w, h);
      else renderTeam(theme, w, h);

      canvas.style.cursor = (state.format !== 'team' && state.builders[0].img) ? 'grab' : 'default';
    }

    function renderPFP(theme, w, h) {
      const b = state.builders[0];
      const pad = w * 0.06;
      renderPhotoBox(ctx, b, pad, pad, w - pad * 2, h - pad * 2, 40, state.filter, theme);

      // 1. Stacked HACKER HOUSE yellow text in background
      ctx.save();
      ctx.fillStyle = '#FFDC00';
      ctx.font = `900 ${w * 0.065}px Fraunces, serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 6;
      // Stroke text for outline comic look
      ctx.strokeText('HACKER  HOUSE', w / 2, pad + 70);
      ctx.fillText('HACKER  HOUSE', w / 2, pad + 70);
      ctx.restore();

      // 2. Neon pink Goa sticker overlay in the center of the text
      drawGoaSticker(ctx, w / 2, pad + 65, w * 0.055, theme, -8);

      // 3. Vector Palm Trees framing the bottom corners
      drawVectorPalmTree(ctx, w * 0.08, h * 0.92, 1.6, false);
      drawVectorPalmTree(ctx, w * 0.92, h * 0.92, 1.6, true);

      // 4. Coconut sticker decoration
      drawCoconutSticker(ctx, w * 0.15, h * 0.18, 1.0, theme, -12);

      // ring
      ctx.save();
      roundRectPath(ctx, pad, pad, w - pad * 2, h - pad * 2, 40);
      ctx.lineWidth = 10; ctx.strokeStyle = '#FFDC00'; ctx.stroke();
      ctx.restore();

      // bottom name plate (high contrast yellow card with black border)
      const plateH = h * 0.16;
      ctx.save();
      ctx.fillStyle = '#FFDC00';
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 4;
      roundRectPath(ctx, pad + 14, h - pad - plateH - 14, w - pad * 2 - 28, plateH, 20);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#000000';
      ctx.font = `900 ${w * 0.055}px Fraunces, serif`;
      ctx.textBaseline = 'alphabetic';
      ctx.fillText((b.name || 'YOUR NAME').toUpperCase(), pad + 38, h - pad - plateH / 2 - 10);

      ctx.font = `700 ${w * 0.024}px 'Space Grotesk', sans-serif`;
      ctx.fillStyle = '#FF007F';
      ctx.fillText('HH GOA 2026 · BUILDER', pad + 38, h - pad - plateH / 2 + 26);
      ctx.restore();
    }

    function renderID(theme, w, h) {
      const b = state.builders[0];
      drawPerforation(ctx, w, h, w * 0.065, theme);

      // Faint Goan background watermarks
      drawPalmTree(ctx, w * 0.88, h * 0.85, 3.8, theme.accent, 0.06);
      drawPalmTree(ctx, w * 0.22, h * 1.0, 4.4, theme.accent2, 0.04);

      const marginL = w * 0.11, marginR = w * 0.08;

      // header: Stacked HACKER HOUSE logo and pink Goa sticker
      ctx.save();
      ctx.fillStyle = '#FFDC00';
      ctx.font = `900 ${w * 0.038}px Fraunces, serif`;
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 4;
      ctx.strokeText('HACKER HOUSE', marginL, h * 0.06);
      ctx.fillText('HACKER HOUSE', marginL, h * 0.06);
      ctx.restore();

      drawGoaSticker(ctx, marginL + w * 0.2, h * 0.05, w * 0.024, theme, -12);

      // Reference code badge on the right
      ctx.save();
      const refText = refCode(b.name || b.email || 'builder');
      const refFont = `700 ${w * 0.016}px 'Space Grotesk', sans-serif`;
      drawCardTag(ctx, refText, w - marginR - w * 0.18, h * 0.038, '#FFDC00', refFont, '#000000', '#000000', 2.5);
      ctx.restore();

      // photo with a thick black border
      const photoY = h * 0.135, photoH = h * 0.44;
      renderPhotoBox(ctx, b, marginL, photoY, w - marginL - marginR, photoH, 26, state.filter, theme);
      ctx.save();
      roundRectPath(ctx, marginL, photoY, w - marginL - marginR, photoH, 26);
      ctx.lineWidth = 5; ctx.strokeStyle = '#000000'; ctx.stroke();
      ctx.restore();

      drawGoaSticker(ctx, w - marginR - w * 0.05, photoY + 40, w * 0.06, theme, -10);

      // name + role + class drawn as high-contrast pass tag cards
      let ny = photoY + photoH + h * 0.045;

      // 1. Name Tag (Yellow Card)
      ctx.save();
      const nameStr = (b.name || 'Your Name').toUpperCase();
      const nameFont = `900 ${w * 0.035}px Fraunces, serif`;
      const nameH = drawCardTag(ctx, nameStr, marginL, ny, '#FFDC00', nameFont, '#000000', '#000000', 3.5);
      ctx.restore();

      ny += nameH + h * 0.012;

      // 2. Stack Tag (Hot Pink Card)
      ctx.save();
      const stackStr = (b.stack || 'Primary stack').toUpperCase();
      const stackFont = `700 ${w * 0.02}px 'Space Grotesk', sans-serif`;
      const stackH = drawCardTag(ctx, stackStr, marginL, ny, '#FF007F', stackFont, '#ffffff', '#000000', 3);
      ctx.restore();

      ny += stackH + h * 0.012;

      // 3. Builder Class Tag (White Card)
      ctx.save();
      const classStr = b.builderClass || suggestClass(b.stack) || 'Builder';
      const classFont = `600 ${w * 0.018}px 'JetBrains Mono', monospace`;
      const classH = drawCardTag(ctx, classStr, marginL, ny, '#ffffff', classFont, '#000000', '#000000', 3);
      ctx.restore();

      // contact strip
      ny += classH + h * 0.024;
      ctx.font = `400 ${w * 0.02}px 'JetBrains Mono', monospace`;
      ctx.fillStyle = theme.inkDim;
      const contactBits = [];
      if (b.email) contactBits.push(b.email);
      if (b.phone) contactBits.push(formatPhoneDisplay(b.phone));
      if (b.xhandle) contactBits.push(b.xhandle.startsWith('@') ? b.xhandle : '@' + b.xhandle);
      ctx.fillText(contactBits.join('   ·   '), marginL, ny);

      // Coconut sticker stamp
      drawCoconutSticker(ctx, w - marginR - 80, h * 0.74, 0.95, theme, 15);

      // day strip - rendered as colorful hanging day boxes
      const dayY = h * 0.83;
      const days = ['GENESIS', 'TRIANGLE', 'BUILD', 'LAUNCH'];
      const dayW = (w - marginL - marginR) / days.length;
      const dayColors = ['#FFDC00', '#FF007F', '#cc0066', '#FFDC00'];
      const dayTextColors = ['#000000', '#ffffff', '#ffffff', '#000000'];

      ctx.save();
      days.forEach((d, i) => {
        const dx = marginL + i * dayW;
        const cardW = dayW - 14;

        // Box background
        ctx.fillStyle = dayColors[i];
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 3.5;
        roundRectPath(ctx, dx, dayY, cardW, h * 0.065, 8);
        ctx.fill();
        ctx.stroke();

        // Numbers and titles inside
        ctx.fillStyle = dayTextColors[i];
        ctx.font = `800 ${w * 0.018}px 'Space Grotesk', sans-serif`;
        ctx.fillText(`0${i + 1}`, dx + 14, dayY + h * 0.024);
        ctx.font = `600 ${w * 0.013}px 'JetBrains Mono', monospace`;
        ctx.fillText(d, dx + 14, dayY + h * 0.046);
      });
      ctx.restore();

      // footer: barcode
      const barY = h * 0.93;
      drawBarcode(ctx, marginL, barY, w - marginL - marginR, h * 0.03, (b.name || '') + (b.email || ''), theme);
      ctx.font = `400 ${w * 0.018}px 'JetBrains Mono', monospace`;
      ctx.fillStyle = theme.inkDim;
      ctx.fillText('#FrameInGoa · not an official seat allocation', marginL, h * 0.975);
    }

    function renderTeam(theme, w, h) {
      const n = state.teamSize;
      const marginX = w * 0.05, top = h * 0.16, bottom = h * 0.88;

      // Faint Goan background watermarks
      drawPalmTree(ctx, w * 0.06, h * 0.92, 3.2, theme.accent, 0.05);
      drawPalmTree(ctx, w * 0.94, h * 0.92, 3.2, theme.accent2, 0.05);

      // Centered HACKER HOUSE logo on top
      ctx.save();
      ctx.fillStyle = '#FFDC00';
      ctx.font = `900 ${h * 0.052}px Fraunces, serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 5;
      ctx.strokeText('HACKER HOUSE', w / 2, h * 0.055);
      ctx.fillText('HACKER HOUSE', w / 2, h * 0.055);
      ctx.restore();

      drawGoaSticker(ctx, w / 2 + w * 0.1, h * 0.05, h * 0.042, theme, -8);

      // Centered date and location sub-header
      ctx.save();
      ctx.fillStyle = '#ffffff';
      ctx.font = `700 ${h * 0.018}px 'Space Grotesk', sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText('GOA, INDIA · 28–31 OCT 2026 · 2:47 PM STUDIO', w / 2, h * 0.11);
      ctx.restore();

      // Flanking Vector Palm Trees on the far left and right edges (framing the team frame!)
      drawVectorPalmTree(ctx, w * 0.055, h * 0.98, 2.4, false);
      drawVectorPalmTree(ctx, w * 0.945, h * 0.98, 2.4, true);

      const gap = w * 0.035;
      // Account for palm tree margins on the sides
      const usableW = w - marginX * 2.6 - gap * (n - 1);
      const colW = usableW / n;
      const startX = marginX * 1.3;

      for (let i = 0; i < n; i++) {
        const b = state.builders[i];
        const x = startX + i * (colW + gap);
        renderPhotoBox(ctx, b, x, top, colW, bottom - top - h * 0.15, 24, state.filter, theme);
        ctx.save();
        roundRectPath(ctx, x, top, colW, bottom - top - h * 0.15, 24);
        ctx.lineWidth = 4; ctx.strokeStyle = '#000000'; ctx.stroke();
        ctx.restore();

        const ty = bottom - h * 0.11;

        // Teammate Name Tag (Yellow Card)
        const nameStr = (b.name || `Builder ${i + 1}`).toUpperCase();
        const nameFont = `900 ${h * 0.024}px Fraunces, serif`;
        const nameH = drawCardTag(ctx, nameStr, x, ty, '#FFDC00', nameFont, '#000000', '#000000', 3);

        // Teammate Stack Tag (Hot Pink Card)
        const stackStr = (b.stack || 'Stack').toUpperCase();
        const stackFont = `700 ${h * 0.015}px 'Space Grotesk', sans-serif`;
        drawCardTag(ctx, stackStr, x, ty + nameH + 8, '#FF007F', stackFont, '#ffffff', '#000000', 2.5);
      }

      drawBarcode(ctx, marginX * 1.3, bottom + h * 0.03, w - marginX * 2.6, h * 0.025, state.builders.slice(0, n).map(b => b.name).join('|'), theme);
      ctx.font = `400 ${h * 0.016}px 'JetBrains Mono', monospace`;
      ctx.fillStyle = theme.inkDim;
      ctx.fillText('#FrameInGoa', marginX * 1.3, h * 0.975);
    }

    function formatPhoneDisplay(raw) {
      const norm = normalizePhone(raw);
      const digits = norm.replace(/^\+?91/, '');
      if (digits.length === 10) return `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`;
      return raw;
    }

    /* ----------------------------------------------------------
       16. Gating — enable/disable download & share
    ---------------------------------------------------------- */
    const downloadBtn = $('#downloadBtn');
    const shareBtn = $('#shareBtn');
    const previewHint = $('#previewHint');
    const formStatus = $('#formStatus');

    function updateGating() {
      const issues = [];
      const b0 = state.builders[0];

      if (!b0.img) issues.push('add a photo');
      if (!validateField('name', b0.name, true).ok) issues.push('a valid name');
      if (!validateField('email', b0.email, true).ok) issues.push('a valid email');
      if (!validateField('phone', b0.phone, true).ok) issues.push('a valid phone number');
      if (!validateField('stack', b0.stack, true).ok) issues.push('your stack');

      if (state.format === 'team') {
        for (let i = 1; i < state.teamSize; i++) {
          const b = state.builders[i];
          if (!b.img) issues.push(`builder ${i + 1}'s photo`);
          if (!validateField('name', b.name, true).ok) issues.push(`builder ${i + 1}'s name`);
        }
      }

      const ok = issues.length === 0;
      downloadBtn.disabled = !ok;
      shareBtn.disabled = !ok;

      const canvasWrap = $('.preview__canvas-wrap');
      if (canvasWrap) {
        canvasWrap.classList.toggle('is-unlocked', ok);
      }

      if (ok) {
        previewHint.textContent = 'Looking sharp. Save it or post it straight to X.';
        formStatus.textContent = '';
        formStatus.className = 'form-status';
      } else {
        previewHint.textContent = 'Fill in the required fields to unlock your ID.';
        formStatus.textContent = 'Still need: ' + issues.slice(0, 3).join(', ') + (issues.length > 3 ? '…' : '.');
        formStatus.className = 'form-status is-error';
      }
      return ok;
    }

    /* ----------------------------------------------------------
       17. Download & Share
    ---------------------------------------------------------- */
    function triggerConfetti() {
      const colors = [
        getComputedStyle(document.documentElement).getPropertyValue('--brass').trim() || '#e8a33d',
        getComputedStyle(document.documentElement).getPropertyValue('--mint').trim() || '#6fcf97',
        getComputedStyle(document.documentElement).getPropertyValue('--coral').trim() || '#ff6b4a',
        '#ffd700', '#ff69b4', '#00ffff'
      ];

      for (let i = 0; i < 90; i++) {
        const c = document.createElement('div');
        c.className = 'confetti-particle';
        c.style.background = colors[Math.floor(Math.random() * colors.length)];
        c.style.left = (Math.random() * 100) + 'vw';
        c.style.top = '-20px';

        const size = 6 + Math.random() * 12;
        c.style.width = size + 'px';
        c.style.height = size + 'px';

        const duration = 2.5 + Math.random() * 2.5;
        c.style.animation = `fall ${duration}s linear forwards`;
        c.style.transform = `rotate(${Math.random() * 360}deg)`;

        document.body.appendChild(c);

        setTimeout(() => c.remove(), duration * 1000);
      }
    }

    downloadBtn.addEventListener('click', () => {
      if (!updateGating()) { toast('A few fields still need fixing.'); return; }
      canvas.toBlob(blob => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        const safeName = (state.builders[0].name || 'builder').toLowerCase().replace(/[^a-z0-9]+/g, '-');
        a.href = url;
        a.download = `hhgoa2026-${state.format}-${safeName}.png`;
        document.body.appendChild(a); a.click(); a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 2000);
        toast('Saved. Ready for #FrameInGoa.');
        triggerConfetti();
      }, 'image/png');
    });

    shareBtn.addEventListener('click', () => {
      if (!updateGating()) { toast('A few fields still need fixing.'); return; }
      canvas.toBlob(async blob => {
        const fileName = 'hhgoa2026-builder-id.png';
        const file = new File([blob], fileName, { type: 'image/png' });
        const text = `Just minted my Hacker House Goa 2026 Builder ID. #FrameInGoa #HHGoa2026`;

        triggerConfetti();

        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          try {
            await navigator.share({ files: [file], title: 'HH Goa 2026 Builder ID', text });
            return;
          } catch (err) { /* user cancelled or unsupported — fall through */ }
        }

        // Fallback: try clipboard, then open X composer with prefilled text
        try {
          if (navigator.clipboard && window.ClipboardItem) {
            await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
            toast('Image copied — paste it into the post.');
          } else {
            toast('Save the PNG, then attach it on X.');
          }
        } catch (err) {
          toast('Save the PNG, then attach it on X.');
        }
        const intent = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
        window.open(intent, '_blank', 'noopener');
      }, 'image/png');
    });

    /* ----------------------------------------------------------
       18. Init
    ---------------------------------------------------------- */
    resizeCanvasForFormat();
    updateSiteThemeVariables(state.theme);
    updateGating();
    scheduleRender();

    // Interactive click-to-burst emojis
    document.addEventListener('click', e => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.closest('button') || e.target.closest('a') || e.target.closest('.segmented__btn') || e.target.closest('.uploader')) return;

      const emojis = ['🌴', '🥥', '🌊', '🍹', '☀️', '🦀'];
      const count = 3 + Math.floor(Math.random() * 4);

      for (let i = 0; i < count; i++) {
        const p = document.createElement('div');
        p.className = 'emoji-pop';
        p.textContent = emojis[Math.floor(Math.random() * emojis.length)];
        p.style.left = e.clientX + 'px';
        p.style.top = e.clientY + 'px';

        const angle = Math.random() * Math.PI * 2;
        const velocity = 50 + Math.random() * 80;
        const tx = Math.cos(angle) * velocity;
        const ty = Math.sin(angle) * velocity - 35;

        p.style.setProperty('--tx', tx + 'px');
        p.style.setProperty('--ty', ty + 'px');

        document.body.appendChild(p);
        setTimeout(() => p.remove(), 1000);
      }
    });
  })();
