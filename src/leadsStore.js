const STORAGE_KEY = 'solatrix_roof_check_leads';

export const LEAD_STATUSES = ['חדש', 'נוצר קשר', 'נקבע סיור', 'הצעת מחיר', 'עסקה', 'לא רלוונטי'];

export function getLeads() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
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
  localStorage.setItem(STORAGE_KEY, JSON.stringify(leads));
  return nextLead;
}

export function updateLeadStatus(id, status) {
  const leads = getLeads();
  const next = leads.map((lead) => lead.id === id ? { ...lead, status, updatedAt: new Date().toISOString() } : lead);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return next.find((lead) => lead.id === id);
}

export function getLead(id) {
  return getLeads().find((lead) => lead.id === id);
}

function createLeadId(index) {
  const year = new Date().getFullYear();
  return `SOL-${year}-${String(index).padStart(5, '0')}`;
}
