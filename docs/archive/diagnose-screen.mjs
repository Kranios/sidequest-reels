/**
 * Focused diagnosis of the display mesh in remotion/public/iphone17pro.glb.
 * Run from the repo root:   node docs/archive/diagnose-screen.mjs
 *
 * Prints, for Cube.010_screen.001_0:
 *   - UV min/max, 0-1 coverage, island structure
 *   - position bounding box in LOCAL coords, which axis is flat
 *   - vertex / triangle counts, boundary loops (=> holes, e.g. Dynamic Island)
 *   - face normal direction split
 *   - world matrix + the full parent chain's transforms (any scaling?)
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

globalThis.self = globalThis;
if (!globalThis.URL.createObjectURL) {
  globalThis.URL.createObjectURL = () => "blob:stub";
  globalThis.URL.revokeObjectURL = () => {};
}
globalThis.createImageBitmap = async () => ({ width: 1, height: 1, close() {} });

// Archived under docs/archive/, so three and the GLB both come from remotion/.
// Import three by file URL (its ESM build — the same one GLTFLoader resolves),
// so the ImageLoader patch below lands on the instance the loader uses.
const REMOTION = new URL("../../remotion/", import.meta.url);
const THREE_DIR = new URL("node_modules/three/", REMOTION);
const THREE = await import(new URL("build/three.module.js", THREE_DIR).href);
const { GLTFLoader } = await import(new URL("examples/jsm/loaders/GLTFLoader.js", THREE_DIR).href);

THREE.ImageLoader.prototype.load = function (_u, onLoad) {
  const img = { width: 1, height: 1 };
  if (onLoad) queueMicrotask(() => onLoad(img));
  return img;
};
if (THREE.ImageBitmapLoader) {
  THREE.ImageBitmapLoader.prototype.load = function (_u, onLoad) {
    if (onLoad) queueMicrotask(() => onLoad({ width: 1, height: 1, close() {} }));
  };
}

const GLB = fileURLToPath(new URL("public/iphone17pro.glb", REMOTION));
const buf = readFileSync(GLB);
const ab = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);

const n = (v, d = 5) => v.toFixed(d).padStart(10);

new GLTFLoader().parse(
  ab,
  "",
  (gltf) => {
    gltf.scene.updateWorldMatrix(true, true);

    let mesh = null;
    gltf.scene.traverse((o) => {
      if (o.isMesh && /screen001/i.test(o.name.replace(/[.\s]/g, ""))) mesh = o;
    });
    if (!mesh) {
      console.error("screen mesh not found");
      process.exit(1);
    }

    const g = mesh.geometry;
    const pos = g.getAttribute("position");
    const uv = g.getAttribute("uv");
    const nor = g.getAttribute("normal");
    const idx = g.getIndex();

    console.log(`\n=== ${mesh.name} ===`);
    console.log(`geometry: ${pos.count} verts, indexed=${!!idx}, indices=${idx ? idx.count : 0}, tris=${(idx ? idx.count : pos.count) / 3}`);

    // ---------- 1. POSITION / bbox / flat axis ----------
    g.computeBoundingBox();
    const bb = g.boundingBox;
    const size = bb.getSize(new THREE.Vector3());
    const ctr = bb.getCenter(new THREE.Vector3());
    console.log("\n-- position (LOCAL) --");
    console.log(`  min  (${n(bb.min.x)},${n(bb.min.y)},${n(bb.min.z)})`);
    console.log(`  max  (${n(bb.max.x)},${n(bb.max.y)},${n(bb.max.z)})`);
    console.log(`  size (${n(size.x)},${n(size.y)},${n(size.z)})`);
    console.log(`  ctr  (${n(ctr.x)},${n(ctr.y)},${n(ctr.z)})`);
    const dims = [size.x, size.y, size.z];
    const flat = dims.indexOf(Math.min(...dims));
    console.log(`  flat axis = ${"XYZ"[flat]}  (thickness ${size.getComponent ? "" : ""}${dims[flat].toFixed(5)})`);
    console.log(`  in-plane spans: ${["X", "Y", "Z"].filter((_, i) => i !== flat).map((a, k) => `${a}=${dims.filter((_, i) => i !== flat)[k].toFixed(5)}`).join("  ")}`);

    // distinct values on the flat axis -> single sheet or slab?
    const flatVals = new Set();
    for (let i = 0; i < pos.count; i++) {
      flatVals.add(pos.getComponent(i, flat).toFixed(4));
    }
    console.log(`  distinct coords on flat axis: ${[...flatVals].sort().join(", ")}`);

    // ---------- 2. NORMALS ----------
    console.log("\n-- normals --");
    if (nor) {
      const buckets = new Map();
      const v = new THREE.Vector3();
      for (let i = 0; i < nor.count; i++) {
        v.set(nor.getX(i), nor.getY(i), nor.getZ(i));
        const ax = [Math.abs(v.x), Math.abs(v.y), Math.abs(v.z)];
        const d = ax.indexOf(Math.max(...ax));
        const key = `${v.getComponent(d) >= 0 ? "+" : "-"}${"XYZ"[d]}`;
        buckets.set(key, (buckets.get(key) ?? 0) + 1);
      }
      console.log(`  vertex-normal dominant direction: ${[...buckets.entries()].map(([k, c]) => `${k}:${c}`).join("  ")}`);
    } else {
      console.log("  (no normal attribute)");
    }

    // ---------- 3. UV ----------
    console.log("\n-- uv --");
    if (!uv) {
      console.log("  (no uv attribute)");
    } else {
      let uMin = Infinity, uMax = -Infinity, vMin = Infinity, vMax = -Infinity;
      let inUnit = 0, uNeg = 0, uOver = 0, vNeg = 0, vOver = 0;
      for (let i = 0; i < uv.count; i++) {
        const u = uv.getX(i), vv = uv.getY(i);
        uMin = Math.min(uMin, u); uMax = Math.max(uMax, u);
        vMin = Math.min(vMin, vv); vMax = Math.max(vMax, vv);
        if (u < -1e-4) uNeg++; else if (u > 1 + 1e-4) uOver++;
        if (vv < -1e-4) vNeg++; else if (vv > 1 + 1e-4) vOver++;
        if (u >= -1e-4 && u <= 1 + 1e-4 && vv >= -1e-4 && vv <= 1 + 1e-4) inUnit++;
      }
      console.log(`  u [${n(uMin)} .. ${n(uMax)}]   span ${(uMax - uMin).toFixed(5)}`);
      console.log(`  v [${n(vMin)} .. ${n(vMax)}]   span ${(vMax - vMin).toFixed(5)}`);
      console.log(`  verts inside 0-1 box: ${inUnit}/${uv.count}   u<0: ${uNeg}  u>1: ${uOver}  v<0: ${vNeg}  v>1: ${vOver}`);
      console.log(`  covers full 0-1? ${uMin <= 0.01 && uMax >= 0.99 && vMin <= 0.01 && vMax >= 0.99 ? "yes" : "NO"}`);

      // UV islands: cluster u values by gaps
      const us = [];
      for (let i = 0; i < uv.count; i++) us.push(uv.getX(i));
      us.sort((a, b) => a - b);
      const islands = [];
      let start = us[0], prev = us[0];
      for (const u of us) {
        if (u - prev > 0.05) { islands.push([start, prev]); start = u; }
        prev = u;
      }
      islands.push([start, prev]);
      console.log(`  u-islands (gap > 0.05): ${islands.map(([a, b]) => `[${a.toFixed(3)} .. ${b.toFixed(3)}]`).join("  ")}`);
    }

    // ---------- 4. TOPOLOGY: boundary loops => holes ----------
    console.log("\n-- topology --");
    const tri = [];
    if (idx) {
      for (let i = 0; i < idx.count; i += 3) tri.push([idx.getX(i), idx.getX(i + 1), idx.getX(i + 2)]);
    } else {
      for (let i = 0; i < pos.count; i += 3) tri.push([i, i + 1, i + 2]);
    }
    // weld by position so shared verts count as one
    const key = (i) => `${pos.getX(i).toFixed(5)},${pos.getY(i).toFixed(5)},${pos.getZ(i).toFixed(5)}`;
    const weld = new Map();
    const wid = (i) => {
      const k = key(i);
      if (!weld.has(k)) weld.set(k, weld.size);
      return weld.get(k);
    };
    const edges = new Map();
    for (const [a, b, c] of tri) {
      for (const [p, q] of [[a, b], [b, c], [c, a]]) {
        const A = wid(p), B = wid(q);
        const k = A < B ? `${A}_${B}` : `${B}_${A}`;
        edges.set(k, (edges.get(k) ?? 0) + 1);
      }
    }
    const boundary = [...edges.entries()].filter(([, c]) => c === 1).map(([k]) => k.split("_").map(Number));
    console.log(`  welded verts: ${weld.size} (from ${pos.count})`);
    console.log(`  edges: ${edges.size}   boundary edges (used once): ${boundary.length}`);
    // walk boundary loops
    const adj = new Map();
    for (const [a, b] of boundary) {
      if (!adj.has(a)) adj.set(a, []);
      if (!adj.has(b)) adj.set(b, []);
      adj.get(a).push(b);
      adj.get(b).push(a);
    }
    const seen = new Set();
    const loops = [];
    for (const v0 of adj.keys()) {
      if (seen.has(v0)) continue;
      let count = 0;
      const stack = [v0];
      while (stack.length) {
        const v = stack.pop();
        if (seen.has(v)) continue;
        seen.add(v);
        count++;
        for (const w of adj.get(v) ?? []) if (!seen.has(w)) stack.push(w);
      }
      loops.push(count);
    }
    console.log(`  boundary loops: ${loops.length}  (vertex counts: ${loops.join(", ")})`);
    console.log(`  => ${loops.length === 0 ? "closed surface" : loops.length === 1 ? "one outline, NO hole" : `${loops.length - 1} hole(s) (e.g. Dynamic Island cutout)`}`);

    // ---------- 5. TRANSFORMS ----------
    console.log("\n-- transforms (mesh -> root) --");
    const chain = [];
    for (let o = mesh; o; o = o.parent) chain.push(o);
    for (const o of chain.reverse()) {
      console.log(
        `  ${o === mesh ? "*" : " "} ${(o.name || "(unnamed)").padEnd(38)} pos(${n(o.position.x, 3)},${n(o.position.y, 3)},${n(o.position.z, 3)}) scale(${n(o.scale.x, 3)},${n(o.scale.y, 3)},${n(o.scale.z, 3)}) quat(${o.quaternion.x.toFixed(3)},${o.quaternion.y.toFixed(3)},${o.quaternion.z.toFixed(3)},${o.quaternion.w.toFixed(3)})`
      );
    }
    const wp = new THREE.Vector3(), wq = new THREE.Quaternion(), ws = new THREE.Vector3();
    mesh.matrixWorld.decompose(wp, wq, ws);
    const we = new THREE.Euler().setFromQuaternion(wq);
    console.log(`  world pos   (${n(wp.x)},${n(wp.y)},${n(wp.z)})`);
    console.log(`  world scale (${n(ws.x)},${n(ws.y)},${n(ws.z)})  -> ${Math.abs(ws.x - 1) < 1e-4 && Math.abs(ws.y - 1) < 1e-4 && Math.abs(ws.z - 1) < 1e-4 ? "no scaling anywhere" : "SCALED"}`);
    console.log(`  world euler deg (${(THREE.MathUtils.radToDeg(we.x)).toFixed(2)}, ${(THREE.MathUtils.radToDeg(we.y)).toFixed(2)}, ${(THREE.MathUtils.radToDeg(we.z)).toFixed(2)})`);

    // world-space AABB
    const wbb = new THREE.Box3();
    for (const x of [bb.min.x, bb.max.x])
      for (const y of [bb.min.y, bb.max.y])
        for (const z of [bb.min.z, bb.max.z])
          wbb.expandByPoint(new THREE.Vector3(x, y, z).applyMatrix4(mesh.matrixWorld));
    const wsz = wbb.getSize(new THREE.Vector3());
    const wct = wbb.getCenter(new THREE.Vector3());
    console.log(`  world AABB size   (${n(wsz.x)},${n(wsz.y)},${n(wsz.z)})`);
    console.log(`  world AABB centre (${n(wct.x)},${n(wct.y)},${n(wct.z)})`);

    // ---------- 6. corner radius estimate on the flat plane ----------
    console.log("\n-- outline / corner radius (in-plane, local) --");
    const ipA = flat === 0 ? 1 : 0; // first in-plane axis index
    const ipB = flat === 2 ? 1 : 2; // second in-plane axis index
    const pts = [];
    for (let i = 0; i < pos.count; i++) {
      pts.push([pos.getComponent(i, ipA), pos.getComponent(i, ipB)]);
    }
    const aMin = Math.min(...pts.map((p) => p[0])), aMax = Math.max(...pts.map((p) => p[0]));
    const bMin = Math.min(...pts.map((p) => p[1])), bMax = Math.max(...pts.map((p) => p[1]));
    console.log(`  in-plane axes: ${"XYZ"[ipA]} x ${"XYZ"[ipB]}   ranges ${aMin.toFixed(4)}..${aMax.toFixed(4)}  /  ${bMin.toFixed(4)}..${bMax.toFixed(4)}`);
    // for the extreme-B verts, how far in A do they reach? (flat top edge width)
    const eps = 1e-3;
    const topA = pts.filter((p) => Math.abs(p[1] - bMax) < eps).map((p) => p[0]);
    if (topA.length) {
      const inset = Math.min(...topA) - aMin;
      console.log(`  verts at max ${"XYZ"[ipB]}: ${topA.length}, spanning ${"XYZ"[ipA]} ${Math.min(...topA).toFixed(4)}..${Math.max(...topA).toFixed(4)}`);
      console.log(`  => corner radius ~ ${inset.toFixed(4)} (${((inset / (aMax - aMin)) * 100).toFixed(1)}% of width)`);
    }
    console.log("");
  },
  (e) => {
    console.error("parse failed:", e);
    process.exit(1);
  }
);
