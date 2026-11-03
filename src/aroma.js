const requestedAroma=new URLSearchParams(location.search).get('aroma');
const normalizeAroma=s=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
function matchesAroma(p){if(!requestedAroma)return true;const a=normalizeAroma(requestedAroma);return (p.aromas||[]).some(aroma=>normalizeAroma(aroma)===a)||normalizeAroma(p.name).includes(a)||(a==='morango e chantilly'&&p.modelCode==='LIA-016')||p.options.some(o=>o.choices.some(c=>normalizeAroma(c)===a))}
