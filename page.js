(function(){
 const track=(event,data)=>{if(typeof gtag==='function')gtag('event',event,data||{})};
 document.querySelectorAll('[data-copy]').forEach(button=>button.addEventListener('click',async()=>{
  const url=document.querySelector('link[rel="canonical"]').href;
  try{await navigator.clipboard.writeText(url);button.textContent='Link Copied';track('member_build_link_copy',{build_path:location.pathname})}catch(e){window.prompt('Copy this build link:',url)}
 }));
 document.querySelectorAll('[data-share]').forEach(button=>button.addEventListener('click',async()=>{
  const url=document.querySelector('link[rel="canonical"]').href;
  try{if(navigator.share)await navigator.share({title:document.title,url});else{await navigator.clipboard.writeText(url);button.textContent='Link Copied'}track('member_build_share',{build_path:location.pathname})}catch(e){if(e.name!=='AbortError')window.prompt('Copy this build link:',url)}
 }));
 document.addEventListener('click',event=>{const link=event.target.closest('[data-event]');if(link)track(link.dataset.event,{page_path:location.pathname})});
})();
