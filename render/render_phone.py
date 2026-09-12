"""
SideQuest Reel Factory v2 — Blender phone render (animated).

Runs headless inside Blender:
  blender -b -P render/render_phone.py -- <screen_png> <out_dir> [frames]

Upgrade over v1: instead of one static frame, this animates a subtle camera
orbit + dolly so the phone feels alive in the reel. Outputs a PNG sequence
(RGBA, transparent) into cache/renders/<screen>/f0000.png ... which compose.py
plays back.

Quality settings kept from the proven v1 look (minimal reflections, Filmic,
transparent film, 4-light setup). Render cost is the main tradeoff: a 45-frame
move at 128 samples is the sweet spot for CPU. For faster iteration, drive the
same rig through the Higgsfield Blender bridge (see docs/pipeline.md).

NOTE: paths to the GLB / HDRI / font are passed via env or the CONFIG block
below — set them to wherever you keep the assets in this base. They are left as
placeholders so nothing points at the old sandbox.
"""
import os
import sys
import math

import bpy  # available only inside Blender

# ---- args after the "--" separator ----
argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
SCREEN_PNG = argv[0] if len(argv) > 0 else ""
OUT_DIR    = argv[1] if len(argv) > 1 else "cache/renders/out"
N_FRAMES   = int(argv[2]) if len(argv) > 2 else 45

# ---- asset paths (set these in your base; env overrides) ----
GLB_PATH  = os.environ.get("SQ_GLB",  "assets/iphone17pro.glb")
HDRI_PATH = os.environ.get("SQ_HDRI", "assets/studio_hdri.hdr")

SAMPLES = 128            # v1 used 256 static; 128 keeps a 45-frame move affordable
RES_X, RES_Y = 1080, 1920

os.makedirs(OUT_DIR, exist_ok=True)


def reset_scene():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    scene = bpy.context.scene
    scene.render.engine = "CYCLES"
    scene.cycles.samples = SAMPLES
    scene.cycles.device = "CPU"
    scene.render.resolution_x = RES_X
    scene.render.resolution_y = RES_Y
    scene.render.film_transparent = True
    scene.view_settings.view_transform = "Filmic"
    scene.render.image_settings.file_format = "PNG"
    scene.render.image_settings.color_mode = "RGBA"
    return scene


def setup_world(scene):
    world = bpy.data.worlds.new("W")
    scene.world = world
    world.use_nodes = True
    nt = world.node_tree
    bg = nt.nodes.get("Background")
    if os.path.exists(HDRI_PATH):
        env = nt.nodes.new("ShaderNodeTexEnvironment")
        env.image = bpy.data.images.load(HDRI_PATH)
        nt.links.new(env.outputs["Color"], bg.inputs["Color"])
    bg.inputs["Strength"].default_value = 0.2  # minimal reflections (v1 spec)


def add_lights():
    def light(name, kind, energy, loc):
        d = bpy.data.lights.new(name, kind)
        d.energy = energy
        o = bpy.data.objects.new(name, d)
        o.location = loc
        bpy.context.collection.objects.link(o)
    light("key",  "AREA", 150, (2, -2, 3))
    light("rim",  "AREA", 100, (-2, 2, 2))
    light("fill", "AREA", 60,  (0, -3, 1))
    light("sun",  "SUN",  1.0, (0, 0, 5))


def import_phone():
    if not os.path.exists(GLB_PATH):
        print(f"⚠ GLB not found at {GLB_PATH} — rendering empty stage")
        return None, []
    bpy.ops.import_scene.gltf(filepath=GLB_PATH)

    # CHROMA MODE: render the screen as solid magenta (no image) so compose can
    # detect the screen region and composite scrolling app UI onto it in 2D.
    # This makes the phone render REUSABLE — render once, use for every reel.
    chroma = os.environ.get("SQ_CHROMA", "0") == "1"

    if not chroma and not os.path.exists(SCREEN_PNG):
        print(f"⚠ screen PNG not found at {SCREEN_PNG}")
        return None, []
    # Find the display mesh: heuristically the object whose name hints 'screen'
    # or the largest flat mesh. Adjust SCREEN_MESH env if your GLB names differ.
    screen_hint = os.environ.get("SQ_SCREEN_MESH", "").lower()
    target = None
    meshes = [o for o in bpy.data.objects if o.type == "MESH"]
    if screen_hint:
        target = next((o for o in meshes if screen_hint in o.name.lower()), None)
    if target is None:
        target = next((o for o in meshes
                       if any(k in o.name.lower()
                              for k in ("screen", "display", "glass"))), None)
    if target is None and meshes:
        # fallback: largest object by bounding-box area
        target = max(meshes, key=lambda o: o.dimensions.x * o.dimensions.y)
    if target is None:
        print("⚠ no mesh to texture")
        return None, []

    if chroma:
        # Solid magenta, fully emissive so lighting doesn't tint it — gives a
        # flat, easily-detectable screen region for compositing.
        mat = bpy.data.materials.new("ChromaScreen")
        mat.use_nodes = True
        bsdf = mat.node_tree.nodes.get("Principled BSDF")
        magenta = (1.0, 0.0, 1.0, 1.0)
        bsdf.inputs["Base Color"].default_value = magenta
        if "Emission Color" in bsdf.inputs:
            bsdf.inputs["Emission Color"].default_value = magenta
            bsdf.inputs["Emission Strength"].default_value = 1.0
        bsdf.inputs["Roughness"].default_value = 1.0
        if target.data.materials:
            target.data.materials[0] = mat
        else:
            target.data.materials.append(mat)
        print(f"✓ chroma screen (magenta) on '{target.name}'")
        return None, []

    # SCREEN_PNG may be a single file OR a folder of scroll frames (f0000.png…).
    # For a folder we pre-rotate every frame into a temp seq and swap the
    # texture per render frame (live scroll). For a file, single texture as before.
    rot = int(os.environ.get("SQ_SCREEN_ROT", "180"))
    abs_screen = bpy.path.abspath(SCREEN_PNG)
    seq_frames = []
    if os.path.isdir(abs_screen):
        src_frames = sorted(f for f in os.listdir(abs_screen)
                            if f.startswith("f") and f.endswith(".png"))
        if rot in (90, 180, 270):
            # rotate each frame via PIL if available (Blender's python often
            # lacks PIL — in that case pre-rotate the frames with your own
            # python before calling Blender and pass SQ_SCREEN_ROT=0)
            rot_dir = os.path.join(abs_screen, "_rot")
            os.makedirs(rot_dir, exist_ok=True)
            try:
                from PIL import Image as _PILImage
                for fn in src_frames:
                    dst = os.path.join(rot_dir, fn)
                    _PILImage.open(os.path.join(abs_screen, fn)).rotate(
                        -rot, expand=True).save(dst)
                    seq_frames.append(dst)
                print(f"✓ prepared {len(seq_frames)} scroll frames (rotated {rot}°)")
            except Exception as _e:
                print(f"⚠ PIL not in Blender ({_e}); pre-rotate frames yourself "
                      f"and pass SQ_SCREEN_ROT=0. Loading frames un-rotated.")
                seq_frames = [os.path.join(abs_screen, fn) for fn in src_frames]
        else:
            # frames already correctly oriented — load directly, no PIL needed
            seq_frames = [os.path.join(abs_screen, fn) for fn in src_frames]
            print(f"✓ loaded {len(seq_frames)} scroll frames (no rotation)")
        screen_path = seq_frames[0] if seq_frames else abs_screen
    else:
        screen_path = SCREEN_PNG
        if rot in (90, 180, 270):
            try:
                from PIL import Image as _PILImage
                _dst = os.path.join(os.path.dirname(abs_screen) or ".", "_screen_rot.png")
                _PILImage.open(abs_screen).rotate(-rot, expand=True).save(_dst)
                screen_path = _dst
                print(f"✓ rotated screen texture {rot}°")
            except Exception as _e:
                print(f"⚠ could not rotate screen texture: {_e}")

    img = bpy.data.images.load(screen_path)
    mat = bpy.data.materials.new("ScreenMat")
    mat.use_nodes = True
    nt = mat.node_tree
    bsdf = nt.nodes.get("Principled BSDF")
    tex = nt.nodes.new("ShaderNodeTexImage")
    tex.image = img
    # emissive so the screen reads bright like a real display
    nt.links.new(tex.outputs["Color"], bsdf.inputs["Base Color"])
    if "Emission Color" in bsdf.inputs:
        nt.links.new(tex.outputs["Color"], bsdf.inputs["Emission Color"])
        bsdf.inputs["Emission Strength"].default_value = 1.0
    bsdf.inputs["Roughness"].default_value = 0.4     # v1 tuning
    if target.data.materials:
        target.data.materials[0] = mat
    else:
        target.data.materials.append(mat)
    print(f"✓ textured screen onto '{target.name}'")
    return tex, seq_frames


def orient_phone():
    """Rotate the phone as ONE unit so its screen faces the camera.

    Fix: parent every mesh to a single empty and rotate the empty, so all parts
    turn together (rotating each mesh's own euler individually made parts
    diverge and, combined with the orbiting camera, showed the same edge every
    time). Tune with SQ_PHONE_ROT="X,Y,Z" in degrees.
    """
    rot = os.environ.get("SQ_PHONE_ROT", "0,0,0")
    rx, ry, rz = (math.radians(float(a)) for a in rot.split(","))
    pivot = bpy.data.objects.new("PhonePivot", None)  # empty
    bpy.context.scene.collection.objects.link(pivot)
    pivot.location = (0, 0, 0)
    for o in list(bpy.data.objects):
        if o.type == "MESH" and o.parent is None:
            o.parent = pivot
    pivot.rotation_euler = (rx, ry, rz)
    print(f"✓ oriented phone as one unit by {rot} deg")
    return pivot


def animate_camera(scene, n):
    cam_data = bpy.data.cameras.new("Cam")
    cam = bpy.data.objects.new("Cam", cam_data)
    scene.collection.objects.link(cam)
    scene.camera = cam
    scene.frame_start = 0
    scene.frame_end = n - 1

    # Which world axis the camera sits on to look at the phone's FLAT face.
    #   'x'  -> camera on +X   '-x' -> camera on -X
    #   'y'  -> camera on -Y   '-y' -> camera on +Y
    # Screen is flat along X for this GLB, so use 'x' or '-x'. If one shows the
    # back, the other shows the screen. Set SQ_FACE_AXIS to switch.
    face = os.environ.get("SQ_FACE_AXIS", "x").lower()
    swing = float(os.environ.get("SQ_SWING_DEG", "20"))
    radius = 6.0

    # Empty at origin for the camera to track — guarantees the phone stays
    # centered in frame throughout the orbit (no manual rotation drift).
    target = bpy.data.objects.new("CamTarget", None)
    scene.collection.objects.link(target)
    target.location = (0, 0, 0)
    con = cam.constraints.new(type="TRACK_TO")
    con.target = target
    con.track_axis = "TRACK_NEGATIVE_Z"
    con.up_axis = "UP_Y"

    for f in range(n):
        t = f / max(n - 1, 1)
        ang = math.radians(-swing / 2 + swing * t)
        r = radius - 0.7 * t
        z = 0.0
        if face == "x":
            cam.location = (math.cos(ang) * r, math.sin(ang) * r, z)
        elif face == "-x":
            cam.location = (-math.cos(ang) * r, math.sin(ang) * r, z)
        elif face == "-y":
            cam.location = (math.sin(ang) * r, math.cos(ang) * r, z)
        else:  # 'y'
            cam.location = (math.sin(ang) * r, -math.cos(ang) * r, z)
        cam.keyframe_insert("location", frame=f)


def render_sequence(scene, out_dir, n, tex=None, seq_frames=None):
    import bpy as _bpy
    # If we have a scroll sequence, map render frame -> screen frame so the UI
    # scrolls across the render. Otherwise the single texture stays put.
    preloaded = []
    if tex is not None and seq_frames:
        for pth in seq_frames:
            preloaded.append(_bpy.data.images.load(pth, check_existing=True))
    for f in range(n):
        scene.frame_set(f)
        if preloaded:
            idx = int(f / max(n - 1, 1) * (len(preloaded) - 1))
            tex.image = preloaded[idx]
        scene.render.filepath = os.path.join(out_dir, f"f{f:04d}.png")
        bpy.ops.render.render(write_still=True)
        print(f"rendered frame {f+1}/{n}")


def main():
    scene = reset_scene()
    setup_world(scene)
    add_lights()
    tex, seq_frames = import_phone()
    orient_phone()
    animate_camera(scene, N_FRAMES)
    render_sequence(scene, OUT_DIR, N_FRAMES, tex, seq_frames)
    print("DONE:", OUT_DIR)


if __name__ == "__main__":
    main()
