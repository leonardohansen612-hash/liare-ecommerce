(()=>{
 const cards=[...document.querySelectorAll('.aroma-card')],choices=[...document.querySelectorAll('[data-characteristic]')];
 const filterDialog=document.querySelector('#aroma-filter-dialog'),toggle=document.querySelector('#aroma-filter-toggle'),apply=document.querySelector('.aroma-filter-apply'),panel=document.querySelector('#aroma-filter-panel'),mobile=matchMedia('(max-width:760px)');
 let selected='';
 const normalize=value=>value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
 const entries=cards.map(card=>({card,name:normalize(card.dataset.aromaName),words:card.dataset.characteristics.split('|').map(normalize)}));
 function render(){
  let count=0;
  entries.forEach(({card,words})=>{const matches=!selected||words.includes(selected);card.hidden=!matches;if(matches)count++});
  choices.forEach(button=>button.setAttribute('aria-pressed',String(normalize(button.dataset.characteristic)===selected)));
  document.querySelector('#aroma-count').textContent=count+' '+(count===1?'aroma para descobrir':'aromas para descobrir');
  document.querySelector('.aroma-empty').hidden=count>0;
 }
 function placeFilters(){if(!mobile.matches&&filterDialog.open)filterDialog.close();document.querySelector(mobile.matches?'#aroma-filter-mobile':'#aroma-filter-desktop').append(panel)}
 placeFilters();mobile.addEventListener('change',placeFilters);
 toggle.addEventListener('click',()=>filterDialog.showModal());
 document.querySelector('.aroma-filter-close').addEventListener('click',()=>filterDialog.close());
 apply.addEventListener('click',()=>filterDialog.close());
 filterDialog.addEventListener('click',event=>{if(event.target!==filterDialog)return;const rect=filterDialog.getBoundingClientRect();if(event.clientX<rect.left||event.clientX>rect.right||event.clientY<rect.top||event.clientY>rect.bottom)filterDialog.close()});
 function clear(){selected='';render();(filterDialog.open||!mobile.matches?choices[0]:toggle).focus()}
 choices.forEach(button=>button.addEventListener('click',()=>{selected=normalize(button.dataset.characteristic);render()}));
 document.querySelector('[data-reset-aromas]').addEventListener('click',clear);render();
})();
