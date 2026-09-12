/**
 * One-off: dump every mesh in remotion/public/iphone17pro.glb — name, world
 * bounding box (size + centre), world position, and material name(s). Run from
 * the repo root:
 *
 *   node docs/archive/inspect-glb.mjs
 *
 * Loads via three's GLTFLoader.parse() with the raw ArrayBuffer, so no DOM /
 * fetch is needed. Embedded textures fail to decode in Node (no createImageBitmap)
 * but the scene graph, geometry and material names still come through.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

// --- minimal browser shims so GLTFLoader's texture path doesn't crash in Node.
// We only want the scene graph / geometry / material names, not decoded images.
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

const GLB = fileURLToPath(new URL("public/iphone17pro.glb", REMOTION));

THREE.ImageLoader.prototype.load = function (_url, onLoad) {
  const img = { width: 1, height: 1 };
  if (onLoad) queueMicrotask(() => onLoad(img));
  return img;
};
if (THREE.ImageBitmapLoader) {
  THREE.ImageBitmapLoader.prototype.load = function (_url, onLoad) {
    if (onLoad) queueMicrotask(() => onLoad({ width: 1, height: 1, close() {} }));
  };
}

const buf = readFileSync(GLB);
const arrayBuffer = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);

const loader = new GLTFLoader();

loader.parse(
  arrayBuffer,
  "",
  (gltf) => {
    gltf.scene.updateWorldMatrix(true, true);

    const rows = [];
    gltf.scene.traverse((obj) => {
      if (!obj.isMesh) return;

      const geomBox = new THREE.Box3();
      if (obj.geometry.boundingBox === null) obj.geometry.computeBoundingBox();
      geomBox.copy(obj.geometry.boundingBox);
      const geomSize = geomBox.getSize(new THREE.Vector3());

      const worldBox = new THREE.Box3().setFromObject(obj);
      const worldSize = worldBox.getSize(new THREE.Vector3());
      const worldCenter = worldBox.getCenter(new THREE.Vector3());

      const worldPos = obj.getWorldPosition(new THREE.Vector3());
      const worldScale = obj.getWorldScale(new THREE.Vector3());

      const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
      const matNames = mats
        .map((m) => (m ? `${m.name || "(unnamed)"} [${m.type}]` : "(null)"))
        .join(", ");

      // UV range
      let uvRange = "no uv";
      const uvAttr = obj.geometry.getAttribute("uv");
      if (uvAttr) {
        let uMin = Infinity;
        let uMax = -Infinity;
        let vMin = Infinity;
        let vMax = -Infinity;
        for (let i = 0; i < uvAttr.count; i++) {
          const u = uvAttr.getX(i);
          const v = uvAttr.getY(i);
          if (u < uMin) uMin = u;
          if (u > uMax) uMax = u;
          if (v < vMin) vMin = v;
          if (v > vMax) vMax = v;
        }
        uvRange = `u [${uMin.toFixed(5)} .. ${uMax.toFixed(5)}]  v [${vMin.toFixed(5)} .. ${vMax.toFixed(5)}]  (span ${(uMax - uMin).toFixed(5)} x ${(vMax - vMin).toFixed(5)})`;
      }

      const f = (v) => v.toFixed(4).padStart(9);
      rows.push({
        name: obj.name,
        material: matNames,
        localSize: `(${f(geomSize.x)},${f(geomSize.y)},${f(geomSize.z)})`,
        worldSize: `(${f(worldSize.x)},${f(worldSize.y)},${f(worldSize.z)})`,
        worldCenter: `(${f(worldCenter.x)},${f(worldCenter.y)},${f(worldCenter.z)})`,
        worldPos: `(${f(worldPos.x)},${f(worldPos.y)},${f(worldPos.z)})`,
        worldScale: `(${f(worldScale.x)},${f(worldScale.y)},${f(worldScale.z)})`,
        verts: obj.geometry.getAttribute("position")?.count ?? 0,
        hasUV: !!obj.geometry.getAttribute("uv"),
        uvRange,
      });
    });

    console.log(`\n${GLB}`);
    console.log(`${rows.length} meshes\n`);
    for (const r of rows) {
      console.log(`── ${r.name}`);
      console.log(`   material    : ${r.material}`);
      console.log(`   local size  : ${r.localSize}   (geometry bbox, model units)`);
      console.log(`   world size  : ${r.worldSize}   (axis-aligned bbox after transforms)`);
      console.log(`   world center: ${r.worldCenter}`);
      console.log(`   world pos   : ${r.worldPos}   scale ${r.worldScale}`);
      console.log(`   verts       : ${r.verts}   uv: ${r.hasUV}`);
      console.log(`   uv range    : ${r.uvRange}`);
      console.log("");
    }

    // Heuristic: the display is a large, thin, quad-ish surface with UVs.
    const flatAxis = (s) => {
      const a = s.replace(/[()]/g, "").split(",").map(Number);
      const min = Math.min(...a.map(Math.abs));
      const idx = a.map(Math.abs).indexOf(min);
      return { idx, thinness: min, others: a.filter((_, i) => i !== idx) };
    };
    // Detailed UV dump for the screen mesh: is it one continuous unwrap or two
    // islands (front + mirrored back)?
    let screenMesh = null;
    gltf.scene.traverse((o) => {
      if (o.isMesh && /screen001/i.test(o.name.replace(/[.\s]/g, ""))) screenMesh = o;
    });
    if (screenMesh) {
      const uv = screenMesh.geometry.getAttribute("uv");
      const pos = screenMesh.geometry.getAttribute("position");
      const us = [];
      for (let i = 0; i < uv.count; i++) us.push(uv.getX(i));
      us.sort((a, b) => a - b);
      console.log("── screen001 UV analysis ──");
      console.log(`   u sorted (first 8): ${us.slice(0, 8).map((n) => n.toFixed(3)).join(", ")}`);
      console.log(`   u sorted (last 8) : ${us.slice(-8).map((n) => n.toFixed(3)).join(", ")}`);
      // count verts with negative u vs u in [0,1]
      let neg = 0;
      let unit = 0;
      let over = 0;
      for (const u of us) {
        if (u < -0.001) neg++;
        else if (u <= 1.001) unit++;
        else over++;
      }
      console.log(`   verts by u-band: negative=${neg}  [0..1]=${unit}  >1=${over}  (total ${uv.count})`);
      // sample: for the 4 verts nearest each local-space corner, print local pos + uv
      console.log("   corner samples (local x,y,z -> u,v):");
      const localCorners = [
        [0, -1, -1], [0, -1, 1], [0, 1, -1], [0, 1, 1],
      ];
      for (const c of localCorners) {
        let best = -1;
        let bestd = Infinity;
        for (let i = 0; i < pos.count; i++) {
          const dy = pos.getY(i) - c[1] * 0.388;
          const dz = pos.getZ(i) - c[2] * 0.83;
          const d = dy * dy + dz * dz;
          if (d < bestd) {
            bestd = d;
            best = i;
          }
        }
        console.log(
          `     (${pos.getX(best).toFixed(3)}, ${pos.getY(best).toFixed(3)}, ${pos.getZ(best).toFixed(3)}) -> (${uv.getX(best).toFixed(4)}, ${uv.getY(best).toFixed(4)})`
        );
      }
      console.log("");
    }

    console.log("── display-surface candidates (thin on one axis, has UVs, big) ──");
    for (const r of rows) {
      const fa = flatAxis(r.worldSize);
      const area = fa.others.reduce((p, c) => p * Math.abs(c), 1);
      if (r.hasUV && fa.thinness < 0.05 && area > 0.1) {
        console.log(
          `   ${r.name}  (flat on axis ${["X", "Y", "Z"][fa.idx]}, face ~${area.toFixed(3)} u², material ${r.material})`
        );
      }
    }
    console.log("");
  },
  (err) => {
    console.error("parse failed:", err);
    process.exit(1);
  }
);
