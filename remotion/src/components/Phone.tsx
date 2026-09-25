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
 * Every "world" direction above is in the SHOT FRAME. The shot is then laid on
 * its back by STAGE_ROTATION (below) so drei's ContactShadows can work — see
 * there. Nothing in the facts changes; they are simply one rotation away.
 *
 * Re-dump with `node docs/archive/diagnose-screen.mjs` (screen mesh) or
 * `node docs/archive/inspect-glb.mjs` (every mesh), from the repo root.
 *
 * VIDEO TEXTURE: `useVideoTexture()` is the Studio/Player path
 * (requestVideoFrameCallback) and is unreliable in `remotion render`. The
 * render path is `useOffthreadVideoTexture({src})`, chosen via
 * getRemotionEnvironment().isRendering. Exactly one of the two is called — the
 * other would throw (offthread in preview) or hang a delayRender (video texture
 * with no <Video> mounted during render).
 *
 * LOOK: the display is a MeshPhysicalMaterial lit by its own emissive map (the
 * app video), with a zero-roughness clearcoat over it — the glass. The emissive
 * term is not tone-mapped, so the app's colours come through exactly; the
 * clearcoat picks up the studio environment as thin highlights on top. A
 * ContactShadows plane sits behind the phone for a soft occlusion shadow on
 * the background, and the phone makes a sprung entrance (tilted 45deg on two
 * axes, slightly zoomed) before settling into its framed position.
 */
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  continueRender,
  delayRender,
  useCurrentFrame,
  useVideoConfig,
  Easing,
  interpolate,
  spring,
  staticFile,
  Video,
  Sequence,
  getRemotionEnvironment,
} from "remotion";
import { ThreeCanvas, useVideoTexture, useOffthreadVideoTexture } from "@remotion/three";
import { getSafeArea, SafeInsets } from "../safe-areas";
import { Box, phoneShiftForBox, radiusForPhoneHeight } from "../layout";
import { useGLTF, Environment, ContactShadows } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";

/** glTF node name of the GLB's (dead) screen mesh, pre-sanitisation. */
export const SCREEN_MESH = "Cube.010_screen.001_0";
/** glTF material on that mesh — three keeps material names verbatim. */
export const SCREEN_MATERIAL = "screen.001";

/**
 * Physical size of the display, width / height (fact 1). Used only until the
 * mesh has been measured at load — the measured value then wins.
 */
const SCREEN_ASPECT_FALLBACK = 0.7761 / 1.6631;

/**
 * Supersampling for the 3D canvas. 2 renders the phone at twice the frame's
 * resolution and lets the browser downsample: crisp body edges and legible UI
 * text on the screen, for roughly 2x the GPU fill of dpr 1.
 */
const PHONE_DPR = 2;

/** The entrance: both tilts start here and spring to 0. */
const ENTRY_TILT_DEG = 45;
/** Camera distance multiplier at frame 0 (<1 = starts zoomed in). */
const ENTRY_ZOOM = 0.88;
/**
 * A soft, heavy spring: first peak at ~0.9 s with ~7% overshoot (~3deg past
 * rest), settled by ~1.3 s. Stiffer settings snap in ~10 frames, and
 * stretching one with durationInFrames does not help — Remotion stretches the
 * whole curve including its long tail, so the visible motion stays up front.
 */
const ENTRY_SPRING = { damping: 11, stiffness: 40, mass: 1.8 };

/**
 * A FOCUS MOMENT: the camera pans to a point on the screen and pushes in, then
 * lets go. `at` and `hold` are seconds of the CAPTURE (the take's own clock,
 * the times CLAUDE.md documents), so they don't change when videoStartFrom
 * moves the take. u/v are the displayed picture: 0,0 top-left, 1,1
 * bottom-right. `zoom` divides the camera distance: 1.6 fills ~1.6x more.
 */
export type PhoneFocus = { at: number; u: number; v: number; zoom: number; hold: number };
/** In and out: unhurried, no overshoot. A camera move, not a bounce. */
const FOCUS_SPRING = { damping: 20, stiffness: 60, mass: 1 };

/**
 * THE STAGE ROTATION — why the whole shot is lying on its back.
 *
 * drei's ContactShadows only works flat. Its blur pass draws a helper plane
 * that is NOT in the scene graph and sits fixed in the world XZ plane at y=0,
 * through the shadow camera. Stand the component upright and that camera sees
 * the helper edge-on, both blur passes clear the target, and the shadow comes
 * out empty — which is what an upright ContactShadows actually rendered.
 *
 * So instead of standing the shadow up, we lay the shot down. Model, camera,
 * lights and environment are all built in the SHOT FRAME the file header
 * documents (screen faces -X, up is +Y), then rotated -90deg about Z into the
 * world: (x, y, z) -> (y, -x, z). There the screen faces +Y and "behind the
 * phone" is -Y — the floor, exactly where ContactShadows wants to be.
 * projectPlanarUV and the orbit maths never see the difference: they run in
 * the shot frame, and toStage() carries their results across.
 */
const STAGE_ROTATION = new THREE.Euler(0, 0, -Math.PI / 2);
const STAGE_QUATERNION = new THREE.Quaternion().setFromEuler(STAGE_ROTATION);
/** A point or direction in the shot frame, expressed in world space. */
const toStage = (x: number, y: number, z: number) =>
  new THREE.Vector3(x, y, z).applyQuaternion(STAGE_QUATERNION);

/**
 * The backdrop shadow's distance behind the phone (shot-frame +X). It starts
 * far enough back that the phone's top corner clears it at a 45deg pitch
 * (~0.6 back), then closes in with the entrance. The shadow's alpha falls off
 * with distance over SHADOW_FAR, so close = dark.
 */
const SHADOW_GAP_ENTRY = 0.8;
const SHADOW_GAP_REST = 0.16;
/**
 * Depth range of the shadow camera. Must exceed SHADOW_GAP_ENTRY: the blur
 * helper plane sits at world y=0 — the phone's centre — and has to fall
 * inside it.
 */
const SHADOW_FAR = 1.0;
/**
 * Plane size [world X = the phone's height, world Z = its width], with room
 * for the blur. A module-level reference ON PURPOSE: ContactShadows rebuilds
 * its render targets whenever `scale` changes identity, so an inline literal
 * would allocate two new targets every frame.
 */
const SHADOW_SCALE: [number, number] = [2.9, 1.9];

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
 * Shot-frame directions the video's own axes must line up with. The camera in
 * this file orbits the -X side in the X/Z plane with up = +Y, so it looks
 * along +X; a three.js camera looks down its local -Z, which puts its local +X
 * (screen right) on +Z.
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
 * the mesh's orientation in the model hierarchy: whichever in-plane axis points
 * along SCREEN_RIGHT becomes U (increasing rightwards), the other becomes V
 * (increasing upwards). No hardcoded flips, so a re-export with different axes
 * still maps correctly. It runs before the model is mounted under the stage
 * rotation, so the matrix it reads is in the shot frame.
 *
 * Returns the display's measured aspect (U span / V span), or null.
 */
const projectPlanarUV = (geometry: THREE.BufferGeometry, worldMatrix: THREE.Matrix4) => {
  const pos = geometry.getAttribute("position");
  if (!pos) return null;
  geometry.computeBoundingBox();
  const bb = geometry.boundingBox;
  if (!bb) return null;

  const size = bb.getSize(new THREE.Vector3());
  const dims = [size.x, size.y, size.z];
  const flat = dims.indexOf(Math.min(...dims)); // the near-zero-thickness axis
  const inPlane = [0, 1, 2].filter((i) => i !== flat);

  // Direction of each in-plane local axis (rotation only — translation and
  // uniform scale don't change which way an axis points).
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
  return uSpan / vSpan;
};

/** Pixel size of whatever the texture currently holds (video or still frame). */
const textureAspect = (texture: THREE.Texture) => {
  const img = texture.image as
    | { videoWidth?: number; videoHeight?: number; width?: number; height?: number }
    | undefined;
  const w = img?.videoWidth || img?.width || 0;
  const h = img?.videoHeight || img?.height || 0;
  return w > 0 && h > 0 ? w / h : null;
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
   * Play the sprung entrance (45deg tilt + slight zoom -> rest). On by default;
   * turn it off where the phone must cut in hard, e.g. every screen after the
   * first in a multi-capture cut.
   */
  entry?: boolean;

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
  /** Focus moments, in capture time. See PhoneFocus. */
  focus?: PhoneFocus[];
  /**
   * MACRO: the camera starts locked in on one point of the glass (u, v) at
   * `zoom`, then whips out to the framed shot at `releaseAt` (a frame of the
   * Phone's own timeline) over `releaseFrames` on an exponential ease-out.
   * T2's reveal. Rendered in 3D, so the UI stays sharp at 4x; a CSS scale of
   * the canvas would magnify its pixels.
   */
  macro?: PhoneMacro;
};

export type PhoneMacro = {
  u: number;
  v: number;
  zoom: number;
  releaseAt: number;
  releaseFrames: number;
};

/** The strongest focus moment at this frame: where, how close, how much. */
type FocusState = { u: number; v: number; zoom: number; w: number };

const PhoneModel: React.FC<{
  texture: THREE.Texture | null;
  progress: number;
  entryProgress: number;
  swingDeg: number;
  dollyIn: number;
  radius: number;
  screenRotDeg: number;
  screenFlipY: boolean;
  focus: FocusState | null;
}> = ({ texture, progress, entryProgress, swingDeg, dollyIn, radius, screenRotDeg, screenFlipY, focus }) => {
  const { scene } = useGLTF(staticFile("iphone17pro.glb"));

  // Clone once so re-renders don't mutate the cached GLTF.
  const model = useMemo(() => scene.clone(true), [scene]);

  // Prep the GLB once:
  //  - screen mesh: keep it, clone its geometry (drei caches the original),
  //    regenerate its UVs as a planar 0-1 projection, and give it the
  //    emissive glass material we drive. The mesh already IS the display:
  //    exact footprint, rounded corners, cutouts, rigid in the hierarchy.
  //  - hide the two glass shells ("glass.002" back panel, "lensinglass" lenses).
  //  - tame the body metals: the GLB ships them at metalness ~0.77, which with
  //    an HDR env + key light blows the orange frame out to a glowing look.
  const { screenMat, screenAspect, screenBox } = useMemo(() => {
    let mat: THREE.MeshPhysicalMaterial | null = null;
    let aspect: number | null = null;
    let screenMesh: THREE.Mesh | null = null;

    model.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (!mesh.isMesh) return;
      const name = canon(mesh.name);

      if (isScreenMesh(mesh)) {
        mesh.updateWorldMatrix(true, false); // rotation only; independent of mount
        mesh.geometry = mesh.geometry.clone(); // drei caches the original
        aspect = projectPlanarUV(mesh.geometry, mesh.matrixWorld);
        mat = new THREE.MeshPhysicalMaterial({
          // The picture is the EMISSIVE term, so it glows at its own colours
          // whatever the lights do. Base colour black keeps the lights from
          // washing it out; only the glass layer below reacts to them.
          color: 0x000000,
          emissive: 0xff00ff, // magenta until the first video frame lands
          emissiveIntensity: 1, // 1 + toneMapped:false = the app's exact colours
          roughness: 0,
          metalness: 0,
          // The cover glass: a mirror-smooth coat that reflects the studio
          // environment as thin highlights over the UI.
          clearcoat: 1,
          clearcoatRoughness: 0,
          // Glint, not glare: at full strength the studio softbox laid a
          // milky haze over the top of the UI (rule 3: the screen must look
          // exactly like the app).
          envMapIntensity: 0.45,
          toneMapped: false,
          // Two shells at five X depths; DoubleSide draws both and the -X one
          // (nearest the camera) wins the depth test with the same UVs.
          side: THREE.DoubleSide,
        });
        mesh.material = mat;
        mesh.visible = true;
        screenMesh = mesh;
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
    // the camera on -X looking along +X, +Z is screen-right, so that -0.12 on
    // Z pushed the phone ~60px left of frame centre at a typical radius
    // (visible in any still before this fix). Correcting it in 3D rather than
    // with a CSS nudge keeps it exact at every camera angle.
    model.updateMatrixWorld(true);
    const bounds = new THREE.Box3().setFromObject(model);
    const centre = bounds.getCenter(new THREE.Vector3());
    model.position.sub(centre);

    // The display's box in the shot frame, measured after the recentre: a
    // focus point (u, v) becomes an exact 3D point on the glass. Screen faces
    // -X, so its face is the box's min X; +Y is up, +Z is screen-right.
    model.updateMatrixWorld(true);
    const box = screenMesh ? new THREE.Box3().setFromObject(screenMesh) : null;

    return {
      screenMat: mat as THREE.MeshPhysicalMaterial | null,
      screenAspect: (aspect as number | null) ?? SCREEN_ASPECT_FALLBACK,
      screenBox: box,
    };
  }, [model]);

  // Per-frame: point the material at the current video frame.
  //
  // ASPECT: the planar UVs span a clean 0-1 across the display, so this is a
  // plain centred COVER crop on top of them — the recording is scaled to fill
  // the display and the sliver that doesn't fit is trimmed from the longer
  // side. This is NOT the forbidden repeat/offset attempt to fix the GLB's own
  // UV islands (fact 2): those UVs are gone; this only reconciles the
  // recording's proportions (e.g. 390x844) with the display's (0.776 / 1.663).
  // `center` is 0.5, so repeat scales about the middle and offset stays 0.
  if (screenMat && texture) {
    texture.center.set(0.5, 0.5);
    texture.rotation = THREE.MathUtils.degToRad(screenRotDeg);
    texture.flipY = !screenFlipY; // TextureLoader frames arrive flipped vs VideoTexture
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.wrapS = THREE.ClampToEdgeWrapping; // never tile / spill
    texture.wrapT = THREE.ClampToEdgeWrapping;
    // Edge sharpness: the frame is minified ~3x onto the display, so it needs
    // mipmaps, and anisotropy keeps it crisp as the camera swings off-axis.
    // three clamps anisotropy to what the GPU supports.
    texture.generateMipmaps = true;
    texture.minFilter = THREE.LinearMipmapLinearFilter;
    texture.anisotropy = 16;

    const videoAspect = textureAspect(texture);
    // A quarter turn swaps which display axis the video's width runs along.
    const quarterTurn = Math.round(screenRotDeg / 90) % 2 === 1;
    const displayAspect = quarterTurn ? 1 / screenAspect : screenAspect;
    const ratio = videoAspect ? videoAspect / displayAspect : 1;
    if (ratio > 1) texture.repeat.set(1 / ratio, 1); // video wider: trim the sides
    else texture.repeat.set(1, ratio); // video taller: trim top and bottom
    texture.offset.set(0, 0);
    texture.needsUpdate = true;

    if (screenMat.emissiveMap !== texture) {
      screenMat.emissiveMap = texture;
      screenMat.emissive.set(0xffffff);
      screenMat.needsUpdate = true;
    }
  } else if (screenMat && screenMat.emissiveMap !== null) {
    // Magenta = no texture reached the screen (bad path / didn't decode).
    screenMat.emissiveMap = null;
    screenMat.emissive.set(0xff00ff);
    screenMat.needsUpdate = true;
  }

  // Camera orbit on the -X side (the screen side — see file header), always
  // aimed at the phone's centre. Driving the default camera directly keeps the
  // aim exact every frame, so the phone never drifts off-centre.
  // AXES: Blender is Z-up, three.js Y-up. This GLB's long axis is Y, so the
  // phone stands upright in the shot frame and the camera orbits its X/Z plane
  // at a fixed height. Orbiting X/Y swings the camera over the top and looks
  // broken. The orbit is worked out in the shot frame and carried into the
  // world by toStage() — position AND up vector, or the laid-down shot would
  // roll 90deg.
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  // Narrow FOV = a product-shot look: the phone reads big without the camera
  // getting close enough to distort it. `radius` then sets apparent size.
  camera.fov = 30;
  const ang = THREE.MathUtils.degToRad(-swingDeg / 2 + swingDeg * progress);
  // The entrance starts a touch closer and springs back out to the framed
  // distance; the spring's overshoot reads as the phone settling.
  const zoom = interpolate(entryProgress, [0, 1], [ENTRY_ZOOM, 1]);
  const r = (radius - dollyIn * progress) * zoom;
  // Focus: aim at a point on the glass instead of the phone's centre, and
  // come closer along the same line of sight, both weighted by w.
  let aim = new THREE.Vector3(0, 0, 0);
  let closer = 1;
  if (focus && focus.w > 0.001 && screenBox) {
    const target = new THREE.Vector3(
      screenBox.min.x,
      THREE.MathUtils.lerp(screenBox.max.y, screenBox.min.y, focus.v),
      THREE.MathUtils.lerp(screenBox.min.z, screenBox.max.z, focus.u)
    );
    aim = target.multiplyScalar(focus.w);
    closer = THREE.MathUtils.lerp(1, Math.max(focus.zoom, 0.1), focus.w);
  }
  const rr = r / closer;
  camera.position.copy(
    toStage(aim.x - Math.cos(ang) * rr, aim.y, aim.z + Math.sin(ang) * rr)
  );
  camera.up.copy(toStage(0, 1, 0));
  camera.lookAt(toStage(aim.x, aim.y, aim.z));
  camera.updateProjectionMatrix();

  // The entrance tilt rotates the PHONE (not the camera), so the shadow behind
  // it changes shape as it lands. Shot frame: pitch is about Z (the screen's
  // left-right axis), negative leans the top away from the camera; yaw is
  // about Y. Both spring from ENTRY_TILT_DEG to 0.
  const tilt = THREE.MathUtils.degToRad(ENTRY_TILT_DEG * (1 - entryProgress));
  const shadowGap = interpolate(entryProgress, [0, 1], [SHADOW_GAP_ENTRY, SHADOW_GAP_REST]);

  return (
    <>
      {/* Rotated with the stage so reflections sit where they did upright. */}
      <Environment
        preset="studio"
        environmentIntensity={0.22}
        environmentRotation={STAGE_ROTATION}
      />
      <ambientLight intensity={0.85} />
      {/* Key + fill on the screen side, matching the camera (shot-frame
          positions, carried into the world). Kept gentle — a hot key light
          turns the GLB's metallic frame into an orange glow. */}
      <directionalLight position={toStage(-4, 2, 3)} intensity={1.0} />
      <directionalLight position={toStage(-2, -3, 2)} intensity={0.35} />
      {/* The display is the GLB's own screen mesh, re-UV'd and re-materialled
          in the useMemo above — so it rides the model's transform exactly and
          can never drift, rescale or lose its rounded outline. */}
      <group rotation={STAGE_ROTATION}>
        <group rotation={[0, tilt, -tilt]}>
          <primitive object={model} />
        </group>
      </group>
      {/* Soft occlusion shadow on the background, in ContactShadows' native
          orientation: flat, below the laid-down phone, looking up at it — which
          in the shot is an upright backdrop just behind the phone. Seen near
          head-on the phone hides most of its own shadow, so what reads is the
          blurred rim and the parallax as the camera swings. */}
      <ContactShadows
        position={toStage(shadowGap, 0, 0)}
        scale={SHADOW_SCALE}
        far={SHADOW_FAR}
        blur={3.2}
        opacity={0.85}
        resolution={512}
        color="#000000"
      />
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
 * `progress` (the camera swing) and `entryProgress` (the entrance spring) are
 * computed OUTSIDE the Sequence and passed in, so shifting the video can never
 * drift the animation timing.
 */
export const Phone: React.FC<PhoneProps> = ({
  videoStartFrom = 10,
  entry = true,
  focus,
  macro,
  ...props
}) => {
  const frame = useCurrentFrame();
  const { durationInFrames, fps } = useVideoConfig();
  // Eased, not linear: the orbit leaves and arrives gently instead of
  // turning at a constant, mechanical rate.
  const progress = interpolate(frame, [0, Math.max(durationInFrames - 1, 1)], [0, 1], {
    easing: Easing.inOut(Easing.sin),
  });
  const entryProgress = entry ? spring({ frame, fps, config: ENTRY_SPRING }) : 1;
  const moment = focusAt(focus, frame + Math.max(0, Math.round(videoStartFrom)), fps);
  const macroState = macroAt(macro, frame);
  const focusState =
    macroState && (!moment || macroState.w >= moment.w) ? macroState : moment;

  return (
    <Sequence from={-Math.max(0, Math.round(videoStartFrom))} layout="none">
      <PhoneCanvas
        {...props}
        progress={progress}
        entryProgress={entryProgress}
        focusState={focusState}
      />
    </Sequence>
  );
};

/** The macro lock: full weight until releaseAt, then a whip out to 0. */
const macroAt = (macro: PhoneMacro | undefined, frame: number): FocusState | null => {
  if (!macro) return null;
  const w =
    1 -
    interpolate(frame - macro.releaseAt, [0, Math.max(macro.releaseFrames, 1)], [0, 1], {
      easing: Easing.out(Easing.exp),
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
  return w > 0.0005 ? { u: macro.u, v: macro.v, zoom: macro.zoom, w } : null;
};

/** Weight of each focus moment at capture frame `takeFrame`; the strongest wins. */
const focusAt = (
  focus: PhoneFocus[] | undefined,
  takeFrame: number,
  fps: number
): FocusState | null => {
  let best: FocusState | null = null;
  for (const f of focus ?? []) {
    const start = Math.round(f.at * fps);
    const end = Math.round((f.at + f.hold) * fps);
    const w =
      spring({ frame: takeFrame - start, fps, config: FOCUS_SPRING }) -
      spring({ frame: takeFrame - end, fps, config: FOCUS_SPRING });
    if (!best || w > best.w) best = { u: f.u, v: f.v, zoom: f.zoom, w };
  }
  return best;
};

const PhoneCanvas: React.FC<
  Omit<PhoneProps, "videoStartFrom" | "entry" | "focus"> & {
    progress: number;
    entryProgress: number;
    focusState: FocusState | null;
  }
> = ({
  videoSrc,
  progress,
  entryProgress,
  focusState,
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
  const screenTexture = useRetainedTexture(texture, videoSrc, isRendering);

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
      <ThreeCanvas width={width} height={height} style={canvasStyle} dpr={PHONE_DPR}>
        <PhoneModel
          texture={screenTexture}
          progress={progress}
          entryProgress={entryProgress}
          swingDeg={swingDeg}
          dollyIn={dollyIn}
          radius={effectiveRadius}
          screenRotDeg={screenRotDeg}
          screenFlipY={screenFlipY}
          focus={focusState}
        />
      </ThreeCanvas>
    </>
  );
};

/**
 * NO MAGENTA FRAMES. useOffthreadVideoTexture() loads each frame's picture
 * asynchronously and hands back null until the first one has arrived (again
 * after a remount). The screen material shows magenta for null (the "video
 * never arrived" signal), and a render could screenshot that in-between
 * state. It happened on frame 0 and frame 2 of T3-Speedrun-Spotify on
 * 2026-09-25, on consecutive renders. Two guards:
 *
 *  1. Keep the last texture that did arrive and show it while a newer one is
 *     loading. At worst one frame repeats the previous picture, which is
 *     invisible in motion, where magenta is not. The hook owns every texture
 *     and disposes of each one when the next frame's is requested; three.js
 *     re-uploads a disposed texture whose image is still there, so showing
 *     it again is safe. This cache never disposes of anything itself (that
 *     would be a double dispose). It holds ONE reference and drops it on
 *     unmount and whenever the video source changes, so nothing leaks.
 *  2. Before ANY texture has arrived, a render-only delayRender holds the
 *     screenshot. It is released two animation frames after the first
 *     texture, once the canvas has actually drawn it. If the video can
 *     never load, the render now times out with a named error instead of
 *     shipping a magenta phone.
 *
 * In Studio (not rendering) neither guard applies, so a genuinely missing
 * video still shows magenta there.
 */
const useRetainedTexture = (
  texture: THREE.Texture | null,
  videoSrc: string,
  isRendering: boolean
): THREE.Texture | null => {
  const last = useRef<{ src: string; texture: THREE.Texture } | null>(null);
  if (texture) last.current = { src: videoSrc, texture };
  else if (last.current && last.current.src !== videoSrc) last.current = null;

  // Drop the reference on unmount (and when the source changes).
  useEffect(
    () => () => {
      last.current = null;
    },
    [videoSrc]
  );

  const [firstFrame] = useState(() =>
    isRendering ? delayRender(`Phone: waiting for the first frame of ${videoSrc}`) : null
  );
  // Each step at most once: scheduled, then continued.
  const scheduled = useRef(false);
  const continued = useRef(false);
  const release = () => {
    if (firstFrame === null || continued.current) return;
    continued.current = true;
    continueRender(firstFrame);
  };
  const hasTexture = texture !== null || last.current !== null;
  useEffect(() => {
    if (firstFrame === null || scheduled.current || !hasTexture) return;
    scheduled.current = true;
    // Two rAFs: one for react-three-fiber to commit the new material, one
    // for the canvas to draw it.
    let raf2 = 0;
    const raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(release);
    });
    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
      release(); // never leave the handle open on unmount
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [firstFrame, hasTexture]);

  return texture ?? (last.current?.src === videoSrc ? last.current.texture : null);
};

useGLTF.preload(staticFile("iphone17pro.glb"));
