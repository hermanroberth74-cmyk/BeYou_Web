/* Be-You experience prototype · 2026-11. No libraries; compatible with local v3 backend.
   Public GitHub Pages has NO AI, real matching, real users, or messaging service.
   Realistic synthetic portraits are included; on-demand image generation is not connected.
   Private user data: browser localStorage is NOT encrypted. Do not use this for real user deployment. */
(() => {
  'use strict';
  const app = document.getElementById('app');
  const LOCAL = ['127.0.0.1', 'localhost'].includes(location.hostname) && location.port === '8765';
  const KEY = 'beyou-experience-v1';
  const e = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const normalize = s => String(s ?? '').trim();
  const today = () => new Date().toLocaleDateString('en-CA');
  const first = (s, n=190) => String(s||'').slice(0,n);
  const makeDefaults = () => ({stage:0, onboardComplete:false, basic:{}, deep:{}, physical:{}, adult:{}, adultConsent:false, consentAcknowledged:false, ratings:[], ratingsDate:'', visualPlans:{}, photoDrafts:{}, affection:{give:[],receive:[],giveOther:'',receiveOther:''}, studioStartedAt:0, previewJudgments:{}, focus:'hair', previewNotes:{}, previewDone:{}, likes:{}, vibeIndex:0, mediaIndex:0, demoMessages:{}, expanded:true, demoChats:[], consentToTwin:false});
  let store;
  try {store = {...makeDefaults(), ...JSON.parse(localStorage.getItem(KEY)||'{}')};}
  catch {store = makeDefaults();}
  for (const k of ['basic','deep','physical','adult','photoDrafts','previewNotes','previewDone','previewJudgments','affection','likes','demoMessages']) store[k] = store[k] && typeof store[k]==='object' ? store[k]:{};
  store.affection.give=Array.isArray(store.affection.give)?store.affection.give:[];
  store.affection.receive=Array.isArray(store.affection.receive)?store.affection.receive:[];
  for (const k of ['ratings','demoChats']) store[k] = Array.isArray(store[k])?store[k]:[];
  const save = () => {try {localStorage.setItem(KEY, JSON.stringify(store));} catch {notice('Browser storage is unavailable. Your draft may not be saved.');}};
  let route = 'home'; // Always open on landing, even with an existing Twin.
  let studioIndex=0, studioEditing=false;
  let abstractLast=-1, abstractStudio=1;
  function nextAbstract(){let next=(Math.floor(Math.random()*7)+1); if(abstractLast>0&&next>=abstractLast)next++; abstractLast=next;return next;}
  const artPath=n=>`assets/art/personality-abstract-${String(n).padStart(2,'0')}.svg`;
  let studioInterval=null;
  const STUDIO_DEMO_LENGTH_MS=45000; // preview only: not a real matching duration
  // Positive, original Be-You messaging. Aspirations—not claims of superior matching.
  const STUDIO_MESSAGES=[
    ['Let’s explore a little','chemistry.'],
    ['Dating is hard.','Thanks for taking a shot.'],
    ['Thank you for','being you.'],
    ['Human personalities are','more than five pictures.'],
    ['You deserve to feel','represented.'],
    ['You aren’t perfect.','Neither are we.'],
    ['Let us see the person','behind the profile.'],
    ['Humanizing digital dating','with AI. Paradoxical? Maybe.'],
    ['Swipe on the vibe.','Meet the person.'],
    ['A photo can’t capture','the sound of a laugh.'],
    ['Some chemistry only','happens in person.'],
    ['The aim isn’t more scrolling.','It’s a real hello.'],
    ['Thank you for being brave','enough to share your story.'],
    ['Some things are best','discovered face to face.']
  ];
  let introIndex = 0, waiting=false, backendState=null, backendError='', showPortrait=false, showDemoMessage='', selectedInbox='twin', modal='', showPrivacy=false;
  const questionFields=[
    {key:'interests',label:'What makes you lose track of time?',help:'Activities, passions, little obsessions—and what draws you to them.',hint:'I can talk for hours about…'},
    {key:'motives',label:'What matters most when you make an important decision?',help:'Tell a story about a choice, not just a list of values.',hint:'The last time I had a hard choice…'},
    {key:'story',label:'Tell me something funny, unexpected, or very you.',help:'A tiny everyday moment is perfect.',hint:'One time I…'},
    {key:'closeness',label:'When do you feel understood by another person?',help:'Maybe a friendship, disagreement, romantic connection, or shared moment.',hint:'I feel understood when…'},
    {key:'change',label:'Has an experience changed how you see yourself or the world?',help:'Only what you feel comfortable sharing. Skipping is fine.',hint:'I used to think… but now…'},
    {key:'worldview',label:'What do you believe in, question, or care about deeply?',help:'Your philosophy, community, worldviews, sense of humour or personal principles.',hint:'Something I care strongly about is…'}
  ];
  const originalSlides=[
  
  {label:'Privacy & Control',title:'Your story stays yours.',copy:'Your information belongs to you. Privacy and control are fundamental rights, not privileges. You decide what to share, what stays private, and how you’re represented. You can review, edit, or delete your answers whenever you choose.',note:'In this demo, answers stay in your browser session. Use “Delete my answers” to clear them. Live AI is planned.'},
  {label:'Onboarding',title:'It starts with you.',copy:'What makes you feel alive? What do you love doing, and why? Share a funny story, a childhood memory, or someone who helped you through a difficult time. Go as deep as you feel comfortable.',note:'Add more whenever you like. Written prompts are available here. Conversations with the AI are planned.'},
  {label:'Your AI Twin',title:'A version of you.',copy:'Your twin learns what makes you, you: your humour, tastes, experiences, and how you respond. We want to understand why you love what you love, not just what you like. You can review and edit how your twin represents you.',note:'Your private stories, memories, and thoughts help shape your twin without being revealed to other users. AI-powered twins are a planned feature.'},
  {label:'Attraction',title:'Looks matter. They just don’t lead.',copy:'Tell your twin what catches your eye, from facial features and expressions to style or build. Say where you’re flexible and what matters most. In the planned app, your photos would be accessible to other AI twins for matching, not displayed directly to other users.',note:'Written preferences are available here. A future test would use AI-generated adult faces to explore your range.'},
  {label:'Twin Exploration',title:'Where the magic happens.',copy:'Your personality, stories, preferences, and everything that makes you, you, help your twin interact with other twins! Your twin goes on virtual dates to discover potential chemistry and find that elusive spark. And attraction? Your twin considers that too ;)',note:'In the planned flow, simulated dates use details you’ve approved for sharing. Private stories can stay private.'},
  {label:'Your Matches',title:'A glimpse of what could be.',copy:'Swipe through five photo-free profiles a day, each capturing the vibe of a potential connection, a glimpse of what dating each other might feel like, and date ideas to explore. You decide who sparks your curiosity! Now you swipe!',note:'A glimpse, not a prediction. Both people choose before the chat opens. Photos come later.'},
  {label:'The Chat',title:'From a spark to something real.',copy:'Start with real icebreakers inspired by your twins’ virtual date. Discover what sparked your connection in the first place! Unlock photo sharing as the conversation unfolds, and see where things go. Ready to meet? Your AI assistant can suggest exciting dates tailored to both of you, help with bookings, and even find special offers.',note:'This demo uses scripted chat. Photo sharing, AI date planning, booking assistance and special offers are planned features.'}
  ];
  function originalSlideVisual(i){return [
  `<div class="privacy-visual"><div class="visual-mark">YOU</div><div class="control-row"><span>Private by default</span><b>ON</b></div><div class="control-row"><span>Edit anytime</span><b>✓</b></div><div class="control-row delete"><span>Delete my data</span><b>→</b></div></div>`,
  `<div class="prompt-visual"><span>WHAT MAKES YOU LAUGH?</span><p>“When plans dont just go a little wrong, but fail spectacularly. The first day on my job when I broke my foot and got fired.”</p><span> WHAT IN MUSIC MAKES YOU SMILE</span><p>“I love it when a song gets quiet then gradually louder, rising to a nice crescendo”</p></div>`,
  `<div class="twin-visual"><div class="twin-orb">YOU</div><span class="twin-link"></span><div class="twin-orb accent">TWIN</div><small>Editable · Private · Yours</small></div>`,
  `<div class="attraction-visual"><div class="face-choice"><span class="face-shape one"></span><small>Pass</small></div><div class="face-choice chosen"><span class="face-shape two"></span><small>Interested</small></div><div class="face-choice"><span class="face-shape three"></span><small>Flexible</small></div></div>`,
  `<div class="network-visual"><span class="node you">YOU</span><span class="node n1"></span><span class="node n2"></span><span class="node n3"></span><span class="node n4"></span><i class="orbit o1"></i><i class="orbit o2"></i><small>Exploring quietly in the background</small></div>`,
  `<div class="experience-visual"><div class="experience-image"><span class="sun"></span><span class="trail"></span></div><span class="visual-kicker">A GLIMPSE OF YOUR CONNECTION</span><h3>Coffee. A forest walk.</h3><p>Good chemistry · Date ideas</p></div>`,
  `<div class="chat-visual"><div class="mini-bubble left">Our twins had a jazz date!</div><div class="mini-bubble right">So we have to compare playlists 🎶</div><div class="plan-chip"><span>MORE AS YOU CONNECT</span><b>Images · Date ideas · Booking help →</b></div></div>`
  ][i]}
  const italics = text => text.replace(/\bYou\b/g, '<i>You</i>');
  let restoredQuoteTimer = null;
  const authenticityLines=['The real You.','The uncurated You.','The You who laughs until you cry.','The unedited You.','The You who cries at 3 a.m.','The You who calls at 3 a.m.','The sad You.','The sweaty, post-workout You.','The You who overshares.','The You who laughs like a kid.'];
  function startRestoredAuthenticity() {
    const line = document.querySelector('#authLine');
    const count = document.querySelector('#authCount');
    const lead = document.querySelector('.want');
    const options = [...authenticityLines];
    const quotes = Array.from({length: 4}, () => options.splice(Math.floor(Math.random() * options.length), 1)[0]);
    let index = 0;
    function show() {
      line.classList.add('visible');
      if (index === quotes.length) {
        line.innerHTML = 'So just <strong>Be-You.</strong>';
        lead.style.visibility = 'hidden';
        count.textContent = 'Be-You';
        clearInterval(restoredQuoteTimer);
        return;
      }
      line.innerHTML = italics(quotes[index]);
      count.textContent = `0${++index} / 04`;
    }
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) index = quotes.length;
    restoredQuoteTimer = setInterval(show, 2800);
    show();
  }

  const AFFECTION_STYLES=[
    ['words','Kind words & reassurance'],
    ['time','Quality time'],
    ['touch','Physical affection'],
    ['gestures','Thoughtful gestures'],
    ['gifts','Little gifts & surprises'],
    ['play','Playfulness & shared experiences']
  ];
  function affectionControls(side,title,desc){
    const a=store.affection || {give:[],receive:[],giveOther:'',receiveOther:''};
    const sel=new Set(Array.isArray(a[side])?a[side]:[]);
    const key=side==='give'?'giveOther':'receiveOther';
    return `<section class="affection-side"><h4>${e(title)}</h4><p>${e(desc)}</p><div class="affection-tags">${AFFECTION_STYLES.map(([id,label])=>`<button type="button" class="affection-chip ${sel.has(id)?'selected':''}" data-action="affection-toggle" data-side="${side}" data-tag="${id}" aria-pressed="${sel.has(id)}">${e(label)}</button>`).join('')}</div><label class="form-field"><span>Anything else? (optional)</span><input data-group="affection" name="${key}" maxlength="260" value="${e(a[key]||'')}" placeholder="Your own words are welcome…"></label></section>`;
  }
  const SCENARIOS=[
    {other:'"I have an overly serious question: what is the most overrated city in Europe?"',you:'"Overrated according to whom? We need criteria before we cause a diplomatic incident 😂"',label:'Playful disagreement'},
    {other:'"I love travelling with absolutely no itinerary."',you:'"That sounds fun until we end up sleeping at a train station. Maybe spontaneous with a backup plan?"',label:'Spontaneity & compromise'},
    {other:'"I think you learn more from disagreeing than agreeing."',you:'"Sometimes! But only if both people are genuinely curious rather than trying to win."',label:'Intellectual connection'}
  ];
  // Three fictional conversational contexts for reviewing the twin, not actual matches.
  const STUDIO_CONTEXTS = [
    [
      {side:'other',text:'Do you think any European city is a little overrated?'},
      {side:'mine',text:'Probably, but I might get into trouble depending on which one I pick.'}
    ],
    [
      {side:'other',text:'I always remember the unplanned parts of a trip.'},
      {side:'mine',text:'I like a little spontaneity too, as long as we can get home afterward.'}
    ],
    [
      {side:'other',text:'My friends say I love a good debate.'},
      {side:'mine',text:'Depends on whether we both actually listen to each other.'}
    ]
  ];
  // People can appreciate both visible details and an overall impression.
  // Impression tags describe how the IMAGE feels, not verified personality traits.
  const PHOTO_FEEDBACK_TAGS = [
    ['eyes','Eyes'],['smile','Smile'],['hair','Hair'],['face','Face'],['nose','Nose'],
    ['figure','Figure / build'],['style','Style'],['expression','Expression'],
    ['vibe','Vibe'],['energy','Energy'],['confidence','Confidence'],
    ['presence','Presence'],['charm','Charm'],['warmth','Warmth'],
    ['overall','Overall look']
  ];
  const VIBES=[
    {id:'1',title:'Small adventures, long conversations',subtitle:'A connection built around curiosity, easy humour, and the pleasure of getting a little lost.',tags:['Playful curiosity','Walking & wandering','Slow-burn chemistry'],why:'A hypothetical shared enjoyment of improvised plans, thoughtful questions and little everyday adventures.',colors:['#cddbd1','#e8d8cc'],exchange:['"Would you rather get wonderfully lost in a new city or have a perfect itinerary?"','"The city, obviously. But I reserve the right to complain about the lack of coffee."'],scenes:[['🌿','The long way home','#a2bda6','#e1ded1'],['☕','Coffee without a closing time','#bda9a0','#eaded5'],['🚲','A ride to nowhere in particular','#a5beb9','#d9e7db'],['📖','One more question','#acb0c9','#e1d9dd']]},
    {id:'2',title:'A little jazz, a lot of mischief',subtitle:'The kind of evening where a joke becomes a story you keep telling.',tags:['Live music','Dry humour','Creative energy'],why:'An illustrative match between playful conversational styles and a shared appetite for music and spontaneity.',colors:['#ded1c9','#c5cbd9'],exchange:['"What would be your entrance song at a very dramatic dinner party?"','"Something unnecessarily cinematic. Then I would trip over the carpet."'],scenes:[['🎷','A song you cannot place','#b39f9c','#ddd0c7'],['🌙','The walk after midnight','#8b9bb0','#cfcedd'],['🍷','Unexpected dinner stories','#b9aa9a','#e7d7c8'],['🎹','An unfinished melody','#bcb4c0','#dddcd7']]},
    {id:'3',title:'The Sunday-morning kind of spark',subtitle:'A slow morning, a dog walk, and a conversation that gets unexpectedly deep.',tags:['Dogs & nature','Warmth','Thoughtful conversations'],why:'An illustrative overlap in day-to-day routines, conversational warmth and appreciation for quiet experiences.',colors:['#d9e0cf','#e8dbcf'],exchange:['"Do you think dogs know when we are being ridiculous?"','"Mine definitely does, and he judges me for it every day."'],scenes:[['🐕','A walk with someone important','#a9bea6','#e0d8c5'],['🥐','The bakery detour','#d6bea9','#e8dfcf'],['🌲','A path in the trees','#90ad9c','#cdd9c5'],['🍵','An unhurried morning','#c7b8a7','#e7e0d5']]},
    {id:'4',title:'Ideas that get out of hand',subtitle:'One question turns into six. Neither of you wants to end the conversation.',tags:['Debate without ego','Big ideas','Curious minds'],why:'A hypothetical meeting of intellectual curiosity and an interest in understanding, not just winning, arguments.',colors:['#c9d1df','#e3d6dc'],exchange:['"Do people change their beliefs through arguments?"','"Maybe—but first we have to argue about what counts as changing a belief."'],scenes:[['📚','The library that closes too early','#a6b7ce','#d8dce0'],['🏛️','An accidental museum date','#c3b9be','#e7ddd8'],['🌌','A midnight thought experiment','#7f9aac','#bcc5d4'],['🗺️','An impossible travel plan','#aac1bd','#dce7df']]},
    {id:'5',title:'Dinner made from whatever is left',subtitle:'A touch of chaos, a bit of care, and a shared feeling of being at home.',tags:['Cooking together','Everyday humour','Gentle affection'],why:'A fictional scenario balancing everyday compatibility, spontaneity and considerate communication.',colors:['#ddccba','#d6dcce'],exchange:['"I think I can make dinner out of three tomatoes and half a lemon."','"I am emotionally prepared for this experiment, but not financially."'],scenes:[['🍅','The improvised meal','#d0b79c','#ebdccc'],['🪴','A home full of plants','#a7bdac','#dce3cf'],['🕯️','Dinner runs long','#b8a3a5','#e3d0c7'],['🌧️','Rain at the window','#acbfc8','#e2e5e0']]}
  ];
  // Fictional, mood-based 4-moment galleries. Local assets are bundled in assets/vibes/.
  // "motion" is a CSS-animated image preview, not generated video.
  const VIBE_MEDIA = {
    '1':[
      {kind:'photo',src:'assets/vibes/sunday-park.webp',title:'The unexpected detour',caption:'Fresh air and taking the long way home'},
      {kind:'photo',src:'assets/vibes/coffee-date.webp',title:'Coffee that turns into hours',caption:'No agenda, just another question'},
      {kind:'motion',src:'assets/vibes/sunlit-trees.webp',title:'A moving little moment',caption:'A walk, a dog, a conversation that keeps going'},
      {kind:'meme',src:'assets/vibes/cat-meme.webp',title:'Our ideal plan?',caption:'Accidentally walk for two hours. Absolutely no regrets.',meme:'“Just a quick walk” — three hours later…'}
    ],
    '2':[
      {kind:'photo',src:'assets/vibes/coffee-table.webp',title:'One more drink, one more song',caption:'An evening with no fixed ending'},
      {kind:'photo',src:'assets/vibes/afternoon-light.webp',title:'The bit before everything begins',caption:'A conversation that takes a playful turn'},
      {kind:'motion',src:'assets/vibes/afternoon-light.webp',title:'An improvised encore',caption:'Spontaneous plans and a little mischief'},
      {kind:'meme',src:'assets/vibes/books-and-cat.webp',title:'A very serious evening',caption:'The afterparty is an argument about the playlist.',meme:'“One song and we go home” — famous last words'}
    ],
    '3':[
      {kind:'photo',src:'assets/vibes/sunday-picnic.webp',title:'Sunday, unhurried',caption:'A good book, warm coffee, somewhere green'},
      {kind:'photo',src:'assets/vibes/coffee-date.webp',title:'The tiny bakery detour',caption:'A familiar ritual that gets better together'},
      {kind:'motion',src:'assets/vibes/afternoon-light.webp',title:'Out for a walk',caption:'Leaves moving, dog running, and a little room to talk'},
      {kind:'meme',src:'assets/vibes/cat-meme.webp',title:'The official Sunday agenda',caption:'Maybe a nap. Definitely more coffee.',meme:'Weekend ambitions: 20% plans · 80% cozy'}
    ],
    '4':[
      {kind:'photo',src:'assets/vibes/park-picnic-book.webp',title:'Tell me what you really think',caption:'A book opens an entirely new conversation'},
      {kind:'photo',src:'assets/vibes/coffee-table.webp',title:'Caffeine-fueled questions',caption:'A debate that becomes a shared joke'},
      {kind:'motion',src:'assets/vibes/sunlit-trees.webp',title:'Walking through a thought experiment',caption:'Long conversations that don’t need to end'},
      {kind:'meme',src:'assets/vibes/books-and-cat.webp',title:'One last question?',caption:'“I promise this is the final hypothetical.”',meme:'3 hours later: “But define what you mean by love.”'}
    ],
    '5':[
      {kind:'photo',src:'assets/vibes/breakfast-table.webp',title:'The little rituals',caption:'Something homemade, even if it’s imperfect'},
      {kind:'photo',src:'assets/vibes/sunday-picnic.webp',title:'Dinner can be anywhere',caption:'Good food and the pleasure of showing up'},
      {kind:'motion',src:'assets/vibes/coffee-date.webp',title:'The kitchen after dinner',caption:'Talking longer than either of you planned'},
      {kind:'meme',src:'assets/vibes/cat-meme.webp',title:'Chef’s special',caption:'Whatever the fridge allowed us to make.',meme:'Recipe: 3 tomatoes + optimism + excellent company'}
    ]
  };
  let galleryOpen=false, consentTarget=null;
  const PHOTO_POOL = [
    {id:'photo-01',src:'assets/people/portrait-01.webp',presentation:'m',hair:'red',face:'classic',style:'casual'},
    {id:'photo-02',src:'assets/people/portrait-02.webp',presentation:'f',hair:'dark',face:'soft',style:'casual'},
    {id:'photo-03',src:'assets/people/portrait-03.webp',presentation:'m',hair:'dark',face:'angular',style:'outdoors'},
    {id:'photo-04',src:'assets/people/portrait-04.webp',presentation:'f',hair:'dark',face:'soft',style:'creative'},
    {id:'photo-05',src:'assets/people/portrait-05.webp',presentation:'m',hair:'dark',face:'soft',style:'classic'},
    {id:'photo-06',src:'assets/people/portrait-06.webp',presentation:'f',hair:'blonde',face:'angular',style:'sporty'},
    {id:'photo-07',src:'assets/people/portrait-07.webp',presentation:'m',hair:'dark',face:'oval',style:'casual'},
    {id:'photo-08',src:'assets/people/portrait-08.webp',presentation:'f',hair:'dark',face:'oval',style:'outdoors'},
    {id:'photo-09',src:'assets/people/portrait-09.webp',presentation:'m',hair:'brown',face:'angular',style:'outdoors'},
    {id:'photo-10',src:'assets/people/portrait-10.webp',presentation:'f',hair:'dark',face:'soft',style:'creative'},
    {id:'photo-11',src:'assets/people/portrait-11.webp',presentation:'m',hair:'dark',face:'angular',style:'creative'},
    {id:'photo-12',src:'assets/people/portrait-12.webp',presentation:'f',hair:'brown',face:'soft',style:'outdoors'},
    {id:'photo-13',src:'assets/people/portrait-13.webp',presentation:'f',hair:'red',face:'angular',style:'urban'},
    {id:'photo-14',src:'assets/people/portrait-14.webp',presentation:'m',hair:'dark',face:'angular',style:'classic'},
    {id:'photo-15',src:'assets/people/portrait-15.webp',presentation:'f',hair:'dark',face:'soft',style:'casual'},
    {id:'photo-16',src:'assets/people/portrait-16.webp',presentation:'m',hair:'blonde',face:'angular',style:'outdoors'},
    {id:'photo-17',src:'assets/people/portrait-17.webp',presentation:'f',hair:'dark',face:'oval',style:'casual'},
    {id:'photo-18',src:'assets/people/portrait-18.webp',presentation:'m',hair:'brown',face:'soft',style:'outdoors'},
    {id:'photo-19',src:'assets/people/portrait-19.webp',presentation:'f',hair:'blonde',face:'oval',style:'creative'},
    {id:'photo-20',src:'assets/people/portrait-20.webp',presentation:'m',hair:'dark',face:'soft',style:'casual'},
    {id:'photo-21',src:'assets/people/portrait-21.webp',presentation:'f',hair:'dark',face:'oval',style:'classic'},
    {id:'photo-22',src:'assets/people/portrait-22.webp',presentation:'m',hair:'brown',face:'angular',style:'classic'},
    {id:'photo-23',src:'assets/people/portrait-23.webp',presentation:'f',hair:'dark',face:'angular',style:'creative'},
    {id:'photo-24',src:'assets/people/portrait-24.webp',presentation:'m',hair:'brown',face:'soft',style:'casual'},
    {id:'photo-25',src:'assets/people/portrait-25.webp',presentation:'m',hair:'dark',face:'soft',style:'casual'},
    {id:'photo-26',src:'assets/people/portrait-26.webp',presentation:'f',hair:'brown',face:'soft',style:'casual'},
    {id:'photo-27',src:'assets/people/portrait-27.webp',presentation:'m',hair:'dark',face:'oval',style:'outdoors'},
    {id:'photo-28',src:'assets/people/portrait-28.webp',presentation:'f',hair:'dark',face:'soft',style:'creative'},
    {id:'photo-29',src:'assets/people/portrait-29.webp',presentation:'m',hair:'blonde',face:'angular',style:'casual'},
    {id:'photo-30',src:'assets/people/portrait-30.webp',presentation:'f',hair:'dark',face:'oval',style:'urban'},
    {id:'photo-31',src:'assets/people/portrait-31.webp',presentation:'f',hair:'red',face:'soft',style:'casual'},
    {id:'photo-32',src:'assets/people/portrait-32.webp',presentation:'m',hair:'dark',face:'angular',style:'classic'},
    {id:'photo-33',src:'assets/people/portrait-33.webp',presentation:'f',hair:'dark',face:'soft',style:'classic'},
    {id:'photo-34',src:'assets/people/portrait-34.webp',presentation:'m',hair:'dark',face:'angular',style:'sporty'},
    {id:'photo-35',src:'assets/people/portrait-35.webp',presentation:'f',hair:'blonde',face:'oval',style:'outdoors'},
    {id:'photo-36',src:'assets/people/portrait-36.webp',presentation:'m',hair:'dark',face:'angular',style:'urban'}
  ];
  const PHOTO_DAILY_COUNT = 12;
  function sampleHash(value){let h=2166136261;for(const c of String(value)){h^=c.charCodeAt(0);h=Math.imul(h,16777619)}return (h>>>0)/4294967295}
  function applicablePhotos(){const seeking=store.basic.seeking;if(seeking==='women')return PHOTO_POOL.filter(p=>p.presentation==='f');if(seeking==='men')return PHOTO_POOL.filter(p=>p.presentation==='m');return PHOTO_POOL}
  function visualRatingHistory(){return store.ratings.filter(r=>r.source==='synthetic-photo'&&r.attributes)}
  function imagePreferenceScore(person,history){
    // A transparent small adaptive ranking algorithm, not face analysis or a trained model.
    let sum=0;
    for(const key of ['hair','face','style']){
      const relevant=history.filter(r=>r.attributes[key]===person[key]);
      const positive=relevant.reduce((n,r)=>n+(r.rating==='like'?1:r.rating==='unsure'?.5:0),0);
      const smoothed=(1+positive)/(2+relevant.length); // Beta(1,1) smoothed preference
      sum+=(smoothed-.5)/3;
    }
    // User-selected tags make attribute feedback more informative than a bare like;
    // only hair/face/style are represented in this small, synthetic image library.
    for (const r of history) {
      if (r.rating!=='like'||!Array.isArray(r.tags)) continue;
      for (const [tag,key] of [['hair','hair'],['face','face'],['style','style']]) {
        if (r.tags.includes(tag)&&r.attributes[key]===person[key]) sum+=0.07;
      }
    }
    return sum;
  }
  function dailyVisualPlan(){
    const day=today(),eligible=applicablePhotos();
    if(!store.visualPlans||typeof store.visualPlans!=='object')store.visualPlans={};
    const cached=store.visualPlans[day];
    if(Array.isArray(cached)&&cached.length&&cached.every(id=>eligible.some(p=>p.id===id)))return cached;
    const history=visualRatingHistory();const seen=new Set(history.map(r=>r.candidate));
    // A balanced mix of exploration and modest feedback-driven exploitation.
    // Avoid showing previously rated candidates until the pool is exhausted.
    let pool=eligible.filter(p=>!seen.has(p.id));
    if(pool.length<PHOTO_DAILY_COUNT)pool=eligible.slice();
    const scored=pool.map(p=>({p,score:imagePreferenceScore(p,history),noise:sampleHash(day+p.id)}));
    const explore=scored.slice().sort((a,b)=>b.noise-a.noise).slice(0,Math.min(5,scored.length));
    const chosen=explore.slice(),taken=new Set(chosen.map(x=>x.p.id));
    const exploit=scored.filter(x=>!taken.has(x.p.id)).sort((a,b)=>(b.score+.14*b.noise)-(a.score+.14*a.noise));
    chosen.push(...exploit.slice(0,Math.max(0,PHOTO_DAILY_COUNT-chosen.length)));
    const result=chosen.slice(0,PHOTO_DAILY_COUNT).map(x=>x.p.id);
    store.visualPlans[day]=result;
    save();return result;
  }
  function activeVisualCandidate(){const plan=dailyVisualPlan(),done=calibrationToday().length;return PHOTO_POOL.find(p=>p.id===plan[done])||null}
  function visualSummary(){const history=visualRatingHistory();
    const reasons={};for(const r of history)if(r.rating==='like')for(const tag of (r.tags||[])) reasons[tag]=(reasons[tag]||0)+1;
    const top=Object.entries(reasons).sort((a,b)=>b[1]-a[1]).slice(0,3).filter(([,n])=>n>=2);
    const tagNames=Object.fromEntries(PHOTO_FEEDBACK_TAGS);
    if(top.length)return `You mentioned ${top.map(([tag,n])=>`${tagNames[tag]||tag} (${n})`).join(', ')} on liked photos. This reflects what you selected, not an AI diagnosis.`;
    if(history.length<5)return 'Still exploring — your ratings and optional tags will guide future examples.';
    let best=null;for(const key of ['hair','face','style']){for(const value of [...new Set(history.map(r=>r.attributes[key]))]){const subset=history.filter(r=>r.attributes[key]===value);if(subset.length<2)continue;const score=(1+subset.reduce((n,r)=>n+(r.rating==='like'?1:r.rating==='unsure'?.5:0),0))/(2+subset.length);if(!best||score>best.score)best={key,value,score};}}
    return best?`Very tentative pattern: ${best.value} ${best.key} appeared in several appealing examples. Swipe feedback is not proof a feature caused attraction.`:'Not enough repeated examples yet to infer reliable preferences.';
  }
  const focusMap={hair:['Short & textured','Shoulder-length waves','Long & straight','Curly volume','Closely cropped','Soft fringe'],face:['Soft rounded contours','Defined cheekbones','Angular profile','Oval contours','Wider jaw','Heart-shaped outline'],style:['Relaxed outdoors','Tailored minimal','Creative vintage','Sporty casual','Warm earth tones','Bold modern'],build:['Slender silhouette','Athletic silhouette','Broad silhouette','Soft silhouette','Tall-looking proportions','Compact proportions'],tattoos:['No visible tattoos','Small illustrative tattoos','Statement sleeve','Minimal line art','Small hand design','Colour accents']};
  const calibrationSeeds=[
    {hair:0,face:0,style:0,build:0,tattoos:0,skin:'#ddbb9b',coat:'#718d7c',bg:'#d8e4d9'},
    {hair:1,face:1,style:1,build:1,tattoos:1,skin:'#a47859',coat:'#9b8183',bg:'#e3d4d4'},
    {hair:2,face:2,style:2,build:2,tattoos:0,skin:'#c49774',coat:'#8b92ab',bg:'#cfd7e1'},
    {hair:3,face:3,style:3,build:3,tattoos:2,skin:'#764a36',coat:'#b4987d',bg:'#e8dccb'},
    {hair:4,face:4,style:4,build:4,tattoos:3,skin:'#efc3a4',coat:'#657875',bg:'#cfdbd8'},
    {hair:5,face:5,style:5,build:5,tattoos:0,skin:'#b38869',coat:'#8f84a1',bg:'#ddd7e4'},
    {hair:2,face:4,style:2,build:1,tattoos:1,skin:'#cfaa83',coat:'#8b9c83',bg:'#e0e8db'},
    {hair:0,face:3,style:4,build:2,tattoos:0,skin:'#86593f',coat:'#b6a6a0',bg:'#e5d8d1'},
    {hair:3,face:1,style:0,build:3,tattoos:3,skin:'#e7c6ab',coat:'#879e98',bg:'#dfebe5'},
    {hair:1,face:5,style:1,build:5,tattoos:2,skin:'#b58c6d',coat:'#9c8e83',bg:'#dfddd5'},
    {hair:4,face:2,style:3,build:4,tattoos:1,skin:'#ac795d',coat:'#688b99',bg:'#cedfe3'},
    {hair:5,face:0,style:5,build:0,tattoos:0,skin:'#deb394',coat:'#a78f9f',bg:'#e3d6df'}
  ];
  const icon = (s) => `<span aria-hidden="true">${s}</span>`;
  function notice(text){const t=document.getElementById('toast');t.textContent=text;t.hidden=false;clearTimeout(notice._timer);notice._timer=setTimeout(()=>t.hidden=true,3600)}
  async function api(path, payload){
    if(!LOCAL) throw Error('The public GitHub Pages demo has no AI backend.');
    const options=payload===undefined ? {cache:'no-store'} : {method:'POST',headers:{'Content-Type':'application/json','X-BeYou-Local':'1'},body:JSON.stringify(payload)};
    const resp=await fetch(path,options);const data=await resp.json();if(!resp.ok)throw Error(data.error||`HTTP ${resp.status}`);return data;
  }
  function consentGate(next){
    consentTarget=next;
    document.getElementById('modal-root').innerHTML=`<div class="modal-scrim" data-dismiss="consent"><section class="consent-modal" role="dialog" aria-modal="true" aria-labelledby="consent-modal-title"><div class="row spread"><div class="eyebrow">BE-YOU · EVERYONE DESERVES RESPECT</div><button class="modal-x" data-action="close-modal" aria-label="Close">×</button></div><h2 id="consent-modal-title">A small promise before we connect.</h2><p>Consent must be freely given, specific and ongoing. Anyone can change their mind, at any time. Pressure or silence are not consent; check in, listen and respect boundaries.</p><label class="inline-check consent-confirm"><input type="checkbox" id="consent-gate-check"><span>I understand these principles of sexual consent and agree to respect others' boundaries.</span></label><button class="btn" id="consent-gate-continue" data-action="accept-consent" disabled>Continue to Be-You</button><p class="tiny">This acknowledgement is required to use the prototype. Optional intimate-preference questions are separate and may be skipped.</p></section></div>`;
  }
  function setRoute(next){
    if(store.onboardComplete && !store.consentAcknowledged && ['twin','discover','messages','preferences','studio'].includes(next)){
      consentGate(next);return;
    }
    clearInterval(restoredQuoteTimer);restoredQuoteTimer=null;
    if(next!=='studio'){clearInterval(studioInterval);studioInterval=null;}
    if(next==='studio'&&route!=='studio'){
      store.studioStartedAt=Date.now();save();
      abstractStudio=nextAbstract();studioEditing=false;studioIndex=0;
    }
    if(next!=='discover'&&galleryOpen){document.getElementById('modal-root').innerHTML='';galleryOpen=false;}
    route=next;render();window.scrollTo(0,0);
  }
  function nav(){const items=store.onboardComplete?[['twin','My Twin'],['discover','Discover'],['messages','Messages'],['preferences','Preferences']]:[['home','Home'],['onboard','Get started']];document.getElementById('main-nav').innerHTML=items.map(([key,label])=>`<button class="nav-btn ${route===key?'active':''}" data-route="${key}">${label}</button>`).join('');document.getElementById('environment-label').textContent=LOCAL?'Local AI + demo':'Public demo';document.getElementById('footer-status').textContent=LOCAL?'Local Qwen + fictional matches · 18+':'Static public demo · Fictional people · 18+'}
  function render(){nav();if(route==='home')return renderHome();if(route==='onboard')return renderOnboard();if(route==='studio')return renderStudio();if(route==='twin')return renderTwin();if(route==='discover')return renderDiscover();if(route==='messages')return renderMessages();if(route==='preferences')return renderPreferences();setRoute('home')}
  function renderHome(){
    clearInterval(restoredQuoteTimer);
    app.innerHTML=`<div class="restored-home page-enter"><section class="heritage-hero"><div class="hero-copy"><p class="want" style="font-size:clamp(2rem, 5vw, 4rem)">I want</p><h1 id="authLine" aria-live="polite"></h1><p class="catchphrase">Show people the Real <i>You</i>.</p><div class="hero-actions"><span class="ready">Ready to…</span><button class="btn heritage-cta" data-action="intro">Be-You <span aria-hidden="true">→</span></button></div></div><div class="heritage-abstract" aria-hidden="true"><img src="${artPath(nextAbstract())}" alt="" width="600" height="420"></div><div class="hero-side"><span id="authCount">01 / 04</span><span class="side-line"></span></div></section><div class="heritage-band"><p>So much more than a picture</p><div class="heritage-strip"><span>Personality comes first</span><span>Looks still matter</span><span>The choice stays yours</span></div></div>${LOCAL&&backendState?.started?'<div class="heritage-resume"><button class="btn outline small" data-action="resume-twin">Continue with my existing Twin →</button></div>':''}</div>`;
    startRestoredAuthenticity();
  }
  function showIntro(){introIndex=0;renderIntro()}
  function renderIntro(){
    const s=originalSlides[introIndex];
    document.getElementById('modal-root').innerHTML=`<div class="modal-scrim heritage-modal-scrim" data-dismiss="intro"><section class="intro-modal heritage-intro" role="dialog" aria-modal="true" aria-labelledby="intro-title"><div class="modal-header"><span class="eyebrow">BEFORE WE BEGIN</span><button class="modal-x" data-action="close-modal" aria-label="Close introduction">×</button></div><div class="heritage-slide-layout"><div class="heritage-slide-content"><div class="heritage-slide-heading"><span class="heritage-slide-number">0${introIndex}</span><span class="heritage-slide-label">${e(s.label)}</span></div><h2 id="intro-title" class="heritage-slide-title">${italics(e(s.title))}</h2><p class="heritage-slide-copy">${italics(e(s.copy))}</p><p class="heritage-slide-note">${italics(e(s.note))}</p></div><div class="slide-visual" aria-hidden="true">${originalSlideVisual(introIndex)}</div></div><div class="modal-footer"><button class="btn flat" data-action="intro-back" ${introIndex===0?'disabled':''}>← Back</button><div class="dots" aria-label="Step ${introIndex+1} of 7">${originalSlides.map((_,i)=>`<i class="${i===introIndex?'active':''}"></i>`).join('')}</div><button class="btn" data-action="intro-next">${introIndex===originalSlides.length-1?'Begin with you →':'Next →'}</button></div></section></div>`;
  }
  const fields=(group,key,label,type='text',opts={},full=false)=>{const val=store[group]?.[key]??'';let input;if(type==='select'){input=`<select data-group="${group}" name="${key}">${Object.entries(opts).map(([v,n])=>`<option value="${e(v)}" ${String(val)===v?'selected':''}>${e(n)}</option>`).join('')}</select>`}else if(type==='textarea'){input=`<textarea data-group="${group}" name="${key}" placeholder="${e(opts.placeholder||'')}" rows="3">${e(val)}</textarea>`}else input=`<input data-group="${group}" name="${key}" type="${type}" value="${e(val)}" placeholder="${e(opts.placeholder||'')}" ${opts.min?`min="${opts.min}"`:''} ${opts.max?`max="${opts.max}"`:''}>`;return `<label class="form-field ${full?'full':''}"><span>${e(label)}</span>${input}${opts.note?`<small>${e(opts.note)}</small>`:''}</label>`};
  const stepTitles=[['A little about you.','The basics help us understand who might be relevant. Nothing needs to sound impressive.'],['Tell me who you are.','Six starting points, not a personality test. Answer in your own words. Skip anything you don’t want to share.'],['Your type. Your terms.','Attraction matters too. Describe your preferences, non-negotiables, and where you’re flexible.'],['Explore what catches your eye.','Swipe through realistic AI-generated fictional adults. They are not real users. Each choice helps the prototype select what to show you next.']];
  function renderOnboard(){const n=store.stage||0,meta=stepTitles[n];app.innerHTML=`<div class="wrap-narrow onboard-layout page-enter"><div class="eyebrow">YOUR FIRST CHAPTER · ${n+1} OF 4</div><div class="stepper">${Array.from({length:4},(_,i)=>`<i class="${i<=n?'done':''}"></i>`).join('')}</div><div class="onboard-title"><h2>${meta[0]}</h2><p>${meta[1]}</p></div><div class="onboard-form">${n===0?basicForm():n===1?deeperForm():n===2?physicalForm():calibrationForm()}${n!==3?`<div class="onboard-actions"><button class="btn outline" data-action="step-back" ${n===0?'disabled':''}>← Back</button><button class="btn" data-action="step-next">Continue →</button></div>`:`<div class="onboard-actions"><button class="btn outline" data-action="step-back">← Back</button><button class="btn soft" data-action="skip-calib">Skip for now →</button></div>`}</div></div>`}
  function basicForm(){return `<div class="form-grid">${fields('basic','name','What should I call you?','text',{placeholder:'First name or nickname'})}${fields('basic','age','Age (18+)','number',{min:18,max:100,placeholder:'30'})}${fields('basic','city','City / area','text',{placeholder:'Lund'})}${fields('basic','gender','I identify as','select',{'':'Prefer not to say','woman':'Woman','man':'Man','nonbinary':'Non-binary','other':'Another description'})}${fields('basic','seeking','Interested in meeting','select',{'':'Still exploring','women':'Women','men':'Men','all':'People of any gender','other':'Other / prefer to describe'})}${fields('basic','intent','What are you looking for?','select',{'':'Still figuring it out','long-term':'A long-term relationship','relationship':'A relationship, open to seeing where it goes','casual':'Something casual','friends':'Friendship first'})}<div class="form-field full"><div class="note">Prototype only. Your answers here are saved in this browser. On localhost, your basic and deeper answers can also be sent to your private v3 twin when you begin.</div></div></div>`}
  function deeperForm(){return `<div class="question-cards">${questionFields.map((q,i)=>`<div class="question-card"><span class="qnum">0${i+1}</span><label class="form-field"><span>${e(q.label)}</span><p>${e(q.help)}</p><textarea data-group="deep" name="${q.key}" placeholder="${e(q.hint)}">${e(store.deep[q.key]||'')}</textarea></label></div>`).join('')}</div>`}
  function physicalForm(){return `<div class="stack"><div class="form-grid">${fields('physical','appearance','What do you find physically attractive?','textarea',{placeholder:'A smile, eyes, facial characteristics, hair, presentation, body type, style…'},true)}${fields('physical','limits','Any absolute dealbreakers or hard limits?','textarea',{placeholder:'Optional: a preference you know is essential'},true)}${fields('physical','flex','What are you flexible about?','textarea',{placeholder:'What matters less than the connection itself?'},true)}${fields('physical','expression','What makes attraction grow for you?','textarea',{placeholder:'Voice, gestures, confidence, how somebody carries themselves…'},true)}</div><section class="consent-acknowledgement" aria-labelledby="consent-basics-heading">
    <div class="section-label">REQUIRED FOR EVERYONE · CONSENT</div>
    <h3 id="consent-basics-heading">Consent makes connection possible.</h3>
    <p>Sexual consent must be <strong>freely given, informed, specific, ongoing, and reversible</strong>. No one owes another person intimacy. Silence, pressure, or being too impaired to choose are not consent. Check in, respect boundaries, and stop when someone withdraws consent.</p>
    <label class="inline-check consent-confirm"><input type="checkbox" id="consent-ack" ${store.consentAcknowledged?'checked':''} required><span>I understand these principles of consent and agree to respect other people's boundaries. <strong>Required to continue.</strong></span></label>
    </section><details class="details-block" ${store.adultOpen?'open':''} id="adult-details"><summary>Optional: intimacy & sexual compatibility <span class="tiny">Private choice</span></summary><div class="details-copy stack"><p class="tiny">For adults only. Skip any question. Intimate preferences can be highly personal. In this prototype, only answers you consent to save are kept in this browser (not encrypted); nothing here is sent to Qwen or other users. You can clear them at any time.</p><label class="inline-check"><input type="checkbox" id="adult-consent" ${store.adultConsent?'checked':''}>I choose to store optional intimate preferences in this browser for this prototype.</label><div class="form-grid" id="adult-fields" ${!store.adultConsent?'hidden':''}>${fields('adult','desire','How would you describe your sex drive?','select',{'':'Prefer not to say','low':'Lower','medium':'Medium / varies','high':'Higher','unsure':'Unsure / depends'})}${fields('adult','pace','What pace of intimacy feels comfortable?','select',{'':'Prefer not to say','slow':'Slow, with growing trust','context':'Depends on chemistry and trust','open':'Open to exploring earlier'})}${fields('adult','style','What kind of sexual dynamic do you enjoy or want to explore?','textarea',{placeholder:'Optional: tender, playful, rougher, dominant/submissive, sensual, adventurous…'},true)}${fields('adult','interests','Any consensual fantasies, kinks, or desires that matter to compatibility?','textarea',{placeholder:'Optional: BDSM, role play, restraint, impact play, specific dynamics, or none.'},true)}${fields('adult','boundaries','Any boundaries or absolute hard no’s?','textarea',{placeholder:'Optional. Consent and boundaries always come first.'},true)}${fields('adult','communication','What helps you feel safe and comfortable?','textarea',{placeholder:'Optional: communicating desires, check-ins, aftercare, STI discussions…'},true)}</div><button class="btn small outline" data-action="clear-adult" type="button">Clear intimate answers</button></div></details><div class="note">Physical preferences will ultimately be a separate part of the matching model—not a psychological diagnosis or a deduction from someone's photographs.</div></div>`}
  function calibrationToday(){return store.ratings.filter(r=>r.date===today()&&r.source==='synthetic-photo')}
  function renderAvatar(a,focus){const hairNum=a.hair%6, shape=a.face%6, skin=a.skin,coat=a.coat,bg=a.bg;
    const outlines=['M140 112 C140 74 160 54 200 54 C245 54 262 75 260 112 L250 185 C240 228 221 243 200 245 C179 243 160 228 151 185 Z','M142 120 Q143 57 202 51 Q260 58 259 122 L247 198 Q231 250 199 247 Q162 248 153 199 Z','M148 119 Q145 60 200 51 Q257 60 253 119 L248 183 Q230 242 201 254 Q166 242 152 181 Z','M139 120 Q143 56 200 52 Q257 56 261 120 Q259 205 217 240 Q183 254 155 218 Q143 198 139 120 Z','M130 126 Q135 59 200 52 Q267 59 270 126 L260 191 Q236 232 200 248 Q164 233 139 191 Z','M157 118 Q165 59 200 52 Q235 59 245 118 Q263 187 229 230 Q207 251 197 250 Q165 235 145 191 Z'];
    const hairPath=[`M140 125 Q125 69 161 48 Q202 25 249 51 Q270 73 262 128 Q250 93 231 85 Q199 101 167 86 Q153 96 140 125 Z`,`M143 123 Q120 57 174 38 Q250 20 261 102 L269 245 Q254 257 248 225 L249 113 Q231 78 205 90 Q171 100 143 123 L144 234 Q126 236 125 219 Z`,`M139 126 Q115 64 161 42 Q221 20 256 60 Q283 94 270 148 L264 273 L248 270 L255 120 Q246 93 228 87 Q178 93 147 120 L139 280 L121 268 Z`,`M138 122 Q111 105 127 74 Q117 37 151 42 Q169 17 192 33 Q221 17 238 40 Q276 39 269 84 Q296 107 259 130 Q245 86 222 91 Q190 101 162 88 Z`,`M142 120 Q139 78 177 62 Q211 49 239 68 Q260 85 258 118 Q236 88 201 92 Q168 91 142 120 Z`,`M132 128 Q115 69 153 40 Q180 25 208 38 Q241 23 265 61 Q278 105 261 136 Q232 94 204 101 L193 123 Q163 87 132 128 Z`][hairNum];
    const w=[116,137,160,148,170,125][a.build%6];const tattoo=a.tattoos?`<path d="M${90-(a.tattoos*2)} 343 q20 -22 26 0 q-16 15 -24 -3 M296 344 q18 -20 25 0" stroke="#70685f" stroke-width="3" fill="none" opacity=".7"/>`:'';
    return `<svg viewBox="0 0 400 480" role="img" aria-label="Illustrated, fictional adult appearance example" xmlns="http://www.w3.org/2000/svg"><rect width="400" height="480" fill="${bg}"/><circle cx="307" cy="116" r="114" fill="#fff" opacity=".18"/><path d="M0 444 Q155 355 400 446 V480 H0Z" fill="#fff" opacity=".3"/><path d="M${200-w} 450 Q${200-w} 342 145 336 L170 304 H230 L255 336 Q${200+w} 345 ${200+w} 450Z" fill="${coat}"/><rect x="178" y="253" width="44" height="75" rx="22" fill="${skin}"/><path d="${outlines[shape]}" fill="${skin}"/><path d="${hairPath}" fill="#40382f"/><path d="M170 155 q12 -8 25 0 M211 155 q12 -8 25 0" stroke="#5a4439" stroke-width="4" stroke-linecap="round" fill="none"/><circle cx="183" cy="166" r="3.4" fill="#3c3936"/><circle cx="220" cy="166" r="3.4" fill="#3c3936"/><path d="M202 174 q-8 20 0 25" stroke="#a17762" stroke-width="3" fill="none"/><path d="M187 213 Q200 223 215 211" stroke="#ad685d" stroke-width="3" fill="none" stroke-linecap="round"/>${tattoo}${focus==='style'?`<circle cx="165" cy="340" r="7" fill="#dac3a8"/>`:''}<rect x="11" y="11" width="140" height="29" rx="15" fill="#fff" opacity=".86"/><text x="22" y="30" fill="#53675b" font-family="sans-serif" font-size="12">Illustrated example</text></svg>`
  }
  function calibrationForm(){
    const plan=dailyVisualPlan(),done=calibrationToday().length;
    if(done>=plan.length)return `<div class="center stack" style="padding:26px 12px"><div class="eyebrow">TYPE CALIBRATION COMPLETE</div><h3>That's your twelve for today.</h3><p>Your choices and optional notes are saved with each photo.</p><div class="note">${e(visualSummary())}</div><button class="btn" data-action="complete-onboard">${store.onboardComplete?'Return to My Twin →':'Continue to chemistry →'}</button></div>`;
    const candidate=activeVisualCandidate();if(!candidate)return `<p>Could not load your image set.</p>`;
    const draft=store.photoDrafts[candidate.id]||{tags:[],note:''};
    return `<div class="visual-swiper"><div class="row spread"><span class="calib-progress">${done+1} / ${plan.length}</span><span class="tiny">Daily visual discovery · 18+</span></div><div class="small-progress"><i style="width:${done/plan.length*100}%"></i></div><div class="visual-swipe-card" data-swipe-photo="${e(candidate.id)}" tabindex="0" aria-label="Fictional AI-generated adult portrait. Swipe left or right, or use buttons below."><img src="${e(candidate.src)}" alt="AI-generated fictional adult portrait ${done+1} of ${plan.length}" draggable="false"><div class="photo-asset-error" role="alert" hidden>Photo unavailable. Make sure <strong>website/assets/people/</strong> contains the portrait images and your updated local server is running.</div><div class="synthetic-label">✦ AI-GENERATED · NOT A REAL USER</div><div class="visual-photo-caption"><strong>What catches your eye?</strong><span>Go with your instinct · swipe left or right</span></div></div><div class="photo-feedback" aria-label="Optional appearance feedback"><div class="photo-feedback-head"><strong>What stood out to you?</strong><span>Optional · celebrate what you appreciated</span></div><p class="photo-feedback-hint">Maybe it’s a particular feature—or simply the vibe, warmth, energy, or overall impression of the photo. Choose whatever feels right.</p><div class="photo-feedback-tags">${PHOTO_FEEDBACK_TAGS.map(([key,label])=>`<button type="button" class="photo-tag ${draft.tags?.includes(key)?'selected':''}" data-action="toggle-photo-tag" data-tag="${key}" aria-pressed="${draft.tags?.includes(key)?'true':'false'}">${e(label)}</button>`).join('')}</div><label class="photo-note-label"><span>One thing you appreciated (optional)</span><input type="text" maxlength="240" data-photo-note="${e(candidate.id)}" placeholder="e.g. gentle vibe, expressive eyes, relaxed confidence…" value="${e(draft.note||'')}"></label></div><div class="visual-swipe-actions"><button type="button" class="swipe-circle swipe-no" data-action="rate" data-rating="pass" aria-label="Not my type">×</button><button type="button" class="swipe-circle swipe-maybe" data-action="rate" data-rating="unsure" aria-label="Not sure">?</button><button type="button" class="swipe-circle swipe-yes" data-action="rate" data-rating="like" aria-label="Appealing">♥</button></div><p class="tiny center">Synthetic adults, not real dating profiles. Notes and tags are saved together with each swipe in this browser.</p><div class="visual-current-insight"><strong>Learning your preferences</strong><p>${e(visualSummary())}</p></div></div>`;
  }
  function validateStep(){if(store.stage===0){const age=Number(store.basic.age);if(!normalize(store.basic.name)){notice('Please enter a name or nickname.');return false}if(!Number.isFinite(age)||age<18||age>100){notice('This 18+ prototype requires a valid age.');return false}}if(store.stage===1&&!Object.values(store.deep).some(v=>normalize(v))){notice('Please share at least one answer so your twin has somewhere to begin.');return false}if(store.stage===2&&!store.consentAcknowledged){notice('Please acknowledge the consent principles to continue.');document.getElementById('consent-ack')?.focus();return false}return true}
  function advanceStep(){if(!validateStep())return;store.stage=Math.min(3,(store.stage||0)+1);save();render();window.scrollTo(0,0)}
  function completeOnboard(){store.onboardComplete=true;store.stage=3;save();setRoute('studio');if(LOCAL)startTwinBackground()}
  async function startTwinBackground(){if(!LOCAL||waiting)return;waiting=true;backendError='';const display=document.getElementById('studio-ai-status');if(display)display.textContent='Connecting your local Qwen twin…';try{const health=await api('/api/health');if(!health.ollama)throw Error('Open Ollama first.');if(!health.installed)throw Error(`Model ${health.model} not installed. Run ollama pull ${health.model}`);const state=await api('/api/state');if(!state.started){const d=store.deep;const meaning=[d.motives&&`Decisions: ${d.motives}`,d.closeness&&`Relationships: ${d.closeness}`,d.change&&`Personal change: ${d.change}`,d.worldview&&`Worldview: ${d.worldview}`].filter(Boolean).join('\n');await api('/api/start',{fields:{name:store.basic.name||'',interests:d.interests||'',meaning:meaning||'Learning about interests and personality',moment:d.story||'',connection:store.basic.intent||''}})}else await api('/api/start',{fields:{}});backendState=await api('/api/state');if(route==='twin')renderTwin();const live=document.getElementById('studio-ai-status');if(live)live.textContent='Your local My Twin is ready.';}catch(err){backendError=err.message;const live=document.getElementById('studio-ai-status');if(live)live.textContent='Local AI not connected: '+backendError;}finally{waiting=false}}
  function studioDemoTick(){
    if(route!=='studio'){clearInterval(studioInterval);studioInterval=null;return;}
    const elapsed=Math.max(0,Date.now()-Number(store.studioStartedAt));
    const remaining=Math.max(0,Math.ceil((STUDIO_DEMO_LENGTH_MS-elapsed)/1000));
    const timeText=`${String(Math.floor(remaining/60)).padStart(2,'0')}:${String(remaining%60).padStart(2,'0')}`;
    const clock=document.getElementById('studio-demo-clock');
    const message=document.getElementById('studio-brand-message');
    const bar=document.getElementById('studio-demo-bar');
    const cta=document.getElementById('studio-demo-cta');
    if(clock)clock.textContent=remaining===0?(studioEditing?'Preview ready · finish your correction':'Preview ready'):`Demo profiles in ${timeText}`;
    if(bar)bar.style.width=`${Math.max(0,Math.min(100,(elapsed/STUDIO_DEMO_LENGTH_MS)*100))}%`;
    if(cta){cta.disabled=remaining>0;cta.textContent=remaining===0?'Discover five fictional vibes →':'Preparing sample vibes…';}
    if(message){
      const idx=Math.floor(elapsed/4100)%STUDIO_MESSAGES.length;
      const msg=STUDIO_MESSAGES[idx];
      if(message.dataset.headline!==String(idx)){
        message.classList.remove('studio-quote-in');
        message.innerHTML=`${e(msg[0])}<span class="serif">${e(msg[1])}</span>`;
        message.dataset.headline=String(idx);
        void message.offsetWidth;message.classList.add('studio-quote-in');
      }
    }
    // Demo-only. Never claim real matches have been found.
    // Do not interrupt an actively edited correction; transition immediately afterward.
    if(remaining===0&&!studioEditing){setRoute('discover');return;}
  }
  function renderStudio(){
    if(!store.studioStartedAt){store.studioStartedAt=Date.now();save();}
    const done=Object.keys(store.previewDone).length;
    const scene=SCENARIOS[studioIndex];
    const previewStatus=store.previewJudgments[studioIndex];
    app.innerHTML=`<div class="wrap processing-shell page-enter chemistry-v2 chemistry-v3">
      <div class="processing-intro">
        <div class="eyebrow">Be-You · FROM A SWIPE TO A SPARK</div>
        <div class="chemistry-art"><img src="${artPath(abstractStudio)}" width="600" height="420" alt="Original abstract composition representing the complexity of human personalities"></div>
        <h2 id="studio-brand-message" data-headline="0" class="chemistry-main-headline studio-quote-in">${e(STUDIO_MESSAGES[0][0])}<span class="serif">${e(STUDIO_MESSAGES[0][1])}</span></h2>
        <div class="chemistry-timer" role="status" aria-live="off"><span class="chemistry-timer-dot"></span><span id="studio-demo-clock">Demo profiles in 00:45</span><span class="chemistry-demo-label">FICTIONAL PREVIEW · NOT LIVE MATCHING</span></div>
        <div class="chemistry-progress"><span id="studio-demo-bar"></span></div>
        <div class="loading-rail"><i class="loading-dot"></i><i class="loading-dot"></i><i class="loading-dot"></i><span id="studio-ai-status">${LOCAL?(backendState?.started?'Your local My Twin is ready.':waiting?'Connecting to your local My Twin…':'Local My Twin can be connected.'): 'Static demo · real matching is not connected'}</span></div>
      </div>
      <section class="studio-reviews" aria-label="Optional twin conversation feedback">
        <div class="studio-review-head"><div><strong>Does this sound like you?</strong><p>Swipe right if it feels like you, left if it doesn’t. You can also edit your twin’s reply.</p></div><span class="studio-reviewed-count">${done} of 3 reviewed</span></div>
        <div class="studio-log-carousel"><button class="studio-chevron" data-action="studio-prev" aria-label="Previous fictional conversation">‹</button><article class="studio-log-card" data-studio-swipe="${studioIndex}" tabindex="0" aria-label="Fictional twin conversation. Swipe right if represented or left if not, or edit the reply.">
          <div class="studio-log-top"><span>FICTIONAL CONVERSATION ${studioIndex+1} / 3</span><strong>${e(scene.label)}</strong></div>
          <div class="studio-thread">${STUDIO_CONTEXTS[studioIndex].map(m=>`<div class="studio-turn ${m.side}"><span>${m.side==='mine'?'Your Twin':'Other Twin'} · demo</span><div class="studio-message">${e(m.text)}</div></div>`).join('')}<div class="studio-turn other"><span>Other Twin · demo</span><div class="studio-message">${e(scene.other)}</div></div><div class="studio-turn mine latest"><span>Your Twin · illustrative</span><div class="studio-message">${e(scene.you)}</div></div></div>
          <div class="studio-response-actions"><button class="studio-yes" data-action="studio-yes">✓ Sounds like me</button><button class="studio-edit" data-action="studio-no">× Not really</button><button class="studio-skip" data-action="studio-edit">✎ Edit reply</button></div>
          <div class="studio-editor" ${studioEditing?'':'hidden'}><label for="studio-editor-text">What would you actually say? (optional)</label><textarea id="studio-editor-text" data-preview="${studioIndex}" placeholder="I'd probably say…">${e(store.previewNotes[studioIndex]||'')}</textarea><div class="studio-editor-buttons"><button class="btn small" data-action="studio-save">Save my version</button><button class="btn outline small" data-action="studio-cancel">Cancel</button></div></div>
          <div class="studio-review-status">${previewStatus==='no'?'✓ Noted: this didn’t feel like you.':previewStatus==='yes'?'✓ Noted: sounds like you.':previewStatus==='edit'?'✓ Saved your own reply.':'Right = sounds like me · left = not really · correction optional'}</div>
        </article><button class="studio-chevron" data-action="studio-next" aria-label="Next fictional conversation">›</button></div>
        <div class="studio-pages">${SCENARIOS.map((_,i)=>`<button data-action="studio-jump" data-index="${i}" class="${studioIndex===i?'active':''}" aria-label="View conversation ${i+1}"></button>`).join('')}</div>
      </section>
      <div class="chemistry-cta"><button class="btn" data-route="discover" id="studio-demo-cta" disabled>Preparing sample vibes…</button><button class="small-link" data-action="studio-skip-countdown">Skip demo wait →</button></div>
      <p class="tiny chemistry-disclaimer">Design preview only. No real candidate matching is running. At zero, this opens five fictional vibe profiles automatically.</p>
    </div>`;
    clearInterval(studioInterval);studioDemoTick();
    if(route==='studio')studioInterval=setInterval(studioDemoTick,1000);
  }
  function twinMessages(){if(LOCAL&&backendState?.started){const arr=backendState.chat||[];return arr.filter(x=>['assistant','chat','daily_answer'].includes(x.kind)).map(m=>({mine:m.kind!=='assistant',text:m.text}))}return store.demoChats.length?store.demoChats:[{mine:false,text:'Hey! I’m the My Twin demo. I’d love to hear what you care about, what makes you laugh, or how your day has been. On your local site with Qwen running, this chat becomes the real AI twin.'}]}
  function renderTwin(){const msgs=twinMessages();app.innerHTML=`<div class="wrap app-page page-enter"><div class="page-head"><div><div class="eyebrow">YOUR SPACE, YOUR PACE</div><h2>My <span class="serif">Twin.</span></h2><p>Not an interview. A companion who keeps getting to know the real you.</p></div><button class="btn soft small" data-action="open-studio">See virtual-date previews ↗</button></div>${LOCAL?`<div class="demo-banner">${backendState?.started?'Connected to your private local v3 backend. Your original conversations are stored in local SQLite.':waiting?'Connecting to your local Qwen backend…':'The local AI is not connected yet. '+e(backendError||'Make sure Ollama and Start_Local.bat are running.')}</div>`:'<div class="demo-banner">Public demo: this is a scripted chat interface, not a hosted AI. Open the website through Start_Local.bat for real Qwen conversations.</div>'}<div class="feature-panels"><section class="surface chat-shell"><div class="chat-head"><span class="twin-avatar">✦</span><div><h3>My Twin</h3><p>${LOCAL&&backendState?.started?'Connected locally · learning with you':'Preview mode · real AI is local-only'}</p></div><span class="state-pill" style="margin-left:auto">${LOCAL&&backendState?.started?'Local AI':'Demo'}</span></div><div class="chat-thread" id="chat-thread" aria-live="polite">${msgs.map(m=>`<div class="bubble ${m.mine?'mine':''}">${e(m.text)}</div>`).join('')}</div><div class="chat-chips"><button class="chip-btn" data-action="daily">Ask me something</button><button class="chip-btn" data-action="suggest-date">About someone I met</button><button class="chip-btn" data-action="ask-pattern">What have you learned?</button><button class="chip-btn" data-action="edit-looks">Physical preferences</button></div><form id="twin-form" class="compose"><textarea id="twin-text" placeholder="Talk about anything…" rows="2" maxlength="6500" aria-label="Message My Twin"></textarea><button class="btn" type="submit" ${waiting?'disabled':''}>Send ↗</button></form><div class="chat-tools"><span id="twin-status" class="status-line">${LOCAL&&backendState?.started?'Chat naturally; deeper portrait updates run separately.':'Prototype: real AI processing is local only.'}</span><button class="small-link" data-action="refresh-portrait">Update my model</button></div></section><aside class="side-cards"><div class="side-card"><div class="section-label">MY LIVING PORTRAIT</div><h3>A picture that's always changing.</h3><p>Your experiences, motivations, values and behavioural patterns gradually form an evolving model.</p><button class="btn soft small" data-action="toggle-portrait">${showPortrait?'Hide portrait':'What do you know about me?'}</button>${showPortrait?`<div class="portrait-preview" style="margin-top:15px">${e(backendState?.portrait||'No local AI portrait has been built yet. Talk with your twin and update the model.')}</div>`:''}</div><div class="side-card"><div class="section-label">DAILY LITTLE THINGS</div><h3>Get to know yourself.</h3><p>Small questions, new memories, and a chance to correct how your twin understands you.</p><button class="btn outline small" data-action="daily">Today's questions ↗</button></div><div class="side-card"><div class="section-label">ATTRACTION & PREFERENCES</div><h3>Your type evolves, too.</h3><p>Your private descriptive preferences and optional visual calibrations live alongside your twin.</p><button class="btn outline small" data-route="preferences">Manage preferences →</button></div></aside></div></div>`;const thread=document.getElementById('chat-thread');if(thread)thread.scrollTop=thread.scrollHeight}
  const activeVibes=()=>VIBES.filter(x=>!store.likes[x.id]);
  function activeVibe(){const remaining=activeVibes();let selected=VIBES.find(x=>x.id===String(store.vibeIndex))||remaining[0]||VIBES[0];return store.likes[selected.id] ? (remaining[0]||VIBES[0]) : selected}
  function vibeMoment(vibe,index){return (VIBE_MEDIA[vibe.id]||VIBE_MEDIA['1'])[(index+4)%4]}
  function sceneSurface(moment,large=false){
    const img=`<img src="${e(moment.src)}" alt="Illustrative AI-created mood scene: ${e(moment.title)}" loading="${large?'eager':'lazy'}" onerror="this.style.opacity='0'">`;
    const caption=`<span class="vibe-photo-caption"><strong>${e(moment.title)}</strong><small>${e(moment.caption)}</small></span>`;
    if(moment.kind==='meme')return `<div class="vibe-meme-slide">${img}<div class="vibe-meme-overlay"><span>THE SHARED HUMOUR</span><strong>${e(moment.meme||'A little laugh')}</strong></div>${caption}</div>`;
    return `<div class="vibe-photo-slide ${moment.kind==='motion'?'vibe-motion':''}">${img}${moment.kind==='motion'?'<span class="vibe-motion-label">Animated photo preview · not video</span>':''}${caption}</div>`;
  }
  function renderDiscover(){
    if(!store.onboardComplete)store.onboardComplete=true;
    const remaining=activeVibes();
    if(!remaining.length){app.innerHTML=`<div class="wrap app-page"><div class="empty-state"><div class="eyebrow">YOUR FIVE FOR TODAY</div><h2>That's your five <span class="serif">glimpses.</span></h2><p>The real app would offer new interactions and introductions as they become available. These five examples are fictional and local to your browser.</p><button class="btn" data-action="reset-vibes">Replay the demo ↺</button><button class="btn soft" data-route="messages">View demo chats →</button></div></div>`;return;}
    const chosen=activeVibe();store.vibeIndex=chosen.id;
    const media=(store.mediaIndex||0)%4,moment=vibeMoment(chosen,media);
    app.innerHTML=`<section class="discover-stage vibe-discover-refresh page-enter" style="--wash:${chosen.colors[0]};--wash2:${chosen.colors[1]}"><div class="wrap discover-inner"><div class="discover-head"><div><div class="eyebrow">SWIPE ON THE VIBE · NOT THE PERSON</div><h2>Discover the <span class="serif">feeling.</span></h2><p class="tiny">${remaining.length} of 5 fictional introductions remaining · Mood scenes, not someone's photographs.</p></div><button class="btn soft small" data-action="discuss-vibe">Talk it over with My Twin ↗</button></div><div class="vibe-shell"><div class="vibe-media"><button class="vibe-photo-open" data-action="open-vibe-gallery" aria-label="Open four-moment gallery for ${e(chosen.title)}"><div class="vibe-photo-backdrop">${sceneSurface(moment)}</div><span class="vibe-photo-counter">${media+1} / 4 · Click to explore</span><span class="vibe-photo-expand">⤢</span></button><div class="vibe-photo-nav"><button data-action="media-prev" aria-label="Previous mood moment">‹</button><div class="scene-dots">${[0,1,2,3].map(i=>`<span class="${i===media?'active':''}"></span>`).join('')}</div><button data-action="media-next" aria-label="Next mood moment">›</button></div><div class="vibe-photo-note">4 fictional moments · tap the photo to explore</div></div><div class="vibe-info"><div class="vibe-kicker">THE VIBE · INTRODUCTION ${VIBES.indexOf(chosen)+1} / 5</div><h3>${e(chosen.title)}</h3><p class="vibe-description">${e(chosen.subtitle)}</p><div class="vibe-tags">${chosen.tags.map(t=>`<span>${e(t)}</span>`).join('')}</div><div class="section-label">AN ILLUSTRATIVE EXCHANGE</div><div class="mini-transcript"><p><strong>Your twin:</strong> ${e(chosen.exchange[0])}</p><p><strong>Their twin:</strong> ${e(chosen.exchange[1])}</p></div><div class="mutual-why"><strong>Why this might be interesting:</strong> ${e(chosen.why)}<p class="tiny" style="margin-top:8px">A fictional introduction, not a real person's photos or a validated compatibility prediction.</p></div><div class="swipe-actions"><button class="btn white" data-action="vibe-pass">Not my vibe</button><button class="btn" data-action="vibe-like">I'm curious ♥</button></div><button class="small-link vibe-discuss-link" data-action="discuss-vibe">✧ Talk it over with My Twin</button></div></div></div></section>`;
  }
  function renderVibeGallery(){
    const chosen=activeVibe();const index=(store.mediaIndex||0)%4;
    document.getElementById('modal-root').innerHTML=`<div class="modal-scrim vibe-gallery-scrim" data-dismiss="gallery"><section class="vibe-gallery" role="dialog" aria-modal="true" aria-labelledby="vibe-gallery-title"><div class="vibe-gallery-header"><div><div class="eyebrow">FICTIONAL SHARED MOMENTS · NOT PERSON PHOTOS</div><h2 id="vibe-gallery-title">${e(chosen.title)}</h2></div><button class="modal-x" data-action="close-vibe-gallery" aria-label="Close gallery">×</button></div><div class="vibe-gallery-stage" data-gallery-swipe="1"><button class="vibe-gallery-arrow prev" data-action="gallery-prev" aria-label="Previous scene">‹</button>${sceneSurface(vibeMoment(chosen,index),true)}<button class="vibe-gallery-arrow next" data-action="gallery-next" aria-label="Next scene">›</button><span class="vibe-gallery-count">${index+1} / 4</span></div><div class="vibe-gallery-thumbs">${[0,1,2,3].map(i=>`<button class="${i===index?'active':''}" data-action="gallery-jump" data-index="${i}" aria-label="Open moment ${i+1}: ${e(vibeMoment(chosen,i).title)}"><img src="${e(vibeMoment(chosen,i).src)}" alt=""><span>${['Scene','Scene','Motion','Meme'][i]}</span></button>`).join('')}</div><p class="tiny vibe-gallery-disclaimer">These represent a possible experience, not events that happened or genuine candidate information. The moving preview uses photo animation, not video.</p><div class="vibe-gallery-actions"><button class="btn outline small" data-action="close-vibe-gallery">Back to vibe</button><button class="btn small" data-action="gallery-discuss">Talk it over with My Twin ↗</button></div></section></div>`;
    galleryOpen=true;
  }
  function shiftGallery(step){store.mediaIndex=((Number(store.mediaIndex)||0)+step+4)%4;save();renderDiscover();if(galleryOpen)renderVibeGallery();}
  function discussVibe(){
    const chosen=activeVibe();
    const prompt=`I want to talk about a fictional Be-You vibe I just saw: "${chosen.title}". Its premise is: ${chosen.subtitle} I know this is a demo rather than a real match. Can we talk about which parts of this shared experience would actually appeal to me, and why?`;
    galleryOpen=false;document.getElementById('modal-root').innerHTML='';
    setRoute('twin');
    const input=document.getElementById('twin-text');if(input){input.value=prompt;input.focus();}
    if(LOCAL&&!backendState?.started&&store.onboardComplete)startTwinBackground();
  }
  function renderMessages(){let selected=VIBES.find(v=>v.id===selectedInbox)||VIBES.find(v=>store.likes[v.id]==='like')||VIBES[0];let incoming=VIBES.filter(v=>store.likes[v.id]==='like');const history=store.demoMessages[selected.id]||[];app.innerHTML=`<div class="wrap app-page page-enter"><div class="page-head"><div><div class="eyebrow">REAL CONNECTIONS WOULD BEGIN HERE</div><h2>Messages<span class="serif">.</span></h2><p>My Twin stays available, but the real conversation belongs to you.</p></div><button class="btn soft small" data-route="twin">Open My Twin ↗</button></div><div class="demo-banner">These conversations are fictional, local-only mockups. No other person receives your messages, and there is no real matching or messaging service yet.</div><div class="inbox-grid"><div class="surface inbox-list"><div style="padding:19px 18px 9px"><div class="section-label">YOUR CONVERSATIONS</div></div><button class="inbox-item ${selectedInbox==='twin'?'active':''}" data-action="inbox" data-id="twin"><strong>✦ My Twin</strong><span>Your companion stays here.</span></button>${incoming.length?incoming.map(v=>`<button class="inbox-item ${selected.id===v.id?'active':''}" data-action="inbox" data-id="${v.id}"><strong>✧ ${e(v.title)}</strong><span>Fictional mutual-interest example</span></button>`).join(''):`<div style="padding:20px"><p class="tiny">No demo introductions selected yet. Explore Discover and choose one that intrigues you.</p><button class="btn soft small" data-route="discover">Discover examples ↗</button></div>`}</div><div class="surface chat-shell"><div class="chat-head"><div class="twin-avatar">${selectedInbox==='twin'?'✦':'✧'}</div><div><h3>${selectedInbox==='twin'?'My Twin':e(selected.title)}</h3><p>${selectedInbox==='twin'?'Your personal companion':'Fictional chat preview'}</p></div></div>${selectedInbox==='twin'?`<div class="inbox-placeholder"><div><h3>Always here.</h3><p>My Twin is your companion in the main Twin tab. You can talk about the people you're meeting, what you're looking for, and how your day has been.</p><button class="btn" data-route="twin">Talk to My Twin →</button></div></div>`:`<div class="chat-thread" id="chat-thread"><div class="bubble">So apparently our twins have already had a very elaborate imaginary first conversation. Do we start with the easy question or the controversial one? 😄</div>${history.map(m=>`<div class="bubble ${m.mine?'mine':''}">${e(m.text)}</div>`).join('')}</div><form id="demo-message-form" class="compose"><textarea id="demo-message" rows="2" maxlength="2000" placeholder="Write a demo message…"></textarea><button class="btn" type="submit">Send ↗</button></form><div class="chat-tools"><span class="tiny">Scripted mockup; no delivery.</span><button class="small-link" data-route="twin">Ask My Twin about this</button></div>`}</div></div></div>`;const thread=document.getElementById('chat-thread');if(thread)thread.scrollTop=thread.scrollHeight}
  function renderPreferences(){const likes=calibrationToday().filter(r=>r.rating==='like').length,total=calibrationToday().length;const physical=store.physical||{};app.innerHTML=`<div class="wrap app-page page-enter"><div class="page-head"><div><div class="eyebrow">ON YOUR TERMS</div><h2>Preferences & <span class="serif">privacy.</span></h2><p>Your preferences can change. Revisit them without starting your twin over.</p></div><button class="btn soft small" data-route="twin">My Twin ↗</button></div><div class="pref-grid"><section class="pref-block"><div class="section-label">PHYSICAL ATTRACTION</div><h3>What catches your eye?</h3><p>Describe what you enjoy, the flexibility you have, and preferences you want to keep private.</p>${[['appearance','What appeals to you?'],['limits','Hard limits'],['flex','What are you flexible about?'],['expression','What makes attraction grow?']].map(([key,label])=>fields('physical',key,label,'textarea',{placeholder:'Optional, in your own words…'},true)).join('<div style="height:12px"></div>')}<div style="height:18px"></div><button class="btn small" data-action="save-preferences">Save in this browser</button>
  <div class="affection-section"><div class="section-label">AFFECTION & CONNECTION</div><h3>How do you show love—and how do you like to receive it?</h3><p>Choose as many as feel right. They can be different, and they can change. There is no right answer.</p>
  ${affectionControls('give','How I show care','When you care for someone, what do you naturally do?')}
  ${affectionControls('receive','How I like to receive care','What makes you feel valued, comfortable, or loved?')}
  <p class="tiny">Saved privately in this browser. These are preferences, not a psychological label, and are not sent automatically to the local twin.</p></div></section><section class="stack"><section class="pref-block"><div class="section-label">VISUAL LEARNING</div><h3>12 little discoveries each day.</h3><p>Swipe through realistic AI-generated fictional adult portraits to explore your instinctive preferences.</p><div class="pref-stat"><span>Today's examples</span><strong>${total} / 12</strong></div><div class="pref-stat"><span>Marked appealing</span><strong>${likes}</strong></div><div class="pref-stat"><span>What the prototype has learned</span><strong>${e(visualSummary())}</strong></div><button class="btn soft small" data-action="daily-calibration" style="margin-top:15px">${total>=12?'Review tomorrow':'Continue visual calibration'} →</button></section><section class="pref-block"><div class="section-label">MY TWIN MODEL</div><h3>Share preferences deliberately.</h3><p>The browser currently stores appearance preferences separately. Your v3 backend does not yet have a dedicated physical matching module. The daily image selector runs locally in your browser.</p><button class="btn outline small" data-action="share-looks" ${!LOCAL||!backendState?.started?'disabled':''}>Share non-intimate preferences with My Twin</button><p class="tiny" style="margin:12px 0 0">Only sends what you explicitly wrote about attraction, not the optional sexual answers or your image choices.</p></section><section class="pref-block"><div class="section-label">YOUR DATA</div><h3>You are in control.</h3><p>Delete browser answers or erase your local AI history separately. Browser storage is not encrypted and is not anonymous.</p><div class="row" style="flex-wrap:wrap"><button class="danger-btn" data-action="clear-browser">Clear browser prototype</button>${LOCAL?'<button class="danger-btn" data-action="reset-backend">Delete local Twin database</button>':''}</div></section></section></div></div>`}
  async function twinSend(message){if(waiting)return;const msg=normalize(message);if(!msg)return;if(LOCAL){if(!backendState?.started){notice('Connect your local Qwen twin first.');startTwinBackground();return}waiting=true;const status=document.getElementById('twin-status');if(status)status.textContent='My Twin is responding locally…';try{const result=await api('/api/chat',{mode:'twin',message:msg});backendState=result.state;renderTwin()}catch(err){notice('Twin error: '+err.message);renderTwin()}finally{waiting=false}}else{store.demoChats.push({mine:true,text:msg});store.demoChats.push({mine:false,text:'This is the scripted public demo, not an AI reply. Run Start_Local.bat with Ollama to talk to your real Be-You twin.'});save();renderTwin()}}
  function rateCalibration(rating){
    if(!['like','pass','unsure'].includes(rating))return;
    const candidate=activeVisualCandidate();if(!candidate)return;
    const draft=store.photoDrafts[candidate.id]||{tags:[],note:''};
    store.ratings.push({source:'synthetic-photo',date:today(),candidate:candidate.id,rating,tags:(draft.tags||[]).slice(0,8),note:first(normalize(draft.note),240),attributes:{hair:candidate.hair,face:candidate.face,style:candidate.style,presentation:candidate.presentation}});
    delete store.photoDrafts[candidate.id];
    save();renderOnboard();
  }
  function flagVibe(status){const chosen=VIBES.find(v=>v.id===String(store.vibeIndex))||activeVibes()[0];if(!chosen)return;store.likes[chosen.id]=status;if(status==='like')selectedInbox=chosen.id;const next=activeVibes()[0];store.vibeIndex=next?.id||chosen.id;store.mediaIndex=0;save();renderDiscover();notice(status==='like'?'Saved as an interesting fictional vibe.':'Passed on this fictional vibe.')}
  async function savePreview(i,approve=false){const s=SCENARIOS[i];if(!s)return;const correction=normalize(store.previewNotes[i]);if(!approve&&!correction){notice('Write what you would say, or choose Close enough.');return}store.previewDone[i]=true;save();renderStudio();if(LOCAL&&backendState?.started&&!approve){if(!confirm('Send this correction to your private local My Twin, so it can learn from it?'))return;try{const context=`In a fictional virtual-date scenario, another person says ${s.other}. I would actually respond: ${correction}. This is my own preferred response to that situation, not an AI-generated suggestion.`;await api('/api/chat',{mode:'twin',message:context});backendState=await api('/api/state');notice('Your correction was sent to the local twin.')}catch(err){notice('Saved in browser; local AI update failed: '+err.message)}}else notice('Feedback saved in this browser. No real matching was performed.')}
  function showPrivacyModal(){document.getElementById('modal-root').innerHTML=`<div class="modal-scrim" data-dismiss="privacy"><section class="privacy-modal" role="dialog" aria-modal="true" aria-labelledby="privacy-title"><div class="row spread"><span class="eyebrow">YOUR DATA</span><button class="modal-x" data-action="close-modal" aria-label="Close">×</button></div><h2 id="privacy-title">Private by design starts with honesty.</h2><p>This is a prototype—not a production dating service. You can inspect and erase its data.</p><ul><li>Public GitHub Pages: no working AI, real matching, or message delivery. Drafts and demo choices are stored in <strong>your browser's localStorage</strong>.</li><li>Local version: only messages you explicitly send to the AI backend are stored by v3 in an <strong>unencrypted SQLite database</strong> on this computer.</li><li>Optional sexual compatibility answers are not sent to Qwen by this frontend, and must be explicitly opted into before browser storage. The visual calibration uses fictional AI-generated adults; there is no live photo generation or facial-analysis service.</li><li>These data are <strong>not anonymous</strong>. Do not use a shared browser for sensitive data.</li><li>Future real matching requires accounts, privacy controls, consent, secure servers, independent authorization and robust image generation.</li></ul><button class="btn" data-action="close-modal">Understood</button></section></div>`}
  async function deleteBackend(){if(!LOCAL)return;if(!confirm('Permanently delete your LOCAL Qwen twin database and its portrait? This cannot be undone.'))return;try{const r=await api('/api/reset',{confirm:'DELETE'});backendState=r.state;notice('Local twin data deleted.');render()}catch(err){notice('Could not reset: '+err.message)}}
  function clearBrowser(){if(!confirm('Clear all this browser’s Be-You prototype answers and demo choices? This does not delete the separate local AI database.'))return;localStorage.removeItem(KEY);store=makeDefaults();route='home';backendError='';notice('Browser prototype cleared.');render()}
  async function refreshPortrait(){if(!LOCAL){notice('Only the local Qwen backend can build a real portrait.');return}if(!backendState?.started){await startTwinBackground();return}if(waiting)return;waiting=true;notice('Updating your local personal model…');try{const r=await api('/api/refresh',{});backendState=r.state;showPortrait=true;renderTwin()}catch(err){notice('Model update error: '+err.message)}finally{waiting=false}}
  async function loadBackend(){if(!LOCAL)return;try{backendState=await api('/api/state');backendError='';if(route==='twin')renderTwin();else if(route==='home')renderHome()}catch(err){backendError=err.message;}}
  document.addEventListener('click',async ev=>{
    const dismiss=ev.target.closest('[data-dismiss]');if(dismiss&&ev.target===dismiss){galleryOpen=false;document.getElementById('modal-root').innerHTML='';return}
    const btn=ev.target.closest('[data-action],[data-route]');if(!btn||btn.disabled)return;
    const action=btn.dataset.action;const target=btn.dataset.route;
    if(target){setRoute(target);if(target==='twin'&&LOCAL&&!backendState?.started&&store.onboardComplete)startTwinBackground();return}
    if(action==='intro'){showIntro();return}if(action==='resume-twin'){store.onboardComplete=true;save();setRoute('twin');return}if(action==='preview-discover'){store.onboardComplete=true;save();setRoute('discover');return}
    if(action==='accept-consent'){if(!document.getElementById('consent-gate-check')?.checked)return;store.consentAcknowledged=true;save();const intended=consentTarget||'twin';consentTarget=null;document.getElementById('modal-root').innerHTML='';setRoute(intended);return;}
    if(action==='close-vibe-gallery'){galleryOpen=false;document.getElementById('modal-root').innerHTML='';return;}
    if(action==='open-vibe-gallery'){renderVibeGallery();return;}
    if(action==='gallery-prev'||action==='gallery-next'){shiftGallery(action==='gallery-next'?1:-1);return;}
    if(action==='gallery-jump'){store.mediaIndex=Math.max(0,Math.min(3,Number(btn.dataset.index)||0));save();renderDiscover();renderVibeGallery();return;}
    if(action==='discuss-vibe'||action==='gallery-discuss'){discussVibe();return;}
    if(action==='close-modal'){document.getElementById('modal-root').innerHTML='';return}
    if(action==='intro-next'){if(introIndex<originalSlides.length-1){introIndex++;renderIntro()}else{document.getElementById('modal-root').innerHTML='';store.stage=0;save();setRoute('onboard')}return}
    if(action==='intro-back'){introIndex=Math.max(0,introIndex-1);renderIntro();return}
    if(action==='step-next'){advanceStep();return}if(action==='step-back'){store.stage=Math.max(0,store.stage-1);save();renderOnboard();return}
    if(action==='rate'){rateCalibration(btn.dataset.rating);return}if(action==='skip-calib'||action==='complete-onboard'){completeOnboard();return}
    if(action==='daily-calibration'){store.stage=3;setRoute('onboard');return}
    if(action==='clear-adult'){store.adult={};store.adultConsent=false;save();renderOnboard();notice('Optional intimate answers cleared.');return}
    if(action==='affection-toggle'){
      const side=btn.dataset.side,tag=btn.dataset.tag;
      if(!['give','receive'].includes(side)||!AFFECTION_STYLES.some(([id])=>id===tag))return;
      const values=new Set(store.affection[side]||[]);
      values.has(tag)?values.delete(tag):values.add(tag);
      store.affection[side]=[...values];save();
      btn.classList.toggle('selected',values.has(tag));
      btn.setAttribute('aria-pressed',String(values.has(tag)));
      return;
    }
    if(action==='toggle-photo-tag'){const photo=activeVisualCandidate();if(!photo)return;const tag=btn.dataset.tag;if(!PHOTO_FEEDBACK_TAGS.some(([id])=>id===tag))return;const draft=store.photoDrafts[photo.id]||{tags:[],note:''};const tags=new Set(draft.tags||[]);tags.has(tag)?tags.delete(tag):tags.add(tag);draft.tags=[...tags];store.photoDrafts[photo.id]=draft;save();btn.classList.toggle('selected',tags.has(tag));btn.setAttribute('aria-pressed',String(tags.has(tag)));return}
    if(action==='studio-skip-countdown'){store.studioStartedAt=Date.now()-STUDIO_DEMO_LENGTH_MS;save();studioDemoTick();notice('Fictional Discover examples are available.');return}
    if(action==='studio-no'){store.previewDone[studioIndex]=true;store.previewJudgments[studioIndex]='no';save();studioIndex=(studioIndex+1)%3;studioEditing=false;renderStudio();notice('Thanks! Your twin did not represent you in that response.');return}
    if(action==='studio-next'||action==='studio-prev'||action==='studio-jump'){studioIndex=action==='studio-jump'?Math.min(2,Math.max(0,Number(btn.dataset.index)||0)):(studioIndex+(action==='studio-next'?1:2))%3;studioEditing=false;renderStudio();return}
    if(action==='studio-edit'){studioEditing=true;renderStudio();document.getElementById('studio-editor-text')?.focus();return}
    if(action==='studio-cancel'){studioEditing=false;renderStudio();return}
    if(action==='studio-yes'){store.previewJudgments[studioIndex]='yes';save();await savePreview(studioIndex,true);studioEditing=false;studioIndex=(studioIndex+1)%3;renderStudio();return}
    if(action==='studio-save'){if(!normalize(store.previewNotes[studioIndex])){notice('Write your response first, or choose Sounds like me.');document.getElementById('studio-editor-text')?.focus();return}store.previewJudgments[studioIndex]='edit';save();await savePreview(studioIndex,false);studioEditing=false;studioIndex=(studioIndex+1)%3;renderStudio();return}
    if(action==='preview-approve'){savePreview(Number(btn.dataset.previewId),true);return}
    if(action==='preview-save'){await savePreview(Number(btn.dataset.previewId),false);return}
    if(action==='open-studio'){setRoute('studio');return}
    if(action==='daily'){if(!LOCAL){notice('Daily AI questions are available on your local v3 backend.');return}if(!backendState?.started){startTwinBackground();return}if(waiting)return;waiting=true;try{const r=await api('/api/daily',{});backendState=r.state;renderTwin()}catch(err){notice('Could not load daily questions: '+err.message)}finally{waiting=false}return}
    if(action==='ask-pattern'){if(backendState?.started){const t=document.getElementById('twin-text');if(t){t.value='What have you started to understand about me, and what are you still unsure about?';t.focus()}}else notice('Connect your local twin to inspect its real understanding.');return}
    if(action==='suggest-date'){const t=document.getElementById('twin-text');if(t){t.value='I want to talk about someone I met or a dating experience. Can we discuss it?';t.focus()}return}
    if(action==='edit-looks'){setRoute('preferences');return}
    if(action==='toggle-portrait'){showPortrait=!showPortrait;renderTwin();return}
    if(action==='refresh-portrait'){await refreshPortrait();return}
    if(action==='media-prev'||action==='media-next'){shiftGallery(action==='media-next'?1:-1);return}
    if(action==='vibe-pass'||action==='vibe-like'){galleryOpen=false;flagVibe(action==='vibe-like'?'like':'pass');return}
    if(action==='reset-vibes'){store.likes={};store.mediaIndex=0;store.vibeIndex='1';save();renderDiscover();return}
    if(action==='inbox'){selectedInbox=btn.dataset.id;renderMessages();return}
    if(action==='save-preferences'){save();notice('Appearance preferences saved in this browser.');return}
    if(action==='share-looks'){if(!LOCAL||!backendState?.started)return;const p=store.physical;const lines=[['Attraction',p.appearance],['Hard limits',p.limits],['Flexibility',p.flex],['What grows attraction',p.expression]].filter(x=>normalize(x[1])).map(x=>`${x[0]}: ${x[1]}`);if(!lines.length){notice('Describe some preferences first.');return}if(!confirm('Send these NON-INTIMATE preferences to your private local AI twin for modelling?'))return;try{await api('/api/chat',{mode:'twin',message:'I want you to remember these voluntarily shared attraction preferences as preferences, NOT personality diagnoses:\n'+lines.join('\n')});backendState=await api('/api/state');notice('Sent explicitly to your local Twin.')}catch(err){notice(err.message)}return}
    if(action==='clear-browser'){clearBrowser();return}if(action==='reset-backend'){await deleteBackend();return}
  });
  document.addEventListener('input',ev=>{const el=ev.target;if(el.matches('[data-group][name]')){const group=el.dataset.group,key=el.name;if(group==='adult'&&!store.adultConsent)return;store[group][key]=el.value;save()}if(el.matches('[data-preview]')){store.previewNotes[el.dataset.preview]=el.value;save()}if(el.matches('[data-photo-note]')){const key=el.dataset.photoNote;const draft=store.photoDrafts[key]||{tags:[],note:''};draft.note=el.value.slice(0,240);store.photoDrafts[key]=draft;save()}});
  document.addEventListener('change',ev=>{const el=ev.target;if(el.matches('[data-group][name]')){if(el.dataset.group==='adult'&&!store.adultConsent)return;store[el.dataset.group][el.name]=el.value;save()}if(el.id==='focus-select'){store.focus=el.value;save();renderOnboard()}    if(el.id==='consent-ack'){store.consentAcknowledged=el.checked;save();}
    if(el.id==='consent-gate-check'){const b=document.getElementById('consent-gate-continue');if(b)b.disabled=!el.checked;}
if(el.id==='adult-consent'){store.adultConsent=el.checked;store.adultOpen=true;if(!el.checked)store.adult={};save();renderOnboard()}if(el.id==='adult-details'){store.adultOpen=el.open;save()}});
  document.addEventListener('submit',async ev=>{if(ev.target.id==='twin-form'){ev.preventDefault();const input=document.getElementById('twin-text');const msg=input?.value||'';if(input)input.value='';await twinSend(msg)}if(ev.target.id==='demo-message-form'){ev.preventDefault();const input=document.getElementById('demo-message');const text=normalize(input?.value);if(!text)return;if(selectedInbox==='twin'){setRoute('twin');return}const arr=store.demoMessages[selectedInbox]||[];arr.push({mine:true,text:first(text,2000)});arr.push({mine:false,text:'This is just a fictional chat preview. In the real app, this space would connect two people only after mutual consent.'});store.demoMessages[selectedInbox]=arr;save();renderMessages()}});
  document.addEventListener('keydown',ev=>{
    if(galleryOpen){if(ev.key==='Escape'){ev.preventDefault();galleryOpen=false;document.getElementById('modal-root').innerHTML='';return;}if(ev.key==='ArrowRight'||ev.key==='ArrowLeft'){ev.preventDefault();shiftGallery(ev.key==='ArrowRight'?1:-1);return;}}if(ev.key==='Escape'&&document.querySelector('.modal-scrim')){document.getElementById('modal-root').innerHTML='';return}if(ev.key==='Enter'&&!ev.shiftKey&&ev.target.id==='twin-text'){ev.preventDefault();ev.target.closest('form')?.requestSubmit()}});
  // Image failures are visible instead of appearing as a blank swipe card.
  document.addEventListener('error',ev=>{
    const img=ev.target;if(!img.matches?.('.visual-swipe-card img'))return;
    img.closest('.visual-swipe-card')?.querySelector('.photo-asset-error')?.removeAttribute('hidden');
  },true);
  // Review the fictional chat log with swipe gestures; no AI guesses become source evidence.
  let studioGesture=null;
  document.addEventListener('pointerdown',ev=>{const card=ev.target.closest('.studio-log-card');if(!card||route!=='studio'||ev.target.closest('button,textarea,input'))return;studioGesture={id:ev.pointerId,x:ev.clientX,y:ev.clientY};});
  document.addEventListener('pointerup',ev=>{if(!studioGesture||studioGesture.id!==ev.pointerId)return;const dx=ev.clientX-studioGesture.x,dy=ev.clientY-studioGesture.y;studioGesture=null;if(Math.abs(dx)<95||Math.abs(dy)>Math.abs(dx))return;if(dx<0){store.previewDone[studioIndex]=true;store.previewJudgments[studioIndex]='no';save();studioIndex=(studioIndex+1)%3;studioEditing=false;renderStudio();}
    else{store.previewJudgments[studioIndex]='yes';save();savePreview(studioIndex,true).then(()=>{if(route==='studio'){studioIndex=(studioIndex+1)%3;studioEditing=false;renderStudio();}});}});
  document.addEventListener('pointercancel',()=>{studioGesture=null;});
  // Horizontal touch/mouse gestures only on the calibration portrait; vertical page scroll still works.
  let gesture=null;
  document.addEventListener('pointerdown',ev=>{
    const card=ev.target.closest('.visual-swipe-card');if(!card||route!=='onboard'||store.stage!==3)return;
    gesture={id:ev.pointerId,startX:ev.clientX,startY:ev.clientY,card};
  });
  document.addEventListener('pointermove',ev=>{
    if(!gesture||gesture.id!==ev.pointerId||!gesture.card.isConnected)return;
    const dx=ev.clientX-gesture.startX,dy=ev.clientY-gesture.startY;
    if(Math.abs(dx)>Math.abs(dy)*1.3){const move=Math.max(-110,Math.min(110,dx));gesture.card.style.transform=`translateX(${move}px) rotate(${move/22}deg)`;}
  });
  document.addEventListener('pointerup',ev=>{
    if(!gesture||gesture.id!==ev.pointerId)return;
    const dx=ev.clientX-gesture.startX,dy=ev.clientY-gesture.startY;
    if(gesture.card.isConnected)gesture.card.style.transform='';gesture=null;
    if(Math.abs(dx)>75&&Math.abs(dx)>Math.abs(dy)*1.3)rateCalibration(dx>0?'like':'pass');
  });
  document.addEventListener('pointercancel',()=>{if(gesture?.card?.isConnected)gesture.card.style.transform='';gesture=null;});
  document.addEventListener('keydown',ev=>{
    if(!ev.target.matches('.visual-swipe-card'))return;
    if(ev.key==='ArrowLeft'){ev.preventDefault();rateCalibration('pass')}
    if(ev.key==='ArrowRight'){ev.preventDefault();rateCalibration('like')}
  });
  let galleryGesture=null;
  document.addEventListener('pointerdown',ev=>{const surface=ev.target.closest('[data-gallery-swipe]');if(!surface)return;galleryGesture={x:ev.clientX,y:ev.clientY,at:Date.now()};});
  document.addEventListener('pointerup',ev=>{if(!galleryGesture||!galleryOpen)return;const dx=ev.clientX-galleryGesture.x,dy=ev.clientY-galleryGesture.y;galleryGesture=null;if(Math.abs(dx)>55&&Math.abs(dx)>Math.abs(dy)*1.2){shiftGallery(dx<0?1:-1);}});
  document.getElementById('privacy-button').addEventListener('click',showPrivacyModal);
  render();loadBackend();
})();
