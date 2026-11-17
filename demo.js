// Mandatsgeheim demo: rule layer only (same patterns as the app's regex layer), runs entirely in this browser tab.
(() => {
  const ibanOk = s => { const x = s.replace(/\s/g, '').toUpperCase(); if (!/^[A-Z]{2}\d{2}[A-Z0-9]{11,30}$/.test(x)) return false;
    let m = 0; for (const c of x.slice(4) + x.slice(0, 4)) { const v = parseInt(c, 36); m = v >= 10 ? (m * 100 + v) % 97 : (m * 10 + v) % 97; } return m === 1; };
  const steuerOk = s => { const d = s.replace(/\D/g, '').split('').map(Number); if (d.length !== 11 || d[0] === 0) return false;
    let p = 10; for (const x of d.slice(0, 10)) { const t = (x + p) % 10 || 10; p = (t * 2) % 11; } return (11 - p) % 10 === d[10]; };
  const W = 'A-Za-zÄÖÜäöüß';
  const P = [
    ['E-Mail', /[A-Za-z0-9][A-Za-z0-9._%+-]*@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g],
    ['IBAN', /\b[A-Z]{2}\d{2}(?:\s?[A-Z0-9]{4}){3,7}(?:\s?[A-Z0-9]{1,3})?\b/g, ibanOk],
    ['Steuer-ID', /\b\d{2}\s?\d{3}\s?\d{3}\s?\d{3}\b/g, steuerOk],
    ['SV-Nummer', /\b\d{2}\s?\d{6}\s?[A-Z]\s?\d{3}\b/g],
    ['USt-IdNr', /\b(?:DE\s?\d{9}|ATU\d{8}|CHE-?\d{3}\.\d{3}\.\d{3})\b/g],
    ['Register-Nr', /\bHR[AB]\s?\d{1,6}(?:\s?[A-Z])?\b/g],
    ['Aktenzeichen', /\b(?:\d{1,3}-\d{1,3}|\d{1,3}|[IVX]{1,5})\s(?:[A-Z][a-z]{0,2}|[A-Z]{1,3})\s\d{1,5}\/\d{2}\b/g],
    ['Telefon', /(?<![\w.])(?:\+\d{2}\s?(?:\(0?\d{1,4}\)\s?)?\d{2,4}|0\d{2,5})\s?\/?\s?\d{2,4}(?:[ ]\d{2,4}){1,3}(?:-\d{1,5})?(?![\w/])/g],
    ['Telefon', /(?<![\w.])(?:\+\d{2}\s?(?:\(\d{1,4}\)\s?)?|0)\d{2,5}[\s/-]?\d{3,8}(?:[\s-]?\d{1,5})?(?!\w)/g],
    ['Kennzeichen', /\b[A-ZÄÖÜ]{1,3}-[A-Z]{1,2}\s\d{1,4}[EH]?\b/g],
    ['Geburtsdatum', /(?:geb(?:oren|\.)?(?:\s+am)?|Geburtsdatum:?)\s*(\d{1,2}\.\d{1,2}\.\d{4})/g],
    ['Adresse', new RegExp(`\\b[A-ZÄÖÜ][${W}.-]*(?:\\s[${W}][${W}.-]*){0,3}?\\s?(?:straße|strasse|str\\.|weg|allee|platz|gasse|ring|damm|ufer|chaussee|markt|Straße|Weg|Allee|Platz|Gasse|Ring|Markt)\\s\\d{1,4}\\s?[a-z]?,?\\s+\\d{4,5}\\s[A-ZÄÖÜ][${W}.-]+`, 'g')],
    ['Organisation', new RegExp(`\\b(?:[A-ZÄÖÜ][${W}&.'-]*\\s){1,4}(?:GmbH\\s&\\sCo\\.\\sKG|UG\\s\\(haftungsbeschränkt\\)|gGmbH|GmbH|AG|SE|KGaA|KG|OHG|GbR|e\\.\\s?V\\.|mbH)(?![${W}])`, 'g')],
    ['Person', /\b(?:Herr|Herrn|Frau)\s(?:(?:Dr|Prof)\.\s)*((?:[A-ZÄÖÜ]\.\s)?[A-ZÄÖÜ][a-zäöüß]+(?:-[A-ZÄÖÜ][a-zäöüß]+)?(?:\s[A-ZÄÖÜ][a-zäöüß]+)?)/g],
    ['Person', /(?:\b(?:Hallo|Liebe|Lieber|Sehr geehrte(?:r)?(?:\s(?:Frau|Herr))?)\s+)([A-ZÄÖÜ][a-zäöüß]+(?:[\s-][A-ZÄÖÜ][a-zäöüß]+)?)(?=\s*[,!\n])/g],
    ['Kennung', /(?:Personal|Kunden|Mandanten|Versicherten|Patienten|Schaden|Vertrags|Akten)[- ]?(?:nummer|Nummer|nr\.?|Nr\.?|-?ID)\s*:?\s*([A-Z0-9][A-Z0-9-]{2,})/g],
  ];
  const ALLOW = [/\b(?:Amts|Land|Oberlandes|Arbeits|Sozial|Verwaltungs|Finanz|Bundes)gerichts?\b(?:\s[A-ZÄÖÜ][a-zäöüß.-]+)?/g, /(?:§§?|Art\.)\s?\d+[a-z]?(?:\s(?:Abs\.|Satz|Nr\.)\s?\d*)*(?:\s[A-ZÄÖÜ][A-Za-zÄÖÜäöü]{1,10})?/g];
  const esc = s => s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  function detect(t) {
    let f = [];
    for (const [l, re, ok] of P) for (const m of t.matchAll(re)) {
      const g = m[1] !== undefined ? 1 : 0, s = g ? m.index + m[0].indexOf(m[1]) : m.index, v = m[g];
      if (ok && !ok(v)) continue; f.push([s, s + v.length, l]);
    }
    const al = ALLOW.flatMap(re => [...t.matchAll(re)].map(m => [m.index, m.index + m[0].length]));
    f = f.filter(([s, e]) => !al.some(([a, b]) => a <= s && e <= b + 1)).sort((a, b) => a[0] - b[0] || (b[1] - b[0]) - (a[1] - a[0]));
    const out = []; for (const x of f) { const last = out[out.length - 1]; if (last && x[0] < last[1]) continue; out.push(x); } return out;
  }
  function run() {
    const t = document.getElementById('demo-in').value, f = detect(t), n = {}, ph = {};
    let html = '', red = '', pos = 0;
    for (const [s, e, l] of f) {
      const k = l + '|' + t.slice(s, e).toLowerCase(); if (!ph[k]) { n[l] = (n[l] || 0) + 1; ph[k] = `[${l} ${n[l]}]`; }
      html += esc(t.slice(pos, s)) + `<mark title="${l}">${esc(t.slice(s, e))}</mark><small>${l}</small>`; red += t.slice(pos, s) + ph[k]; pos = e;
    }
    html += esc(t.slice(pos)); red += t.slice(pos);
    document.getElementById('demo-hl').innerHTML = html;
    document.getElementById('demo-out').textContent = red;
    document.getElementById('demo-n').textContent = `${f.length} Funde`;
  }
  window.MG = { detect };
  if (document.getElementById('demo-in')) { document.getElementById('demo-in').addEventListener('input', run); run(); }
})();
