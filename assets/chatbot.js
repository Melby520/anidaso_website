(function(){
  let index = [];
  let docFreq = new Map();
  let docCount = 0;
  const baseRoot = (function(){
    try{
      const scriptEl = document.currentScript || document.querySelector('script[src*="chatbot.js"]');
      if(scriptEl && scriptEl.src){
        // chatbot.js is served from <baseRoot>/assets/chatbot.js
        return new URL('../', scriptEl.src);
      }
    }catch(e){ /* ignore */ }
    try{ return new URL('./', window.location.href); }catch(e){ return null; }
  })();

  function toAbsoluteUrl(path){
    if(!baseRoot) return path;
    const clean = String(path || '').replace(/^\//, '');
    try{ return new URL(clean, baseRoot).toString(); }catch(e){ return path; }
  }

  const manifestPath = baseRoot ? new URL('assets/content_manifest.json', baseRoot).toString() : '/assets/content_manifest.json';

  function $(sel, root=document){ return root.querySelector(sel); }
  function escapeRegExp(s){ return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

  function extractCleanText(doc){
    try{
      const main = doc.querySelector('main') || doc.querySelector('[role="main"]') || doc.querySelector('#content') || doc.querySelector('.content') || doc.body;
      if(!main) return '';

      const clone = main.cloneNode(true);
      const removeSelectors = [
        'script','style','noscript','svg','canvas','iframe',
        'nav','header','footer',
        'form','button',
        '#site-chatbot','.chatbot',
        '.navbar','.footer','.hamburger','.dropdown'
      ].join(',');
      clone.querySelectorAll(removeSelectors).forEach(n => n.remove());

      // Convert common step/link grids into a clean sentence.
      const stepLabels = Array.from(main.querySelectorAll('.how-step__label'))
        .map(el => (el && el.innerText ? el.innerText.trim() : ''))
        .filter(Boolean);
      const stepPrefix = stepLabels.length >= 2 ? ('Key steps: ' + stepLabels.join(' → ') + '. ') : '';

      let text = clone.innerText || '';
      text = text.replace(/\u00a0/g, ' ');

      let lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);

      // Remove duplicates (common in nav-like repeated blocks)
      const seen = new Set();
      lines = lines.filter(l => {
        const key = l.toLowerCase();
        if(seen.has(key)) return false;
        seen.add(key);
        return true;
      });

      // Remove obvious footer/menu noise and code-like fragments
      lines = lines
        .filter(l => !/^quick\s+links\b/i.test(l))
        .filter(l => !/^copyright\b/i.test(l))
        .filter(l => !/^\s*\u00a9\s*\d{4}\b/i.test(l))
        .filter(l => !/^\[?cdata\[/i.test(l))
        .filter(l => !/(websocket|refreshcss|function\s*\(|\bvar\b|=>|\{\s*\}|\}\s*\{|\}\s*$)/i.test(l));

      const compact = lines.join(' ').replace(/\s+/g, ' ').trim();
      return (stepPrefix + compact).trim();
    }catch(e){
      return '';
    }
  }

  function isJunkySentence(s){
    const str = String(s || '').trim();
    if(!str) return true;
    const lower = str.toLowerCase();
    if(lower.includes('[cdata[')) return true;
    if(/(function\s*\(|\bvar\b|=>|\{\s*\}|\}\s*$)/i.test(str)) return true;
    if(/[{}<>]/.test(str)) return true;
    if(/\b(home|about\s+us|membership|governance|contact\s+us)\b/i.test(str)){
      const hits = (lower.match(/\b(home|about\s+us|membership|governance|contact\s+us)\b/g) || []).length;
      if(hits >= 4) return true;
    }
    return false;
  }

  async function buildIndex(){
    try{
      const r = await fetch(manifestPath);
      if(!r.ok) return;
      const pages = await r.json();
      const out = [];
      for(const p of pages){
        try{
          const pr = await fetch(toAbsoluteUrl(p));
          if(!pr.ok) continue;
          const html = await pr.text();
          const doc = new DOMParser().parseFromString(html, 'text/html');
          const title = doc.querySelector('title') ? doc.querySelector('title').innerText.trim() : p;
          const body = extractCleanText(doc) || (doc.body ? doc.body.innerText.replace(/\s+/g,' ').trim() : '');
          const titleLower = title.toLowerCase();
          const textLower = body.toLowerCase();
          out.push({
            path: p,
            url: toAbsoluteUrl(p),
            title,
            text: body,
            titleLower,
            textLower
          });
        }catch(e){ console.warn('chatbot: failed to fetch', p, e); }
      }

      // Build per-page token counts + global document frequencies for scoring
      const nextDocFreq = new Map();
      for(const e of out){
        const titleTokens = tokenize(e.title);
        const bodyTokens = tokenize(e.text);

        const titleCounts = new Map();
        for(const t of titleTokens){
          if(!t || STOP_WORDS.has(t)) continue;
          titleCounts.set(t, (titleCounts.get(t) || 0) + 1);
        }

        const textCounts = new Map();
        for(const t of bodyTokens){
          if(!t || STOP_WORDS.has(t)) continue;
          textCounts.set(t, (textCounts.get(t) || 0) + 1);
        }

        e.titleCounts = titleCounts;
        e.textCounts = textCounts;

        const unique = new Set([...titleCounts.keys(), ...textCounts.keys()]);
        for(const t of unique){
          nextDocFreq.set(t, (nextDocFreq.get(t) || 0) + 1);
        }
      }

      index = out;
      docFreq = nextDocFreq;
      docCount = out.length;
    }catch(e){ console.warn('chatbot index build failed', e); }
  }

  const STOP_WORDS = new Set([
    'a','an','and','are','as','at','be','but','by','can','could','do','does','for','from','had','has','have','how',
    'i','if','in','into','is','it','its','me','my','of','on','or','our','ours','please','the','their','them','then','there','they','this','to','us','was','we','what','when','where','which','who','why','will','with','you','your'
  ]);

  const SYNONYMS = {
    membership: ['join','member','apply','application','register','sign','signup'],
    join: ['membership','member','apply','application'],
    register: ['registration','signup','sign','apply'],
    contact: ['email','phone','reach','help','support'],
    governance: ['rules','policy','policies','committee','leadership'],
    contribution: ['monthly','payment','pay','fee','dues'],
    monthly: ['contribution','payment','pay'],
    ghana: ['gh','accra'],
    uk: ['united','kingdom','britain','london']
  };

  function normalizeToken(t){
    if(!t) return '';
    // light normalization (keeps it simple + safe)
    if(t.length > 4 && t.endsWith('ing')) return t.slice(0, -3);
    if(t.length > 3 && t.endsWith('ed')) return t.slice(0, -2);
    if(t.length > 3 && t.endsWith('es')) return t.slice(0, -2);
    if(t.length > 3 && t.endsWith('s')) return t.slice(0, -1);
    return t;
  }

  function tokenize(s){
    return (s||'')
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter(Boolean)
      .map(normalizeToken)
      .filter(Boolean);
  }

  function expandQueryTokens(tokens){
    const out = new Set();
    for(const raw of tokens){
      const t = normalizeToken(raw);
      if(!t || STOP_WORDS.has(t)) continue;
      out.add(t);
      const syn = SYNONYMS[t];
      if(Array.isArray(syn)) syn.forEach(s => out.add(normalizeToken(s)));
    }
    return Array.from(out);
  }

  function idf(token){
    const df = docFreq.get(token) || 0;
    if(docCount <= 0) return 1;
    return 1 + Math.log((docCount + 1) / (df + 1));
  }

  function rankPages(query, limit = 3){
    const q = (query || '').toLowerCase().trim();
    const baseTokens = tokenize(q);
    const tokens = expandQueryTokens(baseTokens);
    if(tokens.length === 0) return [];

    const results = [];
    for(const e of index){
      let score = 0;

      const titleLower = e.titleLower || (e.title || '').toLowerCase();
      const textLower = e.textLower || (e.text || '').toLowerCase();

      for(const t of tokens){
        const w = idf(t);
        const titleTf = e.titleCounts && e.titleCounts.get(t) ? e.titleCounts.get(t) : 0;
        const bodyTf = e.textCounts && e.textCounts.get(t) ? e.textCounts.get(t) : 0;
        if(titleTf) score += (titleTf * 4.0) * w;
        if(bodyTf) score += (bodyTf * 1.5) * w;
      }

      // phrase boosts (more human matching)
      if(q.length >= 6 && q.includes(' ')){
        if(titleLower.includes(q)) score += 12;
        else if(textLower.includes(q)) score += 7;
      }

      // small boost if query contains a known page/country hint
      if(/\bghana\b/.test(q) && /ghana/.test(titleLower + ' ' + textLower)) score += 3;
      if(/\b(uk|united\s+kingdom)\b/.test(q) && /(uk|united kingdom)/.test(titleLower + ' ' + textLower)) score += 3;

      if(score > 0) results.push({score, entry: e});
    }

    results.sort((a,b) => b.score - a.score);
    return results.slice(0, limit);
  }

  function scoreQuery(q){
    const ranked = rankPages(q, 1);
    return ranked.length ? ranked[0] : null;
  }

  function makeSnippet(text, term){
    const safeText = String(text || '');
    const safeTerm = String(term || '').toLowerCase();
    const low = safeText.toLowerCase();
    const i = safeTerm ? low.indexOf(safeTerm) : -1;
    if(i < 0) return safeText.slice(0,220) + (safeText.length>220? '…':'');
    const start = Math.max(0, i-80);
    const snip = safeText.slice(start, start+220);
    return (start>0? '…':'') + snip + (start+220<safeText.length? '…':'');
  }

  function splitIntoSentences(text){
    const clean = String(text || '')
      .replace(/\s+/g, ' ')
      .replace(/\s*([.!?])\s*/g, '$1 ')
      .trim();
    if(!clean) return [];

    // Primary split on sentence-ending punctuation; fallback to separators.
    let parts = clean.split(/(?<=[.!?])\s+/);
    if(parts.length < 2){
      parts = clean.split(/\s+(?:\-|\u2013|\u2014|\u2022)\s+/);
    }

    return parts
      .map(s => s.trim())
      .filter(Boolean)
      .filter(s => s.length >= 40)
      .filter(s => !isJunkySentence(s));
  }

  function pickSummaryBullets(entry, query, maxBullets = 4){
    const q = (query || '').toLowerCase().trim();
    const tokens = expandQueryTokens(tokenize(q))
      .filter(t => t && !STOP_WORDS.has(t) && t.length >= 3);

    const sentences = splitIntoSentences(entry && entry.text ? entry.text : '');
    if(!sentences.length){
      const snippet = makeSnippet(entry && entry.text ? entry.text : '', tokens[0] || '');
      return snippet ? [snippet] : [];
    }

    const scored = sentences.map(s => {
      const lower = s.toLowerCase();
      let score = 0;

      for(const t of tokens){
        if(lower.includes(t)) score += 2.0 * idf(t);
      }

      if(q.length >= 6 && q.includes(' ') && lower.includes(q)) score += 6;

      // Prefer shorter, information-dense sentences
      const len = s.length;
      if(len <= 140) score += 2;
      else if(len >= 260) score -= 2;

      return {s, score};
    }).filter(x => x.score > 0);

    scored.sort((a,b) => b.score - a.score);

    const chosen = [];
    const seen = new Set();
    for(const item of scored){
      const key = item.s.toLowerCase();
      if(seen.has(key)) continue;
      seen.add(key);
      chosen.push(item.s);
      if(chosen.length >= maxBullets) break;
    }

    // Ensure we return 2–4 bullets when possible
    if(chosen.length < 2){
      const fallback = sentences.slice(0, 2);
      for(const s of fallback){
        if(chosen.length >= 2) break;
        if(!seen.has(s.toLowerCase())) chosen.push(s);
      }
    }

    return chosen.slice(0, maxBullets);
  }

  function formatBullets(lines){
    const cleaned = (lines || [])
      .map(s => String(s || '').replace(/\s+/g, ' ').trim())
      .filter(Boolean)
      .slice(0, 4);
    if(!cleaned.length) return '';
    return cleaned.map(s => '• ' + s).join('\n');
  }

  function detectIntent(query){
    const q = (query || '').toLowerCase();

    if(/\bhow\b.*\bwork\b|\bhow\s+it\s+works\b|\bprocess\b|\bsteps\b/.test(q)){
      return {
        name: 'how-it-works',
        intro: 'Here’s a quick, high-level overview of how Anidaso works:',
        next: 'If you’re new, start by opening the page and follow the steps in order (register → become a member → monthly contribution → community support).'
      };
    }

    if(/\b(contact|email|phone|reach|support|help)\b/.test(q)){
      return {
        name: 'contact',
        intro: 'If you want to get in touch, here’s the most relevant page:',
        next: 'Next step: open the page and use the contact details/form.'
      };
    }

    if(/\b(join|membership|member|apply|application|register|registration|signup|sign\s*up)\b/.test(q)){
      return {
        name: 'membership',
        intro: 'If you’re looking to join or register, this is the best place to start:',
        next: 'Next step: open the page and follow the membership/registration instructions.'
      };
    }

    if(/\b(monthly|contribution|pay|payment|fee|dues)\b/.test(q)){
      return {
        name: 'contribution',
        intro: 'For payments and contributions, here’s what the site says:',
        next: 'Next step: open the page for the latest contribution/payment details.'
      };
    }

    if(/\b(governance|policy|policies|committee|leadership|rules)\b/.test(q)){
      return {
        name: 'governance',
        intro: 'For governance and how things are managed, here’s the most relevant section:',
        next: 'Next step: open the page to review the governance details.'
      };
    }

    if(/\b(community|support|donate|donation|fund|funding|sponsor|sponsorship)\b/.test(q)){
      return {
        name: 'community-support',
        intro: 'For community support and ways to help, here’s what I found:',
        next: 'Next step: open the page to see the available support options.'
      };
    }

    if(/\b(ghana|gh)\b/.test(q) && !/\buk\b/.test(q)){
      return {
        name: 'ghana',
        intro: 'Got it — you’re asking about Ghana. Here’s the closest match:',
        next: 'If you need Ghana-specific details, open the page and look for the Ghana section.'
      };
    }

    if(/\b(uk|united\s+kingdom)\b/.test(q)){
      return {
        name: 'uk',
        intro: 'Got it — you’re asking about the UK. Here’s the closest match:',
        next: 'If you need UK-specific details, open the page and look for the UK section.'
      };
    }

    return {
      name: 'general',
      intro: ''
    };
  }

  function pickBestForIntent(ranked, intent){
    if(!ranked || !ranked.length) return null;
    if(!intent || !intent.name || intent.name === 'general') return ranked[0];

    const hints = {
      'how-it-works': ['how it works','how-it-works'],
      'contact': ['contact','contact-us'],
      'membership': ['membership','become a member','register'],
      'contribution': ['monthly contribution','monthly-contribution','contribution'],
      'governance': ['governance'],
      'community-support': ['community support','community-support'],
      'ghana': ['ghana'],
      'uk': ['uk','united kingdom']
    };

    const want = hints[intent.name];
    if(!want) return ranked[0];

    for(const r of ranked){
      const e = r && r.entry;
      if(!e) continue;
      const hay = String((e.titleLower || e.title || '') + ' ' + (e.path || '')).toLowerCase();
      if(want.some(w => hay.includes(w))) return r;
    }
    return ranked[0];
  }

  function estimateConfidence(ranked, query){
    if(!ranked || !ranked.length) return 0;
    const best = ranked[0];
    const second = ranked[1];
    const bestScore = best && typeof best.score === 'number' ? best.score : 0;
    const secondScore = second && typeof second.score === 'number' ? second.score : 0;
    if(bestScore <= 0) return 0;

    const gapRatio = secondScore > 0 ? (bestScore / (bestScore + secondScore)) : 1;
    const tokens = expandQueryTokens(tokenize(query)).filter(t => t && !STOP_WORDS.has(t) && t.length >= 3);

    let matched = 0;
    const e = best.entry;
    if(e && tokens.length){
      for(const t of tokens){
        const tf = (e.titleCounts && e.titleCounts.get(t) ? e.titleCounts.get(t) : 0) + (e.textCounts && e.textCounts.get(t) ? e.textCounts.get(t) : 0);
        if(tf > 0) matched++;
      }
    }
    const coverage = tokens.length ? (matched / tokens.length) : 1;

    // Weighted confidence: score separation + token coverage
    const conf = (gapRatio * 0.65) + (coverage * 0.35);
    return Math.max(0, Math.min(1, conf));
  }

  function appendMessage({who, text, link, links}){
    const box = document.createElement('div');
    box.className = 'msg '+(who==='user' ? 'user' : 'bot');
    const bubble = document.createElement('div');
    bubble.className = 'bubble';

    bubble.textContent = text;

    const resolvedLinks = Array.isArray(links) ? links : (link ? [{href: link, label: 'Open page'}] : []);
    if(resolvedLinks.length){
      const linksWrap = document.createElement('div');
      linksWrap.style.marginTop = '8px';
      linksWrap.style.display = 'flex';
      linksWrap.style.flexDirection = 'column';
      linksWrap.style.gap = '6px';

      if(resolvedLinks.length > 1){
        const hint = document.createElement('div');
        hint.style.fontSize = '12px';
        hint.style.opacity = '0.85';
        hint.textContent = 'Related pages:';
        linksWrap.appendChild(hint);
      }
      for(const l of resolvedLinks){
        if(!l || !l.href) continue;
        const a = document.createElement('a');
        a.href = l.href;
        a.textContent = l.label || 'Open page';
        a.style.display = 'inline-block';
        linksWrap.appendChild(a);
      }
      bubble.appendChild(linksWrap);
    }

    box.appendChild(bubble);
    $('#chatbot-messages').appendChild(box);
    $('#chatbot-messages').scrollTop = $('#chatbot-messages').scrollHeight;
  }

  function respond(query){
    const q = (query || '').toLowerCase().trim();

    // Friendly greeting replies
    if(/^(hi|hello|hey|yo|good\s*(morning|afternoon|evening))\b/.test(q)){
      appendMessage({
        who:'bot',
        text:'Hi there — welcome to Anidaso. How can I help you today?'
      });
      return;
    }

    if(!index || index.length===0){ appendMessage({who:'bot', text:'I am still loading site content — please try again in a moment.'}); return; }
    const ranked = rankPages(query, 3);
    if(ranked.length && ranked[0].entry){
      const intent = detectIntent(query);
      const picked = pickBestForIntent(ranked, intent) || ranked[0];
      const best = picked.entry;
      const confidence = estimateConfidence(ranked, query);

      const bullets = pickSummaryBullets(best, query, 4);
      const bulletText = formatBullets(bullets);

      const titleLine = best.title ? ('Based on “' + best.title + '”:') : '';

      let text = '';
      if(intent.intro) text += intent.intro;
      if(titleLine) text += (text ? '\n' : '') + titleLine;
      if(bulletText) text += (text ? '\n' : '') + bulletText;

      if(intent.next){
        text += (text ? '\n\n' : '') + intent.next;
      } else if(confidence < 0.55){
        text += (text ? '\n\n' : '') + 'If this isn’t quite what you meant, try rephrasing with 1–2 specific keywords (e.g., “membership UK”, “monthly contribution”, “contact”).';
      }

      const extra = ranked.slice(1, 3).map(r => ({
        href: r.entry.url || toAbsoluteUrl(r.entry.path),
        label: (r.entry.title || r.entry.path)
      }));

      appendMessage({
        who:'bot',
        text,
        links: [{href: best.url || toAbsoluteUrl(best.path), label: 'Open page'}, ...extra]
      });
    } else {
      // simple heuristics for contact-related queries
      if(/contact|email|phone|reach|help/.test(q)){
        appendMessage({who:'bot', text: 'Looks like you’re trying to contact Anidaso. The Contact page is the best starting point.', link: toAbsoluteUrl('contact-us.html')});
      } else if(/membership|join|apply|member/.test(q)){
        appendMessage({who:'bot', text: 'It sounds like you’re asking about membership. The Membership page has the steps and options.', link: toAbsoluteUrl('membership.html')});
      } else {
        appendMessage({who:'bot', text: 'I couldn’t find a direct match for that. Try rephrasing with a couple of specific words (like “membership UK” or “monthly contribution”), or use the Contact page.', link: toAbsoluteUrl('contact-us.html')});
      }
    }
  }

  function initUI(){
    const toggle = $('#chatbot-toggle');
    const panel = $('#chatbot-panel');
    const close = $('#chatbot-close');
    const form = $('#chatbot-form');
    const input = $('#chatbot-input');

    if(!toggle || !panel || !close || !form || !input){ return; }

    function setToggleState(isOpen){
      toggle.classList.toggle('is-open', isOpen);
      toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    }

    function openPanel(){
      panel.hidden = false;
      window.requestAnimationFrame(()=>{
        panel.classList.add('is-open');
      });
      setToggleState(true);
      input.focus();
    }

    function closePanel(){
      panel.classList.remove('is-open');
      setToggleState(false);

      const onTransitionEnd = function(ev){
        if(ev.target !== panel) return;
        panel.hidden = true;
        panel.removeEventListener('transitionend', onTransitionEnd);
      };

      panel.addEventListener('transitionend', onTransitionEnd);
      // fallback in case transitionend does not fire
      window.setTimeout(()=>{
        if(!panel.classList.contains('is-open')) panel.hidden = true;
      }, 360);
    }

    toggle.addEventListener('click', ()=>{
      if(panel.hidden || !panel.classList.contains('is-open')) {
        openPanel();
      } else {
        closePanel();
      }
    });

    close.addEventListener('click', ()=>{ closePanel(); });

    form.addEventListener('submit', (ev)=>{
      ev.preventDefault();
      const q = input.value && input.value.trim();
      if(!q) return;
      appendMessage({who:'user', text:q});
      input.value = '';
      setTimeout(()=> respond(q), 250);
    });

    // greet
    appendMessage({who:'bot', text:'Hi — I can help with site questions. Try asking about membership, how it works, or contact details.'});

    setToggleState(false);
  }

  async function start(){
    if(window.__anidasoChatbotBooted) return;
    window.__anidasoChatbotBooted = true;
    initUI();
    buildIndex();
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();

})();
