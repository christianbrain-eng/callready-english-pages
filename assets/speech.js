(() => {
 'use strict';
 const buttons=[...document.querySelectorAll('.speech-play')];
 const status=document.querySelector('#speech-status');
 const names={en:'영어',ja:'일본어',fr:'프랑스어'};
 const locales={en:'en-US',ja:'ja-JP',fr:'fr-FR'};
 const supported='speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
 let active=null,utterance=null;
 function reset(){if(active){active.textContent='▶ '+names[active.dataset.speechLang]+' 듣기';active.setAttribute('aria-pressed','false')}active=null;utterance=null;}
 function stop(){reset();if(supported)window.speechSynthesis.cancel();}
 function voices(){return window.speechSynthesis.getVoices();}
 if(!supported){buttons.forEach(b=>{b.disabled=true;b.title='이 브라우저는 문장 읽기를 지원하지 않습니다.'});status.textContent='문장 읽기를 지원하는 Chrome 또는 Safari에서 열어 주세요.';return;}
 voices();window.speechSynthesis.addEventListener('voiceschanged',voices);
 buttons.forEach(button=>button.addEventListener('click',()=>{
  if(active===button){stop();status.textContent='재생을 중지했습니다.';return;}
  stop();
  const lang=button.dataset.speechLang;
  const text=button.parentElement.querySelector('p[lang]').textContent.trim();
  const voiceList=voices();
  const voice=voiceList.find(v=>v.lang.toLowerCase()===locales[lang].toLowerCase()) || voiceList.find(v=>v.lang.toLowerCase().split('-')[0]===lang);
  if(voiceList.length && !voice){status.textContent=names[lang]+' 음성이 없습니다. 기기의 음성 설정에서 해당 언어를 추가해 주세요.';return;}
  const speech=new window.SpeechSynthesisUtterance(text);
  speech.lang=locales[lang];if(voice)speech.voice=voice;speech.rate=0.9;
  active=button;utterance=speech;
  button.textContent='■ '+names[lang]+' 중지';button.setAttribute('aria-pressed','true');
  status.textContent=names[lang]+' 문장을 재생합니다.';
  speech.onend=()=>{if(utterance!==speech)return;reset();status.textContent='재생을 마쳤습니다.';};
  speech.onerror=event=>{if(utterance!==speech)return;reset();status.textContent=event.error==='canceled'||event.error==='interrupted'?'재생을 중지했습니다.':names[lang]+' 음성을 재생할 수 없습니다. 기기의 음성 설정을 확인해 주세요.';};
  try{window.speechSynthesis.speak(speech)}catch{reset();status.textContent='문장을 재생할 수 없습니다. 잠시 후 다시 눌러 주세요.';}
 }));
 const observer=new MutationObserver(()=>{if(active && active.closest('[role="tabpanel"]').hidden){stop();status.textContent='재생을 중지했습니다.';}});
 document.querySelectorAll('[role="tabpanel"]').forEach(p=>observer.observe(p,{attributes:true,attributeFilter:['hidden']}));
 addEventListener('pagehide',stop);
})();
