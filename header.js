(function(){
  async function fetchHeader(){
    const candidates = ['/includes/header.html','includes/header.html','../includes/header.html','../../includes/header.html'];
    let text = null;
    for(const p of candidates){
      try{
        const res = await fetch(p);
        if(res && res.ok){ text = await res.text(); break; }
      }catch(e){ /* try next */ }
    }
    if(!text) return;
    const tmp = document.createElement('div');
    tmp.innerHTML = text;
    const newNav = tmp.querySelector('nav.navbar');
    if(!newNav) return;
    const existing = document.querySelector('nav.navbar');
    if(existing){ existing.replaceWith(newNav); }
    else { document.body.insertBefore(newNav, document.body.firstChild); }
  }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fetchHeader);
  else fetchHeader();
})();
