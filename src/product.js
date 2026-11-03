{{include:scripts/shared/aroma.js}}
{{include:scripts/shared/product-cards.js}}
(()=>{
 const content=document.querySelector('#product-content');
 const status=document.querySelector('#product-status');
 const image=document.querySelector('#product-main-photo');
 const imageLink=document.querySelector('#product-photo-link');
 const thumbnails=document.querySelector('#product-thumbnails');
 const form=document.querySelector('#product-form');
 const quantity=document.querySelector('#product-quantity');
 const minus=document.querySelector('#product-minus');
 const plus=document.querySelector('#product-plus');
 const feedback=document.querySelector('#product-feedback');
 let product=null;
 const syncQuantity=()=>{const n=Number(quantity.value),limit=product?productStock(product):999;minus.disabled=!limit||n<=1;plus.disabled=!limit||n>=limit};
 const changeQuantity=step=>{const n=Number(quantity.value);quantity.value=Math.max(1,Math.min(product?productStock(product):999,(Number.isInteger(n)&&n>0?n:1)+step));syncQuantity()};
 minus.onclick=()=>changeQuantity(-1);
 plus.onclick=()=>changeQuantity(1);
 quantity.oninput=syncQuantity;
 form.onsubmit=event=>{
  event.preventDefault();
  if(!product||productStock(product)===0||!form.reportValidity())return;
  const qty=Number(quantity.value);
  if(!Number.isInteger(qty)||qty<1||qty>productStock(product))return;
  const selects=[...form.querySelectorAll('select')];
  if(selects.some(select=>!select.value))return;
  const choices=selects.map(select=>({name:select.dataset.label,value:select.value}));
  if(window.liareCart.add(product,choices,qty)===false){feedback.textContent='A quantidade disponível deste produto já está na sua sacola.';return}
  feedback.textContent='Adicionado à sua sacola.';
  window.liareCart.notify();
 };
 function showError(message){status.textContent=message;status.hidden=false;content.hidden=true;document.querySelector('#product-error-link').hidden=false}
 function renderProduct(p){
  product=p;
  const name=p.name.trim();
  document.title=name+' · LIARE';
  document.querySelector('meta[name="description"]').content=p.description||name+' — uma criação feita à mão no ateliê LIARE.';
  document.querySelector('#product-title').textContent=name;
  document.querySelector('#product-crumb').textContent=name;
  document.querySelector('#product-category').textContent=category(p);
  document.querySelector('#product-price').textContent=price(p);
  const stock=productStock(p),availability=document.querySelector('#product-availability');
  availability.textContent=productStockLabel(p)||'Disponível para pedido';
  availability.className='product-availability'+(stock===0?' is-sold-out':'');
  quantity.max=Math.max(1,stock);quantity.disabled=stock===0;
  const description=document.querySelector('#product-description');description.textContent=p.description||'';description.hidden=!p.description;
  const technical=p.technicalDetails||{};
  const estimate=technical.burnTimeEstimate;
  const hasEstimate=Number.isFinite(estimate?.minHours)&&Number.isFinite(estimate?.maxHours)&&estimate.minHours>0&&estimate.maxHours>=estimate.minHours;
  const details={
   aroma:(p.aromas||[]).join(' · '),
   family:technical.olfactiveFamily||'',
   weight:p.waxWeightGrams?p.waxWeightGrams+' g':'',
   'burn-time':hasEstimate?(estimate.minHours===estimate.maxHours?'Aprox. '+estimate.minHours:estimate.minHours+' a '+estimate.maxHours)+' horas':'',
   composition:technical.composition||'',container:technical.container||'',production:technical.production||''
  };
  Object.entries(details).forEach(([key,value])=>{document.querySelector('#product-'+key).textContent=value;document.querySelector('#product-'+key+'-row').hidden=!value});
  const profile=technical.olfactiveProfile||[];
  profile.forEach(note=>{const tag=document.createElement('span');tag.textContent=note;document.querySelector('#product-profile').append(tag)});
  document.querySelector('#product-profile-row').hidden=!profile.length;
  const pyramid=technical.aromaPyramid||{};
  let hasNotes=false;
  ['top','heart','base'].forEach(level=>{const notes=(pyramid[level]||[]).join(', ');document.querySelector('#product-notes-'+level).textContent=notes;document.querySelector('#product-notes-'+level+'-row').hidden=!notes;if(notes)hasNotes=true});
  document.querySelector('#product-notes-row').hidden=!hasNotes;
  document.querySelector('#product-burn-note').hidden=!hasEstimate;
  const renderList=(id,items)=>{items.forEach(text=>{const item=document.createElement('li');item.textContent=text;document.querySelector('#product-'+id).append(item)});return items.length>0};
  const sections={
   profile:!!(details.aroma||details.family||hasNotes||profile.length),
   characteristics:!!(details.weight||details['burn-time']||details.container||details.production),
   use:renderList('use',technical.useInstructions||[]),
   precautions:renderList('precautions',technical.precautions||[]),
   composition:!!details.composition
  };
  Object.entries(sections).forEach(([key,visible])=>document.querySelector('#product-'+key+'-section').hidden=!visible);
  document.querySelector('#product-specifications').hidden=!Object.values(sections).some(Boolean);
  document.querySelector('#product-add').textContent=p.priceOnRequest||p.price.minValue.amount!==p.price.maxValue.amount?'Adicionar ao orçamento':'Adicionar à sacola';
  if(stock===0)document.querySelector('#product-add').textContent='Esgotado';
  document.querySelector('#product-add').disabled=stock===0;
  const photos=productPhotos(p);
  imageLink.hidden=!photos.length;
  document.querySelector('#product-photo-empty').hidden=photos.length>0;
  document.querySelector('#product-photo-hint').hidden=!photos.length;
  thumbnails.hidden=photos.length<=1;
  const count=document.querySelector('#product-photo-count');count.hidden=photos.length<=1;
  function showPhoto(index){image.src=photos[index];image.alt=name+' — foto '+(index+1);imageLink.href=photos[index];count.textContent=(index+1)+' de '+photos.length;[...thumbnails.children].forEach((button,i)=>button.setAttribute('aria-pressed',String(i===index)))}
  photos.forEach((src,i)=>{const button=document.createElement('button');button.type='button';button.setAttribute('aria-label',p.imageLabels?.[i]||'Ver foto '+(i+1));const thumb=document.createElement('img');thumb.src=src;thumb.alt='';thumb.loading='lazy';button.append(thumb);button.onclick=()=>showPhoto(i);thumbnails.append(button)});
  if(photos.length)showPhoto(0);
  const options=document.querySelector('#product-options');
  (p.options||[]).forEach(option=>{
   const label=document.createElement('label');label.textContent=option.name;
   const select=document.createElement('select');select.dataset.label=option.name;select.required=true;
   const blank=document.createElement('option');blank.value='';blank.textContent='Selecione uma opção';select.append(blank);
   option.choices.forEach(choice=>{const item=document.createElement('option');item.value=choice;item.textContent=choice;select.append(item)});
   if(requestedAroma){const selected=option.choices.find(choice=>normalizeAroma(choice)===normalizeAroma(requestedAroma));if(selected)select.value=selected}
   label.append(select);options.append(label);
  });
  syncQuantity();status.hidden=true;content.hidden=false;
 }
 const id=new URLSearchParams(location.search).get('produto');
 const path=String(location.pathname||'').replace(/\/index\.html$/,'/').replace(/\/$/,'')+'/';
 if(!id&&!path.startsWith('/produtos/')){showError('Escolha uma vela na loja para ver os detalhes.');return}
 fetch('products.json',{cache:'no-store'}).then(response=>{if(!response.ok)throw Error('catalog');return response.json()}).then(products=>{const selected=products.find(p=>id?productId(p)===id:productPath(p)===path);if(selected)renderProduct(selected);else showError('Não encontramos este produto. Veja as velas disponíveis na loja.')}).catch(()=>showError('Não foi possível carregar o produto. Atualize a página ou volte para a loja.'));
})();
