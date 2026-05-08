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
  canvas.width = W * DPR;
  canvas.height = H * DPR;
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);

  const MAP = { l:14, t:132, w:362, h:470 };
  MAP.r = MAP.l + MAP.w; MAP.b = MAP.t + MAP.h;

  const C = {
    ink:"#1e1a16", bg:"#f6f4ec", block:"#ece7dc", blockLine:"#d8d1c4",
    local:"#ffffff", localEdge:"#d7d3cb", main:"#ffd876", mainEdge:"#e9b84e",
    highway:"#ffb15e", highwayEdge:"#e4872f", route:"#2878ff", water:"#b7ddff", park:"#d8efc9",
    red:"#df3b35", blue:"#277bdc", green:"#19b66a", yellow:"#ffd64f"
  };

  const R = (points, type="local", label="") => ({kind:"road", points, type, label});
  const RV = (x,y1,y2,type="local",label="") => R([[x,y1],[x,y2]],type,label);
  const RH = (y,x1,x2,type="local",label="") => R([[x1,y],[x2,y]],type,label);
  const B = (x,y,w,h) => [x,y,w,h];
  const F = (kind,x,y,w,h,label="") => ({kind,x,y,w,h,label});
  const L = (x,y,label,icon="") => ({kind:"landmark",x,y,label,icon});

  const maps = [
    { name:"居住区", district:"朝阳路 / 中山南路",
      blocks:[B(34,160,76,68),B(126,158,88,70),B(238,160,92,66),B(35,255,68,78),B(126,252,84,74),B(236,256,95,76),B(36,382,70,70),B(129,390,86,65),B(238,386,94,72),B(36,500,70,70),B(132,503,86,66),B(246,500,84,70)],
      features:[RV(64,148,586),RV(116,148,586),RV(230,148,586,"main","中山路"),RV(338,148,586),RH(185,30,350,"main","人民路"),RH(242,30,350),RH(350,30,350,"main","朝阳路"),RH(480,30,350),RH(560,30,350,"main","环城南路"),F("park",146,410,58,38,"社区公园"),L(260,284,"便利店","🏪")] },
    { name:"机场片区", district:"机场北路 / 航站大道",
      blocks:[B(34,176,90,74),B(146,172,85,80),B(259,174,71,76),B(34,284,72,62),B(128,286,106,62),B(259,282,72,66),B(34,386,90,78),B(150,390,76,70),B(255,386,76,74),B(48,502,72,54),B(150,506,74,50),B(252,506,75,48)],
      features:[RH(205,28,348,"highway","机场高速"),RH(315,28,348,"main","航站大道"),RH(420,28,348,"main","云港路"),RH(530,48,338),RV(78,170,556),RV(145,172,556,"main","机场北路"),RV(245,170,556),RV(336,170,556,"main","迎宾路"),R([[28,260],[95,260],[95,210],[190,210],[190,150]],"main","接机匝道"),L(74,152,"机场","✈️"),L(285,538,"酒店群","🏨")] },
    { name:"河桥城区", district:"东岸路 / 西岸路",
      blocks:[B(28,165,84,88),B(134,166,76,84),B(260,165,74,88),B(28,382,85,84),B(136,380,78,86),B(258,382,78,84),B(28,505,84,58),B(136,505,78,58),B(258,505,78,58)],
      features:[F("water",20,278,350,76,"内河"),RH(190,26,344,"main","北岸路"),RH(240,26,344),RH(480,26,344,"main","南岸路"),RH(560,26,344),RV(70,148,270),RV(70,358,586),RV(122,148,270),RV(122,358,586),RV(230,148,270,"main","东岸路"),RV(230,358,586,"main","东岸路"),RV(338,148,270),RV(338,358,586),R([[70,278],[70,250],[230,250],[230,278]],"main","北桥"),R([[122,354],[122,384],[338,384],[338,354]],"main","南桥"),R([[230,278],[230,354]],"highway","跨河大桥"),L(176,316,"跨河大桥","🌉")] },
    { name:"夜生活街区", district:"霓虹街 / 后巷",
      blocks:[B(32,160,74,68),B(120,160,72,68),B(208,160,74,68),B(294,160,40,68),B(34,260,74,72),B(122,260,70,72),B(208,260,76,72),B(298,260,36,72),B(34,380,72,84),B(122,382,72,82),B(208,382,74,82),B(294,380,40,84),B(34,500,94,65),B(152,500,90,65),B(266,500,68,65)],
      features:[RV(74,148,586,"main","霓虹街"),RV(160,148,586),RV(246,148,586),RV(320,148,586,"main","酒吧街"),RH(188,28,344,"main","饭店路"),RH(246,28,344),RH(350,28,344,"main","后巷"),RH(480,28,344),RH(560,28,344,"main","夜市路"),F("park",274,396,52,46,"小广场"),L(58,214,"饭店街","🍢"),L(300,406,"夜市","🌙")] },
    { name:"景区山道", district:"山门路 / 湖边线",
      blocks:[B(30,160,72,72),B(246,160,82,68),B(36,300,74,66),B(252,296,76,72),B(36,432,74,74),B(250,432,78,72)],
      features:[F("park",124,150,84,90,"山林"),F("park",124,262,84,106,"山林"),F("park",124,392,84,90,"山林"),F("water",224,505,114,48,"景区湖"),R([[60,560],[60,470],[110,470],[110,350],[80,350],[80,250],[120,250],[120,190],[185,190]],"main","盘山路"),R([[185,190],[245,190],[245,240],[320,240],[320,310]],"main","民宿路"),R([[110,470],[180,470],[180,410],[245,410],[245,350],[300,350],[300,310]],"local","湖边支路"),R([[180,470],[180,530],[320,530]],"local","湖岸路"),L(162,176,"观景台","📸"),L(304,310,"民宿","🏡")] },
    { name:"医院片区", district:"健康路 / 救护车道",
      blocks:[B(36,170,84,70),B(146,170,72,70),B(248,170,84,70),B(36,276,72,70),B(146,278,72,68),B(258,278,72,68),B(40,404,70,70),B(146,404,74,70),B(258,404,70,70),B(40,516,70,50),B(148,516,72,50),B(258,516,72,50)],
      features:[RH(205,30,344,"main","健康路"),RH(312,30,344,"main","急诊路"),RH(438,30,344),RH(540,30,344),RV(74,152,576,"main","医院西路"),RV(132,152,576),RV(236,152,576),RV(338,152,576,"main","医院东路"),R([[236,152],[236,250],[180,250],[180,312]],"main","急救通道"),R([[132,438],[180,438],[180,540]],"local","后门小路"),L(78,146,"医院","🏥"),L(84,432,"救护车道","🚑")] },
    { name:"老城区", district:"菜市口 / 老巷",
      blocks:[B(32,155,66,74),B(118,160,64,68),B(202,156,56,66),B(280,154,52,70),B(42,262,56,56),B(126,260,54,52),B(206,262,50,50),B(282,258,48,56),B(36,362,68,72),B(122,364,58,58),B(206,362,58,60),B(278,358,56,66),B(34,480,82,80),B(138,486,78,74),B(240,482,88,80)],
      features:[R([[70,150],[70,580]],"main","菜市口"),R([[110,185],[340,185]]),R([[110,240],[320,240]]),R([[70,335],[340,335]],"main","和平路"),R([[92,450],[340,450]]),R([[140,150],[140,580]]),R([[236,150],[236,580]]),R([[320,150],[320,580]],"main","老城东路"),R([[70,580],[140,580],[140,520],[236,520],[236,580],[320,580]]),F("park",50,410,90,80,"街心公园"),L(76,172,"菜场","🥬"),L(298,210,"熟人街","👀")] },
    { name:"会展新区", district:"会展大道 / 商务环线",
      blocks:[B(34,170,74,70),B(128,170,72,70),B(220,170,112,70),B(34,278,74,70),B(126,278,72,70),B(222,278,110,70),B(34,390,74,76),B(126,390,74,76),B(224,390,108,76),B(56,510,78,50),B(164,510,78,50),B(272,510,60,50)],
      features:[RH(205,28,344,"main","会展大道"),RH(315,28,344,"main","商务路"),RH(430,28,344),RH(530,56,338),RV(72,154,560,"main","展馆西路"),RV(112,154,560),RV(212,154,560),RV(338,154,560,"main","展馆东路"),R([[28,350],[180,350],[180,270],[338,270]],"highway","商务环线"),R([[72,430],[72,530],[180,530],[180,430]],"local","酒店支路"),F("park",250,190,62,42,"会展绿地"),L(58,344,"展馆","🏢"),L(294,532,"酒店","🏨")] },
    { name:"跨江两岸", district:"滨江路 / 大桥匝道",
      blocks:[B(34,160,76,74),B(36,430,76,76),B(130,160,86,76),B(130,430,86,76),B(274,160,56,76),B(274,430,56,76)],
      features:[F("water",20,248,350,152,"江面"),RH(195,28,344,"main","北滨江路"),RH(540,28,344,"main","南滨江路"),RV(72,150,242),RV(72,406,576),RV(174,150,242,"main","西岸路"),RV(174,406,576,"main","西岸路"),RV(236,150,242),RV(236,406,576),RV(320,150,242,"main","东岸路"),RV(320,406,576,"main","东岸路"),R([[72,248],[72,290],[156,290],[156,356],[250,356],[250,400]],"main","绕江桥"),R([[174,248],[174,320],[236,320],[236,248]],"highway","最快桥"),R([[320,248],[320,200],[236,200],[236,150]],"local","公寓匝道"),L(77,540,"码头","⛴️"),L(188,318,"大桥","🌉") ] },
    { name:"终极城市圈", district:"机场线 / 城市环线",
      blocks:[B(32,155,60,62),B(112,155,68,62),B(204,155,56,62),B(278,155,54,62),B(34,254,56,56),B(114,252,62,60),B(204,250,58,62),B(278,252,54,58),B(34,356,56,56),B(114,354,62,60),B(204,352,58,62),B(278,354,54,58),B(34,460,60,60),B(112,458,66,64),B(204,458,58,64),B(278,458,54,64),B(36,540,58,36),B(114,540,60,36),B(204,540,56,36),B(278,540,54,36)],
      features:[RH(186,28,344,"main","机场辅路"),RH(242,28,344),RH(338,28,344,"main","城市中轴"),RH(438,28,344,"main","南环路"),RH(530,28,344),RH(576,28,344,"main","园区路"),RV(64,148,586,"main","西环"),RV(104,148,586),RV(190,148,586),RV(270,148,586,"main","东环"),RV(338,148,586,"main","机场路"),R([[64,438],[104,438],[104,338],[190,338],[190,242],[270,242],[270,186],[338,186]],"highway","城市环线"),R([[190,576],[190,530],[270,530],[270,438],[338,438],[338,338]],"highway","机场联络线"),R([[64,338],[64,242],[104,242],[104,186]],"local","老路"),F("park",52,338,48,62,"事故点"),F("water",228,494,104,26,"景观河"),L(66,575,"园区","💼"),L(320,186,"机场","✈️")] }
  ];

  const levels = [
    { name:"第1关：新手绕小区", passenger:"赶时间的上班族", map:maps[0], start:{x:64,y:560,label:"小区"}, end:{x:338,y:185,label:"公司"}, base:8, rate:.055, target:40, wish:{item:"司机想买一杯大杯奶茶",emoji:"🧋"}, maxSuspicion:82, suspiciousZones:[{type:"circle",x:192,y:350,r:46,label:"乘客熟悉路",penalty:28}], excuseZones:[{type:"rect",x:255,y:335,w:80,h:78,label:"修路",bonus:14}]},
    { name:"第2关：机场接单", passenger:"外地游客", map:maps[1], start:{x:78,y:170,label:"机场"}, end:{x:336,y:530,label:"酒店"}, base:18, rate:.06, target:58, wish:{item:"司机想买一张洗车券",emoji:"🧽"}, maxSuspicion:86, suspiciousZones:[{type:"rect",x:118,y:238,w:118,h:68,label:"机场快线",penalty:26},{type:"circle",x:288,y:300,r:34,label:"导航提示",penalty:18}], excuseZones:[{type:"circle",x:100,y:438,r:44,label:"高架入口",bonus:13}]},
    { name:"第3关：雨天绕桥", passenger:"怕堵车的情侣", map:maps[2], start:{x:70,y:560,label:"商场"}, end:{x:338,y:480,label:"影院"}, base:10, rate:.07, target:50, wish:{item:"司机想买一副车载墨镜",emoji:"🕶️"}, maxSuspicion:78, suspiciousZones:[{type:"rect",x:130,y:456,w:126,h:80,label:"直达桥",penalty:35}], excuseZones:[{type:"rect",x:200,y:245,w:110,h:80,label:"积水绕行",bonus:18}]},
    { name:"第4关：夜宵单", passenger:"喝多的老板", map:maps[3], start:{x:74,y:188,label:"饭店"}, end:{x:320,y:188,label:"家"}, base:12, rate:.075, target:55, wish:{item:"司机想买一瓶高级香氛",emoji:"🌲"}, maxSuspicion:80, suspiciousZones:[{type:"rect",x:126,y:180,w:140,h:80,label:"一眼直路",penalty:38},{type:"circle",x:194,y:470,r:42,label:"熟人街",penalty:23}], excuseZones:[{type:"circle",x:305,y:405,r:40,label:"夜间施工",bonus:18}]},
    { name:"第5关：景区迷路", passenger:"拍照游客", map:maps[4], start:{x:60,y:560,label:"景区门"}, end:{x:320,y:310,label:"民宿"}, base:16, rate:.065, target:62, wish:{item:"司机想买一套车内脚垫",emoji:"🧩"}, maxSuspicion:84, suspiciousZones:[{type:"circle",x:270,y:450,r:50,label:"地图标路",penalty:30}], excuseZones:[{type:"rect",x:78,y:290,w:108,h:76,label:"观景台",bonus:16},{type:"circle",x:246,y:210,r:32,label:"单行道",bonus:9}]},
    { name:"第6关：医院急单", passenger:"有点急的家属", map:maps[5], start:{x:338,y:540,label:"社区"}, end:{x:74,y:152,label:"医院"}, base:15, rate:.06, target:60, wish:{item:"司机想买一箱功能饮料",emoji:"🥤"}, maxSuspicion:70, suspiciousZones:[{type:"rect",x:132,y:282,w:132,h:92,label:"医院主路",penalty:42}], excuseZones:[{type:"circle",x:85,y:430,r:45,label:"救护车道",bonus:16}]},
    { name:"第7关：老城区", passenger:"本地阿姨", map:maps[6], start:{x:70,y:150,label:"菜场"}, end:{x:320,y:580,label:"小区"}, base:9, rate:.082, target:64, wish:{item:"司机想买一个新手机支架",emoji:"📱"}, maxSuspicion:68, suspiciousZones:[{type:"circle",x:185,y:330,r:62,label:"阿姨熟路",penalty:45},{type:"rect",x:248,y:150,w:70,h:82,label:"老邻居",penalty:20}], excuseZones:[{type:"rect",x:55,y:410,w:95,h:80,label:"限行",bonus:20}]},
    { name:"第8关：会展中心", passenger:"外企客户", map:maps[7], start:{x:72,y:350,label:"展馆"}, end:{x:338,y:530,label:"酒店"}, base:20, rate:.072, target:70, wish:{item:"司机想买一副蓝牙耳机",emoji:"🎧"}, maxSuspicion:75, suspiciousZones:[{type:"rect",x:132,y:308,w:128,h:76,label:"主干道",penalty:38},{type:"circle",x:295,y:510,r:40,label:"导航绿线",penalty:24}], excuseZones:[{type:"circle",x:102,y:520,r:42,label:"环线入口",bonus:14},{type:"rect",x:242,y:180,w:88,h:74,label:"临时管制",bonus:15}]},
    { name:"第9关：跨江订单", passenger:"开着导航的乘客", map:maps[8], start:{x:72,y:540,label:"码头"}, end:{x:320,y:150,label:"公寓"}, base:18, rate:.075, target:76, wish:{item:"司机想买一个车载大屏",emoji:"📺"}, maxSuspicion:64, suspiciousZones:[{type:"rect",x:150,y:315,w:110,h:88,label:"最快桥",penalty:45},{type:"circle",x:295,y:395,r:38,label:"导航盯着",penalty:24}], excuseZones:[{type:"rect",x:52,y:235,w:92,h:75,label:"封桥绕行",bonus:22}]},
    { name:"第10关：终极黑车王", passenger:"很懂路的产品经理", map:maps[9], start:{x:64,y:576,label:"园区"}, end:{x:338,y:186,label:"机场"}, base:26, rate:.082, target:92, wish:{item:"司机想攒二手跑车首付",emoji:"🏎️"}, maxSuspicion:58, suspiciousZones:[{type:"rect",x:120,y:365,w:155,h:78,label:"官方推荐路",penalty:45},{type:"circle",x:280,y:245,r:42,label:"乘客常走",penalty:28},{type:"circle",x:98,y:210,r:36,label:"明显反向",penalty:25}], excuseZones:[{type:"rect",x:205,y:500,w:95,h:70,label:"高架绕行",bonus:18},{type:"circle",x:85,y:360,r:42,label:"事故点",bonus:17}]}
  ];

  const state = { screen:"start", levelIndex:0, route:[], drawing:false, status:"draw", result:null, lastWarn:0, anim:{distance:0,speed:3.05,lastTime:0,money:0,car:{x:0,y:0,angle:0}} };
  const level = () => levels[state.levelIndex];
  const roads = () => level().map.features.filter(f => f.kind === "road");
  const clamp = (v,a,b) => Math.max(a, Math.min(b, v));
  const dist = (a,b) => Math.hypot(a.x-b.x, a.y-b.y);
  const routeLen = r => r.reduce((s,p,i)=> i ? s + dist(r[i-1], p) : 0, 0);
  const insideRect = (p,b,pad=0) => p.x>=b[0]-pad && p.x<=b[0]+b[2]+pad && p.y>=b[1]-pad && p.y<=b[1]+b[3]+pad;
  // Only treat a point as “inside a building” if it is NOT actually on/near a road.
  // Roads visually pass through some city blocks; the old check marked those road points as buildings,
  // which made suspicion jump to 100 immediately.
  const inBuilding = p => level().map.blocks.some(b => insideRect(p,b,-1)) && nearestRoad(p).d > 18;
  const inMap = p => p.x>=MAP.l+8 && p.x<=MAP.r-8 && p.y>=MAP.t+8 && p.y<=MAP.b-8;

  function pointer(evt){ const e=evt.touches?evt.touches[0]:evt; const r=canvas.getBoundingClientRect(); return {x:(e.clientX-r.left)*W/r.width,y:(e.clientY-r.top)*H/r.height}; }
  function segNearest(p,a,b){ const vx=b[0]-a[0],vy=b[1]-a[1], wx=p.x-a[0],wy=p.y-a[1]; const t=clamp((vx*wx+vy*wy)/(vx*vx+vy*vy||1),0,1); const x=a[0]+vx*t,y=a[1]+vy*t; return {x,y,d:Math.hypot(p.x-x,p.y-y)}; }
  function nearestRoad(p){ let best={x:p.x,y:p.y,d:9999,road:null}; for(const r of roads()){ for(let i=1;i<r.points.length;i++){ const n=segNearest(p,r.points[i-1],r.points[i]); if(n.d<best.d) best={...n,road:r}; } } return best; }
  function snap(p){
    if(!inMap(p)) return {ok:false,reason:"路线不能画出地图边界。"};
    const n=nearestRoad(p);
    if(n.d>34){
      if(level().map.blocks.some(b => insideRect(p,b,-1))) return {ok:false,reason:"建筑物上不能画路线，请沿道路绕过去。"};
      return {ok:false,reason:"这里只不是道路，路线要沿道路画。"};
    }
    return {ok:true,point:{x:n.x,y:n.y}};
  }

  function inZone(p,z){ return z.type==="circle" ? Math.hypot(p.x-z.x,p.y-z.y)<=z.r : p.x>=z.x&&p.x<=z.x+z.w&&p.y>=z.y&&p.y<=z.y+z.h; }
  function evalRoute(route){
    const lv=level();
    if(route.length<2) return {valid:false,reason:"路线太短了。",length:0,ratio:0,suspicion:0,money:lv.base,stars:0};
    const length=routeLen(route), shortest=dist(lv.start,lv.end), ratio=length/Math.max(1,shortest);
    let suspicion=Math.max(0,(ratio-1.18)*34), hitSuspicious=[], hitExcuse=[];
    for(const z of lv.suspiciousZones) if(route.some(p=>inZone(p,z))){ suspicion+=z.penalty; hitSuspicious.push(z.label); }
    for(const z of lv.excuseZones) if(route.some(p=>inZone(p,z))){ suspicion-=z.bonus; hitExcuse.push(z.label); }
    if(ratio>2.05&&!hitExcuse.length) suspicion+=18; if(ratio>2.6) suspicion+=20;
    const hitBuilding=route.some(inBuilding), offRoad=route.some(p=>nearestRoad(p).d>24);
    // Do not convert route-validity errors into max suspicion.
    // Suspicion should reflect “passenger doubt”, while off-road/building errors are handled as invalid routes.
    suspicion=Math.max(0,Math.round(suspicion));
    const money=Math.round(lv.base+length*lv.rate), startOk=dist(route[0],lv.start)<52, endOk=dist(route[route.length-1],lv.end)<55;
    const valid=startOk&&endOk&&!hitBuilding&&!offRoad, fail=valid&&suspicion>=100;
    let reason="可以发车。";
    if(!startOk) reason="要从黄色起点附近开始画路线。"; else if(!endOk) reason="路线最后要接到绿色终点。"; else if(hitBuilding) reason="路线压到建筑物了。"; else if(offRoad) reason="路线没有完全沿道路行驶。"; else if(fail) reason="乘客怀疑值爆表，被发现了。";
    let stars=1; if(valid&&!fail&&money>=lv.target&&suspicion<=lv.maxSuspicion) stars=3; else if(valid&&!fail&&money>=Math.round(lv.target*.78)) stars=2;
    return {valid,fail,reason,length,shortest,ratio,suspicion,money,hitSuspicious,hitExcuse,stars};
  }

  function pointAt(route,travel){
    if(!route.length) return {x:level().start.x,y:level().start.y,angle:0};
    let left=travel; for(let i=1;i<route.length;i++){ const a=route[i-1],b=route[i],s=dist(a,b); if(left<=s){ const t=s?left/s:0; return {x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t,angle:Math.atan2(b.y-a.y,b.x-a.x)}; } left-=s; }
    const a=route[route.length-2]||route[0],b=route[route.length-1]; return {x:b.x,y:b.y,angle:Math.atan2(b.y-a.y,b.x-a.x)};
  }

  function rr(x,y,w,h,r){ const q=Math.min(r,w/2,h/2); ctx.beginPath(); ctx.moveTo(x+q,y); ctx.arcTo(x+w,y,x+w,y+h,q); ctx.arcTo(x+w,y+h,x,y+h,q); ctx.arcTo(x,y+h,x,y,q); ctx.arcTo(x,y,x+w,y,q); ctx.closePath(); }
  function text(t,x,y,s=14,w=800,a="left",c=C.ink){ ctx.save(); ctx.font=`${w} ${s}px -apple-system,BlinkMacSystemFont,"PingFang SC","Microsoft YaHei",Arial`; ctx.textAlign=a; ctx.textBaseline="middle"; ctx.fillStyle=c; ctx.fillText(t,x,y); ctx.restore(); }
  function wrap(t,x,y,max,lineH,s=13,w=800,c=C.ink){ ctx.save(); ctx.font=`${w} ${s}px -apple-system,BlinkMacSystemFont,"PingFang SC","Microsoft YaHei",Arial`; ctx.fillStyle=c; ctx.textBaseline="middle"; let line="", yy=y; for(const ch of t){ const test=line+ch; if(ctx.measureText(test).width>max&&line){ ctx.fillText(line,x,yy); line=ch; yy+=lineH; } else line=test; } if(line) ctx.fillText(line,x,yy); ctx.restore(); }

  function drawRoad(f){
    const edge=f.type==="highway"?C.highwayEdge:f.type==="main"?C.mainEdge:C.localEdge;
    const fill=f.type==="highway"?C.highway:f.type==="main"?C.main:C.local;
    const ew=f.type==="highway"?25:f.type==="main"?23:18, fw=f.type==="highway"?18:f.type==="main"?16:12;
    ctx.save(); ctx.lineCap="round"; ctx.lineJoin="round";
    ctx.strokeStyle=edge; ctx.lineWidth=ew; ctx.beginPath(); ctx.moveTo(f.points[0][0],f.points[0][1]); for(let i=1;i<f.points.length;i++) ctx.lineTo(f.points[i][0],f.points[i][1]); ctx.stroke();
    ctx.strokeStyle=fill; ctx.lineWidth=fw; ctx.beginPath(); ctx.moveTo(f.points[0][0],f.points[0][1]); for(let i=1;i<f.points.length;i++) ctx.lineTo(f.points[i][0],f.points[i][1]); ctx.stroke();
    if(f.type!=="local"){ ctx.strokeStyle="rgba(255,255,255,.58)"; ctx.lineWidth=2; ctx.setLineDash([14,14]); ctx.beginPath(); ctx.moveTo(f.points[0][0],f.points[0][1]); for(let i=1;i<f.points.length;i++) ctx.lineTo(f.points[i][0],f.points[i][1]); ctx.stroke(); ctx.setLineDash([]); }
    if(f.label){ const m=f.points[Math.floor(f.points.length/2)]; rr(m[0]-30,m[1]-9,60,18,9); ctx.fillStyle="rgba(255,255,255,.72)"; ctx.fill(); text(f.label,m[0],m[1],9,800,"center","#74685c"); }
    ctx.restore();
  }

  function drawFeature(f){
    if(f.kind==="water"){ rr(f.x,f.y,f.w,f.h,14); ctx.fillStyle=C.water; ctx.fill(); ctx.lineWidth=2; ctx.strokeStyle="#75b9ef"; ctx.stroke(); text(f.label,f.x+f.w/2,f.y+f.h/2,11,900,"center","#2c78b9"); }
    else if(f.kind==="park"){ rr(f.x,f.y,f.w,f.h,14); ctx.fillStyle=C.park; ctx.fill(); ctx.lineWidth=2; ctx.strokeStyle="#98ca78"; ctx.stroke(); text(f.label,f.x+f.w/2,f.y+f.h/2,11,900,"center","#3e853c"); }
    else if(f.kind==="landmark"){ const w=Math.max(50,f.label.length*10+(f.icon?18:0)); rr(f.x-w/2,f.y-12,w,24,12); ctx.fillStyle="#fffef8"; ctx.fill(); ctx.lineWidth=1.5; ctx.strokeStyle="#cabfae"; ctx.stroke(); text((f.icon?f.icon+" ":"")+f.label,f.x,f.y,10,900,"center","#55483c"); }
  }

  function drawZones(){
    const lv=level();
    for(const z of lv.excuseZones){ ctx.save(); ctx.fillStyle="rgba(39,123,220,.12)"; ctx.strokeStyle=C.blue; ctx.lineWidth=2.5; ctx.setLineDash([8,6]); if(z.type==="circle"){ctx.beginPath();ctx.arc(z.x,z.y,z.r,0,Math.PI*2);ctx.fill();ctx.stroke();text(z.label,z.x,z.y,12,900,"center","#1d5f96");}else{rr(z.x,z.y,z.w,z.h,14);ctx.fill();ctx.stroke();text(z.label,z.x+z.w/2,z.y+z.h/2,12,900,"center","#1d5f96");} ctx.restore(); }
    for(const z of lv.suspiciousZones){ ctx.save(); ctx.fillStyle="rgba(223,59,53,.12)"; ctx.strokeStyle=C.red; ctx.lineWidth=2.5; ctx.setLineDash([7,6]); if(z.type==="circle"){ctx.beginPath();ctx.arc(z.x,z.y,z.r,0,Math.PI*2);ctx.fill();ctx.stroke();text(z.label,z.x,z.y,12,900,"center","#b9231f");}else{rr(z.x,z.y,z.w,z.h,14);ctx.fill();ctx.stroke();text(z.label,z.x+z.w/2,z.y+z.h/2,12,900,"center","#b9231f");} ctx.restore(); }
  }

  function drawMap(){
    const m=level().map; rr(MAP.l,MAP.t,MAP.w,MAP.h,20); ctx.fillStyle=C.bg; ctx.fill(); ctx.lineWidth=3; ctx.strokeStyle=C.ink; ctx.stroke();
    ctx.save(); ctx.beginPath(); rr(MAP.l+2,MAP.t+2,MAP.w-4,MAP.h-4,18); ctx.clip(); ctx.fillStyle=C.bg; ctx.fillRect(MAP.l+2,MAP.t+2,MAP.w-4,MAP.h-4);
    ctx.strokeStyle="rgba(180,170,155,.18)"; ctx.lineWidth=1; for(let x=40;x<360;x+=40){ctx.beginPath();ctx.moveTo(x,MAP.t+2);ctx.lineTo(x,MAP.b-2);ctx.stroke();} for(let y=160;y<590;y+=40){ctx.beginPath();ctx.moveTo(MAP.l+2,y);ctx.lineTo(MAP.r-2,y);ctx.stroke();}
    for(const f of m.features) if(f.kind==="water"||f.kind==="park") drawFeature(f);
    for(const b of m.blocks){ rr(b[0],b[1],b[2],b[3],8); ctx.fillStyle=C.block; ctx.fill(); ctx.lineWidth=1.5; ctx.strokeStyle=C.blockLine; ctx.stroke(); }
    for(const f of m.features) if(f.kind==="road") drawRoad(f);
    for(const f of m.features) if(f.kind==="landmark") drawFeature(f);
    drawZones(); rr(24,140,166,22,11); ctx.fillStyle="rgba(255,255,255,.78)"; ctx.fill(); text(m.district,34,151,10,900,"left","#80746a"); ctx.restore();
  }

  function drawHeader(){
    const lv=level(), e=evalRoute(state.route), money=state.status==="drive"?Math.round(state.anim.money):e.money, suspicion=e.suspicion||0;
    const sc=suspicion>=85?C.red:suspicion>=55?"#c46b00":C.green;
    rr(14,14,W-28,105,18); ctx.fillStyle="#fff8e9"; ctx.fill(); ctx.lineWidth=3; ctx.strokeStyle=C.ink; ctx.stroke();
    text(lv.name,28,38,16,950); text(`乘客：${lv.passenger}`,28,64,12,800,"left","#5e3b1e"); text(`${lv.wish.emoji} ${lv.wish.item}`,28,91,12,900,"left","#5e3b1e");
    rr(275,26,84,34,12); ctx.fillStyle="#fff2bd"; ctx.fill(); ctx.lineWidth=2; ctx.strokeStyle=C.ink; ctx.stroke(); text(`¥${money}`,317,44,22,950,"center"); text(`目标 ¥${lv.target}`,318,70,11,900,"center","#7a5635"); text(`怀疑 ${Math.min(100,suspicion)}/100`,318,94,12,900,"center",sc);
  }

  function drawPin(p,color,label,mark){
    ctx.save(); ctx.translate(p.x,p.y); ctx.fillStyle="rgba(0,0,0,.14)"; ctx.beginPath(); ctx.ellipse(0,20,18,7,0,0,Math.PI*2); ctx.fill(); ctx.fillStyle=color; ctx.strokeStyle=C.ink; ctx.lineWidth=2.5; ctx.beginPath(); ctx.arc(0,-4,17,0,Math.PI*2); ctx.fill(); ctx.stroke(); ctx.beginPath(); ctx.moveTo(-9,9); ctx.lineTo(0,29); ctx.lineTo(9,9); ctx.closePath(); ctx.fill(); ctx.stroke(); text(mark,0,-5,15,950,"center"); ctx.restore();
    rr(p.x-34,p.y+30,68,21,10); ctx.fillStyle="#fffef8"; ctx.fill(); ctx.lineWidth=1.8; ctx.strokeStyle="#a99c8c"; ctx.stroke(); text(label,p.x,p.y+41,10,900,"center");
  }

  function drawRoute(route,color=C.route){ if(route.length<2) return; ctx.save(); ctx.lineCap="round"; ctx.lineJoin="round"; ctx.strokeStyle="rgba(20,72,160,.22)"; ctx.lineWidth=18; ctx.beginPath(); ctx.moveTo(route[0].x,route[0].y); for(let i=1;i<route.length;i++) ctx.lineTo(route[i].x,route[i].y); ctx.stroke(); ctx.strokeStyle=color; ctx.lineWidth=8; ctx.beginPath(); ctx.moveTo(route[0].x,route[0].y); for(let i=1;i<route.length;i++) ctx.lineTo(route[i].x,route[i].y); ctx.stroke(); ctx.strokeStyle="rgba(255,255,255,.85)"; ctx.lineWidth=2.5; ctx.setLineDash([1,18]); ctx.beginPath(); ctx.moveTo(route[0].x,route[0].y); for(let i=1;i<route.length;i++) ctx.lineTo(route[i].x,route[i].y); ctx.stroke(); ctx.restore(); }

  function drawCar(x,y,angle,scale=1){
    ctx.save(); ctx.translate(x,y); ctx.rotate(angle); ctx.scale(scale,scale);
    ctx.fillStyle="rgba(0,0,0,.18)"; ctx.beginPath(); ctx.ellipse(1,16,28,11,0,0,Math.PI*2); ctx.fill();
    ctx.fillStyle="#111"; rr(-20,-18,12,7,3); ctx.fill(); rr(-20,11,12,7,3); ctx.fill(); rr(13,-18,12,7,3); ctx.fill(); rr(13,11,12,7,3); ctx.fill();
    rr(-28,-15,58,30,10); ctx.fillStyle="#ffd238"; ctx.fill(); ctx.lineWidth=3; ctx.strokeStyle=C.ink; ctx.stroke();
    ctx.strokeStyle="rgba(30,26,22,.45)"; ctx.lineWidth=1.5; ctx.beginPath(); ctx.moveTo(12,-14); ctx.lineTo(12,14); ctx.moveTo(-17,-14); ctx.lineTo(-17,14); ctx.stroke();
    rr(-9,-19,25,38,8); ctx.fillStyle="#83cfff"; ctx.fill(); ctx.lineWidth=2; ctx.strokeStyle=C.ink; ctx.stroke();
    ctx.strokeStyle="rgba(255,255,255,.75)"; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(4,-14); ctx.lineTo(13,-5); ctx.moveTo(-5,9); ctx.lineTo(8,17); ctx.stroke();
    rr(-3,-27,24,9,4); ctx.fillStyle="#fffaf0"; ctx.fill(); ctx.strokeStyle=C.ink; ctx.lineWidth=2; ctx.stroke(); text("TAXI",9,-22,6,950,"center");
    ctx.fillStyle="#fff7b8"; ctx.beginPath(); ctx.arc(28,-8,3,0,Math.PI*2); ctx.arc(28,8,3,0,Math.PI*2); ctx.fill(); ctx.fillStyle="#e94338"; ctx.beginPath(); ctx.arc(-27,-8,2.6,0,Math.PI*2); ctx.arc(-27,8,2.6,0,Math.PI*2); ctx.fill(); ctx.restore();
  }

  function drawBottom(){
    const lv=level(), e=evalRoute(state.route); rr(14,615,W-28,52,16); ctx.fillStyle="#fff8e9"; ctx.fill(); ctx.lineWidth=3; ctx.strokeStyle=C.ink; ctx.stroke();
    let msg="点击提示后开始画：路线会自动吸附到道路，不能穿建筑。";
    if(state.screen==="start") msg="点击画面开始接单。"; else if(state.screen==="hint") msg="点击提示关闭后，从黄色起点沿道路画到绿色终点。"; else if(state.status==="preview") msg=`预计收入 ¥${e.money} / ${lv.wish.item}｜绕路 ${e.ratio.toFixed(2)}x｜怀疑 ${e.suspicion}/100`; else if(state.status==="drive") msg=`正在绕路：已赚 ¥${Math.round(state.anim.money)}，目标 ¥${lv.target}……`; else if(state.status==="result") msg=e.fail?`失败：${e.reason}`:`${"★".repeat(e.stars)}${"☆".repeat(3-e.stars)}  收入 ¥${e.money}｜${e.money>=lv.target?"买到了":"还差一点"} ${lv.wish.emoji}`;
    text(msg.slice(0,38),28,641,13,900);
  }

  function drawHint(){
    if(state.screen!=="hint") return; const lv=level(); ctx.save(); ctx.fillStyle="rgba(30,26,22,.24)"; ctx.fillRect(0,0,W,H); rr(38,214,W-76,224,24); ctx.fillStyle="#fffaf0"; ctx.fill(); ctx.lineWidth=3; ctx.strokeStyle=C.ink; ctx.stroke(); text(`${lv.wish.emoji} 本关目标`,W/2,246,20,950,"center"); wrap(lv.wish.item,67,282,255,22,15,900); rr(72,320,W-144,38,18); ctx.fillStyle="#fff0b8"; ctx.fill(); ctx.lineWidth=2; ctx.strokeStyle=C.ink; ctx.stroke(); text(`赚到 ¥${lv.target} 就能买`,W/2,339,16,950,"center"); text("规则",67,378,13,950,"left","#7a5635"); text("• 蓝色路线会吸附道路",80,401,12,850,"left","#5e3b1e"); text("• 建筑物上不能画路线",80,421,12,850,"left","#5e3b1e"); text("点击任意位置关闭提示",W/2,462,13,950,"center",C.blue); ctx.restore();
  }

  function drawStart(){
    ctx.clearRect(0,0,W,H); const g=ctx.createLinearGradient(0,0,0,H); g.addColorStop(0,"#fff5d9"); g.addColorStop(1,"#ffd48a"); ctx.fillStyle=g; ctx.fillRect(0,0,W,H);
    ctx.save(); ctx.globalAlpha=.42; ctx.strokeStyle="#fff"; ctx.lineWidth=22; ctx.lineCap="round"; for(let i=0;i<6;i++){ctx.beginPath();ctx.moveTo(-40,150+i*80);ctx.bezierCurveTo(80,100+i*90,250,230+i*50,430,160+i*90);ctx.stroke();} ctx.strokeStyle="#ffd063"; ctx.lineWidth=11; for(let i=0;i<5;i++){ctx.beginPath();ctx.moveTo(30+i*72,90);ctx.lineTo(60+i*55,610);ctx.stroke();} ctx.restore();
    rr(30,72,W-60,96,26); ctx.fillStyle="rgba(255,250,240,.9)"; ctx.fill(); ctx.lineWidth=3; ctx.strokeStyle=C.ink; ctx.stroke(); text("EVIL TAXI",W/2,105,32,950,"center"); text("绕路司机",W/2,142,22,950,"center","#ff7a1d"); drawCar(W/2,278,0,1.75);
    rr(54,364,W-108,116,24); ctx.fillStyle="rgba(255,250,240,.92)"; ctx.fill(); ctx.lineWidth=3; ctx.strokeStyle=C.ink; ctx.stroke(); text("目标：绕得够远，但别被发现",W/2,394,17,950,"center"); text("每关司机都有一个想买的东西",W/2,426,13,850,"center","#5e3b1e"); text("赚够钱，才算黑心得漂亮",W/2,450,13,850,"center","#5e3b1e");
    rr(70,520,W-140,54,24); ctx.fillStyle="#ff8a1f"; ctx.fill(); ctx.lineWidth=3; ctx.strokeStyle=C.ink; ctx.stroke(); text("点击开始接单",W/2,547,18,950,"center","#fffaf0"); text("10关地图 / 道路吸附 / 建筑禁画",W/2,620,12,900,"center","#6b4b2e");
  }

  function draw(){
    if(state.screen==="start"){ drawStart(); return; }
    ctx.fillStyle="#f7f5ec"; ctx.fillRect(0,0,W,H); drawHeader(); drawMap(); drawRoute(state.route, state.status==="result"&&state.result?.fail?C.red:C.route); const lv=level(); drawPin(lv.start,C.yellow,lv.start.label,"起"); drawPin(lv.end,C.green,lv.end.label,"终"); if(state.status==="drive") drawCar(state.anim.car.x,state.anim.car.y,state.anim.car.angle,.9); else if(state.route.length<2) drawCar(lv.start.x,lv.start.y-42,-Math.PI/2,.72); drawBottom(); drawHint();
  }

  function refresh(){
    const lv=level(), e=evalRoute(state.route);
    if(state.screen==="start"){ statusEl.textContent="点击画面开始接单。"; driveBtn.disabled=true; nextBtn.disabled=true; resetBtn.disabled=true; return; }
    resetBtn.disabled=false;
    if(state.screen==="hint"){ statusEl.textContent=`本关目标：${lv.wish.item}，需要赚到 ¥${lv.target}。点击画面关闭提示后开始画路线。`; driveBtn.disabled=true; nextBtn.disabled=true; return; }
    if(state.status==="draw") statusEl.textContent="从黄色起点附近按住拖动。路线会吸附到道路；建筑物、水面和非道路区域不能画。";
    else if(state.status==="preview"){ const tags=[]; if(e.hitSuspicious?.length) tags.push(`踩雷：${e.hitSuspicious.join("、")}`); if(e.hitExcuse?.length) tags.push(`借口：${e.hitExcuse.join("、")}`); statusEl.textContent=`${e.reason} 预计收入 ¥${e.money}，目标是 ${lv.wish.item}。绕路 ${e.ratio.toFixed(2)}x，怀疑 ${e.suspicion}/100。${tags.join("；")}`; }
    else if(state.status==="drive") statusEl.textContent="小车正在按路线行驶，收入会随着行驶距离实时上涨。";
    else if(state.status==="result") statusEl.textContent=e.fail?`被发现了：${e.reason} 可以重画，避开红区或找蓝区做借口。`:e.money>=lv.target?`成功！赚到 ¥${e.money}，可以买到：${lv.wish.item}。`:`安全送达，但只赚到 ¥${e.money}，还没够买：${lv.wish.item}。可以重画再贪一点。`;
    driveBtn.disabled=!(state.status==="preview"&&e.valid); nextBtn.disabled=state.status!=="result";
  }

  function reset(showHint=false){ state.route=[]; state.drawing=false; state.status="draw"; state.result=null; state.anim.distance=0; state.anim.money=level().base; if(showHint) state.screen="hint"; refresh(); draw(); }
  function next(){ if(state.levelIndex<levels.length-1) state.levelIndex++; else state.levelIndex=0; reset(true); }
  function drive(){ const e=evalRoute(state.route); if(!e.valid) return; state.result=e; state.status="drive"; state.anim.distance=0; state.anim.money=level().base; state.anim.lastTime=performance.now(); state.anim.car=pointAt(state.route,0); refresh(); requestAnimationFrame(animate); }
  function animate(now){ if(state.status!=="drive") return; const e=evalRoute(state.route), total=e.length, dt=Math.min(32,now-state.anim.lastTime); state.anim.lastTime=now; state.anim.distance=Math.min(total,state.anim.distance+state.anim.speed*(dt/16.67)); state.anim.car=pointAt(state.route,state.anim.distance); state.anim.money=level().base+state.anim.distance*level().rate; draw(); if(state.anim.distance<total) requestAnimationFrame(animate); else { state.anim.money=e.money; state.status="result"; state.result=e; refresh(); draw(); } }
  function warn(reason){ const now=performance.now(); if(now-state.lastWarn>350){ state.lastWarn=now; statusEl.textContent=reason; } }

  function down(evt){
    evt.preventDefault();
    if(state.screen==="start"){ state.screen="hint"; refresh(); draw(); return; }
    if(state.screen==="hint"){ state.screen="game"; refresh(); draw(); return; }
    if(state.status==="drive") return;
    const p=pointer(evt), lv=level();
    if(dist(p,lv.start)<=58){ const n=nearestRoad(lv.start); state.route=[n.d<34?{x:n.x,y:n.y}:{x:lv.start.x,y:lv.start.y}]; state.drawing=true; state.status="draw"; state.result=null; refresh(); draw(); }
    else statusEl.textContent="要从黄色起点附近开始画，不然乘客不上车。";
  }
  function move(evt){ if(!state.drawing||state.status==="drive"||state.screen!=="game") return; evt.preventDefault(); const s=snap(pointer(evt)); if(!s.ok){ warn(s.reason); return; } const last=state.route[state.route.length-1]; if(!last||dist(last,s.point)>5){ state.route.push(s.point); draw(); } }
  function up(evt){ if(!state.drawing) return; evt.preventDefault(); state.drawing=false; const lv=level(); if(state.route.length>1&&dist(state.route[state.route.length-1],lv.end)<55){ const n=nearestRoad(lv.end); state.route.push(n.d<34?{x:n.x,y:n.y}:{x:lv.end.x,y:lv.end.y}); } const e=evalRoute(state.route); state.status=e.valid?"preview":"draw"; refresh(); draw(); }

  canvas.addEventListener("mousedown",down); canvas.addEventListener("mousemove",move); window.addEventListener("mouseup",up);
  canvas.addEventListener("touchstart",down,{passive:false}); canvas.addEventListener("touchmove",move,{passive:false}); canvas.addEventListener("touchend",up,{passive:false}); canvas.addEventListener("touchcancel",up,{passive:false});
  resetBtn.addEventListener("click",()=>reset(false)); driveBtn.addEventListener("click",drive); nextBtn.addEventListener("click",next);
  refresh(); draw();
})();
