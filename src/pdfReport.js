export function buildFullPdfReport({ report = {}, state = {}, config = {}, logoSrc = '', formatNumber, formatMoney } = {}) {
  const number = formatNumber || ((value) => Math.round(Number(value) || 0).toLocaleString('he-IL'));
  const money = formatMoney || ((value) => `₪${number(value)}`);
  const customerName = state.leadName || 'משפחת לקוח';
  const address = state.address || 'כתובת הגג שהוזנה בבדיקה';
  const defaultPhone = digitsOnly(config.defaultPhone || '972547299727');
  const whatsappUrl = `https://wa.me/${defaultPhone}`;
  const logo = logoSrc
    ? `<img class="brandLogo" src="${escapeAttribute(logoSrc)}" alt="Solatrix Energy" />`
    : '<div class="textLogo">SOLATRIX<small>ENERGY</small></div>';

  const isResidential = Boolean(report.isResidential);
  const modeLabel = isResidential ? 'מערכת ביתית' : 'מערכת תעשייתית';
  const tariffText = isResidential
    ? `${Math.round((report.selfUseShare || 0) * 100)}% צריכה עצמית לפי ₪${Number(config.residentialBuyRate || 0.64).toFixed(2)}, והיתרה לפי ₪${Number(config.residentialExportRate || 0.48).toFixed(2)}`
    : `כל הייצור מחושב לפי תעריף ממוצע של ₪${Number(config.industrialExportRate || 0.39).toFixed(2)} לקוט״ש`;

  return `<!doctype html>
<html lang="he" dir="rtl">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Solatrix Roof Check</title>
<style>
@page{size:A4;margin:0}*{box-sizing:border-box}html{direction:rtl}body{margin:0;background:#eee;color:#071b2f;font-family:Assistant,"Noto Sans Hebrew",Arial,sans-serif;-webkit-print-color-adjust:exact;print-color-adjust:exact}.page{width:210mm;height:297mm;position:relative;overflow:hidden;background:#fffdf8;page-break-after:always}.inner{padding:14mm 15mm 16mm;height:100%;position:relative;z-index:2}.glow{position:absolute;right:-28mm;bottom:-36mm;width:125mm;height:125mm;border-radius:50%;background:radial-gradient(circle,rgba(245,161,26,.25),transparent 70%)}.header{display:flex;justify-content:space-between;align-items:center;padding-bottom:6mm;margin-bottom:7mm;border-bottom:1.4px solid rgba(245,161,26,.48)}.brandLogo{width:142px;max-height:54px;object-fit:contain}.docType{font-size:12px;color:#6d7b88;font-weight:900}.footer{position:absolute;left:15mm;right:15mm;bottom:7mm;height:11mm;display:flex;justify-content:space-between;align-items:center;border-top:1px solid rgba(7,27,47,.09);padding-top:3.5mm;font-size:12px;color:#6d7b88;font-weight:850}.footer b{font-size:20px;color:#f5a11a}h1,h2,h3,p{margin:0}h1{font-size:50px;line-height:1;font-weight:950}h2{font-size:31px;line-height:1.08;font-weight:950}h3{font-size:19px;font-weight:950}.lead{font-size:17px;line-height:1.45;color:#465564;font-weight:760}.kicker{font-size:13px;letter-spacing:.09em;text-transform:uppercase;color:#a96a05;font-weight:950;direction:ltr}.accent{color:#f5a11a}.grid4{display:grid;grid-template-columns:repeat(4,1fr);gap:3.5mm}.grid2{display:grid;grid-template-columns:1fr 1fr;gap:5mm}.card{background:#fff;border:1px solid #eadbc7;border-radius:20px;padding:5mm;box-shadow:0 10px 25px rgba(7,27,47,.055)}.metric{text-align:center;display:grid;align-content:center;min-height:34mm}.metric span{font-weight:900;color:#6d7b88;font-size:13px}.metric b{display:block;font-size:23px;font-weight:950;direction:ltr}.note{background:linear-gradient(135deg,#fff3dc,#fff);border:1px solid #eadbc7;border-radius:20px;padding:5mm 6mm;color:#465564;font-size:16px;line-height:1.43;font-weight:770}.dark{background:linear-gradient(135deg,#071b2f,#0c3150);color:white;border-radius:26px;padding:7mm}.dark h2{color:white}.fact{display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid #eadbc7;padding:3mm 0}.fact:last-child{border-bottom:0}.fact span{color:#6d7b88;font-weight:850}.fact b{font-size:18px;direction:ltr}.dark .fact{border-bottom-color:rgba(255,255,255,.14)}.dark .fact span{color:#dbe7ef}.dark .fact b{color:#ffc86b}.formula{direction:ltr;text-align:left;font-weight:900;color:#071b2f;background:#fff3dc;border-radius:14px;padding:4mm;font-size:15px}.timeline{display:grid;gap:3mm}.timeRow{display:grid;grid-template-columns:27mm 1fr 37mm;gap:4mm;align-items:center;background:#fff;border:1px solid #eadbc7;border-radius:16px;padding:3.5mm}.timeBar{height:6mm;border-radius:999px;background:linear-gradient(90deg,#f5a11a,#ffc86b)}.timeRow span{font-weight:900;color:#6d7b88}.timeRow b{font-size:17px;direction:ltr}.cta{margin-top:7mm;background:linear-gradient(135deg,#071b2f,#0c3150);color:white;border-radius:22px;padding:6mm;display:grid;grid-template-columns:1.1fr .9fr;gap:6mm;align-items:center}.cta h2{color:white}.cta a{color:white;text-decoration:none;font-weight:900}.whatsapp{display:inline-flex;margin-top:3mm;background:#25D366;border-radius:999px;padding:9px 16px}.badge{display:inline-block;background:#fff3dc;color:#a96a05;border:1px solid #eadbc7;border-radius:999px;padding:8px 14px;font-weight:950}@media print{body{background:white}.page{margin:0;box-shadow:none}}@media screen{.page{margin:0 auto 24px;box-shadow:0 22px 70px rgba(7,27,47,.13)}}
</style>
</head>
<body>
<section class="page"><div class="glow"></div><div class="inner">
<div class="header"><div>${logo}</div><div class="docType">בדיקת גג סולארית ראשונית</div></div>
<div class="kicker">Transparent calculation</div><h1 style="margin-top:3mm">הגג שלכם<br><span class="accent">יכול לייצר ערך</span></h1>
<p class="lead" style="margin-top:4mm;max-width:155mm">הדוח מציג את הייצור, התעריף וההחזר לפי מודל נפרד למערכות ביתיות ולמערכות תעשייתיות.</p>
<div class="grid4" style="margin-top:8mm"><div class="card metric"><span>סוג החישוב</span><b>${modeLabel}</b></div><div class="card metric"><span>הספק DC</span><b>${Number(report.systemKw || 0).toFixed(1)} kWp</b></div><div class="card metric"><span>ערך שנה 1</span><b>${money(report.annualSavings)}</b></div><div class="card metric"><span>החזר כולל מע״מ</span><b>${Number(report.paybackWithVat || 0).toFixed(1)} שנים</b></div></div>
<div class="grid2" style="margin-top:7mm"><div class="dark"><h2>המספרים המרכזיים</h2><div class="fact"><span>עלות לפני מע״מ</span><b>${money(report.costBeforeVat)}</b></div><div class="fact"><span>עלות כולל מע״מ</span><b>${money(report.costWithVat)}</b></div><div class="fact"><span>ייצור שנה 1</span><b>${number(report.annualProduction)} kWh</b></div><div class="fact"><span>ערך ממוצע לקוט״ש</span><b>₪${Number(report.effectiveTariff || 0).toFixed(3)}</b></div></div><div class="card"><h3>איך חושב הערך השנתי?</h3><p class="lead" style="font-size:15px;margin-top:3mm">${tariffText}.</p><div class="formula" style="margin-top:5mm">${number(report.annualProduction)} × ₪${Number(report.effectiveTariff || 0).toFixed(3)} = ${money(report.annualSavings)}</div></div></div>
<div class="note" style="margin-top:6mm">הייצור בשנה הראשונה מחושב לפי ${number(config.productionPerKwp || 1650)} קוט״ש לכל kWp מותקן. החל מהשנה השנייה נלקחת ירידת תפוקה של 0.4% בכל שנה.</div>
</div><div class="footer"><span>חישוב נפרד לבית ולתעשייה</span><b>01</b></div></section>

<section class="page"><div class="glow"></div><div class="inner">
<div class="header"><div>${logo}</div><div class="docType">בסיס החישוב</div></div>
<div class="kicker">Calculation basis</div><h2 style="margin-top:3mm">כל ההנחות במקום אחד</h2>
<div class="grid2" style="margin-top:7mm"><div class="card"><div class="fact"><span>שם לקוח</span><b>${escapeHtml(customerName)}</b></div><div class="fact"><span>כתובת</span><b>${escapeHtml(address)}</b></div><div class="fact"><span>שטח גג</span><b>${number(report.roofArea)} מ״ר</b></div><div class="fact"><span>שטח שימושי</span><b>${number(report.usableArea)} מ״ר</b></div><div class="fact"><span>מספר פאנלים</span><b>${number(report.panels)}</b></div></div><div class="card"><div class="fact"><span>ייצור שנה 1</span><b>${number(report.annualProduction)} kWh</b></div><div class="fact"><span>ייצור מצטבר 25 שנים</span><b>${number(report.totalProduction25)} kWh</b></div><div class="fact"><span>ירידת תפוקה</span><b>0.4% לשנה</b></div><div class="fact"><span>תעריף בשימוש</span><b>₪${Number(report.tariffUsed || 0).toFixed(2)}</b></div><div class="fact"><span>ערך ממוצע 25 שנים</span><b>₪${Number(report.avgTariff25 || 0).toFixed(3)}</b></div></div></div>
<div class="note" style="margin-top:7mm"><span class="badge">${modeLabel}</span><p class="lead" style="margin-top:4mm">${isResidential ? 'המערכת הביתית מחושבת עד 22.5 kWp. ההכנסה משלבת צריכה עצמית ומכירת יתרת הייצור לרשת.' : 'מערכת מעל 22.5 kWp מחושבת במסלול תעשייתי, לפי תעריף ממוצע של 0.39 ₪ לכל קוט״ש מיוצר.'}</p></div>
<div class="card" style="margin-top:7mm"><h3>הפרדת המושגים הטכניים</h3><p class="lead" style="margin-top:3mm">הייצור מחושב לפי הספק הפאנלים המותקן ב-DC. הספק הממיר והגבלת ההזרמה לרשת הם נתונים טכניים נפרדים, שאותם מאמתים בתכנון ההנדסי הסופי.</p></div>
</div><div class="footer"><span>תעריף, ייצור והנחות שקופות</span><b>02</b></div></section>

<section class="page"><div class="glow"></div><div class="inner">
<div class="header"><div>${logo}</div><div class="docType">תחזית ל-25 שנים</div></div>
<div class="kicker">25 year view</div><h2 style="margin-top:3mm">הייצור יורד בהדרגה, לא נשאר קבוע</h2>
<p class="lead" style="margin-top:4mm">התחזית משתמשת בירידת תפוקה שנתית של 0.4%. אין הנחת עלייה אוטומטית בתעריפים.</p>
<div class="timeline" style="margin-top:7mm"><div class="timeRow"><span>שנה 1</span><div class="timeBar" style="width:100%"></div><b>${number(report.yearly?.[0]?.productionKwh || report.annualProduction)} kWh</b></div><div class="timeRow"><span>שנה 5</span><div class="timeBar" style="width:98.4%"></div><b>${number(report.yearly?.[4]?.productionKwh)} kWh</b></div><div class="timeRow"><span>שנה 10</span><div class="timeBar" style="width:96.5%"></div><b>${number(report.yearly?.[9]?.productionKwh)} kWh</b></div><div class="timeRow"><span>שנה 15</span><div class="timeBar" style="width:94.5%"></div><b>${number(report.yearly?.[14]?.productionKwh)} kWh</b></div><div class="timeRow"><span>שנה 25</span><div class="timeBar" style="width:90.8%"></div><b>${number(report.yearly?.[24]?.productionKwh)} kWh</b></div></div>
<div class="grid2" style="margin-top:7mm"><div class="dark"><h2>תוצאה מצטברת</h2><div class="fact"><span>ערך ברוטו 25 שנים</span><b>${money(report.gross25)}</b></div><div class="fact"><span>רווח לאחר השקעה כולל מע״מ</span><b>${money(report.profit25WithVat)}</b></div></div><div class="card"><h3>לפני הצעה סופית בודקים</h3><p class="lead" style="font-size:15px;margin-top:3mm">הצללות, מצב הגג, הספק הממיר, תנאי החיבור, הגבלת הזרמה, מסלול התעריף והעלות הסופית של ההתקנה.</p></div></div>
<div class="cta"><div><h2>השלב הבא הוא בדיקה מקצועית</h2><p class="lead" style="color:#dbe7ef;font-size:14px;margin-top:2mm">הדוח הוא הערכה ראשונית ולא הצעה מחייבת.</p><a class="whatsapp" href="${escapeAttribute(whatsappUrl)}" target="_blank" rel="noopener">WhatsApp · דברו איתנו</a></div><div><a href="tel:+${defaultPhone}">☎ 054-729-9727</a><br><a href="mailto:info@solatrix.energy">✉ info@solatrix.energy</a><br><a href="https://solatrix.energy" target="_blank" rel="noopener">🌐 solatrix.energy</a></div></div>
</div><div class="footer"><span>הערכה שקופה לפני תכנון סופי</span><b>03</b></div></section>
</body></html>`;
}

function digitsOnly(value) {
  return String(value || '').replace(/\D/g, '');
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[character]));
}

function escapeAttribute(value) {
  return escapeHtml(value).replace(/`/g, '&#96;');
}
