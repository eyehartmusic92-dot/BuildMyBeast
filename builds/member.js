(async function(){
 const slug=new URLSearchParams(location.search).get('build'),status=document.getElementById('memberStatus'),content=document.getElementById('memberContent');
 if(!/^member-[a-z0-9]{1,40}$/.test(slug||'')){status.textContent='Choose a member build from the gallery.';return}
 try{
  const endpoint=new URL(window.BMB_GALLERY_CONFIG.uploadEndpoint);endpoint.pathname='/approved';endpoint.search='';endpoint.hash='';
  const response=await fetch(endpoint.href,{signal:AbortSignal.timeout(8000)});if(!response.ok)throw Error('feed');
  const rows=await response.json();if(!Array.isArray(rows))throw Error('format');
  const row=rows.find(item=>item.slug===slug);if(!row){status.textContent='This build is unavailable or has not been approved.';return}
  const image=new URL(row.imageUrl);if(image.protocol!=='https:'||image.hostname!=='res.cloudinary.com'||!image.pathname.startsWith('/yfpthneq/image/upload/'))throw Error('image');
  document.getElementById('memberTitle').textContent=String(row.title).slice(0,90);
  document.getElementById('memberVehicle').textContent=String(row.vehicle).slice(0,100);
  document.getElementById('memberMods').textContent=String(row.mods||'').slice(0,600);
  document.getElementById('memberPhoto').src=image.href.replace('/image/upload/','/image/upload/f_auto,q_auto,w_1400/');
  document.getElementById('memberPhoto').alt=row.title+' — '+row.vehicle;
  const photos=document.getElementById('memberPhotos');for(const value of (Array.isArray(row.photos)?row.photos:[]).slice(0,2)){let extra;try{extra=new URL(value)}catch(e){continue}if(extra.protocol!=='https:'||extra.hostname!=='res.cloudinary.com'||!extra.pathname.startsWith('/yfpthneq/image/upload/'))continue;const img=document.createElement('img');img.className='photo';img.loading='lazy';img.src=extra.href.replace('/image/upload/','/image/upload/f_auto,q_auto,w_1400/');img.alt=row.title+' — additional approved view';photos.append(img)}
  document.getElementById('memberPlanner').href='/?build='+encodeURIComponent(slug)+'#gallery';
  document.title=row.title+' · '+row.vehicle+' | BuildMyBeast';
  document.querySelector('link[rel="canonical"]').href=location.origin+location.pathname+'?build='+encodeURIComponent(slug);
  status.hidden=true;content.hidden=false;
 }catch(e){status.textContent='This member build could not load. Please try again or return to the gallery.'}
})();
