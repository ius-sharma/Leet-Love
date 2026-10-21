import { AccessPage } from '@/components/auth/access-page';
import '../auth.css';
export const metadata={title:'Join the waitlist · LeetLove',description:'Join the early-access waitlist for LeetLove.'};
export default async function Waitlist({searchParams}:{searchParams:Promise<{notice?:string}>}){
  const params=await searchParams;
  const ready=process.env.LEETLOVE_WAITLIST_ENABLED==='true'&&!!process.env.SUPABASE_URL&&!!process.env.SUPABASE_SERVICE_ROLE_KEY;
  return <AccessPage mode="waitlist" ready={ready} notice={params.notice}/>;
}
