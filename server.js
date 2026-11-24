const http = require('http');
const { execFile } = require('child_process');
const fs = require('fs');
const path = require('path');
const PORT = Number(process.env.PORT || 3000);
let device = process.env.FIRETV_DEVICE || '';
const ROOT = __dirname;
const KEYCODES = {up:19, down:20, left:21, right:22, select:23, back:4, home:3, menu:82, playpause:85, rewind:89, forward:90, mute:164, volumeup:24, volumedown:25};
function adb(args, timeout=12000) {
  return new Promise((resolve, reject) => execFile('adb', args, {timeout, maxBuffer:1024*1024}, (err, stdout, stderr) => err ? reject(new Error((stderr || err.message).trim())) : resolve(stdout.trim())));
}
function send(res, code, data) { res.writeHead(code, {'Content-Type':'application/json','Access-Control-Allow-Origin':'*'}); res.end(JSON.stringify(data)); }
const server = http.createServer(async (req,res) => {
  if (req.method === 'OPTIONS') { res.writeHead(204, {'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'Content-Type','Access-Control-Allow-Methods':'GET,POST,OPTIONS'}); return res.end(); }
  const url = new URL(req.url, 'http://localhost');
  if (url.pathname === '/api/status') {
    try { const output = await adb(['devices']); const devices = output.split('\n').slice(1).map(x=>x.trim().split(/\s+/)).filter(x=>x.length>1 && x[1]==='device').map(x=>x[0]); return send(res,200,{connected:!!device && devices.includes(device),device,devices}); }
    catch(e) { return send(res,200,{connected:false,device,devices:[],error:'ADB is not installed or not available on the server.'}); }
  }
  if (url.pathname.startsWith('/api/')) {
    if (req.method !== 'POST') return send(res,405,{error:'POST required'});
    let body=''; for await (const chunk of req) body += chunk;
    let data; try { data=JSON.parse(body || '{}'); } catch { return send(res,400,{error:'Invalid JSON'}); }
    try {
      if (url.pathname === '/api/connect') {
        const target=String(data.address||'').trim();
        if (!/^[\w.:-]+$/.test(target) || !target.includes(':')) return send(res,400,{error:'Enter the Fire TV IP address with port, for example 192.168.1.25:5555.'});
        const result=await adb(['connect',target],15000); device=target; return send(res,200,{ok:true,message:result});
      }
      if (url.pathname === '/api/disconnect') { if(device) await adb(['disconnect',device]); device=''; return send(res,200,{ok:true}); }
      if (!device) return send(res,409,{error:'Connect to your Fire TV first.'});
      if (url.pathname === '/api/key') {
        const key=String(data.key||'').toLowerCase(); if (!KEYCODES[key]) return send(res,400,{error:'Unsupported button.'});
        await adb(['-s',device,'shell','input','keyevent',String(KEYCODES[key])]); return send(res,200,{ok:true});
      }
      if (url.pathname === '/api/text') {
        const text=String(data.text||'').slice(0,200).replace(/([\\"'&<>;|`$])/g,'\\$1').replace(/ /g,'%s');
        if(!text) return send(res,400,{error:'Type something first.'}); await adb(['-s',device,'shell','input','text',text]); return send(res,200,{ok:true});
      }
      return send(res,404,{error:'Not found'});
    } catch(e) { return send(res,502,{error:e.message || 'Could not reach Fire TV.'}); }
  }
  let file=url.pathname==='/'?'index.html':path.normalize(url.pathname).replace(/^([/\\]|\.\.(?:[/\\]|$))+/g,'');
  const full=path.join(ROOT,file); if(!full.startsWith(ROOT)){res.writeHead(403);return res.end();}
  fs.readFile(full,(err,content)=>{ if(err){res.writeHead(404);return res.end('Not found');} const type=full.endsWith('.css')?'text/css':full.endsWith('.js')?'text/javascript':'text/html'; res.writeHead(200,{'Content-Type':type});res.end(content); });
});
server.listen(PORT,'0.0.0.0',()=>{ console.log(`Fire TV Remote ready at http://0.0.0.0:${PORT}`); if(process.env.FIRETV_DEVICE) adb(['connect',device],15000).then(result=>console.log(`ADB: ${result}`)).catch(err=>console.error(`ADB auto-connect failed: ${err.message}`)); });
