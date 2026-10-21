import { AccessPage } from '@/components/auth/access-page';
import { authConfiguration } from '@/auth/config';
import { safeNext } from '@/auth/policy';
import '../auth.css';
export const metadata={title:'Get started · LeetLove',robots:{index:false,follow:false}};
export default async function Signup({searchParams}:{searchParams:Promise<{next?:string;notice?:string}>}){
  const params=await searchParams;return <AccessPage mode="signup" ready={authConfiguration().ready} next={safeNext(params.next)} notice={params.notice}/>;
}
