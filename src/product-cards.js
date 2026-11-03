{{include:scripts/shared/product-links.js}}
{{include:scripts/shared/product-stock.js}}
const category=p=>p.category||(/Evento/.test(p.name)?'Personalizados':/Lapidado/.test(p.name)?'Lapidados':/Gourmand/.test(p.name)?'Gourmand':/Cubo/.test(p.name)?'Cubos':/Âmbar/.test(p.name)?'Clássicos':'Flores');
function matchesSection(p,filter){
 if(filter==='Todos'||filter==='Velas')return true;
 const aliases={'Lapidados':'Castiçal Lapidado','Clássica Âmbar':'Clássico Âmbar','Latinhas · Aromas Clássicos':'Latinhas'};
 return (p.categories||[]).includes(aliases[filter]||filter)||category(p)===filter;
}
const money=v=>Number(v).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
const price=p=>p.priceOnRequest||p.price.minValue.amount!==p.price.maxValue.amount?'Valor sob consulta':money(p.price.minValue.amount);
function createCard(p){
 const card=document.createElement('article');card.className='product';
 const picture=document.createElement('a');picture.href=productUrl(p);picture.className='picture';picture.setAttribute('aria-label','Ver detalhes de '+p.name.trim());
 if(p.image){const img=document.createElement('img');img.src=p.image;img.alt=p.name;img.loading='lazy';picture.append(img)}else{const label=document.createElement('span');label.textContent='Coelhinho personalizado';label.className='product-without-photo';picture.append(label)}
 if(productStock(p)===0){const badge=document.createElement('span');badge.className='product-stock-badge';badge.textContent='Esgotado';picture.append(badge)}
 const title=document.createElement('h3');const titleLink=document.createElement('a');titleLink.href=productUrl(p);titleLink.textContent=p.name.trim();title.append(titleLink);
 const foot=document.createElement('div');foot.className='foot';const value=document.createElement('span');value.textContent=price(p);
 const bag=document.createElement('button');bag.type='button';bag.className='product-bag';bag.setAttribute('aria-label',(p.options?.length?'Escolher opções de ':'Adicionar à sacola: ')+p.name.trim());
 bag.disabled=productStock(p)===0;
 if(bag.disabled)bag.setAttribute('aria-label','Esgotado: '+p.name.trim());
 bag.onclick=event=>{
  event.preventDefault();event.stopPropagation();
  if(productStock(p)===0)return;
  if(p.options?.length){location.href=productUrl(p);return}
  if(window.liareCart.add(p,[],1)!==false)window.liareCart.notify();
 };
 bag.innerHTML='<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 7h14l1 14H4L5 7Z"/><path d="M8 9V6a4 4 0 0 1 8 0v3"/></svg>';
 foot.append(value,bag);card.append(picture,title);
 if(productStock(p)>0&&productStockLabel(p)){const stock=document.createElement('p');stock.className='product-stock-count';stock.textContent=productStockLabel(p);card.append(stock)}
 card.append(foot);return card;
}
