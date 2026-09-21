import { Sandbox } from 'e2b';
import { readFile } from 'node:fs/promises';
import type { JsonValue } from '@/submissions/contracts';
export class ExecutionFailure extends Error {constructor(public kind:string,message:string){super(message);}}
export class SolutionSandbox {
  private sandbox?:Sandbox;
  private elapsed=0;
  async start(){
    if(!process.env.E2B_API_KEY||!process.env.E2B_TEMPLATE_ID)throw new ExecutionFailure('configuration','Configure the isolated Python sandbox first.');
    this.sandbox=await Sandbox.create(process.env.E2B_TEMPLATE_ID,{apiKey:process.env.E2B_API_KEY,allowInternetAccess:false,timeoutMs:180000});
    await this.sandbox.files.write('/home/user/runner.py',await readFile('workers/python/runner.py','utf8'));
  }
  async execute(source:string,method:string,args:JsonValue[],trace=false):Promise<{result:JsonValue;mutatedInput:JsonValue[];trace?:unknown}>{
    if(!this.sandbox)throw new ExecutionFailure('cancelled','Execution cancelled.');
    if(this.elapsed>=30000)throw new ExecutionFailure('resource','Execution budget exceeded; this is not a logic-error verdict.');
    const sandbox=this.sandbox;
    await sandbox.files.write('/home/user/case.json',JSON.stringify({source,method,args,trace}));
    let bytes=0;const started=Date.now();
    try{
      const output=await sandbox.commands.run('python3 -I /home/user/runner.py',{timeoutMs:Math.min(8000,30000-this.elapsed),onStdout:chunk=>{bytes+=Buffer.byteLength(chunk);if(bytes>10*1024*1024)void this.close();}});
      if(output.exitCode!==0)throw new ExecutionFailure('resource','The isolated process stopped or exceeded its resource limits.');
      if(Buffer.byteLength(output.stdout)>10*1024*1024)throw new ExecutionFailure('resource','Execution output exceeded its limit.');
      const data=JSON.parse(output.stdout);
      if(!data.ok)throw new ExecutionFailure(['unsupported','syntax','runtime'].includes(data.kind)?data.kind:'runtime',String(data.message).slice(0,300));
      if(!Object.hasOwn(data,'result')||!Array.isArray(data.mutatedInput))throw new ExecutionFailure('runtime','Invalid execution result.');
      return data;
    }catch(error){if(error instanceof ExecutionFailure)throw error;
      const failure=error as {name?:string;exitCode?:number};
      if(failure.name?.includes('Timeout')||[124,137,152].includes(failure.exitCode??0))throw new ExecutionFailure('resource','The execution time or memory budget was exceeded. No logic-error verdict was recorded.');
      throw new ExecutionFailure('infrastructure','The isolated execution service failed. No correctness verdict was recorded.');}
    finally{this.elapsed+=Date.now()-started;}
  }
  async close(){const sandbox=this.sandbox;this.sandbox=undefined;if(sandbox)await sandbox.kill().catch(()=>{});}
}
