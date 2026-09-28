import {instrumentJava} from './instrument-java';
import type {Submission} from './runtime-client';

declare function importScripts(...urls: string[]): void;
declare function cheerpjInit(options: Record<string,unknown>): Promise<void>;
declare function cheerpOSAddStringFile(path: string, value: string | Uint8Array): void;
declare function cheerpjRunMain(main: string, classpath: string, ...args: string[]): Promise<number>;
declare function cjFileBlob(path: string): Promise<Blob>;

// A fresh worker and unique output directory isolate each run and tab.
// The vendor runtime stays on its official CDN, as required by its licence.
self.onmessage=async ({data}: MessageEvent<Submission>)=>{
  try {
    importScripts('https://cjrtnc.leaningtech.com/4.3/loader.js');
    await cheerpjInit({version:8,status:'none'});
    const id=crypto.randomUUID();
    const directory=`/files/trace-${id}`;
    cheerpOSAddStringFile('/str/Solution.java',new TextEncoder().encode(instrumentJava(data.code)));
    cheerpOSAddStringFile('/str/input.json',new TextEncoder().encode(JSON.stringify(data.input)));
    self.postMessage({type:'ready',timeoutMs:120000});
    const exit=await cheerpjRunMain('TraceRunner','/app/browser-runtime/java/tools.jar:/app/browser-runtime/java/trace-runtime.jar','/str/Solution.java','/str/input.json',directory);
    if(exit!==0)throw Error(`Java exited with code ${exit}.`);
    const blob=await cjFileBlob(`${directory}/result.json`);
    if(blob.size>8000000)throw Error('Java output exceeded 8 MB.');
    const run=JSON.parse(await blob.text());
    await cheerpjRunMain('TraceRunner','/app/browser-runtime/java/tools.jar:/app/browser-runtime/java/trace-runtime.jar','--cleanup',directory);
    self.postMessage({type:'result',run});
  } catch(error) {
    self.postMessage({type:'error',error:`Java could not run. Check your connection and try again. ${String(error)}`});
  }
};
