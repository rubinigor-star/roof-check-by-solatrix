export function buildFullPdfReport({ report, state, config, logoSrc, formatNumber, formatMoney }) {
  const safeState = state || {};
  const safeReport = normalizeReport(report || {});
  const number = formatNumber || ((value) => Math.round(Number(value) || 0).toLocaleString('he-IL'));
  const money = formatMoney || ((value) => `₪${number(value)}`);
  const customerName = safeState.leadName || 'משפחת כהן';
  const address = safeState.address || 'רחוב הגפן 12, חיפה';
  const customerPhone = safeState.leadPhone || '';
  const defaultPhone = digitsOnly(config?.defaultPhone || '972547299727');
  const whatsappUrl = `https://wa.me/${defaultPhone}`;
  const logo = logoSrc
    ? `<img src="${escapeAttribute(logoSrc)}" alt="Solatrix Energy" />`
    : '<strong>Solatrix</strong><small>ENERGY</small>';

  const score = solarScore(safeReport, safeState);
  const confidence = confidenceScore(safeReport, safeState);
  const monthly = monthlyProduction(safeReport);
  const monthMax = Math.max(...monthly.map((m) => m.value), 1);
  const selfWidth = Math.max(8, Math.min(92, safeReport.selfUseShare));
  const exportWidth = 100 - selfWidth;
  const annualYield = safeReport.cost ? (safeReport.annualSavings / safeReport.cost * 100) : 0;
  const cumulative10 = projectionValue(10, safeReport, config);
  const cumulative25 = projectionValue(25, safeReport, config);
  const paybackPercent = Math.max(10, Math.min(92, 100 - safeReport.payback * 9));
  const obstacles = obstacleNames(safeState.obstacles || []);
  const mainDirection = mainRoofDirection(safeState);
  const options = [
    buildPlan('בסיס', 0.74, safeReport, money),
    buildPlan('מאוזן', 1, safeReport, money, true),
    buildPlan('מקסימום', 1.22, safeReport, money),
  ];

  const monthlyBars = monthly.map((m) => `
    <div class="month">
      <i style="height:${Math.max(12, (m.value / monthMax) * 100)}%"></i>
      <span>${m.month}</span>
    </div>`).join('');

  const summaryMetrics = [
    ['גודל מערכת מומלץ', `${safeReport.systemKw.toFixed(1)} kW`, iconPanel()],
    ['ייצור שנתי משוער', `${number(safeReport.annualProduction)} kWh`, iconSun()],
    ['חיסכון שנתי צפוי', money(safeReport.annualSavings), iconPiggy()],
    ['שטח גג שימושי', `${number(safeReport.usableArea)} מ״ר`, iconHome()],
    ['החזר השקעה משוער', `${safeReport.payback.toFixed(1)} שנים`, iconCycle()],
    ['רווח ב-25 שנה', money(safeReport.profit25), iconGrowth()],
  ].map(([label, value, icon]) => metricCard(label, value, icon)).join('');

  const roofMetrics = [
    ['שטח גג כולל', `${number(safeReport.roofArea)} מ״ר`, iconPanel()],
    ['שטח מתאים להתקנה', `${number(safeReport.usableArea)} מ״ר`, iconSunPanel()],
    ['כיוון עיקרי', mainDirection, iconCompass()],
    ['מכשולים על הגג', obstacles || 'לא סומנו חסמים', iconObstacle()],
  ].map(([label, value, icon]) => sideMetric(label, value, icon)).join('');

  const systemFeatures = [
    ['פאנלים סולאריים', `${safeReport.panels} פאנלים איכותיים`, 'הספק גבוה ונראות נקייה על הגג'],
    ['ממיר חכם', 'ממיר מותאם לגודל המערכת', 'ניהול יעיל של הייצור לאורך היום'],
    ['הכנה לסוללה', 'אפשרות להרחבה עתידית', 'שמירה על גמישות לבית ולצריכה'],
    ['אחריות וליווי', 'תהליך מסודר עד חיבור', 'שירות אישי ובדיקות לפני התקנה'],
  ].map(([title, value, text]) => featureCard(title, value, text)).join('');

  const trustCards = [
    ['בדיקה מקצועית לבית', 'אנחנו בודקים את הגג, החשמל והצריכה כדי להבין מה באמת נכון עבורכם.', iconSearchHome()],
    ['תכנון שמתאים למשפחה', 'לא מערכת גדולה מדי ולא קטנה מדי — פתרון שמתאים לחשבון החשמל ולבית שלכם.', iconDesign()],
    ['ליווי עד ההפעלה', 'מהשיחה הראשונה ועד מערכת פעילה, כולל הצעה סופית, תיאום והתקנה.', iconCheck()],
    ['שקיפות מלאה', 'מספרים ברורים, מחירים מובנים ותהליך שקל להבין לפני שמחליטים.', iconShield()],
  ].map(([title, text, icon]) => trustCard(title, text, icon)).join('');

  const timeline = [
    ['1', 'שיחה קצרה', 'מבינים את הצריכה והכתובת'],
    ['2', 'בדיקת גג', 'בודקים שטח, כיוון ומכשולים'],
    ['3', 'הצעה סופית', 'מקבלים מחיר ותכנון מדויקים'],
    ['4', 'התקנה וחיבור', 'מערכת פעילה ומעקב שוטף'],
  ].map(([n, title, text]) => timelineStep(n, title, text)).join('');

  const plans = options.map(planCard).join('');

  return `<!doctype html>
<html lang="he" dir="rtl">
<head>
<meta charset="utf-8" />
<title>Solatrix Energy - הצעה סולארית לבית</title>
<style>
@page{size:A4;margin:0}
*{box-sizing:border-box}
:root{
  --navy:#062746;
  --navy2:#0b3a63;
  --gold:#f28a00;
  --gold2:#ffbf54;
  --paper:#fffaf0;
  --card:#fffdf8;
  --ink:#082846;
  --muted:#5e6f80;
  --line:#eadfcd;
  --green:#22b573;
}
html,body{margin:0;background:#eee;color:var(--ink);font-family:Assistant,"Noto Sans Hebrew",Arial,sans-serif;-webkit-print-color-adjust:exact;print-color-adjust:exact}
body{font-size:14px}
.page{width:210mm;height:297mm;position:relative;overflow:hidden;background:
  radial-gradient(circle at 18% 36%,rgba(242,138,0,.10),transparent 28%),
  linear-gradient(180deg,#fffaf0 0%,#fffdf8 58%,#fff4df 100%);
  padding:12mm 13mm 27mm;page-break-after:always}
.logo{position:absolute;top:10mm;right:12mm;width:48mm;height:20mm;display:flex;align-items:center;justify-content:flex-start;z-index:10}
.logo img{max-width:44mm;max-height:17mm;object-fit:contain}
.logo strong{font-size:24px;letter-spacing:-.03em;color:#000;line-height:.8}
.logo small{display:block;color:var(--gold);letter-spacing:.36em;font-size:8px;font-weight:900;margin-top:2px}
.pageNo{position:absolute;top:13mm;left:14mm;font-size:18px;font-weight:950;color:var(--navy);direction:ltr}
.pageNo::after{content:"";display:block;width:17mm;height:1px;background:var(--gold);margin-top:3mm}
.bottomWave{position:absolute;left:0;right:0;bottom:0;height:44mm;background:linear-gradient(135deg,#041c33,#07385f);clip-path:ellipse(76% 57% at 50% 100%);z-index:2}
.bottomWave::before{content:"";position:absolute;left:-5%;right:-5%;top:3mm;height:2mm;background:linear-gradient(90deg,var(--gold),var(--gold2));border-radius:99px}
.bottomFeatures{position:absolute;right:18mm;left:18mm;bottom:9mm;z-index:3;display:grid;grid-template-columns:1fr 1fr 1fr;gap:10mm;color:#fff;text-align:center}
.bottomFeatures .bf{display:grid;place-items:center;gap:2mm;font-size:13px;font-weight:900}
.bottomFeatures svg{width:13mm;height:13mm;color:#fff;border:1px solid rgba(255,255,255,.7);border-radius:50%;padding:3mm}
.heroTitle{margin:38mm auto 4mm;text-align:center;font-size:42px;line-height:1.1;font-weight:950;letter-spacing:-.04em;color:var(--navy);max-width:170mm}
.heroTitle .gold{color:var(--gold)}
.subtitle{text-align:center;font-size:19px;line-height:1.45;color:var(--navy);font-weight:760;margin:0 auto 8mm;max-width:160mm}
.card{background:rgba(255,255,255,.88);border:1px solid rgba(234,223,205,.9);border-radius:20px;box-shadow:0 16px 42px rgba(6,39,70,.10);backdrop-filter:blur(6px)}
.metricGrid{display:grid;grid-template-columns:repeat(3,1fr);gap:4mm;margin-top:8mm}
.metric{min-height:45mm;padding:7mm 5mm;text-align:center}
.metric .ico{width:18mm;height:18mm;margin:0 auto 3mm;border-radius:50%;background:#fff3de;color:var(--gold);display:grid;place-items:center}
.metric .ico svg{width:11mm;height:11mm}
.metric .label{font-size:15px;font-weight:900;color:var(--navy);min-height:9mm}
.metric .value{font-size:30px;line-height:1;font-weight:950;color:var(--gold);direction:ltr;text-align:center;margin-top:3mm}
.houseScene{position:absolute;right:0;left:0;bottom:39mm;height:128mm;background:linear-gradient(180deg,rgba(255,255,255,.06),rgba(255,250,240,.55)),radial-gradient(circle at 17% 74%,rgba(242,138,0,.42),transparent 16%),linear-gradient(150deg,#d7e8f0,#fff3d9 50%,#e7f4e8);overflow:hidden}
.houseScene::before{content:"";position:absolute;right:45mm;bottom:11mm;width:126mm;height:70mm;background:#f8f3e9;border-radius:5mm 5mm 0 0;box-shadow:0 20px 50px rgba(0,0,0,.22)}
.houseScene::after{content:"";position:absolute;right:39mm;bottom:79mm;width:137mm;height:43mm;background:linear-gradient(135deg,#1e3348,#364f67);clip-path:polygon(7% 100%,50% 0,94% 100%);box-shadow:0 12px 24px rgba(0,0,0,.25)}
.panelRows{position:absolute;right:66mm;bottom:95mm;width:83mm;height:29mm;transform:skewX(-12deg) rotate(-1deg);display:grid;grid-template-columns:repeat(5,1fr);grid-template-rows:repeat(3,1fr);gap:1px;z-index:2}
.panelRows i{background:linear-gradient(145deg,#203b58,#314f70);border:1px solid rgba(255,255,255,.38)}
.familyBox{position:absolute;right:13mm;bottom:87mm;width:68mm;z-index:4;display:grid;gap:4mm}
.infoPill{height:23mm;padding:4mm 5mm;display:grid;grid-template-columns:15mm 1fr;align-items:center}
.infoPill .circle{width:12mm;height:12mm;border:1.5px solid var(--gold);border-radius:50%;display:grid;place-items:center;color:var(--gold)}
.infoPill small{display:block;color:var(--muted);font-weight:800}
.infoPill b{display:block;color:var(--navy);font-size:18px}
.scoreCircle{position:absolute;left:16mm;bottom:68mm;width:58mm;height:58mm;border-radius:50%;background:#fffaf0;border:3mm solid var(--gold);box-shadow:0 15px 36px rgba(0,0,0,.18);display:grid;place-items:center;text-align:center;z-index:4}
.scoreCircle small{display:block;font-size:12px;color:var(--navy);font-weight:900}
.scoreCircle b{display:block;font-size:42px;line-height:.9;color:var(--gold);font-weight:950;direction:ltr}
.scoreCircle span{font-size:13px;color:var(--gold);letter-spacing:.05em}
.contentTop{margin-top:34mm}
.sectionTitle{text-align:center;font-size:41px;line-height:1.05;font-weight:950;color:var(--navy);letter-spacing:-.04em;margin:0 0 4mm}
.sectionSubtitle{text-align:center;font-size:18px;color:var(--navy);font-weight:760;margin:0 auto 8mm;max-width:160mm}
.summaryStrip{display:grid;grid-template-columns:70mm 1fr;gap:5mm;margin-top:5mm;min-height:43mm}
.summaryStrip .photo{background:linear-gradient(150deg,#d7e8f0,#fff2d0);border-radius:17px;position:relative;overflow:hidden}
.summaryStrip .photo::before{content:"";position:absolute;right:8mm;bottom:4mm;width:55mm;height:27mm;background:#f8f3e9}
.summaryStrip .photo::after{content:"";position:absolute;right:6mm;bottom:30mm;width:60mm;height:20mm;background:#273f5b;clip-path:polygon(9% 100%,50% 0,92% 100%)}
.summaryNote{padding:6mm 7mm;font-size:18px;line-height:1.55;font-weight:760;color:var(--navy)}
.roofLayout{display:grid;grid-template-columns:1.5fr .85fr;gap:6mm;align-items:stretch}
.roofPhoto{height:170mm;border-radius:23px;position:relative;overflow:hidden;background:linear-gradient(150deg,#d7e8f0,#fff1d5 48%,#e7f3df)}
.roofPhoto .house{position:absolute;right:18mm;bottom:21mm;width:126mm;height:78mm;background:#f8f3e9;box-shadow:0 18px 46px rgba(0,0,0,.22)}
.roofPhoto .roof{position:absolute;right:10mm;bottom:99mm;width:138mm;height:50mm;background:#263f5a;clip-path:polygon(5% 100%,50% 0,96% 100%)}
.roofPhoto .pv{position:absolute;right:34mm;bottom:113mm;width:88mm;height:35mm;transform:skewX(-13deg) rotate(-2deg);display:grid;grid-template-columns:repeat(5,1fr);grid-template-rows:repeat(3,1fr);gap:1px;border:2px solid var(--gold);padding:1px;background:rgba(242,138,0,.2)}
.roofPhoto .pv i{background:#263f5a;border:1px solid rgba(255,255,255,.38)}
.tag{position:absolute;background:#fff;border-radius:8px;padding:2mm 4mm;color:var(--navy);font-size:13px;font-weight:900;box-shadow:0 8px 20px rgba(0,0,0,.12)}
.tag.one{right:55mm;top:34mm}.tag.two{right:8mm;top:74mm}.tag.three{left:18mm;bottom:64mm}
.sideMetrics{display:grid;gap:5mm}
.sideMetric{min-height:35mm;padding:5mm 6mm;display:grid;grid-template-columns:16mm 1fr;align-items:center;gap:3mm}
.sideMetric .ico{color:var(--gold)}
.sideMetric svg{width:12mm;height:12mm}
.sideMetric small{display:block;color:var(--navy);font-size:13px;font-weight:900}
.sideMetric b{display:block;color:var(--gold);font-size:25px;line-height:1.1;font-weight:950}
.finGrid{display:grid;grid-template-columns:repeat(4,1fr);gap:4mm;margin-bottom:7mm}
.finMetric{padding:6mm 3mm;text-align:center;min-height:42mm}
.finMetric .value{color:var(--gold);font-size:27px;font-weight:950;direction:ltr}
.finMetric .label{color:var(--navy);font-size:14px;font-weight:900}
.chartRow{display:grid;grid-template-columns:1.28fr .72fr;gap:6mm}
.chartBox{height:118mm;padding:6mm}
.chartTitle{font-size:18px;color:var(--navy);font-weight:950;text-align:center;margin-bottom:5mm}
.barChart{height:82mm;border-right:1px solid #b7c2cc;border-bottom:1px solid #b7c2cc;display:grid;grid-template-columns:repeat(4,1fr);gap:9mm;align-items:end;padding:5mm 7mm 0}
.barGroup{height:100%;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;gap:2mm}
.barGroup i{display:block;width:18mm;border-radius:10px 10px 0 0;background:linear-gradient(180deg,var(--gold2),var(--gold))}
.barGroup.negative i{background:linear-gradient(180deg,#ffb17f,#e86b2f)}
.barGroup b{font-size:11px;color:var(--navy);font-weight:900}
.barGroup span{font-size:11px;color:var(--navy);font-weight:900;direction:ltr}
.meaning{padding:8mm 7mm;background:linear-gradient(180deg,#fff8eb,#fffdf8)}
.meaning h3{font-size:23px;margin:0 0 6mm;color:var(--navy)}
.checkLine{display:grid;grid-template-columns:10mm 1fr;gap:3mm;align-items:start;margin:6mm 0;color:var(--navy);font-size:16px;font-weight:760;line-height:1.4}
.checkLine i{width:8mm;height:8mm;border-radius:50%;background:var(--gold);color:#fff;display:grid;place-items:center;font-style:normal;font-weight:900}
.energyLayout{display:grid;grid-template-columns:1.45fr .7fr;gap:6mm}
.monthBox{height:133mm;padding:6mm}
.monthChart{height:85mm;display:grid;grid-template-columns:repeat(12,1fr);gap:2mm;align-items:end;border-right:1px solid #c4ccd5;border-bottom:1px solid #c4ccd5;padding:4mm 4mm 0}
.month{height:100%;display:flex;flex-direction:column;justify-content:flex-end;align-items:center;gap:1.5mm}
.month i{width:100%;border-radius:99px 99px 0 0;background:linear-gradient(180deg,var(--gold2),var(--gold))}
.month span{font-size:8px;color:var(--navy);font-weight:900}
.donutBox{padding:6mm;text-align:center}
.donut{width:54mm;height:54mm;border-radius:50%;margin:0 auto 5mm;background:conic-gradient(var(--gold) 0 ${selfWidth}%,var(--navy) ${selfWidth}% 100%);display:grid;place-items:center}
.donut::after{content:"";width:31mm;height:31mm;background:#fffaf0;border-radius:50%;box-shadow:inset 0 0 0 1px var(--line)}
.kpiList{display:grid;gap:4mm}
.kpi{padding:5mm;text-align:center}
.kpi b{display:block;font-size:28px;color:var(--gold);font-weight:950;direction:ltr}
.kpi span{font-size:14px;color:var(--navy);font-weight:900}
.systemHero{height:83mm;position:relative;background:linear-gradient(150deg,#d7e8f0,#fff2d4);border-radius:24px;overflow:hidden;margin-bottom:6mm}
.systemHero::before{content:"";position:absolute;right:83mm;bottom:8mm;width:88mm;height:47mm;background:#f8f3e9}
.systemHero::after{content:"";position:absolute;right:78mm;bottom:55mm;width:96mm;height:31mm;background:#263f5a;clip-path:polygon(8% 100%,50% 0,93% 100%)}
.systemBadge{position:absolute;right:8mm;top:12mm;width:57mm;min-height:55mm;text-align:center;padding:7mm 4mm;border:2px solid var(--gold);background:#fffaf0;border-radius:19px;z-index:3}
.systemBadge small{display:block;color:var(--navy);font-size:15px;font-weight:900}
.systemBadge b{display:block;color:var(--gold);font-size:42px;line-height:1;font-weight:950;direction:ltr}
.featureGrid{display:grid;grid-template-columns:repeat(4,1fr);gap:3mm}
.feature{padding:5mm 3mm;text-align:center;min-height:48mm}
.feature b{display:block;color:var(--navy);font-size:15px;margin-bottom:2mm}
.feature span{display:block;color:var(--muted);font-size:11px;line-height:1.35;font-weight:760}
.trustGrid{display:grid;grid-template-columns:repeat(4,1fr);gap:4mm}
.trust{padding:6mm 4mm;text-align:center;min-height:76mm}
.trust .ico{color:var(--gold);margin-bottom:4mm}
.trust svg{width:15mm;height:15mm}
.trust b{display:block;color:var(--navy);font-size:15px;margin-bottom:3mm}
.trust span{display:block;color:var(--muted);font-size:12px;line-height:1.45;font-weight:760}
.timeline{margin-top:8mm;padding:7mm;display:grid;grid-template-columns:repeat(4,1fr);gap:4mm}
.step{text-align:center;position:relative}
.step i{width:10mm;height:10mm;border-radius:50%;background:var(--gold);color:#fff;display:grid;place-items:center;margin:0 auto 3mm;font-style:normal;font-weight:950}
.step b{display:block;color:var(--navy);font-size:14px}
.step span{display:block;color:var(--muted);font-size:11px;line-height:1.35;margin-top:1mm}
.planGrid{display:grid;grid-template-columns:repeat(3,1fr);gap:5mm;margin-top:8mm}
.plan{min-height:132mm;padding:7mm 5mm;text-align:center;position:relative}
.plan.recommended{border:2px solid var(--gold);transform:translateY(-3mm)}
.plan .tagRec{position:absolute;top:-8mm;right:50%;transform:translateX(50%);background:linear-gradient(135deg,var(--gold),var(--gold2));color:#fff;border-radius:99px;padding:2.5mm 8mm;font-weight:950}
.plan .icon{color:var(--gold);margin-bottom:4mm}
.plan svg{width:17mm;height:17mm}
.plan h3{font-size:28px;color:var(--navy);margin:0 0 3mm}
.plan .desc{font-size:14px;color:var(--navy);font-weight:760;min-height:14mm}
.plan ul{list-style:none;padding:0;margin:6mm 0;display:grid;gap:3mm}
.plan li{font-size:12px;color:var(--navy);font-weight:760}
.plan li::before{content:"✓";color:var(--gold);font-weight:950;margin-left:2mm}
.plan .price{font-size:25px;color:var(--gold);font-weight:950;direction:ltr}
.ctaBox{margin-top:6mm;display:grid;grid-template-columns:68mm 1fr;gap:6mm;align-items:center;padding:5mm}
.ctaPhoto{height:38mm;border-radius:14px;background:linear-gradient(150deg,#d7e8f0,#fff2d4);position:relative;overflow:hidden}
.ctaPhoto::before{content:"";position:absolute;right:9mm;bottom:4mm;width:48mm;height:23mm;background:#f8f3e9}
.ctaPhoto::after{content:"";position:absolute;right:7mm;bottom:25mm;width:52mm;height:18mm;background:#263f5a;clip-path:polygon(8% 100%,50% 0,94% 100%)}
.ctaText h3{font-size:24px;margin:0 0 2mm;color:var(--navy)}
.ctaText p{font-size:14px;line-height:1.45;color:var(--navy);font-weight:760;margin:0 0 4mm}
.whatsapp{display:inline-flex;align-items:center;justify-content:center;background:#25D366;color:white;border-radius:999px;padding:4mm 10mm;font-size:17px;font-weight:950;text-decoration:none;box-shadow:0 12px 24px rgba(37,211,102,.22)}
.noPrint{position:fixed;left:18px;bottom:18px;z-index:1000;border:0;background:#25D366;color:#fff;border-radius:999px;padding:13px 20px;font-weight:950;box-shadow:0 12px 28px rgba(0,0,0,.18)}
@media print{body{background:white}.noPrint{display:none}.page{box-shadow:none}}
</style>
</head>
<body>
<button class="noPrint" onclick="window.print()">שמירה / הדפסה ל-PDF</button>

<section class="page">
  <div class="logo">${logo}</div>
  <div class="pageNo">01</div>
  <h1 class="heroTitle">הבית שלכם יכול<br>לייצר לכם <span class="gold">ערך</span> כל יום</h1>
  <p class="subtitle">פתרון סולארי מותאם לבית שלכם, לחיסכון בהוצאות ולשקט נפשי לאורך שנים.</p>
  <div class="houseScene"><div class="panelRows">${repeat('<i></i>', 15)}</div></div>
  <div class="familyBox">
    <div class="card infoPill"><div class="circle">${iconFamily()}</div><div><small>הוכן עבור</small><b>${escapeHtml(customerName)}</b></div></div>
    <div class="card infoPill"><div class="circle">${iconPin()}</div><div><small>כתובת הבית</small><b>${escapeHtml(address)}</b></div></div>
  </div>
  <div class="scoreCircle"><div><small>Solar Score</small><b>${score}</b><span>★★★★★</span></div></div>
  ${bottomFooter()}
</section>

<section class="page">
  <div class="logo">${logo}</div><div class="pageNo">02</div>
  <div class="contentTop">
    <h2 class="sectionTitle">סיכום קצר לבית שלכם</h2>
    <p class="sectionSubtitle">במבט אחד — כמה הבית יכול לייצר, לחסוך ולהחזיר לאורך השנים.</p>
    <div class="metricGrid">${summaryMetrics}</div>
    <div class="summaryStrip card">
      <div class="photo"></div>
      <div class="summaryNote">הנתונים מבוססים על בדיקה ראשונית של הגג והצריכה. בשלב הבא נבצע בדיקה מדויקת יותר ונבנה הצעה מלאה לבית שלכם.</div>
    </div>
  </div>
  ${bottomFooter()}
</section>

<section class="page">
  <div class="logo">${logo}</div><div class="pageNo">03</div>
  <div class="contentTop">
    <h2 class="sectionTitle">הגג הדיגיטלי שלכם</h2>
    <p class="sectionSubtitle">כך אנחנו רואים את פוטנציאל הייצור של הבית שלכם.</p>
    <div class="roofLayout">
      <div class="roofPhoto">
        <div class="roof"></div><div class="house"></div><div class="pv">${repeat('<i></i>', 15)}</div>
        <div class="tag one">דוד שמש</div><div class="tag two">אזור מתאים להתקנה</div><div class="tag three">מזגן</div>
      </div>
      <div class="sideMetrics">${roofMetrics}</div>
    </div>
  </div>
  ${bottomFooter()}
</section>

<section class="page">
  <div class="logo">${logo}</div><div class="pageNo">04</div>
  <div class="contentTop">
    <h2 class="sectionTitle">כמה זה שווה לכם לאורך זמן?</h2>
    <p class="sectionSubtitle">תמונה פשוטה וברורה של ההשקעה, החיסכון וההחזר.</p>
    <div class="finGrid">
      ${financeMetric('עלות מערכת משוערת', money(safeReport.cost), iconPanel())}
      ${financeMetric('חיסכון שנתי צפוי', money(safeReport.annualSavings), iconPiggy())}
      ${financeMetric('החזר השקעה', `${safeReport.payback.toFixed(1)} שנים`, iconCycle())}
      ${financeMetric('רווח מצטבר ב-25 שנה', money(safeReport.profit25), iconGrowth())}
    </div>
    <div class="chartRow">
      <div class="card chartBox">
        <div class="chartTitle">הערך שלכם לאורך זמן</div>
        <div class="barChart">
          <div class="barGroup negative"><span>${money(-safeReport.cost)}</span><i style="height:31%"></i><b>השקעה</b></div>
          <div class="barGroup"><span>${money(safeReport.annualSavings)}</span><i style="height:22%"></i><b>שנה 1</b></div>
          <div class="barGroup"><span>${money(cumulative10)}</span><i style="height:58%"></i><b>10 שנים</b></div>
          <div class="barGroup"><span>${money(cumulative25)}</span><i style="height:96%"></i><b>25 שנים</b></div>
        </div>
      </div>
      <div class="card meaning">
        <h3>מה זה אומר בפועל?</h3>
        <div class="checkLine"><i>✓</i><span>אתם מפחיתים משמעותית את חשבון החשמל.</span></div>
        <div class="checkLine"><i>✓</i><span>אתם בונים ערך אמיתי לנכס שלכם לאורך זמן.</span></div>
        <div class="checkLine"><i>✓</i><span>אתם יוצרים שקט וביטחון כלכלי למשפחה.</span></div>
      </div>
    </div>
  </div>
  ${bottomFooter()}
</section>

<section class="page">
  <div class="logo">${logo}</div><div class="pageNo">05</div>
  <div class="contentTop">
    <h2 class="sectionTitle">איך האנרגיה תעבוד עבור הבית שלכם</h2>
    <p class="sectionSubtitle">מתי הגג מייצר, כמה נשאר בבית וכמה נמכר לרשת.</p>
    <div class="energyLayout">
      <div class="card monthBox">
        <div class="chartTitle">ייצור חודשי משוער (kWh)</div>
        <div class="monthChart">${monthlyBars}</div>
        <div class="summaryNote" style="font-size:16px;padding:5mm 2mm 0">בימי שמש, הגג שלכם מייצר יותר חשמל ומספק חלק גדול מהצריכה הביתית. החשמל שנשאר נמכר לרשת ומייצר לכם הכנסה נוספת לאורך השנה.</div>
      </div>
      <div class="kpiList">
        <div class="card donutBox"><div class="chartTitle">חלוקת האנרגיה השנתית</div><div class="donut"></div><b style="color:var(--gold);font-size:22px">${Math.round(selfWidth)}%</b><span style="display:block;color:var(--navy);font-weight:900">שימוש עצמי</span></div>
        <div class="card kpi"><span>ייצור שנתי</span><b>${number(safeReport.annualProduction)} kWh</b></div>
        <div class="card kpi"><span>שימוש עצמי משוער</span><b>${number(safeReport.selfConsumed)} kWh</b></div>
        <div class="card kpi"><span>מכירה לרשת</span><b>${number(safeReport.exported)} kWh</b></div>
      </div>
    </div>
  </div>
  ${bottomFooter()}
</section>

<section class="page">
  <div class="logo">${logo}</div><div class="pageNo">06</div>
  <div class="contentTop">
    <h2 class="sectionTitle">המערכת המומלצת לבית שלכם</h2>
    <p class="sectionSubtitle">פתרון סולארי שמתאים לגודל הבית, לצריכה ולמראה של הגג.</p>
    <div class="systemHero"><div class="systemBadge"><small>מערכת מומלצת</small><b>${safeReport.systemKw.toFixed(1)}</b><small>kW</small></div></div>
    <div class="featureGrid">${systemFeatures}</div>
    <div class="summaryStrip card" style="grid-template-columns:1fr 60mm;margin-top:6mm">
      <div class="summaryNote"><b>מה מקבלים?</b><br>תכנון מותאם אישית, עבודה נקייה ומסודרת, ליווי מקצועי ותמיכה לאורך שנים.</div>
      <div class="scoreCircle" style="position:relative;left:auto;bottom:auto;width:42mm;height:42mm;border-width:2mm;margin:auto"><div><small>Solar Score</small><b style="font-size:30px">${score}</b><span>★★★★★</span></div></div>
    </div>
  </div>
  ${bottomFooter()}
</section>

<section class="page">
  <div class="logo">${logo}</div><div class="pageNo">07</div>
  <div class="contentTop">
    <h2 class="sectionTitle">למה לבחור ב‑Solatrix</h2>
    <p class="sectionSubtitle">לא רק מערכת סולארית — אלא תהליך ברור, אישי ומקצועי.</p>
    <div class="trustGrid">${trustCards}</div>
    <div class="card timeline">
      ${timeline}
    </div>
  </div>
  ${bottomFooter()}
</section>

<section class="page">
  <div class="logo">${logo}</div><div class="pageNo">08</div>
  <div class="contentTop">
    <h2 class="sectionTitle">השלב הבא לבית שלכם</h2>
    <p class="sectionSubtitle">בחרו את המסלול שמתאים לכם וקבלו בדיקה מלאה לבית.</p>
    <div class="planGrid">${plans}</div>
    <div class="card ctaBox">
      <div class="ctaPhoto"></div>
      <div class="ctaText">
        <h3>נעשה את הצעד הבא יחד</h3>
        <p>בדיקה קצרה בבית שלכם תאפשר לנו להבין את הצרכים המדויקים ולהכין לכם הצעה מותאמת אישית.</p>
        <a class="whatsapp" href="${whatsappUrl}">לתיאום בדיקה לבית שלכם</a>
        <p style="font-size:12px;margin-top:3mm">${customerPhone ? `טלפון לקוח: ${escapeHtml(customerPhone)} · ` : ''}Solatrix Energy</p>
      </div>
    </div>
  </div>
  ${bottomFooter()}
</section>

<script>setTimeout(() => window.print(), 650)</script>
</body>
</html>`;
}

function normalizeReport(report) {
  const annualProduction = Number(report.annualProduction || 0);
  const annualSavings = Number(report.annualSavings || 0);
  const cost = Number(report.cost || 0);
  const systemKw = Number(report.systemKw || 0);
  const effectiveTariff = Number(report.effectiveTariff || (annualProduction ? annualSavings / annualProduction : 0));
  const payback = Number(report.payback || (annualSavings ? cost / annualSavings : 0));
  return {
    ...report,
    systemKw,
    annualProduction,
    annualSavings,
    cost,
    effectiveTariff,
    payback,
    profit25: Number(report.profit25 || annualSavings * 25 - cost),
    panels: Number(report.panels || Math.max(1, Math.round(systemKw / 0.4))),
    roofArea: Number(report.roofArea || 80),
    usableArea: Number(report.usableArea || 55),
    selfConsumed: Number(report.selfConsumed || annualProduction * 0.44),
    exported: Number(report.exported || Math.max(0, annualProduction * 0.56)),
    selfUseShare: Number(report.selfUseShare || 44),
  };
}

function solarScore(report, state) {
  const roof = Math.max(0, Math.min(36, report.usableArea / 1.8));
  const production = Math.max(0, Math.min(28, report.annualProduction / 620));
  const finance = Math.max(0, Math.min(24, 36 - Number(report.payback || 0) * 4));
  const obstacles = Array.isArray(state.obstacles) ? state.obstacles : [];
  const shadePenalty = obstacles.includes('shade') ? 8 : 0;
  return Math.round(Math.max(62, Math.min(97, roof + production + finance + 16 - shadePenalty)));
}

function confidenceScore(report, state) {
  const points = [state.address, Array.isArray(state.surfaces) && state.surfaces.length, state.monthlyBill, report.annualProduction, report.cost].filter(Boolean).length;
  return Math.round(68 + points * 5.5);
}

function monthlyProduction(report) {
  const weights = [0.056,0.064,0.083,0.097,0.111,0.121,0.124,0.118,0.103,0.083,0.065,0.055];
  const months = ['ינו׳','פבר׳','מרץ','אפר׳','מאי','יוני','יולי','אוג׳','ספט׳','אוק׳','נוב׳','דצמ׳'];
  return weights.map((weight, index) => ({ month: months[index], value: report.annualProduction * weight }));
}

function projectionValue(year, report, config) {
  const growth = Number(config?.yearlyTariffGrowth ?? 0.04);
  let total = -report.cost;
  for (let i = 0; i < year; i += 1) total += report.annualSavings * Math.pow(1 + growth, i);
  return total;
}

function buildPlan(name, factor, report, money, recommended = false) {
  const systemKw = Math.max(1, report.systemKw * factor);
  const cost = Math.max(0, report.cost * factor);
  const annual = Math.max(0, report.annualSavings * factor * (factor > 1 ? 1.03 : 0.97));
  return { name, systemKw, cost, annual, payback: cost / Math.max(annual, 1), recommended, money };
}

function planCard(plan) {
  return `<div class="card plan ${plan.recommended ? 'recommended' : ''}">
    ${plan.recommended ? '<div class="tagRec">המומלץ ביותר</div>' : ''}
    <div class="icon">${iconHomeSun()}</div>
    <h3>${plan.name}</h3>
    <div class="desc">${plan.recommended ? 'האיזון הנכון בין חיסכון לתפוקה לאורך זמן' : plan.name === 'בסיס' ? 'מערכת קטנה להתחלה חכמה' : 'מערכת מורחבת מוכנה לעתיד'}</div>
    <ul><li>מערכת של ${plan.systemKw.toFixed(1)} kW</li><li>חיסכון שנתי: ${plan.money(plan.annual)}</li><li>החזר: ${plan.payback.toFixed(1)} שנים</li></ul>
    <div>החל מ‑</div><div class="price">${plan.money(plan.cost)}</div>
  </div>`;
}

function metricCard(label, value, icon) {
  return `<div class="card metric"><div class="ico">${icon}</div><div class="label">${label}</div><div class="value">${value}</div></div>`;
}

function sideMetric(label, value, icon) {
  return `<div class="card sideMetric"><div class="ico">${icon}</div><div><small>${label}</small><b>${value}</b></div></div>`;
}

function financeMetric(label, value, icon) {
  return `<div class="card finMetric"><div class="metricIcon">${icon}</div><div class="label">${label}</div><div class="value">${value}</div></div>`;
}

function featureCard(title, value, text) {
  return `<div class="card feature"><b>${title}</b><span>${value}</span><span>${text}</span></div>`;
}

function trustCard(title, text, icon) {
  return `<div class="card trust"><div class="ico">${icon}</div><b>${title}</b><span>${text}</span></div>`;
}

function timelineStep(number, title, text) {
  return `<div class="step"><i>${number}</i><b>${title}</b><span>${text}</span></div>`;
}

function bottomFooter() {
  return `<div class="bottomWave"></div><div class="bottomFeatures">
    <div class="bf">${iconWallet()}<span>חיסכון שמתאים לכם</span></div>
    <div class="bf">${iconLeaf()}<span>ייצור נקי</span></div>
    <div class="bf">${iconShield()}<span>ביטחון אנרגטי</span></div>
  </div>`;
}

function mainRoofDirection(state) {
  const surfaces = Array.isArray(state.surfaces) ? state.surfaces : [];
  if (!surfaces.length) return 'דרום‑מערב';
  const best = surfaces.reduce((a, b) => Number(a.area || 0) > Number(b.area || 0) ? a : b, surfaces[0]);
  return best.orientation || 'דרום‑מערב';
}

function obstacleNames(obstacles) {
  const map = { ac: 'מזגן', boiler: 'דוד', shade: 'צל', access: 'יציאה לגג', solar: 'קולטים קיימים' };
  return obstacles.map((item) => map[item] || item).filter(Boolean).join(', ');
}

function repeat(value, count) {
  return Array.from({ length: count }).map(() => value).join('');
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[char]));
}

function escapeAttribute(value) {
  return escapeHtml(value).replace(/'/g, '&#39;');
}

function digitsOnly(value) {
  return String(value).replace(/\D/g, '');
}

function svg(paths) { return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${paths}</svg>`; }
function iconPanel() { return svg('<path d="M4 8h16l-2 9H2l2-9Z"/><path d="M8 8l-1 9M13 8v9M18 8l-1 9M3 13h16"/>'); }
function iconSun() { return svg('<circle cx="12" cy="12" r="4"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.5 4.5l2 2M17.5 17.5l2 2M19.5 4.5l-2 2M6.5 17.5l-2 2"/>'); }
function iconPiggy() { return svg('<path d="M5 12a6 5 0 0 1 6-5h4a4 4 0 0 1 4 4v5h-2l-1 3h-3l-1-2H9l-1 2H5l1-3H4v-4h1Z"/><path d="M15 9h.01M8 7l-2-2"/>'); }
function iconHome() { return svg('<path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/><path d="M10 20v-6h4v6"/>'); }
function iconCycle() { return svg('<path d="M17 1v6h-6"/><path d="M20 11a8 8 0 0 0-14-5l-2 2"/><path d="M7 23v-6h6"/><path d="M4 13a8 8 0 0 0 14 5l2-2"/>'); }
function iconGrowth() { return svg('<path d="M4 19V5"/><path d="M4 19h16"/><path d="M7 15l4-4 3 3 5-7"/><path d="M17 7h2v2"/>'); }
function iconSunPanel() { return svg('<path d="M4 14h16l-2 6H2l2-6Z"/><path d="M8 14l-1 6M13 14v6M18 14l-1 6M3 17h16"/><circle cx="12" cy="6" r="3"/><path d="M12 1v2M12 9v2M7 6H5M19 6h-2"/>'); }
function iconCompass() { return svg('<circle cx="12" cy="12" r="9"/><path d="M15 9l-2 6-4 2 2-6 4-2Z"/>'); }
function iconObstacle() { return svg('<path d="M4 18h16"/><path d="M6 18V9a3 3 0 0 1 3-3h1"/><path d="M14 18V8h4v10"/><path d="M8 6V3h4v3"/>'); }
function iconFamily() { return svg('<path d="M9 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"/><path d="M17 11a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z"/><path d="M3 20a6 6 0 0 1 12 0"/><path d="M14 20a4 4 0 0 1 7 0"/>'); }
function iconPin() { return svg('<path d="M12 21s7-5.5 7-12a7 7 0 1 0-14 0c0 6.5 7 12 7 12Z"/><circle cx="12" cy="9" r="2"/>'); }
function iconHomeSun() { return svg('<path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/><path d="M9 20v-6h6v6"/><circle cx="18" cy="5" r="2"/>'); }
function iconSearchHome() { return svg('<path d="M4 11l7-6 7 6"/><path d="M6 10v8h8v-4h-3v4"/><circle cx="17" cy="17" r="3"/><path d="M20 20l2 2"/>'); }
function iconDesign() { return svg('<path d="M4 5h16v14H4z"/><path d="M8 9h8M8 13h5"/><path d="M16 16l4 4"/>'); }
function iconCheck() { return svg('<circle cx="12" cy="12" r="9"/><path d="M8 12l3 3 5-6"/>'); }
function iconShield() { return svg('<path d="M12 3l7 3v6c0 5-3.5 8-7 9-3.5-1-7-4-7-9V6l7-3Z"/><path d="M9 12l2 2 4-5"/>'); }
function iconWallet() { return svg('<path d="M4 7h14a2 2 0 0 1 2 2v9H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h12"/><path d="M16 12h4v4h-4z"/>'); }
function iconLeaf() { return svg('<path d="M20 4C11 4 5 10 5 19c9 0 15-6 15-15Z"/><path d="M5 19c3-5 7-8 12-10"/>'); }
