(()=>{
 const link=document.querySelector('#product-photo-link');
 const stage=document.querySelector('.product-photo-stage');
 const thumbs=document.querySelector('#product-thumbnails');
 const main=document.querySelector('#product-main-photo');
 const dialog=document.createElement('dialog');dialog.className='product-lightbox';dialog.setAttribute('aria-label','Fotos ampliadas do produto');
 const close=document.createElement('button');close.type='button';close.className='product-lightbox-close';close.textContent='×';close.setAttribute('aria-label','Fechar foto ampliada');
 const photo=document.createElement('img');
 const counter=document.createElement('p');counter.className='product-lightbox-count';counter.setAttribute('aria-live','polite');
 function buttons(){return [...thumbs.children]}
 function sync(){photo.src=main.src;photo.alt=main.alt;counter.textContent=document.querySelector('#product-photo-count').textContent;const multiple=buttons().length>1;[previous,next,largePrevious,largeNext].forEach(button=>button.hidden=!multiple)}
 function move(step){const list=buttons();if(!list.length)return;const index=list.findIndex(button=>button.getAttribute('aria-pressed')==='true');list[(index+step+list.length)%list.length].click();sync()}
 function arrow(step,label){const button=document.createElement('button');button.type='button';button.className='product-gallery-arrow '+(step<0?'previous':'next');button.textContent=step<0?'‹':'›';button.setAttribute('aria-label',label);button.hidden=true;button.onclick=()=>move(step);return button}
 const previous=arrow(-1,'Foto anterior'),next=arrow(1,'Próxima foto'),largePrevious=arrow(-1,'Foto anterior'),largeNext=arrow(1,'Próxima foto');
 stage.append(previous,next);dialog.append(close,largePrevious,photo,largeNext,counter);document.body.append(dialog);
 function dismiss(){dialog.close();document.documentElement.style.overflow='';link.focus()}
 close.onclick=dismiss;dialog.addEventListener('cancel',()=>{document.documentElement.style.overflow=''});
 dialog.addEventListener('click',event=>{if(event.target===dialog)dismiss()});
 dialog.addEventListener('keydown',event=>{if(event.key==='ArrowLeft'||event.key==='ArrowRight'){event.preventDefault();move(event.key==='ArrowLeft'?-1:1)}});
 link.addEventListener('click',event=>{event.preventDefault();if(!main.getAttribute('src'))return;sync();dialog.showModal();document.documentElement.style.overflow='hidden'});
 new MutationObserver(sync).observe(thumbs,{childList:true,subtree:true,attributes:true,attributeFilter:['aria-pressed']});
})();
