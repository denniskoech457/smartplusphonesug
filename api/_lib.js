import {createClient} from '@supabase/supabase-js';
export const url=process.env.SUPABASE_URL;
export const pub=process.env.SUPABASE_PUBLISHABLE_KEY;
export function publicDb(){if(!url||!pub)throw Error('Missing Supabase configuration');return createClient(url,pub,{auth:{persistSession:false,autoRefreshToken:false}})}
export function privateDb(){const secret=process.env.SUPABASE_SECRET_KEY;if(!url||!secret)throw Error('Missing server secret');return createClient(url,secret,{auth:{persistSession:false,autoRefreshToken:false}})}
export function send(res,status,obj){res.setHeader('Cache-Control','no-store');return res.status(status).json(obj)}
export async function admin(req){const bearer=(req.headers.authorization||'').match(/^Bearer (.+)$/);if(!bearer)return false;const db=publicDb();const {data:{user},error}=await db.auth.getUser(bearer[1]);if(error||!user)return false;const {data,error:lookup}=await privateDb().from('admin_users').select('user_id').eq('user_id',user.id).maybeSingle();return !lookup&&!!data}

export async function authenticatedUser(req){const match=(req.headers.authorization||'').match(/^Bearer (.+)$/);if(!match)return null;const {data,error}=await publicDb().auth.getUser(match[1]);return error?null:data.user}
export function clean(v,max=200){return typeof v==='string'?v.trim().slice(0,max):''}
