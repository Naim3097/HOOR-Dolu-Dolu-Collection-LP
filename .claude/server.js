const http=require('http'),fs=require('fs'),path=require('path'),url=require('url');
const root=path.resolve(__dirname,'..');
// LOCAL PREVIEW ONLY. Binds to loopback and exposes a write endpoint used by
// the image/video pipeline. Never run this on a public interface.
const MIME={'.html':'text/html;charset=utf-8','.js':'text/javascript;charset=utf-8','.css':'text/css;charset=utf-8','.json':'application/json','.jpg':'image/jpeg','.jpeg':'image/jpeg','.png':'image/png','.svg':'image/svg+xml','.webp':'image/webp','.mp4':'video/mp4','.mov':'video/mp4','.woff2':'font/woff2','.ico':'image/x-icon','.avif':'image/avif','.txt':'text/plain;charset=utf-8','.md':'text/plain;charset=utf-8'};
http.createServer((req,res)=>{
  const u=url.parse(req.url);
  if(req.method==='POST'&&u.pathname==='/__save'){
    let chunks=[];req.on('data',c=>chunks.push(c));
    req.on('end',()=>{
      try{
        const body=JSON.parse(Buffer.concat(chunks).toString('utf8'));
        const out=path.join(root,body.path);
        if(!out.startsWith(root))throw new Error('bad path');
        fs.mkdirSync(path.dirname(out),{recursive:true});
        fs.writeFileSync(out,Buffer.from(body.data,'base64'));
        res.writeHead(200,{'content-type':'application/json','access-control-allow-origin':'*'});
        res.end(JSON.stringify({ok:true,bytes:fs.statSync(out).size}));
      }catch(e){res.writeHead(500,{'content-type':'application/json'});res.end(JSON.stringify({ok:false,err:String(e)}));}
    });
    return;
  }
  let p=decodeURIComponent(u.pathname);
  if(p.endsWith('/'))p+='index.html';
  const f=path.join(root,p);
  if(!f.startsWith(root)){res.writeHead(403).end();return;}
  fs.stat(f,(e,st)=>{
    if(e||!st.isFile()){res.writeHead(404,{'content-type':'text/plain'});res.end('404 '+p);return;}
    const ext=path.extname(f).toLowerCase();
    const range=req.headers.range;
    const head={'content-type':MIME[ext]||'application/octet-stream','accept-ranges':'bytes','cache-control':'no-cache','access-control-allow-origin':'*'};
    if(range&&/^bytes=/.test(range)){
      const [s,e2]=range.replace('bytes=','').split('-');
      const start=parseInt(s,10)||0, end=e2?parseInt(e2,10):st.size-1;
      res.writeHead(206,{...head,'content-range':`bytes ${start}-${end}/${st.size}`,'content-length':end-start+1});
      fs.createReadStream(f,{start,end}).pipe(res);
    } else {
      res.writeHead(200,{...head,'content-length':st.size});
      fs.createReadStream(f).pipe(res);
    }
  });
}).listen(5273,'127.0.0.1',()=>console.log('serving '+root+' on http://localhost:5273 (loopback only)'));
