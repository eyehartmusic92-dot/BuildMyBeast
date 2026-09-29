(function(){
 'use strict';
 const track=(name,data)=>{if(window.bmbTrack)window.bmbTrack(name,data||{})};
 document.addEventListener('click',event=>{
  const link=event.target.closest('a[data-track]');
  if(link)track(link.dataset.track);
 });
 document.addEventListener('submit',event=>{
  if(event.target.closest('.kit-signup'))track('newsletter_signup_attempt',{placement:event.target.closest('#buildAlerts')?'planner':'footer'});
 });
 let startTracked=false;
 document.getElementById('builder').addEventListener('change',event=>{
  if(!startTracked&&event.target.matches('select,input')){startTracked=true;track('planner_started')}
 });
 const feed=document.getElementById('galleryFeed');
 const filter=document.createElement('div');
 filter.className='fields';
 filter.innerHTML='<div><label for="galleryVehicleFilter">Vehicle make</label><select id="galleryVehicleFilter"><option value="">All vehicles</option></select></div><div><label for="galleryMemberFilter">Photo type</label><select id="galleryMemberFilter"><option value="">Real builds + sample ideas</option><option value="member">Member builds only</option><option value="sample">Sample ideas only</option></select></div>';
 feed.before(filter);
 const make=document.getElementById('galleryVehicleFilter'),kind=document.getElementById('galleryMemberFilter');
 const originalUpdate=window.updateGallery;
 window.updateGallery=function(){
  originalUpdate();
  let count=0;
  feed.querySelectorAll('.community-build').forEach(card=>{
   const member=card.classList.contains('gallery-photo-card');
   if((make.value&&!card.textContent.toLowerCase().includes(make.value.toLowerCase()))||(kind.value==='member'&&!member)||(kind.value==='sample'&&member))card.style.display='none';
   if(card.style.display!=='none')count++;
  });
  document.getElementById('galleryCount').textContent=count+(count===1?' gallery item':' gallery items');
 };
 [make,kind].forEach(select=>select.addEventListener('change',()=>{window.updateGallery();track('gallery_vehicle_filter',{make:make.value,photo_type:kind.value})}));
 const makes=['Chevrolet','GMC','Ford','Ram','Dodge','Nissan','Toyota','Honda','Jeep','Harley-Davidson','Yamaha','Kawasaki','Suzuki','BMW'];
 makes.forEach(name=>{const option=document.createElement('option');option.value=name;option.textContent=name;make.append(option)});
 new MutationObserver(()=>window.updateGallery()).observe(feed,{childList:true});
 const links=document.createElement('div');links.className='actions';
 links.innerHTML='<a class="btn ghost" href="builds/" data-track="member_build_directory_open">Explore Member Build Pages →</a><a class="btn ghost" href="resources/build-workbook.html" data-track="workbook_open">Free Project Workbook →</a>';
 feed.after(links);
 const first=document.querySelector('.howstrip');
 if(first){
  const featured=document.createElement('div');featured.className='planbox';featured.style.marginBottom='28px';
  featured.innerHTML='<div class="eyebrow">Featured member build</div><h2>BDK · 2007 Chevrolet Tahoe</h2><p class="mini">26-inch wheels, window tint, refreshed headlights and taillights, Texas Edition trim, and three Memphis subs in a custom ported box.</p><div class="actions"><a class="btn" href="builds/bdk.html" data-track="featured_build_open">Explore BDK →</a><a class="btn ghost" href="#submitBuild">Share Your Own Build</a></div>';
  first.after(featured);
 }
 const compare=document.getElementById('garageComparison');
 if(compare)new MutationObserver(()=>{
  // Track only complete comparisons and only once per selection pair.
  const a=document.getElementById('compareBuildA').value,b=document.getElementById('compareBuildB').value;
  const key=a+'|'+b;
  if(a&&b&&a!==b&&compare.querySelector('table')&&compare.dataset.tracked!==key){compare.dataset.tracked=key;track('garage_builds_compared')}
 }).observe(compare,{childList:true});
})();
