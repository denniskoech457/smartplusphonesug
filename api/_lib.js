import {createClient} from '@supabase/supabase-js';
export const url=process.env.SUPABASE_URL;
export const pub=process.env.SUPABASE_PUBLISHABLE_KEY;
export function publicDb(){if(!url||!pub)throw Error('Missing Supabase configuration');return createClient(url,pub,{auth:{persistSession:false,autoRefreshToken:false}})}
export function privateDb(){const secret=process.env.SUPABASE_SECRET_KEY;if(!url||!secret)throw Error('Missing server secret');return createClient(url,secret,{auth:{persistSession:false,autoRefreshToken:false}})}
export function send(res,status,obj){res.setHeader('Cache-Control','no-store');return res.status(status).json(obj)}
export async function adminStatus(req){
  const bearer=(req.headers.authorization||'').match(/^Bearer (.+)$/);
  if(!bearer)return {ok:false,status:401,error:'Admin session missing. Please sign in again.'};
  const {data:{user},error}=await publicDb().auth.getUser(bearer[1]);
  if(error||!user)return {ok:false,status:401,error:'Admin session expired or invalid. Please sign in again.'};
  const {data,error:lookup}=await privateDb().from('admin_users').select('user_id').eq('user_id',user.id).maybeSingle();
  if(lookup){console.error('admin role lookup',lookup);return {ok:false,status:503,error:'Admin role lookup failed. Check Supabase secret key, exposed tables, and Vercel function logs.'};}
  if(!data)return {ok:false,status:403,error:'Administrator access required. The signed-in user is not in admin_users.'};
  return {ok:true,user};
}
export async function admin(req){return (await adminStatus(req)).ok}

export async function authenticatedUser(req){const match=(req.headers.authorization||'').match(/^Bearer (.+)$/);if(!match)return null;const {data,error}=await publicDb().auth.getUser(match[1]);return error?null:data.user}
export function clean(v,max=200){return typeof v==='string'?v.trim().slice(0,max):''}
