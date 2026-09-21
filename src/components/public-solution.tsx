'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import type { Artifact } from '@/submissions/contracts';
import { AcademyShell } from './academy-shell';
import { SolutionReplay } from './solution-replay';
export function PublicSolution({id}:{id:string}){
  const [data,setData]=useState<{payload:Omit<Artifact,'source'>&{source?:string};author_name:string}|null>(null),[error,setError]=useState('');
  useEffect(()=>{const abort=new AbortController();fetch(`/api/studio?public=${id}`,{signal:abort.signal,cache:'no-store'}).then(async r=>{const json=await r.json();if(!r.ok)throw Error(json.error);setData(json);}).catch(e=>{if(!abort.signal.aborted)setError(e.message);});return()=>abort.abort();},[id]);
  return <AcademyShell active="public"><main className="creator-main"><div className="public-heading"><span className="eyebrow">A COMMUNITY EXPLANATION</span><h1>{data?.payload.story.title??(error?'Story unavailable':'Loading story…')}</h1>{data&&<p>Shared by {data.author_name}. Replay this recorded example; no code runs in your browser.</p>}<Link href="/create">Create your own explanation →</Link></div>{error&&<p role="alert">{error}</p>}{data&&<><SolutionReplay artifact={data.payload}/><p className="public-report">Something misleading or inappropriate? <Link href={`/create?report=${id}`}>Sign in to report this story</Link>.</p></>}</main></AcademyShell>;
}
