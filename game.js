// Evil Taxi v7: zoomed-out map + kilometers + hidden fare before driving
(() => {
  "use strict";

  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d");
  const resetBtn = document.getElementById("resetBtn");
  const driveBtn = document.getElementById("driveBtn");
  const nextBtn = document.getElementById("nextBtn");
  const statusEl = document.getElementById("status");

  const W = 390, H = 680;
  const DPR = Math.max(1, Math.min(3, window.devicePixelRatio || 1));
  canvas.width = W * DPR; canvas.height = H * DPR; ctx.setTransform(DPR,0,0,DPR,0,0);

  const MAP = { x: 14, y: 132, w: 362, h: 470 };
  MAP.r = MAP.x + MAP.w; MAP.b = MAP.y + MAP.h;

  // 地图缩放：让整体路网看起来更像导航地图的“缩放视角”，能看到更远路线。
  const VIEW = { scale: 0.86, cx: MAP.x + MAP.w / 2, cy: MAP.y + MAP.h / 2 };
  const KM_PER_PX = 0.01;

  function worldToScreen(pt){
    return {
      x: VIEW.cx + (pt.x - VIEW.cx) * VIEW.scale,
      y: VIEW.cy + (pt.y - VIEW.cy) * VIEW.scale
    };
  }

  function screenToWorld(pt){
    return {
      x: VIEW.cx + (pt.x - VIEW.cx) / VIEW.scale,
      y: VIEW.cy + (pt.y - VIEW.cy) / VIEW.scale
    };
  }

  function kmFor(len){
    return len * KM_PER_PX;
  }

  function kmText(len){
    return `${kmFor(len).toFixed(1)}km`;
  }

  const C = {
    ink:"#1d1a16", bg:"#f5f3ec", block:"#e8e4dc", blockLine:"#d4cec5",
    local:"#ffffff", localEdge:"#d1cbc1", main:"#ffe17a", mainEdge:"#e8bd47",
    highway:"#ffb25b", highwayEdge:"#e4862e", route:"#2377ff", water:"#b8ddff", park:"#d9efca",
    red:"#df3d35", blue:"#2278d9", green:"#18a86c"
  };

  function p(id,x,y){ return {id,x,y}; }
  function e(a,b,type="local",opt={}){ return {a,b,type,...opt}; }
  function zedge(a,b){ return a < b ? `${a}|${b}` : `${b}|${a}`; }
  function rr(x,y,w,h,r){ const m=Math.min(r,w/2,h/2); ctx.beginPath(); ctx.moveTo(x+m,y); ctx.arcTo(x+w,y,x+w,y+h,m); ctx.arcTo(x+w,y+h,x,y+h,m); ctx.arcTo(x,y+h,x,y,m); ctx.arcTo(x,y,x+w,y,m); ctx.closePath(); }
  function text(t,x,y,size=13,weight=800,align="left",color=C.ink){ ctx.save(); ctx.font=`${weight} ${size}px -apple-system,BlinkMacSystemFont,"PingFang SC","Microsoft YaHei",Arial`; ctx.textAlign=align; ctx.textBaseline="middle"; ctx.fillStyle=color; ctx.fillText(t,x,y); ctx.restore(); }
  function dist(a,b){ return Math.hypot(a.x-b.x,a.y-b.y); }
  function clamp(v,a,b){ return Math.max(a,Math.min(b,v)); }

  function gridLevel(cfg){
    const nodes={}, edges=[];
    cfg.xs.forEach((x,i)=>cfg.ys.forEach((y,j)=>nodes[`${i},${j}`]=p(`${i},${j}`,x,y)));
    const removed = new Set((cfg.remove||[]).map(pair=>zedge(pair[0],pair[1])));
    const special = new Map();
    (cfg.special||[]).forEach(s=>special.set(zedge(s.a,s.b),s));
    for(let i=0;i<cfg.xs.length;i++) for(let j=0;j<cfg.ys.length;j++){
      const id=`${i},${j}`;
      if(i<cfg.xs.length-1){ const b=`${i+1},${j}`, key=zedge(id,b); if(!removed.has(key)){ const sp=special.get(key)||{}; edges.push(e(id,b,sp.type||"local",sp)); } }
      if(j<cfg.ys.length-1){ const b=`${i},${j+1}`, key=zedge(id,b); if(!removed.has(key)){ const sp=special.get(key)||{}; edges.push(e(id,b,sp.type||"local",sp)); } }
    }
    return {...cfg,nodes,edges};
  }

  const levels = [
    gridLevel({
      name:"第1关：奶茶绕小区", passenger:"赶时间的上班族", district:"人民路 / 朝阳路", start:"0,3", end:"4,0", target:42, base:8, rate:.118, patience:100, two:70, three:45, wish:{emoji:"🧋",item:"一杯超大奶茶"},
      xs:[54,126,198,270,342], ys:[170,250,330,410,490,565],
      special:[{a:"0,3",b:"0,4",type:"main",label:"人民路"},{a:"0,4",b:"1,4",type:"main"},{a:"1,4",b:"2,4",type:"main"},{a:"2,4",b:"3,4",type:"main"},{a:"3,4",b:"4,4",type:"main"},{a:"2,1",b:"2,2",risk:18,label:"熟路"},{a:"3,2",b:"4,2",excuse:15,label:"修路"}],
      pois:[{x:342,y:170,t:"公司",i:"🏢"},{x:54,y:410,t:"小区",i:"🏠"}], parks:[{x:214,y:352,w:46,h:38,t:"公园"}]
    }),
    gridLevel({
      name:"第2关：洗车券机场单", passenger:"外地游客", district:"机场高速 / 迎宾路", start:"0,0", end:"4,4", target:58, base:14, rate:.115, patience:100, two:72, three:48, wish:{emoji:"🧽",item:"一张豪华洗车券"},
      xs:[56,116,190,266,338], ys:[165,235,315,395,535], remove:[["1,1","2,1"],["3,2","4,2"]],
      special:[{a:"0,0",b:"1,0",type:"highway",label:"机场高速"},{a:"1,0",b:"2,0",type:"highway"},{a:"2,0",b:"3,0",type:"highway"},{a:"3,0",b:"4,0",type:"highway"},{a:"1,1",b:"1,2",risk:20,label:"快线"},{a:"2,2",b:"2,3",excuse:14,label:"高架入口"},{a:"0,3",b:"1,3",type:"main"},{a:"1,3",b:"2,3",type:"main"},{a:"2,3",b:"3,3",type:"main"},{a:"3,3",b:"4,3",type:"main"}],
      pois:[{x:56,y:165,t:"机场",i:"✈️"},{x:338,y:535,t:"酒店",i:"🏨"}], waters:[{x:30,y:135,w:320,h:20,t:"跑道区"}]
    }),
    gridLevel({
      name:"第3关：墨镜绕桥", passenger:"怕堵车的情侣", district:"内河路 / 双桥", start:"0,4", end:"4,4", target:55, base:10, rate:.13, patience:94, two:68, three:44, wish:{emoji:"🕶️",item:"一副司机墨镜"},
      xs:[58,126,198,270,338], ys:[170,240,330,410,520], remove:[["0,2","1,2"],["3,2","4,2"]],
      special:[{a:"1,2",b:"2,2",type:"highway",risk:35,label:"最快桥"},{a:"2,2",b:"3,2",type:"highway",risk:35},{a:"0,1",b:"1,1",type:"main"},{a:"1,1",b:"2,1",type:"main"},{a:"2,1",b:"3,1",type:"main",excuse:20,label:"积水绕行"},{a:"3,1",b:"4,1",type:"main"},{a:"0,3",b:"1,3",type:"main"},{a:"1,3",b:"2,3",type:"main"},{a:"2,3",b:"3,3",type:"main"},{a:"3,3",b:"4,3",type:"main"}],
      pois:[{x:58,y:520,t:"商场",i:"🛍️"},{x:338,y:520,t:"影院",i:"🎬"}], waters:[{x:25,y:285,w:340,h:62,t:"河道"}]
    }),
    gridLevel({
      name:"第4关：车载香氛夜宵单", passenger:"喝多的老板", district:"霓虹街 / 后巷", start:"0,1", end:"4,1", target:65, base:12, rate:.13, patience:110, two:78, three:54, wish:{emoji:"🌲",item:"一瓶车载香氛"},
      xs:[58,126,198,270,338], ys:[175,245,325,405,490,560], remove:[["2,0","2,1"],["2,1","3,1"]],
      special:[{a:"0,1",b:"1,1",type:"main",risk:30,label:"一眼直路"},{a:"1,1",b:"2,1",type:"main",risk:30},{a:"3,1",b:"4,1",type:"main",risk:30},{a:"3,3",b:"4,3",excuse:20,label:"夜间施工"},{a:"0,4",b:"1,4",type:"main"},{a:"1,4",b:"2,4",type:"main"},{a:"2,4",b:"3,4",type:"main"},{a:"3,4",b:"4,4",type:"main"}],
      pois:[{x:58,y:245,t:"饭店",i:"🍢"},{x:338,y:245,t:"家",i:"🏠"}], parks:[{x:280,y:390,w:48,h:42,t:"夜市"}]
    }),
    gridLevel({
      name:"第5关：脚垫景区单", passenger:"拍照游客", district:"山门路 / 湖边线", start:"0,4", end:"4,2", target:74, base:15, rate:.135, patience:96, two:70, three:46, wish:{emoji:"🧩",item:"一套新脚垫"},
      xs:[58,126,198,270,338], ys:[165,245,325,405,535], remove:[["1,0","2,0"],["1,1","2,1"],["1,2","2,2"],["1,3","2,3"]],
      special:[{a:"0,4",b:"0,3",type:"main"},{a:"0,3",b:"1,3",type:"main"},{a:"1,3",b:"1,2",type:"main"},{a:"2,3",b:"3,3",excuse:16,label:"观景台"},{a:"3,3",b:"4,3",excuse:16},{a:"4,3",b:"4,2",type:"main"},{a:"3,1",b:"4,1",risk:24,label:"地图标路"}],
      pois:[{x:58,y:535,t:"景区门",i:"🎫"},{x:338,y:325,t:"民宿",i:"🏡"}], parks:[{x:146,y:180,w:90,h:260,t:"山林"}], waters:[{x:225,y:488,w:112,h:42,t:"景区湖"}]
    }),
    gridLevel({
      name:"第6关：饮料医院急单", passenger:"有点急的家属", district:"健康路 / 急诊通道", start:"4,4", end:"0,0", target:78, base:16, rate:.13, patience:82, two:62, three:38, wish:{emoji:"🥤",item:"一箱功能饮料"},
      xs:[54,126,198,270,342], ys:[160,240,320,420,540], remove:[["1,2","2,2"],["2,2","3,2"]],
      special:[{a:"0,0",b:"1,0",type:"main",label:"医院正门"},{a:"1,0",b:"2,0",type:"main"},{a:"2,0",b:"3,0",type:"main"},{a:"0,2",b:"1,2",type:"main",risk:38,label:"医院主路"},{a:"3,2",b:"4,2",type:"main",risk:38},{a:"0,3",b:"1,3",excuse:18,label:"救护车道"},{a:"1,3",b:"2,3",excuse:18}],
      pois:[{x:54,y:160,t:"医院",i:"🏥"},{x:342,y:540,t:"社区",i:"🏘️"}], parks:[{x:75,y:390,w:70,h:52,t:"急救区"}]
    }),
    gridLevel({
      name:"第7关：手机支架老城区", passenger:"本地阿姨", district:"菜市口 / 老巷", start:"0,0", end:"4,4", target:88, base:10, rate:.15, patience:76, two:58, three:35, wish:{emoji:"📱",item:"一个新手机支架"},
      xs:[54,116,188,260,338], ys:[160,230,315,405,540], remove:[["2,0","3,0"],["0,2","1,2"],["3,3","4,3"]],
      special:[{a:"1,1",b:"2,1",risk:35,label:"阿姨熟路"},{a:"2,1",b:"3,1",risk:35},{a:"3,0",b:"4,0",risk:22,label:"老邻居"},{a:"0,3",b:"1,3",excuse:22,label:"限行绕行"},{a:"1,3",b:"2,3",excuse:22},{a:"0,4",b:"1,4",type:"main"},{a:"1,4",b:"2,4",type:"main"},{a:"2,4",b:"3,4",type:"main"},{a:"3,4",b:"4,4",type:"main"}],
      pois:[{x:54,y:160,t:"菜场",i:"🥬"},{x:338,y:540,t:"小区",i:"🏠"}], parks:[{x:56,y:362,w:70,h:70,t:"街心公园"}]
    }),
    gridLevel({
      name:"第8关：耳机会展中心", passenger:"外企客户", district:"会展大道 / 商务环线", start:"0,2", end:"4,4", target:95, base:20, rate:.145, patience:84, two:60, three:38, wish:{emoji:"🎧",item:"一副蓝牙耳机"},
      xs:[54,126,198,270,342], ys:[165,245,335,425,535], remove:[["0,1","1,1"],["2,2","3,2"]],
      special:[{a:"0,2",b:"1,2",type:"main",risk:28,label:"主干道"},{a:"1,2",b:"2,2",type:"main",risk:28},{a:"3,2",b:"4,2",type:"main",risk:28},{a:"0,3",b:"1,3",type:"highway",excuse:18,label:"商务环线"},{a:"1,3",b:"2,3",type:"highway",excuse:18},{a:"2,3",b:"3,3",type:"highway",excuse:18},{a:"3,3",b:"4,3",type:"highway",excuse:18},{a:"3,0",b:"4,0",excuse:14,label:"临时管制"}],
      pois:[{x:54,y:335,t:"展馆",i:"🏢"},{x:342,y:535,t:"酒店",i:"🏨"}], parks:[{x:240,y:180,w:80,h:45,t:"会展绿地"}]
    }),
    gridLevel({
      name:"第9关：车载大屏跨江单", passenger:"开着导航的乘客", district:"滨江路 / 大桥匝道", start:"0,4", end:"4,0", target:108, base:18, rate:.15, patience:70, two:50, three:30, wish:{emoji:"📺",item:"一个车载大屏"},
      xs:[55,126,198,270,340], ys:[165,240,320,410,540], remove:[["0,2","1,2"],["3,2","4,2"]],
      special:[{a:"1,2",b:"2,2",type:"highway",risk:48,label:"最快桥"},{a:"2,2",b:"3,2",type:"highway",risk:48},{a:"0,1",b:"1,1",type:"main",excuse:22,label:"封桥绕行"},{a:"1,1",b:"2,1",type:"main",excuse:22},{a:"2,1",b:"3,1",type:"main"},{a:"3,1",b:"4,1",type:"main"},{a:"0,3",b:"1,3",type:"main"},{a:"1,3",b:"2,3",type:"main"},{a:"2,3",b:"3,3",type:"main"},{a:"3,3",b:"4,3",type:"main",risk:20,label:"导航盯着"}],
      pois:[{x:55,y:540,t:"码头",i:"⛴️"},{x:340,y:165,t:"公寓",i:"🏢"}], waters:[{x:25,y:275,w:340,h:84,t:"江面"}]
    }),
    gridLevel({
      name:"第10关：二手跑车首付", passenger:"很懂路的产品经理", district:"机场线 / 城市环线", start:"0,4", end:"4,0", target:128, base:26, rate:.15, patience:62, two:42, three:26, wish:{emoji:"🏎️",item:"二手跑车首付"},
      xs:[52,116,188,266,342], ys:[160,235,315,410,540], remove:[["0,1","1,1"],["3,3","4,3"],["1,2","2,2"]],
      special:[{a:"0,3",b:"1,3",type:"highway",excuse:18,label:"城市环线"},{a:"1,3",b:"2,3",type:"highway",excuse:18},{a:"2,3",b:"3,3",type:"highway",excuse:18},{a:"3,3",b:"3,2",type:"highway"},{a:"3,2",b:"4,2",type:"main",risk:38,label:"官方推荐路"},{a:"4,2",b:"4,1",type:"main",risk:38},{a:"4,1",b:"4,0",type:"main"},{a:"2,1",b:"3,1",risk:28,label:"乘客常走"},{a:"0,1",b:"0,2",risk:24,label:"明显反向"},{a:"1,4",b:"2,4",type:"main"},{a:"2,4",b:"3,4",type:"main"}],
      pois:[{x:52,y:540,t:"园区",i:"💼"},{x:342,y:160,t:"机场",i:"✈️"}], parks:[{x:54,y:310,w:52,h:70,t:"事故点"}], waters:[{x:220,y:475,w:110,h:28,t:"景观河"}]
    })
  ];

  for (const lv of levels) {
    const adj = new Map();
    Object.keys(lv.nodes).forEach(id => adj.set(id, []));
    for (const ed of lv.edges) {
      ed.key = zedge(ed.a, ed.b);
      ed.len = dist(lv.nodes[ed.a], lv.nodes[ed.b]);
      adj.get(ed.a).push({to:ed.b, edge:ed}); adj.get(ed.b).push({to:ed.a, edge:ed});
    }
    lv.adj = adj;
  }

  const state = { screen:"start", level:0, route:[], drawing:false, status:"draw", result:null, car:{i:0,t:0,money:0}, stars:Array(10).fill(0), unlocked:0, messageAt:0 };
  function lv(){ return levels[state.level]; }
  function node(id){ return lv().nodes[id]; }
  function edgeBetween(a,b){ return lv().adj.get(a).find(x=>x.to===b)?.edge || null; }

  function dijkstra(level, start, end){
    const q = new Set(Object.keys(level.nodes));
    const d = {}, prev = {}; q.forEach(id=>d[id]=Infinity); d[start]=0;
    while(q.size){
      let u=null, best=Infinity; for(const id of q){ if(d[id]<best){best=d[id];u=id;} }
      if(u===null) break; q.delete(u); if(u===end) break;
      for(const nx of level.adj.get(u)){ if(!q.has(nx.to)) continue; const alt=d[u]+nx.edge.len; if(alt<d[nx.to]){d[nx.to]=alt;prev[nx.to]=u;} }
    }
    const path=[]; let cur=end; while(cur){ path.unshift(cur); if(cur===start) break; cur=prev[cur]; }
    return {len:d[end], path};
  }

  function routeLen(ids){ let s=0; for(let i=1;i<ids.length;i++){ const ed=edgeBetween(ids[i-1],ids[i]); if(ed) s+=ed.len; } return s; }
  function routeEdges(ids){ const out=[]; for(let i=1;i<ids.length;i++){ const ed=edgeBetween(ids[i-1],ids[i]); if(ed) out.push(ed); } return out; }
  function moneyFor(len){ const L=lv(); return Math.round(L.base + len * L.rate); }

  function evaluate(){
    const L=lv(), ids=state.route; const sp=dijkstra(L,L.start,L.end); const len=routeLen(ids); const money=moneyFor(len); const ended=ids[ids.length-1]===L.end;
    const ratio = sp.len && Number.isFinite(sp.len) ? len / sp.len : 1;
    const used=routeEdges(ids); let suspicion=Math.max(0,(ratio-1.12)*46); let risk=[], excuse=[];
    used.forEach(ed=>{ if(ed.risk){suspicion+=ed.risk; risk.push(ed.label||"熟路");} if(ed.excuse){suspicion-=ed.excuse; excuse.push(ed.label||"借口");} });
    const seen=new Set(); let loops=0; ids.forEach(id=>{ if(seen.has(id)) loops++; seen.add(id); }); suspicion += loops*8;
    if(ratio>2.15 && excuse.length===0) suspicion += 20;
    if(ratio>2.75) suspicion += 25;
    suspicion = Math.max(0, Math.round(suspicion));
    const pass = ended && money>=L.target && suspicion < L.patience;
    const failed = ended && suspicion >= L.patience;
    let stars=0;
    if(pass){ stars=1; if(suspicion<=L.two && money>=L.target+8) stars=2; if(suspicion<=L.three && money>=L.target+18) stars=3; }
    return {len, shortest:sp.len, shortestPath:sp.path, ratio, money, suspicion, risk:[...new Set(risk)], excuse:[...new Set(excuse)], ended, pass, failed, stars};
  }

  function pos(evt){ const e=evt.touches?evt.touches[0]:evt; const r=canvas.getBoundingClientRect(); const s={x:(e.clientX-r.left)*W/r.width,y:(e.clientY-r.top)*H/r.height}; return screenToWorld(s); }
  function pointSeg(p,a,b){ const vx=b.x-a.x,vy=b.y-a.y,wx=p.x-a.x,wy=p.y-a.y,c2=vx*vx+vy*vy,t=c2?clamp((vx*wx+vy*wy)/c2,0,1):0; const x=a.x+vx*t,y=a.y+vy*t; return {x,y,d:Math.hypot(p.x-x,p.y-y),t}; }
  function nearestEdge(pt){ let best={d:999,ed:null,near:null}; for(const ed of lv().edges){ const s=pointSeg(pt,node(ed.a),node(ed.b)); if(s.d<best.d) best={d:s.d,ed,near:s}; } return best; }
  function nearestNode(pt){ let best={d:999,id:null}; for(const id in lv().nodes){ const n=node(id), d=Math.hypot(pt.x-n.x,pt.y-n.y); if(d<best.d) best={d,id}; } return best; }

  function allowedNextFromPointer(pt){
    const last=state.route[state.route.length-1]; if(!last) return null;
    const near=nearestEdge(pt); if(near.d>24) return {ok:false,msg:"这里不是道路，不能穿建筑或河面。"};
    const ed=near.ed; if(ed.a!==last && ed.b!==last) return {ok:false,msg:"路线必须从当前路口继续，不能瞬移。"};
    const other = ed.a===last ? ed.b : ed.a;
    const tFromA = near.near.t;
    const goingFar = ed.a===last ? tFromA > .58 : tFromA < .42;
    if(goingFar) return {ok:true,next:other};
    return {ok:true,next:null};
  }

  function drawRoad(ed){
    const a=node(ed.a),b=node(ed.b); const edge=ed.type==="highway"?C.highwayEdge:ed.type==="main"?C.mainEdge:C.localEdge; const fill=ed.type==="highway"?C.highway:ed.type==="main"?C.main:C.local; const ew=ed.type==="highway"?26:ed.type==="main"?23:18; const fw=ed.type==="highway"?18:ed.type==="main"?16:12;
    ctx.save(); ctx.lineCap="round"; ctx.lineJoin="round"; ctx.strokeStyle=edge; ctx.lineWidth=ew; ctx.beginPath(); ctx.moveTo(a.x,a.y); ctx.lineTo(b.x,b.y); ctx.stroke(); ctx.strokeStyle=fill; ctx.lineWidth=fw; ctx.beginPath(); ctx.moveTo(a.x,a.y); ctx.lineTo(b.x,b.y); ctx.stroke(); if(ed.type!=="local"){ctx.strokeStyle="rgba(255,255,255,.65)";ctx.lineWidth=2;ctx.setLineDash([14,14]);ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();} ctx.restore();
  }

  function drawBlocks(){
    const L=lv(); const xs=L.xs, ys=L.ys;
    ctx.save();
    for(let i=0;i<xs.length-1;i++) for(let j=0;j<ys.length-1;j++){
      const x=xs[i]+17, y=ys[j]+17, w=xs[i+1]-xs[i]-34, h=ys[j+1]-ys[j]-34; if(w<22||h<22) continue;
      rr(x,y,w,h,8); ctx.fillStyle=C.block; ctx.fill(); ctx.strokeStyle=C.blockLine; ctx.lineWidth=1.3; ctx.stroke();
      if((i+j+state.level)%3===0){ ctx.fillStyle="rgba(255,255,255,.34)"; ctx.fillRect(x+8,y+8,Math.max(8,w-16),4); }
    }
    ctx.restore();
  }

  function drawFeature(f){
    ctx.save(); rr(f.x,f.y,f.w,f.h,14); ctx.fillStyle=f.t?.includes("河")||f.t?.includes("湖")||f.t?.includes("江")||f.t?.includes("跑道")?C.water:C.park; ctx.fill(); ctx.strokeStyle=f.t?.includes("河")||f.t?.includes("湖")||f.t?.includes("江")||f.t?.includes("跑道")?"#78b9ed":"#96c876"; ctx.lineWidth=1.8; ctx.stroke(); text(f.t||"",f.x+f.w/2,f.y+f.h/2,10,900,"center",f.t?.includes("河")||f.t?.includes("湖")||f.t?.includes("江")?"#2c78b9":"#43823d"); ctx.restore();
  }

  function drawMap(){
    rr(MAP.x,MAP.y,MAP.w,MAP.h,20); ctx.fillStyle=C.bg; ctx.fill(); ctx.strokeStyle=C.ink; ctx.lineWidth=3; ctx.stroke();
    ctx.save(); rr(MAP.x+2,MAP.y+2,MAP.w-4,MAP.h-4,18); ctx.clip(); ctx.fillStyle=C.bg; ctx.fillRect(MAP.x,MAP.y,MAP.w,MAP.h);

    // 在地图内容层做缩放，像导航软件缩小视角一样，能看到更大的城市范围。
    ctx.translate(VIEW.cx, VIEW.cy);
    ctx.scale(VIEW.scale, VIEW.scale);
    ctx.translate(-VIEW.cx, -VIEW.cy);
    ctx.strokeStyle="rgba(160,150,140,.15)"; ctx.lineWidth=1; for(let x=40;x<370;x+=40){ctx.beginPath();ctx.moveTo(x,MAP.y);ctx.lineTo(x,MAP.b);ctx.stroke()} for(let y=150;y<600;y+=40){ctx.beginPath();ctx.moveTo(MAP.x,y);ctx.lineTo(MAP.r,y);ctx.stroke()}
    (lv().waters||[]).forEach(drawFeature); (lv().parks||[]).forEach(drawFeature); drawBlocks(); lv().edges.forEach(drawRoad);
    (lv().pois||[]).forEach(po=>{ const w=Math.max(46,po.t.length*12+20); rr(po.x-w/2,po.y-13,w,26,13); ctx.fillStyle="#fffef8"; ctx.fill(); ctx.strokeStyle="#c6baaa"; ctx.lineWidth=1.3; ctx.stroke(); text(`${po.i||""} ${po.t}`,po.x,po.y,10,900,"center","#574b40"); });
    drawEdgeLabels(); drawRoute(); drawPins();
    rr(24,140,172,22,11); ctx.fillStyle="rgba(255,255,255,.78)"; ctx.fill(); text(lv().district,34,151,10,900,"left","#71675d");
    ctx.restore();
  }

  function drawEdgeLabels(){
    const drawn=new Set();
    lv().edges.forEach(ed=>{ if(!ed.label||drawn.has(ed.label)) return; drawn.add(ed.label); const a=node(ed.a),b=node(ed.b); const x=(a.x+b.x)/2,y=(a.y+b.y)/2; const col=ed.risk?C.red:ed.excuse?C.blue:"#7a6f63"; rr(x-32,y-10,64,20,10); ctx.fillStyle="rgba(255,255,255,.75)"; ctx.fill(); text(ed.label,x,y,9,850,"center",col); });
  }

  function drawRoute(){
    const ids=state.route; if(ids.length<2) return; ctx.save(); ctx.lineCap="round"; ctx.lineJoin="round"; ctx.strokeStyle="rgba(35,119,255,.22)"; ctx.lineWidth=20; ctx.beginPath(); ids.forEach((id,i)=>{const n=node(id); if(i)ctx.lineTo(n.x,n.y); else ctx.moveTo(n.x,n.y);}); ctx.stroke(); ctx.strokeStyle=state.result?.failed?C.red:C.route; ctx.lineWidth=9; ctx.beginPath(); ids.forEach((id,i)=>{const n=node(id); if(i)ctx.lineTo(n.x,n.y); else ctx.moveTo(n.x,n.y);}); ctx.stroke(); ctx.strokeStyle="rgba(255,255,255,.9)"; ctx.lineWidth=2.5; ctx.setLineDash([2,16]); ctx.beginPath(); ids.forEach((id,i)=>{const n=node(id); if(i)ctx.lineTo(n.x,n.y); else ctx.moveTo(n.x,n.y);}); ctx.stroke(); ctx.restore();
  }

  function drawPin(n,color,label,mark){ ctx.save(); ctx.translate(n.x,n.y); ctx.fillStyle="rgba(0,0,0,.15)"; ctx.beginPath(); ctx.ellipse(0,21,18,7,0,0,Math.PI*2); ctx.fill(); ctx.fillStyle=color; ctx.strokeStyle=C.ink; ctx.lineWidth=2.5; ctx.beginPath(); ctx.arc(0,-4,17,0,Math.PI*2); ctx.fill(); ctx.stroke(); ctx.beginPath(); ctx.moveTo(-9,9); ctx.lineTo(0,28); ctx.lineTo(9,9); ctx.closePath(); ctx.fill(); ctx.stroke(); text(mark,0,-5,15,950,"center",C.ink); ctx.restore(); rr(n.x-32,n.y+30,64,21,11); ctx.fillStyle="#fffef8"; ctx.fill(); ctx.strokeStyle="#a99c8c"; ctx.lineWidth=1.5; ctx.stroke(); text(label,n.x,n.y+41,10,900,"center"); }
  function drawPins(){ drawPin(node(lv().start),"#ffd64f",lv().pois?.[0]?.t||"起点","起"); drawPin(node(lv().end),"#28d578",lv().pois?.[1]?.t||"终点","终"); }

  function drawCar(x,y,ang,scale=1){
    ctx.save(); ctx.translate(x,y); ctx.rotate(ang); ctx.scale(scale,scale); ctx.fillStyle="rgba(0,0,0,.18)"; ctx.beginPath(); ctx.ellipse(0,16,28,10,0,0,Math.PI*2); ctx.fill(); ctx.fillStyle="#111"; [-18,13].forEach(xx=>[-17,11].forEach(yy=>{rr(xx,yy,12,7,3);ctx.fill()})); rr(-28,-15,58,30,10); ctx.fillStyle="#ffd238"; ctx.fill(); ctx.strokeStyle=C.ink; ctx.lineWidth=3; ctx.stroke(); rr(-9,-19,26,38,8); ctx.fillStyle="#86d1ff"; ctx.fill(); ctx.lineWidth=2; ctx.stroke(); rr(-3,-27,25,9,4); ctx.fillStyle="#fffaf0"; ctx.fill(); ctx.stroke(); text("TAXI",9,-22,6,950,"center"); ctx.fillStyle="#fff8b6"; ctx.beginPath(); ctx.arc(28,-8,3,0,Math.PI*2);ctx.arc(28,8,3,0,Math.PI*2);ctx.fill(); ctx.fillStyle="#e94338"; ctx.beginPath(); ctx.arc(-27,-8,2.6,0,Math.PI*2);ctx.arc(-27,8,2.6,0,Math.PI*2);ctx.fill(); ctx.restore();
  }

  function drawHeader(){
    const L = lv();
    const ev = evaluate();

    const reveal = state.status === "drive" || state.status === "result";
    const shownMoney = state.status === "drive"
      ? Math.round(state.car.money || L.base)
      : state.status === "result"
        ? ev.money
        : null;

    const shownKmLen = state.status === "drive"
      ? (state.car.doneLen || 0)
      : state.status === "result"
        ? ev.len
        : null;

    rr(14,14,W-28,105,18);
    ctx.fillStyle="#fff8e9";
    ctx.fill();
    ctx.strokeStyle=C.ink;
    ctx.lineWidth=3;
    ctx.stroke();

    text(`${L.name}   ${state.level+1}/10`,28,38,15,950);
    text(`乘客：${L.passenger}`,28,64,12,850,"left","#5d4025");
    text(`${L.wish.emoji} 目标：${L.wish.item}  ¥${L.target}`,28,91,12,900,"left","#5d4025");

    rr(276,24,82,40,12);
    ctx.fillStyle="#fff0b8";
    ctx.fill();
    ctx.strokeStyle=C.ink;
    ctx.lineWidth=2;
    ctx.stroke();
    text(reveal ? `¥${shownMoney}` : "¥??",317,44,20,950,"center");

    const kmLabel = shownKmLen === null ? "??km" : kmText(shownKmLen);
    text(`里程 ${kmLabel}`,317,74,11,900,"center","#5d4025");
    text(`疑 ${Math.min(999,ev.suspicion)}/${L.patience}`,317,96,11,900,"center",ev.suspicion>=L.patience?C.red:ev.suspicion>70?"#c36b00":C.green);
  }

  function drawBottom(){
    const ev = evaluate(), L = lv();
    rr(14,615,W-28,52,16);
    ctx.fillStyle="#fff8e9";
    ctx.fill();
    ctx.strokeStyle=C.ink;
    ctx.lineWidth=3;
    ctx.stroke();

    let msg = "沿道路拖动，经过路口会自动生成导航路线。";
    if(state.screen==="start"){
      msg = "点击画面开始接单。";
    } else if(state.screen==="hint"){
      msg = "点击提示关闭，然后从黄色起点沿道路画到绿色终点。";
    } else if(state.status==="preview"){
      msg = `路线已规划｜发车后揭晓收入和公里数｜怀疑 ${ev.suspicion}/${L.patience}`;
    } else if(state.status==="drive"){
      msg = `导航中：已开 ${kmText(state.car.doneLen || 0)}｜已赚 ¥${Math.round(state.car.money || L.base)}｜目标 ¥${L.target}`;
    } else if(state.status==="result"){
      msg = ev.pass
        ? `${"★".repeat(ev.stars)}${"☆".repeat(3-ev.stars)} 通关｜${kmText(ev.len)}｜¥${ev.money}｜买到 ${L.wish.emoji}`
        : ev.failed
          ? `失败：${kmText(ev.len)}｜乘客投诉了，怀疑值爆表。`
          : `未通关：${kmText(ev.len)}｜¥${ev.money}/${L.target}，还没够买 ${L.wish.emoji}`;
    }
    text(msg.slice(0,42),28,641,13,900,"left");
  }

  function drawStart(){ ctx.clearRect(0,0,W,H); const g=ctx.createLinearGradient(0,0,0,H); g.addColorStop(0,"#fff7df"); g.addColorStop(1,"#ffc978"); ctx.fillStyle=g; ctx.fillRect(0,0,W,H); ctx.save(); ctx.globalAlpha=.42; ctx.strokeStyle="#fff"; ctx.lineWidth=22; ctx.lineCap="round"; for(let i=0;i<6;i++){ctx.beginPath();ctx.moveTo(-40,140+i*82);ctx.bezierCurveTo(95,90+i*80,250,230+i*45,430,150+i*86);ctx.stroke()} ctx.strokeStyle="#ffd461"; ctx.lineWidth=11; for(let i=0;i<5;i++){ctx.beginPath();ctx.moveTo(36+i*72,80);ctx.lineTo(60+i*55,620);ctx.stroke()} ctx.restore(); rr(32,70,W-64,104,28); ctx.fillStyle="rgba(255,250,240,.92)"; ctx.fill(); ctx.strokeStyle=C.ink; ctx.lineWidth=3; ctx.stroke(); text("EVIL TAXI",W/2,105,32,950,"center"); text("绕路司机",W/2,143,22,950,"center","#ff7a1d"); drawCar(W/2,283,0,1.35); rr(52,370,W-104,118,24); ctx.fillStyle="rgba(255,250,240,.92)"; ctx.fill(); ctx.stroke(); text("闯关目标",W/2,399,18,950,"center"); text("赚够司机想买的东西",W/2,429,13,850,"center","#5e3b1e"); text("但别让乘客怀疑爆表",W/2,453,13,850,"center","#5e3b1e"); rr(70,522,W-140,54,24); ctx.fillStyle="#ff8a1f"; ctx.fill(); ctx.stroke(); text("点击开始接单",W/2,549,18,950,"center","#fffaf0"); text("路线图论版 / 10关难度递进",W/2,622,12,900,"center","#6b4b2e"); }

  function drawHint(){ if(state.screen!=="hint") return; const L=lv(); ctx.save(); ctx.fillStyle="rgba(29,26,22,.24)"; ctx.fillRect(0,0,W,H); rr(38,210,W-76,238,24); ctx.fillStyle="#fffaf0"; ctx.fill(); ctx.strokeStyle=C.ink; ctx.lineWidth=3; ctx.stroke(); text(`${L.wish.emoji} 本关目标`,W/2,244,20,950,"center"); text(L.wish.item,W/2,280,16,950,"center"); rr(76,310,W-152,40,20); ctx.fillStyle="#fff0b8"; ctx.fill(); ctx.strokeStyle=C.ink; ctx.lineWidth=2; ctx.stroke(); text(`赚到 ¥${L.target} 且怀疑 < ${L.patience}`,W/2,330,15,950,"center"); text("通关条件",66,376,13,950,"left","#7a5635"); text("1. 必须到达终点",82,400,12,850,"left","#5e3b1e"); text("2. 必须赚够目标金额",82,420,12,850,"left","#5e3b1e"); text("3. 不能被乘客投诉",82,440,12,850,"left","#5e3b1e"); text("点击任意位置关闭提示",W/2,474,13,950,"center",C.blue); ctx.restore(); }

  function draw(){ if(state.screen==="start"){drawStart();return;} ctx.fillStyle="#f5f3ec"; ctx.fillRect(0,0,W,H); drawHeader(); drawMap(); if(state.status==="drive"){
      const cp=carPoint();
      const sp=worldToScreen(cp);
      drawCar(sp.x, sp.y, cp.ang, .48);
    } else if(state.route.length<2){
      const s=worldToScreen(node(lv().start));
      drawCar(s.x, s.y - 28, -Math.PI/2, .42);
    } drawBottom(); drawHint(); }

  function routePoints(){ return state.route.map(id=>node(id)); }
  function carPoint(){ const pts=routePoints(); let idx=state.car.i; if(pts.length<2) return {x:node(lv().start).x,y:node(lv().start).y,ang:0}; idx=Math.min(idx,pts.length-2); const a=pts[idx],b=pts[idx+1],t=state.car.t; return {x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t,ang:Math.atan2(b.y-a.y,b.x-a.x)}; }

  function refresh(){ const ev=evaluate(), L=lv(); resetBtn.disabled = state.screen==="start" || state.status==="drive"; driveBtn.disabled = !(state.screen==="game" && state.status==="preview" && ev.ended); nextBtn.disabled = !(state.status==="result" && ev.pass); if(state.screen==="start") statusEl.textContent="点击画面开始接单。"; else if(state.screen==="hint") statusEl.textContent=`本关要赚 ¥${L.target} 买${L.wish.item}。点击画面关闭提示。`; else if(state.status==="draw") statusEl.textContent="从黄色起点出发，沿道路拖动到绿色终点。建筑、河面、非道路区域不能走。"; else if(state.status==="preview") statusEl.textContent=`路线完成。发车后才会揭晓收入和公里数。当前怀疑 ${ev.suspicion}/${L.patience}。${ev.risk.length?"危险路段："+ev.risk.join("、")+"。":""}${ev.excuse.length?"借口："+ev.excuse.join("、")+"。":""}`; else if(state.status==="drive") statusEl.textContent=`小车正在按你的路线跑：已开 ${kmText(state.car.doneLen || 0)}，收入实时上涨。`; else if(state.status==="result") statusEl.textContent=ev.pass?`通关！${ev.stars}星，开了 ${kmText(ev.len)}，赚到 ¥${ev.money}，可以买${L.wish.item}。`:ev.failed?`失败：开了 ${kmText(ev.len)}，怀疑值 ${ev.suspicion}/${L.patience}，乘客投诉了。`:`未通关：开了 ${kmText(ev.len)}，赚到 ¥${ev.money}，还没够 ¥${L.target}，需要更黑心一点。`; }

  function startDrive(){ const ev=evaluate(); if(!ev.ended) return; state.status="drive"; state.result=null; state.car={i:0,t:0,money:lv().base,doneLen:0,last:performance.now()}; refresh(); requestAnimationFrame(anim); }
  function anim(now){ if(state.status!=="drive") return; const pts=routePoints(); const dt=Math.min(34,now-(state.car.last||now)); state.car.last=now; let speed=2.75*dt/16.67; while(speed>0 && state.car.i<pts.length-1){ const a=pts[state.car.i], b=pts[state.car.i+1], seg=dist(a,b), remain=(1-state.car.t)*seg; if(speed<remain){ state.car.t += speed/seg; speed=0; } else { speed-=remain; state.car.i++; state.car.t=0; } }
    const doneLen = routeLen(state.route.slice(0,Math.min(state.car.i+1,state.route.length))) + (state.car.i<pts.length-1 ? dist(pts[state.car.i],pts[state.car.i+1])*state.car.t : 0); state.car.doneLen = doneLen; state.car.money=moneyFor(doneLen); draw();
    if(state.car.i>=pts.length-1){ const ev=evaluate(); state.result=ev; state.status="result"; if(ev.pass){ state.stars[state.level]=Math.max(state.stars[state.level],ev.stars); state.unlocked=Math.max(state.unlocked,state.level+1); } refresh(); draw(); } else requestAnimationFrame(anim);
  }

  function warn(msg){ const now=performance.now(); if(now-state.messageAt>350){state.messageAt=now; statusEl.textContent=msg;} }
  function startInput(evt){ evt.preventDefault(); if(state.screen==="start"){state.screen="hint"; refresh(); draw(); return;} if(state.screen==="hint"){state.screen="game"; refresh(); draw(); return;} if(state.status==="drive") return; const pt=pos(evt); const near=nearestNode(pt); if(near.id===lv().start || near.d<38 && dist(node(near.id),node(lv().start))<30){ state.route=[lv().start]; state.drawing=true; state.status="draw"; state.result=null; refresh(); draw(); } else warn("要从黄色起点附近开始画。"); }
  function moveInput(evt){ if(!state.drawing||state.status==="drive"||state.screen!=="game") return; evt.preventDefault(); const res=allowedNextFromPointer(pos(evt)); if(!res.ok){warn(res.msg); return;} if(res.next && res.next!==state.route[state.route.length-1]){ const last=state.route[state.route.length-1]; if(edgeBetween(last,res.next)){ state.route.push(res.next); if(res.next===lv().end) state.status="preview"; refresh(); draw(); } } }
  function endInput(evt){ if(!state.drawing) return; evt.preventDefault(); state.drawing=false; if(state.route[state.route.length-1]===lv().end) state.status="preview"; else state.status="draw"; refresh(); draw(); }

  function reset(showHint=false){ state.route=[]; state.drawing=false; state.status="draw"; state.result=null; state.car={i:0,t:0,money:lv().base,doneLen:0}; if(showHint) state.screen="hint"; refresh(); draw(); }
  function next(){ const ev=evaluate(); if(!ev.pass) return; if(state.level<levels.length-1){ state.level++; reset(true); } else { state.level=0; reset(true); statusEl.textContent="10关完成，重新从第1关开始。"; } }

  canvas.addEventListener("mousedown",startInput); canvas.addEventListener("mousemove",moveInput); window.addEventListener("mouseup",endInput);
  canvas.addEventListener("touchstart",startInput,{passive:false}); canvas.addEventListener("touchmove",moveInput,{passive:false}); canvas.addEventListener("touchend",endInput,{passive:false}); canvas.addEventListener("touchcancel",endInput,{passive:false});
  resetBtn.addEventListener("click",()=>reset(false)); driveBtn.addEventListener("click",startDrive); nextBtn.addEventListener("click",next);
  refresh(); draw();
})();
