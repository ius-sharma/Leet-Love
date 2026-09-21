export const requiredEnvironment=['SUPABASE_URL','SUPABASE_ANON_KEY','SUPABASE_SERVICE_ROLE_KEY','E2B_API_KEY','E2B_TEMPLATE_ID','GROQ_API_KEY'] as const;
export function configuration() {
  const missing=requiredEnvironment.filter(key=>!process.env[key]);
  return {ready:missing.length===0,missing,model:process.env.GROQ_MODEL||'openai/gpt-oss-20b',publishing:process.env.LEETLOVE_PUBLISHING_ENABLED==='true'};
}
export class StudioError extends Error { constructor(message:string,public status=400){super(message);} }
