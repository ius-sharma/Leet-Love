import { Bot, Box, Flag } from 'lucide-react';
import type { Frame } from '@/arrays/engine';
export function CargoScene({frame,finished=false}:{frame:Frame;finished?:boolean}){
  return <div className="cargo-scene">
    <div className="cargo-caption"><span><Box size={15}/> ARRAY CARGO LAB</span><span>{finished?'Inspection complete':'Every crate is one array element'}</span></div>
    <div className="cargo-yard"><div className="cargo-lane" role="list" aria-label="Array values and indices">{frame.values.map((value,index)=><div role="listitem" className={`cargo-position ${frame.active.includes(index)?'selected':''}`} key={index} aria-label={`Index ${index}, value ${value}${frame.active.includes(index)?', selected':''}`}>
      <div className="cargo-robot" aria-hidden="true">{frame.active.includes(index)?finished?<Flag size={25}/>:<Bot size={28}/>:null}</div>
      <div className="cargo-crate"><span>{value}</span></div><small>index {index}</small>
    </div>)}</div><div className="cargo-road" aria-hidden="true"/></div>
    {frame.lookup&&<div className="lookup-shelf"><strong>Lookup shelf <small>value → index</small></strong>{frame.lookup.length?frame.lookup.map(([v,i])=><span key={v}>{v} → {i}</span>):<span>Empty — no earlier crates yet</span>}</div>}
    <details className="cargo-variables"><summary>Inspect variables</summary><dl>{Object.entries(frame.variables).map(([k,v])=><div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}</dl></details>
  </div>;
}
