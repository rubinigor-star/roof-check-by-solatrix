export function buildFullPdfReport({ report, state, config, logoSrc, formatNumber, formatMoney }) {
  const customer = state.leadName || 'לקוח Solatrix';
  const address = state.address || 'כתובת לא הוזנה';
  const obstacles = state.obstacles.length ? state.obstacles.join(', ') : 'לא סומנו מכשולים משמעותיים';
  const selfWidth = Math.max(8, Math.min(92, report.selfUseShare || 0));
  const exportWidth = Math.max(8, 100 - selfWidth);
  const score = solarScore(report, state);
  const monthData = monthlyProduction(report);
  const monthMax = Math.max(...monthData.map((m) => m.value), 1);
  const roofSvg = roofDrawing(state);
  const monthsHtml = monthData.map((m) => `<div class="month"><b>${m.month}</b><i style="height:${Math.max(18, m.value / monthMax * 100)}%"></i><span>${formatNumber(m.value)}</span></div>`).join('');
  const metrics = [
    ['Solar Score', `${score.score}/100 · ${score.label}`],
    ['גודל מערכת מומלץ', `${report.systemKw.toFixed(1)} kW`],
    ['מספר פאנלים משוער', `${report.panels}`],
    ['שטח גג שימושי', `${formatNumber(report.usableArea)} m²`],
    ['ייצור שנתי', `${formatNumber(report.annualProduction)} kWh`],
    ['חיסכון/הכנסה שנתית', `${formatMoney(report.annualSavings)}`],
    ['החזר השקעה', `${Number(report.payback).toFixed(1)} שנים`],
    ['רווח ל-25 שנה', `${formatMoney(report.profit25)}`]
  ].map(([k, v]) => `<div class="metric"><span>${k}</span><b>${v}</b></div>`).join('');
  const scenarios = [0.8, 1, 1.18].map((factor, i) => {
    const names = ['שמרני', 'מומלץ', 'מקסימלי'];
    return `<div class="scenario"><small>תרחיש</small><b>${names[i]}</b><strong>${(report.systemKw * factor).toFixed(1)} kW</strong><span>${formatMoney(report.annualSavings * factor)} לשנה</span></div>`;
  }).join('');
  const projectionRows = [1, 5, 10, 15, 20, 25].map((year) => {
    const base = -report.cost;
    const cumulative = base + report.annualSavings * year * Math.pow(1 + config.yearlyTariffGrowth, Math.max(0, year - 1) / 2);
    return `<tr><td>${year}</td><td>${formatMoney(report.annualSavings * Math.pow(1 + config.yearlyTariffGrowth, year - 1))}</td><td>${formatMoney(cumulative)}</td></tr>`;
  }).join('');
  return `<!doctype html><html dir="rtl"><head><meta charset="utf-8"><title>Solatrix Roof Report</title><style>
    @page{size:A4;margin:0}*{box-sizing:border-box}body{margin:0;background:#efe7d7;color:#101820;font-family:Assistant,Arial,sans-serif}.page{width:210mm;min-height:297mm;padding:17mm;page-break-after:always;background:#fff;position:relative;overflow:hidden}.cover{background:radial-gradient(circle at 18% 18%,rgba(255,191,84,.38),transparent 26%),linear-gradient(135deg,#071b2f,#123a5c);color:white}.logo{width:155px;background:white;border-radius:18px;padding:7px 13px}.cover h1{font-size:48px;line-height:.95;margin:54mm 0 8mm}.cover p{font-size:21px;color:#ffdfa7;margin:0}.cover .score{position:absolute;bottom:25mm;right:17mm;background:#f5a11a;color:#101820;border-radius:28px;padding:18px 24px;font-weight:950;font-size:28px}.sun{position:absolute;left:18mm;top:24mm;font-size:58px}.title{font-size:34px;line-height:1;margin:0 0 14mm;color:#071b2f}.subtitle{color:#6d6258;font-size:18px;font-weight:800;margin-top:-8mm;margin-bottom:10mm}.grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}.metric{background:#fff9ef;border:1px solid #eadbc7;border-radius:18px;padding:14px}.metric span{display:block;color:#6d6258;font-size:13px;font-weight:900;margin-bottom:6px}.metric b{display:block;font-size:22px;direction:ltr;text-align:right}.roofBox{background:linear-gradient(135deg,#071b2f,#123a5c);border-radius:26px;padding:14px;margin-bottom:12mm}.roofBox svg{width:100%;height:118mm;display:block}.legend{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}.legend div,.note{background:#fff7e8;border:1px solid #eadbc7;border-radius:16px;padding:12px;font-weight:900;color:#6d6258}.mix{height:28px;border-radius:999px;display:flex;overflow:hidden;background:#eee;margin:10mm 0 5mm}.mix i{background:linear-gradient(90deg,#f5a11a,#ffbf54)}.mix em{background:#071b2f}.scenarios{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-top:10mm}.scenario{background:#071b2f;color:white;border-radius:22px;padding:16px}.scenario small{color:#ffdfa7;font-weight:900}.scenario b{display:block;color:#ffbf54;font-size:24px}.scenario strong{display:block;font-size:30px;margin:8px 0;direction:ltr;text-align:right}.scenario span{font-weight:900}.months{height:116mm;display:grid;grid-template-columns:repeat(12,1fr);gap:7px;align-items:end}.month{height:100%;display:flex;flex-direction:column;align-items:center;justify-content:end;gap:6px}.month i{width:100%;border-radius:999px 999px 8px 8px;background:linear-gradient(180deg,#ffbf54,#f5a11a)}.month b,.month span{font-size:11px;font-weight:950}.financeTable{width:100%;border-collapse:separate;border-spacing:0 8px}.financeTable td,.financeTable th{background:#fff9ef;padding:12px;font-weight:900;text-align:right}.financeTable th{background:#071b2f;color:white}.steps{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:10mm}.step{background:#fff9ef;border:1px solid #eadbc7;border-radius:18px;padding:16px}.step b{display:block;font-size:22px;color:#071b2f;margin-bottom:6px}.footer{position:absolute;bottom:10mm;right:17mm;left:17mm;color:#6d6258;font-weight:900;border-top:1px solid #eadbc7;padding-top:8px}.noPrint{position:fixed;left:18px;bottom:18px;z-index:9;border:0;border-radius:999px;background:#25D366;color:white;padding:14px 20px;font-weight:950}@media print{.noPrint{display:none}body{background:white}}
  </style></head><body><button class="noPrint" onclick="window.print()">שמירה / הדפסה ל-PDF</button>
  <section class="page cover"><div class="sun">☀️</div><img class="logo" src="${logoSrc}"/><h1>דוח התאמה סולארי<br/>Solatrix Roof Assessment</h1><p>${customer}<br/>${address}</p><div class="score">Solar Score ${score.score}/100 · ${score.label}</div><div class="footer">Solatrix Energy · דוח דיגיטלי ראשוני</div></section>
  <section class="page"><h2 class="title">1. תקציר מנהלים</h2><p class="subtitle">הערכת פוטנציאל סולארי לפי שטח גג, צריכה חודשית, תעריף קנייה, תעריף מכירה והנחות תכנון ראשוניות.</p><div class="grid">${metrics}</div><div class="note" style="margin-top:12mm">המערכת המשוערת מתאימה להמשך בדיקה מקצועית. לפני ביצוע נדרש סיור טכני, בדיקת חשמל, מדידת שטח בפועל ואישור הנדסי.</div><div class="footer">Solatrix Energy · ${address}</div></section>
  <section class="page"><h2 class="title">2. ניתוח הגג והסימון</h2><p class="subtitle">זהו סימון הגג כפי שנבחר בכלי הדיגיטלי. בשלב חיבור מפות אמיתי יוחלף הרקע בתצלום לוויין אמיתי.</p><div class="roofBox">${roofSvg}</div><div class="legend"><div>שטח גג כולל: ${formatNumber(report.roofArea)} m²</div><div>שטח שימושי: ${formatNumber(report.usableArea)} m²</div><div>מכשולים: ${obstacles}</div></div><div class="footer">Roof marking preview · prepared for satellite map integration</div></section>
  <section class="page"><h2 class="title">3. מערכת ותמהיל כלכלי</h2><div class="grid"><div class="metric"><span>צריכה עצמית</span><b>${formatNumber(report.selfConsumed)} kWh</b></div><div class="metric"><span>מכירה לרשת</span><b>${formatNumber(report.exported)} kWh</b></div><div class="metric"><span>תעריף קנייה שנחסך</span><b>₪${config.buyRate}</b></div><div class="metric"><span>תעריף מכירה</span><b>₪${config.sellRate}</b></div></div><div class="mix"><i style="width:${selfWidth}%"></i><em style="width:${exportWidth}%"></em></div><p class="note">תעריף אפקטיבי מחושב: ₪${report.effectiveTariff.toFixed(2)} לקוט״ש. החלק הצהוב מייצג צריכה עצמית, החלק הכחול מייצג מכירה לרשת.</p><div class="scenarios">${scenarios}</div><div class="footer">Mixed tariff: self consumption + grid export</div></section>
  <section class="page"><h2 class="title">4. ייצור חודשי ותחזית פיננסית</h2><div class="months">${monthsHtml}</div><table class="financeTable"><tr><th>שנה</th><th>חיסכון שנתי משוער</th><th>תזרים מצטבר</th></tr>${projectionRows}</table><div class="footer">כולל הנחת עליית תעריפים 4% ודגרדציה 0.5% לשנה</div></section>
  <section class="page"><h2 class="title">5. המלצת Solatrix והשלבים הבאים</h2><div class="steps"><div class="step"><b>בדיקת שטח</b><span>אימות מידות, שיפועים, גישה לגג ומכשולים.</span></div><div class="step"><b>בדיקת חשמל</b><span>בדיקת לוח, חיבור, עומסים ואפשרות הזרמה.</span></div><div class="step"><b>תכנון מערכת</b><span>פריסת פאנלים, בחירת ממירים, בטיחות וניטור.</span></div><div class="step"><b>הצעת מחיר</b><span>הצעה סופית לאחר סיור ואישור נתונים.</span></div></div><div class="note" style="margin-top:14mm"><b>המלצה:</b> לפי הנתונים הראשוניים, הגג מתאים להמשך בדיקה מקצועית של Solatrix. מומלץ לתאם סיור ולבנות הצעה סופית עם פריסת פאנלים ואישורי חברת חשמל.</div><div class="footer">Solatrix Energy · WhatsApp ${config.defaultPhone}</div></section><script>setTimeout(()=>window.print(),500)</script></body></html>`;
}

function solarScore(report, state) {
  const roof = Math.max(0, Math.min(30, report.usableArea / 2.4));
  const production = Math.max(0, Math.min(24, report.annualProduction / 1000));
  const finance = Math.max(0, Math.min(26, 34 - Number(report.payback) * 3));
  const shadePenalty = state.obstacles.includes('shade') ? 8 : 0;
  const score = Math.round(Math.max(0, Math.min(100, roof + production + finance + 22 - shadePenalty)));
  const label = score >= 88 ? 'מצוין' : score >= 76 ? 'טוב מאוד' : score >= 62 ? 'טוב' : 'דורש בדיקה';
  return { score, label };
}

function monthlyProduction(report) {
  const weights = [0.06,0.07,0.085,0.095,0.105,0.115,0.12,0.115,0.1,0.085,0.065,0.055];
  const months = ['ינו׳','פבר׳','מרץ','אפר׳','מאי','יוני','יולי','אוג׳','ספט׳','אוק׳','נוב׳','דצמ׳'];
  return weights.map((weight, index) => ({ month: months[index], value: report.annualProduction * weight }));
}

function roofDrawing(state) {
  const polygons = state.surfaces.map((s) => `<polygon points="${s.points}" fill="rgba(245,161,26,.72)" stroke="white" stroke-width="1.6"/>`).join('');
  const pins = state.obstacles.map((_, i) => { const c = [[42,36],[66,56],[72,28],[35,64],[58,24]][i % 5]; return `<circle cx="${c[0]}" cy="${c[1]}" r="3.8" fill="white" stroke="#f5a11a" stroke-width="1.4"/>`; }).join('');
  return `<svg viewBox="0 0 100 100"><defs><pattern id="p" width="8" height="8" patternUnits="userSpaceOnUse"><path d="M8 0 L0 0 0 8" fill="none" stroke="rgba(255,255,255,.12)"/></pattern></defs><rect width="100" height="100" fill="#071b2f"/><rect width="100" height="100" fill="url(#p)"/><path d="M12 14 L86 9 L92 82 L18 90 Z" fill="rgba(255,255,255,.08)" stroke="rgba(255,255,255,.35)"/>${polygons}${pins}<text x="8" y="12" fill="#ffbf54" font-size="6" font-weight="900">N ↑</text></svg>`;
}
