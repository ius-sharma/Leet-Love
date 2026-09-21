import { PublicSolution } from '@/components/public-solution';
import '../../create/studio.css';
export const dynamic='force-dynamic';
export const metadata={title:'A community story | LeetLove',robots:{index:false,follow:false}};
export default async function PublicPage({params}:{params:Promise<{id:string}>}){const {id}=await params;return <PublicSolution id={id}/>;}
