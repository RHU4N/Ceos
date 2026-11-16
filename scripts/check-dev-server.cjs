const assert=require('node:assert/strict');
const fs=require('node:fs'); const path=require('node:path');
const {spawn}=require('node:child_process'); const WebSocket=require('ws');
const logDir=path.resolve('node_modules/.cache/ceos-dev-server-check'); fs.mkdirSync(logDir,{recursive:true});
const log=fs.createWriteStream(path.join(logDir,'server.log'));
const origin='http://127.0.0.1:19800';
const child=spawn(process.execPath,[path.join(__dirname,'start.cjs')],{env:{...process.env,NODE_ENV:'development',HOST:'127.0.0.1',PORT:'19800',BROWSER:'none',CI:'true',VERCEL:'0',REACT_APP_API_LOGIN_URL:'http://localhost:8081',REACT_APP_API_MATH_URL:'http://localhost:8080'},stdio:['ignore','pipe','pipe']});
child.stdout.pipe(log,{end:false}); child.stderr.pipe(log,{end:false});
async function socket(originHeader,allowed){
  await new Promise((resolve,reject)=>{
    const ws=new WebSocket('ws://127.0.0.1:19800/ws',{origin:originHeader});
    const timer=setTimeout(()=>{ws.terminate();reject(Error('HMR socket timed out: '+(allowed?'same-origin':'foreign-origin')));},8000);
    ws.on('open',()=>{if(allowed){clearTimeout(timer);ws.close();resolve();}});
    ws.on('message',data=>{if(!allowed && String(data).includes('Invalid Host/Origin header')){clearTimeout(timer);ws.close();resolve();}});
    ws.on('unexpected-response',(_request,response)=>{clearTimeout(timer);ws.terminate();if(!allowed && response.statusCode>=400)resolve();else reject(Error('Unexpected HMR response'));});
    ws.on('close',()=>{if(!allowed){clearTimeout(timer);resolve();}});
    ws.on('error',error=>{if(allowed){clearTimeout(timer);reject(error);}});
  });
}
(async()=>{
  let response;
  for(let attempt=0;attempt<90;attempt++){
    if(child.exitCode!==null)throw Error('Development server exited before readiness; inspect local server.log');
    try{response=await fetch(origin,{signal:AbortSignal.timeout(2000)});if(response.status===200)break;}catch{}
    await new Promise(resolve=>setTimeout(resolve,1000));
  }
  assert.equal(response?.status,200,'Development compilation must succeed');
  assert.match(await response.text(),/<div id="root">/);
  const denied=await fetch(origin,{headers:{Origin:'http://198.51.100.1'},signal:AbortSignal.timeout(5000)});
  assert.equal(denied.status,403); assert.equal(denied.headers.get('access-control-allow-origin'),null);
  await socket(origin,true); await socket('http://198.51.100.1',false);
  console.log('Patched CRA development server passed: compilation, same-origin HMR and foreign HTTP/WebSocket denial.');
})().catch(error=>{console.error(error.message);process.exitCode=1;}).finally(()=>{child.kill('SIGTERM');child.stdout.unpipe(log);child.stderr.unpipe(log);log.end();});
