export function parseSearchQuery(query) {
  const q = String(query || '').trim();
  const parts = q.split(/\s+/);
  const filters = { terms: [] };
  parts.forEach((p) => {
    const [key, ...rest] = p.split(':');
    const value = rest.join(':');
    if (!value) {
      filters.terms.push(p);
      return;
    }
    switch (key.toLowerCase()) {
      case 'from':
        filters.from = value;
        break;
      case 'subject':
        filters.subject = value;
        break;
      case 'category':
        filters.category = value;
        break;
      case 'date':
        filters.date = value;
        break;
      case 'has':
        filters.has = value;
        break;
      case 'is':
        filters.is = value;
        break;
      default:
        filters.terms.push(p);
    }
  });
  return filters;
}

export function buildSearchFilters(filters) {
  const out = { ...filters };
  const now = new Date();
  if (out.date) {
    if (out.date === 'today') {
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      out.dateRange = [start, now];
    } else if (out.date === 'this-week') {
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1);
      const start = new Date(now.getFullYear(), now.getMonth(), diff);
      out.dateRange = [start, now];
    }
  }
  if (out.is === 'unread') out.unread = true;
  if (out.is === 'processed') out.processed = true;
  if (out.has === 'actions') out.hasActions = true;
  return out;
}

export function highlightMatches(text, query) {
  const q = String(query || '').trim();
  if (!q) return text;
  const esc = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(esc, 'gi');
  return String(text || '').replace(re, (m) => `<mark class="bg-yellow-200">${m}</mark>`);
}

export function searchEmails(query, emails, options = {}) {
  const filters = buildSearchFilters(parseSearchQuery(query));
  const terms = (filters.terms || []).map((t) => t.toLowerCase());
  const match = (s) => {
    const v = String(s || '').toLowerCase();
    return terms.every((t) => v.includes(t));
  };
  const inRange = (ts) => {
    if (!filters.dateRange) return true;
    const d = new Date(ts);
    return d >= filters.dateRange[0] && d <= filters.dateRange[1];
  };
  const out = emails
    .filter((e) => {
      if (filters.from && !String(e.sender || '').toLowerCase().includes(filters.from.toLowerCase())) return false;
      if (filters.subject && !String(e.subject || '').toLowerCase().includes(filters.subject.toLowerCase())) return false;
      if (filters.category && String(e.category || '').toLowerCase() !== filters.category.toLowerCase()) return false;
      if (filters.unread && e.is_read) return false;
      if (filters.processed && !(e.is_processed || e.is_processed === 1)) return false;
      if (!inRange(e.timestamp)) return false;
      const base = [e.sender, e.subject, e.body, e.category].some(match);
      return terms.length ? base : true;
    })
    .map((e) => {
      const subjectScore = (String(e.subject || '').toLowerCase().includes((terms[0] || ''))) ? 2 : 0;
      const senderScore = (String(e.sender || '').toLowerCase().includes((terms[0] || ''))) ? 1.5 : 0;
      const bodyScore = (String(e.body || '').toLowerCase().includes((terms[0] || ''))) ? 1 : 0;
      const score = subjectScore + senderScore + bodyScore + (e.category && terms.includes(String(e.category).toLowerCase()) ? 0.5 : 0);
      return { ...e, _score: score };
    })
    .sort((a, b) => b._score - a._score);
  return out;
}
