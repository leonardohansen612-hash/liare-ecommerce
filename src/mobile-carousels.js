(()=>{
 const mobile=matchMedia('(max-width:760px)'),reduced=matchMedia('(prefers-reduced-motion:reduce)');
 const strip=document.querySelector('.strip');const benefits=[...strip.children];const shell=document.createElement('div');shell.className='benefit-carousel';strip.before(shell);shell.append(strip);strip.setAttribute('aria-label','Benefícios da LIARE');let active=0;
 const arrow=(label,text,step)=>{const b=document.createElement('button');b.type='button';b.className='benefit-arrow';b.setAttribute('aria-label',label);b.textContent=text;b.onclick=()=>show(active+step);return b};
 shell.prepend(arrow('Benefício anterior','‹',-1));shell.append(arrow('Próximo benefício','›',1));
 function show(i){active=(i+benefits.length)%benefits.length;strip.scrollTo({left:benefits[active].offsetLeft-strip.offsetLeft,behavior:reduced.matches?'instant':'smooth'})}
 strip.addEventListener('scroll',()=>{active=Math.round(strip.scrollLeft/strip.clientWidth)});
 setInterval(()=>{if(mobile.matches&&!reduced.matches&&!document.hidden&&!shell.matches(':hover')&&!shell.contains(document.activeElement))show(active+1)},5000);
 mobile.addEventListener('change',()=>{active=0;strip.scrollLeft=0});
 const categories=document.querySelector('.categories');const dots=document.createElement('div');dots.className='category-dots';dots.setAttribute('role','group');dots.setAttribute('aria-label','Navegar pelas categorias');categories.after(dots);
 function setup(){const items=[...categories.children];if(!items.length)return;const max=categories.scrollWidth-categories.clientWidth;const pages=max>1?Math.ceil(max/(items[0].getBoundingClientRect().width+10))+1:1;dots.replaceChildren();for(let i=0;i<pages;i++){const b=document.createElement('button');b.type='button';b.setAttribute('aria-label','Categorias, página '+(i+1));b.onclick=()=>categories.scrollTo({left:i*max/(pages-1||1),behavior:reduced.matches?'instant':'smooth'});dots.append(b)}update()}
 function update(){const buttons=[...dots.children];const max=categories.scrollWidth-categories.clientWidth;const page=max>0?Math.round(categories.scrollLeft/max*(buttons.length-1)):0;buttons.forEach((b,i)=>b.setAttribute('aria-pressed',String(i===page)))}
 new MutationObserver(setup).observe(categories,{childList:true});new ResizeObserver(setup).observe(categories);categories.addEventListener('scroll',update,{passive:true});setup();
})();
