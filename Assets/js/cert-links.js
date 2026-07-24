pdfjsLib.GlobalWorkerOptions.workerSrc =
  'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

function initCertLinks() {
  const overlay = document.getElementById('pdfModalOverlay');
  const closeBtn = document.getElementById('pdfModalClose');
  const canvasWrap = document.getElementById('pdfCanvasWrap');
  const watermarkLayer = document.getElementById('pdfWatermarkLayer');

  let isClosing = false;

  function watermarkText() {
    const now = new Date();
    const timestamp = now.toLocaleString('en-PH', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
    return `VIEW ONLY — ${timestamp}`;
  }

  function buildDomWatermark() {
    watermarkLayer.innerHTML = '';
    const label = watermarkText();
    for (let i = 0; i < 18; i++) {
      const tile = document.createElement('span');
      tile.textContent = label;
      watermarkLayer.appendChild(tile);
    }
  }

  // Shown in the canvas area while the PDF document/page is loading
  function showLoadingSpinner() {
    canvasWrap.innerHTML =
      '<div class="pdf-loading"><div class="pdf-loading-spinner"></div><span>Loading certificate…</span></div>';
  }

  // Draws the watermark directly onto the canvas pixels, so it's baked
  // into the image itself, not just an overlay that could be cropped out.
  function stampCanvasWatermark(ctx, width, height, label) {
    ctx.save();
    ctx.globalAlpha = 0.14;
    ctx.fillStyle = '#dc1e1e';
    ctx.font = 'bold 20px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const stepX = width / 2.2;
    const stepY = height / 6;

    for (let y = stepY / 2; y < height; y += stepY) {
      for (let x = stepX / 2; x < width; x += stepX) {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(-Math.PI / 7);
        ctx.fillText(label, 0, 0);
        ctx.restore();
      }
    }
    ctx.restore();
  }

  async function renderPdf(pdfPath) {
    const label = watermarkText();
    showLoadingSpinner();

    try {
      const loadingTask = pdfjsLib.getDocument(pdfPath);
      const pdf = await loadingTask.promise;

      // Clear the spinner right before the first page lands
      canvasWrap.innerHTML = '';

      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const viewport = page.getViewport({ scale: 1.6 });

        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext('2d');

        await page.render({ canvasContext: ctx, viewport: viewport }).promise;

        // Bake the watermark into the rendered page itself
        stampCanvasWatermark(ctx, canvas.width, canvas.height, label);

        // Stagger each page's entrance animation so multi-page
        // certificates cascade in rather than popping simultaneously
        canvas.style.animationDelay = `${(pageNum - 1) * 90}ms`;

        canvasWrap.appendChild(canvas);
      }
    } catch (err) {
      canvasWrap.innerHTML =
        '<p style="color:#eee;padding:24px;text-align:center;">Unable to load certificate.</p>';
      console.error('PDF render error:', err);
    }
  }

  function openPdf(pdfPath) {
    isClosing = false;
    overlay.classList.remove('closing');
    buildDomWatermark();
    renderPdf(pdfPath);
    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closePdf() {
    if (isClosing || !overlay.classList.contains('active')) return;
    isClosing = true;
    overlay.classList.add('closing');

    const finish = () => {
      overlay.classList.remove('active', 'closing');
      canvasWrap.innerHTML = '';
      watermarkLayer.innerHTML = '';
      document.body.style.overflow = '';
      isClosing = false;
    };

    // Matches the pdfModalFallOut / pdfOverlayFadeOut duration (180ms)
    setTimeout(finish, 190);
  }

  // ---------------------------------------------------------
  // Mark a row as missing its PDF: red highlight, disabled btn
  // ---------------------------------------------------------
  function markRowMissing(row) {
    row.classList.add('cert-missing-pdf');
    const btn = row.querySelector('.view-btn');
    if (btn) {
      btn.disabled = true;
      btn.textContent = 'No PDF';
    }
  }

  // ---------------------------------------------------------
  // Checks every cert row's actual file on the server (HEAD
  // request) and flags rows whose PDF doesn't really exist,
  // even if the data-pdf attribute looks valid.
  // ---------------------------------------------------------
  async function checkCertFiles() {
    const rows = document.querySelectorAll('.cert-row');

    const checks = Array.from(rows).map(async function (row) {
      const pdfPath = row.getAttribute('data-pdf');

      // No path at all, or doesn't look like a pdf -> missing immediately
      if (!pdfPath || !pdfPath.trim().toLowerCase().endsWith('.pdf')) {
        markRowMissing(row);
        return;
      }

      try {
        const res = await fetch(pdfPath, { method: 'HEAD', cache: 'no-store' });
        if (!res.ok) {
          markRowMissing(row);
        }
      } catch (err) {
        // Network error / file not found
        markRowMissing(row);
      }
    });

    await Promise.all(checks);
  }

  // Run the file-existence check, then wire up click handlers
  // only for rows that actually resolved to a real PDF.
  checkCertFiles().then(function () {
    document.querySelectorAll('.cert-row[data-pdf]').forEach(function (row) {
      if (row.classList.contains('cert-missing-pdf')) return;

      const btn = row.querySelector('.view-btn');
      const pdfPath = row.getAttribute('data-pdf');

      if (btn && pdfPath) {
        btn.addEventListener('click', function (e) {
          e.stopPropagation();

          // Immediate visual feedback right on click
          btn.classList.add('is-loading');
          openPdf(pdfPath);

          // Clear the button's spinner once the modal has visibly opened
          setTimeout(() => btn.classList.remove('is-loading'), 400);
        });
      }
    });
  });

  closeBtn.addEventListener('click', closePdf);
  overlay.addEventListener('click', function (e) {
    if (e.target === overlay) closePdf();
  });

  document.addEventListener('contextmenu', function (e) {
    if (overlay.classList.contains('active')) e.preventDefault();
  });

  overlay.addEventListener('dragstart', function (e) {
    e.preventDefault();
  });

  overlay.addEventListener('selectstart', function (e) {
    e.preventDefault();
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && overlay.classList.contains('active')) {
      closePdf();
      return;
    }

    if (!overlay.classList.contains('active')) return;

    const key = e.key.toLowerCase();
    const ctrlOrCmd = e.ctrlKey || e.metaKey;

    const blockedCombo =
      (ctrlOrCmd && (key === 's' || key === 'p' || key === 'u')) ||
      (ctrlOrCmd && e.shiftKey && key === 'i') ||
      key === 'f12';

    if (blockedCombo) {
      e.preventDefault();
    }
  });
}

document.addEventListener('DOMContentLoaded', initCertLinks);

// ============================= //
// Certificate Search & Filter   //
// ============================= //

function initCertSearchFilter() {
  const searchInput = document.getElementById('certSearch');
  const clearBtn = document.getElementById('certSearchClear');
  const pills = document.querySelectorAll('.cert-pill');
  const countText = document.getElementById('certCountText');
  const emptyState = document.getElementById('certEmptyState');
  const yearSections = document.querySelectorAll('.cert-year');
  const totalCount = document.querySelectorAll('.cert-row').length;

  if (!searchInput) return;

  let activeYear = 'all';
  let query = '';

  function applyFilters() {
    let visibleCount = 0;

    yearSections.forEach(function (section) {
      const sectionYear = section.getAttribute('data-year');
      const yearMatches = activeYear === 'all' || sectionYear === activeYear;
      let sectionHasVisibleRow = false;

      section.querySelectorAll('.cert-row').forEach(function (row) {
        const text = row.textContent.toLowerCase();
        const textMatches = query === '' || text.includes(query);
        const show = yearMatches && textMatches;
        row.style.display = show ? '' : 'none';
        if (show) {
          sectionHasVisibleRow = true;
          visibleCount++;
        }
      });

      section.style.display = sectionHasVisibleRow ? '' : 'none';
    });

    countText.textContent = (query || activeYear !== 'all')
      ? 'Showing ' + visibleCount + ' of ' + totalCount + ' certificates'
      : 'Showing all ' + totalCount + ' certificates';

    emptyState.style.display = visibleCount === 0 ? 'block' : 'none';
    clearBtn.style.display = query ? 'flex' : 'none';
  }

  searchInput.addEventListener('input', function () {
    query = searchInput.value.trim().toLowerCase();
    applyFilters();
  });

  clearBtn.addEventListener('click', function () {
    searchInput.value = '';
    query = '';
    applyFilters();
    searchInput.focus();
  });

  pills.forEach(function (pill) {
    pill.addEventListener('click', function () {
      pills.forEach(function (p) { p.classList.remove('active'); });
      pill.classList.add('active');
      activeYear = pill.getAttribute('data-year');
      applyFilters();
    });
  });

  applyFilters();
}

document.addEventListener('DOMContentLoaded', initCertSearchFilter);

// ============================= //
// Scroll to Top (Certifications) //
// ============================= //

function initCertScrollTopButton() {
  const section = document.getElementById('certifications');
  const btn = document.getElementById('certScrollTopBtn');
  if (!section || !btn) return;

  const SHOW_AFTER_PX = 260;

  function isPastThreshold() {
    const rect = section.getBoundingClientRect();
    // How far we've scrolled into the section from its top
    const scrolledIntoSection = -rect.top;
    // Only show while the section itself is still on screen
    const sectionStillVisible = rect.bottom > 0;
    return scrolledIntoSection > SHOW_AFTER_PX && sectionStillVisible;
  }

  let ticking = false;
  function updateVisibility() {
    btn.classList.toggle('visible', isPastThreshold());
    ticking = false;
  }

  window.addEventListener('scroll', function () {
    if (!ticking) {
      window.requestAnimationFrame(updateVisibility);
      ticking = true;
    }
  }, { passive: true });

  updateVisibility();

  btn.addEventListener('click', function () {
    section.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
}

document.addEventListener('DOMContentLoaded', initCertScrollTopButton);