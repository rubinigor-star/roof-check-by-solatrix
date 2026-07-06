const STORAGE_KEY = 'solatrix_roof_check_leads';

export const LEAD_STATUSES = ['חדש', 'נוצר קשר', 'נקבע סיור', 'הצעת מחיר', 'עסקה', 'לא רלוונטי'];

export function getLeads() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveLead(lead) {
  const leads = getLeads();
  const existingIndex = leads.findIndex((item) => item.id === lead.id);
  const nextLead = {
    ...lead,
    id: lead.id || createLeadId(leads.length + 1),
    status: lead.status || 'חדש',
    createdAt: lead.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  if (existingIndex >= 0) leads[existingIndex] = nextLead;
  else leads.unshift(nextLead);
  persist(leads);
  return nextLead;
}

export function updateLeadStatus(id, status) {
  const leads = getLeads();
  const next = leads.map((lead) => lead.id === id ? { ...lead, status, updatedAt: new Date().toISOString() } : lead);
  persist(next);
  return next.find((lead) => lead.id === id);
}

export function getLead(id) {
  return getLeads().find((lead) => lead.id === id);
}

export function clearLeads() {
  localStorage.removeItem(STORAGE_KEY);
}

export function seedDemoLeads() {
  if (getLeads().length) return getLeads();
  const now = new Date().toISOString();
  const demoLeads = [
    {
      id: 'SOL-DEMO-00001',
      name: 'משפחת לוי',
      phone: '054-729-9727',
      email: 'levi@example.com',
      address: 'החרמון 10, חיפה',
      monthlyBill: 920,
      projectType: 'private-home',
      roofType: 'flat',
      systemKw: 8.7,
      annualProduction: 13940,
      annualSavings: 7240,
      payback: 3.5,
      profit25: 155600,
      status: 'חדש',
      notes: 'ביקשו שיחה אחרי 18:00',
      source: 'Roof Check demo',
      createdAt: now,
      updatedAt: now
    },
    {
      id: 'SOL-DEMO-00002',
      name: 'אבו סאלח חקלאות',
      phone: '052-410-7788',
      email: '',
      address: 'משק בגליל מערבי',
      monthlyBill: 2400,
      projectType: 'agriculture',
      roofType: 'commercial',
      systemKw: 23.4,
      annualProduction: 37440,
      annualSavings: 18600,
      payback: 3.6,
      profit25: 397200,
      status: 'נקבע סיור',
      notes: 'גג פח גדול, צריך לבדוק קונסטרוקציה',
      source: 'Roof Check demo',
      createdAt: now,
      updatedAt: now
    },
    {
      id: 'SOL-DEMO-00003',
      name: 'כהן נכסים',
      phone: '050-333-2211',
      email: 'office@example.com',
      address: 'אזור תעשייה חיפה',
      monthlyBill: 5100,
      projectType: 'business',
      roofType: 'commercial',
      systemKw: 47.1,
      annualProduction: 75280,
      annualSavings: 35900,
      payback: 3.8,
      profit25: 760000,
      status: 'הצעת מחיר',
      notes: 'מבקש סימולציה של 100kW בהמשך',
      source: 'Roof Check demo',
      createdAt: now,
      updatedAt: now
    }
  ];
  persist(demoLeads);
  return demoLeads;
}

export function exportLeadsCsv() {
  const headers = ['id','createdAt','status','name','phone','email','address','projectType','roofType','monthlyBill','systemKw','annualProduction','annualSavings','payback','profit25','source','notes'];
  const rows = getLeads().map((lead) => headers.map((key) => csvCell(lead[key])).join(','));
  return `\ufeff${headers.join(',')}\n${rows.join('\n')}`;
}

function persist(leads) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(leads));
}

function csvCell(value) {
  const text = value == null ? '' : String(value);
  return `"${text.replace(/"/g, '""')}"`;
}

function createLeadId(index) {
  const year = new Date().getFullYear();
  return `SOL-${year}-${String(index).padStart(5, '0')}`;
}
