// Generator CV: formular → stare → previzualizare A4. Starea se salvează local, PDF-ul se face prin print.
(() => {
  const STORAGE_KEY = 'cv-builder:v1';
  const form = document.getElementById('form');
  const cv = document.getElementById('cv');

  const example = {
    name: 'Andrei Popescu', title: 'Programator Full Stack', email: 'andrei@exemplu.ro', phone: '+40 700 000 000',
    city: 'București', website: 'linkedin.com/in/andrei-popescu',
    summary: 'Dezvoltator web cu 5 ani de experiență în Laravel și React. Construiesc aplicații rapide, ușor de întreținut și orientate spre rezultate de business.',
    experience: [
      { role: 'Full Stack Developer', company: 'Studio Digital SRL', period: '2022 — prezent', place: 'București', details: 'Am livrat 12 magazine online cu plăți Stripe\nAm redus timpul de încărcare cu 60%\nAm coordonat code review pentru o echipă de 4 oameni' },
      { role: 'Junior PHP Developer', company: 'Web Agency', period: '2020 — 2022', place: 'Cluj-Napoca', details: 'Site-uri de prezentare și integrări API\nMentenanță pentru 30+ clienți' },
    ],
    education: [{ degree: 'Licență în Informatică', school: 'Universitatea din București', period: '2017 — 2020' }],
    skills: 'Laravel, PHP, React, MySQL, Tailwind CSS, Git, Docker, SEO tehnic',
    languages: 'Engleză — C1, Germană — A2',
    photo: '', template: 'modern', accent: '#2563eb',
  };

  let state = load() || structuredClone(example);

  function load() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)); } catch { return null; }
  }
  function save() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch { /* stocare indisponibilă: continuăm fără */ }
  }

  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const list = s => String(s || '').split(',').map(x => x.trim()).filter(Boolean);

  // ---------- Formular ----------
  function fillForm() {
    for (const el of form.elements) if (el.name && el.name in state) el.value = state[el.name];
    document.getElementById('template').value = state.template;
    document.getElementById('accent').value = state.accent;
    for (const kind of ['experience', 'education']) {
      const box = document.getElementById(kind);
      box.innerHTML = '';
      state[kind].forEach((entry, i) => box.appendChild(itemNode(kind, entry, i)));
    }
  }

  function itemNode(kind, entry, index) {
    const node = document.getElementById(`tpl-${kind}`).content.firstElementChild.cloneNode(true);
    node.dataset.index = index;
    node.querySelectorAll('[data-k]').forEach(input => { input.value = entry[input.dataset.k] || ''; });
    return node;
  }

  form.addEventListener('input', e => {
    const el = e.target;
    const item = el.closest('.item');
    if (item) {
      const kind = item.parentElement.id;
      state[kind][+item.dataset.index][el.dataset.k] = el.value;
    } else if (el.name) {
      state[el.name] = el.value;
    }
    render();
  });

  form.addEventListener('click', e => {
    const add = e.target.closest('[data-add]');
    const remove = e.target.closest('[data-remove]');
    if (add) {
      state[add.dataset.add].push({});
      fillForm();
    } else if (remove) {
      const item = remove.closest('.item');
      state[item.parentElement.id].splice(+item.dataset.index, 1);
      fillForm();
    }
    render();
  });

  document.getElementById('photo').addEventListener('change', e => {
    const file = e.target.files[0];
    if (!file) return;
    // Micșorăm poza la 400px ca să nu umple stocarea locală.
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, 400 / Math.max(img.width, img.height));
      const canvas = Object.assign(document.createElement('canvas'), { width: img.width * scale, height: img.height * scale });
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
      state.photo = canvas.toDataURL('image/jpeg', 0.85);
      URL.revokeObjectURL(img.src);
      render();
    };
    img.src = URL.createObjectURL(file);
  });

  document.getElementById('template').addEventListener('change', e => { state.template = e.target.value; render(); });
  document.getElementById('accent').addEventListener('input', e => { state.accent = e.target.value; render(); });
  document.getElementById('pdf').addEventListener('click', () => window.print());
  document.getElementById('reset').addEventListener('click', () => {
    if (!confirm('Ștergi toate datele introduse?')) return;
    state = { ...structuredClone(example), name: '', title: '', email: '', phone: '', city: '', website: '', summary: '', experience: [], education: [], skills: '', languages: '' };
    fillForm(); render();
  });
  document.getElementById('export-json').addEventListener('click', () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: `cv-${(state.name || 'meu').toLowerCase().replace(/\s+/g, '-')}.json` });
    a.click();
    URL.revokeObjectURL(a.href);
  });
  document.getElementById('import-json').addEventListener('change', async e => {
    try {
      state = { ...structuredClone(example), ...JSON.parse(await e.target.files[0].text()) };
      fillForm(); render();
    } catch {
      alert('Fișierul nu este un CV valid.');
    }
  });

  // ---------- Previzualizare ----------
  function render() {
    cv.className = `cv ${state.template}`;
    cv.style.setProperty('--accent', state.accent);
    const contact = [state.email, state.phone, state.city, state.website].filter(Boolean).map(esc);
    const section = (title, body) => body ? `<section><h2>${title}</h2>${body}</section>` : '';
    const experience = state.experience.filter(x => x.role || x.company).map(x => `
      <div class="entry">
        <div class="entry-head"><strong>${esc(x.role)}</strong><span>${esc(x.period)}</span></div>
        <div class="muted">${[x.company, x.place].filter(Boolean).map(esc).join(' · ')}</div>
        ${x.details ? `<ul>${x.details.split('\n').filter(l => l.trim()).map(l => `<li>${esc(l)}</li>`).join('')}</ul>` : ''}
      </div>`).join('');
    const education = state.education.filter(x => x.degree || x.school).map(x => `
      <div class="entry">
        <div class="entry-head"><strong>${esc(x.degree)}</strong><span>${esc(x.period)}</span></div>
        <div class="muted">${esc(x.school)}</div>
      </div>`).join('');
    const chips = items => items.length ? `<div class="chips">${items.map(s => `<span>${esc(s)}</span>`).join('')}</div>` : '';

    cv.innerHTML = `
      <header class="cv-head">
        ${state.photo ? `<img class="photo" src="${state.photo}" alt="">` : ''}
        <div>
          <h1>${esc(state.name) || 'Numele tău'}</h1>
          <p class="role">${esc(state.title)}</p>
          <p class="contact">${contact.join(' <b>·</b> ')}</p>
        </div>
      </header>
      ${section('Profil', state.summary ? `<p>${esc(state.summary)}</p>` : '')}
      ${section('Experiență', experience)}
      ${section('Educație', education)}
      ${section('Competențe', chips(list(state.skills)))}
      ${section('Limbi străine', chips(list(state.languages)))}`;
    document.title = state.name ? `CV — ${state.name}` : 'Generator CV gratuit — previzualizare A4 și export PDF';
    save();
  }

  fillForm();
  render();
})();
