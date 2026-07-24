function showTab(target){
    document.querySelectorAll('.ticket').forEach(t => t.classList.toggle('active', t.id === target));
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.toggle('active', b.dataset.target === target));
    window.scrollTo({top:0, behavior:'instant'});
    try{ history.replaceState(null, '', '#' + target); }catch(e){ /* history API may be restricted in some embeds */ }
    moveTabHighlight();
  }

  // Sliding highlight pill that glides behind the active nav tab
  const tabsEl = document.getElementById('tabs');
  const tabHighlight = document.createElement('div');
  tabHighlight.className = 'tab-highlight';
  tabsEl.appendChild(tabHighlight);
  function moveTabHighlight(instant){
    const activeBtn = tabsEl.querySelector('.tab-btn.active');
    if(!activeBtn) { tabHighlight.style.opacity = '0'; return; }
    tabHighlight.style.opacity = '1';
    const tabsRect = tabsEl.getBoundingClientRect();
    const btnRect = activeBtn.getBoundingClientRect();
    if(instant) tabHighlight.style.transition = 'none';
    tabHighlight.style.width = btnRect.width + 'px';
    tabHighlight.style.height = btnRect.height + 'px';
    tabHighlight.style.transform = `translate(${btnRect.left - tabsRect.left}px, ${btnRect.top - tabsRect.top}px)`;
    if(instant){
      requestAnimationFrame(() => { tabHighlight.style.transition = ''; });
    }
  }
  window.addEventListener('resize', () => moveTabHighlight(true));
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => showTab(btn.dataset.target));
  });
  const initial = location.hash.replace('#','');
  if (initial && document.getElementById(initial)) showTab(initial);
  moveTabHighlight(true);

  // Open location in the visitor's own maps app — Apple Maps on iOS/Mac, Google Maps elsewhere
  function openInMaps(e){
    if(e) e.preventDefault();
    const query = encodeURIComponent('Sagbayan, Bohol, Philippines');
    const isApple = /iPad|iPhone|iPod|Macintosh/.test(navigator.userAgent || '');
    const url = isApple
      ? 'https://maps.apple.com/?q=' + query
      : 'https://www.google.com/maps/search/?api=1&query=' + query;
    window.open(url, '_blank', 'noopener');
  }

  // Theme toggle (session only — no persistent storage)
  const root = document.documentElement;
  document.getElementById('theme-toggle').addEventListener('click', () => {
    const isDark = root.getAttribute('data-theme') === 'dark';
    root.setAttribute('data-theme', isDark ? 'light' : 'dark');
  });
  // Respect the visitor's OS preference on first load
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches){
    root.setAttribute('data-theme','dark');
  }

  // Hero photo — click/tap to view large
  const photoTrigger = document.getElementById('hero-photo-trigger');
  if (photoTrigger){
    const photoModal = document.getElementById('photo-modal');
    const openPhotoModal = () => photoModal.classList.add('open');
    photoTrigger.addEventListener('click', openPhotoModal);
    photoTrigger.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' '){ e.preventDefault(); openPhotoModal(); }
    });
    document.getElementById('photo-modal-close').addEventListener('click', () => photoModal.classList.remove('open'));
  }

  // Generalized close behavior for any .modal-overlay — click backdrop or press Escape
  document.querySelectorAll('.modal-overlay').forEach(ov => {
    ov.addEventListener('click', e => { if (e.target === ov) ov.classList.remove('open'); });
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') document.querySelectorAll('.modal-overlay.open').forEach(ov => ov.classList.remove('open'));
  });

  // Project modal
  const icons = {
    chip: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="6" y="6" width="12" height="12" rx="1.5"/><path d="M9 2v3M15 2v3M9 19v3M15 19v3M2 9h3M2 15h3M19 9h3M19 15h3"/></svg>',
    calendar: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>',
    default: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 15l4.5-4.5a2 2 0 0 1 2.8 0L15 15M13 13l1.5-1.5a2 2 0 0 1 2.8 0L21 15"/><circle cx="8" cy="8" r="1.5"/></svg>'
  };
  const modal = document.getElementById('proj-modal');
  const modalThumb = document.getElementById('modal-thumb');
  const modalMeta = document.getElementById('modal-meta');
  const modalTitle = document.getElementById('modal-title');
  const modalDesc = document.getElementById('modal-desc');
  const modalBadge = document.getElementById('modal-badge');
  const modalLink = document.getElementById('modal-link');

  // Build a row of tag pills from a comma-separated data-tags string.
  // Returns a <div class="proj-tags"> containing <span class="tag-pill"> children —
  // meant to sit in the text content of a card/modal, never on top of an image.
  function buildTagPills(tagsStr){
    const wrap = document.createElement('div');
    wrap.className = 'proj-tags';
    tagsStr.split(',').forEach(t => {
      const label = t.trim();
      if (!label) return;
      const pill = document.createElement('span');
      pill.className = 'tag-pill';
      pill.textContent = label;
      wrap.appendChild(pill);
    });
    return wrap;
  }

  function openProjectModal(card){
    const img = card.dataset.img;
    modalThumb.innerHTML = img
      ? '<img src="'+img+'" alt="'+card.dataset.title+' screenshot" style="width:100%;height:100%;object-fit:cover;border-radius:18px 18px 0 0;">'
      : (icons[card.dataset.icon] || icons.default);

    modalMeta.textContent = card.dataset.meta || '';
    modalTitle.textContent = card.dataset.title || '';
    modalDesc.textContent = card.dataset.desc || '';
    if (card.dataset.badge){ modalBadge.textContent = card.dataset.badge; modalBadge.style.display = 'inline-block'; }
    else { modalBadge.style.display = 'none'; }

    // Remove any tag pills left over from a previously opened project, then
    // add this project's tags as a row directly above the "Visit project" link
    const existingTags = modal.querySelector('.modal-content .proj-tags');
    if (existingTags) existingTags.remove();
    if (card.dataset.tags){
      modalLink.parentNode.insertBefore(buildTagPills(card.dataset.tags), modalLink);
    }

    if (card.dataset.link){
      modalLink.innerHTML = '<a class="btn primary" href="'+card.dataset.link+'" target="_blank" rel="noopener">Visit project ↗</a>';
    } else {
      modalLink.innerHTML = '';
    }
    modal.classList.add('open');
  }
  document.querySelectorAll('.proj-card:not(.empty)').forEach(card => {
    card.addEventListener('click', () => openProjectModal(card));

    // Build tag pills from data-tags="Backend,Laravel,MySQL" and place them
    // above the "View details" row inside the card body — never on the thumbnail.
    if (card.dataset.tags){
      const body = card.querySelector('.proj-body');
      const foot = body ? body.querySelector('.proj-foot') : null;
      if (body && foot && !body.querySelector('.proj-tags')){
        body.insertBefore(buildTagPills(card.dataset.tags), foot);
      }
    }

    // Show a direct "Visit site" button on the card face whenever a live link is set
    if (card.dataset.link){
      const foot = card.querySelector('.proj-foot');
      if (foot && !foot.querySelector('.ext-link')){
        const a = document.createElement('a');
        a.className = 'ext-link';
        a.href = card.dataset.link;
        a.target = '_blank';
        a.rel = 'noopener';
        a.innerHTML = 'Visit site <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M7 17 17 7M7 7h10v10"/></svg>';
        a.addEventListener('click', e => e.stopPropagation());
        foot.appendChild(a);
      }
    }
  });
  document.getElementById('modal-close').addEventListener('click', () => modal.classList.remove('open'));
  modal.addEventListener('click', e => { if (e.target === modal) modal.classList.remove('open'); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') modal.classList.remove('open'); });

  // reCAPTCHA gate for the contact form's "Send via email" button.
  // The button starts disabled (see .btn.disabled in CSS); solving the
  // widget enables it, letting it expire re-disables it, and checkRobot
  // is the last-line guard on the click itself in case the class state
  // and the widget's real status ever drift apart.
  function onRecaptchaSuccess(){
    const sendBtn = document.getElementById('sendBtn');
    if (sendBtn) sendBtn.classList.remove('disabled');
  }
  function onRecaptchaExpired(){
    const sendBtn = document.getElementById('sendBtn');
    if (sendBtn) sendBtn.classList.add('disabled');
  }
  function checkRobot(e){
    const sendBtn = document.getElementById('sendBtn');
    if (sendBtn && sendBtn.classList.contains('disabled')){
      e.preventDefault();
      return false;
    }
    return true;
  }

  // Chatbot — simple rule-based FAQ, fully client-side
  const kb = [
    { keys: ['skill','tech','stack','know','programming'],
      a: "Pablito works with C, C++, Java, C#, Python, and JavaScript, plus HTML/CSS, IoT & embedded systems, and software/systems fundamentals." },
    { keys: ['project','built','made','portfolio'],
      a: "Two flagship projects so far: KlasEco (an IoT smart classroom system, 2nd Place at Create@UB 2026) and HapsayHub (an event management system built during OJT). More are on the way — check the Projects tab." },
    { keys: ['certificat','training','seminar','course'],
      a: "Quite a few — recent ones include AI-focused trainings with Cisco, DICT, and the ASEAN Foundation, plus JavaScript, PHP/MySQL, and Power BI courses. Full list is in the Certifications tab." },
    { keys: ['contact','email','phone','reach'],
      a: "You can reach Pablito at canonero4821@gmail.com or +63 952 480 8855." },
    { keys: ['available','hire','work','open','job'],
      a: "Yes — Pablito is currently open to work, especially customer support and tech-adjacent roles." },
    { keys: ['resume','cv'],
      a: "You can download the full resume in the Resume tab." },
    { keys: ['education','school','degree','university'],
      a: "Pablito holds a BS in Computer Engineering from the University of Bohol (2026)." },
    { keys: ['location','based','where','live'],
      a: "Pablito is based in Sagbayan, Bohol, Philippines." },
    { keys: ['service','offer','help with'],
      a: "Technical & customer support, web/software development, and IoT & embedded prototyping." }
  ];
  const fallback = "I don't have an answer for that yet — try asking about skills, projects, certifications, or contact info, or reach Pablito directly at canonero4821@gmail.com.";

  function reply(text){
    const lower = text.toLowerCase();
    const hit = kb.find(row => row.keys.some(k => lower.includes(k)));
    return hit ? hit.a : fallback;
  }
  const chatBody = document.getElementById('chat-body');
  function addBubble(text, who){
    const b = document.createElement('div');
    b.className = 'bubble ' + who;
    b.textContent = text;
    chatBody.appendChild(b);
    chatBody.scrollTop = chatBody.scrollHeight;
  }
  addBubble("Hi! I'm a quick assistant for Pablito's portfolio. Ask me about his skills, projects, certifications, or how to get in touch.", 'bot');

  document.getElementById('chat-fab').addEventListener('click', () => {
    document.getElementById('chat-panel').classList.toggle('open');
  });
  document.getElementById('chat-send').addEventListener('click', sendMsg);
  document.getElementById('chat-input').addEventListener('keydown', e => { if (e.key === 'Enter') sendMsg(); });
  function sendMsg(){
    const input = document.getElementById('chat-input');
    const val = input.value.trim();
    if(!val) return;
    addBubble(val, 'user');
    input.value = '';
    setTimeout(() => addBubble(reply(val), 'bot'), 350);
  }
  // Stagger the fade-up entrance of repeated content within each ticket
  document.querySelectorAll('.grid3, .timeline, .cert-list, .proj-grid, .skill-groups .tag-row, .contact-grid, .msg-form').forEach(container => {
    Array.from(container.children).forEach((el, i) => {
      el.style.animationDelay = (i * 0.07) + 's';
    });
  });
  document.querySelectorAll('.hero-text').forEach(container => {
    Array.from(container.children).forEach((el, i) => {
      el.style.animationDelay = (i * 0.09 + 0.05) + 's';
    });
  });

  document.querySelectorAll('.chip').forEach(chip => {
    chip.addEventListener('click', () => {
      document.getElementById('chat-panel').classList.add('open');
      addBubble(chip.textContent, 'user');
      setTimeout(() => addBubble(reply(chip.dataset.q), 'bot'), 300);
    });
  });