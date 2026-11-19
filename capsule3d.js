// ============================================================
// L7 iHOME — інтерактивна 3D-капсула (Three.js)
// Форма відтворена за рендерами виробника (заміри по бокових
// видах, масштаб — за габаритами з деки):
//   T8  — 11 500 × 3 300 × 3 300, скляна тераса на торці
//   T6  —  8 500 × 3 300 × 3 300
//   P19 —  5 800 × 2 250 × 2 450 (основний корпус) + задній модуль
// Режими: «Ззовні» · «Усередині» (дах зрізано, планування орієнтовне —
//         за фото серійних капсул тих самих габаритів)
//         · «Шари стіни» (схема зі слайда деки).
// ============================================================
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";

const FOOT = 0.2;      // висота опор / рами
const ROOF = 0.43;     // верхній пояс (дах) довгих капсул
const BELT = 0.33;     // нижній пояс довгих капсул

// Заміри: x — від «малого» торця вздовж корпусу, м
const LONG = {
  t6: {
    L: 8.5, W: 3.3, H: 3.3, r: 0.6, balcony: null,
    win: {
      front: { s: { xi: 1.62, xb: 0.89 }, b: { xi: 4.65, xb: 5.39 } },
      back:  { s: { xi: 1.62, xb: 0.89 }, b: { xi: 4.65, xb: 5.39 } },
    },
    ch: { t: 0.45, b: 0.37 },
    coreTop: [[0.87, 0], [1.45, 0.33], [4.84, 0.33], [5.39, 0]],
    coreBot: [[0.87, 0], [1.5, -0.28], [4.8, -0.28], [5.39, 0]],
    seams: [2.10, 3.04, 4.14],
    door: { x0: 2.10, x1: 3.04, hx: 2.87 },
    louvre: { x0: 2.2, x1: 2.95 },
    feet: [1.09, 4.09, 7.36],
    mullions: { front: [[7.6, 0.12]], back: [] },
  },
  t8: {
    L: 11.5, W: 3.3, H: 3.3, r: 0.6, balcony: { x: 10.3, rail: 1.2 },
    win: {
      front: { s: { xi: 2.41, xb: 1.45 }, b: { xi: 6.30, xb: 7.25 } },
      back:  { s: { xi: 2.28, xb: 1.35 }, b: { xi: 6.12, xb: 7.07 } },
    },
    ch: { t: 0.47, b: 0.45 },
    coreTop: [[1.32, 0], [2.4, 0.38], [6.5, 0.38], [7.37, 0]],
    coreBot: [[1.32, 0], [2.6, -0.29], [5.7, -0.29], [7.37, 0]],
    seams: [2.99, 4.27, 5.73],
    door: { x0: 2.99, x1: 4.27, hx: 4.12 },
    louvre: { x0: 3.08, x1: 4.0 },
    feet: [1.37, 5.78, 10.0],
    mullions: { front: [[7.94, 0.03], [8.76, 0.03], [9.15, 0.14]], back: [] },
  },
};

const MODELS = {
  t8:  { code: "L7-T8",  area: "37.95 м²", guests: "4–6", dims: "11 500 × 3 300 × 3 300 мм" },
  t6:  { code: "L7-T6",  area: "28.05 м²", guests: "4–6", dims: "8 500 × 3 300 × 3 300 мм" },
  p19: { code: "L7-P19", area: "24.36 м²", guests: "1–2", dims: "5 800 × 2 250 × 2 450 мм" },
};

// Шари стіни — назви дослівно зі схеми внутрішньої структури в деці
const LAYERS = [
  { id: "skin",  name: "Алюмінієва панель корпусу", note: "фарба з фторвуглецевого покриття", color: 0xf3f5f7 },
  { id: "foam",  name: "Шар теплоізоляції", note: "поліуретан", color: 0x9cc97a },
  { id: "frame", name: "Оцинкований трубчастий каркас", note: "", color: 0x8d969f },
  { id: "inner", name: "Внутрішня панель", note: "алюміній / бамбукове вугільне волокно", color: 0xe7e1d6 },
  { id: "board", name: "Вологостійка фіброцементна плита", note: "основа підлоги", color: 0xb9b6ae },
  { id: "floor", name: "Дерев'яна підлога", note: "", color: 0xb98a5c },
  { id: "glass", name: "Подвійне ізоляційне скло", note: "торці та вікна", color: 0x2a3540 },
];

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// ---------- 2D helpers ----------
function roundedRect(w, h, r) {
  const s = new THREE.Shape();
  const x = -w / 2, y = -h / 2;
  r = Math.min(r, w / 2, h / 2);
  s.moveTo(x + r, y);
  s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + h - r); s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y);
  return s;
}
function roundedPath(w, h, r) {
  const p = new THREE.Path();
  const x = -w / 2, y = -h / 2;
  r = Math.min(r, w / 2, h / 2);
  p.moveTo(x + r, y);
  p.lineTo(x + w - r, y); p.quadraticCurveTo(x + w, y, x + w, y + r);
  p.lineTo(x + w, y + h - r); p.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  p.lineTo(x + r, y + h); p.quadraticCurveTo(x, y + h, x, y + h - r);
  p.lineTo(x, y + r); p.quadraticCurveTo(x, y, x + r, y);
  return p;
}
function ringGeo(w, h, r, t, len) {
  const s = roundedRect(w, h, r);
  s.holes.push(roundedPath(w - 2 * t, h - 2 * t, Math.max(r - t, 0.03)));
  const g = new THREE.ExtrudeGeometry(s, { depth: len, bevelEnabled: false, curveSegments: 20 });
  g.translate(0, 0, -len / 2);
  g.rotateY(Math.PI / 2);
  return g;
}
function capGeo(w, h, r) {
  const g = new THREE.ShapeGeometry(roundedRect(w, h, r), 20);
  g.rotateY(Math.PI / 2);
  return g;
}
// План капсули (вигляд згори): x0..x1 × ширина W, кути r (за потреби лише з одного боку)
function planShape(x0, x1, W, r, roundL = true, roundR = true) {
  const s = new THREE.Shape(), h = W / 2;
  s.moveTo(roundL ? x0 + r : x0, -h);
  if (roundR) { s.lineTo(x1 - r, -h); s.absarc(x1 - r, -h + r, r, -Math.PI / 2, 0, false); s.lineTo(x1, h - r); s.absarc(x1 - r, h - r, r, 0, Math.PI / 2, false); }
  else { s.lineTo(x1, -h); s.lineTo(x1, h); }
  if (roundL) { s.lineTo(x0 + r, h); s.absarc(x0 + r, h - r, r, Math.PI / 2, Math.PI, false); s.lineTo(x0, -h + r); s.absarc(x0 + r, -h + r, r, Math.PI, Math.PI * 1.5, false); }
  else { s.lineTo(x0, h); s.lineTo(x0, -h); }
  return s;
}
// Вертикальна «смуга» корпусу з плану: від yBottom висотою height, зі скругленими ребрами
function band(shape, yBottom, height, bevel) {
  const g = new THREE.ExtrudeGeometry(shape, {
    depth: Math.max(height - 2 * bevel, 0.001), bevelEnabled: bevel > 0,
    bevelThickness: bevel, bevelSize: bevel, bevelOffset: -bevel, bevelSegments: 5, curveSegments: 24,
  });
  g.rotateX(-Math.PI / 2);
  g.translate(0, yBottom + bevel, 0);
  return g;
}
// Точки по периметру плану (для вікон, швів, поруччя)
function perimeter(x0, x1, W, r, roundL, roundR, step = 0.04) {
  const pts = [], h = W / 2;
  const P = (x, z, nx, nz, side) => pts.push({ x, z, nx, nz, side });
  const fx0 = roundL ? x0 + r : x0, fx1 = roundR ? x1 - r : x1;
  const arc = (cx, cz, a0, a1, side) => {
    const n = 14;
    for (let i = 0; i <= n; i++) { const a = a0 + (a1 - a0) * i / n; P(cx + r * Math.cos(a), cz + r * Math.sin(a), Math.cos(a), Math.sin(a), side); }
  };
  for (let x = fx0; x <= fx1 + 1e-6; x += step) P(x, h, 0, 1, "front");
  if (roundR) { arc(x1 - r, h - r, Math.PI / 2, 0, "endR"); arc(x1 - r, -h + r, 0, -Math.PI / 2, "endR"); }
  else { for (let z = h; z >= -h - 1e-6; z -= step) P(x1, z, 1, 0, "sqR"); }
  for (let x = fx1; x >= fx0 - 1e-6; x -= step) P(x, -h, 0, -1, "back");
  if (roundL) { arc(x0 + r, -h + r, -Math.PI / 2, -Math.PI, "endL"); arc(x0 + r, h - r, Math.PI, Math.PI / 2, "endL"); }
  else { for (let z = -h; z <= h + 1e-6; z += step) P(x0, z, -1, 0, "sqL"); }
  pts.push(pts[0]);
  return pts;
}
// Поверхня вздовж периметра там, де fn(p) повертає [y0, y1]
function strip(pts, fn, off, mat) {
  const pos = [], idx = [], uv = [];
  let prev = -1, u = 0, lx = null, lz = null;
  for (const p of pts) {
    const r = fn(p);
    if (lx !== null) u += Math.hypot(p.x - lx, p.z - lz);
    lx = p.x; lz = p.z;
    if (!r) { prev = -1; continue; }
    const i = pos.length / 3;
    const x = p.x + p.nx * off, z = p.z + p.nz * off;
    pos.push(x, r[0], z, x, r[1], z);
    uv.push(u, r[0], u, r[1]);
    if (prev >= 0) idx.push(prev, i, prev + 1, prev + 1, i, i + 1);
    prev = i;
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  const m = new THREE.Mesh(g, mat);
  m.receiveShadow = true;
  return m;
}

export function initCapsule3D(root) {
  if (root.dataset.c3dInit) return;
  root.dataset.c3dInit = "1";
  const canvasWrap = root.querySelector(".c3d-canvas");
  const readout = {
    code: root.querySelector("[data-c3d=code]"),
    dims: root.querySelector("[data-c3d=dims]"),
    area: root.querySelector("[data-c3d=area]"),
    guests: root.querySelector("[data-c3d=guests]"),
  };
  const layerList = root.querySelector(".c3d-layers");
  const note = root.querySelector(".c3d-note");

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
  } catch (e) {
    root.classList.add("c3d--fallback");
    return;
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.localClippingEnabled = true;
  canvasWrap.appendChild(renderer.domElement);
  renderer.domElement.setAttribute("aria-label", "Інтерактивна 3D-модель капсульного будинку L7 iHOME");
  renderer.domElement.setAttribute("role", "img");

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  // Справжнє оточення для відбиттів: HDRI «meadow_2» (Poly Haven, CC0) — лука з деревами, як у склі на рендерах.
  // Переведено в легкий JPG і знебарвлено, щоб білий корпус не зеленів.
  new THREE.TextureLoader().load("assets/tex/env-meadow.jpg", (t) => {
    t.mapping = THREE.EquirectangularReflectionMapping;
    t.colorSpace = THREE.SRGBColorSpace;
    scene.environment = pmrem.fromEquirectangular(t).texture;
    t.dispose();
  });

  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 200);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.minDistance = 3;
  controls.maxDistance = 45;
  controls.maxPolarAngle = Math.PI * 0.49;
  controls.enablePan = false;
  controls.autoRotate = !reduceMotion;
  controls.autoRotateSpeed = 0.5;
  controls.addEventListener("start", () => { controls.autoRotate = false; });

  scene.add(new THREE.HemisphereLight(0xffffff, 0xdfe5ec, 0.85));
  const sun = new THREE.DirectionalLight(0xffffff, 2.2);
  sun.position.set(7, 15, 10);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -13, right: 13, top: 13, bottom: -13 });
  sun.shadow.radius = 6;
  sun.shadow.bias = -0.0004;
  scene.add(sun);

  const podium = new THREE.Mesh(new THREE.CylinderGeometry(9.5, 9.7, 0.16, 96), new THREE.MeshStandardMaterial({ color: 0xf2f4f7, roughness: 0.6 }));
  podium.position.y = -0.08;
  podium.receiveShadow = true;
  scene.add(podium);

  // ---------- materials ----------
  const roof = new THREE.Plane(new THREE.Vector3(0, -1, 0), 100);
  const clip = [roof];
  // Текстури елементів — за специфікацією серійних капсул (алюмінієва панель + запечена фторвуглецева фарба,
  // сталевий каркас, склопакет Low-E, замкова підлога під дерево) і сканами ambientCG (CC0):
  // Plastic013A — гладка біла запечена поверхня панелей; Metal027 — чорний порошковий метал рам і каркаса;
  // Rubber004 — гума ущільнювачів і п'ят опор; Metal009 — шліфований алюміній фурнітури й рам P19.
  const exLoader = new THREE.TextureLoader();
  const exTex = (f, rep, srgb = false) => { const t = exLoader.load(`assets/tex/acg/${f}.jpg`); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rep, rep); t.anisotropy = 8; if (srgb) t.colorSpace = THREE.SRGBColorSpace; return t; };
  const set = (id, rep, maps) => Object.fromEntries(maps.map((m) => [m, exTex(`${id}_${m}`, rep, m === "Color")]));
  const pPaint = set("Plastic013A", 2, ["NormalGL", "Roughness"]);
  const pPowder = set("Metal027", 3, ["Color", "NormalGL", "Roughness", "Metalness"]);
  const pRubber = set("Rubber004", 4, ["Color", "NormalGL", "Roughness"]);
  const pBrushed = set("Metal009", 1, ["Color", "NormalGL", "Roughness"]);
  // Фторвуглецева фарба на фото — сатин, не дзеркало: м'який лак (clearcoat) з розсіяним відблиском
  const mShell = new THREE.MeshPhysicalMaterial({ color: 0xeeeff1, roughness: 0.5, roughnessMap: pPaint.Roughness, metalness: 0.05, normalMap: pPaint.NormalGL, normalScale: new THREE.Vector2(0.2, 0.2), clearcoat: 0.55, clearcoatRoughness: 0.22, sheen: 0.15, sheenColor: 0xffffff, side: THREE.DoubleSide, clippingPlanes: clip, clipShadows: true });
  const mGap = new THREE.MeshStandardMaterial({ color: 0x0f1012, roughness: 0.6, side: THREE.DoubleSide, clippingPlanes: clip });   // глибока щілина між дахом/поясом і ядром
  const mFacet = mShell.clone(); mFacet.envMapIntensity = 0.45; mFacet.clearcoat = 0.2;   // скоси: без синього відблиску неба
  const mGlass = new THREE.MeshPhysicalMaterial({ color: 0x1c2024, roughness: 0.02, metalness: 0.35, reflectivity: 0.9, envMapIntensity: 2.4, transparent: true, opacity: 0.7, side: THREE.DoubleSide, clippingPlanes: clip, depthWrite: false });
  const mRail = new THREE.MeshPhysicalMaterial({ color: 0x4d565e, roughness: 0.03, metalness: 0.2, envMapIntensity: 1.6, transparent: true, opacity: 0.45, side: THREE.DoubleSide, clippingPlanes: clip, depthWrite: false });
  const mBlack = new THREE.MeshStandardMaterial({ color: 0x34373c, roughness: 0.8, metalness: 0, side: THREE.DoubleSide, clippingPlanes: clip });   // тіньові шви між панелями — темно-сіра щілина, не чорна
  // Рама вікна на фото — напівглянцевий чорний з відблиском на ребрі: порошкова фарба + тонкий лак
  const mFrame = new THREE.MeshPhysicalMaterial({ map: pPowder.Color, color: 0x55585d, metalness: 0.6, metalnessMap: pPowder.Metalness, roughness: 0.7, roughnessMap: pPowder.Roughness, normalMap: pPowder.NormalGL, normalScale: new THREE.Vector2(0.6, 0.6), clearcoat: 0.7, clearcoatRoughness: 0.18, side: THREE.DoubleSide, clippingPlanes: clip });
  const mRubber = new THREE.MeshStandardMaterial({ map: pRubber.Color, roughness: 1, roughnessMap: pRubber.Roughness, normalMap: pRubber.NormalGL, side: THREE.DoubleSide, clippingPlanes: clip });
  const mAlu = new THREE.MeshPhysicalMaterial({ map: pBrushed.Color, color: 0xd8dce0, metalness: 1, roughness: 1, roughnessMap: pBrushed.Roughness, normalMap: pBrushed.NormalGL, anisotropy: 0.5, clippingPlanes: clip });
  const mLouvre = new THREE.MeshPhysicalMaterial({ color: 0xe6e8eb, roughness: 0.6, roughnessMap: pPaint.Roughness, normalMap: pPaint.NormalGL, normalScale: new THREE.Vector2(0.25, 0.25), clearcoat: 0.6, clearcoatRoughness: 0.15, clippingPlanes: clip });

  const box = (w, h, d, mat, x, y, z, cast = true) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    m.position.set(x, y, z); m.castShadow = cast; m.receiveShadow = true;
    return m;
  };

  // ---------- матеріали інтер'єру ----------
  // Текстури: Poly Haven (CC0) — дуб-ламінат, настил, букле, льон, горіх;
  // сірий мармур згенеровано під панелі санвузлів із фото серійних капсул.
  const texLoader = new THREE.TextureLoader();
  const maxAniso = renderer.capabilities.getMaxAnisotropy();
  const tex = (file) => {
    const t = texLoader.load("assets/tex/" + file);
    if (!/_(NormalGL|Roughness|Metalness)\.jpg$/.test(file)) t.colorSpace = THREE.SRGBColorSpace;   // карти даних — лінійні
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.anisotropy = Math.min(8, maxAniso);
    return t;
  };
  const T = { floorC: tex("acg/WoodFloor064_Color.jpg"), floorN: tex("acg/WoodFloor064_NormalGL.jpg"), floorR: tex("acg/WoodFloor064_Roughness.jpg"),
    deckC: tex("acg/Planks029S_Color.jpg"), deckN: tex("acg/Planks029S_NormalGL.jpg"), deckR: tex("acg/Planks029S_Roughness.jpg"), oak: tex("floor-oak.jpg"), boucle: tex("boucle.jpg"), linen: tex("linen.jpg"), marble: tex("marble-grey.jpg"), walnut: tex("walnut.jpg") };
  const iMat = (o) => new THREE.MeshStandardMaterial({ roughness: 0.8, clippingPlanes: clip, ...o });
  const mOak = iMat({ map: T.floorC, normalMap: T.floorN, roughnessMap: T.floorR, color: 0x8a7d74, roughness: 1 });   // темна дерев'яна підлога, як на фото й рендерах
  const mDeckT = iMat({ map: T.deckC, normalMap: T.deckN, roughnessMap: T.deckR, color: 0x7d6656, roughness: 1 });
  const mBoucle = iMat({ map: T.boucle, color: 0xf3ede4, roughness: 1 });
  const mLinen = iMat({ color: 0xf4f2ed, roughness: 1 });
  const mThrow = iMat({ map: T.linen, color: 0xb4bcc4, roughness: 1 });
  const mCurtain = iMat({ color: 0xc9c6c0, roughness: 1, side: THREE.DoubleSide });
  const mMarble = iMat({ map: T.marble, roughness: 0.25 });
  const mVeneer = iMat({ map: T.oak, color: 0xf2e6d4, roughness: 0.5 });
  const mWalnut = iMat({ map: T.walnut, color: 0xc8a888, roughness: 0.5 });
  const mGloss = iMat({ color: 0xf4f4f2, roughness: 0.18 });
  const mCeramic = new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.1, clearcoat: 1, clippingPlanes: clip });
  const mClear = new THREE.MeshPhysicalMaterial({ color: 0xdfe8ee, roughness: 0.02, transparent: true, opacity: 0.22, side: THREE.DoubleSide, clippingPlanes: clip, depthWrite: false });
  const mMirror = new THREE.MeshStandardMaterial({ color: 0xcfd6dc, roughness: 0.02, metalness: 1, clippingPlanes: clip });
  const mMatteBlack = iMat({ color: 0x1b1c1e, roughness: 0.45, metalness: 0.4 });
  const mDarkChair = iMat({ color: 0x3f3d3b, roughness: 1 });
  const mWoodDark = iMat({ map: T.walnut, color: 0x7a5c45, roughness: 0.45 });     // крісла на рендері P19 — темне дерево
  const mSeat = iMat({ map: T.boucle, color: 0xdedbd5, roughness: 1 });             // світла подушка сидіння
  const mSage = iMat({ map: T.linen, color: 0xb3baa8, roughness: 1 });              // сіро-зелена постіль з рендера P19

  // UV під реальний розмір (повтор текстури ~ кожні `tile` м)
  const uvFit = (geo, sx, sy) => {
    const uv = geo.attributes.uv;
    for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * sx, uv.getY(i) * sy);
    return geo;
  };
  const slab = (w, h, d, mat, tile, x, y, z) => {
    const m = new THREE.Mesh(uvFit(new THREE.BoxGeometry(w, h, d), Math.max(w, h) / tile, Math.max(d, h) / tile), mat);
    m.position.set(x, y, z); m.castShadow = m.receiveShadow = true;
    return m;
  };

  // заокруглений брусок — м'які форми в тон корпусу капсули
  const soft = (w, h, d, r, mat, tile, x, y, z) => {
    const m = new THREE.Mesh(uvFit(new RoundedBoxGeometry(w, h, d, 3, Math.min(r, h / 2 - 0.001, w / 2 - 0.001, d / 2 - 0.001)), Math.max(w, h) / tile, Math.max(d, h) / tile), mat);
    m.position.set(x, y, z); m.castShadow = m.receiveShadow = true;
    return m;
  };

  // ---------- меблі (за реальними фото лінійки X50/X70/Y50) ----------
  const furn = {
    // двоспальне ліжко з високим м'яким узголів'ям; узголів'я на −x
    bed(len = 2.1, wid = 1.8, stands = [-1, 1], bedding = mLinen) {
      const g = new THREE.Group();
      g.add(soft(len, 0.3, wid, 0.06, mBoucle, 0.6, 0, 0.15, 0));
      g.add(soft(len - 0.12, 0.2, wid - 0.1, 0.07, mLinen, 1, 0.02, 0.4, 0));
      g.add(soft(len * 0.62, 0.06, wid - 0.02, 0.03, bedding, 0.6, len * 0.17, 0.52, 0));
      [-1, 1].forEach((s) => g.add(soft(0.34, 0.15, wid * 0.4, 0.07, mLinen, 1, -len / 2 + 0.3, 0.57, s * wid * 0.23)));
      g.add(soft(0.14, 1.15, wid + 0.25, 0.06, mBoucle, 0.6, -len / 2 - 0.05, 0.575, 0));
      stands.forEach((s) => g.add(soft(0.42, 0.45, 0.4, 0.04, mGloss, 1, -len / 2 + 0.2, 0.225, s * (wid / 2 + 0.36))));
      return g;
    },
    // м'який диван букле (як у розрізі X70), спинка на −z
    sofa(len = 1.9) {
      const g = new THREE.Group();
      g.add(soft(len, 0.42, 0.85, 0.08, mBoucle, 0.6, 0, 0.21, 0));
      g.add(soft(len, 0.42, 0.24, 0.1, mBoucle, 0.6, 0, 0.62, -0.31));
      [-1, 1].forEach((s) => g.add(soft(0.22, 0.27, 0.85, 0.1, mBoucle, 0.6, s * (len / 2 - 0.11), 0.54, 0)));
      [-1, 1].forEach((s) => g.add(soft(0.38, 0.34, 0.13, 0.06, mThrow, 0.6, s * len * 0.22, 0.6, -0.15)));
      return g;
    },
    // круглий столик: тонка стільниця, чорна ніжка й диск — біле/чорне, як корпус
    roundTable(r = 0.38, h = 0.4, top = mMarble, base = mMatteBlack) {
      const g = new THREE.Group();
      const t = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 0.03, 48), top); t.position.y = h - 0.015; t.castShadow = true; g.add(t);
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, h - 0.03, 16), base); leg.position.y = (h - 0.03) / 2; g.add(leg);
      const foot = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.55, r * 0.6, 0.02, 40), base); foot.position.y = 0.01; g.add(foot);
      return g;
    },
    rug(w, d) { return slab(w, 0.012, d, mLinen, 0.5, 0, 0.006, 0); },
    // шафа на всю висоту з глянцевими фасадами
    wardrobe(w, d, h) {
      const g = new THREE.Group();
      g.add(box(w, h, d, mGloss, 0, h / 2, 0));
      const n = Math.max(2, Math.round(w / 0.5));
      for (let i = 1; i < n; i++) g.add(box(0.006, h - 0.04, 0.006, mMatteBlack, -w / 2 + (w / n) * i, h / 2, d / 2 + 0.003));
      return g;
    },
    // штора, зібрана складками (висить від стелі); ширина вздовж x
    curtain(w, h) {
      const geo = new THREE.PlaneGeometry(w, h, 24, 1);
      const p = geo.attributes.position;
      for (let i = 0; i < p.count; i++) p.setZ(i, Math.sin((p.getX(i) / w) * Math.PI * 9) * 0.045);
      geo.computeVertexNormals();
      const m = new THREE.Mesh(uvFit(geo, w / 0.4, h / 0.4), mCurtain);
      m.position.y = h / 2; m.castShadow = true;
      const g = new THREE.Group(); g.add(m); g.userData.curtain = true; return g;
    },
    chair(mat = mBoucle) {
      const g = new THREE.Group();
      g.add(slab(0.46, 0.08, 0.46, mat, 0.5, 0, 0.46, 0));
      g.add(slab(0.46, 0.38, 0.06, mat, 0.5, 0, 0.7, -0.2));
      [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([a, b]) => g.add(box(0.03, 0.44, 0.03, mWalnut, a * 0.19, 0.22, b * 0.19)));
      return g;
    },
    // обідне крісло як на рендері P19: темне дерево, гнута спинка-підлокітники, світла подушка
    armchair() {
      const g = new THREE.Group();
      g.add(soft(0.5, 0.07, 0.48, 0.03, mSeat, 0.5, 0, 0.47, 0.02));
      g.add(soft(0.52, 0.035, 0.5, 0.012, mWoodDark, 0.5, 0, 0.42, 0.02));
      [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([a, b]) => {
        const l = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.012, 0.44, 10), mWoodDark);
        l.position.set(a * 0.22, 0.21, b * 0.2 + 0.02); l.rotation.set(-b * 0.07, 0, a * 0.07); l.castShadow = true; g.add(l);
      });
      const arc = new THREE.Mesh(new THREE.TorusGeometry(0.25, 0.024, 10, 40, Math.PI), mWoodDark);
      arc.rotation.x = -Math.PI / 2; arc.scale.set(1, 0.95, 1.4); arc.position.set(0, 0.7, 0.04); arc.castShadow = true; g.add(arc);
      [-1, 1].forEach((a) => { const p = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.25, 8), mWoodDark); p.position.set(a * 0.25, 0.575, 0.04); g.add(p); });
      const back = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.25, 8), mWoodDark); back.position.set(0, 0.575, -0.3); g.add(back);
      return g;
    },
    lounger() {   // крісло на терасі: чорна рама + полотно
      const g = new THREE.Group();
      g.add(box(0.62, 0.05, 0.7, mMatteBlack, 0, 0.3, 0));
      g.add(box(0.58, 0.1, 0.62, mDarkChair, 0, 0.37, 0.02));
      const back = box(0.58, 0.6, 0.08, mDarkChair, 0, 0.66, -0.3); back.rotation.x = -0.25; g.add(back);
      [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([a, b]) => g.add(box(0.03, 0.3, 0.03, mMatteBlack, a * 0.29, 0.15, b * 0.32)));
      return g;
    },
    // санвузол: мармурові стіни, душ зі склом у чорній рамі, унітаз, тумба з накладною раковиною.
    // Прямокутник x0..x1 × z0..z1 (z1 — бік приміщення, там стіна з дверима).
    bathroom(x0, x1, z0, z1, h, opts = {}) {
      const g = new THREE.Group();
      const w = x1 - x0, d = z1 - z0, t = 0.06;
      g.add(slab(w, 0.02, d, mMarble, 0.6, (x0 + x1) / 2, 0.01, (z0 + z1) / 2));
      if (opts.wallL !== false) g.add(slab(t, h, d, mMarble, 1.2, x0 + t / 2, h / 2, (z0 + z1) / 2));
      g.add(slab(t, h, d, mMarble, 1.2, x1 - t / 2, h / 2, (z0 + z1) / 2));
      // фронтальна стіна з прорізом під двері 0.7 м біля x1
      const dw = 0.7, wl = w - dw - 0.1;
      g.add(slab(wl, h, t, mMarble, 1.2, x0 + wl / 2, h / 2, z1 - t / 2));
      g.add(box(dw + 0.1, h - 2.05, t, mMarble, x1 - (dw + 0.1) / 2, 2.05 + (h - 2.05) / 2, z1 - t / 2));
      const door = box(dw, 2.0, 0.04, mVeneer, x1 - 0.05 - dw / 2, 1.0, z1 - t / 2);
      g.add(door);
      // душ у кутку x1/z0: скло в чорній рамі
      const sw = 0.9, sx = x1 - t - sw / 2, sz = z0 + 0.06 + sw / 2, sh = Math.min(2.0, h - 0.1);   // душ не вище стелі модуля
      g.add(box(sw, 0.04, sw, mGloss, sx, 0.03, sz));
      const gl1 = new THREE.Mesh(new THREE.PlaneGeometry(sw, sh), mClear); gl1.position.set(sx, sh / 2 + 0.05, sz + sw / 2); g.add(gl1);
      const gl2 = new THREE.Mesh(new THREE.PlaneGeometry(sw, sh), mClear); gl2.rotation.y = Math.PI / 2; gl2.position.set(sx - sw / 2, sh / 2 + 0.05, sz); g.add(gl2);
      g.add(box(0.025, sh, 0.025, mMatteBlack, sx - sw / 2, sh / 2 + 0.05, sz + sw / 2));
      g.add(box(sw, 0.025, 0.025, mMatteBlack, sx, sh + 0.05, sz + sw / 2));
      g.add(box(0.025, 0.025, sw, mMatteBlack, sx - sw / 2, sh + 0.05, sz));
      g.add(box(0.02, 0.5, 0.02, mMatteBlack, sx - sw / 2 + 0.06, 1.05, sz + sw / 2 + 0.03));
      g.add(box(0.22, 0.015, 0.22, mMatteBlack, sx + 0.1, 1.95, sz - 0.1));
      g.add(box(0.025, 1.1, 0.025, mMatteBlack, sx + 0.1, 1.4, z0 + 0.08));
      // унітаз (підвісний бачок / смарт) і тумба з раковиною біля x0
      const wc = new THREE.Group();
      const bowl = new THREE.Mesh(new THREE.CylinderGeometry(0.19, 0.16, 0.4, 28), mCeramic); bowl.scale.set(1, 1, 1.3); bowl.position.y = 0.2; wc.add(bowl);
      wc.add(box(0.4, 0.3, 0.16, mCeramic, 0, 0.55, -0.28));
      wc.position.set(sx - sw / 2 - 0.35, 0, z0 + 0.36); g.add(wc);
      const vw = Math.min(1.0, sx - sw / 2 - 0.7 - x0 - 0.06);
      if (vw > 0.45) {
        const vx = x0 + t + vw / 2 + 0.02;
        g.add(slab(vw, 0.42, 0.48, mVeneer, 0.6, vx, 0.6, z0 + 0.3));
        g.add(slab(vw + 0.02, 0.04, 0.5, mMarble, 0.6, vx, 0.83, z0 + 0.3));
        g.add(box(0.46, 0.12, 0.32, mCeramic, vx, 0.91, z0 + 0.32));
        g.add(box(0.03, 0.2, 0.03, mMatteBlack, vx, 0.95, z0 + 0.12));
        g.add(box(Math.min(0.8, vw), 0.7, 0.02, mMirror, vx, 1.55, z0 + 0.075));
      } else {
        // вузький варіант: умивальник на стіні біля унітаза
        g.add(box(0.42, 0.1, 0.32, mCeramic, x0 + t + 0.3, 0.86, z1 - t - 0.2));
      }
      return g;
    },
  };

  // ---------- capsule ----------
  const capsule = new THREE.Group();
  const body = new THREE.Group();
  const interior = new THREE.Group();
  capsule.add(body);
  scene.add(capsule);

  // тонка лінія (шов) на боковій грані: від (x1,y1) до (x2,y2), сторона s=+1 фронт / −1 тил
  const line = (x1, y1, x2, y2, zFace, s, w = 0.016, mat = mBlack) => {
    const len = Math.hypot(x2 - x1, y2 - y1);
    const m = new THREE.Mesh(new THREE.PlaneGeometry(len, w), mat);
    m.position.set((x1 + x2) / 2, (y1 + y2) / 2, zFace + s * 0.006);
    m.rotation.z = Math.atan2(y2 - y1, x2 - x1);
    if (s < 0) { m.rotation.y = Math.PI; m.rotation.z = -m.rotation.z; }
    body.add(m);
  };

  function buildLong(key) {
    const C = LONG[key];
    const { L, W, H, r } = C;
    const h = W / 2;
    const yb = FOOT + BELT;            // низ вікон
    const yt = FOOT + H - ROOF;        // верх вікон / шов даху
    const yTop = FOOT + H;
    const Lw = C.balcony ? C.balcony.x : L;
    body.position.x = -L / 2;

    // пояси корпусу
    const base = new THREE.Mesh(band(planShape(0, L, W, r), FOOT, BELT + 0.02, 0.1), mShell);
    const top = new THREE.Mesh(band(planShape(0, L, W, r), yt, ROOF, 0.05), mShell);
    [base, top].forEach((m) => { m.castShadow = true; m.receiveShadow = true; body.add(m); });

    // вікна: шестикутні отвори зі скосом у бік ядра
    const wallPts = perimeter(0, Lw, W, r, true, !C.balcony);
    const winFn = (grow) => (p) => {
      if (p.side === "sqR") return null;
      if (p.side === "endL" || p.side === "endR") return [yb - grow, yt + grow];
      const w = C.win[p.side];
      const shape = (xi, xb) => {
        const t = Math.min(1, Math.max(0, (p.x - xb) / (xi - xb)));
        return [yb + t * C.ch.b - grow, yt - t * C.ch.t + grow];
      };
      if (p.x <= w.s.xi + grow) return p.x < w.s.xb ? [yb - grow, yt + grow] : shape(w.s.xi + grow, w.s.xb);
      if (p.x >= w.b.xi - grow) return p.x > w.b.xb ? [yb - grow, yt + grow] : shape(w.b.xi - grow, w.b.xb);
      return null;
    };
    // Стіни зі справжніми прорізами (як на фото: крізь скло видно інтер'єр), зовнішня й внутрішня обшивка
    const mid = (yb + yt) / 2, open0 = winFn(0);
    const wallLo = (p) => { if (p.side === "sqR") return null; const o = open0(p); return [yb, o ? Math.max(yb, o[0]) : mid]; };
    const wallHi = (p) => { if (p.side === "sqR") return null; const o = open0(p); return [o ? Math.min(yt, o[1]) : mid, yt]; };
    [0, -0.08].forEach((off) => [wallLo, wallHi].forEach((fn) => { const m = strip(wallPts, fn, off, mShell); m.castShadow = true; body.add(m); }));
    // Товста чорна рама-кільце навколо прорізу (зовні й зсередини) і втоплене скло
    const FR = 0.085, openF = winFn(FR);
    const frameTop = (p) => { const o = openF(p); if (!o) return null; const i = open0(p); return i ? [i[1], o[1]] : o; };
    const frameBot = (p) => { const o = openF(p); if (!o) return null; const i = open0(p); return i ? [o[0], i[0]] : null; };
    [0.004, -0.084].forEach((off) => { body.add(strip(wallPts, frameTop, off, mFrame)); body.add(strip(wallPts, frameBot, off, mFrame)); });
    body.add(strip(wallPts, open0, -0.035, mGlass));

    // шви поясів (лише на торцевих «капсулах», ядро — суцільні панелі)
    const podFn = (y) => (p) => {
      if (p.side === "endL" || p.side === "endR" || p.side === "sqR") return [y - 0.012, y + 0.012];
      const w = C.win[p.side];
      return (p.x < w.s.xb || p.x > w.b.xb) ? [y - 0.012, y + 0.012] : null;
    };
    const fullPts = perimeter(0, L, W, r, true, true);
    body.add(strip(fullPts, podFn(yt), 0.006, mBlack));
    body.add(strip(fullPts, podFn(yb), 0.006, mBlack));

    // лінії ядра, шви панелей, стійки, опори
    [1, -1].forEach((s) => {
      const zf = s * h;
      for (let i = 0; i < C.coreTop.length - 1; i++) line(C.coreTop[i][0], yt + C.coreTop[i][1], C.coreTop[i + 1][0], yt + C.coreTop[i + 1][1], zf, s, 0.032, mGap);
      for (let i = 0; i < C.coreBot.length - 1; i++) line(C.coreBot[i][0], yb + C.coreBot[i][1], C.coreBot[i + 1][0], yb + C.coreBot[i + 1][1], zf, s, 0.032, mGap);
      C.seams.forEach((x) => line(x, yb + C.coreBot[1][1], x, yt + C.coreTop[1][1], zf, s, 0.02));
      [C.coreTop[0][0], C.coreTop[3][0]].forEach((x) => { line(x, yt, x, yTop - 0.05, zf + s * 0.05, s, 0.018); line(x, FOOT + 0.1, x, yb, zf + s * 0.05, s, 0.018); });
      (C.mullions[s > 0 ? "front" : "back"] || []).forEach(([x, w]) => line(x, yb, x, yt, zf + s * 0.008, s, w));
      C.feet.forEach((x) => {
        body.add(box(0.12, FOOT, 0.12, mFrame, x, FOOT / 2, s * (h - 0.45)));
        body.add(box(0.3, 0.02, 0.24, mRubber, x, 0.01, s * (h - 0.45)));
      });
    });

    // Скошені грані-клини під лініями ядра (на фото — світлотінь під дахом і над поясом).
    // Клин сходить нанівець біля кутів вікон; нахил задано нормаллю, геометрія лежить у площині стіни.
    const FW = 0.16, tilt = 0.7;
    const wedge = (pts, dir, s) => {
      const pos = [];
      const P = pts.map(([x, dy]) => [x, (dir > 0 ? yt : yb) + dy]);
      const Q = P.map(([x, y], i) => [x, i === 0 || i === P.length - 1 ? y : y - dir * FW]);
      const z = s * (h + 0.003);
      for (let i = 0; i < P.length - 1; i++) {
        const a = P[i], b = P[i + 1], c = Q[i + 1], d = Q[i];
        pos.push(a[0], a[1], z, d[0], d[1], z, b[0], b[1], z, b[0], b[1], z, d[0], d[1], z, c[0], c[1], z);
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
      const n = new THREE.Vector3(0, -dir * Math.sin(tilt), s * Math.cos(tilt));
      g.setAttribute("normal", new THREE.Float32BufferAttribute(pos.map((_, i) => [n.x, n.y, n.z][i % 3]), 3));
      g.setAttribute("uv", new THREE.Float32BufferAttribute(pos.flatMap((v, i) => (i % 3 === 2 ? [] : [v])), 2));
      const m = new THREE.Mesh(g, mFacet); m.receiveShadow = true; body.add(m);
    };
    [1, -1].forEach((s) => {
      wedge(C.coreTop, 1, s); wedge(C.coreBot, -1, s);
      // горизонтальні шви бічних панелей (≈ 1/3 і 2/3 висоти) і шов на рівні даху біля дверей
      const w = C.win[s > 0 ? "front" : "back"], zf = s * h;
      [yb + 0.56, yt - 0.55].forEach((y) => { line(w.s.xi + FR, y, C.seams[0], y, zf, s, 0.014); line(C.seams[2], y, w.b.xi - FR, y, zf, s, 0.014); });
      line(C.seams[1], yt - 0.02, C.seams[2], yt - 0.02, zf, s, 0.014);
    });

    // ---------- об'ємний «панцир» корпусу ----------
    // Як на головному фото: дах, нижній пояс і обрамлення вікон — товща оболонка, що виступає на SD
    // над утопленим ядром (двері, бічні панелі). Перехід — справжня сходинка з фаскою, вікна сидять у нішах.
    const SD = 0.05, SB = 0.018;
    const lerpPts = (pts, x, base) => {
      if (x < pts[0][0] || x > pts[pts.length - 1][0]) return null;
      for (let i = 0; i < pts.length - 1; i++) {
        const [x0, d0] = pts[i], [x1, d1] = pts[i + 1];
        if (x <= x1) return base + d0 + (d1 - d0) * ((x - x0) / (x1 - x0 || 1));
      }
      return base + pts[pts.length - 1][1];
    };
    const winEdge = (w, x, top) => {     // верх/низ прорізу на рівній боковій грані, null — тут не вікно
      if (C.balcony && x > Lw) return top ? yt : yb;
      const ch = top ? -C.ch.t : C.ch.b, y0 = top ? yt : yb;
      const t = (xb, xi) => Math.min(1, Math.max(0, (x - xb) / (xi - xb)));
      if (x <= w.s.xi) return y0 + t(w.s.xb, w.s.xi) * ch;
      if (x >= w.b.xi) return y0 + t(w.b.xb, w.b.xi) * ch;
      return null;
    };
    const shellPiece = (w, top) => {
      const x0 = r, x1 = L - r, sh = new THREE.Shape(), yE = top ? yTop : FOOT;
      const edge = (x) => {
        const c = lerpPts(top ? C.coreTop : C.coreBot, x, top ? yt : yb);
        const we = winEdge(w, x, top);
        const wv = we === null ? null : we + (top ? FR : -FR) * (C.balcony && x > Lw ? 0 : 1);
        const vals = [c, wv].filter((v) => v !== null);
        return vals.length ? (top ? Math.max(...vals) : Math.min(...vals)) : (top ? yt : yb);
      };
      sh.moveTo(x0, yE); sh.lineTo(x1, yE);
      for (let x = x1; x >= x0 - 1e-6; x -= 0.02) sh.lineTo(x, edge(x));
      return new THREE.ExtrudeGeometry(sh, { depth: SD, bevelEnabled: true, bevelThickness: SB, bevelSize: SB, bevelOffset: -SB, bevelSegments: 3, curveSegments: 4 });
    };
    [1, -1].forEach((s) => {
      const w = C.win[s > 0 ? "front" : "back"];
      [true, false].forEach((top) => {
        const m = new THREE.Mesh(shellPiece(w, top), mShell);
        m.position.z = s * (h - SB); m.scale.z = s;
        m.castShadow = m.receiveShadow = true;
        body.add(m);
      });
    });

    // двері (фронт): контур полотна + ручка
    const d = C.door, dz = h + 0.006;
    const dy0 = yb - 0.05, dy1 = yt + 0.05;
    line(d.x0 + 0.07, dy0, d.x1 - 0.07, dy0, h, 1, 0.012);
    line(d.x0 + 0.07, dy1, d.x1 - 0.07, dy1, h, 1, 0.012);
    line(d.x0 + 0.07, dy0, d.x0 + 0.07, dy1, h, 1, 0.012);
    line(d.x1 - 0.07, dy0, d.x1 - 0.07, dy1, h, 1, 0.012);
    body.add(box(0.05, 0.22, 0.04, mBlack, d.hx, FOOT + 1.45, dz + 0.02));
    body.add(box(0.03, 0.03, 0.09, mAlu, d.hx, FOOT + 1.4, dz + 0.05));

    // жалюзійна решітка (тил)
    const lv = C.louvre, ly0 = yb + 0.2, ly1 = yt - 0.15;
    body.add(box(lv.x1 - lv.x0, ly1 - ly0, 0.02, mLouvre, (lv.x0 + lv.x1) / 2, (ly0 + ly1) / 2, -h - 0.01));
    for (let y = ly0 + 0.05; y < ly1 - 0.03; y += 0.075) body.add(box(lv.x1 - lv.x0 - 0.06, 0.018, 0.04, mAlu, (lv.x0 + lv.x1) / 2, y, -h - 0.03, false));

    // тераса T8: настил, поруччя, скляна стінка кімнати, кутові стійки
    if (C.balcony) {
      const bx = C.balcony.x;
      body.add(new THREE.Mesh(band(planShape(bx, L - 0.03, W - 0.06, r - 0.03, false, true), yb - 0.02, 0.03, 0), mDeckT));
      const railPts = perimeter(bx, L, W, r, false, true);
      body.add(strip(railPts, (p) => (p.side === "sqL" ? null : [yb, yb + C.balcony.rail]), 0.012, mRail));
      body.add(strip(railPts, (p) => (p.side === "sqL" ? null : [yb + C.balcony.rail - 0.02, yb + C.balcony.rail + 0.01]), 0.014, mFrame));
      const gw = new THREE.Mesh(new THREE.PlaneGeometry(W - 0.12, yt - yb), mGlass);
      gw.rotation.y = Math.PI / 2; gw.position.set(bx, (yb + yt) / 2, 0);
      body.add(gw);
      [h - 0.05, -h + 0.05].forEach((z) => body.add(box(0.1, yt - yb, 0.1, mFrame, bx, (yb + yt) / 2, z)));
    }

    // ---------- інтер'єр (орієнтовне планування) ----------
    // Зони прив'язані до екстер'єру з рендерів: санвузол — за жалюзі біля дверей,
    // ліжко — у великому склі, малий скляний торець — друга спальня (T8) / їдальня (T6).
    // Матеріали й меблі — за реальними фото серійних капсул тих самих габаритів.
    const fy = yb + 0.04, iw = W - 0.3, zi = iw / 2, ch = yt - yb - 0.07;   // підлога над поясом корпусу
    const put = (o, x, z, ry = 0) => { o.position.set(x, fy, z); o.rotation.y = ry; interior.add(o); return o; };
    interior.add(slab(Lw - 0.3, 0.02, iw, mOak, 1.4, Lw / 2, fy - 0.01, 0));
    const curtainPair = (x, w = 0.55) => [1, -1].forEach((s) => put(furn.curtain(w, ch - 0.05), x, s * (zi - 0.08)));
    if (key === "t8") {
      // друга спальня в малому торці
      put(furn.bed(2.0, 1.6), 1.85, 0, Math.PI);
      curtainPair(2.15, 0.45);
      // санвузол за жалюзі (тил), передпокій і шафа біля дверей (фронт)
      put(furn.bathroom(2.95, 5.0, -zi, -0.1, ch), 0, 0);
      put(furn.wardrobe(1.1, 0.55, 2.3), 4.95, zi - 0.3);
      // головна спальня: узголів'я до ядра, ліжко «дивиться» на скло й терасу
      put(furn.bed(2.1, 1.8), 6.6, 0);
      curtainPair(6.45);
      // вітальня біля скляної стінки тераси
      put(furn.rug(2.0, 2.2), 9.05, -0.1);
      put(furn.sofa(1.9), 9.05, -zi + 0.55);
      put(furn.roundTable(0.38, 0.38), 9.1, 0.25);
      put(furn.armchair(), 9.25, zi - 0.5, Math.PI);
      curtainPair(10.05, 0.4);
      // тераса: настил і два крісла зі столиком
      put(furn.lounger(), 10.85, 0.75, -Math.PI / 2);
      put(furn.lounger(), 10.85, -0.75, -Math.PI / 2);
      put(furn.roundTable(0.22, 0.45, mMatteBlack), 11.1, 0);
    } else {
      // їдальня в малому скляному торці
      const tbl = new THREE.Group();
      tbl.add(slab(0.8, 0.04, 1.3, mMarble, 0.8, 0, 0.74, 0));   // біла кам'яна стільниця, як на фото X70
      tbl.add(box(0.5, 0.72, 0.5, mGloss, 0, 0.36, 0));
      put(tbl, 0.95, 0);
      [[-0.32, 1], [0.32, 1], [-0.32, -1], [0.32, -1]].forEach(([dz, s]) => put(furn.armchair(), 0.95 + s * 0.55, dz, s > 0 ? -Math.PI / 2 : Math.PI / 2));
      curtainPair(1.5, 0.4);
      // санвузол за жалюзі, шафа біля дверей
      put(furn.bathroom(1.95, 3.75, -zi, -0.1, ch), 0, 0);
      put(furn.wardrobe(1.1, 0.55, 2.3), 3.75, zi - 0.3);
      // спальня у великому склі + диван (спальне місце для гостей)
      put(furn.bed(2.1, 1.8), 5.5, 0);
      curtainPair(4.85);
      put(furn.rug(1.6, 1.8), 7.45, -0.15);
      put(furn.sofa(1.6), 7.35, -zi + 0.55);
      put(furn.roundTable(0.32, 0.38), 7.45, 0.35);
    }
    interior.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
    body.add(interior);
    capsule.userData = { L, W, H: H + FOOT, base: FOOT, cut: FOOT + H * 0.66 };
  }

  function buildP19() {
    const L = 5.8, D = 2.25, Dr = 1.95, Hs = 2.45 - FOOT, rr = 0.39;
    body.position.x = -L / 2;
    const zFront = (D + Dr) / 2, zBack = zFront - D - Dr;   // разом 4.2 м
    const prof = (len, hgt, rad) => {   // фасадний профіль: скруглені лише верхні кути
      const s = new THREE.Shape();
      s.moveTo(0, 0); s.lineTo(len, 0); s.lineTo(len, hgt - rad);
      s.quadraticCurveTo(len, hgt, len - rad, hgt); s.lineTo(rad, hgt);
      s.quadraticCurveTo(0, hgt, 0, hgt - rad); s.lineTo(0, 0);
      return s;
    };
    const ext = (shape, depth) => new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: true, bevelThickness: 0.03, bevelSize: 0.03, bevelOffset: -0.03, bevelSegments: 4, curveSegments: 24 });
    // Корпус як на рендерах: товста біла оболонка-«труба» (стінки, дах, підлога T), фасад відкритий під скління,
    // скло втоплене всередину рами. Задній модуль — така сама оболонка, глуха ззаду, з віконцем.
    const TH = 0.12;
    const profAt = (x0, len, hgt, rad, y0 = 0, path = false) => {
      const s = path ? new THREE.Path() : new THREE.Shape();
      s.moveTo(x0, y0); s.lineTo(x0 + len, y0); s.lineTo(x0 + len, y0 + hgt - rad);
      s.quadraticCurveTo(x0 + len, y0 + hgt, x0 + len - rad, y0 + hgt); s.lineTo(x0 + rad, y0 + hgt);
      s.quadraticCurveTo(x0, y0 + hgt, x0, y0 + hgt - rad); s.lineTo(x0, y0);
      return s;
    };
    const shellMesh = (shape, depth, z) => {
      const m = new THREE.Mesh(ext(shape, depth), mShell);
      m.position.set(0, FOOT, z); m.castShadow = m.receiveShadow = true; body.add(m); return m;
    };
    const R = { x0: 0.06, len: L - 0.12, hgt: Hs - 0.14, rad: rr - 0.03 };   // габарит заднього модуля
    // основний корпус: оболонка з прорізом під фасад
    const mainSh = profAt(0, L, Hs, rr);
    mainSh.holes.push(profAt(TH, L - 2 * TH, Hs - 2 * TH, rr - TH * 0.6, TH, true));
    shellMesh(mainSh, D - 0.06, zFront - D + 0.03);
    // задня стінка основного корпусу навколо входу в задній модуль
    const capSh = profAt(0, L, Hs, rr);
    capSh.holes.push(profAt(R.x0 + TH, R.len - 2 * TH, R.hgt - 2 * TH, R.rad - TH * 0.6, TH, true));
    shellMesh(capSh, 0.1, zFront - D - 0.03);
    // задній модуль: оболонка + глуха задня стінка з віконцем
    const rearSh = profAt(R.x0, R.len, R.hgt, R.rad);
    rearSh.holes.push(profAt(R.x0 + TH, R.len - 2 * TH, R.hgt - 2 * TH, R.rad - TH * 0.6, TH, true));
    shellMesh(rearSh, Dr - 0.06, zBack + 0.03);
    const backSh = profAt(R.x0, R.len, R.hgt, R.rad);
    const wx = 3.2, wy = 1.35 - FOOT;
    backSh.holes.push(profAt(wx - 0.16, 0.32, 0.32, 0.001, wy - 0.16, true));
    shellMesh(backSh, 0.04, zBack + 0.03);
    // тіньовий шов точно по контуру заднього модуля, де він виходить з основного
    const seamShape = profAt(R.x0 - 0.012, R.len + 0.024, R.hgt + 0.012, R.rad + 0.012);
    seamShape.holes.push(profAt(R.x0 + 0.004, R.len - 0.008, R.hgt - 0.004, R.rad - 0.004, 0, true));
    const seam = new THREE.Mesh(new THREE.ExtrudeGeometry(seamShape, { depth: 0.02, bevelEnabled: false, curveSegments: 20 }), mGap);
    seam.position.set(0, FOOT, zFront - D - 0.081);
    body.add(seam);

    // рама-основа
    [zFront - 0.15, zBack + 0.15, (zFront + zBack) / 2].forEach((z) => body.add(box(L + 0.1, 0.12, 0.1, mFrame, L / 2, FOOT - 0.06, z)));
    for (let x = 0.05; x <= L; x += 0.95) body.add(box(0.1, 0.1, zFront - zBack - 0.2, mFrame, x, FOOT - 0.12, (zFront + zBack) / 2));
    body.add(box(L + 0.12, 0.05, 0.12, mFrame, L / 2, FOOT - 0.16, zFront + 0.02));

    // скління фасаду: секції за рендером (x, м від лівого краю)
    const gy0 = FOOT + 0.12, gy1 = FOOT + Hs - 0.12, zf = zFront - 0.13;   // скло втоплене в оболонку
    const panes = [[0.21, 0.86], [0.92, 2.10], [2.15, 3.26], [3.36, 4.10], [4.14, 4.93], [4.98, 5.60]];
    panes.forEach(([a, b]) => {
      const g = new THREE.Mesh(new THREE.PlaneGeometry(b - a - 0.06, gy1 - gy0 - 0.06), mGlass);
      g.position.set((a + b) / 2, (gy0 + gy1) / 2, zf + 0.01); body.add(g);
      body.add(box(b - a, 0.035, 0.03, mAlu, (a + b) / 2, gy0 + 0.017, zf));
      body.add(box(b - a, 0.035, 0.03, mAlu, (a + b) / 2, gy1 - 0.017, zf));
      body.add(box(0.035, gy1 - gy0, 0.03, mAlu, a + 0.017, (gy0 + gy1) / 2, zf));
      body.add(box(0.035, gy1 - gy0, 0.03, mAlu, b - 0.017, (gy0 + gy1) / 2, zf));
    });
    body.add(box(0.03, 0.2, 0.05, mAlu, 4.12, 1.32, zf + 0.03)); // ручка розсувних дверей
    // віконце на тильній стороні заднього модуля
    [[0, 0.16], [0, -0.16]].forEach(([dx, dy]) => body.add(box(0.34, 0.025, 0.05, mAlu, 3.2, 1.35 + dy, zBack + 0.05)));
    [[0.16, 0], [-0.16, 0]].forEach(([dx]) => body.add(box(0.025, 0.34, 0.05, mAlu, 3.2 + dx, 1.35, zBack + 0.05)));
    const sw = new THREE.Mesh(new THREE.PlaneGeometry(0.31, 0.31), mGlass);
    sw.position.set(3.2, 1.35, zBack + 0.06); sw.rotation.y = Math.PI; body.add(sw);

    // інтер'єр за рендерами P19: ліжко ліворуч, висока шафа по центру, стіл зі скатертиною праворуч;
    // у задньому модулі — санвузол (віконце на тилу) і шафи/кухонна стійка
    const fy = FOOT + 0.12, ih = Hs - 0.25, ihR = Hs - 0.14 - 2 * 0.12 - 0.16;   // ihR — під стелею заднього модуля (нижчий)
    const put = (o, x, z, ry = 0) => { o.position.set(x, fy, z); o.rotation.y = ry; interior.add(o); return o; };
    interior.add(slab(L - 0.3, 0.02, D + Dr - 0.4, mOak, 1.4, L / 2, fy - 0.01, (zFront + zBack) / 2));
    put(furn.bed(2.0, 1.6, [], mSage), 1.2, zFront - 1.05);
    put(furn.wardrobe(0.95, 0.6, 1.9), 2.75, -0.1 + 0.3 + 0.02);
    const tbl = new THREE.Group();
    tbl.add(box(1.0, 0.04, 0.8, mLinen, 0, 0.75, 0));
    tbl.add(box(1.02, 0.28, 0.82, mLinen, 0, 0.62, 0));
    put(tbl, 4.45, zFront - 1.0);
    put(furn.armchair(), 3.75, zFront - 1.0, -Math.PI / 2);
    put(furn.armchair(), 5.15, zFront - 1.0, Math.PI / 2);
    [0.9, 3.35, 5.62].forEach((x) => put(furn.curtain(0.3, ih - 0.1), x, zFront - 0.12));
    put(furn.wardrobe(1.9, 0.55, ihR), 1.15, zBack + 0.35);
    put(furn.bathroom(2.25, 4.15, zBack + 0.16, -0.2, ihR), 0, 0);
    const kit = new THREE.Group();
    kit.add(slab(1.3, 0.88, 0.58, mGloss, 0.6, 0, 0.44, 0));
    kit.add(slab(1.32, 0.04, 0.6, mMarble, 0.6, 0, 0.9, 0));
    put(kit, 4.9, zBack + 0.4);
    interior.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
    body.add(interior);
    capsule.userData = { L, W: zFront - zBack, H: 2.45, base: FOOT, cut: FOOT + 1.55 };
  }

  function buildCapsule(key) {
    body.clear(); interior.clear();
    if (key === "p19") buildP19(); else buildLong(key);
  }

  // ---------- шари конструкції (розібраний сегмент) ----------
  const layersGroup = new THREE.Group();
  scene.add(layersGroup);
  const layerMeshes = {};
  (function buildLayers() {
    const seg = 1.6, cy = FOOT + 3.3 / 2;
    let w = 3.3, hgt = 3.3, rr = 0.35;
    const thick = { skin: 0.035, foam: 0.09, frame: 0.05, inner: 0.03 };
    ["skin", "foam", "frame", "inner"].forEach((id) => {
      const Ld = LAYERS.find((l) => l.id === id);
      const mat = new THREE.MeshPhysicalMaterial({ color: Ld.color, roughness: id === "skin" ? 0.25 : 0.7, metalness: id === "frame" ? 0.6 : 0.05, clearcoat: id === "skin" ? 1 : 0, transparent: true, opacity: 1, side: THREE.DoubleSide });
      let mesh;
      if (id === "frame") {
        mesh = new THREE.Group();
        for (let i = 0; i < 3; i++) {
          const rib = new THREE.Mesh(ringGeo(w, hgt, rr, thick.frame, 0.07), mat);
          rib.position.x = -seg / 2 + 0.15 + i * (seg - 0.3) / 2;
          mesh.add(rib);
        }
        [hgt / 2 - 0.03, -hgt / 2 + 0.03].forEach((y) => [-0.9, 0.9].forEach((zz) => {
          const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, seg, 12), mat);
          tube.rotation.z = Math.PI / 2; tube.position.set(0, y, zz); mesh.add(tube);
        }));
      } else {
        mesh = new THREE.Mesh(ringGeo(w, hgt, rr, thick[id], seg), mat);
      }
      mesh.position.y = cy;
      mesh.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
      mesh.userData = { id };
      layersGroup.add(mesh); layerMeshes[id] = mesh;
      w -= 2 * thick[id]; hgt -= 2 * thick[id]; rr = Math.max(rr - thick[id], 0.05);
    });
    const fy = cy - hgt / 2;
    [["board", 0.05], ["floor", 0.03]].forEach(([id, th], i) => {
      const Ld = LAYERS.find((l) => l.id === id);
      const mat = new THREE.MeshStandardMaterial({ color: Ld.color, roughness: 0.75, transparent: true });
      const m = new THREE.Mesh(new THREE.BoxGeometry(seg, th, w - 0.15), mat);
      m.position.y = fy + 0.04 + i * 0.06; m.castShadow = true; m.receiveShadow = true;
      m.userData = { id, y0: m.position.y };
      layersGroup.add(m); layerMeshes[id] = m;
    });
    const gmat = new THREE.MeshPhysicalMaterial({ color: 0x1d2630, roughness: 0.04, metalness: 0.1, transparent: true, opacity: 0.62, side: THREE.DoubleSide, depthWrite: false });
    const g = new THREE.Mesh(capGeo(w, hgt, rr), gmat);
    g.position.set(seg / 2 + 0.05, cy, 0); g.userData = { id: "glass" };
    layersGroup.add(g); layerMeshes.glass = g;
    layersGroup.visible = false;
  })();

  const explodeOrder = ["skin", "foam", "frame", "inner", "board", "floor", "glass"];
  let explode = 0, explodeTarget = 0, activeLayer = null;
  function applyExplode() {
    explodeOrder.forEach((id, i) => {
      const m = layerMeshes[id]; if (!m) return;
      m.position.x = (i - 3) * 1.85 * explode + (id === "glass" ? 0.85 + 0.6 * explode : 0);
      if (id === "board" || id === "floor") m.position.y = m.userData.y0 + 0.5 * explode * (id === "floor" ? 1 : 0.5);
    });
  }
  function highlight(id) {
    activeLayer = id;
    Object.values(layerMeshes).forEach((m) => {
      const on = !id || m.userData.id === id;
      m.traverse((o) => {
        if (!o.isMesh) return;
        o.material.opacity = on ? (m.userData.id === "glass" ? 0.62 : 1) : 0.12;
        o.material.transparent = true; o.material.depthWrite = on; o.material.needsUpdate = true;
      });
    });
    layerList && layerList.querySelectorAll("button").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.layer === id)));
  }
  if (layerList) {
    layerList.innerHTML = LAYERS.map((l, i) =>
      `<li><button type="button" data-layer="${l.id}" aria-pressed="false"><span class="sw" style="background:#${l.color.toString(16).padStart(6, "0")}"></span><span class="n">${String(i + 1).padStart(2, "0")}</span><span class="t">${l.name}${l.note ? `<small>${l.note}</small>` : ""}</span></button></li>`
    ).join("");
    layerList.addEventListener("click", (e) => {
      const b = e.target.closest("button[data-layer]"); if (!b) return;
      if (mode !== "layers") setMode("layers");
      highlight(activeLayer === b.dataset.layer ? null : b.dataset.layer);
    });
  }

  // ---------- camera ----------
  const camGoal = { pos: new THREE.Vector3(), tgt: new THREE.Vector3() };
  let camAnim = 0;
  function frame(modeKey) {
    const { L = 6, H = 3.5, W = 3.3, base = FOOT } = capsule.userData;
    const aspect = Math.max(camera.aspect || 1.6, 0.4);
    const vf = THREE.MathUtils.degToRad(camera.fov) / 2;
    const hf = Math.atan(Math.tan(vf) * aspect);
    let dir, tgt, spanW, spanH;
    if (modeKey === "inside") {
      dir = new THREE.Vector3(0.18, 1.25, 0.62); tgt = new THREE.Vector3(0, base + 0.6, 0);
      spanW = L * 1.3; spanH = W * 2.2;
    } else if (modeKey === "layers") {
      dir = new THREE.Vector3(0.62, 0.36, 1); tgt = new THREE.Vector3(0, 1.9, 0);
      spanW = 13.5; spanH = 5.2;
    } else {
      dir = new THREE.Vector3(0.55, 0.28, 1); tgt = new THREE.Vector3(0, H * 0.45, 0);
      spanW = L * 1.1 + W * 0.5; spanH = H * 1.9;
    }
    const d = Math.max((spanW / 2) / Math.tan(hf), (spanH / 2) / Math.tan(vf)) * 1.08;
    camGoal.pos.copy(tgt).add(dir.normalize().multiplyScalar(d));
    camGoal.tgt.copy(tgt);
    controls.maxDistance = d * 2.2;
    camAnim = reduceMotion ? 1 : 0.0001;
    if (reduceMotion) { camera.position.copy(camGoal.pos); controls.target.copy(camGoal.tgt); }
  }

  // ---------- state ----------
  let model = "t8", mode = "outside";
  function setReadout() {
    const M = MODELS[model];
    readout.code && (readout.code.textContent = M.code);
    readout.dims && (readout.dims.textContent = M.dims);
    readout.area && (readout.area.textContent = M.area);
    readout.guests && (readout.guests.textContent = M.guests);
  }
  function setModel(key) {
    model = key;
    buildCapsule(key);
    setReadout();
    applyMode();
    frame(mode);
    root.querySelectorAll("[data-c3d-model]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.c3dModel === key)));
  }
  function applyMode() {
    const inside = mode === "inside", layers = mode === "layers";
    capsule.visible = !layers;
    layersGroup.visible = layers;
    interior.visible = !layers;   // меблі видно й ззовні крізь скло, як на фото
    interior.traverse((o) => { if (o.userData.curtain) o.visible = inside; });   // на фото ззовні штор немає
    roof.constant = inside ? capsule.userData.cut : 100;
    explodeTarget = layers ? 1 : 0;
    if (!layers) highlight(null);
    root.dataset.mode = mode;
    note && (note.hidden = !inside);
  }
  function setMode(m) {
    mode = m;
    applyMode();
    frame(m);
    root.querySelectorAll("[data-c3d-mode]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.c3dMode === m)));
  }
  root.querySelectorAll("[data-c3d-model]").forEach((b) => b.addEventListener("click", () => setModel(b.dataset.c3dModel)));
  root.querySelectorAll("[data-c3d-mode]").forEach((b) => b.addEventListener("click", () => setMode(b.dataset.c3dMode)));

  function resize() {
    const w = canvasWrap.clientWidth, h = canvasWrap.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h; camera.updateProjectionMatrix();
  }
  new ResizeObserver(() => { resize(); if (root.classList.contains("c3d--ready")) frame(mode); }).observe(canvasWrap);

  let running = false, raf = 0;
  function tick() {
    raf = requestAnimationFrame(tick);
    if (camAnim > 0 && camAnim < 1) {
      camAnim = Math.min(1, camAnim + 0.035);
      const e = 1 - Math.pow(1 - camAnim, 3);
      camera.position.lerp(camGoal.pos, e * 0.18 + 0.02);
      controls.target.lerp(camGoal.tgt, e * 0.18 + 0.02);
      if (camAnim >= 1) { camera.position.copy(camGoal.pos); controls.target.copy(camGoal.tgt); }
    }
    if (Math.abs(explode - explodeTarget) > 0.001) {
      explode += (explodeTarget - explode) * (reduceMotion ? 1 : 0.08);
      applyExplode();
    }
    controls.update();
    renderer.render(scene, camera);
  }
  const io = new IntersectionObserver((en) => {
    const vis = en[0].isIntersecting;
    if (vis && !running) { running = true; tick(); }
    if (!vis && running) { running = false; cancelAnimationFrame(raf); }
  }, { threshold: 0.05 });
  io.observe(canvasWrap);

  buildCapsule(model);
  setReadout();
  applyMode();
  resize();
  frame("outside");
  camera.position.copy(camGoal.pos); controls.target.copy(camGoal.tgt); camAnim = 0;
  root.classList.add("c3d--ready");
  window.__c3d = { setModel, setMode, camera, controls, renderer, scene };
}

const el = document.getElementById("capsule3d");
if (el) {
  const start = () => { try { initCapsule3D(el); } catch (e) { console.error(e); el.classList.add("c3d--fallback"); } };
  const lazy = new IntersectionObserver((en, obs) => {
    if (en[0].isIntersecting) { obs.disconnect(); start(); }
  }, { rootMargin: "400px" });
  lazy.observe(el);
}
