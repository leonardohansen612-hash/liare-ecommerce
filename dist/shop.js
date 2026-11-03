const requestedAroma=new URLSearchParams(location.search).get('aroma');
const normalizeAroma=s=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
function matchesAroma(p){if(!requestedAroma)return true;const a=normalizeAroma(requestedAroma);return (p.aromas||[]).some(aroma=>normalizeAroma(aroma)===a)||normalizeAroma(p.name).includes(a)||(a==='morango e chantilly'&&p.modelCode==='LIA-016')||p.options.some(o=>o.choices.some(c=>normalizeAroma(c)===a))}

function productSlug(value){return String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')}
function productId(p){return p.variantCode||[p.modelCode,(p.aromas||[]).map(productSlug).join('--')].filter(Boolean).join('--')||productSlug(p.name)}
function productPath(p){return '/produtos/'+productSlug(p.slug||p.name)+'/'}
function productUrl(p){const params=new URLSearchParams();const aroma=new URLSearchParams(location.search).get('aroma');if(aroma)params.set('aroma',aroma);return productPath(p)+(params.size?'?'+params.toString():'')}
function productPhotos(p){return [...new Set([p.image,...(p.images||[])].filter(Boolean))]}

function productStock(p){
 if(p.available==='OUT_OF_STOCK')return 0;
 return Number.isInteger(p.stockQuantity)&&p.stockQuantity>=0?Math.min(999,p.stockQuantity):999;
}
function productStockLabel(p){
 const stock=productStock(p);
 return stock===0?'Esgotado':Number.isInteger(p.stockQuantity)?stock+' '+(stock===1?'unidade disponível':'unidades disponíveis'):'';
}
function reconcileCartStock(items,products){
 const used=new Map();
 return items.flatMap(item=>{
  const product=products.find(p=>p.name.trim()===item.name);
  if(!product)return [item];
  const limit=productStock(product),remaining=Math.max(0,limit-(used.get(item.name)||0));
  const qty=Math.min(item.qty,remaining);
  used.set(item.name,(used.get(item.name)||0)+qty);
  return qty?[{...item,qty,image:product.image,stockQuantity:limit}]:[];
 });
}

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

const aromaFilter=document.querySelector('#aroma-filter');aromaFilter.value=[...aromaFilter.options].find(o=>normalizeAroma(o.value)===normalizeAroma(requestedAroma==='Morango e Chantilly'?'Morango com Chantilly':requestedAroma||''))?.value||'';aromaFilter.onchange=renderShop;let products=[];const params=new URLSearchParams(location.search);const selected=params.get('categoria');const allowed=['Latinhas','Casa','Presentes','Linhas especiais','Personalizados','Castiçal Lapidado','Clássica Âmbar','Clássico Âmbar'];const heading=allowed.includes(selected)?selected:'Velas';const collectionTitle=heading==='Latinhas'?'Latinhas · Aromas Clássicos':heading;document.querySelector('#shop-title').textContent=document.querySelector('#shop-crumb').textContent=collectionTitle;document.title=collectionTitle+' · Loja LIARE';document.querySelector('#collection-intro').hidden=heading!=='Latinhas';document.querySelectorAll('[aria-label="Categorias da loja"] a').forEach(a=>{if(new URL(a.href).pathname.endsWith('/loja.html')&&new URL(a.href).searchParams.get('categoria')===selected)a.setAttribute('aria-current','page')});
const grid=document.querySelector('#shop-grid'),search=document.querySelector('#search'),sort=document.querySelector('#shop-sort'),form=document.querySelector('#price-filter');search.value=params.get('busca')||'';let low=null,high=null;
function renderShop(){let rows=products.filter(p=>matchesSection(p,heading)&&(!aromaFilter.value||(p.aromas||[]).some(a=>normalizeAroma(a)===normalizeAroma(aromaFilter.value)))&&normalizeAroma(p.name+' '+(p.aromas||[]).join(' ')+' '+p.options.flatMap(o=>o.choices).join(' ')).includes(normalizeAroma(search.value))&&(!p.priceOnRequest||(low===null&&high===null))&&(low===null||Number(p.price.maxValue.amount)>=low)&&(high===null||Number(p.price.minValue.amount)<=high));

if(sort.value==='name')rows.sort((a,b)=>a.name.localeCompare(b.name,'pt-BR'));if(sort.value==='price-up'||sort.value==='price-down'){const direction=sort.value==='price-up'?1:-1;rows.sort((a,b)=>{const unknownA=a.priceOnRequest||a.price.minValue.amount!==a.price.maxValue.amount,unknownB=b.priceOnRequest||b.price.minValue.amount!==b.price.maxValue.amount;return Number(unknownA)-Number(unknownB)||direction*(Number(a.price.minValue.amount)-Number(b.price.minValue.amount))})}grid.replaceChildren(...rows.map(createCard));document.querySelector('#shop-count').textContent=rows.length+' '+(rows.length===1?'produto':'produtos');document.querySelector('.shop-empty').hidden=rows.length>0}
search.oninput=renderShop;document.querySelector('.search').onsubmit=e=>{e.preventDefault();renderShop()};sort.onchange=renderShop;
const filters=document.querySelector('#shop-filters'),filterDialog=document.querySelector('#filters-dialog'),mobile=matchMedia('(max-width:760px)');function placeFilters(){if(!mobile.matches&&filterDialog.open)filterDialog.close();(mobile.matches?document.querySelector('#mobile-filter-content'):document.querySelector('#shop-sidebar')).append(filters)}placeFilters();mobile.addEventListener('change',placeFilters);document.querySelector('#filter-toggle').onclick=()=>filterDialog.showModal();filterDialog.querySelector('button').onclick=()=>filterDialog.close();filterDialog.addEventListener('click',e=>{if(e.target===filterDialog){const r=filterDialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)filterDialog.close()}});
form.onsubmit=e=>{e.preventDefault();if(!form.reportValidity())return;const min=form.elements.min.value,max=form.elements.max.value;if(min!==''&&max!==''&&Number(min)>Number(max)){document.querySelector('#filter-error').textContent='O valor inicial deve ser menor que o valor final.';return}document.querySelector('#filter-error').textContent='';low=min===''?null:Number(min);high=max===''?null:Number(max);renderShop();if(filterDialog.open)filterDialog.close()};form.querySelector('.reset-filter').onclick=()=>{form.reset();low=high=null;aromaFilter.value='';search.value='';document.querySelector('#filter-error').textContent='';renderShop()};
fetch('products.json',{cache:'no-store'}).then(r=>{if(!r.ok)throw Error();return r.json()}).then(data=>{products=data;renderShop()}).catch(()=>{grid.textContent='Não foi possível carregar as velas. Atualize a página ou fale com o ateliê pelo WhatsApp.'});
