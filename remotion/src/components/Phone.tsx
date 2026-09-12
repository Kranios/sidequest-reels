/**
 * The SideQuest phone: our own iphone17pro.glb with a live video on the screen.
 *
 * Why our GLB and not Remotion's template phone: the template phone is a
 * parametric box and doesn't read as an iPhone. Ours is the real model, so it
 * looks right — and useGLTF lets us keep it while gaining Remotion's animation
 * system and trivial video swapping.
 *
 * FACTS ABOUT THIS GLB — measured with diagnose-screen.mjs, not guessed.
 * Getting any of these wrong wastes hours:
 *
 * 1. The display is node "Cube.010_screen.001_0" / material "screen.001".
 *    Local bbox: X [-0.04436, -0.04306] (thickness 0.0013), Y span 0.77615,
 *    Z span 1.66310. Flat on X. World AABB 0.0013 x 1.6631 x 0.7761 at
 *    (-0.0367, 0.0226, -0.1232); world rotation (-90deg, 0, 0).
 *    206 triangles, 4 boundary loops => 3 cutouts, and a rounded outline
 *    (corner radius ~0.1213, 15.6% of the width).
 * 2. ITS SHIPPED UVs ARE UNUSABLE. They sit in SEVEN disjoint islands spread
 *    over u [-0.953 .. 0.992] (94 verts at u < 0), and the mesh is two shells
 *    (113 verts with -X normals, 100 with +X) at five different X depths.
 *    texture.repeat/offset is a single linear 2D transform — it can never
 *    gather seven islands into one continuous picture. Every repeat/offset
 *    "fix" is doomed; that is why five attempts produced five different wrong
 *    results. So we KEEP the geometry (it is the exact display shape) and
 *    REGENERATE the UVs by planar projection from attributes.position:
 *        u = (localY - yMin) / ySpan     (Y = 0.776 = display width)
 *        v = (localZ - zMin) / zSpan     (Z = 1.663 = display height)
 *    Deterministic, follows the rounded corners and cutouts, independent of
 *    the recording's dimensions, and rigid in the model hierarchy so it can
 *    never drift or rescale relative to the phone.
 * 3. Orientation falls out correctly with no mirror hacks: world = local
 *    rotated -90deg about X, so local Y -> world -Z (screen right) and
 *    local Z -> world +Y (screen up). From the -X camera u runs left->right
 *    and v bottom->top.
 * 4. No net scaling: "...fbx" scales 0.01 and "Cube010" scales 100 — they
 *    cancel. World scale is exactly (1,1,1).
 * 5. The screen faces -X. The camera MUST orbit the -X side; a camera on +X
 *    shows the back (Apple logo, camera plateau).
 * 6. "Cube.010_glass.002_0" is the BACK glass panel (on +X, MeshPhysical, ~5%
 *    opacity) — NOT the camera lenses. The lenses are "lensinglass". We hide
 *    both glass shells; never put the video on either.
 *
 * Re-dump with `node diagnose-screen.mjs` (screen mesh) or `node
 * inspect-glb.mjs` (every mesh), from remotion/.
 *
 * VIDEO TEXTURE: `useVideoTexture()` is the Studio/Player path
 * (requestVideoFrameCallback) and is unreliable in `remotion render`. The
 * render path is `useOffthreadVideoTexture({src})`, chosen via
 * getRemotionEnvironment().isRendering. Exactly one of the two is called — the
 * other would throw (offthread in preview) or hang a delayRender (video texture
 * with no <Video> mounted during render).
 */
import React, { useMemo, useRef } from "react";
import {
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  staticFile,
  Video,
  Sequence,
  getRemotionEnvironment,
} from "remotion";
import { ThreeCanvas, useVideoTexture, useOffthreadVideoTexture } from "@remotion/three";
import { getSafeArea, SafeInsets } from "../safe-areas";
import { Box, phoneShiftForBox, radiusForPhoneHeight } from "../layout";
import { useGLTF, Environment } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";

/** glTF node name of the GLB's (dead) screen mesh, pre-sanitisation. */
export const SCREEN_MESH = "Cube.010_screen.001_0";
/** glTF material on that mesh — three keeps material names verbatim. */
export const SCREEN_MATERIAL = "screen.001";

/** Drop the characters three's sanitizeNodeName removes, lowercase the rest. */
const canon = (s: string | null | undefined) =>
  (s ?? "").replace(/[\s.:/[\]]/g, "").toLowerCase();

const materialName = (m: THREE.Material | THREE.Material[] | undefined) =>
  (Array.isArray(m) ? m[0]?.name : m?.name) ?? "";

const isScreenMesh = (mesh: THREE.Mesh) =>
  canon(mesh.name) === canon(SCREEN_MESH) ||
  canon(mesh.userData?.name as string) === canon(SCREEN_MESH) ||
  canon(materialName(mesh.material)) === canon(SCREEN_MATERIAL);

/**
 * World directions the video's own axes must line up with. The camera in this
 * file orbits the -X side in the X/Z plane with up = +Y, so it looks along +X;
 * a three.js camera looks down its local -Z, which puts its local +X (screen
 * right) on world +Z.
 */
const SCREEN_RIGHT = new THREE.Vector3(0, 0, 1);
const SCREEN_UP = new THREE.Vector3(0, 1, 0);

/**
 * Replace a mesh's UVs with a planar projection over its two non-flat axes,
 * normalised 0-1 across the geometry's own bounding box.
 *
 * This is the whole fix for the display mapping: the GLB's own UVs are seven
 * scattered islands (see file header, fact 2) and no texture.repeat/offset can
 * rescue them — but the geometry itself is exactly the right shape.
 *
 * Which local axis becomes U vs V, and each one's direction, is DERIVED from
 * the mesh's world orientation: whichever in-plane axis points along
 * SCREEN_RIGHT becomes U (increasing rightwards), the other becomes V
 * (increasing upwards). No hardcoded flips, so a re-export with different axes
 * still maps correctly.
 */
const projectPlanarUV = (geometry: THREE.BufferGeometry, worldMatrix: THREE.Matrix4) => {
  const pos = geometry.getAttribute("position");
  if (!pos) return;
  geometry.computeBoundingBox();
  const bb = geometry.boundingBox;
  if (!bb) return;

  const size = bb.getSize(new THREE.Vector3());
  const dims = [size.x, size.y, size.z];
  const flat = dims.indexOf(Math.min(...dims)); // the near-zero-thickness axis
  const inPlane = [0, 1, 2].filter((i) => i !== flat);

  // World direction of each in-plane local axis (rotation only — translation
  // and uniform scale don't change which way an axis points).
  const rot = new THREE.Matrix3().setFromMatrix4(worldMatrix);
  const worldDir = (axis: number) =>
    new THREE.Vector3().setComponent(axis, 1).applyMatrix3(rot).normalize();
  const dirA = worldDir(inPlane[0]);
  const dirB = worldDir(inPlane[1]);

  // The axis more aligned with screen-right is U; the other is V.
  const aIsHorizontal =
    Math.abs(dirA.dot(SCREEN_RIGHT)) >= Math.abs(dirB.dot(SCREEN_RIGHT));
  const uAxis = aIsHorizontal ? inPlane[0] : inPlane[1];
  const vAxis = aIsHorizontal ? inPlane[1] : inPlane[0];
  const uFlip = (aIsHorizontal ? dirA : dirB).dot(SCREEN_RIGHT) < 0;
  const vFlip = (aIsHorizontal ? dirB : dirA).dot(SCREEN_UP) < 0;

  const uMin = bb.min.getComponent(uAxis);
  const vMin = bb.min.getComponent(vAxis);
  const uSpan = dims[uAxis] || 1;
  const vSpan = dims[vAxis] || 1;

  const uv = new Float32Array(pos.count * 2);
  for (let i = 0; i < pos.count; i++) {
    const u = (pos.getComponent(i, uAxis) - uMin) / uSpan;
    const v = (pos.getComponent(i, vAxis) - vMin) / vSpan;
    uv[i * 2] = uFlip ? 1 - u : u;
    uv[i * 2 + 1] = vFlip ? 1 - v : v;
  }
  geometry.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
  geometry.attributes.uv.needsUpdate = true;
};

type PhoneProps = {
  videoSrc: string;          // staticFile path to the app recording
  swingDeg?: number;         // total camera orbit across the shot
  dollyIn?: number;          // how much the camera moves closer (world units)
  radius?: number;           // camera distance; smaller = phone fills more frame
  screenRotDeg?: number;     // rotate the video on the screen (0/90/180/270)
  screenFlipY?: boolean;     // flip the video vertically on the screen
  /**
   * Skip this many frames of the recording before playback starts — insurance
   * against a capture that still opens on the app's splash. Applies to BOTH the
   * preview and the render (see the Sequence in Phone below).
   */
  videoStartFrom?: number;

  /**
   * THREE TIERS OF FRAMING — this is the rule that makes reels look designed:
   *   full-bleed   backgrounds, b-roll, glows  -> may run off every edge
   *   safe-framed  the SUBJECT (this phone)    -> must be fully visible
   *   safe-text    anything readable           -> strictly inside the insets
   *
   * fitSafeArea keeps the phone inside the safe box so Instagram's caption bar
   * and button column can never clip it. Turn it off for a deliberate
   * edge-to-edge hero shot.
   */
  fitSafeArea?: boolean;
  insets?: Partial<SafeInsets>;
  offsetY?: number;          // nudge the phone within its box

  /**
   * PREFERRED over fitSafeArea: the stage band from layout.ts. The phone is
   * centred in this box, and text lives in the bands above and below it, so
   * copy can never sit on the screen. See src/layout.ts.
   */
  band?: Box;
  /**
   * Fraction of the band's height the phone body should fill (0..1). When set,
   * the camera distance is COMPUTED from the measured model height instead of
   * being dialled in by eye, so the phone stays framed when the band, the
   * insets or the copy length change. `radius` is then ignored.
   */
  bandFill?: number;
};

const PhoneModel: React.FC<{
  texture: THREE.Texture | null;
  progress: number;
  swingDeg: number;
  dollyIn: number;
  radius: number;
  screenRotDeg: number;
  screenFlipY: boolean;
}> = ({ texture, progress, swingDeg, dollyIn, radius, screenRotDeg, screenFlipY }) => {
  const { scene } = useGLTF(staticFile("iphone17pro.glb"));

  // Clone once so re-renders don't mutate the cached GLTF.
  const model = useMemo(() => scene.clone(true), [scene]);

  // Prep the GLB once:
  //  - screen mesh: keep it, clone its geometry (drei caches the original),
  //    regenerate its UVs as a planar 0-1 projection, and give it an unlit
  //    material we drive. The mesh already IS the display: exact footprint,
  //    rounded corners, cutouts, rigid in the hierarchy.
  //  - hide the two glass shells ("glass.002" back panel, "lensinglass" lenses).
  //  - tame the body metals: the GLB ships them at metalness ~0.77, which with
  //    an HDR env + key light blows the orange frame out to a glowing look.
  const screenMat = useMemo(() => {
    let mat: THREE.MeshBasicMaterial | null = null;

    model.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (!mesh.isMesh) return;
      const name = canon(mesh.name);

      if (isScreenMesh(mesh)) {
        mesh.updateWorldMatrix(true, false); // rotation only; independent of mount
        mesh.geometry = mesh.geometry.clone(); // drei caches the original
        projectPlanarUV(mesh.geometry, mesh.matrixWorld);
        mat = new THREE.MeshBasicMaterial({
          toneMapped: false, // unlit: keep the app UI's real colours
          // Two shells at five X depths; DoubleSide draws both and the -X one
          // (nearest the camera) wins the depth test with the same UVs.
          side: THREE.DoubleSide,
          color: 0xff00ff, // magenta until the first video frame lands
        });
        mesh.material = mat;
        mesh.visible = true;
        return;
      }
      if (name.includes("glass") || name.includes("lensinglass")) {
        mesh.visible = false;
        return;
      }
      const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      mats.forEach((mm) => {
        const bodyMat = mm as THREE.MeshStandardMaterial;
        if (!bodyMat || !("metalness" in bodyMat)) return;
        bodyMat.metalness = Math.min(bodyMat.metalness ?? 0.5, 0.35);
        bodyMat.roughness = Math.max(bodyMat.roughness ?? 0.5, 0.55);
        bodyMat.envMapIntensity = 0.6;
        bodyMat.needsUpdate = true;
      });
    });

    if (!mat) {
      console.warn(
        `[Phone] screen mesh not found (name~"${SCREEN_MESH}" / material "${SCREEN_MATERIAL}").`
      );
    }

    // RECENTRE THE MODEL ON THE ORIGIN.
    // The GLB's body is not centred on its own origin — its bounding box sits
    // at roughly (0.02, 0.02, -0.12). The camera aims at the origin, and with
    // the camera on -X looking along +X, world +Z is screen-right, so that
    // -0.12 on Z pushed the phone ~60px left of frame centre at a typical
    // radius (visible in any still before this fix). Correcting it in 3D
    // rather than with a CSS nudge keeps it exact at every camera angle.
    model.updateMatrixWorld(true);
    const bounds = new THREE.Box3().setFromObject(model);
    const centre = bounds.getCenter(new THREE.Vector3());
    model.position.sub(centre);

    return mat as THREE.MeshBasicMaterial | null;
  }, [model]);

  // Per-frame: point the material at the current video frame. The regenerated
  // UVs already span a clean 0-1 across the display, so repeat stays (1,1) and
  // offset (0,0) — no fitting maths, nothing that can drift.
  if (screenMat && texture) {
    texture.center.set(0.5, 0.5);
    texture.rotation = THREE.MathUtils.degToRad(screenRotDeg);
    texture.flipY = !screenFlipY; // TextureLoader frames arrive flipped vs VideoTexture
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.wrapS = THREE.ClampToEdgeWrapping; // never tile / spill
    texture.wrapT = THREE.ClampToEdgeWrapping;
    texture.repeat.set(1, 1);
    texture.offset.set(0, 0);
    texture.needsUpdate = true;

    if (screenMat.map !== texture) {
      screenMat.map = texture;
      screenMat.color.set(0xffffff);
      screenMat.needsUpdate = true;
    }
  } else if (screenMat && screenMat.map !== null) {
    // Magenta = no texture reached the screen (bad path / didn't decode).
    screenMat.map = null;
    screenMat.color.set(0xff00ff);
    screenMat.needsUpdate = true;
  }

  // Camera orbit on the -X side (the screen side — see file header), always
  // aimed at the phone's centre. Driving the default camera directly keeps the
  // aim exact every frame, so the phone never drifts off-centre.
  // AXES: Blender is Z-up, three.js Y-up. This GLB's long axis is Y, so the
  // phone stands upright here and the camera orbits the X/Z plane at a fixed
  // height. Orbiting X/Y swings the camera over the top and looks broken.
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  // Narrow FOV = a product-shot look: the phone reads big without the camera
  // getting close enough to distort it. `radius` then sets apparent size.
  camera.fov = 30;
  const ang = THREE.MathUtils.degToRad(-swingDeg / 2 + swingDeg * progress);
  const r = radius - dollyIn * progress;
  camera.position.set(-Math.cos(ang) * r, 0, Math.sin(ang) * r);
  camera.lookAt(0, 0, 0);
  camera.updateProjectionMatrix();

  return (
    <>
      <Environment preset="studio" environmentIntensity={0.22} />
      <ambientLight intensity={0.85} />
      {/* Key + fill on the -X (screen) side, matching the camera. Kept gentle —
          a hot key light turns the GLB's metallic frame into an orange glow. */}
      <directionalLight position={[-4, 2, 3]} intensity={1.0} />
      <directionalLight position={[-2, -3, 2]} intensity={0.35} />
      {/* The display is the GLB's own screen mesh, re-UV'd and re-materialled
          in the useMemo above — so it rides the model's transform exactly and
          can never drift, rescale or lose its rounded outline. */}
      <primitive object={model} />
    </>
  );
};

/**
 * Skips the first `videoStartFrom` frames of the recording, so a capture that
 * still carries a splash flash can be started past it.
 *
 * It has to be a <Sequence from={-n}>, NOT <Video startFrom={n}>: the <Video>
 * element only exists on the Studio/preview path. The render path pulls frames
 * with useOffthreadVideoTexture(), which has no startFrom — it derives its time
 * from useCurrentFrame() + useMediaStartsAt(), and a Sequence shifts both. So
 * the Sequence is the one lever that moves BOTH paths together; a startFrom on
 * <Video> would fix the preview and silently do nothing to the render.
 *
 * `progress` (the camera swing) is computed OUTSIDE the Sequence and passed in,
 * so shifting the video can never drift the animation timing.
 */
export const Phone: React.FC<PhoneProps> = ({ videoStartFrom = 10, ...props }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const progress = interpolate(frame, [0, Math.max(durationInFrames - 1, 1)], [0, 1]);

  return (
    <Sequence from={-Math.max(0, Math.round(videoStartFrom))} layout="none">
      <PhoneCanvas {...props} progress={progress} />
    </Sequence>
  );
};

const PhoneCanvas: React.FC<Omit<PhoneProps, "videoStartFrom"> & { progress: number }> = ({
  videoSrc,
  progress,
  swingDeg = 18,
  dollyIn = 0.8,
  radius = 4.2,
  screenRotDeg = 0,
  screenFlipY = false,
  fitSafeArea = true,
  insets,
  offsetY = 0,
  band,
  bandFill,
}) => {
  const { width, height } = useVideoConfig();
  const videoRef = useRef<HTMLVideoElement>(null);

  // Exactly one texture hook runs. isRendering is constant for the whole
  // process, so hook order is stable across every frame of a run — the
  // rules-of-hooks warning here is the sanctioned exception (it is the pattern
  // in Remotion's own useOffthreadVideoTexture docs).
  const isRendering = getRemotionEnvironment().isRendering;
  /* eslint-disable react-hooks/rules-of-hooks */
  const texture = isRendering
    ? useOffthreadVideoTexture({ src: videoSrc, toneMapped: false })
    : useVideoTexture(videoRef);
  /* eslint-enable react-hooks/rules-of-hooks */

  // The 3D canvas is ALWAYS the full frame — never shrunk to the safe box — so
  // the phone can't be clipped by the viewport at any `radius`; its size is a
  // function of `radius` alone. When fitting, shift the whole render up so the
  // phone sits in the (asymmetric) safe zone's vertical centre rather than the
  // frame's. Backgrounds behind it still cover the whole frame.
  // Sizing and placement, in that order:
  //  - with a `band`, both are derived (bandFill -> radius, band -> shift), so
  //    the framing survives a change of insets, band split or copy length;
  //  - with fitSafeArea, the old behaviour: hand-set radius, centred on the
  //    asymmetric safe box;
  //  - with neither, dead centre of the frame.
  const safe = getSafeArea(insets);
  const effectiveRadius =
    band && bandFill ? radiusForPhoneHeight(band.height * bandFill, height) : radius;
  const shiftY = band
    ? phoneShiftForBox(band, effectiveRadius, height)
    : fitSafeArea
    ? (safe.top - safe.bottom) / 2
    : 0;
  const canvasStyle: React.CSSProperties = {
    position: "absolute",
    left: 0,
    top: 0,
    transform: `translateY(${shiftY + offsetY}px)`,
  };

  return (
    <>
      {/* Preview only: the hidden <Video> is the source for useVideoTexture().
          During render useOffthreadVideoTexture() pulls frames itself, and a
          mounted <Video> would just be a second, wasted decode. */}
      {!isRendering ? (
        <Video
          ref={videoRef}
          src={videoSrc}
          style={{ position: "absolute", opacity: 0, pointerEvents: "none" }}
        />
      ) : null}
      <ThreeCanvas width={width} height={height} style={canvasStyle}>
        <PhoneModel
          texture={texture}
          progress={progress}
          swingDeg={swingDeg}
          dollyIn={dollyIn}
          radius={effectiveRadius}
          screenRotDeg={screenRotDeg}
          screenFlipY={screenFlipY}
        />
      </ThreeCanvas>
    </>
  );
};

useGLTF.preload(staticFile("iphone17pro.glb"));
