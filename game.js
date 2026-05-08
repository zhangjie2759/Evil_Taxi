(() => {
  "use strict";

  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d");
  const resetBtn = document.getElementById("resetBtn");
  const driveBtn = document.getElementById("driveBtn");
  const nextBtn = document.getElementById("nextBtn");
  const statusEl = document.getElementById("status");

  const W = 390;
  const H = 680;
  const DPR = Math.max(1, Math.min(3, window.devicePixelRatio || 1));

  canvas.width = W * DPR;
  canvas.height = H * DPR;
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);

  const MAP_TOP = 132;
  const MAP_LEFT = 14;
  const MAP_W = W - 28;
  const MAP_H = 470;
  const MAP_RIGHT = MAP_LEFT + MAP_W;
  const MAP_BOTTOM = MAP_TOP + MAP_H;

  function roadV(x1, y1, y2) { return { kind: "road", points: [[x1,y1],[x1,y2]] }; }
  function roadH(y1, x1, x2) { return { kind: "road", points: [[x1,y1],[x2,y1]] }; }
  function roadPath(points) { return { kind: "road", points }; }
  function waterRect(x,y,w,h) { return { kind: "water", x,y,w,h }; }
  function parkRect(x,y,w,h) { return { kind: "park", x,y,w,h }; }
  function landmark(x,y,label,icon="") { return { kind: "landmark", x,y,label,icon }; }

  const map1 = {
    name: "居住区",
    blocks: [
      [34,160,76,68],[126,158,88,70],[238,160,92,66],
      [35,255,68,78],[126,252,84,74],[236,256,95,76],
      [36,382,70,70],[129,390,86,65],[238,386,94,72],
      [36,500,70,70],[132,503,86,66],[246,500,84,70]
    ],
    features: [
      roadV(64,148,586), roadV(116,148,586), roadV(230,148,586), roadV(338,148,586),
      roadH(185,30,350), roadH(242,30,350), roadH(350,30,350), roadH(480,30,350), roadH(560,30,350),
      parkRect(146,410,58,38),
      landmark(70,170,"菜鸟驿站","📦"),
      landmark(260,284,"便利店","🏪"),
      landmark(290,520,"小公园","🌳")
    ]
  };

  const map2 = {
    name: "机场片区",
    blocks: [
      [34,176,90,74],[146,172,85,80],[259,174,71,76],
      [34,284,72,62],[128,286,106,62],[259,282,72,66],
      [34,386,90,78],[150,390,76,70],[255,386,76,74],
      [48,502,72,54],[150,506,74,50],[252,506,75,48]
    ],
    features: [
      waterRect(28,150,320,18),
      roadH(205,28,348), roadH(315,28,348), roadH(420,28,348), roadH(530,48,338),
      roadV(78,170,556), roadV(145,172,556), roadV(245,170,556), roadV(336,170,556),
      roadPath([[28,260],[95,260],[95,210],[190,210],[190,150]]),
      landmark(74,152,"机场航站楼","✈️"),
      landmark(298,302,"出租车道","🚖"),
      landmark(285,538,"酒店群","🏨")
    ]
  };

  const map3 = {
    name: "河桥城区",
    blocks: [
      [28,165,84,88],[134,166,76,84],[260,165,74,88],
      [28,382,85,84],[136,380,78,86],[258,382,78,84],
      [28,505,84,58],[136,505,78,58],[258,505,78,58]
    ],
    features: [
      waterRect(20,278,350,76),
      roadH(190,26,344), roadH(240,26,344), roadH(480,26,344), roadH(560,26,344),
      roadV(70,148,270), roadV(70,358,586),
      roadV(122,148,270), roadV(122,358,586),
      roadV(230,148,270), roadV(230,358,586),
      roadV(338,148,270), roadV(338,358,586),
      roadPath([[70,278],[70,250],[230,250],[230,278]]),
      roadPath([[122,354],[122,384],[338,384],[338,354]]),
      roadPath([[230,278],[230,354]]),
      landmark(176,316,"跨河大桥","🌉"),
      landmark(54,518,"商场","🛍️"),
      landmark(312,516,"影院","🎬")
    ]
  };

  const map4 = {
    name: "夜生活街区",
    blocks: [
      [32,160,74,68],[120,160,72,68],[208,160,74,68],[294,160,40,68],
      [34,260,74,72],[122,260,70,72],[208,260,76,72],[298,260,36,72],
      [34,380,72,84],[122,382,72,82],[208,382,74,82],[294,380,40,84],
      [34,500,94,65],[152,500,90,65],[266,500,68,65]
    ],
    features: [
      roadV(74,148,586), roadV(160,148,586), roadV(246,148,586), roadV(320,148,586),
      roadH(188,28,344), roadH(246,28,344), roadH(350,28,344), roadH(480,28,344), roadH(560,28,344),
      parkRect(274,396,52,46),
      landmark(58,214,"饭店街","🍢"),
      landmark(300,406,"夜市","🌙"),
      landmark(320,215,"家","🏠")
    ]
  };

  const map5 = {
    name: "景区山道",
    blocks: [
      [30,160,72,72],[246,160,82,68],
      [36,300,74,66],[252,296,76,72],
      [36,432,74,74],[250,432,78,72]
    ],
    features: [
      parkRect(124,150,84,90),
      parkRect(124,262,84,106),
      parkRect(124,392,84,90),
      waterRect(224,505,114,48),
      roadPath([[60,560],[60,470],[110,470],[110,350],[80,350],[80,250],[120,250],[120,190],[185,190]]),
      roadPath([[185,190],[245,190],[245,240],[320,240],[320,310]]),
      roadPath([[110,470],[180,470],[180,410],[245,410],[245,350],[300,350],[300,310]]),
      roadPath([[180,470],[180,530],[320,530]]),
      landmark(162,176,"观景台","📸"),
      landmark(288,520,"湖边","🏞️"),
      landmark(304,310,"民宿","🏡")
    ]
  };

  const map6 = {
    name: "医院片区",
    blocks: [
      [36,170,84,70],[146,170,72,70],[248,170,84,70],
      [36,276,72,70],[146,278,72,68],[258,278,72,68],
      [40,404,70,70],[146,404,74,70],[258,404,70,70],
      [40,516,70,50],[148,516,72,50],[258,516,72,50]
    ],
    features: [
      roadH(205,30,344), roadH(312,30,344), roadH(438,30,344), roadH(540,30,344),
      roadV(74,152,576), roadV(132,152,576), roadV(236,152,576), roadV(338,152,576),
      roadPath([[236,152],[236,250],[180,250],[180,312]]),
      roadPath([[132,438],[180,438],[180,540]]),
      landmark(78,146,"医院","🏥"),
      landmark(84,432,"救护车道","🚑"),
      landmark(300,540,"社区","🏘️")
    ]
  };

  const map7 = {
    name: "老城区",
    blocks: [
      [32,155,66,74],[118,160,64,68],[202,156,56,66],[280,154,52,70],
      [42,262,56,56],[126,260,54,52],[206,262,50,50],[282,258,48,56],
      [36,362,68,72],[122,364,58,58],[206,362,58,60],[278,358,56,66],
      [34,480,82,80],[138,486,78,74],[240,482,88,80]
    ],
    features: [
      roadPath([[70,150],[70,580]]),
      roadPath([[110,185],[340,185]]),
      roadPath([[110,240],[320,240]]),
      roadPath([[70,335],[340,335]]),
      roadPath([[92,450],[340,450]]),
      roadPath([[140,150],[140,580]]),
      roadPath([[236,150],[236,580]]),
      roadPath([[320,150],[320,580]]),
      roadPath([[70,580],[140,580],[140,520],[236,520],[236,580],[320,580]]),
      parkRect(50,410,90,80),
      landmark(76,172,"菜场","🥬"),
      landmark(298,210,"熟人街","👀"),
      landmark(294,548,"小区","🏠")
    ]
  };

  const map8 = {
    name: "会展新区",
    blocks: [
      [34,170,74,70],[128,170,72,70],[220,170,112,70],
      [34,278,74,70],[126,278,72,70],[222,278,110,70],
      [34,390,74,76],[126,390,74,76],[224,390,108,76],
      [56,510,78,50],[164,510,78,50],[272,510,60,50]
    ],
    features: [
      roadH(205,28,344), roadH(315,28,344), roadH(430,28,344), roadH(530,56,338),
      roadV(72,154,560), roadV(112,154,560), roadV(212,154,560), roadV(338,154,560),
      roadPath([[28,350],[180,350],[180,270],[338,270]]),
      roadPath([[72,430],[72,530],[180,530],[180,430]]),
      parkRect(250,190,62,42),
      landmark(58,344,"展馆","🏢"),
      landmark(295,214,"会议中心","🧭"),
      landmark(294,532,"酒店","🏨")
    ]
  };

  const map9 = {
    name: "跨江两岸",
    blocks: [
      [34,160,76,74],[36,430,76,76],[130,160,86,76],[130,430,86,76],
      [274,160,56,76],[274,430,56,76]
    ],
    features: [
      waterRect(20,248,350,152),
      roadH(195,28,344), roadH(540,28,344),
      roadV(72,150,242), roadV(72,406,576),
      roadV(174,150,242), roadV(174,406,576),
      roadV(236,150,242), roadV(236,406,576),
      roadV(320,150,242), roadV(320,406,576),
      roadPath([[72,248],[72,290],[156,290],[156,356],[250,356],[250,400]]),
      roadPath([[174,248],[174,320],[236,320],[236,248]]),
      roadPath([[320,248],[320,200],[236,200],[236,150]]),
      landmark(77,540,"码头","⛴️"),
      landmark(188,318,"大桥","🌉"),
      landmark(302,160,"公寓","🏢")
    ]
  };

  const map10 = {
    name: "终极城市圈",
    blocks: [
      [32,155,60,62],[112,155,68,62],[204,155,56,62],[278,155,54,62],
      [34,254,56,56],[114,252,62,60],[204,250,58,62],[278,252,54,58],
      [34,356,56,56],[114,354,62,60],[204,352,58,62],[278,354,54,58],
      [34,460,60,60],[112,458,66,64],[204,458,58,64],[278,458,54,64],
      [36,540,58,36],[114,540,60,36],[204,540,56,36],[278,540,54,36]
    ],
    features: [
      roadH(186,28,344), roadH(242,28,344), roadH(338,28,344), roadH(438,28,344), roadH(530,28,344), roadH(576,28,344),
      roadV(64,148,586), roadV(104,148,586), roadV(190,148,586), roadV(270,148,586), roadV(338,148,586),
      roadPath([[64,438],[104,438],[104,338],[190,338],[190,242],[270,242],[270,186],[338,186]]),
      roadPath([[190,576],[190,530],[270,530],[270,438],[338,438],[338,338]]),
      roadPath([[64,338],[64,242],[104,242],[104,186]]),
      parkRect(52,338,48,62),
      waterRect(228,494,104,26),
      landmark(66,575,"园区","💼"),
      landmark(286,505,"高架","🛣️"),
      landmark(320,116,"机场","✈️")
    ]
  };

  const levels = [
    {
      name: "第1关：新手绕小区",
      passenger: "赶时间的上班族",
      map: map1,
      start: { x: 58, y: 565, label: "小区" },
      end: { x: 332, y: 160, label: "公司" },
      base: 8, rate: 0.055, target: 40, maxSuspicion: 82,
      suspiciousZones: [{ type: "circle", x: 192, y: 350, r: 46, label: "乘客熟悉路", penalty: 28 }],
      excuseZones: [{ type: "rect", x: 255, y: 335, w: 80, h: 78, label: "修路", bonus: 14 }]
    },
    {
      name: "第2关：机场接单",
      passenger: "外地游客",
      map: map2,
      start: { x: 62, y: 145, label: "机场" },
      end: { x: 330, y: 535, label: "酒店" },
      base: 18, rate: 0.06, target: 58, maxSuspicion: 86,
      suspiciousZones: [
        { type: "rect", x: 118, y: 238, w: 118, h: 68, label: "机场快线", penalty: 26 },
        { type: "circle", x: 288, y: 300, r: 34, label: "导航提示", penalty: 18 }
      ],
      excuseZones: [{ type: "circle", x: 100, y: 438, r: 44, label: "高架入口", bonus: 13 }]
    },
    {
      name: "第3关：雨天绕桥",
      passenger: "怕堵车的情侣",
      map: map3,
      start: { x: 65, y: 520, label: "商场" },
      end: { x: 330, y: 500, label: "影院" },
      base: 10, rate: 0.07, target: 50, maxSuspicion: 78,
      suspiciousZones: [{ type: "rect", x: 130, y: 456, w: 126, h: 80, label: "直达桥", penalty: 35 }],
      excuseZones: [{ type: "rect", x: 200, y: 245, w: 110, h: 80, label: "积水绕行", bonus: 18 }]
    },
    {
      name: "第4关：夜宵单",
      passenger: "喝多的老板",
      map: map4,
      start: { x: 55, y: 220, label: "饭店" },
      end: { x: 330, y: 220, label: "家" },
      base: 12, rate: 0.075, target: 55, maxSuspicion: 80,
      suspiciousZones: [
        { type: "rect", x: 126, y: 180, w: 140, h: 80, label: "一眼直路", penalty: 38 },
        { type: "circle", x: 194, y: 470, r: 42, label: "熟人街", penalty: 23 }
      ],
      excuseZones: [{ type: "circle", x: 305, y: 405, r: 40, label: "夜间施工", bonus: 18 }]
    },
    {
      name: "第5关：景区迷路",
      passenger: "拍照游客",
      map: map5,
      start: { x: 68, y: 565, label: "景区门" },
      end: { x: 326, y: 310, label: "民宿" },
      base: 16, rate: 0.065, target: 62, maxSuspicion: 84,
      suspiciousZones: [{ type: "circle", x: 270, y: 450, r: 50, label: "地图标路", penalty: 30 }],
      excuseZones: [
        { type: "rect", x: 78, y: 290, w: 108, h: 76, label: "观景台", bonus: 16 },
        { type: "circle", x: 246, y: 210, r: 32, label: "单行道", bonus: 9 }
      ]
    },
    {
      name: "第6关：医院急单",
      passenger: "有点急的家属",
      map: map6,
      start: { x: 330, y: 555, label: "社区" },
      end: { x: 62, y: 142, label: "医院" },
      base: 15, rate: 0.06, target: 60, maxSuspicion: 70,
      suspiciousZones: [{ type: "rect", x: 132, y: 282, w: 132, h: 92, label: "医院主路", penalty: 42 }],
      excuseZones: [{ type: "circle", x: 85, y: 430, r: 45, label: "救护车道", bonus: 16 }]
    },
    {
      name: "第7关：老城区",
      passenger: "本地阿姨",
      map: map7,
      start: { x: 74, y: 160, label: "菜场" },
      end: { x: 315, y: 565, label: "小区" },
      base: 9, rate: 0.082, target: 64, maxSuspicion: 68,
      suspiciousZones: [
        { type: "circle", x: 185, y: 330, r: 62, label: "阿姨熟路", penalty: 45 },
        { type: "rect", x: 248, y: 150, w: 70, h: 82, label: "老邻居", penalty: 20 }
      ],
      excuseZones: [{ type: "rect", x: 55, y: 410, w: 95, h: 80, label: "限行", bonus: 20 }]
    },
    {
      name: "第8关：会展中心",
      passenger: "外企客户",
      map: map8,
      start: { x: 55, y: 345, label: "展馆" },
      end: { x: 333, y: 345, label: "酒店" },
      base: 20, rate: 0.072, target: 70, maxSuspicion: 75,
      suspiciousZones: [
        { type: "rect", x: 132, y: 308, w: 128, h: 76, label: "主干道", penalty: 38 },
        { type: "circle", x: 295, y: 510, r: 40, label: "导航绿线", penalty: 24 }
      ],
      excuseZones: [
        { type: "circle", x: 102, y: 520, r: 42, label: "环线入口", bonus: 14 },
        { type: "rect", x: 242, y: 180, w: 88, h: 74, label: "临时管制", bonus: 15 }
      ]
    },
    {
      name: "第9关：跨江订单",
      passenger: "开着导航的乘客",
      map: map9,
      start: { x: 67, y: 540, label: "码头" },
      end: { x: 320, y: 150, label: "公寓" },
      base: 18, rate: 0.075, target: 76, maxSuspicion: 64,
      suspiciousZones: [
        { type: "rect", x: 150, y: 315, w: 110, h: 88, label: "最快桥", penalty: 45 },
        { type: "circle", x: 295, y: 395, r: 38, label: "导航盯着", penalty: 24 }
      ],
      excuseZones: [{ type: "rect", x: 52, y: 235, w: 92, h: 75, label: "封桥绕行", bonus: 22 }]
    },
    {
      name: "第10关：终极黑车王",
      passenger: "很懂路的产品经理",
      map: map10,
      start: { x: 60, y: 580, label: "园区" },
      end: { x: 330, y: 115, label: "机场" },
      base: 26, rate: 0.082, target: 92, maxSuspicion: 58,
      suspiciousZones: [
        { type: "rect", x: 120, y: 365, w: 155, h: 78, label: "官方推荐路", penalty: 45 },
        { type: "circle", x: 280, y: 245, r: 42, label: "乘客常走", penalty: 28 },
        { type: "circle", x: 98, y: 210, r: 36, label: "明显反向", penalty: 25 }
      ],
      excuseZones: [
        { type: "rect", x: 205, y: 500, w: 95, h: 70, label: "高架绕行", bonus: 18 },
        { type: "circle", x: 85, y: 360, r: 42, label: "事故点", bonus: 17 }
      ]
    }
  ];

  const state = {
    levelIndex: 0,
    route: [],
    drawing: false,
    status: "draw",
    result: null,
    anim: {
      distance: 0,
      speed: 2.8,
      lastTime: 0,
      money: 0,
      car: { x: 0, y: 0, angle: 0 }
    }
  };

  function level() { return levels[state.levelIndex]; }

  function dist(a, b) {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    return Math.hypot(dx, dy);
  }

  function routeLength(route) {
    let sum = 0;
    for (let i = 1; i < route.length; i++) sum += dist(route[i - 1], route[i]);
    return sum;
  }

  function getPointerPos(evt) {
    const e = evt.touches ? evt.touches[0] : evt;
    const rect = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) * W / rect.width,
      y: (e.clientY - rect.top) * H / rect.height
    };
  }

  function inZone(p, z) {
    if (z.type === "circle") return Math.hypot(p.x - z.x, p.y - z.y) <= z.r;
    return p.x >= z.x && p.x <= z.x + z.w && p.y >= z.y && p.y <= z.y + z.h;
  }

  function routeHitsZone(route, z) {
    return route.some(p => inZone(p, z));
  }

  function evaluateRoute(route) {
    const lv = level();
    if (route.length < 2) {
      return {
        valid: false,
        reason: "路线太短了。请从起点拖到终点。",
        length: 0,
        shortest: dist(lv.start, lv.end),
        ratio: 0,
        suspicion: 0,
        money: lv.base
      };
    }

    const startOk = dist(route[0], lv.start) < 42;
    const endOk = dist(route[route.length - 1], lv.end) < 48;
    const length = routeLength(route);
    const shortest = dist(lv.start, lv.end);
    const ratio = length / Math.max(1, shortest);

    let suspicion = Math.max(0, (ratio - 1.22) * 34);
    const hitSuspicious = [];
    const hitExcuse = [];

    for (const z of lv.suspiciousZones) {
      if (routeHitsZone(route, z)) {
        suspicion += z.penalty;
        hitSuspicious.push(z.label);
      }
    }

    for (const z of lv.excuseZones) {
      if (routeHitsZone(route, z)) {
        suspicion -= z.bonus;
        hitExcuse.push(z.label);
      }
    }

    if (ratio > 2.05 && hitExcuse.length === 0) suspicion += 18;
    if (ratio > 2.6) suspicion += 20;

    suspicion = Math.max(0, Math.round(suspicion));
    const money = Math.round(lv.base + length * lv.rate);
    const valid = startOk && endOk;
    const fail = valid && suspicion >= 100;

    let reason = "";
    if (!startOk) reason = "要从黄色起点附近开始画路线。";
    else if (!endOk) reason = "路线最后要接到绿色终点。";
    else if (fail) reason = "乘客怀疑值爆表：你绕得太明显，被发现了。";
    else reason = "可以发车。";

    let stars = 1;
    if (valid && !fail && money >= lv.target && suspicion <= lv.maxSuspicion) stars = 3;
    else if (valid && !fail && money >= Math.round(lv.target * 0.78)) stars = 2;

    return {
      valid, fail, reason, length, shortest, ratio, suspicion, money,
      hitSuspicious, hitExcuse, stars
    };
  }

  function pointAtDistance(route, travel) {
    if (!route.length) return { x: level().start.x, y: level().start.y, angle: -Math.PI / 2 };
    let remain = travel;
    for (let i = 1; i < route.length; i++) {
      const a = route[i - 1];
      const b = route[i];
      const seg = dist(a, b);
      if (remain <= seg) {
        const t = seg === 0 ? 0 : remain / seg;
        return {
          x: a.x + (b.x - a.x) * t,
          y: a.y + (b.y - a.y) * t,
          angle: Math.atan2(b.y - a.y, b.x - a.x)
        };
      }
      remain -= seg;
    }
    const a = route[route.length - 2] || route[0];
    const b = route[route.length - 1] || route[0];
    return { x: b.x, y: b.y, angle: Math.atan2(b.y - a.y, b.x - a.x) };
  }

  function roundedRect(x, y, w, h, r) {
    const rr = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + rr, y);
    ctx.arcTo(x + w, y, x + w, y + h, rr);
    ctx.arcTo(x + w, y + h, x, y + h, rr);
    ctx.arcTo(x, y + h, x, y, rr);
    ctx.arcTo(x, y, x + w, y, rr);
    ctx.closePath();
  }

  function drawText(text, x, y, size = 14, weight = 800, align = "left", color = "#21170f") {
    ctx.save();
    ctx.font = `${weight} ${size}px -apple-system, BlinkMacSystemFont, "PingFang SC", "Microsoft YaHei", Arial`;
    ctx.textAlign = align;
    ctx.textBaseline = "middle";
    ctx.fillStyle = color;
    ctx.fillText(text, x, y);
    ctx.restore();
  }

  function drawFeature(feature) {
    if (feature.kind === "water") {
      ctx.save();
      roundedRect(feature.x, feature.y, feature.w, feature.h, 14);
      ctx.fillStyle = "#a7ddff";
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = "#4e9fd2";
      ctx.stroke();
      ctx.strokeStyle = "rgba(255,255,255,.7)";
      ctx.lineWidth = 2;
      for (let i = 0; i < 3; i++) {
        const yy = feature.y + 8 + i * 10;
        ctx.beginPath();
        ctx.moveTo(feature.x + 10, yy);
        ctx.quadraticCurveTo(feature.x + feature.w * 0.35, yy - 6, feature.x + feature.w * 0.65, yy);
        ctx.quadraticCurveTo(feature.x + feature.w * 0.82, yy + 5, feature.x + feature.w - 10, yy);
        ctx.stroke();
      }
      ctx.restore();
    } else if (feature.kind === "park") {
      ctx.save();
      roundedRect(feature.x, feature.y, feature.w, feature.h, 14);
      ctx.fillStyle = "#cfeec8";
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = "#6eb56e";
      ctx.stroke();
      drawText("公园", feature.x + feature.w/2, feature.y + feature.h/2, 12, 900, "center", "#347a37");
      ctx.restore();
    } else if (feature.kind === "road") {
      ctx.save();
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.strokeStyle = "#d7c092";
      ctx.lineWidth = 17;
      ctx.beginPath();
      ctx.moveTo(feature.points[0][0], feature.points[0][1]);
      for (let i = 1; i < feature.points.length; i++) {
        ctx.lineTo(feature.points[i][0], feature.points[i][1]);
      }
      ctx.stroke();
      ctx.strokeStyle = "#fff6dd";
      ctx.lineWidth = 5;
      ctx.setLineDash([16, 14]);
      ctx.beginPath();
      ctx.moveTo(feature.points[0][0], feature.points[0][1]);
      for (let i = 1; i < feature.points.length; i++) {
        ctx.lineTo(feature.points[i][0], feature.points[i][1]);
      }
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
    } else if (feature.kind === "landmark") {
      ctx.save();
      roundedRect(feature.x - 26, feature.y - 12, 52, 24, 12);
      ctx.fillStyle = "#fffaf0";
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = "#21170f";
      ctx.stroke();
      drawText((feature.icon ? feature.icon + " " : "") + feature.label, feature.x, feature.y, 10, 900, "center", "#50351d");
      ctx.restore();
    }
  }

  function drawZones() {
    const lv = level();

    for (const z of lv.excuseZones) {
      ctx.save();
      ctx.fillStyle = "rgba(48, 145, 212, .16)";
      ctx.strokeStyle = "#307fc2";
      ctx.lineWidth = 3;
      ctx.setLineDash([8, 6]);
      if (z.type === "circle") {
        ctx.beginPath();
        ctx.arc(z.x, z.y, z.r, 0, Math.PI * 2);
        ctx.fill(); ctx.stroke();
        drawText(z.label, z.x, z.y, 12, 900, "center", "#1d5f96");
      } else {
        roundedRect(z.x, z.y, z.w, z.h, 14);
        ctx.fill(); ctx.stroke();
        drawText(z.label, z.x + z.w/2, z.y + z.h/2, 12, 900, "center", "#1d5f96");
      }
      ctx.restore();
    }

    for (const z of lv.suspiciousZones) {
      ctx.save();
      ctx.fillStyle = "rgba(223, 59, 53, .14)";
      ctx.strokeStyle = "#df3b35";
      ctx.lineWidth = 3;
      ctx.setLineDash([7, 6]);
      if (z.type === "circle") {
        ctx.beginPath();
        ctx.arc(z.x, z.y, z.r, 0, Math.PI * 2);
        ctx.fill(); ctx.stroke();
        drawText(z.label, z.x, z.y, 12, 900, "center", "#b9231f");
      } else {
        roundedRect(z.x, z.y, z.w, z.h, 14);
        ctx.fill(); ctx.stroke();
        drawText(z.label, z.x + z.w/2, z.y + z.h/2, 12, 900, "center", "#b9231f");
      }
      ctx.restore();
    }
  }

  function drawBackground() {
    ctx.fillStyle = "#fff9e9";
    ctx.fillRect(0, 0, W, H);

    roundedRect(14, 14, W - 28, 105, 18);
    ctx.fillStyle = "#fff3ce";
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = "#21170f";
    ctx.stroke();

    const lv = level();
    drawText(lv.name, 28, 39, 16, 900);
    drawText(`乘客：${lv.passenger}`, 28, 66, 12, 800, "left", "#5e3b1e");
    drawText(`地图：${lv.map.name}｜目标黑心收入 ≥ ¥${lv.target}`, 28, 92, 12, 900, "left", "#5e3b1e");

    const evalNow = evaluateRoute(state.route);
    const money = state.status === "drive" ? Math.round(state.anim.money) : evalNow.money;
    const suspicion = evalNow.suspicion || 0;
    const suspicionColor = suspicion >= 85 ? "#df3b35" : suspicion >= 55 ? "#c46b00" : "#2e9d68";
    drawText(`¥${money}`, 280, 43, 25, 950, "left", "#21170f");
    drawText(`怀疑 ${Math.min(100, suspicion)}/100`, 282, 76, 13, 900, "left", suspicionColor);

    roundedRect(MAP_LEFT, MAP_TOP, MAP_W, MAP_H, 20);
    ctx.fillStyle = "#fffdf5";
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = "#21170f";
    ctx.stroke();

    ctx.save();
    ctx.beginPath();
    roundedRect(MAP_LEFT + 2, MAP_TOP + 2, MAP_W - 4, MAP_H - 4, 18);
    ctx.clip();

    ctx.fillStyle = "#fff8e2";
    ctx.fillRect(MAP_LEFT + 2, MAP_TOP + 2, MAP_W - 4, MAP_H - 4);

    // Draw blocks first
    ctx.fillStyle = "#f4e2ba";
    ctx.strokeStyle = "rgba(33,23,15,.35)";
    ctx.lineWidth = 2;
    for (const b of lv.map.blocks) {
      roundedRect(b[0], b[1], b[2], b[3], 10);
      ctx.fill();
      ctx.stroke();
    }

    // Draw map features
    for (const f of lv.map.features) drawFeature(f);

    drawZones();
    ctx.restore();
  }

  function drawPin(p, color, label, emoji) {
    ctx.save();
    ctx.translate(p.x, p.y);

    ctx.fillStyle = "rgba(0,0,0,.12)";
    ctx.beginPath();
    ctx.ellipse(0, 22, 20, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = color;
    ctx.strokeStyle = "#21170f";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, -4, 18, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(-10, 10);
    ctx.lineTo(0, 30);
    ctx.lineTo(10, 10);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    drawText(emoji, 0, -5, 16, 900, "center", "#21170f");
    ctx.restore();

    roundedRect(p.x - 36, p.y + 32, 72, 22, 11);
    ctx.fillStyle = "#fffaf0";
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = "#21170f";
    ctx.stroke();
    drawText(label, p.x, p.y + 44, 11, 900, "center");
  }

  function drawRoute(route, options = {}) {
    if (route.length < 2) return;
    ctx.save();
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    ctx.strokeStyle = "rgba(33,23,15,.18)";
    ctx.lineWidth = 15;
    ctx.beginPath();
    ctx.moveTo(route[0].x, route[0].y);
    for (let i = 1; i < route.length; i++) ctx.lineTo(route[i].x, route[i].y);
    ctx.stroke();

    ctx.strokeStyle = options.color || "#f47b20";
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(route[0].x, route[0].y);
    for (let i = 1; i < route.length; i++) ctx.lineTo(route[i].x, route[i].y);
    ctx.stroke();

    ctx.setLineDash([1, 16]);
    ctx.strokeStyle = "#fffaf0";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(route[0].x, route[0].y);
    for (let i = 1; i < route.length; i++) ctx.lineTo(route[i].x, route[i].y);
    ctx.stroke();

    ctx.restore();
  }

  function drawCuteCar(x, y, angle, scale = 1) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.scale(scale, scale);

    ctx.fillStyle = "rgba(0,0,0,.14)";
    ctx.beginPath();
    ctx.ellipse(0, 14, 28, 12, 0, 0, Math.PI * 2);
    ctx.fill();

    roundedRect(-24, -16, 50, 31, 12);
    ctx.fillStyle = "#ffb14a";
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = "#21170f";
    ctx.stroke();

    roundedRect(-7, -24, 25, 20, 9);
    ctx.fillStyle = "#ffe5a6";
    ctx.fill();
    ctx.stroke();

    roundedRect(4, -21, 11, 12, 4);
    ctx.fillStyle = "#8cd4ff";
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = "#21170f";
    ctx.stroke();

    ctx.fillStyle = "#21170f";
    ctx.beginPath();
    ctx.arc(10, -3, 2.5, 0, Math.PI * 2);
    ctx.arc(10, 7, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#21170f";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(20, 2, 4, -Math.PI / 2, Math.PI / 2);
    ctx.stroke();

    roundedRect(-6, -31, 18, 9, 4);
    ctx.fillStyle = "#fffaf0";
    ctx.fill();
    ctx.strokeStyle = "#21170f";
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = "#21170f";
    ctx.beginPath();
    ctx.arc(-13, -16, 5, 0, Math.PI * 2);
    ctx.arc(-13, 15, 5, 0, Math.PI * 2);
    ctx.arc(14, -16, 5, 0, Math.PI * 2);
    ctx.arc(14, 15, 5, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  function drawBottomPanel() {
    const evalNow = evaluateRoute(state.route);
    roundedRect(14, 615, W - 28, 52, 16);
    ctx.fillStyle = "#fff3ce";
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = "#21170f";
    ctx.stroke();

    let msg = "每一关地图不同，按住黄色起点画路线。";
    if (state.status === "preview") {
      msg = `预计收入 ¥${evalNow.money}｜绕路 ${evalNow.ratio.toFixed(2)}x｜怀疑 ${evalNow.suspicion}/100`;
    } else if (state.status === "drive") {
      msg = `正在绕路：已赚 ¥${Math.round(state.anim.money)}，别被发现……`;
    } else if (state.status === "result") {
      if (evalNow.fail) msg = `失败：${evalNow.reason}`;
      else msg = `${"★".repeat(evalNow.stars)}${"☆".repeat(3 - evalNow.stars)}  收入 ¥${evalNow.money}｜怀疑 ${evalNow.suspicion}/100`;
    }

    drawText(msg, 28, 641, 13, 900, "left", "#21170f");
  }

  function drawTutorialOverlay() {
    if (state.route.length > 1 || state.status !== "draw") return;
    ctx.save();
    ctx.globalAlpha = 0.92;
    roundedRect(48, 270, 294, 92, 20);
    ctx.fillStyle = "#fffaf0";
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = "#21170f";
    ctx.stroke();
    ctx.globalAlpha = 1;
    drawText("每一关都是不同地图", 195, 298, 15, 900, "center");
    drawText("画一条更远但别太离谱的路线", 195, 324, 12, 800, "center", "#62421f");
    drawText("🚕", 195, 348, 21, 900, "center");
    ctx.restore();
  }

  function draw() {
    drawBackground();
    const lv = level();

    drawRoute(state.route, {
      color: state.status === "result" && state.result?.fail ? "#df3b35" : "#f47b20"
    });

    drawPin(lv.start, "#ffd64f", lv.start.label, "起");
    drawPin(lv.end, "#71d97d", lv.end.label, "终");

    if (state.status === "drive") {
      drawCuteCar(state.anim.car.x, state.anim.car.y, state.anim.car.angle, 0.9);
    } else if (state.route.length < 2) {
      drawCuteCar(lv.start.x, lv.start.y - 44, -Math.PI / 2, 0.75);
    }

    drawBottomPanel();
    drawTutorialOverlay();
  }

  function refreshStatus() {
    const evalNow = evaluateRoute(state.route);
    if (state.status === "draw") {
      statusEl.textContent = "现在每一关都有不同地图。从起点按住拖动，画一条“看起来合理但其实很绕”的路线。";
    } else if (state.status === "preview") {
      const tags = [];
      if (evalNow.hitSuspicious?.length) tags.push(`踩雷：${evalNow.hitSuspicious.join("、")}`);
      if (evalNow.hitExcuse?.length) tags.push(`借口：${evalNow.hitExcuse.join("、")}`);
      statusEl.textContent = `${evalNow.reason} 预计收入 ¥${evalNow.money}，绕路 ${evalNow.ratio.toFixed(2)}x，怀疑 ${evalNow.suspicion}/100。${tags.join("；")}`;
    } else if (state.status === "drive") {
      statusEl.textContent = "小车正在按你的路线绕路，收入会随着行驶距离实时增加。";
    } else if (state.status === "result") {
      if (evalNow.fail) {
        statusEl.textContent = `被发现了：${evalNow.reason} 可以重画，避开红区或找蓝区做借口。`;
      } else if (evalNow.stars >= 3) {
        statusEl.textContent = `完美黑车！赚到 ¥${evalNow.money}，但怀疑只有 ${evalNow.suspicion}/100。`;
      } else {
        statusEl.textContent = `安全送达，赚到 ¥${evalNow.money}。想拿更高星，可以再绕一点，但别进红区。`;
      }
    }

    driveBtn.disabled = !(state.status === "preview" && evalNow.valid);
    nextBtn.disabled = state.status !== "result";
  }

  function resetRoute() {
    state.route = [];
    state.status = "draw";
    state.result = null;
    state.anim.distance = 0;
    state.anim.money = level().base;
    refreshStatus();
    draw();
  }

  function nextLevel() {
    if (state.levelIndex < levels.length - 1) {
      state.levelIndex++;
      resetRoute();
    } else {
      state.levelIndex = 0;
      resetRoute();
      statusEl.textContent = "10关已完成，重新从第1关开始。";
    }
  }

  function startDriving() {
    const evalNow = evaluateRoute(state.route);
    if (!evalNow.valid) return;
    state.result = evalNow;
    state.status = "drive";
    state.anim.distance = 0;
    state.anim.money = level().base;
    state.anim.lastTime = performance.now();
    state.anim.car = pointAtDistance(state.route, 0);
    refreshStatus();
    requestAnimationFrame(animateDrive);
  }

  function animateDrive(now) {
    if (state.status !== "drive") return;

    const evalNow = evaluateRoute(state.route);
    const total = evalNow.length;
    const dt = Math.min(32, now - state.anim.lastTime);
    state.anim.lastTime = now;

    state.anim.distance += state.anim.speed * (dt / 16.67);
    state.anim.distance = Math.min(total, state.anim.distance);

    state.anim.car = pointAtDistance(state.route, state.anim.distance);
    state.anim.money = level().base + state.anim.distance * level().rate;

    draw();

    if (state.anim.distance < total) {
      requestAnimationFrame(animateDrive);
    } else {
      state.anim.money = evalNow.money;
      state.status = "result";
      state.result = evalNow;
      refreshStatus();
      draw();
    }
  }

  function beginDraw(evt) {
    if (state.status === "drive") return;
    evt.preventDefault();

    const p = getPointerPos(evt);
    const lv = level();

    if (dist(p, lv.start) <= 55) {
      state.route = [{ x: lv.start.x, y: lv.start.y }];
      state.drawing = true;
      state.status = "draw";
      state.result = null;
      refreshStatus();
      draw();
    } else {
      statusEl.textContent = "要从黄色起点附近开始画，不然乘客不上车。";
    }
  }

  function moveDraw(evt) {
    if (!state.drawing || state.status === "drive") return;
    evt.preventDefault();

    const p = getPointerPos(evt);
    p.x = Math.max(24, Math.min(W - 24, p.x));
    p.y = Math.max(142, Math.min(592, p.y));

    const last = state.route[state.route.length - 1];
    if (!last || dist(last, p) > 6) {
      state.route.push(p);
      draw();
    }
  }

  function endDraw(evt) {
    if (!state.drawing) return;
    evt.preventDefault();
    state.drawing = false;

    const lv = level();
    if (state.route.length > 1 && dist(state.route[state.route.length - 1], lv.end) < 48) {
      state.route.push({ x: lv.end.x, y: lv.end.y });
    }

    const evalNow = evaluateRoute(state.route);
    state.status = evalNow.valid ? "preview" : "draw";
    refreshStatus();
    draw();
  }

  function bindEvents() {
    canvas.addEventListener("mousedown", beginDraw);
    canvas.addEventListener("mousemove", moveDraw);
    window.addEventListener("mouseup", endDraw);

    canvas.addEventListener("touchstart", beginDraw, { passive: false });
    canvas.addEventListener("touchmove", moveDraw, { passive: false });
    canvas.addEventListener("touchend", endDraw, { passive: false });
    canvas.addEventListener("touchcancel", endDraw, { passive: false });

    resetBtn.addEventListener("click", resetRoute);
    driveBtn.addEventListener("click", startDriving);
    nextBtn.addEventListener("click", nextLevel);
  }

  bindEvents();
  resetRoute();
})();
