"""
SideQuest Reel Factory v2 — Screen compositor (green-screen method).

Takes a phone render sequence whose screen is solid MAGENTA (rendered with
SQ_CHROMA=1) and composites app UI onto that screen region in 2D — perspective-
correct, per frame. This decouples the expensive phone render (done once) from
the app content (swapped freely in compose), so:

  - the phone plate is REUSABLE across reels (render once per camera move)
  - scrolling UI is controlled here in milliseconds, not via Blender textures
  - no Blender per-frame texture swapping (which didn't update reliably)

How it works per frame:
  1. find the magenta pixels -> the screen quad
  2. locate its 4 corners
  3. perspective-warp the app frame (still or scroll frame N) onto that quad
  4. paste over the phone, keeping phone edges/reflections outside the screen

Usage (from compose): composite_screen(plate_dir, app_source, out_dir)
  plate_dir  : folder of phone frames f0000.png… with magenta screens (RGBA)
  app_source : a single PNG (still) OR a folder of scroll frames f0000.png…
  out_dir    : where composited f0000.png… are written
"""
import os
from pathlib import Path

import numpy as np
from PIL import Image

# Magenta key. Blender's filmic view transform shifts pure magenta slightly,
# so we match on "high red, low green, high blue" rather than exact 255,0,255.
def _screen_mask(arr):
    r, g, b = arr[..., 0].astype(int), arr[..., 1].astype(int), arr[..., 2].astype(int)
    return (r > 120) & (b > 120) & (g < 90) & (np.abs(r - b) < 90)


def _find_corners(mask):
    """Return the 4 screen corners (TL, TR, BR, BL) from a boolean mask."""
    ys, xs = np.where(mask)
    if len(xs) < 50:
        return None
    pts = np.stack([xs, ys], axis=1).astype(np.float32)
    s = pts.sum(axis=1)
    d = (pts[:, 0] - pts[:, 1])
    tl = pts[np.argmin(s)]
    br = pts[np.argmax(s)]
    tr = pts[np.argmax(d)]
    bl = pts[np.argmin(d)]
    return np.array([tl, tr, br, bl], dtype=np.float32)


def _warp_onto(app_img, dst_corners, canvas_size):
    """Perspective-warp app_img so its 4 corners map to dst_corners.
    Returns (warped_rgba, alpha_mask) sized to canvas."""
    W, H = canvas_size
    aw, ah = app_img.size
    src = np.array([[0, 0], [aw, 0], [aw, ah], [0, ah]], dtype=np.float32)
    # solve homography src->dst
    A = []
    for (sx, sy), (dx, dy) in zip(src, dst_corners):
        A.append([sx, sy, 1, 0, 0, 0, -dx * sx, -dx * sy])
        A.append([0, 0, 0, sx, sy, 1, -dy * sx, -dy * sy])
    A = np.array(A, dtype=np.float64)
    bvec = dst_corners.reshape(8).astype(np.float64)
    h = np.linalg.solve(A, bvec)
    H33 = np.array([[h[0], h[1], h[2]],
                    [h[3], h[4], h[5]],
                    [h[6], h[7], 1.0]])
    # PIL wants the inverse transform (dst->src) as flat 8-tuple
    Hinv = np.linalg.inv(H33)
    Hinv = Hinv / Hinv[2, 2]
    coeffs = Hinv.flatten()[:8]
    warped = app_img.convert("RGBA").transform(
        (W, H), Image.PERSPECTIVE, data=coeffs, resample=Image.BICUBIC)
    return warped


def _app_frame(app_source, i, n):
    """Return the app image for output frame i of n (still repeats; folder scrolls)."""
    p = Path(app_source)
    if p.is_dir():
        frames = sorted(f for f in os.listdir(p)
                        if f.startswith("f") and f.endswith(".png"))
        if not frames:
            return None
        idx = int(i / max(n - 1, 1) * (len(frames) - 1))
        return Image.open(p / frames[idx])
    return Image.open(p)


def composite_screen(plate_dir, app_source, out_dir):
    plate_dir = Path(plate_dir)
    out_dir = Path(out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)
    plates = sorted(f for f in os.listdir(plate_dir)
                    if f.startswith("f") and f.endswith(".png"))
    if not plates:
        raise RuntimeError(f"no plate frames in {plate_dir}")
    n = len(plates)
    ok = 0
    for i, pf in enumerate(plates):
        plate = Image.open(plate_dir / pf).convert("RGBA")
        W, H = plate.size
        arr = np.array(plate)
        mask = _screen_mask(arr)
        corners = _find_corners(mask)
        out = plate
        if corners is not None:
            app = _app_frame(app_source, i, n)
            if app is not None:
                warped = _warp_onto(app, corners, (W, H))
                # aggressively erode the mask so NO magenta rim leaks. Shrink
                # the boolean region by ERODE px on all sides.
                ERODE = int(os.environ.get("SQ_ERODE", "6"))
                m = mask.copy()
                for _ in range(ERODE):
                    m[:, :-1] &= m[:, 1:]
                    m[:, 1:] &= m[:, :-1]
                    m[:-1, :] &= m[1:, :]
                    m[1:, :] &= m[:-1, :]
                # also nuke any remaining magenta pixels in the output by
                # painting the warped app slightly larger than the mask
                screen_region = Image.fromarray((m * 255).astype("uint8"), "L")
                base = plate.copy()
                base.paste(warped, (0, 0), warped)
                out = Image.composite(base, plate, screen_region)
                # final guard: kill any leftover magenta anywhere in the frame
                oa = np.array(out.convert("RGB"))
                leftover = _screen_mask(oa)
                if leftover.any():
                    oa[leftover] = (10, 9, 8)  # bg dark
                    out = Image.fromarray(oa)
                ok += 1
        out.convert("RGB").save(out_dir / f"f{i:04d}.png")
        if (i + 1) % 10 == 0 or i == n - 1:
            print(f"  composited {i+1}/{n}")
    print(f"✓ screen composite done ({ok}/{n} frames had a detected screen)")
    if ok == 0:
        print("⚠ no screen detected in any frame — was the plate rendered with "
              "SQ_CHROMA=1? Check that the screen is magenta.")
    return ok


if __name__ == "__main__":
    import sys
    composite_screen(sys.argv[1], sys.argv[2], sys.argv[3])
