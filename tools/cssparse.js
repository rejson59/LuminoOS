const {JSDOM,VirtualConsole}=require('jsdom'), fs=require('fs');
const out=[];
['css/base.css','css/android.css','css/windows.css','css/glass.css','css/island.css','css/activity.css','css/motion.css','css/os.css','css/perf.css'].forEach(f=>{
  const vc=new VirtualConsole(); let msg=null;
  vc.on('jsdomError',e=>{msg=e.message});
  new JSDOM('<style>'+fs.readFileSync(f,'utf8')+'</style>',{virtualConsole:vc});
  out.push(f+': '+(msg?'BŁĄD':'ok'));
});
console.log(out.join('\n'));
