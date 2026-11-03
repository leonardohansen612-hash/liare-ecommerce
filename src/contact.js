(()=>{
  const button=document.querySelector('#copy-phone');
  const number=document.querySelector('#contact-number');
  const status=document.querySelector('#copy-status');
  button.addEventListener('click',async()=>{
    try {
      await navigator.clipboard.writeText(number.textContent.trim());
      status.textContent='Telefone copiado!';
    } catch {
      const range=document.createRange();range.selectNodeContents(number);
      const selection=window.getSelection();selection.removeAllRanges();selection.addRange(range);
      status.textContent='Telefone selecionado. Copie para compartilhar.';
    }
  });
})();
