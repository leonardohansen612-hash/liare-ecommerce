import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const catalog=JSON.parse(read('src/data/products.json'));
const pageScript=read('dist/product.js');
const html=read('dist/produto.html');
const links=read('src/scripts/shared/product-links.js');

// A small DOM adapter exercises the shipped page logic without a browser or dependencies.
class Element{
 constructor(tag='div'){this.tagName=tag.toUpperCase();this.children=[];this.attributes={};this.dataset={};this.hidden=false;this.value='';this.textContent='';this.disabled=false}
 append(...children){this.children.push(...children)}
 setAttribute(name,value){this.attributes[name]=String(value)}
 getAttribute(name){return this.attributes[name]??null}
 querySelectorAll(selector){return this.children.flatMap(child=>[...(child.tagName.toLowerCase()===selector?[child]:[]),...child.querySelectorAll(selector)])}
 reportValidity(){return ![this,...this.querySelectorAll('select'),...this.querySelectorAll('input')].some(e=>e.required&&!e.value)}
}
function linkContext(search=''){
 const context={URLSearchParams,location:{search},document:{createElement:tag=>new Element(tag)}};
 vm.createContext(context);vm.runInContext(links,context);return context;
}
async function loadPage(products=catalog,{id,search,pathname='/produto.html',fail=false}={}){
 const nodes=new Map();
 for(const match of html.matchAll(/<([a-z][\w-]*)\b([^>]*\bid="([^"]+)"[^>]*)>/gi)){
  const element=new Element(match[1]);element.hidden=/\bhidden\b/.test(match[2]);nodes.set('#'+match[3],element);
 }
 const meta=new Element('meta');nodes.set('meta[name="description"]',meta);
 const quantity=nodes.get('#product-quantity');quantity.value='1';quantity.required=true;
 const form=nodes.get('#product-form');form.append(nodes.get('#product-options'),quantity);
 const calls=[];let notifications=0;
 const context={URLSearchParams,location:{pathname,search:search??'?produto='+encodeURIComponent(id??linkContext().productId(products[0]))},
  document:{title:'',querySelector:selector=>{if(!nodes.has(selector))throw Error('Missing selector '+selector);return nodes.get(selector)},createElement:tag=>new Element(tag)},
  window:{liareCart:{add:(p,choices,qty)=>calls.push(JSON.parse(JSON.stringify({p,choices,qty}))),notify:()=>notifications++}},
  fetch:async()=>{if(fail)throw Error('offline');return {ok:true,json:async()=>products}}
 };
 vm.createContext(context);vm.runInContext(pageScript,context);
 await new Promise(resolve=>setImmediate(resolve));
 return {nodes,context,calls,get notifications(){return notifications},submit(){form.onsubmit({preventDefault(){}})}};
}

test('every catalog product has a unique shareable URL, including each aroma',()=>{
 const context=linkContext('?aroma=Doce%20Lavanda');
 const ids=catalog.map(p=>context.productId(p));assert.equal(new Set(ids).size,catalog.length);
 const paths=catalog.map(p=>context.productPath(p));assert.equal(new Set(paths).size,catalog.length);
 for(const p of catalog){const url=new URL(context.productUrl(p),'https://example.test/');assert.equal(url.pathname,'/produtos/'+p.slug+'/');assert.equal(url.searchParams.has('produto'),false);assert.equal(url.searchParams.get('aroma'),'Doce Lavanda')}
 assert.equal(linkContext().productUrl(catalog.find(p=>p.modelCode==='LIA-016')),'/produtos/milk-shake-de-morango/');
});

test('photo and product name link to details while the bag adds one item without navigating',()=>{
 const context=linkContext();vm.runInContext(read('src/scripts/shared/product-cards.js').replace('{{include:scripts/shared/product-links.js}}','').replace('{{include:scripts/shared/product-stock.js}}',read('src/scripts/shared/product-stock.js')),context);
 const card=context.createCard(catalog[0]);const href=context.productUrl(catalog[0]);
 const anchors=card.querySelectorAll('a');assert.equal(anchors.length,2);
 for(const anchor of anchors){assert.equal(anchor.href,href);assert.equal(anchor.onclick,undefined)}
 const calls=[];let notifications=0,prevented=0,stopped=0;
 context.window={liareCart:{add:(p,choices,qty)=>calls.push(JSON.parse(JSON.stringify({p,choices,qty}))),notify:()=>notifications++}};
 const bag=card.querySelectorAll('button')[0];assert.equal(bag.type,'button');assert.equal(bag.href,undefined);
 assert.match(bag.getAttribute('aria-label'),/Adicionar à sacola/);
 bag.onclick({preventDefault(){prevented++},stopPropagation(){stopped++}});
 assert.equal(calls.length,1);assert.equal(calls[0].p.name,catalog[0].name);assert.equal(calls[0].qty,1);assert.deepEqual(calls[0].choices,[]);
 assert.equal(notifications,1);assert.equal(prevented,1);assert.equal(stopped,1);assert.equal(context.location.href,undefined);
 bag.onclick({preventDefault(){},stopPropagation(){}});assert.equal(calls.length,2);
});

test('available product cards add the exact aroma while sold-out cards block ordering',()=>{
 const context=linkContext();vm.runInContext(read('src/scripts/shared/product-cards.js').replace('{{include:scripts/shared/product-links.js}}','').replace('{{include:scripts/shared/product-stock.js}}',read('src/scripts/shared/product-stock.js')),context);
 const added=[];context.window={liareCart:{add:(p,choices,qty)=>added.push({p,choices,qty}),notify(){}}};
 for(const p of catalog){const card=context.createCard(p);const bag=card.querySelectorAll('button')[0];assert.equal(bag.disabled,p.available==='OUT_OF_STOCK');bag.onclick({preventDefault(){},stopPropagation(){}})}
 const available=catalog.filter(p=>p.available!=='OUT_OF_STOCK');
 assert.equal(added.length,available.length);for(let i=0;i<available.length;i++){assert.equal(added[i].p,available[i]);assert.equal(added[i].qty,1);assert.equal(added[i].choices.length,0)}
 assert.equal(context.location.href,undefined);
});

test('products with required options still require a choice before entering the bag',()=>{
 const context=linkContext();vm.runInContext(read('src/scripts/shared/product-cards.js').replace('{{include:scripts/shared/product-links.js}}','').replace('{{include:scripts/shared/product-stock.js}}',read('src/scripts/shared/product-stock.js')),context);
 const p={...catalog[0],options:[{name:'Aroma',choices:['Chá Branco','Doce Lavanda']}]};
 context.window={liareCart:{add(){throw Error('Missing required choice')},notify(){throw Error('Not yet added')}}};
 const card=context.createCard(p);card.querySelectorAll('button')[0].onclick({preventDefault(){},stopPropagation(){}});
 assert.equal(context.location.href,context.productUrl(p));
});

test('cart thumbnails accept all current local catalog photos, including all six amber aromas',()=>{
 const context={URL,document:{baseURI:'https://www.liarehandmade.com.br/loja.html'}};
 vm.createContext(context);vm.runInContext(read('src/scripts/cart.js').split('(()=>{')[0],context);
 const amber=catalog.filter(p=>p.name.startsWith('Clássico Âmbar'));
 assert.equal(amber.length,6);
 for(const p of catalog.filter(p=>p.image)){
  const url=context.cartPhotoUrl(p.image);assert.equal(new URL(url).pathname,'/'+p.image);
  assert.ok(readFileSync(new URL('../dist/'+p.image,import.meta.url)).length>0);
 }
 assert.equal(context.cartPhotoUrl('/classico-ambar-cha-branco-botanico.webp'),'https://www.liarehandmade.com.br/classico-ambar-cha-branco-botanico.webp');
 assert.equal(context.cartPhotoUrl('https://images.example.test/candle.webp'),'https://images.example.test/candle.webp');
 for(const source of ['',null,undefined,'data:image/png;base64,invalid','javascript:alert(1)'])assert.equal(context.cartPhotoUrl(source),'');
});

test('a missing cart thumbnail cannot push the name into the narrow image column',()=>{
 const css=read('src/styles/store/products-cart.css');
 assert.match(css,/\.cart-item-content\{grid-column:2;/);
 assert.match(css,/\.cart-item:has\(\.cart-thumbnail\[hidden\]\)>\.cart-item-content\{grid-column:1\/-1\}/);
 assert.match(read('src/scripts/cart.js'),/photo\.onerror=\(\)=>\{photo\.hidden=true\}/);
});

test('strawberry page displays its real price, 190 g and current photographs',async()=>{
 const p=catalog.find(p=>p.modelCode==='LIA-016');const page=await loadPage(catalog,{id:linkContext().productId(p)});
 assert.equal(page.nodes.get('#product-content').hidden,false);
 assert.equal(page.nodes.get('#product-title').textContent,p.name.trim());
 assert.match(page.nodes.get('#product-price').textContent,/75/);
 assert.equal(page.nodes.get('#product-weight').textContent,'190 g');
 assert.equal(page.nodes.get('#product-main-photo').src,p.image);
 assert.equal(page.nodes.get('#product-thumbnails').children.length,p.images.length);
 assert.equal(page.nodes.get('#product-photo-count').textContent,'1 de '+p.images.length);
 assert.equal(page.context.document.title,'Milk-shake de Morango · LIARE');
});

test('discovery box orders a complete six-aroma kit with the atelier price and made-to-order availability',async()=>{
 const p=catalog.find(p=>p.slug==='caixa-de-descobertas-aromas-classicos');
 const page=await loadPage(catalog,{pathname:'/produtos/caixa-de-descobertas-aromas-classicos/',search:''});
 assert.equal(page.nodes.get('#product-content').hidden,false);
 assert.match(page.nodes.get('#product-price').textContent,/110/);
 assert.equal(page.nodes.get('#product-weight').textContent,'270 g');
 assert.equal(page.nodes.get('#product-main-photo').src,'produto-caixa-de-descobertas-aromas-classicos-20261029.webp');
 assert.deepEqual(p.aromas,['Tangerina e Canela','Doce Lavanda','Chá Branco','Baunilha Cremosa','Pera Silvestre','Buquê de Peônias']);
 for(const aroma of p.aromas)assert.ok(page.nodes.get('#product-aroma').textContent.includes(aroma));
 assert.equal(page.nodes.get('#product-options').children.length,0);
 assert.equal(page.nodes.get('#product-availability').textContent,'Disponível para pedido');
 assert.equal(p.trackInventory,false);assert.equal(p.stockQuantity,undefined);
 const qty=page.nodes.get('#product-quantity');assert.equal(qty.max,999);
 qty.value='6';page.submit();assert.equal(page.calls.length,1);assert.equal(page.calls[0].qty,6);
 page.calls.length=0;
 qty.value='2';page.submit();assert.equal(page.calls.length,1);
 assert.equal(page.calls[0].p.variantCode,'chatgpt_cb68c2dad4c147a3c23af082');
 assert.equal(page.calls[0].qty,2);assert.deepEqual(page.calls[0].choices,[]);
 const published=read('dist/produtos/caixa-de-descobertas-aromas-classicos/index.html');
 assert.match(published,/sharing\/produto-caixa-de-descobertas-aromas-classicos-20261029.jpg/);
 assert.match(read('dist/index.html'),/href="\/produtos\/caixa-de-descobertas-aromas-classicos\/"/);
});

test('strawberry details show the approved copy and its own aroma, materials and estimated burn time',async()=>{
 const p=catalog.find(p=>p.modelCode==='LIA-016');const page=await loadPage([p]);
 assert.equal(page.nodes.get('#product-description').textContent,p.description);
 assert.match(p.description,/O perfume de um milk-shake de morango daqueles caprichados/);
 assert.equal(page.nodes.get('#product-specifications').hidden,false);
 assert.equal(page.nodes.get('#product-aroma').textContent,'Morango com Chantilly');
 assert.equal(page.nodes.get('#product-notes-row').hidden,false);
 assert.equal(page.nodes.get('#product-notes-top').textContent,'Anis, Maçã, Morango');
 assert.equal(page.nodes.get('#product-notes-heart').textContent,'Violeta, Folhas de Morango');
 assert.equal(page.nodes.get('#product-notes-base').textContent,'Chantilly, Baunilha, Caramelo');
 assert.deepEqual(page.nodes.get('#product-profile').children.map(tag=>tag.textContent),['Frutado','Doce','Cremoso']);
 assert.equal(page.nodes.get('#product-family').textContent,'Adocicada');
 assert.equal(page.nodes.get('#product-composition').textContent,'Cera de coco 100% vegetal, essência aromática premium segura e livre de ftalatos, pavio de algodão.');
 for(const key of ['profile','characteristics','use','precautions','composition'])assert.equal(page.nodes.get('#product-'+key+'-section').hidden,false);
 assert.equal(page.nodes.get('#product-use').children.length,3);
 assert.equal(page.nodes.get('#product-precautions').children.length,4);
 assert.equal(page.nodes.get('#product-container').textContent,'Copo de vidro');
 assert.equal(page.nodes.get('#product-burn-time').textContent,'30 a 40 horas');
 assert.equal(page.nodes.get('#product-burn-time-row').hidden,false);
 assert.equal(page.nodes.get('#product-burn-note').hidden,false);
 assert.match(html,/<dt>Queima estimada<\/dt>/);
 assert.ok(html.indexOf('id="product-specifications"')>html.indexOf('id="product-description"'));
});

test('technical details do not invent burn times or materials for other products',async()=>{
 const p=catalog.find(p=>!p.technicalDetails&&p.waxWeightGrams);const page=await loadPage([p]);
 assert.equal(page.nodes.get('#product-aroma').textContent,p.aromas.join(' · '));
 assert.equal(page.nodes.get('#product-weight').textContent,p.waxWeightGrams+' g');
 for(const key of ['burn-time','profile','notes','family','composition','container','production'])assert.equal(page.nodes.get('#product-'+key+'-row').hidden,true);
 for(const key of ['use','precautions','composition'])assert.equal(page.nodes.get('#product-'+key+'-section').hidden,true);
 assert.equal(page.nodes.get('#product-burn-note').hidden,true);
});

test('the details box handles missing information and invalid burn-time ranges',async()=>{
 const empty=await loadPage([{...catalog[0],aromas:[],waxWeightGrams:null,technicalDetails:{}}]);
 assert.equal(empty.nodes.get('#product-specifications').hidden,true);
 for(const estimate of [{minHours:-10,maxHours:40},{minHours:40,maxHours:30},{minHours:30}]){
  const page=await loadPage([{...catalog[0],technicalDetails:{burnTimeEstimate:estimate}}]);
  assert.equal(page.nodes.get('#product-burn-time-row').hidden,true);
  assert.equal(page.nodes.get('#product-burn-note').hidden,true);
 }
});

test('friendly product paths and explicit directory indexes resolve the right product',async()=>{
 for(const p of catalog){
  const pathname=linkContext().productPath(p);
  const page=await loadPage(catalog,{search:'',pathname});
  assert.equal(page.nodes.get('#product-title').textContent,p.name.trim());
 }
 const p=catalog.find(p=>p.modelCode==='LIA-016');
 const page=await loadPage(catalog,{search:'',pathname:linkContext().productPath(p)+'index.html'});
 assert.equal(page.nodes.get('#product-title').textContent,p.name);
});

test('every product has complete social preview metadata in its static HTML',()=>{
 for(const p of catalog){
  const path=linkContext().productPath(p);
  const page=read('dist'+path+'index.html');
  const head=page.split('</head>')[0];
  assert.match(head,/<base href="\/">/);
  assert.ok(head.includes('<title>'+p.name.trim()+' · LIARE</title>'));
  const canonical=head.match(/<link rel="canonical" href="([^"]+)">/)[1];
  assert.equal(canonical,'https://www.liarehandmade.com.br'+path);
  assert.ok(head.includes('<meta property="og:url" content="'+canonical+'">'));
  const image=head.match(/<meta property="og:image" content="([^"]+)">/)[1];
  const imageUrl=new URL(image);assert.equal(imageUrl.origin,'https://www.liarehandmade.com.br');
  assert.equal(imageUrl.pathname,'/sharing/'+p.image.replace(/\.[^.]+$/,'.jpg'));
  assert.ok(readFileSync(new URL('../dist'+imageUrl.pathname,import.meta.url)).length>0);
  assert.ok(head.includes('<meta property="og:title" content="'+p.name.trim()+' · LIARE">'));
  assert.match(head,/<meta property="og:description" content="[^"]+">/);
  assert.match(head,/<meta property="og:image:alt" content="[^"]+">/);
  assert.match(head,/<meta name="twitter:card" content="summary_large_image">/);
 }
});

test('main site pages also include sharing titles, descriptions and a photograph',()=>{
 for(const name of ['index','loja','aromas','empresas','contato']){
  const head=read('dist/'+name+'.html').split('</head>')[0];
  for(const property of ['og:title','og:description','og:url','og:image'])assert.ok(head.includes('property="'+property+'"'));
  assert.equal((head.match(/rel="canonical"/g)||[]).length,1);
 }
});

test('gallery updates main photo, full-size link, selection and counter together',async()=>{
 const p=catalog.find(p=>p.modelCode==='LIA-016');const page=await loadPage(catalog,{id:linkContext().productId(p)});
 const thumbnails=page.nodes.get('#product-thumbnails').children;thumbnails[2].onclick();
 assert.equal(page.nodes.get('#product-main-photo').src,p.images[2]);
 assert.equal(page.nodes.get('#product-photo-link').href,p.images[2]);
 assert.equal(page.nodes.get('#product-photo-count').textContent,'3 de '+p.images.length);
 assert.equal(thumbnails[2].getAttribute('aria-pressed'),'true');
 assert.equal(thumbnails[0].getAttribute('aria-pressed'),'false');
});

test('adding quantity two uses the existing cart API without leaving the product page',async()=>{
 const page=await loadPage();page.nodes.get('#product-quantity').value='2';page.submit();
 assert.equal(page.calls.length,1);assert.equal(page.calls[0].qty,2);assert.equal(page.calls[0].p.name,catalog[0].name);
 assert.deepEqual(page.calls[0].choices,[]);assert.equal(page.notifications,1);assert.match(page.nodes.get('#product-feedback').textContent,/Adicionado/);
});

test('invalid and fractional quantities never reach the cart',async()=>{
 const page=await loadPage();for(const qty of ['0','-1','1000','1.5','abc','']){page.nodes.get('#product-quantity').value=qty;page.submit()}assert.equal(page.calls.length,0);
});

test('quantity controls enforce both bounds',async()=>{
 const page=await loadPage([catalog.find(p=>p.stockQuantity===undefined)]);const quantity=page.nodes.get('#product-quantity');
 page.nodes.get('#product-minus').onclick();assert.equal(Number(quantity.value),1);
 quantity.value='999';page.nodes.get('#product-plus').onclick();assert.equal(Number(quantity.value),999);assert.equal(page.nodes.get('#product-plus').disabled,true);
 quantity.value='1';page.nodes.get('#product-plus').onclick();assert.equal(Number(quantity.value),2);
});

test('required choices are retained and validated before ordering',async()=>{
 const p={...catalog[0],options:[{name:'Aroma',choices:['Chá Branco','Doce Lavanda']}]};const page=await loadPage([p]);
 const select=page.nodes.get('#product-form').querySelectorAll('select')[0];page.submit();assert.equal(page.calls.length,0);
 select.value='Doce Lavanda';page.submit();assert.deepEqual(page.calls[0].choices,[{name:'Aroma',value:'Doce Lavanda'}]);
});

test('aroma filter preselects a matching option on the product page',async()=>{
 const p={...catalog[0],options:[{name:'Aroma',choices:['Chá Branco','Doce Lavanda']}]};
 const page=await loadPage([p],{search:'?produto='+encodeURIComponent(linkContext().productId(p))+'&aroma=Doce%20Lavanda'});
 assert.equal(page.nodes.get('#product-form').querySelectorAll('select')[0].value,'Doce Lavanda');
});

test('personalized products retain their quote workflow',async()=>{
 const p=catalog.find(p=>p.priceOnRequest);const page=await loadPage([p]);
 assert.equal(page.nodes.get('#product-price').textContent,'Valor sob consulta');assert.equal(page.nodes.get('#product-add').textContent,'Adicionar ao orçamento');page.submit();assert.equal(page.calls[0].p.priceOnRequest,true);
});

test('single-photo and photo-less products have appropriate gallery states',async()=>{
 const single=await loadPage([catalog.find(p=>!p.images?.length&&p.image)]);assert.equal(single.nodes.get('#product-thumbnails').hidden,true);assert.equal(single.nodes.get('#product-photo-empty').hidden,true);
 const empty=await loadPage([{...catalog[0],image:'',images:[]}]);assert.equal(empty.nodes.get('#product-photo-empty').hidden,false);assert.equal(empty.nodes.get('#product-photo-link').hidden,true);
});

test('unknown and missing product URLs show a recovery link without a purchase form',async()=>{
 for(const search of ['','?produto=not-a-real-product']){const page=await loadPage(catalog,{search});assert.equal(page.nodes.get('#product-content').hidden,true);assert.equal(page.nodes.get('#product-error-link').hidden,false);page.submit();assert.equal(page.calls.length,0)}
});

test('catalog load failures show a recoverable error',async()=>{
 const page=await loadPage(catalog,{fail:true});assert.match(page.nodes.get('#product-status').textContent,/Não foi possível/);assert.equal(page.nodes.get('#product-content').hidden,true);
});

test('built pages no longer contain product pop-ups and photographs use contain',()=>{
 for(const name of ['index','loja','produto'])assert.doesNotMatch(read('dist/'+name+'.html'),/id="(?:product-dialog|photo-dialog)"/);
 for(const name of ['app','shop'])assert.doesNotMatch(read('dist/'+name+'.js'),/openProduct|#product-dialog/);
 assert.doesNotMatch(read('dist/product.css'),/object-fit:\s*cover/);
 assert.match(read('dist/product.css'),/#product-main-photo\{[^}]*object-fit:contain/);
});


test('amber sold-out pages keep their photos and block adding even a manual quantity',async()=>{
 for(const p of catalog.filter(p=>p.available==='OUT_OF_STOCK')){
  const page=await loadPage([p]);
  assert.equal(page.nodes.get('#product-availability').textContent,'Esgotado');
  assert.equal(page.nodes.get('#product-add').disabled,true);
  assert.equal(page.nodes.get('#product-quantity').disabled,true);
  assert.equal(page.nodes.get('#product-main-photo').src,p.image);
  page.nodes.get('#product-quantity').value='1';page.submit();assert.equal(page.calls.length,0);
 }
});

test('remaining amber aromas show two units and prevent ordering a third',async()=>{
 const amber=catalog.filter(p=>p.name.startsWith('Clássico Âmbar'));
 assert.equal(amber.filter(p=>p.stockQuantity===0).length,2);
 assert.equal(amber.filter(p=>p.stockQuantity===2).length,4);
 for(const p of amber.filter(p=>p.stockQuantity===2)){
  const page=await loadPage([p]);const qty=page.nodes.get('#product-quantity');
  assert.equal(page.nodes.get('#product-availability').textContent,'2 unidades disponíveis');
  assert.equal(qty.max,2);
  qty.value='2';page.nodes.get('#product-plus').onclick();assert.equal(Number(qty.value),2);
  qty.value='3';page.submit();assert.equal(page.calls.length,0);
  qty.value='2';page.submit();assert.equal(page.calls[0].qty,2);
 }
});

test('saved bags remove sold-out aromas and share the two-unit limit across choices',()=>{
 const context={};vm.createContext(context);vm.runInContext(read('src/scripts/shared/product-stock.js'),context);
 const sold=catalog.find(p=>p.stockQuantity===0),limited=catalog.find(p=>p.stockQuantity===2),unlimited=catalog.find(p=>p.stockQuantity===undefined);
 const items=[{name:sold.name,qty:1},{name:limited.name,qty:1},{name:limited.name,qty:4},{name:unlimited.name,qty:8}];
 const result=JSON.parse(JSON.stringify(context.reconcileCartStock(items,catalog)));
 assert.deepEqual(result.map(x=>[x.name,x.qty]),[[limited.name,1],[limited.name,1],[unlimited.name,8]]);
 assert.equal(context.productStock(sold),0);assert.equal(context.productStock(limited),2);assert.equal(context.productStock(unlimited),999);
});
