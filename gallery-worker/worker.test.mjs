import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import worker from './worker.mjs';
const env={ALLOWED_ORIGIN:'https://buildmybeast.com',CLOUD_NAME:'example',CLOUD_API_KEY:'key',CLOUD_API_SECRET:'secret',CLOUD_SIGNED_PRESET:'review',TURNSTILE_SECRET:'turnstile',UPLOAD_RATE:{limit:async()=>({success:true})},GLOBAL_RATE:{limit:async()=>({success:true})}};
const photo=()=>new File([Uint8Array.from([255,216,255,...Array(120).fill(0)])],'photo.jpg',{type:'image/jpeg'});
function request(count=1,bad=false){const form=new FormData();for(const [k,v] of Object.entries({title:'Tahoe',vehicle:'2007 Chevrolet Tahoe',category:'street',mods:'Wheels and audio',turnstile:'token'}))form.set(k,v);for(let i=0;i<count;i++)form.append('file',bad&&i===count-1?new File([Array(123).fill('x').join('')],'bad.jpg',{type:'image/jpeg'}):photo());return new Request('https://worker.example/upload',{method:'POST',body:form,headers:{Origin:env.ALLOWED_ORIGIN}})}
const original=globalThis.fetch;let uploads=[],verifications=0,failAt=0;
globalThis.fetch=async(url,options)=>{
 if(url.includes('siteverify')){verifications++;return Response.json({success:true,hostname:'buildmybeast.com'})}
 const body=options.body,signed='context='+body.get('context')+'&moderation=manual&timestamp='+body.get('timestamp')+'&upload_preset='+body.get('upload_preset');
 assert.equal(body.get('signature'),createHash('sha1').update(signed+env.CLOUD_API_SECRET).digest('hex'));assert.equal(body.get('moderation'),'manual');uploads.push(body.get('context'));if(failAt===uploads.length)return new Response('',{status:500});return Response.json({public_id:'pending/'+uploads.length});
};
try{
 assert.equal((await worker.fetch(request(),env)).status,202);assert.equal(uploads.length,1);assert.equal(verifications,1);
 uploads=[];verifications=0;assert.equal((await worker.fetch(request(3),env)).status,202);assert.equal(uploads.length,3);assert.equal(verifications,1);assert(uploads[0].includes('album_role=detail'));assert(uploads[2].includes('album_role=cover'));
 const album=uploads[0].match(/album=([^|]+)/)[1];assert(uploads.every(x=>x.includes('album='+album)));
 uploads=[];verifications=0;assert.equal((await worker.fetch(request(4),env)).status,400);assert.equal(uploads.length,0);
 assert.equal((await worker.fetch(request(2,true),env)).status,400);assert.equal(verifications,0);
 assert.equal((await worker.fetch(new Request('https://worker.example/upload',{method:'POST',headers:{Origin:'https://evil.example'}}),env)).status,403);
 assert.equal((await worker.fetch(request(),{...env,UPLOAD_RATE:{limit:async()=>({success:false})}})).status,429);
 uploads=[];failAt=1;assert.equal((await worker.fetch(request(3),env)).status,502);assert.equal(uploads.length,1);assert(!uploads.some(x=>x.includes('album_role=cover')));failAt=0;
 const asset=(id,role,status='approved',album='11111111-1111-4111-8111-111111111111')=>({asset_id:id,public_id:id,resource_type:'image',type:'upload',moderation_status:status,moderation_kind:'manual',secure_url:'https://res.cloudinary.com/example/image/upload/'+id+'.jpg',context:{custom:{title:'Tahoe',vehicle:'2007 Chevrolet Tahoe',category:'street',mods:'Wheels and audio',album,album_role:role,album_order:role==='cover'?'0':'1'}}});
 globalThis.fetch=async()=>Response.json({resources:[asset('cover','cover'),asset('approved-detail','detail'),asset('pending-detail','detail','pending'),asset('rejected-detail','detail','rejected'),asset('orphan','detail','approved','22222222-2222-4222-8222-222222222222'),asset('legacy','', 'approved','')]});
 const result=await worker.fetch(new Request('https://worker.example/approved',{headers:{Origin:env.ALLOWED_ORIGIN}}),env),rows=await result.json();
 assert.equal(result.status,200);assert.equal(rows.length,2);assert.deepEqual(rows[0].photos,['https://res.cloudinary.com/example/image/upload/approved-detail.jpg']);assert(!JSON.stringify(rows).includes('pending-detail'));assert(!JSON.stringify(rows).includes('rejected-detail'));assert(!JSON.stringify(rows).includes('orphan'));assert(!JSON.stringify(rows).includes('album_role'));
 const capabilities=await worker.fetch(new Request('https://worker.example/capabilities',{headers:{Origin:env.ALLOWED_ORIGIN}}),env);assert.equal((await capabilities.json()).maxPhotos,3);
 console.log('PASS: legacy upload, three-photo album, signatures/manual moderation, invalid format/count, origin/rate gates, partial failure, approved-only grouping, capabilities');
}finally{globalThis.fetch=original}
