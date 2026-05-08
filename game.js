from pathlib import Path
import re, shutil

game_path = Path("/mnt/data/evil_taxi_v6_game.js")
index_path = Path("/mnt/data/evil_taxi_v6_index.html")

game = game_path.read_text(encoding="utf-8")
index = index_path.read_text(encoding="utf-8")

# index cache/version
index = re.sub(r'game\.js\?v=\d+', 'game.js?v=7', index)
index = re.sub(r'Demo v\d+', 'Demo v7', index)
index = re.sub(r'绕路司机 Demo v\d+', '绕路司机 Demo v7', index)

# version comment
game = re.sub(r'^// Evil Taxi v6:.*\n', '', game)
game = "// Evil Taxi v7: zoomed-out map + kilometers + hidden fare before driving\n" + game

# Add map zoom and km helpers after MAP definition
game = game.replace(
    'const MAP = { x: 14, y: 132, w: 362, h: 470 };\n  MAP.r = MAP.x + MAP.w; MAP.b = MAP.y + MAP.h;',
    '''const MAP = { x: 14, y: 132, w: 362, h: 470 };
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
  }'''
)

# Make pointer coordinates converted to world coordinates
game = game.replace(
    'function pos(evt){ const e=evt.touches?evt.touches[0]:evt; const r=canvas.getBoundingClientRect(); return {x:(e.clientX-r.left)*W/r.width,y:(e.clientY-r.top)*H/r.height}; }',
    'function pos(evt){ const e=evt.touches?evt.touches[0]:evt; const r=canvas.getBoundingClientRect(); const s={x:(e.clientX-r.left)*W/r.width,y:(e.clientY-r.top)*H/r.height}; return screenToWorld(s); }'
)

# Add map transform inside drawMap clip after fillRect line
old = 'ctx.save(); rr(MAP.x+2,MAP.y+2,MAP.w-4,MAP.h-4,18); ctx.clip(); ctx.fillStyle=C.bg; ctx.fillRect(MAP.x,MAP.y,MAP.w,MAP.h);'
new = '''ctx.save(); rr(MAP.x+2,MAP.y+2,MAP.w-4,MAP.h-4,18); ctx.clip(); ctx.fillStyle=C.bg; ctx.fillRect(MAP.x,MAP.y,MAP.w,MAP.h);

    // 在地图内容层做缩放，像导航软件缩小视角一样，能看到更大的城市范围。
    ctx.translate(VIEW.cx, VIEW.cy);
    ctx.scale(VIEW.scale, VIEW.scale);
    ctx.translate(-VIEW.cx, -VIEW.cy);'''
game = game.replace(old, new)

# Smaller cars: running and standing car are outside transformed map, so convert car/world positions to screen and shrink.
game = game.replace(
    'if(state.status==="drive"){ const cp=carPoint(); drawCar(cp.x,cp.y,cp.ang,.9); } else if(state.route.length<2){ const s=node(lv().start); drawCar(s.x,s.y-42,-Math.PI/2,.7); }',
    '''if(state.status==="drive"){
      const cp=carPoint();
      const sp=worldToScreen(cp);
      drawCar(sp.x, sp.y, cp.ang, .48);
    } else if(state.route.length<2){
      const s=worldToScreen(node(lv().start));
      drawCar(s.x, s.y - 28, -Math.PI/2, .42);
    }'''
)

# Start screen car can be slightly smaller too
game = game.replace('drawCar(W/2,283,0,1.75);', 'drawCar(W/2,283,0,1.35);')

# Header: replace drawHeader with a more controlled version that hides fare and shows km.
pattern = r'function drawHeader\(\)\{.*?\n  \}\n\n  function drawBottom'
replacement = r'''function drawHeader(){
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

  function drawBottom'''
game = re.sub(pattern, replacement, game, flags=re.S)

# DrawBottom: hide estimated money and km until driving/result
pattern = r'function drawBottom\(\)\{.*?\n  \}\n\n  function drawStart'
replacement = r'''function drawBottom(){
    const ev = evaluate(), L = lv();
    rr(14,615,W-28,52,16);
    ctx.fillStyle="#fff8e9";
    ctx.fill();
    ctx.strokeStyle=C.ink;
    ctx.lineWidth=3;
    ctx.stroke();

    let msg = "沿道路拖动，经过路口会自动生成导航路线。";
    if(state.screen==="start") {
      msg = "点击画面开始接单。";
    } else if(state.screen==="hint") {
      msg = "点击提示关闭，然后从黄色起点沿道路画到绿色终点。";
    } else if(state.status==="preview") {
      msg = `路线已规划｜发车后揭晓收入和公里数｜怀疑 ${ev.suspicion}/${L.patience}`;
    } else if(state.status==="drive") {
      msg = `导航中：已开 ${kmText(state.car.doneLen || 0)}｜已赚 ¥${Math.round(state.car.money || L.base)}｜目标 ¥${L.target}`;
    } else if(state.status==="result") {
      msg = ev.pass
        ? `${"★".repeat(ev.stars)}${"☆".repeat(3-ev.stars)} 通关｜${kmText(ev.len)}｜¥${ev.money}｜买到 ${L.wish.emoji}`
        : ev.failed
          ? `失败：${kmText(ev.len)}｜乘客投诉了，怀疑值爆表。`
          : `未通关：${kmText(ev.len)}｜¥${ev.money}/${L.target}，还没够买 ${L.wish.emoji}`;
    }
    text(msg.slice(0,42),28,641,13,900,"left");
  }

  function drawStart'''
game = re.sub(pattern, replacement, game, flags=re.S)

# Refresh: hide preview money
game = game.replace(
    'else if(state.status==="preview") statusEl.textContent=`路线完成。预计 ¥${ev.money}，绕路 ${ev.ratio.toFixed(2)}x，怀疑 ${ev.suspicion}/${L.patience}。${ev.risk.length?"危险路段："+ev.risk.join("、")+"。":""}${ev.excuse.length?"借口："+ev.excuse.join("、")+"。":""}`;',
    'else if(state.status==="preview") statusEl.textContent=`路线完成。发车后才会揭晓收入和公里数。当前怀疑 ${ev.suspicion}/${L.patience}。${ev.risk.length?"危险路段："+ev.risk.join("、")+"。":""}${ev.excuse.length?"借口："+ev.excuse.join("、")+"。":""}`;'
)

# Refresh drive/result with km
game = game.replace(
    'else if(state.status==="drive") statusEl.textContent="小车正在按你的路线跑，收入实时上涨。";',
    'else if(state.status==="drive") statusEl.textContent=`小车正在按你的路线跑：已开 ${kmText(state.car.doneLen || 0)}，收入实时上涨。`;'
)
game = game.replace(
    'else if(state.status==="result") statusEl.textContent=ev.pass?`通关！${ev.stars}星，赚到 ¥${ev.money}，可以买${L.wish.item}。`:ev.failed?`失败：怀疑值 ${ev.suspicion}/${L.patience}，乘客投诉了。`:`未通关：赚到 ¥${ev.money}，还没够 ¥${L.target}，需要更黑心一点。`;',
    'else if(state.status==="result") statusEl.textContent=ev.pass?`通关！${ev.stars}星，开了 ${kmText(ev.len)}，赚到 ¥${ev.money}，可以买${L.wish.item}。`:ev.failed?`失败：开了 ${kmText(ev.len)}，怀疑值 ${ev.suspicion}/${L.patience}，乘客投诉了。`:`未通关：开了 ${kmText(ev.len)}，赚到 ¥${ev.money}，还没够 ¥${L.target}，需要更黑心一点。`;'
)

# Start drive initialize doneLen
game = game.replace(
    'state.car={i:0,t:0,money:lv().base,last:performance.now()};',
    'state.car={i:0,t:0,money:lv().base,doneLen:0,last:performance.now()};'
)
game = game.replace(
    'state.car={i:0,t:0,money:lv().base};',
    'state.car={i:0,t:0,money:lv().base,doneLen:0};'
)

# Anim: store doneLen
game = game.replace(
    'state.car.money=moneyFor(doneLen); draw();',
    'state.car.doneLen = doneLen; state.car.money=moneyFor(doneLen); draw();'
)

# Hide preview in bottom in case any old string remains
game = game.replace('预计 ¥${ev.money}/${L.target}｜绕路 ${ev.ratio.toFixed(2)}x｜怀疑 ${ev.suspicion}/${L.patience}', '路线已规划｜发车后揭晓收入和公里数｜怀疑 ${ev.suspicion}/${L.patience}')

out_index = Path("/mnt/data/evil_taxi_v7_index.html")
out_game = Path("/mnt/data/evil_taxi_v7_game.js")
out_txt = Path("/mnt/data/evil_taxi_v7_game_js.txt")

out_index.write_text(index, encoding="utf-8")
out_game.write_text(game, encoding="utf-8")
out_txt.write_text(game, encoding="utf-8")

print(out_index)
print(out_game)
print(out_txt)
