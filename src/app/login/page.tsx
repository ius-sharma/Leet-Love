import { AccessPage } from '@/components/auth/access-page';
import { authConfiguration } from '@/auth/config';
import { safeNext } from '@/auth/policy';
import '../auth.css';
export const metadata={title:'Sign in · LeetLove',robots:{index:false,follow:false}};
export default async function Login({searchParams}:{searchParams:Promise<{next?:string;notice?:string}>}){
  const params=await searchParams;return <AccessPage mode="login" ready={authConfiguration().ready} next={safeNext(params.next)} notice={params.notice}/>;
}
