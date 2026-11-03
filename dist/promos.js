(()=>{
 const strip=document.querySelector('.promo-strip');if(!strip)return;
 const messages=['FRETE GRÁTIS para São Paulo acima de R$190','Ganhe 5% de DESCONTO no pagamento via PIX','Entregamos em todo o Brasil'];
 const text=strip.querySelector('.promo-text');
 const viewport=document.createElement('span');viewport.className='promo-viewport';text.before(viewport);viewport.append(text);
 let index=0,timer,busy=false;
 const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
 const show=async step=>{
  if(busy)return;busy=true;
  const direction=step>0?1:-1;
  try{
   if(!reduced.matches&&text.animate)await text.animate([{transform:'translateX(0)',opacity:1},{transform:`translateX(${-direction*100}%)`,opacity:0}],{duration:300,easing:'ease-in'}).finished;
   index=(index+step+messages.length)%messages.length;text.textContent=messages[index];
   if(!reduced.matches&&text.animate)await text.animate([{transform:`translateX(${direction*100}%)`,opacity:0},{transform:'translateX(0)',opacity:1}],{duration:350,easing:'ease-out'}).finished;
  }finally{busy=false}
 };
 const start=()=>{clearInterval(timer);if(!document.hidden)timer=setInterval(()=>show(1),4500)};
 strip.querySelector('.promo-prev').onclick=()=>{show(-1);start()};strip.querySelector('.promo-next').onclick=()=>{show(1);start()};
 document.addEventListener('visibilitychange',start);start();
})();
