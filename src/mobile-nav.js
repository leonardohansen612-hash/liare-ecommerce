(()=>{
 const nav=document.querySelector('header .nav'),original=nav.querySelector('nav');
 const toggle=document.createElement('button');toggle.type='button';toggle.className='mobile-menu-toggle';toggle.setAttribute('aria-label','Abrir menu');toggle.setAttribute('aria-haspopup','dialog');toggle.setAttribute('aria-controls','mobile-menu');toggle.setAttribute('aria-expanded','false');toggle.innerHTML='<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" aria-hidden="true"><path d="M3 6h18M3 12h12M3 18h18"/></svg>';nav.prepend(toggle);
 const menu=document.createElement('dialog');menu.id='mobile-menu';menu.className='mobile-menu';menu.setAttribute('aria-labelledby','mobile-menu-title');menu.innerHTML='<div class="mobile-menu-heading"><span id="mobile-menu-title" class="logo">LIARE</span><button type="button" class="mobile-menu-close" aria-label="Fechar menu">×</button></div>';
 const links=original.cloneNode(true);links.setAttribute('aria-label','Menu do celular');menu.append(links);document.body.append(menu);
 toggle.onclick=()=>{menu.showModal();toggle.setAttribute('aria-expanded','true');document.body.classList.add('mobile-menu-open')};
 menu.querySelector('.mobile-menu-close').onclick=()=>menu.close();
 links.addEventListener('click',e=>{if(e.target.closest('a'))menu.close()});
 menu.addEventListener('click',e=>{if(e.target===menu){const r=menu.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)menu.close()}});
 menu.addEventListener('close',()=>{toggle.setAttribute('aria-expanded','false');document.body.classList.remove('mobile-menu-open');toggle.focus()});
 window.matchMedia('(max-width:991px)').addEventListener('change',e=>{if(!e.matches&&menu.open)menu.close()});
})();
