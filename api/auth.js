import {publicDb,privateDb,send,authenticatedUser,clean} from './_lib.js';
export default async function handler(req,res){const action=String(req.query.action||'');try{
if(action==='logout')return send(res,200,{ok:true});
if(action==='me'){const u=await authenticatedUser(req);if(!u)return send(res,200,{user:null});const db=privateDb();let p=await db.from('customer_profiles').select('*').eq('user_id',u.id).maybeSingle();
if(p.error){console.error('customer profile lookup',p.error);return send(res,503,{error:'Customer profile lookup failed. Check server logs and Supabase schema.'});}
if(!p.data){const created=await db.from('customer_profiles').upsert({user_id:u.id},{onConflict:'user_id'}).select('*').single();if(created.error){console.error('customer profile creation',created.error);return send(res,503,{error:'Customer profile could not be created. Check server logs and table columns.'});}p={data:created.data};}
return send(res,200,{user:{id:u.id,email:u.email,name:p.data?.full_name||u.user_metadata?.name||u.email,whatsapp_number:p.data?.whatsapp||''}});}
if(req.method!=='POST')return send(res,405,{error:'Method not allowed'});
if(action==='profile_whatsapp'){const u=await authenticatedUser(req);if(!u)return send(res,401,{error:'Sign in required'});const whatsapp=clean(req.body?.whatsapp_number,35);if(!/^[+0-9 ()-]{8,25}$/.test(whatsapp))return send(res,400,{error:'Invalid WhatsApp number'});const r=await privateDb().from('customer_profiles').upsert({user_id:u.id,whatsapp},{onConflict:'user_id'});if(r.error)throw r.error;return send(res,200,{whatsapp_number:whatsapp});}
return send(res,404,{error:'Unknown action'});
}catch(e){console.error('auth',e);return send(res,500,{error:'Authentication service unavailable'})}}
