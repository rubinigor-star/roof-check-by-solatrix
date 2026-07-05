export function buildFullPdfReport({ report, state, config, logoSrc, formatNumber, formatMoney }) {
  const safeState = state || {};
  const safeReport = normalizeReport(report || {});
  const customer = escapeHtml(safeState.leadName || 'לקוח Solatrix');
  const address = escapeHtml(safeState.address || 'כתובת הנכס תופיע כאן');
  const phone = escapeHtml(safeState.leadPhone || '');
  const defaultPhone = escapeHtml(config?.defaultPhone || '972547299727');
  const cleanLogoSrc = escapeAttribute(logoSrc || '');
  const whatsappUrl = `https://wa.me/${digitsOnly(defaultPhone)}`;
  const score = solarScore(safeReport, safeState);
  const confidence = confidenceScore(safeReport, safeState);
  const monthData = monthlyProduction(safeReport);
  const monthMax = Math.max(...monthData.map((m) => m.value), 1);
  const roofSvg = roofDrawing(safeState, score);
  const selfWidth = Math.max(8, Math.min(92, safeReport.selfUseShare || 0));
  const exportWidth = Math.max(8, 100 - selfWidth);
  const surfaces = Array.isArray(safeState.surfaces) ? safeState.surfaces : [];
  const obstacleLabels = obstacleNames(safeState.obstacles || []);
  const bestRoofSide = surfaces.length ? surfaces.reduce((best, surface) => Number(surface.area || 0) > Number(best.area || 0) ? surface : best, surfaces[0]) : null;
  const recommended = investmentOption('מומלץ', 1, safeReport, config, formatMoney);
  const conservative = investmentOption('מדויק', 0.82, safeReport, config, formatMoney);
  const premium = investmentOption('פרימיום', 1.18, safeReport, config, formatMoney);
  const optionsHtml = [conservative, recommended, premium].map((option) => investmentCard(option)).join('');
  const monthlyBars = monthData.map((m) => `<div class="barMonth"><i style="height:${Math.max(14, m.value / monthMax * 100)}%"></i><b>${m.month}</b><span>${formatNumber(Math.round(m.value))}</span></div>`).join('');
  const cumulative25 = projectionValue(25, safeReport, config);
  const cumulative10 = projectionValue(10, safeReport, config);
  const paybackWidth = Math.max(12, Math.min(96, 100 - Number(safeReport.payback || 0) * 10));
  const annualYield = safeReport.cost ? (safeReport.annualSavings / safeReport.cost * 100) : 0;
  const roofSummary = [
    { label: 'שטח גג מסומן', value: `${formatNumber(safeReport.roofArea)} מ״ר` },
    { label: 'שטח שימושי', value: `${formatNumber(safeReport.usableArea)} מ״ר` },
    { label: 'כיוון מוביל', value: bestRoofSide?.orientation || 'דרום / דרום-מערב' },
    { label: 'מכשולים', value: obstacleLabels || 'ללא חסמים מהותיים' },
  ].map((item) => `<div class="miniMetric"><span>${item.label}</span><b>${item.value}</b></div>`).join('');

  return `<!doctype html>
<html lang="he" dir="rtl">
<head>
<meta charset="utf-8" />
<title>Solatrix Premium Solar Proposal</title>
<style>
@page{size:A4;margin:0}
*{box-sizing:border-box}
:root{--navy:#071b2f;--navy2:#0d2f52;--navy3:#123c63;--gold:#f5a11a;--gold2:#ffd36a;--cream:#fbf6ec;--paper:#fffdf8;--ink:#0d1b2a;--muted:#6f7b87;--line:#eadfcd;--green:#1f9d6a;--red:#d15f45}
html,body{margin:0;background:#efe8d8;color:var(--ink);font-family:Assistant,"Noto Sans Hebrew",Arial,sans-serif;-webkit-print-color-adjust:exact;print-color-adjust:exact}
body{font-size:14px}.page{width:210mm;height:297mm;position:relative;overflow:hidden;background:var(--paper);page-break-after:always;padding:15mm}.page::after{content:"";position:absolute;inset:auto 15mm 9mm 15mm;border-top:1px solid rgba(7,27,47,.12)}
.pageNo{position:absolute;bottom:6mm;left:15mm;color:#8a929a;font-size:10px;font-weight:800}.footerBrand{position:absolute;bottom:6mm;right:15mm;color:#7c8791;font-size:10px;font-weight:900;letter-spacing:.02em}.watermark{position:absolute;left:-22mm;bottom:26mm;font-size:78mm;font-weight:950;color:rgba(7,27,47,.028);letter-spacing:-.08em;line-height:.8;transform:rotate(-6deg)}
.logo{display:flex;align-items:center;gap:8px}.logo img{max-width:148px;max-height:44px;object-fit:contain;background:#fff;border-radius:16px;padding:7px 12px;box-shadow:0 16px 35px rgba(0,0,0,.14)}.logoText{font-weight:950;color:white;font-size:22px;letter-spacing:.04em}.eyebrow{display:inline-flex;align-items:center;gap:8px;background:rgba(245,161,26,.14);color:var(--gold);border:1px solid rgba(245,161,26,.32);border-radius:999px;padding:7px 12px;font-size:11px;font-weight:950;letter-spacing:.08em;text-transform:uppercase}.title{font-size:34px;line-height:1.03;margin:0;color:var(--navy);font-weight:950;letter-spacing:-.04em}.sub{font-size:16px;line-height:1.5;color:#5f6b76;font-weight:760;margin:6mm 0 0}.sectionHead{display:flex;align-items:flex-start;justify-content:space-between;gap:12mm;margin-bottom:9mm}.sectionKicker{color:var(--gold);font-weight:950;font-size:12px;letter-spacing:.08em;text-transform:uppercase;margin-bottom:2mm}.sectionNumber{font-size:14px;color:var(--navy);font-weight:950;border:1px solid var(--line);border-radius:999px;padding:8px 12px;background:#fff9ef;white-space:nowrap}.grid2{display:grid;grid-template-columns:1fr 1fr;gap:5mm}.grid3{display:grid;grid-template-columns:repeat(3,1fr);gap:4mm}.grid4{display:grid;grid-template-columns:repeat(4,1fr);gap:3.5mm}.card{background:#fff;border:1px solid var(--line);border-radius:18px;padding:6mm;box-shadow:0 18px 45px rgba(13,27,42,.08)}.darkCard{background:linear-gradient(145deg,var(--navy),var(--navy3));color:#fff;border:1px solid rgba(255,255,255,.14);box-shadow:0 22px 55px rgba(7,27,47,.28)}.metric{min-height:31mm}.metric span{display:block;color:#697887;font-size:11px;font-weight:900;margin-bottom:3mm}.metric b{display:block;color:var(--navy);font-size:24px;line-height:1.05;font-weight:950;direction:ltr;text-align:right}.metric small{display:block;color:#7c8791;margin-top:3mm;font-size:10px;font-weight:800}.darkCard .metric span,.darkCard span{color:#c7d2df}.darkCard .metric b,.darkCard b{color:#fff}.goldText{color:var(--gold)!important}.ltr{direction:ltr;text-align:right}.button{display:inline-flex;align-items:center;justify-content:center;border-radius:999px;padding:11px 20px;background:linear-gradient(135deg,var(--gold),var(--gold2));color:#111;font-weight:950;text-decoration:none;box-shadow:0 18px 32px rgba(245,161,26,.28)}
.cover{padding:0;background:radial-gradient(circle at 20% 18%,rgba(255,211,106,.35),transparent 26%),linear-gradient(135deg,#061729 0%,#0b2949 49%,#123f67 100%);color:#fff}.coverTop{position:absolute;top:14mm;right:16mm;left:16mm;display:flex;align-items:center;justify-content:space-between;z-index:2}.coverHero{position:absolute;inset:0}.coverGlow{position:absolute;left:-20mm;top:20mm;width:135mm;height:135mm;border-radius:50%;background:radial-gradient(circle,rgba(245,161,26,.42),transparent 64%);filter:blur(4px)}.coverPattern{position:absolute;inset:0;background-image:linear-gradient(rgba(255,255,255,.055) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.055) 1px,transparent 1px);background-size:14mm 14mm;mask-image:linear-gradient(to bottom,#000,transparent 78%)}.coverContent{position:absolute;right:16mm;left:16mm;top:52mm;z-index:2}.cover h1{font-size:50px;line-height:.96;margin:7mm 0 6mm;font-weight:950;letter-spacing:-.055em;max-width:128mm}.coverLead{font-size:21px;line-height:1.45;color:#e9f1f8;max-width:123mm;font-weight:760}.coverClient{display:grid;grid-template-columns:1.1fr .9fr;gap:5mm;margin-top:12mm;max-width:142mm}.coverClient .box{border:1px solid rgba(255,255,255,.18);background:rgba(255,255,255,.10);border-radius:22px;padding:5mm;backdrop-filter:blur(8px)}.coverClient small{display:block;color:#b9c7d6;font-weight:900;margin-bottom:2mm}.coverClient b{font-size:20px}.coverScore{position:absolute;left:16mm;bottom:20mm;width:64mm;height:64mm;border-radius:50%;background:conic-gradient(var(--gold) ${score.score * 3.6}deg,rgba(255,255,255,.18) 0);display:grid;place-items:center;box-shadow:0 24px 80px rgba(245,161,26,.22)}.coverScoreInner{width:51mm;height:51mm;border-radius:50%;background:#071b2f;display:grid;place-items:center;text-align:center;border:1px solid rgba(255,255,255,.12)}.coverScoreInner strong{font-size:34px;line-height:1;font-weight:950;color:#fff}.coverScoreInner span{font-size:11px;color:#c7d2df;font-weight:950}.solarPlane{position:absolute;left:16mm;right:16mm;bottom:91mm;height:42mm;border-radius:28px;background:linear-gradient(120deg,rgba(255,255,255,.13),rgba(255,255,255,.04));border:1px solid rgba(255,255,255,.16);overflow:hidden}.solarPlane svg{width:100%;height:100%;display:block}.cover .footerBrand,.cover .pageNo{color:#b8c7d6;border-color:rgba(255,255,255,.12)}
.heroStrip{height:46mm;border-radius:24px;background:radial-gradient(circle at 12% 50%,rgba(255,211,106,.28),transparent 32%),linear-gradient(135deg,var(--navy),var(--navy3));margin-bottom:7mm;position:relative;overflow:hidden;color:#fff;padding:7mm}.heroStrip::after{content:"";position:absolute;inset:0;background-image:linear-gradient(rgba(255,255,255,.06) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.06) 1px,transparent 1px);background-size:10mm 10mm}.heroStrip h2{position:relative;z-index:2;font-size:30px;line-height:1.05;margin:3mm 0 2mm;font-weight:950}.heroStrip p{position:relative;z-index:2;color:#dce8f2;font-size:15px;line-height:1.45;max-width:130mm}.summaryNarrative{display:grid;grid-template-columns:1fr 55mm;gap:5mm;margin-top:6mm}.decisionCard{background:#fff9ef;border:1px solid #f0d9ae;border-radius:22px;padding:6mm}.decisionCard h3{margin:0 0 3mm;color:var(--navy);font-size:20px}.decisionCard p{margin:0;color:#66727e;font-size:13px;line-height:1.55;font-weight:760}.confidence{height:100%;display:flex;flex-direction:column;justify-content:space-between}.scoreBar{height:9px;background:#e7edf2;border-radius:99px;overflow:hidden}.scoreBar i{display:block;height:100%;border-radius:99px;background:linear-gradient(90deg,var(--gold),var(--gold2));width:${confidence}%}.confidence b{font-size:36px;line-height:1;color:var(--navy)}
.roofStage{display:grid;grid-template-columns:1.1fr .9fr;gap:6mm;align-items:stretch}.roofVisual{background:linear-gradient(145deg,#061729,#123c63);border-radius:30px;padding:5mm;min-height:152mm;position:relative;overflow:hidden;box-shadow:0 24px 70px rgba(7,27,47,.24)}.roofVisual::before{content:"";position:absolute;inset:0;background-image:linear-gradient(rgba(255,255,255,.06) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.06) 1px,transparent 1px);background-size:9mm 9mm}.roofVisual svg{position:relative;z-index:2;width:100%;height:136mm;display:block}.roofTag{position:absolute;top:6mm;right:6mm;z-index:3;background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.18);color:white;border-radius:999px;padding:7px 11px;font-size:11px;font-weight:950}.north{position:absolute;top:6mm;left:6mm;z-index:3;color:#ffd36a;border:1px solid rgba(255,211,106,.35);border-radius:999px;padding:7px 10px;font-weight:950}.miniMetrics{display:grid;grid-template-columns:1fr 1fr;gap:3.5mm}.miniMetric{background:#fff;border:1px solid var(--line);border-radius:16px;padding:4mm;min-height:23mm}.miniMetric span{display:block;font-size:10px;font-weight:900;color:#71808e;margin-bottom:2mm}.miniMetric b{display:block;color:var(--navy);font-size:15px;line-height:1.15}.diagnosis{margin-top:5mm}.diagnosis h3{margin:0 0 3mm;color:var(--navy);font-size:21px}.diagnosis ul{margin:0;padding:0;list-style:none;display:grid;gap:2.5mm}.diagnosis li{display:flex;gap:3mm;align-items:flex-start;color:#5f6b76;font-size:12.5px;line-height:1.5;font-weight:760}.diagnosis li i{width:8px;height:8px;border-radius:50%;background:var(--gold);margin-top:5px;flex:none}
.systemLayout{display:grid;grid-template-columns:.92fr 1.08fr;gap:6mm;align-items:stretch}.systemHero{border-radius:28px;background:linear-gradient(145deg,var(--navy),var(--navy3));padding:7mm;color:#fff;position:relative;overflow:hidden;min-height:160mm}.systemHero::after{content:"";position:absolute;width:80mm;height:80mm;border-radius:50%;left:-23mm;bottom:-22mm;background:radial-gradient(circle,rgba(245,161,26,.32),transparent 66%)}.systemHero h3{font-size:30px;margin:0 0 5mm;line-height:1.05}.systemHero .big{font-size:58px;line-height:.9;font-weight:950;color:#ffd36a}.systemHero p{font-size:14px;line-height:1.55;color:#d7e3ed}.specs{display:grid;gap:3.5mm}.spec{display:grid;grid-template-columns:34px 1fr;gap:4mm;align-items:center;background:#fff;border:1px solid var(--line);border-radius:18px;padding:4mm}.spec svg{width:28px;height:28px;color:var(--gold)}.spec span{display:block;color:#6c7885;font-size:11px;font-weight:900}.spec b{display:block;color:var(--navy);font-size:19px}.flow{margin-top:5mm;background:#fff9ef;border:1px solid #efdab0;border-radius:20px;padding:5mm}.flowLine{height:12px;border-radius:999px;background:linear-gradient(90deg,var(--gold) 0 ${selfWidth}%,var(--navy) ${selfWidth}% 100%);margin:4mm 0}.flowLegend{display:flex;justify-content:space-between;color:#5f6b76;font-size:11px;font-weight:900}.financeHero{display:grid;grid-template-columns:1fr 1fr;gap:5mm}.valueCard{min-height:54mm;padding:7mm;border-radius:24px}.valueCard strong{display:block;font-size:38px;line-height:1;font-weight:950;color:var(--navy);direction:ltr;text-align:right}.valueCard span{display:block;color:#6e7b87;font-weight:900;margin-bottom:4mm}.valueCard p{margin:4mm 0 0;color:#6e7b87;line-height:1.45;font-size:12.5px;font-weight:760}.waterfall{margin-top:7mm;background:linear-gradient(180deg,#fff,#fff9ef);border:1px solid var(--line);border-radius:24px;padding:6mm;height:91mm;position:relative}.waterfall h3{margin:0 0 6mm;font-size:18px;color:var(--navy)}.axis{position:absolute;right:9mm;left:9mm;bottom:17mm;border-top:1px solid #d9e0e6}.wfBars{position:absolute;right:12mm;left:12mm;bottom:18mm;top:27mm;display:grid;grid-template-columns:repeat(4,1fr);gap:9mm;align-items:end}.wfBar{display:flex;flex-direction:column;align-items:center;justify-content:end;gap:3mm}.wfBar i{display:block;width:100%;max-width:30mm;border-radius:14px 14px 4px 4px;background:linear-gradient(180deg,var(--gold2),var(--gold));box-shadow:0 12px 22px rgba(245,161,26,.24)}.wfBar.neg i{background:linear-gradient(180deg,#ffb4a3,#d15f45)}.wfBar b{font-size:12px;color:var(--navy);direction:ltr}.wfBar span{font-size:10px;color:#687583;font-weight:900}.paybackLine{margin-top:6mm}.paybackTrack{height:14px;background:#e9eef3;border-radius:99px;overflow:hidden}.paybackTrack i{height:100%;display:block;width:${paybackWidth}%;background:linear-gradient(90deg,var(--gold),var(--gold2));border-radius:99px}.analyticsGrid{display:grid;grid-template-columns:1.15fr .85fr;gap:5mm;align-items:stretch}.monthChart{height:119mm;background:#fff;border:1px solid var(--line);border-radius:24px;padding:6mm 5mm 8mm}.monthChart h3{margin:0 0 5mm;color:var(--navy);font-size:18px}.months{height:92mm;display:grid;grid-template-columns:repeat(12,1fr);gap:2.5mm;align-items:end}.barMonth{height:100%;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;gap:1.7mm}.barMonth i{display:block;width:100%;border-radius:99px 99px 4px 4px;background:linear-gradient(180deg,var(--gold2),var(--gold));min-height:8mm}.barMonth b{font-size:9px;color:var(--navy);font-weight:950}.barMonth span{font-size:8px;color:#6e7b87;font-weight:800;direction:ltr}.energySplit{display:grid;gap:4mm}.donut{width:54mm;height:54mm;border-radius:50%;background:conic-gradient(var(--gold) ${selfWidth * 3.6}deg,var(--navy) 0);display:grid;place-items:center;margin:2mm auto 5mm;box-shadow:0 22px 42px rgba(13,27,42,.12)}.donut::before{content:"";width:38mm;height:38mm;background:#fff;border-radius:50%}.splitLegend{display:grid;gap:2mm}.splitLegend div{display:flex;justify-content:space-between;border-bottom:1px solid #edf1f5;padding-bottom:2mm;font-size:12px;font-weight:900;color:#63707d}.investmentCards{display:grid;grid-template-columns:repeat(3,1fr);gap:4mm;margin-top:7mm}.plan{background:#fff;border:1px solid var(--line);border-radius:24px;padding:5mm;min-height:132mm;position:relative;overflow:hidden}.plan.recommended{background:linear-gradient(145deg,#071b2f,#123c63);color:#fff;border-color:rgba(255,211,106,.55);box-shadow:0 28px 70px rgba(7,27,47,.25);transform:translateY(-3mm)}.plan .badge{display:inline-flex;background:#fff5df;color:var(--navy);border-radius:999px;padding:6px 9px;font-size:10px;font-weight:950;margin-bottom:5mm}.plan.recommended .badge{background:var(--gold);color:#111}.plan h3{font-size:22px;margin:0 0 5mm;color:var(--navy)}.plan.recommended h3{color:#fff}.plan strong{display:block;font-size:32px;color:var(--gold);direction:ltr;text-align:right;margin-bottom:3mm}.plan ul{list-style:none;padding:0;margin:5mm 0 0;display:grid;gap:3mm}.plan li{font-size:12px;color:#687583;font-weight:800;line-height:1.4}.plan.recommended li{color:#d8e3ed}.plan li::before{content:"";display:inline-block;width:7px;height:7px;background:var(--gold);border-radius:50%;margin-left:7px}.trustGrid{display:grid;grid-template-columns:1fr 1fr;gap:5mm}.trustItem{background:#fff;border:1px solid var(--line);border-radius:20px;padding:5mm;display:grid;grid-template-columns:30px 1fr;gap:3mm;align-items:start}.trustItem svg{width:26px;height:26px;color:var(--gold)}.trustItem b{display:block;color:var(--navy);font-size:16px;margin-bottom:2mm}.trustItem span{display:block;color:#64717d;font-size:12px;line-height:1.45;font-weight:760}.timeline{margin-top:6mm;display:grid;grid-template-columns:repeat(4,1fr);gap:3mm}.timeStep{background:#fff9ef;border:1px solid #efdab0;border-radius:18px;padding:4mm}.timeStep small{display:block;color:var(--gold);font-size:10px;font-weight:950;margin-bottom:2mm}.timeStep b{font-size:15px;color:var(--navy)}.ctaPanel{margin-top:7mm;background:linear-gradient(145deg,var(--navy),var(--navy3));border-radius:28px;padding:7mm;color:#fff;display:grid;grid-template-columns:1fr 38mm;gap:7mm;align-items:center;position:relative;overflow:hidden}.ctaPanel::after{content:"";position:absolute;left:-10mm;top:-18mm;width:70mm;height:70mm;background:radial-gradient(circle,rgba(245,161,26,.34),transparent 68%)}.ctaPanel h3{font-size:28px;margin:0 0 3mm}.ctaPanel p{color:#dbe8f3;font-size:14px;line-height:1.5;margin:0 0 5mm}.qr{width:34mm;height:34mm;background:#fff;border-radius:10px;padding:3mm;display:grid;grid-template-columns:repeat(7,1fr);grid-template-rows:repeat(7,1fr);gap:1.2mm}.qr i{background:#071b2f;border-radius:1px}.qr i:nth-child(1),.qr i:nth-child(2),.qr i:nth-child(3),.qr i:nth-child(8),.qr i:nth-child(10),.qr i:nth-child(15),.qr i:nth-child(16),.qr i:nth-child(17),.qr i:nth-child(29),.qr i:nth-child(31),.qr i:nth-child(36),.qr i:nth-child(37),.qr i:nth-child(38),.qr i:nth-child(43),.qr i:nth-child(44),.qr i:nth-child(45),.qr i:nth-child(46),.qr i:nth-child(48){background:#071b2f}.qr i:nth-child(4n+2),.qr i:nth-child(5n+1){background:#f5a11a}.printNote{margin-top:4mm;color:#6f7b87;font-size:10px;line-height:1.45;font-weight:760}.noPrint{position:fixed;left:18px;bottom:18px;z-index:999;border:0;border-radius:999px;background:#25D366;color:white;padding:14px 20px;font-weight:950;box-shadow:0 14px 34px rgba(0,0,0,.18)}
@media print{body{background:white}.noPrint{display:none}.page{box-shadow:none}}
</style>
</head>
<body>
<button class="noPrint" onclick="window.print()">שמירה / הדפסה ל-PDF</button>
<section class="page cover">
  <div class="coverHero"><div class="coverGlow"></div><div class="coverPattern"></div></div>
  <div class="coverTop"><div class="logo">${cleanLogoSrc ? `<img src="${cleanLogoSrc}" alt="Solatrix Energy" />` : '<span class="logoText">SOLATRIX</span>'}</div><div class="eyebrow">Premium Solar Proposal</div></div>
  <div class="coverContent">
    <div class="eyebrow">נבנה במיוחד עבור הנכס שלך</div>
    <h1>הצעה סולארית שמראה ללקוח את הערך של הבית שלו</h1>
    <p class="coverLead">מסמך מסחרי פרימיום: פוטנציאל גג, תכנון מערכת, תחזית חיסכון והמלצה ברורה להתקדמות עם Solatrix.</p>
    <div class="coverClient"><div class="box"><small>לקוח</small><b>${customer}</b></div><div class="box"><small>נכס</small><b>${address}</b></div></div>
  </div>
  <div class="solarPlane">${solarPlaneSvg()}</div>
  <div class="coverScore"><div class="coverScoreInner"><strong>${score.score}</strong><span>Solar Score<br/>${score.label}</span></div></div>
  <div class="footerBrand">Solatrix Energy · הצעה ראשונית לפני סיור טכני</div><div class="pageNo">01</div>
</section>
<section class="page">
  <div class="watermark">S</div>
  <div class="heroStrip"><div class="eyebrow">Executive Summary</div><h2>החלטה מהירה: האם הגג הזה שווה בדיקה מקצועית?</h2><p>לפי הנתונים שהוזנו, לגג יש פוטנציאל כלכלי ברור. המטרה של המסמך היא להפוך את הנתונים להחלטה פשוטה: כמה אפשר לייצר, כמה אפשר לחסוך, ומה הצעד הבא.</p></div>
  <div class="grid4">
    <div class="card metric"><span>מערכת מומלצת</span><b>${safeReport.systemKw.toFixed(1)} kW</b><small>מותאם לשטח השימושי</small></div>
    <div class="card metric"><span>ייצור שנתי</span><b>${formatNumber(safeReport.annualProduction)} kWh</b><small>הערכת ייצור ראשונית</small></div>
    <div class="card metric"><span>חיסכון שנתי</span><b>${formatMoney(safeReport.annualSavings)}</b><small>צריכה עצמית + מכירה</small></div>
    <div class="card metric"><span>רווח ל-25 שנה</span><b>${formatMoney(safeReport.profit25)}</b><small>לפני בדיקת שטח סופית</small></div>
  </div>
  <div class="summaryNarrative">
    <div class="decisionCard"><h3>המסר ללקוח</h3><p>הבית שלך יכול להפוך מנכס שצורך חשמל לנכס שמייצר ערך. המערכת המוצעת מתוכננת לנצל את הגג בצורה נקייה, אסתטית וכלכלית - בלי להפוך את ההחלטה למורכבת.</p></div>
    <div class="card confidence"><span>רמת ביטחון בהערכה</span><b>${confidence}%</b><div class="scoreBar"><i></i></div><small>מבוסס על שטח מסומן, צריכה, תעריפים ומכשולים</small></div>
  </div>
  <div class="grid3" style="margin-top:5mm"><div class="card metric"><span>החזר השקעה</span><b>${Number(safeReport.payback).toFixed(1)} שנים</b></div><div class="card metric"><span>תשואה שנתית משוערת</span><b>${annualYield.toFixed(1)}%</b></div><div class="card metric"><span>תזרים ל-10 שנים</span><b>${formatMoney(cumulative10)}</b></div></div>
  <div class="footerBrand">Solatrix Energy · תקציר החלטה</div><div class="pageNo">02</div>
</section>
<section class="page">
  <div class="sectionHead"><div><div class="sectionKicker">Digital Roof</div><h2 class="title">הגג הדיגיטלי של הנכס</h2><p class="sub">הלקוח צריך לראות את הבית שלו, לא טבלה. בשלב הזה אנחנו מציגים סימון גג פרימיום מתוך הכלי; בהמשך הוא יתחבר לצילום לוויין אמיתי.</p></div><div class="sectionNumber">03 / 08</div></div>
  <div class="roofStage"><div class="roofVisual"><div class="roofTag">Roof Intelligence Preview</div><div class="north">N ↑</div>${roofSvg}</div><div><div class="miniMetrics">${roofSummary}</div><div class="diagnosis card"><h3>מה רואים בגג?</h3><ul><li><i></i><span>שטח שימושי שמספיק למערכת משמעותית, בלי להעמיס על הלקוח פרטים טכניים.</span></li><li><i></i><span>הפוטנציאל הכלכלי נובע בעיקר משילוב בין צריכה עצמית ומכירה לרשת.</span></li><li><i></i><span>לפני חתימה סופית נדרש סיור שטח, בדיקת חשמל ומדידה מדויקת.</span></li></ul></div></div></div>
  <div class="footerBrand">Solatrix Energy · הדמיית גג</div><div class="pageNo">03</div>
</section>
<section class="page">
  <div class="sectionHead"><div><div class="sectionKicker">Recommended System</div><h2 class="title">מערכת מומלצת לבית</h2><p class="sub">לא מוכרים קילוואטים. מוכרים פתרון: תכנון נכון, ציוד אמין, החזר ברור ונראות מסודרת על הגג.</p></div><div class="sectionNumber">04 / 08</div></div>
  <div class="systemLayout"><div class="systemHero"><h3>המלצת Solatrix</h3><div class="big ltr">${safeReport.systemKw.toFixed(1)} kW</div><p>מערכת בגודל הזה מאזנת בין שטח הגג, הייצור השנתי, צריכת הבית והיכולת לייצר ערך פיננסי לאורך שנים.</p><div class="flow"><b>תמהיל האנרגיה</b><div class="flowLine"></div><div class="flowLegend"><span>צריכה עצמית ${Math.round(selfWidth)}%</span><span>מכירה לרשת ${Math.round(exportWidth)}%</span></div></div></div><div class="specs">
    <div class="spec">${iconPanels()}<div><span>מספר פאנלים משוער</span><b>${safeReport.panels} פאנלים</b></div></div>
    <div class="spec">${iconInverter()}<div><span>ייצור שנתי צפוי</span><b>${formatNumber(safeReport.annualProduction)} kWh</b></div></div>
    <div class="spec">${iconBattery()}<div><span>צריכה עצמית משוערת</span><b>${formatNumber(safeReport.selfConsumed)} kWh</b></div></div>
    <div class="spec">${iconGrid()}<div><span>מכירה לרשת</span><b>${formatNumber(safeReport.exported)} kWh</b></div></div>
    <div class="card"><h3 style="margin:0 0 3mm;color:var(--navy);font-size:20px">מה מקבלים?</h3><p style="margin:0;color:#62707d;line-height:1.55;font-weight:760">תכנון מערכת, פריסת פאנלים, בדיקת חיבור, הכנה לאישורי חברת חשמל ותהליך ליווי מסודר עד להתקנה.</p></div>
  </div></div>
  <div class="footerBrand">Solatrix Energy · המלצת מערכת</div><div class="pageNo">04</div>
</section>
<section class="page">
  <div class="sectionHead"><div><div class="sectionKicker">Financial Overview</div><h2 class="title">תמונה פיננסית שמובילה להחלטה</h2><p class="sub">העמוד הזה צריך לגרום ללקוח להבין: ההשקעה ברורה, החיסכון ברור, והשלב הבא הוא בדיקת שטח.</p></div><div class="sectionNumber">05 / 08</div></div>
  <div class="financeHero"><div class="valueCard card"><span>עלות מערכת משוערת</span><strong>${formatMoney(safeReport.cost)}</strong><p>אומדן ראשוני לפי גודל מערכת ועלות התקנה בסיסית. מחיר סופי לאחר סיור.</p></div><div class="valueCard card"><span>חיסכון/הכנסה שנתית</span><strong>${formatMoney(safeReport.annualSavings)}</strong><p>מבוסס על תעריף קנייה, תעריף מכירה ותמהיל צריכה עצמית.</p></div></div>
  <div class="waterfall"><h3>איך הערך נבנה לאורך זמן</h3><div class="wfBars"><div class="wfBar neg"><b>${formatMoney(-safeReport.cost)}</b><i style="height:38%"></i><span>השקעה</span></div><div class="wfBar"><b>${formatMoney(safeReport.annualSavings)}</b><i style="height:32%"></i><span>שנה 1</span></div><div class="wfBar"><b>${formatMoney(cumulative10)}</b><i style="height:62%"></i><span>10 שנים</span></div><div class="wfBar"><b>${formatMoney(cumulative25)}</b><i style="height:95%"></i><span>25 שנים</span></div></div><div class="axis"></div></div>
  <div class="paybackLine"><div style="display:flex;justify-content:space-between;font-size:12px;color:#62707d;font-weight:900;margin-bottom:2mm"><span>מהירות החזר השקעה</span><span>${Number(safeReport.payback).toFixed(1)} שנים</span></div><div class="paybackTrack"><i></i></div></div>
  <div class="footerBrand">Solatrix Energy · פיננסים</div><div class="pageNo">05</div>
</section>
<section class="page">
  <div class="sectionHead"><div><div class="sectionKicker">Energy Analytics</div><h2 class="title">אנליטיקה אנרגטית</h2><p class="sub">גרפים פשוטים, בלי עומס. הלקוח רואה מתי הגג מייצר, כמה אנרגיה נשארת בבית וכמה נמכרת לרשת.</p></div><div class="sectionNumber">06 / 08</div></div>
  <div class="analyticsGrid"><div class="monthChart"><h3>ייצור חודשי משוער</h3><div class="months">${monthlyBars}</div></div><div class="energySplit"><div class="card"><div class="donut"></div><div class="splitLegend"><div><span>צריכה עצמית</span><b>${formatNumber(safeReport.selfConsumed)} kWh</b></div><div><span>מכירה לרשת</span><b>${formatNumber(safeReport.exported)} kWh</b></div><div><span>תעריף אפקטיבי</span><b>₪${safeReport.effectiveTariff.toFixed(2)}</b></div></div></div><div class="card"><h3 style="margin:0 0 3mm;color:var(--navy)">המשמעות</h3><p style="margin:0;color:#65717d;line-height:1.55;font-weight:760">הערך הגבוה ביותר מגיע מקוט״ש שהבית צורך בעצמו. לכן תכנון נכון של גודל המערכת חשוב יותר ממערכת גדולה מדי.</p></div></div></div>
  <div class="footerBrand">Solatrix Energy · אנרגיה</div><div class="pageNo">06</div>
</section>
<section class="page">
  <div class="sectionHead"><div><div class="sectionKicker">Investment Options</div><h2 class="title">שלושה מסלולי השקעה</h2><p class="sub">הלקוח לא צריך להרגיש שמכריחים אותו. הוא צריך לראות בחירה, להבין את ההבדלים, ולבחור במסלול המומלץ.</p></div><div class="sectionNumber">07 / 08</div></div>
  <div class="investmentCards">${optionsHtml}</div>
  <div class="decisionCard" style="margin-top:6mm"><h3>המלצה מסחרית</h3><p>ברוב הבתים, המסלול המומלץ נותן את האיזון הטוב ביותר בין השקעה, החזר, ייצור ונראות על הגג. המסלול המדויק מתאים ללקוח שרוצה להתחיל בזהירות; הפרימיום מתאים למי שרוצה למקסם פוטנציאל.</p></div>
  <div class="footerBrand">Solatrix Energy · מסלולי השקעה</div><div class="pageNo">07</div>
</section>
<section class="page">
  <div class="sectionHead"><div><div class="sectionKicker">Why Solatrix</div><h2 class="title">למה להתקדם עם Solatrix</h2><p class="sub">כאן סוגרים אמון. לא עוד מספרים - אלא תהליך מקצועי, אחריות, ותמונה ברורה של הצעד הבא.</p></div><div class="sectionNumber">08 / 08</div></div>
  <div class="trustGrid"><div class="trustItem">${iconShield()}<div><b>בדיקה מקצועית לפני התחייבות</b><span>סיור שטח, בדיקת חשמל, מדידות ואימות נתונים לפני הצעה סופית.</span></div></div><div class="trustItem">${iconDesign()}<div><b>תכנון פרימיום ולא ״מחשבון״</b><span>התאמת מערכת לבית, לצריכה ולמגבלות הגג - לא מספר כללי.</span></div></div><div class="trustItem">${iconMonitor()}<div><b>ליווי עד חיבור וניטור</b><span>תהליך עבודה מסודר משלב ההצעה ועד מערכת פעילה ומנוטרת.</span></div></div><div class="trustItem">${iconDocs()}<div><b>שקיפות פיננסית</b><span>חישוב שמפריד בין חיסכון עצמי, מכירה לרשת והנחות ארוכות טווח.</span></div></div></div>
  <div class="timeline"><div class="timeStep"><small>01</small><b>שיחת התאמה</b></div><div class="timeStep"><small>02</small><b>סיור טכני</b></div><div class="timeStep"><small>03</small><b>הצעה סופית</b></div><div class="timeStep"><small>04</small><b>התקנה וחיבור</b></div></div>
  <div class="ctaPanel"><div><h3>הגג שלך מוכן לבדיקה מקצועית</h3><p>הצעד הבא הוא לתאם סיור קצר ולבנות הצעה סופית עם פריסת פאנלים, בדיקת חשמל ואישור נתונים.</p><a class="button" href="${whatsappUrl}">לתיאום בדיקה ב-WhatsApp</a><div class="printNote">${phone ? `טלפון לקוח: ${phone} · ` : ''}Solatrix Energy · WhatsApp ${defaultPhone}</div></div><div class="qr">${Array.from({ length: 49 }).map(() => '<i></i>').join('')}</div></div>
  <div class="footerBrand">Solatrix Energy · קריאה לפעולה</div><div class="pageNo">08</div>
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
    panels: Number(report.panels || Math.max(1, Math.round(systemKw / 0.63))),
    roofArea: Number(report.roofArea || 0),
    usableArea: Number(report.usableArea || 0),
    selfConsumed: Number(report.selfConsumed || annualProduction * 0.45),
    exported: Number(report.exported || Math.max(0, annualProduction * 0.55)),
    selfUseShare: Number(report.selfUseShare || 45),
  };
}

function solarScore(report, state) {
  const roof = Math.max(0, Math.min(34, report.usableArea / 2.1));
  const production = Math.max(0, Math.min(26, report.annualProduction / 900));
  const finance = Math.max(0, Math.min(24, 34 - Number(report.payback) * 3.2));
  const obstacles = Array.isArray(state.obstacles) ? state.obstacles : [];
  const shadePenalty = obstacles.includes('shade') ? 8 : 0;
  const score = Math.round(Math.max(0, Math.min(100, roof + production + finance + 20 - shadePenalty)));
  const label = score >= 88 ? 'מצוין' : score >= 76 ? 'חזק מאוד' : score >= 62 ? 'טוב' : 'דורש בדיקה';
  return { score, label };
}

function confidenceScore(report, state) {
  const hasAddress = Boolean(state.address);
  const hasSurface = Array.isArray(state.surfaces) && state.surfaces.length > 0;
  const hasBill = Number(state.monthlyBill || 0) > 0;
  const data = [hasAddress, hasSurface, hasBill, report.annualProduction > 0, report.cost > 0].filter(Boolean).length;
  return Math.round(68 + data * 5.4);
}

function monthlyProduction(report) {
  const weights = [0.058,0.066,0.083,0.096,0.108,0.116,0.122,0.116,0.101,0.084,0.065,0.055];
  const months = ['ינו׳','פבר׳','מרץ','אפר׳','מאי','יוני','יולי','אוג׳','ספט׳','אוק׳','נוב׳','דצמ׳'];
  return weights.map((weight, index) => ({ month: months[index], value: report.annualProduction * weight }));
}

function projectionValue(year, report, config) {
  const growth = Number(config?.yearlyTariffGrowth ?? 0.04);
  const base = -report.cost;
  return base + report.annualSavings * year * Math.pow(1 + growth, Math.max(0, year - 1) / 2);
}

function investmentOption(name, factor, report, config, formatMoney) {
  const systemKw = Math.max(1, report.systemKw * factor);
  const cost = Math.max(0, report.cost * factor);
  const annual = Math.max(0, report.annualSavings * factor * (factor > 1 ? 1.04 : 0.98));
  const payback = cost / Math.max(annual, 1);
  return {
    name,
    factor,
    systemKw,
    cost,
    annual,
    payback,
    profit25: annual * 25 - cost,
    money: formatMoney,
    recommended: Math.abs(factor - 1) < 0.01,
  };
}

function investmentCard(option) {
  return `<div class="plan ${option.recommended ? 'recommended' : ''}"><div class="badge">${option.recommended ? 'המסלול המומלץ' : 'מסלול בחירה'}</div><h3>${option.name}</h3><strong>${option.systemKw.toFixed(1)} kW</strong><ul><li>עלות משוערת: ${option.money(option.cost)}</li><li>חיסכון שנתי: ${option.money(option.annual)}</li><li>החזר השקעה: ${option.payback.toFixed(1)} שנים</li><li>רווח 25 שנה: ${option.money(option.profit25)}</li></ul></div>`;
}

function roofDrawing(state, score) {
  const surfaces = Array.isArray(state.surfaces) ? state.surfaces : [];
  const polygons = surfaces.length ? surfaces.map((surface, index) => `<polygon points="${escapeAttribute(surface.points || '')}" fill="rgba(245,161,26,${index === 0 ? '.82' : '.62'})" stroke="#fff" stroke-width="1.5"/>`).join('') : '<polygon points="17,58 77,42 86,78 24,88" fill="rgba(245,161,26,.76)" stroke="#fff" stroke-width="1.6"/>';
  const pins = (Array.isArray(state.obstacles) ? state.obstacles : []).map((_, i) => {
    const c = [[42,36],[66,56],[72,28],[35,64],[58,24]][i % 5];
    return `<circle cx="${c[0]}" cy="${c[1]}" r="3.8" fill="#fff" stroke="#f5a11a" stroke-width="1.4"/>`;
  }).join('');
  return `<svg viewBox="0 0 100 100" role="img" aria-label="Digital roof preview"><defs><pattern id="roofGrid" width="8" height="8" patternUnits="userSpaceOnUse"><path d="M8 0 L0 0 0 8" fill="none" stroke="rgba(255,255,255,.12)"/></pattern><filter id="softShadow"><feDropShadow dx="0" dy="3" stdDeviation="3" flood-color="#000" flood-opacity=".22"/></filter></defs><rect width="100" height="100" fill="#071b2f"/><rect width="100" height="100" fill="url(#roofGrid)"/><path d="M12 14 L86 9 L92 82 L18 90 Z" fill="rgba(255,255,255,.08)" stroke="rgba(255,255,255,.34)"/><g filter="url(#softShadow)">${polygons}</g>${pins}<path d="M8 20 L25 36 M7 42 L28 50 M11 65 L31 61" stroke="rgba(255,211,106,.42)" stroke-width="1"/><text x="8" y="12" fill="#ffd36a" font-size="5" font-weight="900">SCORE ${score.score}</text></svg>`;
}

function solarPlaneSvg() {
  return `<svg viewBox="0 0 900 180" preserveAspectRatio="none"><defs><linearGradient id="panelG" x1="0" x2="1"><stop offset="0" stop-color="#153c63"/><stop offset="1" stop-color="#071b2f"/></linearGradient></defs><path d="M80 124 L385 48 L812 118 L545 162 Z" fill="rgba(255,255,255,.06)" stroke="rgba(255,255,255,.24)"/><g transform="translate(126 58) skewX(-17)"><rect width="590" height="74" rx="10" fill="url(#panelG)" stroke="rgba(255,255,255,.34)"/><g stroke="rgba(255,255,255,.28)">${Array.from({ length: 9 }).map((_, i) => `<path d="M${65 * (i + 1)} 0 V74"/>`).join('')}${Array.from({ length: 3 }).map((_, i) => `<path d="M0 ${18 * (i + 1)} H590"/>`).join('')}</g></g><circle cx="758" cy="48" r="28" fill="#ffd36a" opacity=".95"/><path d="M730 48 H680 M786 48 H840 M758 20 V0 M758 76 V115" stroke="#ffd36a" stroke-width="5" stroke-linecap="round" opacity=".7"/></svg>`;
}

function obstacleNames(obstacles) {
  const map = { ac: 'מזגן', boiler: 'דוד', shade: 'צל', access: 'יציאה לגג', solar: 'קולטים קיימים' };
  return obstacles.map((item) => map[item] || item).filter(Boolean).join(', ');
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

function iconPanels() { return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 7h16l-2 10H2L4 7Z"/><path d="M8 7l-1 10M13 7v10M18 7l-1 10M3 12h16"/></svg>'; }
function iconInverter() { return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="5" y="4" width="14" height="16" rx="2"/><path d="M9 8h6M9 12h6M10 16h4"/></svg>'; }
function iconBattery() { return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="4" y="7" width="15" height="10" rx="2"/><path d="M19 10h2v4h-2M8 12h7"/></svg>'; }
function iconGrid() { return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 3v18M5 8h14M7 16h10M4 21h16"/></svg>'; }
function iconShield() { return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 3l7 3v6c0 5-3.5 8-7 9-3.5-1-7-4-7-9V6l7-3Z"/><path d="M9 12l2 2 4-5"/></svg>'; }
function iconDesign() { return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 5h16v14H4z"/><path d="M8 9h8M8 13h5"/></svg>'; }
function iconMonitor() { return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="4" y="5" width="16" height="11" rx="2"/><path d="M9 21h6M12 16v5"/></svg>'; }
function iconDocs() { return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M7 3h7l4 4v14H7z"/><path d="M14 3v5h5M10 13h6M10 17h5"/></svg>'; }
