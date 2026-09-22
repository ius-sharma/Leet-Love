'use client';
import { useEffect, useRef } from 'react';
import { Flag, Minus, Plus, Check, Circle } from 'lucide-react';
import type { PlayerAction, PlayerState } from '@/lib/player';
const icons={neutral:Circle,add:Plus,remove:Minus,save:Flag,done:Check};
export function ExecutionMap({state,dispatch}:{state:PlayerState;dispatch:React.Dispatch<PlayerAction>}){
 const track=useRef<HTMLDivElement>(null);
 useEffect(()=>{const container=track.current;const button=container?.children[state.step] as HTMLElement|undefined;if(container&&button){const left=button.offsetLeft-container.offsetLeft;if(left<container.scrollLeft||left+button.offsetWidth>container.scrollLeft+container.clientWidth)container.scrollTo({left:Math.max(0,left-container.clientWidth/2),behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});}},[state.step]);
 return <div className="execution-map"><div className="execution-map-heading"><span>EXECUTION MAP</span><span>{state.frames[state.step].title}</span></div><div className="execution-map-track" ref={track} aria-label="Execution steps">{state.frames.map((frame,i)=>{const Icon=icons[frame.tone];return <button key={frame.id} className={`trace-step ${frame.tone} ${i===state.step?'current':''} ${i<state.step?'visited':''}`} title={`${i+1}. ${frame.title}`} aria-label={`Go to step ${i+1}: ${frame.title}`} aria-current={i===state.step?'step':undefined} onClick={()=>dispatch({type:'seek',step:i})}><Icon size={13}/><span>{i+1}</span></button>;})}</div><div className="execution-map-legend"><span><Plus size={11}/> Add / advance</span><span><Minus size={11}/> Remove</span><span><Flag size={11}/> Compare</span><span><Check size={11}/> Result</span></div></div>;
}
