import type { Input, Snapshot } from '../lessons/types';
export type PlayerState={input:Input;frames:Snapshot[];step:number;furthest:number;mode:'guided'|'watch';playing:boolean;feedback:string;speed:number};
export const initialPlayer=(input:Input,frames:Snapshot[]):PlayerState=>({input,frames,step:0,furthest:0,mode:'guided',playing:false,feedback:'',speed:1200});
export type PlayerAction = {type:'load';state:PlayerState}|{type:'seek';step:number}|{type:'next';from:number}|{type:'choose';key:string;from:number}|{type:'reset'}|{type:'play'}|{type:'pause'}|{type:'mode';mode:PlayerState['mode']}|{type:'speed';speed:number};
export function playerReducer(state:PlayerState,action:PlayerAction):PlayerState {
  const move=(value:number)=>{const step=Math.max(0,Math.min(state.frames.length-1,value));return {...state,step,furthest:Math.max(state.furthest,step),feedback:'',playing:step===state.frames.length-1?false:state.playing};};
  switch(action.type){
    case 'load':return {...action.state,playing:false,feedback:''};
    case 'seek':return {...move(action.step),playing:false};
    case 'next':return action.from===state.step&&state.mode==='watch'?move(state.step+1):state;
    case 'choose':{
      if(action.from!==state.step||state.mode!=='guided')return state;
      const challenge=state.frames[state.step+1]?.challenge;
      if(!challenge)return state;
      return challenge.accepted.includes(action.key)?{...move(state.step+1),playing:false}:{...state,feedback:challenge.hint,playing:false};
    }
    case 'reset':return {...initialPlayer(state.input,state.frames),mode:state.mode,speed:state.speed};
    case 'play':return {...state,playing:state.mode==='watch'&&state.step<state.frames.length-1?!state.playing:false};
    case 'pause':return {...state,playing:false};
    case 'mode':return {...state,mode:action.mode,playing:false,feedback:''};
    case 'speed':return {...state,speed:action.speed};
  }
}
