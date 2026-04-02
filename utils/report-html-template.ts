// utils/report-html-template.ts
// Generates a self-contained HTML string for the monthly PDF report.
// The HTML includes inline CSS, SVG charts, and all data — no external deps.
//
// Design: dark Aayu theme (cream on dark brown), 4 pages, A4-friendly.

import type { MonthlyReportData } from '@/utils/monthly-report';

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
  const diff = previous - current; // positive = loss
  if (Math.abs(diff) < 0.05) return '';
  const sign = diff > 0 ? '-' : '+';
  return `<span class="delta ${diff > 0 ? 'down' : 'up'}">${sign}${Math.abs(diff).toFixed(1)}kg</span>`;
}

function scoreRingSVG(score: number, size: number = 80): string {
  const stroke = 6;
  const r = (size - stroke) / 2;
  const circumf = 2 * Math.PI * r;
  const fill = circumf * (score / 100);
  const color = score >= 85 ? '#5B8C5A' : score >= 70 ? '#e8a84c' : score >= 50 ? '#E8913A' : '#B8A898';

  return `
    <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
      <circle cx="${size/2}" cy="${size/2}" r="${r}" fill="none" stroke="#2a1a0a" stroke-width="${stroke}" />
      <circle cx="${size/2}" cy="${size/2}" r="${r}" fill="none" stroke="${color}" stroke-width="${stroke}"
        stroke-linecap="round" stroke-dasharray="${fill} ${circumf}"
        transform="rotate(-90 ${size/2} ${size/2})" />
      <text x="${size/2}" y="${size/2 + 6}" text-anchor="middle" fill="${color}"
        font-size="22" font-weight="800" font-family="system-ui">${score}</text>
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

    // Day number
    cells += `<text x="${x + cellSize/2}" y="${y + cellSize/2 + 4}" text-anchor="middle"
      fill="${day.fasted ? '#fff' : '#4a3020'}" font-size="8" font-family="system-ui">${i + 1}</text>`;
  });

  const width = cols * (cellSize + gap);
  const height = rows * (cellSize + gap);

  return `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">${cells}</svg>`;
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
  for (let i = 1; i < kgs.length; i++) {
    const px = scaleX(i - 1), py = scaleY(kgs[i - 1]);
    const cx = scaleX(i), cy = scaleY(kgs[i]);
    const midX = (px + cx) / 2;
    pathD += ` C ${midX} ${py}, ${midX} ${cy}, ${cx} ${cy}`;
  }

  let dots = '';
  kgs.forEach((kg, i) => {
    dots += `<circle cx="${scaleX(i)}" cy="${scaleY(kg)}" r="3.5" fill="#e8a84c" />`;
  });

  // Y-axis labels
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

// ─── Main template ────────────────────────────────────────────────────────────

export function buildReportHTML(data: MonthlyReportData): string {
  const prevScore = data.prevMonth?.metabolicScore;
  const prevAvgFast = data.prevMonth?.avgFastDuration;
  const prevWeight = data.prevMonth?.weightEnd;
  const prevCompletion = data.prevMonth?.completionRate;
  const prevWater = data.prevMonth?.avgWaterMl;
  const prevSteps = data.prevMonth?.avgSteps;

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

  /* Header */
  .header { text-align: center; margin-bottom: 24px; padding-bottom: 16px; border-bottom: 1px solid #2a1a0a; }
  .brand { font-size: 13px; letter-spacing: 3px; color: #e8a84c; margin-bottom: 4px; }
  .month-title { font-size: 28px; font-weight: 700; margin-bottom: 4px; }
  .sub-meta { font-size: 12px; color: #7a6040; }

  /* Cards */
  .card { background: #1c1009; border: 1px solid rgba(200,135,42,0.15); border-radius: 14px; padding: 16px; margin-bottom: 12px; }
  .card-title { font-size: 10px; letter-spacing: 1.2px; color: rgba(200,135,42,0.5); margin-bottom: 10px; text-transform: uppercase; }

  /* Score hero */
  .score-hero { display: flex; align-items: center; gap: 20px; }
  .score-meta { flex: 1; }
  .score-label { font-size: 18px; font-weight: 700; margin-bottom: 4px; }
  .score-sublabel { font-size: 12px; color: #7a6040; }

  /* Stats grid */
  .stats-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; }
  .stat-box { background: #1c1009; border: 1px solid rgba(200,135,42,0.12); border-radius: 10px; padding: 12px; text-align: center; }
  .stat-val { font-size: 22px; font-weight: 700; color: #f0e0c0; }
  .stat-label { font-size: 9px; letter-spacing: 0.8px; color: #7a6040; text-transform: uppercase; margin-top: 2px; }

  /* Delta badges */
  .delta { font-size: 11px; font-weight: 600; margin-left: 6px; padding: 2px 6px; border-radius: 6px; }
  .delta.up { background: rgba(122,174,121,0.15); color: #7AAE79; }
  .delta.down { background: rgba(232,168,76,0.15); color: #e8a84c; }

  /* Heatmap */
  .heatmap-wrap { display: flex; justify-content: center; margin: 12px 0; }
  .heatmap-legend { display: flex; gap: 12px; justify-content: center; margin-top: 8px; }
  .legend-item { display: flex; align-items: center; gap: 4px; font-size: 10px; color: #7a6040; }
  .legend-dot { width: 10px; height: 10px; border-radius: 2px; }

  /* Weight chart */
  .weight-chart { margin: 8px 0; }

  /* Insights */
  .insight-item { padding: 8px 0; border-bottom: 1px solid #1c1009; font-size: 13px; line-height: 1.6; }
  .insight-item:last-child { border-bottom: none; }
  .insight-bullet { color: #e8a84c; margin-right: 6px; }

  /* Recommendation */
  .reco-box { background: rgba(122,174,121,0.06); border: 1px solid rgba(122,174,121,0.2); border-radius: 14px; padding: 16px; margin-top: 12px; }
  .reco-title { font-size: 10px; letter-spacing: 1px; color: #7AAE79; text-transform: uppercase; margin-bottom: 8px; }
  .reco-text { font-size: 13px; color: rgba(240,224,192,0.75); line-height: 1.7; }

  /* Since start */
  .since-box { background: rgba(232,168,76,0.05); border: 1px solid rgba(232,168,76,0.15); border-radius: 14px; padding: 16px; margin-top: 12px; }
  .since-title { font-size: 10px; letter-spacing: 1px; color: #e8a84c; text-transform: uppercase; margin-bottom: 10px; }
  .since-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; }
  .since-stat { text-align: center; }
  .since-val { font-size: 20px; font-weight: 700; color: #e8a84c; }
  .since-label { font-size: 9px; color: #7a6040; text-transform: uppercase; letter-spacing: 0.5px; }

  /* Footer */
  .footer { text-align: center; padding-top: 16px; border-top: 1px solid #1c1009; font-size: 10px; color: #4a3020; margin-top: 24px; }
  .footer-brand { color: #e8a84c; font-weight: 600; }

  /* MoM comparison */
  .mom-row { display: flex; gap: 8px; margin-top: 8px; flex-wrap: wrap; }
  .mom-pill { font-size: 10px; padding: 3px 8px; border-radius: 8px; background: rgba(200,135,42,0.08); color: #7a6040; }

  /* 2-col grid */
  .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
</style>
</head>
<body>

<!-- ═══════════════ PAGE 1: SUMMARY ═══════════════ -->
<div class="page">
  <div class="header">
    <div class="brand">✦ A A Y U</div>
    <div class="month-title">${data.monthLabel}</div>
    <div class="sub-meta">${data.userName} · ${data.planLabel} · Month ${data.monthNumber}</div>
  </div>

  <!-- Metabolic Score -->
  <div class="card">
    <div class="card-title">METABOLIC DISCIPLINE SCORE</div>
    <div class="score-hero">
      ${scoreRingSVG(data.metabolicScore)}
      <div class="score-meta">
        <div class="score-label">${data.metabolicLabel} ${delta(data.metabolicScore, prevScore, 'pts', 0)}</div>
        <div class="mom-row">
          <span class="mom-pill">Duration ${data.durationGrade}</span>
          <span class="mom-pill">Consistency ${data.consistencyPct}%</span>
          <span class="mom-pill">Circadian ${data.circadianPct}%</span>
          <span class="mom-pill">Deep Fasts ${data.deepFastCount}</span>
        </div>
      </div>
    </div>
  </div>

  <!-- Key Stats -->
  <div class="stats-grid">
    <div class="stat-box">
      <div class="stat-val">${data.completedFasts}</div>
      <div class="stat-label">Fasts completed</div>
    </div>
    <div class="stat-box">
      <div class="stat-val">${data.totalFastingHours}h</div>
      <div class="stat-label">Total hours fasted</div>
    </div>
    <div class="stat-box">
      <div class="stat-val">${data.completionRate}%</div>
      <div class="stat-label">Completion rate</div>
    </div>
    <div class="stat-box">
      <div class="stat-val">${data.avgFastDuration}h ${delta(data.avgFastDuration, prevAvgFast, 'h')}</div>
      <div class="stat-label">Avg fast duration</div>
    </div>
    <div class="stat-box">
      <div class="stat-val">${data.longestFast}h</div>
      <div class="stat-label">Longest fast</div>
    </div>
    <div class="stat-box">
      <div class="stat-val">${data.bestStreak}</div>
      <div class="stat-label">Best streak (days)</div>
    </div>
  </div>

  ${data.weightStart !== null && data.weightEnd !== null ? `
  <!-- Weight -->
  <div class="card" style="margin-top: 12px;">
    <div class="card-title">WEIGHT PROGRESS</div>
    <div class="two-col">
      <div>
        <span style="color:#7a6040;font-size:11px;">Start of month</span><br/>
        <span style="font-size:20px;font-weight:700;">${data.weightStart!.toFixed(1)} kg</span>
      </div>
      <div style="text-align:right;">
        <span style="color:#7a6040;font-size:11px;">End of month</span><br/>
        <span style="font-size:20px;font-weight:700;">${data.weightEnd!.toFixed(1)} kg</span>
        ${weightDelta(data.weightEnd, prevWeight ?? null)}
      </div>
    </div>
    ${data.weightChange !== null && data.weightChange > 0 ? `
      <div style="text-align:center;margin-top:10px;font-size:14px;color:#7AAE79;font-weight:600;">
        ▼ ${data.weightChange.toFixed(1)} kg lost this month
      </div>
    ` : ''}
  </div>
  ` : ''}
</div>

<!-- ═══════════════ PAGE 2: FASTING ANALYSIS ═══════════════ -->
<div class="page">
  <div class="header">
    <div class="brand">✦ A A Y U</div>
    <div class="month-title">Fasting Analysis</div>
    <div class="sub-meta">${data.monthLabel}</div>
  </div>

  <!-- Heatmap -->
  <div class="card">
    <div class="card-title">DAILY FASTING HEATMAP</div>
    <div class="heatmap-wrap">${heatmapSVG(data.dailyHeatmap)}</div>
    <div class="heatmap-legend">
      <div class="legend-item"><div class="legend-dot" style="background:#1c1009;border:1px solid #2a1a0a;"></div> No fast</div>
      <div class="legend-item"><div class="legend-dot" style="background:#a0c89f;"></div> &lt;12h</div>
      <div class="legend-item"><div class="legend-dot" style="background:#7AAE79;"></div> 12-16h</div>
      <div class="legend-item"><div class="legend-dot" style="background:#5B8C5A;"></div> 16h+ (deep)</div>
    </div>
  </div>

  <!-- Fasting breakdown -->
  <div class="two-col">
    <div class="card">
      <div class="card-title">DEEP FASTS (16h+)</div>
      <div class="stat-val">${data.deepFasts16h}</div>
      <div style="font-size:11px;color:#7a6040;margin-top:4px;">Out of ${data.completedFasts} total fasts</div>
    </div>
    <div class="card">
      <div class="card-title">CIRCADIAN ALIGNMENT</div>
      <div class="stat-val">${data.circadianPct}%</div>
      <div style="font-size:11px;color:#7a6040;margin-top:4px;">Overnight fasting overlap</div>
    </div>
  </div>

  ${data.weightLogs.length >= 2 ? `
  <!-- Weight chart -->
  <div class="card">
    <div class="card-title">WEIGHT TREND</div>
    <div class="weight-chart">${weightChartSVG(data.weightLogs)}</div>
  </div>
  ` : ''}

  <!-- Health estimates -->
  <div class="stats-grid">
    <div class="stat-box">
      <div class="stat-val" style="color:#E8913A;">${data.fatBurnedGrams}g</div>
      <div class="stat-label">Fat burned (est.)</div>
    </div>
    <div class="stat-box">
      <div class="stat-val" style="color:#7B68AE;">${data.autophagyHours}h</div>
      <div class="stat-label">Autophagy hours</div>
    </div>
    <div class="stat-box">
      <div class="stat-val" style="color:#2E86AB;">${data.insulinSensitivity}/100</div>
      <div class="stat-label">Insulin sensitivity</div>
    </div>
  </div>
</div>

<!-- ═══════════════ PAGE 3: DAILY HABITS ═══════════════ -->
<div class="page">
  <div class="header">
    <div class="brand">✦ A A Y U</div>
    <div class="month-title">Daily Habits</div>
    <div class="sub-meta">${data.monthLabel}</div>
  </div>

  <div class="two-col">
    <div class="card">
      <div class="card-title">WATER INTAKE</div>
      <div class="stat-val">${data.avgWaterMl >= 1000 ? (data.avgWaterMl / 1000).toFixed(1) + 'L' : data.avgWaterMl + 'ml'}</div>
      <div style="font-size:11px;color:#7a6040;">avg/day ${delta(data.avgWaterMl, prevWater, 'ml', 0)}</div>
      <div style="font-size:11px;color:#5B8C5A;margin-top:4px;">${data.waterDaysOnTarget} days on target</div>
    </div>
    <div class="card">
      <div class="card-title">STEPS</div>
      <div class="stat-val">${data.avgSteps >= 1000 ? (data.avgSteps / 1000).toFixed(1) + 'k' : data.avgSteps}</div>
      <div style="font-size:11px;color:#7a6040;">avg/day ${delta(data.avgSteps, prevSteps, '', 0)}</div>
      <div style="font-size:11px;color:#5B8C5A;margin-top:4px;">${data.stepsDaysOnTarget} days on target</div>
    </div>
  </div>

  ${data.bmiStart !== null || data.bmiEnd !== null ? `
  <div class="two-col" style="margin-top:4px;">
    ${data.bmiStart !== null ? `
    <div class="card">
      <div class="card-title">BMI (START)</div>
      <div class="stat-val">${data.bmiStart!.toFixed(1)}</div>
    </div>
    ` : '<div></div>'}
    ${data.bmiEnd !== null ? `
    <div class="card">
      <div class="card-title">BMI (END)</div>
      <div class="stat-val">${data.bmiEnd!.toFixed(1)}</div>
    </div>
    ` : '<div></div>'}
  </div>
  ` : ''}

  ${data.sinceStart ? `
  <!-- Since you started -->
  <div class="since-box">
    <div class="since-title">SINCE YOU STARTED (${data.sinceStart.totalMonths} MONTHS)</div>
    <div class="since-grid">
      <div class="since-stat">
        <div class="since-val">${data.sinceStart.totalFasts}</div>
        <div class="since-label">Total fasts</div>
      </div>
      <div class="since-stat">
        <div class="since-val">${data.sinceStart.totalHours}h</div>
        <div class="since-label">Hours fasted</div>
      </div>
      ${data.sinceStart.totalWeightLost !== null ? `
      <div class="since-stat">
        <div class="since-val">-${data.sinceStart.totalWeightLost.toFixed(1)}kg</div>
        <div class="since-label">Weight lost</div>
      </div>
      ` : `
      <div class="since-stat">
        <div class="since-val">${data.sinceStart.totalMonths}</div>
        <div class="since-label">Months strong</div>
      </div>
      `}
    </div>
  </div>
  ` : ''}
</div>

<!-- ═══════════════ PAGE 4: INSIGHTS ═══════════════ -->
<div class="page">
  <div class="header">
    <div class="brand">✦ A A Y U</div>
    <div class="month-title">Insights & Recommendations</div>
    <div class="sub-meta">${data.monthLabel}</div>
  </div>

  ${data.insights.length > 0 ? `
  <div class="card">
    <div class="card-title">YOUR MONTH IN REVIEW</div>
    ${data.insights.map(i => `<div class="insight-item"><span class="insight-bullet">✦</span>${i}</div>`).join('\n')}
  </div>
  ` : ''}

  <div class="reco-box">
    <div class="reco-title">RECOMMENDATION FOR NEXT MONTH</div>
    <div class="reco-text">${data.recommendation}</div>
  </div>

  ${data.prevMonth ? `
  <div class="card" style="margin-top:12px;">
    <div class="card-title">MONTH-OVER-MONTH COMPARISON</div>
    <table style="width:100%;font-size:12px;border-collapse:collapse;">
      <tr style="color:#7a6040;border-bottom:1px solid #1c1009;">
        <td style="padding:6px 0;">Metric</td>
        <td style="text-align:right;">Last month</td>
        <td style="text-align:right;">This month</td>
        <td style="text-align:right;">Change</td>
      </tr>
      <tr style="border-bottom:1px solid #1c1009;">
        <td style="padding:6px 0;">Metabolic Score</td>
        <td style="text-align:right;">${data.prevMonth.metabolicScore}</td>
        <td style="text-align:right;font-weight:700;">${data.metabolicScore}</td>
        <td style="text-align:right;">${delta(data.metabolicScore, data.prevMonth.metabolicScore, '', 0)}</td>
      </tr>
      <tr style="border-bottom:1px solid #1c1009;">
        <td style="padding:6px 0;">Fasts completed</td>
        <td style="text-align:right;">${data.prevMonth.totalFasts}</td>
        <td style="text-align:right;font-weight:700;">${data.completedFasts}</td>
        <td style="text-align:right;">${delta(data.completedFasts, data.prevMonth.totalFasts, '', 0)}</td>
      </tr>
      <tr style="border-bottom:1px solid #1c1009;">
        <td style="padding:6px 0;">Avg fast (hours)</td>
        <td style="text-align:right;">${data.prevMonth.avgFastDuration.toFixed(1)}</td>
        <td style="text-align:right;font-weight:700;">${data.avgFastDuration}</td>
        <td style="text-align:right;">${delta(data.avgFastDuration, data.prevMonth.avgFastDuration, 'h')}</td>
      </tr>
      <tr style="border-bottom:1px solid #1c1009;">
        <td style="padding:6px 0;">Completion rate</td>
        <td style="text-align:right;">${data.prevMonth.completionRate}%</td>
        <td style="text-align:right;font-weight:700;">${data.completionRate}%</td>
        <td style="text-align:right;">${delta(data.completionRate, data.prevMonth.completionRate, '%', 0)}</td>
      </tr>
      ${data.prevMonth.weightEnd !== null && data.weightEnd !== null ? `
      <tr>
        <td style="padding:6px 0;">Weight</td>
        <td style="text-align:right;">${data.prevMonth.weightEnd.toFixed(1)}kg</td>
        <td style="text-align:right;font-weight:700;">${data.weightEnd.toFixed(1)}kg</td>
        <td style="text-align:right;">${weightDelta(data.weightEnd, data.prevMonth.weightEnd)}</td>
      </tr>
      ` : ''}
    </table>
  </div>
  ` : `
  <div class="card" style="margin-top:12px;text-align:center;padding:24px;">
    <div style="font-size:32px;margin-bottom:8px;">🎉</div>
    <div style="font-size:15px;font-weight:600;margin-bottom:4px;">Your first month with Aayu!</div>
    <div style="font-size:12px;color:#7a6040;">Next month's report will show your progress compared to this baseline.</div>
  </div>
  `}

  <div class="footer">
    <div>Generated by <span class="footer-brand">Aayu</span> on ${new Date(data.generatedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</div>
    <div style="margin-top:4px;">This report is for informational purposes only and does not constitute medical advice.</div>
  </div>
</div>

</body>
</html>`;
}
