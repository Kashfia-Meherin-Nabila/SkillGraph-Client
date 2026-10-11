/*
  Lottie (Bodymovin) animations built in code, so they stay small and easy to tweak.

  To use an animation you downloaded from LottieFiles instead:
  save the .json file in this folder, import it, and pass it to <LottieAnimation data={...} />.
*/

const rgb = (hex) => {
  const n = parseInt(hex.slice(1), 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255, 1];
};

const still = (k) => ({ a: 0, k });

// Keyframes: [[frame, value], ...] with an ease-out curve between each pair
const anim = (frames) => ({
  a: 1,
  k: frames.map(([t, s], i) => {
    const kf = { t, s };
    if (i < frames.length - 1) {
      kf.o = { x: [0.2], y: [0.8] };
      kf.i = { x: [0.2], y: [1] };
    }
    return kf;
  }),
});

const groupTransform = {
  ty: "tr",
  p: still([0, 0]),
  a: still([0, 0]),
  s: still([100, 100]),
  r: still(0),
  o: still(100),
  sk: still(0),
  sa: still(0),
};

const group = (nm, items) => ({
  ty: "gr",
  it: [...items, groupTransform],
  nm,
  np: items.length,
  cix: 2,
  bm: 0,
  ix: 1,
  mn: "ADBE Vector Group",
  hd: false,
});

const path = (points) => ({
  ty: "sh",
  nm: "path",
  ks: still({
    i: points.map(() => [0, 0]),
    o: points.map(() => [0, 0]),
    v: points,
    c: false,
  }),
});

const trim = (end) => ({ ty: "tm", nm: "trim", s: still(0), e: end, o: still(0), m: 1 });

const stroke = (hex, width, opacity = 100) => ({
  ty: "st",
  nm: "stroke",
  c: still(rgb(hex)),
  o: still(opacity),
  w: still(width),
  lc: 2,
  lj: 2,
});

const fill = (hex, opacity = 100) => ({
  ty: "fl",
  nm: "fill",
  c: still(rgb(hex)),
  o: still(opacity),
  r: 1,
});

const circle = (d) => ({ ty: "el", nm: "circle", p: still([0, 0]), s: still([d, d]), d: 1 });

function builder(name, { w, h, fr, total }) {
  let ind = 0;
  const layers = [];

  return {
    // Layers added first are drawn on top
    add(nm, shapes, { p = [0, 0, 0], s, o, ip = 0, op = total } = {}) {
      layers.push({
        ddd: 0,
        ind: ++ind,
        ty: 4,
        nm,
        sr: 1,
        ks: {
          o: o ?? still(100),
          r: still(0),
          p: still(p),
          a: still([0, 0, 0]),
          s: s ?? still([100, 100, 100]),
        },
        ao: 0,
        shapes,
        ip,
        op,
        st: 0,
        bm: 0,
      });
    },
    build: () => ({ v: "5.7.4", fr, ip: 0, op: total, w, h, nm: name, ddd: 0, assets: [], layers }),
  };
}

/* ---------- 1. A skill graph assembling itself (loops) ---------- */

function buildGraph() {
  const TOTAL = 210;
  const FADE = [188, 207]; // everything fades out so the loop restarts cleanly
  const b = builder("skill-graph", { w: 400, h: 400, fr: 30, total: TOTAL });

  const nodes = {
    a: { p: [70, 320], color: "#0e9f8a", at: 6 },
    b: { p: [180, 210], color: "#0e9f8a", at: 22 },
    c: { p: [110, 90], color: "#0e9f8a", at: 38 },
    d: { p: [300, 290], color: "#f2a516", at: 58 },
    e: { p: [320, 110], color: "#8e9ab3", at: 74 },
  };

  // [from, to, start frame, end frame]
  const edges = [
    ["a", "b", 14, 30],
    ["b", "c", 30, 46],
    ["b", "d", 40, 62],
    ["c", "e", 46, 78],
    ["d", "e", 66, 90],
  ];

  const fade = anim([
    [0, [100]],
    [FADE[0], [100]],
    [FADE[1], [0]],
  ]);

  // Pulse rings around the "learn next" skill
  [96, 126, 156].forEach((start, i) => {
    b.add(
      `pulse-${i}`,
      [group("ring", [circle(54), stroke("#f2a516", 4)])],
      {
        p: [...nodes.d.p, 0],
        ip: start,
        op: start + 30,
        s: anim([
          [start, [100, 100, 100]],
          [start + 29, [185, 185, 100]],
        ]),
        o: anim([
          [start, [85]],
          [start + 29, [0]],
        ]),
      },
    );
  });

  for (const n of Object.values(nodes)) {
    b.add(
      "node",
      [group("dot", [circle(46), fill(n.color)]), group("halo", [circle(66), fill("#ffffff", 12)])],
      {
        p: [...n.p, 0],
        o: fade,
        s: anim([
          [n.at, [0, 0, 100]],
          [n.at + 9, [118, 118, 100]],
          [n.at + 16, [100, 100, 100]],
        ]),
      },
    );
  }

  for (const [from, to, start, end] of edges) {
    const a = nodes[from].p;
    const z = nodes[to].p;
    b.add("edge", [
      group("line", [
        path([a, z]),
        trim(
          anim([
            [start, [0]],
            [end, [100]],
          ]),
        ),
        stroke("#ffffff", 4, 40),
      ]),
    ], { o: fade });
  }

  return b.build();
}

/* ---------- 2. A check mark that draws itself (plays once) ---------- */

function buildCheck() {
  const b = builder("success-check", { w: 200, h: 200, fr: 30, total: 72 });

  b.add("check", [
    group("tick", [
      path([
        [-38, 2],
        [-12, 28],
        [40, -26],
      ]),
      trim(
        anim([
          [16, [0]],
          [36, [100]],
        ]),
      ),
      stroke("#ffffff", 12),
    ]),
  ], { p: [100, 100, 0] });

  b.add("burst", [group("ring", [circle(120), stroke("#0e9f8a", 4)])], {
    p: [100, 100, 0],
    ip: 14,
    op: 44,
    s: anim([
      [14, [100, 100, 100]],
      [43, [165, 165, 100]],
    ]),
    o: anim([
      [14, [90]],
      [43, [0]],
    ]),
  });

  b.add("disc", [group("fill", [circle(120), fill("#0e9f8a")])], {
    p: [100, 100, 0],
    s: anim([
      [0, [0, 0, 100]],
      [10, [112, 112, 100]],
      [17, [100, 100, 100]],
    ]),
  });

  return b.build();
}

/* ---------- 3. A readiness ring filling up beside three skill bars (loops) ---------- */

function buildRing() {
  const TOTAL = 200;
  const FADE = [180, 198];
  const b = builder("readiness-ring", { w: 400, h: 400, fr: 30, total: TOTAL });

  const center = [200, 150];
  const radius = 110;
  const percent = 72; // how far the ring fills

  const fade = anim([
    [0, [100]],
    [FADE[0], [100]],
    [FADE[1], [0]],
  ]);

  // A dot that pops in where the ring ends (the ring starts at the top and runs clockwise)
  const angle = (percent / 100) * 2 * Math.PI;
  const dotAt = [center[0] + radius * Math.sin(angle), center[1] - radius * Math.cos(angle), 0];
  b.add(
    "end-dot",
    [
      group("dot", [circle(30), fill("#f2a516")]),
      group("halo", [circle(52), fill("#f2a516", 25)]),
    ],
    {
      p: dotAt,
      o: fade,
      s: anim([
        [68, [0, 0, 100]],
        [78, [120, 120, 100]],
        [86, [100, 100, 100]],
      ]),
    },
  );

  b.add(
    "arc",
    [
      group("arc", [
        circle(radius * 2),
        trim(
          anim([
            [6, [0]],
            [70, [percent]],
          ]),
        ),
        stroke("#0e9f8a", 22),
      ]),
    ],
    { p: [...center, 0], o: fade },
  );

  b.add("track", [group("ring", [circle(radius * 2), stroke("#ffffff", 22, 14)])], {
    p: [...center, 0],
    o: fade,
  });

  // Three skill bars that grow from the left, each to its own level
  const BAR_W = 260;
  const BAR_H = 10;
  const bar = (color, opacity = 100) =>
    group("bar", [
      {
        ty: "rc",
        nm: "rect",
        d: 1,
        s: still([BAR_W, BAR_H]),
        p: still([BAR_W / 2, 0]),
        r: still(BAR_H / 2),
      },
      fill(color, opacity),
    ]);

  [
    { y: 300, level: 85, color: "#0e9f8a", at: 24 },
    { y: 328, level: 60, color: "#f2a516", at: 34 },
    { y: 356, level: 40, color: "#2f5bff", at: 44 },
  ].forEach(({ y, level, color, at }) => {
    b.add("bar-fill", [bar(color)], {
      p: [70, y, 0],
      o: fade,
      s: anim([
        [at, [0, 100, 100]],
        [at + 26, [level, 100, 100]],
      ]),
    });
  });

  [300, 328, 356].forEach((y) => {
    b.add("bar-track", [bar("#ffffff", 14)], { p: [70, y, 0], o: fade });
  });

  return b.build();
}

export const graphBuildAnimation = buildGraph();
export const successCheckAnimation = buildCheck();
export const readinessRingAnimation = buildRing();

// export const graphBuildAnimation = buildGraph();
// export const successCheckAnimation = buildCheck();

