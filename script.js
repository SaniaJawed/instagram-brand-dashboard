'use strict';

/* ============================================================
   PREMIUM SCRIPT — Loader, Charts, Animations, Interactions
   ============================================================ */


/* ── 1. LOADER ───────────────────────────────────────────── */

window.addEventListener('load', () => {
  setTimeout(() => {
    const loader = document.getElementById('loader');
    if (loader) loader.classList.add('hidden');
    // Kick off KPI counters after loader fades
    setTimeout(initKPICounters, 800);
  }, 1600);
});


/* ── 2. SIDEBAR SCROLL TRACKING ──────────────────────────── */

const navItems = document.querySelectorAll('.journey-nav__item');
const sections = document.querySelectorAll('section[id]');

function setActiveNav(id) {
  navItems.forEach(item =>
    item.classList.toggle('active', item.dataset.section === id)
  );
}

navItems.forEach(item => {
  item.addEventListener('click', () => {
    const t = document.getElementById(item.dataset.section);
    if (t) t.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
});

const scrollObs = new IntersectionObserver(entries => {
  entries.forEach(e => { if (e.isIntersecting) setActiveNav(e.target.id); });
}, { rootMargin: '-30% 0px -60% 0px', threshold: 0 });

sections.forEach(s => scrollObs.observe(s));


/* ── 3. SCROLL REVEAL ─────────────────────────────────────── */

function initScrollReveal() {
  const revealEls = document.querySelectorAll('.section, .content-card');

  const revealObs = new IntersectionObserver(entries => {
    entries.forEach((entry, i) => {
      if (entry.isIntersecting) {
        // Stagger cards within the same section
        const delay = entry.target.classList.contains('content-card') ? i * 60 : 0;
        setTimeout(() => entry.target.classList.add('visible'), delay);
        revealObs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });

  revealEls.forEach(el => revealObs.observe(el));
}


/* ── 4. KPI COUNTER ANIMATION ────────────────────────────── */

function animateCount(el, target, prefix, suffix, duration) {
  const start    = performance.now();
  const isFloat  = target % 1 !== 0;

  function update(now) {
    const elapsed  = now - start;
    const progress = Math.min(elapsed / duration, 1);
    // Ease out cubic
    const eased    = 1 - Math.pow(1 - progress, 3);
    const current  = eased * target;
    el.textContent = (prefix || '') + (isFloat ? current.toFixed(1) : Math.floor(current)) + (suffix || '');
    if (progress < 1) requestAnimationFrame(update);
  }

  requestAnimationFrame(update);
}

function initKPICounters() {
  document.querySelectorAll('.kpi-card__value[data-count]').forEach(el => {
    const target = parseFloat(el.dataset.count);
    const prefix = el.dataset.prefix || '';
    const suffix = el.dataset.suffix || '';
    animateCount(el, target, prefix, suffix, 1800);
  });
}


/* ── 5. TILT / PARALLAX ON CARDS ─────────────────────────── */

function initTilt() {
  document.querySelectorAll('.tilt').forEach(card => {
    card.addEventListener('mousemove', e => {
      const rect   = card.getBoundingClientRect();
      const cx     = rect.left + rect.width  / 2;
      const cy     = rect.top  + rect.height / 2;
      const dx     = (e.clientX - cx) / (rect.width  / 2);
      const dy     = (e.clientY - cy) / (rect.height / 2);
      const tiltX  = dy * -4;   // max 4deg
      const tiltY  = dx *  4;
      card.style.transform = `perspective(900px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) translateZ(4px)`;
    });

    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
    });
  });
}


/* ── 6. BUTTON RIPPLE ────────────────────────────────────── */

function initRipple() {
  document.querySelectorAll('.btn').forEach(btn => {
    btn.addEventListener('click', e => {
      const rect   = btn.getBoundingClientRect();
      const size   = Math.max(rect.width, rect.height);
      const ripple = document.createElement('span');
      ripple.classList.add('ripple');
      ripple.style.cssText = `
        width:${size}px; height:${size}px;
        left:${e.clientX - rect.left - size/2}px;
        top:${e.clientY - rect.top  - size/2}px;
      `;
      btn.appendChild(ripple);
      setTimeout(() => ripple.remove(), 600);
    });
  });
}


/* ── 7. MYTHS TOGGLE ─────────────────────────────────────── */

function initMyths() {
  document.querySelectorAll('.myth-card').forEach(card => {
    const btn     = card.querySelector('.myth-card__toggle');
    const reality = card.querySelector('.myth-card__reality');
    if (!btn || !reality) return;

    btn.addEventListener('click', () => {
      const isOpen = reality.classList.toggle('open');
      btn.textContent = isOpen ? 'Hide' : 'Reveal reality';
      btn.setAttribute('aria-expanded', String(isOpen));
    });
  });
}


/* ── 8. CHART HELPERS ────────────────────────────────────── */

Chart.defaults.font.family = "'Inter', sans-serif";
Chart.defaults.font.size   = 12;
Chart.defaults.color       = '#8A8790';

const C = {
  orange : '#F5A623',
  green  : '#2ECC71',
  blue   : '#3B82F6',
  purple : '#8B5CF6',
  grid   : 'rgba(255,255,255,0.05)',
  text   : '#8A8790',
};

function scales(yLabel = '') {
  return {
    x: { grid: { color: C.grid, drawBorder: false }, ticks: { color: C.text } },
    y: {
      grid: { color: C.grid, drawBorder: false }, ticks: { color: C.text },
      title: { display: !!yLabel, text: yLabel, color: C.text },
      beginAtZero: true,
    }
  };
}

function makCanvas(id) {
  const ph = document.getElementById(id);
  if (!ph) return null;
  const c = document.createElement('canvas');
  ph.replaceWith(c);
  return c;
}

// Chart animate-on-scroll observer
const chartObserver = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting && e.target._chart) {
      e.target._chart.update('active');
      chartObserver.unobserve(e.target);
    }
  });
}, { threshold: 0.2 });


/* ── 9. FETCH + DRAW CHARTS ──────────────────────────────── */

async function loadAndDraw() {
  let data;
  try {
    const res = await fetch('data/brand.json');
    data = await res.json();
  } catch (err) {
    console.error('brand.json load failed:', err);
    return;
  }
  drawContentChart(data);
  drawEngagementChart(data);
  drawRevenueMixChart(data);
  drawGrowthChart(data);
}

function drawContentChart(data) {
  const canvas = makCanvas('chart-stage1');
  if (!canvas) return;
  canvas.style.height = '220px';
  const { types, reach, saves, converts } = data.contentPerformance;
  const chart = new Chart(canvas, {
    type: 'bar',
    data: {
      labels: types,
      datasets: [
        { label: 'Reach',    data: reach,    backgroundColor: C.blue   + '99', borderColor: C.blue,   borderWidth: 1, borderRadius: 4 },
        { label: 'Saves',    data: saves,    backgroundColor: C.orange + '99', borderColor: C.orange, borderWidth: 1, borderRadius: 4 },
        { label: 'Converts', data: converts, backgroundColor: C.green  + '99', borderColor: C.green,  borderWidth: 1, borderRadius: 4 },
      ]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      animation: { duration: 1200, easing: 'easeOutQuart' },
      plugins: {
        legend: { display: true, position: 'top', labels: { color: C.text, boxWidth: 12, padding: 12 } },
        tooltip: { callbacks: { label: ctx => ` ${ctx.dataset.label}: ${ctx.parsed.y}/100` } }
      },
      scales: scales('Score /100'),
    }
  });
  canvas._chart = chart;
  chartObserver.observe(canvas);
}

function drawEngagementChart(data) {
  const canvas = makCanvas('chart-engagement');
  if (!canvas) return;
  canvas.style.height = '220px';
  const { followerRanges, avgEngagement, goodEngagement } = data.engagementBenchmarks;
  const chart = new Chart(canvas, {
    type: 'line',
    data: {
      labels: followerRanges,
      datasets: [
        {
          label: 'Average engagement %', data: avgEngagement,
          borderColor: C.orange, backgroundColor: C.orange + '22',
          borderWidth: 2.5, pointBackgroundColor: C.orange, pointRadius: 5,
          tension: 0.35, fill: true,
        },
        {
          label: 'Minimum "good" %', data: goodEngagement,
          borderColor: 'rgba(255,255,255,0.15)', borderWidth: 1.5,
          borderDash: [5, 5], pointRadius: 3, tension: 0.35, fill: false,
        },
      ]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      animation: { duration: 1400, easing: 'easeOutCubic' },
      plugins: {
        legend: { display: true, position: 'top', labels: { color: C.text, boxWidth: 12, padding: 12 } },
        tooltip: { callbacks: { label: ctx => ` ${ctx.dataset.label}: ${ctx.parsed.y}%` } }
      },
      scales: scales('Engagement rate (%)'),
    }
  });
  canvas._chart = chart;
  chartObserver.observe(canvas);
}

function drawRevenueMixChart(data) {
  const canvas = makCanvas('chart-revenue-mix');
  if (!canvas) return;
  canvas.style.height = '220px';
  const { sources, percentage } = data.revenueMix;
  const chart = new Chart(canvas, {
    type: 'doughnut',
    data: {
      labels: sources,
      datasets: [{
        data: percentage,
        backgroundColor: [C.orange, C.blue, C.green, C.purple],
        borderColor: '#0A0A0B', borderWidth: 3, hoverOffset: 8,
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      cutout: '65%',
      animation: { duration: 1200, animateRotate: true, animateScale: true },
      plugins: {
        legend: {
          display: true, position: 'right',
          labels: { color: C.text, boxWidth: 12, padding: 14, font: { size: 12 } }
        },
        tooltip: { callbacks: { label: ctx => ` ${ctx.label}: ${ctx.parsed}%` } }
      },
    }
  });
  canvas._chart = chart;
  chartObserver.observe(canvas);
}

function drawGrowthChart(data) {
  const canvas = makCanvas('chart-growth');
  if (!canvas) return;
  canvas.style.height = '260px';
  const { labels, followers, revenue } = data.followerGrowth;
  const revenueK = revenue.map(r => Math.round(r / 1000));
  const chart = new Chart(canvas, {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: 'Followers', data: followers, yAxisID: 'y',
          borderColor: C.blue, backgroundColor: C.blue + '22',
          borderWidth: 2.5, pointBackgroundColor: C.blue, pointRadius: 4,
          tension: 0.4, fill: true,
        },
        {
          label: 'Revenue (₹ thousands)', data: revenueK, yAxisID: 'y2',
          borderColor: C.orange, backgroundColor: C.orange + '11',
          borderWidth: 2.5, pointBackgroundColor: C.orange, pointRadius: 4,
          tension: 0.4, fill: true,
        },
      ]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      animation: { duration: 1600, easing: 'easeOutQuart' },
      plugins: {
        legend: { display: true, position: 'top', labels: { color: C.text, boxWidth: 12, padding: 12 } },
        tooltip: {
          callbacks: {
            label: ctx => ctx.datasetIndex === 0
              ? ` Followers: ${ctx.parsed.y.toLocaleString('en-IN')}`
              : ` Revenue: ₹${ctx.parsed.y}K`
          }
        }
      },
      scales: {
        x: { grid: { color: C.grid, drawBorder: false }, ticks: { color: C.text, maxRotation: 45 } },
        y: {
          position: 'left', grid: { color: C.grid, drawBorder: false },
          ticks: { color: C.blue }, title: { display: true, text: 'Followers', color: C.blue },
          beginAtZero: true,
        },
        y2: {
          position: 'right', grid: { drawOnChartArea: false },
          ticks: { color: C.orange, callback: v => '₹' + v + 'K' },
          title: { display: true, text: 'Revenue', color: C.orange },
          beginAtZero: true,
        },
      }
    }
  });
  canvas._chart = chart;
  chartObserver.observe(canvas);
}


/* ── 10. CALCULATOR ──────────────────────────────────────── */

function initCalculator() {
  const btn    = document.getElementById('calc-btn');
  const result = document.getElementById('calc-result');
  if (!btn) return;

  btn.addEventListener('click', () => {
    const followers  = parseInt(document.getElementById('calc-followers').value, 10);
    const engagement = parseFloat(document.getElementById('calc-engagement').value);
    const niche      = document.getElementById('calc-niche').value;

    if (!followers || !engagement || !niche) {
      result.innerHTML = '<p style="color:#E74C3C;font-size:14px;">Please fill in all three fields.</p>';
      result.classList.remove('has-result');
      return;
    }

    const multiplier = { finance:2.2, tech:1.9, education:1.6, fitness:1.5, fashion:1.2, food:1.0 }[niche] || 1;
    const deal       = Math.round((followers / 1000) * engagement * 800 * multiplier);
    const monthly    = Math.round(deal * 2.5);
    const annual     = Math.round(monthly * 12);

    result.classList.add('has-result');
    result.innerHTML = `
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:16px;width:100%">
        <div>
          <p style="font-size:11px;color:var(--color-text-muted);text-transform:uppercase;letter-spacing:.08em;margin-bottom:4px">Per brand deal</p>
          <p style="font-family:'Space Grotesk',sans-serif;font-size:22px;font-weight:700;color:var(--color-accent)">₹${deal.toLocaleString('en-IN')}</p>
        </div>
        <div>
          <p style="font-size:11px;color:var(--color-text-muted);text-transform:uppercase;letter-spacing:.08em;margin-bottom:4px">Monthly potential</p>
          <p style="font-family:'Space Grotesk',sans-serif;font-size:22px;font-weight:700;color:var(--color-accent)">₹${monthly.toLocaleString('en-IN')}</p>
        </div>
        <div>
          <p style="font-size:11px;color:var(--color-text-muted);text-transform:uppercase;letter-spacing:.08em;margin-bottom:4px">Annual potential</p>
          <p style="font-family:'Space Grotesk',sans-serif;font-size:22px;font-weight:700;color:var(--color-accent)">₹${annual.toLocaleString('en-IN')}</p>
        </div>
      </div>`;
  });
}


/* ── 11. INIT ALL ────────────────────────────────────────── */

initScrollReveal();
initTilt();
initRipple();
initMyths();
initCalculator();
loadAndDraw();
