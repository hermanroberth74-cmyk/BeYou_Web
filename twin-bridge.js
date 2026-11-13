/* Local Be-You twin chat integration.
   On GitHub Pages the original fictional demo stays intact: no public Qwen service exists yet.
   The actual twin chat only works when the local Python server serves the website at :8765. */
(() => {
  'use strict';
  const LOCAL = ['127.0.0.1', 'localhost'].includes(location.hostname) && location.port === '8765';
  if (!LOCAL) return;
  const originalRender = window.render;
  const app = document.querySelector('#app');
  if (typeof originalRender !== 'function' || !app) return;

  const escapeHtml = v => String(v ?? '').replace(/[&<>"']/g, x => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[x]));
  let twinState = null;
  let busy = false;
  let portraitOpen = false;
  let toolsOpen = '';
  let lastError = '';

  async function api(path, payload) {
    const opts = payload === undefined ? {cache:'no-store'} : {
      method:'POST', headers:{'Content-Type':'application/json','X-BeYou-Local':'1'},
      body:JSON.stringify(payload)
    };
    const res = await fetch(path, opts);
    const data = await res.json();
    if (!res.ok) throw Error(data.error || `HTTP ${res.status}`);
    return data;
  }
  function status(msg) {
    const node = document.getElementById('bt-status');
    if (node) node.textContent = msg || '';
  }
  function loading(title, note) {
    app.innerHTML = `<section class="flow bt-loading"><h2>${escapeHtml(title)}</h2><p>${escapeHtml(note)}</p><div class="bt-spinner" aria-label="Working"></div></section>`;
  }
  function startError(message) {
    app.innerHTML = `<section class="flow bt-flow"><h2>Let's get your twin connected.</h2><p class="bt-error">${escapeHtml(message)}</p><p>Make sure Ollama is open and that <code>qwen3.5:4b</code> is installed. If you haven't entered an interest or story, return to onboarding and add one.</p><div class="actions"><button class="primary" id="bt-retry">Try again</button><button class="secondary" id="bt-back">Edit my answers</button></div></section>`;
    document.getElementById('bt-retry').onclick = beginTwin;
    document.getElementById('bt-back').onclick = () => originalRender(2);
  }
  async function beginTwin() {
    if (busy) return;
    busy = true;
    loading('Introducing your twin…', 'Connecting to your local Qwen model and finding a good first question.');
    try {
      const health = await api('/api/health');
      if (!health.ollama) throw Error('Ollama is not responding. Open the Ollama app and try again.');
      if (!health.installed) throw Error(`Model ${health.model} is not installed in Ollama. Run: ollama pull ${health.model}`);
      const state = await api('/api/state');
      if (!state.started) {
        // Frontend onboarding uses a global `data` variable. Only send details
        // when the user explicitly chooses to meet their twin locally.
        const info = window.data || (typeof data !== 'undefined' ? data : {});
        const fields = {
          name: info.name || '',
          interests: info.interests || '',
          meaning: [
            info.humour && `Humour: ${info.humour}`,
            info.conversation && `Conversation: ${info.conversation}`,
            info.values && `Values: ${info.values}`,
            info.resilience && `Coping: ${info.resilience}`,
            info.attraction && `Attraction: ${info.attraction}`,
            info.boundaries && `Boundaries: ${info.boundaries}`,
            info.flexibility && `Flexibility: ${info.flexibility}`,
            info.intent && `Relationship intention: ${info.intent}`,
            info.seeking && `Seeking: ${info.seeking}`
          ].filter(Boolean).join('\n'),
          moment: info.story || '',
          connection: info.intent || ''
        };
        await api('/api/start', {fields});
      } else {
        // Also heals a partially started record after a previously failed call.
        await api('/api/start', {fields:{}});
      }
      twinState = await api('/api/state');
      showTwin();
    } catch(e) {
      lastError = e.message;
      startError(lastError);
    } finally {busy = false;}
  }

  function showTwin() {
    if (!twinState?.started) {beginTwin();return;}
    const entries = (twinState.chat || []).filter(m => m.kind === 'assistant' || m.kind === 'chat' || m.kind === 'daily_answer');
    const messages = entries.map(m => `<div class="bt-message ${m.kind === 'assistant' ? 'bt-twin' : 'bt-me'}"><div class="bt-text">${escapeHtml(m.text)}</div><span class="bt-who">${m.kind === 'assistant' ? 'Your twin' : 'You'}</span></div>`).join('');
    const hasPortrait = (twinState.portrait || '').trim().length > 0;
    app.innerHTML = `<section class="bt-screen">
      <div class="bt-chathead"><div class="bt-avatar">✦</div><div><h2>My Twin</h2><p>Your space to talk, reflect, and help me get to know you.</p></div><span class="bt-local">Local AI test</span></div>
      <div class="bt-chips"><button id="bt-questions" type="button">Ask me 1–3 questions</button><button id="bt-date" type="button">Talk about a date</button><button id="bt-looks" type="button">Attraction preferences</button><button id="bt-review" type="button">What my twin knows</button><button id="bt-sim" type="button">Try a response</button></div>
      <div class="bt-privacy">Only you can access this local experiment on this computer. The twin's interpretations may be wrong. This is not a diagnosis.</div>
      <div id="bt-portrait" class="bt-portrait" ${portraitOpen ? '' : 'hidden'}><div class="bt-panelhead"><strong>What I've learned so far</strong><button id="bt-update-model" type="button">${hasPortrait ? 'Update my understanding' : 'Build my first portrait'}</button></div><p>${escapeHtml(twinState.portrait || 'I haven\'t built my living portrait yet. Chat with me, then choose Build my first portrait.')}</p></div>
      <div class="bt-thread" id="bt-thread" aria-live="polite">${messages || '<div class="bt-message bt-twin"><div class="bt-text">Hi! Tell me about something you love doing or what makes you laugh. You can share as much or as little as you like.</div><span class="bt-who">Your twin</span></div>'}</div>
      <div id="bt-toolpanel"></div>
      <form id="bt-form" class="bt-compose"><textarea id="bt-input" rows="2" maxlength="6500" placeholder="Tell me what's on your mind…" aria-label="Message your twin" required></textarea><button type="submit" id="bt-send" class="bt-sendbutton" aria-label="Send message">Send ↑</button></form>
      <div class="bt-under"><span id="bt-status">${twinState.finished ? 'Talk to your twin anytime' : 'First conversation · no pressure · skip any topic'}</span><button type="button" id="bt-finish">${twinState.finished ? 'Update my twin' : 'Finish first interview'}</button></div>
    </section>`;
    const thread = document.querySelector('#bt-thread');
    thread.scrollTop = thread.scrollHeight;
    document.querySelector('#bt-questions').onclick = askDaily;
    document.querySelector('#bt-date').onclick = () => prefill('I want to talk about a recent date or dating experience.');
    document.querySelector('#bt-looks').onclick = () => prefill('I want to refine what I find physically attractive, what I am flexible about, and what matters to me.');
    document.querySelector('#bt-review').onclick = () => {portraitOpen=!portraitOpen;showTwin();};
    document.querySelector('#bt-sim').onclick = () => {toolsOpen = toolsOpen === 'preview' ? '' : 'preview';showTool();};
    document.querySelector('#bt-finish').onclick = finishOrRefresh;
    document.querySelector('#bt-form').onsubmit = sendMessage;
    document.querySelector('#bt-input').onkeydown = e => {
      if(e.key === 'Enter' && !e.shiftKey){e.preventDefault();document.querySelector('#bt-form').requestSubmit();}
    };
    if(portraitOpen) document.querySelector('#bt-update-model').onclick=refreshPortrait;
    showTool();
  }

  function prefill(message) {
    document.querySelector('#bt-input').value=message;
    document.querySelector('#bt-input').focus();
  }
  function showTool() {
    const panel=document.getElementById('bt-toolpanel');
    if(!panel) return;
    if (toolsOpen !== 'preview') { panel.innerHTML='';return; }
    panel.innerHTML=`<div class="bt-tool"><strong>Try how your twin might respond</strong><p>Enter something another person might say. Qwen will generate an experimental reply using your current twin model—not a real interaction or prediction.</p><form id="bt-previewform"><textarea id="bt-scenario" rows="2" maxlength="1800" placeholder="Someone asks: What would you do on a spontaneous weekend?" required></textarea><button type="submit">Preview reply</button></form><p class="bt-previewanswer" id="bt-previewanswer"></p><p><button class="bt-link" id="bt-correct">That doesn't sound like me — correct it</button></p><div id="bt-correctionpanel" hidden><textarea id="bt-correction" rows="2" placeholder="I would have responded differently because…"></textarea><button id="bt-savecorrection" type="button">Save correction to my twin</button></div></div>`;
    document.querySelector('#bt-previewform').onsubmit=async e=>{
      e.preventDefault();if(busy)return;
      busy=true;document.querySelector('#bt-previewanswer').textContent='Generating an example…';
      try{const r=await api('/api/preview',{scenario:document.querySelector('#bt-scenario').value});document.querySelector('#bt-previewanswer').textContent=r.preview;}
      catch(err){document.querySelector('#bt-previewanswer').textContent='Error: '+err.message;}
      finally{busy=false;}
    };
    document.querySelector('#bt-correct').onclick=()=>{document.querySelector('#bt-correctionpanel').hidden=false;document.querySelector('#bt-correction').focus();};
    document.querySelector('#bt-savecorrection').onclick=async()=>{
      if(busy)return;const value=document.querySelector('#bt-correction').value.trim();if(!value)return;
      busy=true;document.querySelector('#bt-savecorrection').disabled=true;
      try{const r=await api('/api/correction',{correction:value});twinState=r.state;portraitOpen=true;toolsOpen='';showTwin();status('Correction saved and model updated.');}
      catch(err){document.querySelector('#bt-previewanswer').textContent='Error: '+err.message;document.querySelector('#bt-savecorrection').disabled=false;}
      finally{busy=false;}
    };
  }
  async function sendMessage(e) {
    e.preventDefault();if(busy)return;
    const node=document.querySelector('#bt-input');
    const msg=node.value.trim();if(!msg)return;
    busy=true;
    const btn=document.querySelector('#bt-send');btn.disabled=true;
    status('Your twin is thinking locally…');
    try{
      const r=await api('/api/chat',{mode:twinState.finished?'twin':'interview',message:msg});
      twinState=r.state;showTwin();
    }catch(err){status('Could not send: '+err.message);btn.disabled=false;}
    finally{busy=false;}
  }
  async function askDaily() {
    if(busy)return;busy=true;status('Choosing questions for you…');
    try {const r=await api('/api/daily',{});twinState=r.state;showTwin();}
    catch(err){status('Could not get questions: '+err.message);}
    finally{busy=false;}
  }
  async function refreshPortrait() {
    if(busy)return;busy=true;status('Revising your living portrait…');
    try{const r=await api('/api/refresh',{});twinState=r.state;portraitOpen=true;showTwin();}
    catch(err){status('Could not update: '+err.message);}
    finally{busy=false;}
  }
  async function finishOrRefresh() {
    if(twinState.finished)return refreshPortrait();
    if(busy)return;busy=true;status('Finishing your first twin model…');
    try{const r=await api('/api/finish',{});twinState=r.state;portraitOpen=true;showTwin();}
    catch(err){status('Could not finish interview: '+err.message);}
    finally{busy=false;}
  }

  // A small app navigation shell during local experiments. The published Pages site
  // remains the existing fictional demonstration until a hosted API is developed.
  const nav=document.createElement('nav');
  nav.className='bt-globalnav'; nav.setAttribute('aria-label','Be-You sections');
  nav.innerHTML='<button type="button" id="bt-navtwin">My Twin</button><button type="button" id="bt-navdiscover">Discover</button><button type="button" id="bt-navmessages">Messages</button>';
  document.querySelector('header')?.after(nav);
  document.querySelector('#bt-navtwin').onclick=async()=>{
    try {twinState=await api('/api/state');if(twinState.started)showTwin();else originalRender(1);}
    catch(err){startError(err.message);}
  };
  document.querySelector('#bt-navdiscover').onclick=()=>window.render(5);
  document.querySelector('#bt-navmessages').onclick=()=>{
    if(typeof selected !== 'undefined' && selected !== null){window.render(7);return;}
    app.innerHTML='<section class="flow bt-flow"><h2>Messages</h2><p>This tab will hold real conversations after a mutual match. For now, choose a fictional introduction in Discover to explore the scripted chat demo.</p><button class="primary" id="bt-to-discover">Explore sample introductions →</button></section>';
    document.querySelector('#bt-to-discover').onclick=()=>window.render(5);
  };

  window.render=function(s){
    if(s===9){showTwin();window.scrollTo(0,0);return;}
    // The Meet your twin button on step 3 normally opens scripted step 4.
    // On localhost it now starts the real Python/Qwen twin directly.
    if(s===4){window.scrollTo(0,0);beginTwin();return;}
    originalRender(s);
  };
})();
