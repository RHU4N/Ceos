const assert=require('node:assert/strict');const http=require('node:http');const path=require('node:path');
const WebSocket=require('ws');const sockjs=require('sockjs');
const legacyAgent=require(require.resolve('http-proxy-agent',{paths:[path.dirname(require.resolve('react-scripts/package.json'))]}));
async function listen(server){await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));return server.address().port;}
async function close(server){server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}
(async()=>{
  const proxy=http.createServer((req,res)=>{assert.match(req.url,/\/contract$/);res.end('proxy-contract');});
  const port=await listen(proxy);const agent=new legacyAgent('http://127.0.0.1:'+port);
  try{const body=await new Promise((resolve,reject)=>{http.get('http://qa.example.invalid/contract',{agent},res=>{let value='';res.on('data',part=>value+=part);res.on('end',()=>resolve(value));}).on('error',reject)});assert.equal(body,'proxy-contract');}finally{agent.destroy();await close(proxy);}
  const server=http.createServer();const transport=sockjs.createServer({log(){}});const marker='echo-contract-'+Date.now();
  transport.on('connection',connection=>{assert.match(connection.id,/^[0-9a-f-]{36}$/);connection.on('data',data=>connection.write('echo:'+data));});
  transport.installHandlers(server,{prefix:'/sockjs'});const socketPort=await listen(server);
  try{await new Promise((resolve,reject)=>{const socket=new WebSocket('ws://127.0.0.1:'+socketPort+'/sockjs/websocket');const timer=setTimeout(()=>{socket.terminate();reject(Error('SockJS echo contract timed out'))},5000);socket.on('open',()=>socket.send(marker));socket.on('message',data=>{if(String(data)==='echo:'+marker){clearTimeout(timer);socket.close();resolve();}});socket.on('error',reject);});}finally{await close(server);}
  console.log('Legacy proxy TCP event handling and SockJS UUID/session echo contracts passed.');
})().catch(error=>{console.error(error.message);process.exitCode=1});
