// utils/report-html-template.ts
// Generates a self-contained HTML string for the monthly PDF report.
// The HTML includes inline CSS, SVG charts, and all data — no external deps.
//
// Layout: 5 pages (4 for baseline month) — hero, patterns, fasting analysis,
// progress + behaviour (month 2+), next month plan.

import type { MonthlyReportData } from '@/utils/monthly-report';

/** Inline mandala mark for PDF headers (matches assets/brand/logo-mark-mono-dark.svg) */
const REPORT_HEADER_MARK_SVG = `<svg width="44" height="44" viewBox="0 0 96 96" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><g transform="translate(48,48)"><circle cx="0" cy="0" r="44" fill="none" stroke="#c8872a" stroke-width="1" stroke-opacity="0.35"/><path d="M0,-36 C-10,-24 -10,-14 0,-11 C10,-14 10,-24 0,-36Z" fill="none" stroke="#c8872a" stroke-width="1.6" stroke-opacity="0.75" stroke-linejoin="round"/><path d="M0,-36 C-10,-24 -10,-14 0,-11 C10,-14 10,-24 0,-36Z" fill="none" stroke="#c8872a" stroke-width="1.6" stroke-opacity="0.75" stroke-linejoin="round" transform="rotate(45)"/><path d="M0,-36 C-10,-24 -10,-14 0,-11 C10,-14 10,-24 0,-36Z" fill="none" stroke="#c8872a" stroke-width="1.6" stroke-opacity="0.75" stroke-linejoin="round" transform="rotate(90)"/><path d="M0,-36 C-10,-24 -10,-14 0,-11 C10,-14 10,-24 0,-36Z" fill="none" stroke="#c8872a" stroke-width="1.6" stroke-opacity="0.75" stroke-linejoin="round" transform="rotate(135)"/><path d="M0,-36 C-10,-24 -10,-14 0,-11 C10,-14 10,-24 0,-36Z" fill="none" stroke="#c8872a" stroke-width="1.6" stroke-opacity="0.75" stroke-linejoin="round" transform="rotate(180)"/><path d="M0,-36 C-10,-24 -10,-14 0,-11 C10,-14 10,-24 0,-36Z" fill="none" stroke="#c8872a" stroke-width="1.6" stroke-opacity="0.75" stroke-linejoin="round" transform="rotate(225)"/><path d="M0,-36 C-10,-24 -10,-14 0,-11 C10,-14 10,-24 0,-36Z" fill="none" stroke="#c8872a" stroke-width="1.6" stroke-opacity="0.75" stroke-linejoin="round" transform="rotate(270)"/><path d="M0,-36 C-10,-24 -10,-14 0,-11 C10,-14 10,-24 0,-36Z" fill="none" stroke="#c8872a" stroke-width="1.6" stroke-opacity="0.75" stroke-linejoin="round" transform="rotate(315)"/><polygon points="0,-6 4.3,0 0,6 -4.3,0" fill="#c8872a"/></g></svg>`;

function reportPageHeader(monthTitle: string, subMeta: string): string {
  return `
  <div class="header">
    <div class="brand-row">
      <span class="brand-mark">${REPORT_HEADER_MARK_SVG}</span>
      <div class="brand-text-col">
        <div class="brand-word">Aayu</div>
        <div class="brand-tag">Intermittent fasting</div>
      </div>
    </div>
    <div class="month-title">${monthTitle}</div>
    <div class="sub-meta">${subMeta}</div>
  </div>`;
}

function pageFooter(page: number, totalPages: number): string {
  return `<div class="page-num">Page ${page} of ${totalPages}</div>`;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function delta(current: number, previous: number | null | undefined, unit: string = '', decimals: number = 1): string {
  if (previous == null) return '';
  const diff = current - previous;
  if (Math.abs(diff) < 0.05) return '';
  const sign = diff > 0 ? '+' : '';
  return `<span class="delta ${diff > 0 ? 'up' : 'down'}">${sign}${diff.toFixed(decimals)}${unit}</span>`;
}

function weightDelta(current: number | null, previous: number | null): string {
  if (current == null || previous == null) return '';
  const diff = previous - current;
  if (Math.abs(diff) < 0.05) return '';
  const sign = diff > 0 ? '-' : '+';
  return `<span class="delta ${diff > 0 ? 'down' : 'up'}">${sign}${Math.abs(diff).toFixed(1)}kg</span>`;
}

function scoreRingSVG(score: number, size: number = 96): string {
  const stroke = 6;
  const r = (size - stroke) / 2;
  const circumf = 2 * Math.PI * r;
  const fill = circumf * (score / 100);
  const color = score >= 85 ? '#5B8C5A' : score >= 70 ? '#e8a84c' : score >= 50 ? '#E8913A' : '#B8A898';

  return `
    <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
      <circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="#2a1a0a" stroke-width="${stroke}" />
      <circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="${color}" stroke-width="${stroke}"
        stroke-linecap="round" stroke-dasharray="${fill} ${circumf}"
        transform="rotate(-90 ${size / 2} ${size / 2})" />
      <text x="${size / 2}" y="${size / 2 + 7}" text-anchor="middle" fill="${color}"
        font-size="26" font-weight="800" font-family="system-ui">${score}</text>
    </svg>
  `;
}

function heatmapSVG(dailyHeatmap: MonthlyReportData['dailyHeatmap']): string {
  const cols = 7;
  const cellSize = 18;
  const gap = 3;
  const rows = Math.ceil(dailyHeatmap.length / cols);

  let cells = '';
  dailyHeatmap.forEach((day, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const x = col * (cellSize + gap);
    const y = row * (cellSize + gap);

    const intensity = day.fasted
      ? (day.hours >= 16 ? '#5B8C5A' : day.hours >= 12 ? '#7AAE79' : '#a0c89f')
      : '#1c1009';
    const border = day.fasted ? 'none' : '#2a1a0a';

    cells += `<rect x="${x}" y="${y}" width="${cellSize}" height="${cellSize}" rx="3"
      fill="${intensity}" stroke="${border}" stroke-width="${day.fasted ? 0 : 1}" />`;

    cells += `<text x="${x + cellSize / 2}" y="${y + cellSize / 2 + 4}" text-anchor="middle"
      fill="${day.fasted ? '#fff' : '#4a3020'}" font-size="8" font-family="system-ui">${i + 1}</text>`;
  });

  const width = cols * (cellSize + gap);
  const height = rows * (cellSize + gap);

  return `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">${cells}</svg>`;
}

/** Horizontal strip: each day = proportion of 24h spent fasting (visual rhythm map). */
function rhythmStripSVG(dailyHeatmap: MonthlyReportData['dailyHeatmap']): string {
  const H = 28;
  const gap = 2;
  const n = dailyHeatmap.length;
  const cellW = Math.max(4, Math.floor((480 - (n - 1) * gap) / n));
  const W = n * cellW + (n - 1) * gap;
  let rects = '';
  dailyHeatmap.forEach((day, i) => {
    const x = i * (cellW + gap);
    const fh = day.fasted ? Math.min(H - 4, Math.max(4, (day.hours / 24) * (H - 4))) : 2;
    const y = H - fh - 2;
    const fill = day.fasted
      ? (day.hours >= 16 ? '#5B8C5A' : day.hours >= 12 ? '#7AAE79' : '#a0c89f')
      : '#2a1a0a';
    rects += `<rect x="${x}" y="${y}" width="${cellW}" height="${fh}" rx="2" fill="${fill}" />`;
  });
  return `<svg width="100%" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">${rects}</svg>`;
}

function weeklyBarsSVG(weekly: MonthlyReportData['weeklyBreakdown']): string {
  if (weekly.length === 0) return '';
  const maxF = Math.max(...weekly.map(w => w.fasts), 1);
  const W = 480;
  const H = 120;
  const barW = Math.floor((W - 40) / weekly.length) - 12;
  let bars = '';
  weekly.forEach((w, i) => {
    const x = 20 + i * ((W - 40) / weekly.length);
    const bh = Math.round((w.fasts / maxF) * 72);
    const y = 88 - bh;
    bars += `<rect x="${x}" y="${y}" width="${barW}" height="${bh}" rx="6" fill="#c8872a" fill-opacity="0.85" />`;
    bars += `<text x="${x + barW / 2}" y="108" text-anchor="middle" fill="#7a6040" font-size="10" font-family="system-ui">W${w.week}</text>`;
    bars += `<text x="${x + barW / 2}" y="${y - 6}" text-anchor="middle" fill="#f0e0c0" font-size="11" font-weight="700" font-family="system-ui">${w.fasts}</text>`;
  });
  return `<svg width="100%" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">${bars}</svg>`;
}

function weightChartSVG(weightLogs: { date: string; kg: number }[]): string {
  if (weightLogs.length < 2) return '';

  const W = 480;
  const H = 120;
  const PAD = 30;

  const kgs = weightLogs.map(w => w.kg);
  const minKg = Math.min(...kgs) - 0.5;
  const maxKg = Math.max(...kgs) + 0.5;

  const scaleX = (i: number) => PAD + (i / (weightLogs.length - 1)) * (W - PAD * 2);
  const scaleY = (kg: number) => PAD + ((maxKg - kg) / (maxKg - minKg)) * (H - PAD * 2);

  let pathD = `M ${scaleX(0)} ${scaleY(kgs[0])}`;
  for (let i = 1; i < weightLogs.length; i++) {
    const px = scaleX(i - 1), py = scaleY(kgs[i - 1]);
    const cx = scaleX(i), cy = scaleY(kgs[i]);
    const midX = (px + cx) / 2;
    pathD += ` C ${midX} ${py}, ${midX} ${cy}, ${cx} ${cy}`;
  }

  let dots = '';
  kgs.forEach((kg, i) => {
    dots += `<circle cx="${scaleX(i)}" cy="${scaleY(kg)}" r="3.5" fill="#e8a84c" />`;
  });

  const labels = `
    <text x="4" y="${scaleY(maxKg) + 4}" fill="#7a6040" font-size="9" font-family="system-ui">${maxKg.toFixed(0)}</text>
    <text x="4" y="${scaleY(minKg) + 4}" fill="#7a6040" font-size="9" font-family="system-ui">${minKg.toFixed(0)}</text>
  `;

  return `
    <svg width="100%" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
      ${labels}
      <path d="${pathD}" fill="none" stroke="#e8a84c" stroke-width="2" stroke-linecap="round" />
      ${dots}
    </svg>
  `;
}

function scoreBreakdownBars(sb: MonthlyReportData['scoreBreakdown']): string {
  const rows: { label: string; val: number; max: number }[] = [
    { label: 'Duration quality', val: sb.duration, max: 30 },
    { label: 'Consistency', val: sb.consistency, max: 25 },
    { label: 'Circadian alignment', val: sb.circadian, max: 20 },
    { label: 'Deep fast exposure', val: sb.deepFast, max: 25 },
  ];
  return rows.map(r => {
    const pct = Math.min(100, Math.round((r.val / r.max) * 100));
    return `<div class="bd-row">
      <div class="bd-label"><span>${r.label}</span><span class="bd-frac">${r.val}/${r.max}</span></div>
      <div class="bd-track"><div class="bd-fill" style="width:${pct}%"></div></div>
    </div>`;
  }).join('');
}

function mondayFirstAdherence(dailyHeatmap: MonthlyReportData['dailyHeatmap'], month: number, year: number): { label: string; pct: number }[] {
  const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const hit = [0, 0, 0, 0, 0, 0, 0];
  const tot = [0, 0, 0, 0, 0, 0, 0];
  dailyHeatmap.forEach((day, i) => {
    const dow = new Date(year, month, i + 1).getDay();
    const idx = dow === 0 ? 6 : dow - 1;
    tot[idx]++;
    if (day.fasted) hit[idx]++;
  });
  return labels.map((label, i) => ({
    label,
    pct: tot[i] ? Math.round((hit[i] / tot[i]) * 100) : 0,
  }));
}

function adherenceBarsSVG(dailyHeatmap: MonthlyReportData['dailyHeatmap'], month: number, year: number): string {
  const data = mondayFirstAdherence(dailyHeatmap, month, year);
  const W = 480;
  const H = 100;
  const n = data.length;
  const gap = 8;
  const barW = Math.floor((W - 32 - (n - 1) * gap) / n);
  let g = '';
  data.forEach((d, i) => {
    const x = 16 + i * (barW + gap);
    const bh = Math.round((d.pct / 100) * 56);
    const y = 72 - bh;
    g += `<rect x="${x}" y="${y}" width="${barW}" height="${bh}" rx="4" fill="#7AAE79" fill-opacity="${0.35 + (d.pct / 100) * 0.55}" />`;
    g += `<text x="${x + barW / 2}" y="88" text-anchor="middle" fill="#7a6040" font-size="9" font-family="system-ui">${d.label}</text>`;
    g += `<text x="${x + barW / 2}" y="${y - 4}" text-anchor="middle" fill="#f0e0c0" font-size="9" font-weight="600" font-family="system-ui">${d.pct}%</text>`;
  });
  return `<svg width="100%" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">${g}</svg>`;
}

function scoreProgressSVG(
  prev: number | null,
  current: number,
  projected: number | null,
): string {
  const W = 480;
  const H = 110;
  const pts: { x: number; y: number; lab: string }[] = [];
  const xs = [80, 240, 400];
  const scores: number[] = [];
  const labs: string[] = [];
  if (prev != null) {
    scores.push(prev, current, projected ?? current);
    labs.push('Prior', 'This month', 'Projected');
  } else {
    scores.push(current, projected ?? current);
    labs.push('This month', 'Projected');
  }
  const minS = Math.max(0, Math.min(...scores) - 8);
  const maxS = Math.min(100, Math.max(...scores) + 8);
  const scaleY = (s: number) => 78 - ((s - minS) / (maxS - minS || 1)) * 50;
  if (prev != null) {
    pts.push({ x: xs[0], y: scaleY(prev), lab: labs[0] });
    pts.push({ x: xs[1], y: scaleY(current), lab: labs[1] });
    pts.push({ x: xs[2], y: scaleY(projected ?? current), lab: labs[2] });
  } else {
    pts.push({ x: 160, y: scaleY(current), lab: labs[0] });
    pts.push({ x: 320, y: scaleY(projected ?? current), lab: labs[1] });
  }
  let pathD = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 1; i < pts.length; i++) pathD += ` L ${pts[i].x} ${pts[i].y}`;
  let dots = '';
  let lbls = '';
  pts.forEach((p, i) => {
    dots += `<circle cx="${p.x}" cy="${p.y}" r="6" fill="#e8a84c" />`;
    const sc = scores[i];
    lbls += `<text x="${p.x}" y="102" text-anchor="middle" fill="#7a6040" font-size="9" font-family="system-ui">${p.lab}</text>`;
    lbls += `<text x="${p.x}" y="${p.y - 12}" text-anchor="middle" fill="#f0e0c0" font-size="12" font-weight="700" font-family="system-ui">${sc}</text>`;
  });
  return `<svg width="100%" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
    <path d="${pathD}" fill="none" stroke="#c8872a" stroke-width="2" stroke-linecap="round" />
    ${dots}
    ${lbls}
  </svg>`;
}

function heroDescription(data: MonthlyReportData): string {
  if (data.isBaseline) {
    return `Your first month with Aayu establishes a reference for rhythm, duration, and consistency. The score reflects real effort — use it as a compass, not a verdict.`;
  }
  return `Month ${data.monthNumber} shows how your fasting discipline translated into metabolic score movement. Small improvements in timing and consistency compound into outsized health returns.`;
}

function progressDeltaPill(data: MonthlyReportData): string {
  if (data.baseline) {
    const d = data.metabolicScore - data.baseline.metabolicScore;
    const sign = d >= 0 ? '+' : '';
    return `<span class="delta-pill">${sign}${d} pts vs Month 1 baseline</span>`;
  }
  if (data.prevMonth) {
    const d = data.metabolicScore - data.prevMonth.metabolicScore;
    const sign = d >= 0 ? '+' : '';
    return `<span class="delta-pill">${sign}${d} pts vs prior month</span>`;
  }
  return `<span class="delta-pill">Month ${data.monthNumber} snapshot</span>`;
}

// ─── Main template ────────────────────────────────────────────────────────────

export function buildReportHTML(data: MonthlyReportData): string {
  const prevScore = data.prevMonth?.metabolicScore;
  const prevAvgFast = data.prevMonth?.avgFastDuration;
  const prevWeight = data.prevMonth?.weightEnd;
  const prevCompletion = data.prevMonth?.completionRate;
  const prevWater = data.prevMonth?.avgWaterMl;
  const prevSteps = data.prevMonth?.avgSteps;

  const showProgressPage = !data.isBaseline && !!(data.prevMonth || data.sinceStart);
  const totalPages = showProgressPage ? 5 : 4;

  const subMetaHero = `${data.userName} · ${data.planLabel} · Month ${data.monthNumber}${
    data.isBaseline ? ' · Baseline foundation' : ' · Progression'
  }`;

  let page = 0;
  const nextPage = () => {
    page += 1;
    return page;
  };

  const scoreProgressPrev = data.prevMonth ? data.prevMonth.metabolicScore : null;

  const page1 = `
<div class="page">
  ${reportPageHeader(`${data.monthLabel} recap`, subMetaHero)}
  <div class="hero-top">
    <div class="hero-top-inner">
      <div class="hero-score-block">
        ${scoreRingSVG(data.metabolicScore)}
      </div>
      <div class="hero-copy-block">
        <div class="hero-label-row">
          <span class="score-label">${data.metabolicLabel}</span>
          ${delta(data.metabolicScore, prevScore, ' pts', 0)}
        </div>
        <div class="hero-desc">${heroDescription(data)}</div>
        <div class="hero-mini">
          <span class="mini-pill">Best streak <strong>${data.bestStreak}</strong> days</span>
          <span class="mini-pill">Overnight alignment <strong>${data.timing.overnightAlignmentPct}%</strong></span>
        </div>
      </div>
    </div>
  </div>

  <div class="card">
    <div class="card-title">SCORE BREAKDOWN</div>
    ${scoreBreakdownBars(data.scoreBreakdown)}
  </div>

  <div class="stats-grid three">
    <div class="stat-box">
      <div class="stat-val">${data.completedFasts}</div>
      <div class="stat-label">Fasts completed</div>
    </div>
    <div class="stat-box">
      <div class="stat-val">${data.totalFastingHours}h</div>
      <div class="stat-label">Total hours fasted</div>
    </div>
    <div class="stat-box">
      <div class="stat-val">${data.avgFastDuration}h ${delta(data.avgFastDuration, prevAvgFast, 'h')}</div>
      <div class="stat-label">Avg duration</div>
    </div>
  </div>

  <div class="proj-card">
    <div class="proj-title">NEXT MONTH OUTLOOK</div>
    ${
      data.projectedScore != null
        ? data.isBaseline
          ? `<div class="proj-line">If you keep this rhythm, your score can move into the <strong>${data.metabolicScore}–${data.projectedScore}</strong> band next month.</div>`
          : `<div class="proj-line">Projected score next month: <strong>${data.metabolicScore} → ${data.projectedScore}</strong> (conservative estimate).</div>`
        : `<div class="proj-line">Complete a few more fasts to unlock a projection next month.</div>`
    }
  </div>
  ${pageFooter(nextPage(), totalPages)}
</div>`;

  const weekTiles = data.weeklyBreakdown
    .map(
      w => `<div class="week-tile"><div class="week-tile-h">Week ${w.week}</div><div class="week-tile-v">${w.fasts} fasts</div><div class="week-tile-sub">${w.hours}h tracked</div></div>`,
    )
    .join('');

  const page2 = `
<div class="page">
  ${reportPageHeader('Patterns', `${data.monthLabel} · weekly rhythm`)}
  <div class="card">
    <div class="card-title">WEEKLY FASTING LOAD</div>
    <div class="chart-pad">${weeklyBarsSVG(data.weeklyBreakdown)}</div>
  </div>
  <div class="week-tiles">${weekTiles}</div>
  <div class="card">
    <div class="card-title">${data.isBaseline ? 'BASELINE INSIGHTS' : 'RHYTHM NOTES'}</div>
    <div class="insight-body">
      ${
        data.isBaseline
          ? `<p class="para">This is your baseline month. Future reports will stack new weeks against this reference so you can see momentum, not noise.</p>`
          : `<p class="para">Week-to-week load shows where life interrupted rhythm — use it to plan realistic targets next month.</p>`
      }
    </div>
  </div>
  ${
    data.weightStart !== null && data.weightEnd !== null
      ? `
  <div class="card">
    <div class="card-title">WEIGHT PROGRESS</div>
    <div class="two-col">
      <div>
        <span class="muted-sm">Start of month</span><br/>
        <span class="lg-val">${data.weightStart!.toFixed(1)} kg</span>
      </div>
      <div style="text-align:right;">
        <span class="muted-sm">End of month</span><br/>
        <span class="lg-val">${data.weightEnd!.toFixed(1)} kg</span>
        ${weightDelta(data.weightEnd, prevWeight ?? null)}
      </div>
    </div>
    ${
      data.weightChange !== null && data.weightChange > 0
        ? `<div class="weight-win">▼ ${data.weightChange.toFixed(1)} kg lost this month</div>`
        : ''
    }
  </div>
  `
      : ''
  }
  ${data.weightLogs.length >= 2 ? `<div class="card"><div class="card-title">WEIGHT TREND</div><div class="weight-chart">${weightChartSVG(data.weightLogs)}</div></div>` : ''}

  <div class="card">
    <div class="card-title">DAILY FOUNDATIONS</div>
    <div class="two-col">
      <div class="stat-box">
        <div class="card-title" style="margin-bottom:6px;">WATER</div>
        ${
          data.hasWaterData
            ? `<div class="stat-val">${data.avgWaterMl >= 1000 ? (data.avgWaterMl / 1000).toFixed(1) + 'L' : data.avgWaterMl + 'ml'}</div><div class="muted-sm">avg/day ${delta(data.avgWaterMl, prevWater, 'ml', 0)}</div><div class="on-target">${data.waterDaysOnTarget} days on target</div>`
            : `<div class="muted-sm">Hydration data not available this month</div>`
        }
      </div>
      <div class="stat-box">
        <div class="card-title" style="margin-bottom:6px;">STEPS</div>
        ${
          data.hasStepsData
            ? `<div class="stat-val">${data.avgSteps >= 1000 ? (data.avgSteps / 1000).toFixed(1) + 'k' : data.avgSteps}</div><div class="muted-sm">avg/day ${delta(data.avgSteps, prevSteps, '', 0)}</div><div class="on-target">${data.stepsDaysOnTarget} days on target</div>`
            : `<div class="muted-sm">Movement data not synced this month</div>`
        }
      </div>
    </div>
    ${
      data.bmiStart !== null || data.bmiEnd !== null
        ? `
    <div class="two-col" style="margin-top:10px;">
      ${data.bmiStart !== null ? `<div class="stat-box"><div class="card-title" style="margin-bottom:6px;">BMI START</div><div class="stat-val">${data.bmiStart!.toFixed(1)}</div></div>` : '<div></div>'}
      ${data.bmiEnd !== null ? `<div class="stat-box"><div class="card-title" style="margin-bottom:6px;">BMI END</div><div class="stat-val">${data.bmiEnd!.toFixed(1)}</div></div>` : '<div></div>'}
    </div>`
        : ''
    }
  </div>

  <div class="stats-grid three">
    <div class="stat-box"><div class="stat-val">${data.longestFast}h</div><div class="stat-label">Longest fast</div></div>
    <div class="stat-box"><div class="stat-val">${data.completionRate}% ${delta(data.completionRate, prevCompletion, '%', 0)}</div><div class="stat-label">Completion rate</div></div>
    <div class="stat-box"><div class="stat-val">${data.bestStreak}</div><div class="stat-label">Best streak (days)</div></div>
  </div>
  ${!showProgressPage && data.sinceStart ? `
  <div class="since-box">
    <div class="since-title">SINCE YOU STARTED (${data.sinceStart.totalMonths} MO)</div>
    <div class="since-grid">
      <div class="since-stat"><div class="since-val">${data.sinceStart.totalFasts}</div><div class="since-label">Total fasts</div></div>
      <div class="since-stat"><div class="since-val">${data.sinceStart.totalHours}h</div><div class="since-label">Hours fasted</div></div>
      ${data.sinceStart.totalWeightLost != null
        ? `<div class="since-stat"><div class="since-val">-${data.sinceStart.totalWeightLost.toFixed(1)}kg</div><div class="since-label">Weight lost</div></div>`
        : `<div class="since-stat"><div class="since-val">${data.sinceStart.totalMonths}</div><div class="since-label">Months strong</div></div>`}
    </div>
  </div>` : ''}
  ${pageFooter(nextPage(), totalPages)}
</div>`;

  const rhythmBand =
    data.timing.bestWindow != null
      ? `<div class="rhythm-band"><span class="card-title" style="margin:0;">PREFERRED RHYTHM</span><div class="rhythm-band-txt">${data.timing.bestWindow}</div></div>`
      : '';

  const page3 = `
<div class="page">
  ${reportPageHeader('Fasting analysis', data.monthLabel)}
  <div class="card">
    <div class="card-title">DAILY RHYTHM MAP</div>
    <p class="muted-sm" style="margin-bottom:8px;">Each column is one day; bar height shows fasting hours captured that day.</p>
    <div class="chart-pad">${rhythmStripSVG(data.dailyHeatmap)}</div>
  </div>
  <div class="card">
    <div class="card-title">DAILY FASTING HEATMAP</div>
    <div class="heatmap-wrap">${heatmapSVG(data.dailyHeatmap)}</div>
    <div class="heatmap-legend">
      <div class="legend-item"><div class="legend-dot" style="background:#1c1009;border:1px solid #2a1a0a;"></div> No fast</div>
      <div class="legend-item"><div class="legend-dot" style="background:#a0c89f;"></div> &lt;12h</div>
      <div class="legend-item"><div class="legend-dot" style="background:#7AAE79;"></div> 12–16h</div>
      <div class="legend-item"><div class="legend-dot" style="background:#5B8C5A;"></div> 16h+ (deep)</div>
    </div>
  </div>
  <div class="two-col">
    <div class="card">
      <div class="card-title">TYPICAL FAST START</div>
      <div class="stat-val sm">${data.timing.mostCommonStartHour ?? '—'}</div>
    </div>
    <div class="card">
      <div class="card-title">TYPICAL BREAK FAST</div>
      <div class="stat-val sm">${data.timing.mostCommonBreakHour ?? '—'}</div>
    </div>
  </div>
  ${rhythmBand}
  <div class="two-col">
    <div class="card">
      <div class="card-title">DEEP FASTS (16h+)</div>
      <div class="stat-val">${data.deepFasts16h}</div>
      <div class="muted-sm">of ${data.completedFasts} completed</div>
    </div>
    <div class="card">
      <div class="card-title">CIRCADIAN ALIGNMENT</div>
      <div class="stat-val">${data.circadianPct}%</div>
      <div class="muted-sm">overnight overlap quality</div>
    </div>
  </div>
  <div class="stats-grid three">
    <div class="stat-box">
      <div class="stat-val accent-org">${data.fatBurnedGrams}g</div>
      <div class="stat-label">Fat utilized (est.)</div>
    </div>
    <div class="stat-box">
      <div class="stat-val accent-purple">${data.autophagyHours}h</div>
      <div class="stat-label">Autophagy hours</div>
    </div>
    <div class="stat-box">
      <div class="stat-val accent-blue">${data.insulinSensitivity}/100</div>
      <div class="stat-label">Insulin sensitivity</div>
    </div>
  </div>
  ${pageFooter(nextPage(), totalPages)}
</div>`;

  const page4Progress = showProgressPage
    ? `
<div class="page">
  ${reportPageHeader('Progress & behaviour', data.monthLabel)}
  <div class="prog-head">
    <div class="prog-title">Month ${data.monthNumber} progress</div>
    ${progressDeltaPill(data)}
  </div>
  <div class="card">
    <div class="card-title">SCORE TRAJECTORY</div>
    <div class="chart-pad">${scoreProgressSVG(scoreProgressPrev, data.metabolicScore, data.projectedScore)}</div>
  </div>
  ${
    data.prevMonth
      ? `
  <div class="card">
    <div class="card-title">MONTH-OVER-MONTH</div>
    <table class="mom-table">
      <tr class="mom-head"><td>Metric</td><td class="r">Last</td><td class="r">This</td><td class="r">Δ</td></tr>
      <tr><td>Metabolic score</td><td class="r">${data.prevMonth.metabolicScore}</td><td class="r b">${data.metabolicScore}</td><td class="r">${delta(data.metabolicScore, data.prevMonth.metabolicScore, '', 0)}</td></tr>
      <tr><td>Fasts completed</td><td class="r">${data.prevMonth.totalFasts}</td><td class="r b">${data.completedFasts}</td><td class="r">${delta(data.completedFasts, data.prevMonth.totalFasts, '', 0)}</td></tr>
      <tr><td>Avg fast (h)</td><td class="r">${data.prevMonth.avgFastDuration.toFixed(1)}</td><td class="r b">${data.avgFastDuration}</td><td class="r">${delta(data.avgFastDuration, data.prevMonth.avgFastDuration, 'h')}</td></tr>
      <tr><td>Completion %</td><td class="r">${data.prevMonth.completionRate}%</td><td class="r b">${data.completionRate}%</td><td class="r">${delta(data.completionRate, data.prevMonth.completionRate, '%', 0)}</td></tr>
      <tr><td>Best streak</td><td class="r">${data.prevMonth.bestStreak}</td><td class="r b">${data.bestStreak}</td><td class="r">${delta(data.bestStreak, data.prevMonth.bestStreak, '', 0)}</td></tr>
      ${
        data.prevMonth.weightEnd !== null && data.weightEnd !== null
          ? `<tr><td>Weight</td><td class="r">${data.prevMonth.weightEnd.toFixed(1)}kg</td><td class="r b">${data.weightEnd.toFixed(1)}kg</td><td class="r">${weightDelta(data.weightEnd, data.prevMonth.weightEnd)}</td></tr>`
          : ''
      }
    </table>
  </div>`
      : ''
  }
  ${data.sinceStart && showProgressPage ? `
  <div class="since-box">
    <div class="since-title">SINCE YOU STARTED (${data.sinceStart.totalMonths} MO)</div>
    <div class="since-grid">
      <div class="since-stat"><div class="since-val">${data.sinceStart.totalFasts}</div><div class="since-label">Total fasts</div></div>
      <div class="since-stat"><div class="since-val">${data.sinceStart.totalHours}h</div><div class="since-label">Hours fasted</div></div>
      ${data.sinceStart.totalWeightLost != null
        ? `<div class="since-stat"><div class="since-val">-${data.sinceStart.totalWeightLost.toFixed(1)}kg</div><div class="since-label">Weight lost</div></div>`
        : `<div class="since-stat"><div class="since-val">${data.sinceStart.totalMonths}</div><div class="since-label">Months strong</div></div>`}
    </div>
  </div>` : ''}

  ${
    data.behaviour
      ? `
  <div class="card">
    <div class="card-title">BEHAVIOUR INTELLIGENCE</div>
    <div class="two-col tight">
      <div>
        <div class="muted-sm">Weekday adherence (Mon–Thu)</div>
        <div class="lg-val">${data.behaviour.weekdayAdherencePct}%</div>
      </div>
      <div>
        <div class="muted-sm">Weekend drop vs weekdays</div>
        <div class="lg-val">${data.behaviour.weekendDropPct}%</div>
      </div>
    </div>
    <div style="margin-top:10px;"><span class="muted-sm">Recovery after a miss</span> <strong>${data.behaviour.recoveryRate}%</strong></div>
  </div>
  <div class="card">
    <div class="card-title">WEEKLY ADHERENCE (% DAYS FASTED)</div>
    <div class="chart-pad">${adherenceBarsSVG(data.dailyHeatmap, data.month, data.year)}</div>
  </div>
  <div class="two-col">
    <div class="card">
      <div class="card-title">CONSISTENCY PROFILE</div>
      <p class="para">Weekdays held at <strong>${data.behaviour.weekdayAdherencePct}%</strong>; weekends trail by <strong>${data.behaviour.weekendDropPct}%</strong>. ${data.behaviour.recoveryRate}% of missed days were followed by a completed fast.</p>
    </div>
    <div class="card">
      <div class="card-title">BEST-PERFORMING ROUTINE</div>
      <p class="para">Strongest days: <strong>${data.behaviour.bestDays.length ? data.behaviour.bestDays.join(', ') : '—'}</strong>. ${data.timing.bestWindow ? `Typical window <strong>${data.timing.bestWindow}</strong>.` : 'Log a few more fasts to lock a preferred window.'}</p>
    </div>
  </div>`
      : ''
  }
  ${pageFooter(nextPage(), totalPages)}
</div>`
    : '';

  const wentWell = data.insights.length
    ? data.insights.map(i => `<div class="well-item">${i}</div>`).join('')
    : `<div class="well-item">You showed up and logged real fasting time this month.</div>`;

  const needsAttn =
    data.dataGaps.length > 0
      ? data.dataGaps.map(g => `<div class="attn-item">${g}</div>`).join('')
      : `<div class="attn-item">No major data gaps — sensors and logs look healthy.</div>`;

  const nextMonthNum = data.monthNumber + 1;

  const pageLast = `
<div class="page page-last">
  ${reportPageHeader('Next month plan', `Month ${nextMonthNum} preview`)}
  ${
    data.projectedScore != null
      ? `<div class="proj-banner">Projected metabolic band: <strong>${data.metabolicScore} → ${data.projectedScore}</strong></div>`
      : ''
  }
  <div class="two-col">
    <div class="stat-box">
      <div class="card-title" style="margin-bottom:6px;">RETENTION HOOK</div>
      <div class="para">${data.nextMonthTargets.retentionHook}</div>
    </div>
    <div class="stat-box">
      <div class="card-title" style="margin-bottom:6px;">COACHING FOCUS</div>
      <div class="para">${data.nextMonthTargets.focusArea}</div>
    </div>
  </div>
  <div class="card">
    <div class="card-title">RECOMMENDED NEXT-MONTH PLAN</div>
    <ol class="plan-ol">
      <li>Complete <strong>${data.nextMonthTargets.targetFasts}</strong> fasts next month.</li>
      <li>${data.nextMonthTargets.targetLongFast}</li>
      <li>${data.nextMonthTargets.focusArea}</li>
      <li>${data.nextMonthTargets.retentionHook}</li>
    </ol>
    <div class="reco-text" style="margin-top:12px;">${data.recommendation}</div>
  </div>
  <div class="two-col">
    <div class="card">
      <div class="card-title">WHAT WENT WELL</div>
      ${wentWell}
    </div>
    <div class="card">
      <div class="card-title">NEEDS ATTENTION</div>
      ${needsAttn}
    </div>
  </div>
  <div class="cta-band">
    <div class="cta-title">Ready for month ${nextMonthNum}?</div>
    <div class="cta-sub">Your next recap unlocks after three completed fasts.</div>
    <div class="cta-pill">See you next month</div>
  </div>
  ${pageFooter(nextPage(), totalPages)}
  <div class="footer">
    <div>Generated by <span class="footer-brand">Aayu</span> on ${new Date(data.generatedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</div>
    <div class="footer-disclaimer">This report is for informational purposes only and does not constitute medical advice.</div>
  </div>
</div>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Aayu Monthly Report — ${data.monthLabel}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
    background: #0e0703;
    color: #f0e0c0;
    padding: 24px;
    line-height: 1.5;
  }
  .page { page-break-after: always; min-height: 90vh; }
  .page:last-child { page-break-after: avoid; }

  .header { text-align: center; margin-bottom: 20px; padding-bottom: 14px; border-bottom: 1px solid #2a1a0a; }
  .brand-row { display: flex; align-items: center; justify-content: center; gap: 12px; margin-bottom: 8px; }
  .brand-mark { display: inline-flex; line-height: 0; }
  .brand-text-col { text-align: left; }
  .brand-word { font-size: 22px; font-weight: 700; letter-spacing: 0.04em; color: #e8a84c; line-height: 1.1; }
  .brand-tag { font-size: 10px; letter-spacing: 0.14em; text-transform: uppercase; color: rgba(232,168,76,0.55); margin-top: 2px; }
  .month-title { font-size: 26px; font-weight: 700; margin-bottom: 4px; }
  .sub-meta { font-size: 12px; color: #7a6040; }

  .hero-top { margin-bottom: 14px; }
  .hero-top-inner { display: flex; gap: 20px; align-items: flex-start; flex-wrap: wrap; }
  .hero-score-block { flex-shrink: 0; }
  .hero-copy-block { flex: 1; min-width: 200px; }
  .hero-label-row { display: flex; align-items: center; flex-wrap: wrap; gap: 8px; margin-bottom: 8px; }
  .score-label { font-size: 18px; font-weight: 700; color: #f0e0c0; }
  .hero-desc { font-size: 13px; color: rgba(240,224,192,0.82); line-height: 1.65; margin-bottom: 10px; }
  .hero-mini { display: flex; flex-wrap: wrap; gap: 8px; }
  .mini-pill { font-size: 10px; color: #7a6040; background: #1c1009; border: 1px solid rgba(200,135,42,0.12); border-radius: 8px; padding: 6px 10px; }
  .mini-pill strong { color: #e8a84c; }

  .card { background: #1c1009; border: 1px solid rgba(200,135,42,0.15); border-radius: 14px; padding: 14px; margin-bottom: 10px; }
  .card-title { font-size: 10px; letter-spacing: 1.2px; color: rgba(200,135,42,0.5); margin-bottom: 8px; text-transform: uppercase; }

  .bd-row { margin-bottom: 8px; }
  .bd-label { display: flex; justify-content: space-between; font-size: 11px; color: #7a6040; margin-bottom: 4px; }
  .bd-frac { color: #f0e0c0; font-weight: 600; }
  .bd-track { height: 8px; background: #2a1a0a; border-radius: 4px; overflow: hidden; }
  .bd-fill { height: 100%; background: linear-gradient(90deg, #8a5a1a, #c8872a); border-radius: 4px; }

  .stats-grid { display: grid; gap: 10px; }
  .stats-grid.three { grid-template-columns: 1fr 1fr 1fr; }
  .stat-box { background: #1c1009; border: 1px solid rgba(200,135,42,0.12); border-radius: 10px; padding: 12px; text-align: center; }
  .stat-val { font-size: 22px; font-weight: 700; color: #f0e0c0; }
  .stat-val.sm { font-size: 16px; }
  .stat-label { font-size: 9px; letter-spacing: 0.8px; color: #7a6040; text-transform: uppercase; margin-top: 2px; }
  .accent-org { color: #E8913A !important; }
  .accent-purple { color: #7B68AE !important; }
  .accent-blue { color: #2E86AB !important; }

  .proj-card { background: rgba(200,135,42,0.06); border: 1px solid rgba(200,135,42,0.2); border-radius: 14px; padding: 14px; margin-top: 10px; margin-bottom: 8px; }
  .proj-title { font-size: 10px; letter-spacing: 1px; color: #c8872a; text-transform: uppercase; margin-bottom: 6px; }
  .proj-line { font-size: 13px; color: rgba(240,224,192,0.85); line-height: 1.6; }
  .proj-banner { text-align: center; padding: 12px; border-radius: 12px; background: rgba(200,135,42,0.08); border: 1px solid rgba(200,135,42,0.2); margin-bottom: 12px; font-size: 14px; }

  .delta { font-size: 11px; font-weight: 600; padding: 2px 8px; border-radius: 6px; }
  .delta.up { background: rgba(122,174,121,0.15); color: #7AAE79; }
  .delta.down { background: rgba(232,168,76,0.15); color: #e8a84c; }

  .page-num { text-align: center; font-size: 10px; color: #4a3020; margin-top: 18px; padding-top: 10px; border-top: 1px solid #1c1009; }

  .week-tiles { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 10px; }
  .week-tile { flex: 1; min-width: 72px; background: #1c1009; border: 1px solid rgba(200,135,42,0.12); border-radius: 10px; padding: 10px; text-align: center; }
  .week-tile-h { font-size: 9px; color: #7a6040; text-transform: uppercase; letter-spacing: 0.6px; }
  .week-tile-v { font-size: 18px; font-weight: 700; margin-top: 4px; }
  .week-tile-sub { font-size: 10px; color: #7a6040; margin-top: 2px; }

  .chart-pad { margin: 4px 0; }
  .heatmap-wrap { display: flex; justify-content: center; margin: 8px 0; }
  .heatmap-legend { display: flex; gap: 12px; justify-content: center; margin-top: 6px; flex-wrap: wrap; }
  .legend-item { display: flex; align-items: center; gap: 4px; font-size: 10px; color: #7a6040; }
  .legend-dot { width: 10px; height: 10px; border-radius: 2px; }

  .rhythm-band { margin: 10px 0; padding: 12px 14px; border-radius: 12px; border: 1px dashed rgba(200,135,42,0.35); background: rgba(200,135,42,0.04); text-align: center; }
  .rhythm-band-txt { font-size: 15px; font-weight: 600; color: #e8a84c; margin-top: 6px; }

  .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
  .two-col.tight { gap: 12px; }

  .muted-sm { color: #7a6040; font-size: 11px; }
  .lg-val { font-size: 20px; font-weight: 700; }
  .weight-win { text-align: center; margin-top: 8px; font-size: 14px; color: #7AAE79; font-weight: 600; }
  .on-target { font-size: 11px; color: #5B8C5A; margin-top: 4px; }

  .since-box { background: rgba(232,168,76,0.05); border: 1px solid rgba(232,168,76,0.15); border-radius: 14px; padding: 14px; margin-top: 8px; }
  .since-title { font-size: 10px; letter-spacing: 1px; color: #e8a84c; text-transform: uppercase; margin-bottom: 8px; }
  .since-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; }
  .since-stat { text-align: center; }
  .since-val { font-size: 18px; font-weight: 700; color: #e8a84c; }
  .since-label { font-size: 9px; color: #7a6040; text-transform: uppercase; }

  .insight-body .para, .para { font-size: 13px; color: rgba(240,224,192,0.78); line-height: 1.65; }
  .insight-item { padding: 6px 0; border-bottom: 1px solid #2a1a0a; font-size: 12px; line-height: 1.55; }
  .insight-item:last-child { border-bottom: none; }
  .insight-bullet { color: #e8a84c; margin-right: 6px; }

  .prog-head { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 10px; margin-bottom: 12px; }
  .prog-title { font-size: 20px; font-weight: 700; }
  .delta-pill { font-size: 11px; font-weight: 600; padding: 4px 10px; border-radius: 999px; background: rgba(122,174,121,0.12); color: #7AAE79; border: 1px solid rgba(122,174,121,0.25); }

  .mom-table { width: 100%; font-size: 12px; border-collapse: collapse; }
  .mom-table td { padding: 6px 0; border-bottom: 1px solid #2a1a0a; }
  .mom-head { color: #7a6040; font-size: 10px; text-transform: uppercase; }
  .mom-table .r { text-align: right; }
  .mom-table .b { font-weight: 700; }

  .well-item, .attn-item { font-size: 12px; padding: 8px 0; border-bottom: 1px solid #2a1a0a; line-height: 1.5; }
  .well-item:last-child, .attn-item:last-child { border-bottom: none; }

  .plan-ol { margin: 10px 0 0 18px; font-size: 13px; color: rgba(240,224,192,0.85); line-height: 1.75; }
  .reco-text { font-size: 13px; color: rgba(240,224,192,0.72); line-height: 1.65; }

  .cta-band { margin-top: 14px; padding: 20px; border-radius: 14px; background: linear-gradient(180deg, rgba(200,135,42,0.12), rgba(28,16,9,0.9)); border: 1px solid rgba(200,135,42,0.25); text-align: center; }
  .cta-title { font-size: 17px; font-weight: 700; margin-bottom: 4px; }
  .cta-sub { font-size: 12px; color: #7a6040; margin-bottom: 12px; }
  .cta-pill { display: inline-block; font-size: 12px; font-weight: 600; color: #1a1008; background: #c8872a; padding: 10px 22px; border-radius: 999px; }

  .footer { text-align: center; padding-top: 16px; font-size: 10px; color: #4a3020; margin-top: 12px; }
  .footer-brand { color: #e8a84c; font-weight: 600; }
  .footer-disclaimer { margin-top: 6px; line-height: 1.5; }
</style>
</head>
<body>
${page1}
${page2}
${page3}
${page4Progress}
${pageLast}
</body>
</html>`;
}
