import { notFound } from 'next/navigation';
import { getMission, missions } from '@/arrays/curriculum';
import { ArrayMission } from '@/components/arrays/array-mission';
import '../arrays.css';
export function generateStaticParams(){return missions.map(m=>({mission:m.id}));}
export default async function MissionPage({params}:{params:Promise<{mission:string}>}){
  const {mission}=await params;const m=getMission(mission);if(!m)notFound();
  return <ArrayMission key={m.id} mission={m}/>;
}
