import React, { useMemo, useRef, useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { Home, Building2, Wheat, Check, Undo2, Trash2, MessageCircle } from 'lucide-react';
import './styles.css';

const STEPS = [
  'פתיחה',
  'סוג נכס',
  'כתובת',
  'סוג גג',
  'משטחים',
  'סימון',
  'חשבון חשמל',
  'ניתוח',
  'תוצאה',
  'דוח'
];

const colors = ['#F5A11A', '#4FD1C5', '#7AA7FF', '#FF7A90', '#B894FF', '#90D36B', '#FFD166'];

function SolatrixLogo() {
  return (
    <svg className="logoSvg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 420 150" aria-label="Solatrix Energy">
      <defs>
        <linearGradient id="logoGold" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stopColor="#F5A11A" />
          <stop offset="1" stopColor="#FFBF54" />
        </linearGradient>
      </defs>
      <path d="M58 120 C20 72 42 18 102 9" fill="none" stroke="url(#logoGold)" strokeWidth="8" strokeLinecap="round"/>
      <circle cx="326" cy="51" r="10" fill="url(#logoGold)"/>
      <text x="68" y="74" fontFamily="Assistant,Arial,sans-serif" fontSize="58" fontWeight="900" letterSpacing="-3" fill="#050505">Solatrix</text>
      <text x="210" y="112" fontFamily="Assistant,Arial,sans-serif" fontSize="17" fontWeight="800" letterSpacing="10" fill="#F5A11A">ENERGY</text>
    </svg>
  );
}

function App() {
  const [step, setStep] = useState(1);
  const [property, setProperty] = useState('home');
  const [roofType, setRoofType] = useState('flat');
  const [surfaceCount, setSurfaceCount] = useState(4);
  const [currentSurface, setCurrentSurface] = useState(0);
  const [surfaces, setSurfaces] = useState([]);
  const [bill, setBill] = useState(700);
  const [leadSent, setLeadSent] = useState(false);

  const progress = (step / STEPS.length) * 100;

  const next = () => setStep((s) => Math.min(STEPS.length, s + 1));
  const prev = () => setStep((s) => Math.max(1, s - 1));
  const go = (n) => setStep(n);

  const initSurfaces = (count) => {
    setSurfaces(Array.from({ length: count }, () => ({ points: [], area: 0, azimuth: null, panels: 0, kw: 0 })));
    setCurrentSurface(0);
    setStep(6);
  };

  const handleRoofContinue = () => {
    if (roofType === 'flat') {
      setSurfaceCount(1);
      initSurfaces(1);
    } else {
      setStep(5);
    }
  };

  const results = useMemo(() => {
    const totalKwFromSurfaces = surfaces.reduce((sum, s) => sum + (s.kw || 0), 0);
    const totalArea = surfaces.reduce((sum, s) => sum + (s.area || 0), 0);
    const systemKw = totalKwFromSurfaces || (totalArea || 100) * 0.7 * 0.2;
    const avgFactor = surfaces.length
      ? surfaces.reduce((sum, s) => sum + orientationCoeff(s.azimuth), 0) / surfaces.length
      : 1;
    const annualProd = systemKw * 1650 * avgFactor;
    const annualConsumption = (bill * 12) / 0.64;
    const self = Math.min(annualProd, annualConsumption) * 0.4;
    const exported = Math.max(0, annualProd - self);
    const annualSavings = self * 0.64 + exported * 0.48;
    const cost = systemKw * 2900;
    return {
      systemKw,
      annualProd,
      annualSavings,
      payback: cost / Math.max(annualSavings, 1),
      profit25: annualSavings * 25 - cost,
      totalArea,
      panels: surfaces.reduce((sum, s) => sum + (s.panels || 0), 0)
    };
  }, [surfaces, bill]);

  const startAnalysis = () => {
    setStep(8);
    window.setTimeout(() => setStep(9), 2300);
  };

  return (
    <div className="app">
      <header className="topbar">
        <div className="topbarInner">
          <a className="brand" href="#">
            <SolatrixLogo />
          </a>
          <nav className="desktopNav">
            <a href="#">דף הבית</a>
            <a href="#">בתים פרטיים</a>
            <a href="#">מחיר שקוף</a>
            <a className="active" href="#">בדיקת גג</a>
            <a href="#">שאלות</a>
          </nav>
          <a className="whatsapp" href="https://wa.me/972547299727" target="_blank" rel="noreferrer">
            <MessageCircle size={19} />
            <span>WhatsApp</span>
          </a>
        </div>
      </header>

      <main className="shell">
        <div className="mobileMeta">
          <span>{`שלב ${step} מתוך ${STEPS.length}`}</span>
          <span>פחות מדקה</span>
        </div>
        <div className="progress"><div style={{ width: `${progress}%` }} /></div>

        {step === 1 && (
          <Screen visual="תצוגת גג חכמה">
            <Kicker>Roof Check by Solatrix</Kicker>
            <h1>בדיקת גג חכמה <strong>תוך פחות מדקה</strong></h1>
            <p>הלקוח רואה את הבית שלו, מסמן את הגג ומקבל דוח ראשוני שמרגיש אישי, מדויק ומקצועי.</p>
            <div className="actions">
              <button onClick={next}>התחילו בבדיקה</button>
            </div>
          </Screen>
        )}

        {step === 2 && (
          <Screen visual="סוג הנכס">
            <Kicker>סוג נכס</Kicker>
            <h2>איזה נכס נרצה לבדוק?</h2>
            <div className="options">
              <Option active={property === 'home'} onClick={() => setProperty('home')} icon={<Home />}>בית פרטי<small>גג ביתי או דו־משפחתי</small></Option>
              <Option active={property === 'business'} onClick={() => setProperty('business')} icon={<Building2 />}>עסק / מסחרי<small>מבנה תעשייה, משרד או חנות</small></Option>
              <Option active={property === 'agri'} onClick={() => setProperty('agri')} icon={<Wheat />}>חקלאות<small>רפת, סככה או מבנה חקלאי</small></Option>
            </div>
            <NavActions next={next} prev={prev} />
          </Screen>
        )}

        {step === 3 && (
          <Screen visual="תמונת לוויין של הבית">
            <Kicker>כתובת</Kicker>
            <h2>בואו נראה את הגג שלכם</h2>
            <p>בשלב הבא נחבר כאן Google Maps / GovMap. כרגע זה מוקאפ שמדמה את חוויית המשתמש.</p>
            <label>כתובת</label>
            <input placeholder="לדוגמה: ויצו 24 חיפה" />
            <MapMock label="כאן תופיע מפת Google / GovMap" compact />
            <NavActions next={next} prev={prev} nextLabel="זה הבית שלי" />
          </Screen>
        )}

        {step === 4 && (
          <Screen visual="בחירת סוג גג">
            <Kicker>סוג גג</Kicker>
            <h2>איזה גג יש לכם?</h2>
            <p>אם הגג לא אחיד או משופע, נסמן כל חלק בנפרד כדי לקבל חישוב מדויק יותר.</p>
            <div className="options">
              <Option active={roofType === 'flat'} onClick={() => setRoofType('flat')} icon="⬜">גג שטוח<small>מסמנים את כל הגג פעם אחת</small></Option>
              <Option active={roofType === 'sloped'} onClick={() => setRoofType('sloped')} icon="🏠">גג משופע / לא אחיד<small>מסמנים כמה משטחים בנפרד</small></Option>
            </div>
            <NavActions next={handleRoofContinue} prev={prev} />
          </Screen>
        )}

        {step === 5 && (
          <Screen visual="חלוקת משטחים">
            <Kicker>משטחי גג</Kicker>
            <h2>לכמה משטחים מחולק הגג?</h2>
            <p>נסמן כל משטח בנפרד כדי לחשב כיוון, שטח, פאנלים ותפוקה בצורה מדויקת יותר.</p>
            <div className="chips">
              {[2,3,4,5,6,7].map((n) => (
                <button key={n} className={surfaceCount === n ? 'chip active' : 'chip'} onClick={() => setSurfaceCount(n)}>{n === 7 ? 'אחר' : n}</button>
              ))}
            </div>
            <NavActions next={() => initSurfaces(surfaceCount)} prev={prev} nextLabel="המשך לסימון" />
          </Screen>
        )}

        {step === 6 && (
          <DrawingScreen
            surfaces={surfaces}
            setSurfaces={setSurfaces}
            currentSurface={currentSurface}
            setCurrentSurface={setCurrentSurface}
            onDone={() => setStep(7)}
            onBack={prev}
          />
        )}

        {step === 7 && (
          <Screen visual="חישוב כלכלי">
            <Kicker>חשבון חשמל</Kicker>
            <h2>כמה אתם משלמים בחשמל בחודש?</h2>
            <p>זה עוזר להעריך כמה מהייצור ייחסך ישירות וכמה יוזרם לרשת.</p>
            <label>חשבון חודשי ממוצע</label>
            <input type="number" value={bill} onChange={(e) => setBill(Number(e.target.value))} />
            <NavActions next={startAnalysis} prev={prev} nextLabel="חשב תוצאה" />
          </Screen>
        )}

        {step === 8 && (
          <Screen visual="Analyzing roof...">
            <Kicker>ניתוח</Kicker>
            <h2>אנחנו מנתחים את הגג שלכם</h2>
            <p>כמה שניות והדוח הראשוני יהיה מוכן.</p>
            <div className="analysis">
              {['זיהוי משטחי הגג','בדיקת כיוונים','חישוב מספר פאנלים','חישוב תפוקה שנתית','בניית דוח ראשוני'].map((t, i) => (
                <div key={t} style={{ animationDelay: `${i * 260}ms` }}><span><Check size={17}/></span>{t}</div>
              ))}
            </div>
          </Screen>
        )}

        {step === 9 && (
          <Screen visual="התוצאה שלכם">
            <Kicker>תוצאה ראשונית</Kicker>
            <h2>הגג שלכם יכול לעבוד בשבילכם</h2>
            <div className="results">
              <Result value={`${results.systemKw.toFixed(1)} kW`} label="גודל מערכת" />
              <Result value={`₪${round(results.annualSavings)}`} label="חיסכון שנתי" />
              <Result value={`${results.payback.toFixed(1)} שנים`} label="החזר השקעה" />
              <Result value={`₪${round(results.profit25)}`} label="רווח 25 שנה" />
            </div>
            <div className="surfaceTable">
              <div><b>שטח מסומן</b><span>{Math.round(results.totalArea)} מ״ר</span></div>
              <div><b>פאנלים משוערים</b><span>{results.panels || Math.round(results.totalArea * .7 / 3)}</span></div>
            </div>
            <div className="actions">
              <button onClick={next}>קבלו את הדוח המלא</button>
              <button className="secondary" onClick={() => setStep(6)}>עריכת סימון</button>
            </div>
          </Screen>
        )}

        {step === 10 && (
          <Screen visual="PDF / WhatsApp / Email">
            <Kicker>שליחת דוח</Kicker>
            <h2>הדוח הראשוני מוכן. לאן לשלוח?</h2>
            <label>שם</label><input placeholder="שם מלא" />
            <label>טלפון WhatsApp</label><input placeholder="05X-XXXXXXX" />
            <label>אימייל</label><input placeholder="name@email.com" />
            <div className="actions">
              <button onClick={() => setLeadSent(true)}>שלחו לי את הדוח</button>
              <button className="secondary" onClick={prev}>חזרה</button>
            </div>
            {leadSent && <div className="toast">הדוח נשמר בסימולציה. בשלב הבא נחבר שליחה אמיתית.</div>}
          </Screen>
        )}
      </main>
    </div>
  );
}

function Screen({ children, visual }) {
  return (
    <section className="screen">
      <div className="card">{children}</div>
      <div className="desktopVisual">
        <MapMock label={visual} />
      </div>
    </section>
  );
}

function Kicker({ children }) {
  return <div className="kicker">{children}</div>;
}

function Option({ active, onClick, icon, children }) {
  return (
    <button className={active ? 'option active' : 'option'} onClick={onClick}>
      <span>{children}</span>
      <span className="optionIcon">{icon}</span>
    </button>
  );
}

function NavActions({ next, prev, nextLabel = 'המשך' }) {
  return (
    <div className="actions">
      <button onClick={next}>{nextLabel}</button>
      <button className="secondary" onClick={prev}>חזרה</button>
    </div>
  );
}

function MapMock({ label, compact = false }) {
  return (
    <div className={compact ? 'mapMock compact' : 'mapMock'}>
      <div className="roofShape">{label}</div>
    </div>
  );
}

function DrawingScreen({ surfaces, setSurfaces, currentSurface, setCurrentSurface, onDone, onBack }) {
  const canvasRef = useRef(null);
  const [confirm, setConfirm] = useState('');

  const current = surfaces[currentSurface] || { points: [], area: 0 };

  useEffect(() => {
    drawCanvas(canvasRef.current, surfaces, currentSurface);
  }, [surfaces, currentSurface]);

  const addPoint = (event) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const touch = event.touches ? event.touches[0] : event;
    const point = {
      x: (touch.clientX - rect.left) * (canvas.width / rect.width),
      y: (touch.clientY - rect.top) * (canvas.height / rect.height)
    };
    updateCurrent({ points: [...current.points, point] });
  };

  const updateCurrent = (patch) => {
    setSurfaces((prev) => prev.map((s, i) => i === currentSurface ? { ...s, ...patch } : s));
  };

  const finish = () => {
    if ((current.points || []).length < 3) {
      alert('צריך לפחות 3 נקודות');
      return;
    }
    const area = polygonArea(current.points);
    const azimuth = detectAzimuth(current.points);
    const panels = Math.floor(area * 0.7 / 3);
    const kw = panels * 0.63;
    updateCurrent({ area, azimuth, panels, kw });
    setConfirm(`✓ משטח ${currentSurface + 1} נשמר · ${Math.round(area)} מ״ר · ${orientationName(azimuth)} · בערך ${panels} פאנלים`);
    window.setTimeout(() => {
      setConfirm('');
      if (currentSurface < surfaces.length - 1) {
        setCurrentSurface(currentSurface + 1);
      } else {
        onDone();
      }
    }, 1200);
  };

  const undo = () => updateCurrent({ points: current.points.slice(0, -1) });
  const clear = () => updateCurrent({ points: [], area: 0, azimuth: null, panels: 0, kw: 0 });

  return (
    <section className="screen drawing">
      <div className="card">
        <Kicker>סימון הגג</Kicker>
        <div className="surfaceHead">
          <b>{surfaces.length === 1 ? 'סמנו את שטח הגג' : `משטח ${currentSurface + 1} מתוך ${surfaces.length}`}</b>
          <span className="pill">{current.area ? 'נשמר' : 'לא נשמר'}</span>
        </div>
        <p>לחצו על נקודות סביב המשטח. כשתסיימו, לחצו "סיימתי את המשטח".</p>
        <SurfaceDots surfaces={surfaces} currentSurface={currentSurface} />
        <div className="canvasWrap">
          <canvas
            ref={canvasRef}
            width="900"
            height="600"
            onClick={addPoint}
            onTouchStart={(e) => { e.preventDefault(); addPoint(e); }}
          />
          <div className="canvasOverlay">משטח {currentSurface + 1}: סמנו לפחות 3 נקודות על הגג</div>
        </div>
        <div className="actions drawingActions">
          <button onClick={finish}>סיימתי את המשטח</button>
          <button className="secondary" onClick={undo}><Undo2 size={18}/> בטל נקודה</button>
          <button className="danger" onClick={clear}><Trash2 size={18}/> נקה</button>
        </div>
        {confirm && <div className="toast visible">{confirm}</div>}
        <SurfaceSummary surfaces={surfaces} />
        <div className="actions">
          <button className="secondary" onClick={onBack}>חזרה</button>
        </div>
      </div>
      <div className="desktopVisual">
        <MapMock label="מפת סימון אינטראקטיבית" />
      </div>
    </section>
  );
}

function SurfaceDots({ surfaces, currentSurface }) {
  return (
    <div className="dots">
      {surfaces.map((s, i) => <span key={i} className={i === currentSurface ? 'active' : s.area ? 'done' : ''} />)}
    </div>
  );
}

function SurfaceSummary({ surfaces }) {
  const total = surfaces.reduce((sum, s) => sum + (s.area || 0), 0);
  return (
    <div className="surfaceTable">
      {surfaces.map((s, i) => (
        <div key={i}><b>משטח {i + 1}</b><span>{s.area ? `${Math.round(s.area)} מ״ר · ${orientationName(s.azimuth)}` : '—'}</span></div>
      ))}
      <div><b>סה״כ</b><span>{Math.round(total)} מ״ר</span></div>
    </div>
  );
}

function Result({ value, label }) {
  return <div className="result"><div className="big">{value}</div><div className="label">{label}</div></div>;
}

function drawCanvas(canvas, surfaces, currentSurface) {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0,0,canvas.width,canvas.height);
  ctx.fillStyle = '#0b2136';
  ctx.fillRect(0,0,canvas.width,canvas.height);

  ctx.strokeStyle = 'rgba(255,255,255,.06)';
  for (let x=0; x<canvas.width; x+=34) { ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,canvas.height); ctx.stroke(); }
  for (let y=0; y<canvas.height; y+=34) { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(canvas.width,y); ctx.stroke(); }

  ctx.fillStyle = 'rgba(255,191,84,.08)';
  ctx.beginPath();
  ctx.moveTo(160,120); ctx.lineTo(720,80); ctx.lineTo(790,430); ctx.lineTo(210,480); ctx.closePath(); ctx.fill();

  surfaces.forEach((surface, index) => {
    const points = surface.points || [];
    if (!points.length) return;
    ctx.strokeStyle = colors[index % colors.length];
    ctx.fillStyle = hexToRgba(colors[index % colors.length], .2);
    ctx.lineWidth = index === currentSurface ? 5 : 3;

    ctx.beginPath();
    points.forEach((p, i) => i ? ctx.lineTo(p.x,p.y) : ctx.moveTo(p.x,p.y));
    if (surface.area) ctx.closePath();
    ctx.fill();
    ctx.stroke();

    points.forEach((p) => {
      ctx.beginPath();
      ctx.fillStyle = '#fff';
      ctx.arc(p.x,p.y,7,0,Math.PI*2);
      ctx.fill();
      ctx.strokeStyle = colors[index % colors.length];
      ctx.lineWidth = 3;
      ctx.stroke();
    });
  });
}

function polygonArea(points) {
  if (points.length < 3) return 0;
  let sum = 0;
  for (let i=0; i<points.length; i++) {
    const a = points[i], b = points[(i+1) % points.length];
    sum += a.x*b.y - b.x*a.y;
  }
  return Math.abs(sum / 2) / 38;
}

function detectAzimuth(points) {
  if (points.length < 2) return null;
  let best = { d:0, dx:0, dy:0 };
  for (let i=0; i<points.length; i++) {
    const a=points[i], b=points[(i+1) % points.length];
    const dx=b.x-a.x, dy=b.y-a.y, d=Math.hypot(dx,dy);
    if (d > best.d) best = { d, dx, dy };
  }
  return Math.round((Math.atan2(best.dx, -best.dy) * 180 / Math.PI + 360) % 360);
}

function orientationName(az) {
  if (az === null || az === undefined) return '—';
  const dirs = ['צפון','צפון־מזרח','מזרח','דרום־מזרח','דרום','דרום־מערב','מערב','צפון־מערב'];
  return dirs[Math.round(az / 45) % 8];
}

function orientationCoeff(az) {
  if (az === null || az === undefined) return 1;
  const d = Math.min(Math.abs(az-180), 360-Math.abs(az-180));
  if (d <= 30) return 1;
  if (d <= 70) return .94;
  if (d <= 110) return .86;
  if (d <= 150) return .75;
  return .65;
}

function hexToRgba(hex, alpha) {
  const h = hex.replace('#','');
  const r = parseInt(h.slice(0,2),16);
  const g = parseInt(h.slice(2,4),16);
  const b = parseInt(h.slice(4,6),16);
  return `rgba(${r},${g},${b},${alpha})`;
}

function round(n) {
  return Math.round(n).toLocaleString('he-IL');
}

createRoot(document.getElementById('root')).render(<App />);
