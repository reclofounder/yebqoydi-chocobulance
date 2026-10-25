"""Exports the Chocobulance car for the page from the two side views of the design PDF.

Input: the left-facing and right-facing pages rendered to transparent PNGs by render.swift (Quartz,
so the CMYK artwork gets ColorSync's colours, as Illustrator and Preview show them). Output, in
public/car/: each view's body as WebP at 1440 and 720 px wide, and its two rims as round WebP
discs the page spins (at both scales); and src/styles/car.css, the body's proportions and where each rim sits.

    swift tools/car/render.swift design.pdf 1 2.0833333 left.png    # 150 dpi
    swift tools/car/render.swift design.pdf 2 2.0833333 right.png
    python tools/car/export.py left.png right.png public/car src/styles/car.css

Needs Pillow, numpy and scipy (a throwaway virtualenv is enough). See README, "Swap the car".
"""

import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage

WIDTH = 1440  # body width, px: the car shows at most 720 CSS px wide, so this is 2x
SMALL = 720  # the phone size
RIM_MARGIN = 6  # source px past the bright rim kept in the spinning disc (a sliver of tyre)


def solid(im: np.ndarray) -> np.ndarray:
    """Every pixel enclosed by the car becomes what it shows on the white artboard, fully opaque.

    The photo cut-out leaves see-through holes (between the spokes, for one): light grey on white,
    but the page is red. The outer soft edge (connected to the image border) is left alone.
    """
    rgba = im.astype(np.float64)
    alpha = rgba[..., 3] / 255
    passable = alpha < 250 / 255
    labels, _ = ndimage.label(passable)
    border = np.unique(np.concatenate([labels[0], labels[-1], labels[:, 0], labels[:, -1]]))
    inside = ~np.isin(labels, border[border > 0])
    on_white = rgba[..., :3] * alpha[..., None] + 255 * (1 - alpha[..., None])
    rgba[inside, :3] = on_white[inside]
    rgba[inside, 3] = 255
    return rgba.round().clip(0, 255).astype(np.uint8)


def bbox(im: np.ndarray) -> tuple[int, int, int, int]:
    ys, xs = np.where(im[..., 3] > 8)
    return xs.min(), ys.min(), xs.max() + 1, ys.max() + 1


def wheels(im: np.ndarray) -> list[tuple[float, float, float, float]]:
    """(cx, cy, rim radius, tyre radius) of the two wheels, left to right, in source px.

    The tyre first: a circle fitted to the bottom edge of the dark rubber (the one part of it the
    body never covers), in each half of the car. Then the rim: the bright grey pixels inside that
    circle (so the white body cannot be mistaken for it); its radius is the median over angles of
    the farthest one.
    """
    rgb = im[..., :3].astype(np.float64)
    lum = rgb @ [0.299, 0.587, 0.114]
    sat = rgb.max(-1) - rgb.min(-1)
    bright = (lum > 95) & (sat < 40) & (im[..., 3] > 250)
    dark = (lum < 70) & (im[..., 3] > 200)
    h, w = lum.shape
    x0, y0, x1, y1 = bbox(im)
    depth = 0.05 * (y1 - y0)  # how far up from its lowest point the tyre's arc is sampled

    out = []
    yy, xx = np.mgrid[0:h, 0:w]
    for lo, hi in ((x0, (x0 + x1) // 2), ((x0 + x1) // 2, x1)):
        # The lowest dark pixel of each column: along the tyre, that is its bottom arc.
        cols = np.arange(lo, hi)
        has = dark[:, lo:hi].any(0)
        bottom = np.where(has, h - 1 - np.argmax(dark[::-1, lo:hi], 0), -1)
        lowest = bottom.max()
        pick = bottom >= lowest - depth
        px, py = cols[pick].astype(float), bottom[pick].astype(float)
        # Least-squares circle (Kasa): x^2 + y^2 + D x + E y + F = 0.
        a = np.column_stack([px, py, np.ones_like(px)])
        d, e, f = np.linalg.lstsq(a, -(px**2 + py**2), rcond=None)[0]
        cx, cy = -d / 2, -e / 2
        tyre = float(np.sqrt(cx**2 + cy**2 - f))

        inner = bright & ((xx - cx) ** 2 + (yy - cy) ** 2 < (0.95 * tyre) ** 2)
        ys, xs = np.where(inner)
        cx = (np.percentile(xs, 0.2) + np.percentile(xs, 99.8)) / 2
        cy = (np.percentile(ys, 0.2) + np.percentile(ys, 99.8)) / 2
        radii = []
        for t in np.linspace(0, 2 * np.pi, 180, endpoint=False):
            far = 0
            for r in range(int(tyre * 0.3), int(tyre * 0.95)):
                x, y = int(round(cx + r * np.cos(t))), int(round(cy + r * np.sin(t)))
                if 0 <= x < w and 0 <= y < h and inner[y, x]:
                    far = r
            radii.append(far)
        rim = float(np.median(radii))
        # The fit only finds the rim's neighbourhood: a flattened contact patch makes the circle too
        # big. The tyre's real radius is where the car ends (the ground is transparent) straight
        # below the rim's centre.
        x, y = int(round(cx)), int(cy + rim)
        while y < h - 1 and im[y, x, 3] >= 128:
            y += 1
        out.append((float(cx), float(cy), rim, float(y - cy)))
    return out


def resize(im: Image.Image, size: tuple[int, int], box=None) -> Image.Image:
    # Premultiplied, so the soft edge does not pick up dark fringes from transparent pixels.
    return im.convert('RGBa').resize(size, Image.LANCZOS, box=box).convert('RGBA')


def save(im: Image.Image, path: Path) -> None:
    im.save(path, 'WEBP', quality=86, method=6, alpha_quality=100)
    print(f'  {path.name:28} {im.size[0]}x{im.size[1]}  {path.stat().st_size / 1024:.1f} kB')


def main(left: str, right: str, out: str, css: str) -> None:
    dest = Path(out)
    dest.mkdir(parents=True, exist_ok=True)
    views = {'left': solid(np.array(Image.open(left).convert('RGBA'))),
             'right': solid(np.array(Image.open(right).convert('RGBA')))}

    # One frame for both views, so the car keeps its size when it turns round.
    boxes = {k: bbox(v) for k, v in views.items()}
    fw = max(b[2] - b[0] for b in boxes.values()) + 4
    fh = max(b[3] - b[1] for b in boxes.values()) + 4
    scale = WIDTH / fw
    height = round(fh * scale)

    rules, tyres = [], []
    for name, im in views.items():
        x0, y0 = boxes[name][0] - 2, boxes[name][1] - 2
        frame = Image.fromarray(im, 'RGBA').crop((x0, y0, x0 + fw, y0 + fh))
        save(resize(frame, (WIDTH, height)), dest / f'{name}.webp')
        save(resize(frame, (SMALL, round(fh * SMALL / fw))), dest / f'{name}-{SMALL}.webp')

        source = Image.fromarray(im, 'RGBA')
        for (cx, cy, rim, tyre), side in zip(wheels(im), ('a', 'b')):
            size = round(2 * (rim + RIM_MARGIN) * scale)  # whole px at the output scale
            r = size / scale / 2  # back in source px
            disc = resize(source, (size, size), box=(cx - r, cy - r, cx + r, cy + r))
            # A round, softly edged mask: the square around the rim must not spin.
            mask = Image.new('L', (size * 4, size * 4), 0)
            ImageDraw.Draw(mask).ellipse((2, 2, size * 4 - 3, size * 4 - 3), fill=255)
            mask = mask.resize((size, size), Image.LANCZOS)
            disc.putalpha(Image.fromarray(np.minimum(np.array(disc)[..., 3], np.array(mask))))
            save(disc, dest / f'{name}-wheel-{side}.webp')
            save(resize(disc, (round(size * SMALL / WIDTH),) * 2), dest / f'{name}-wheel-{side}-{SMALL}.webp')
            print(f'    rim r {rim:.0f}, tyre r {tyre:.0f} (source px)')
            tyres.append(tyre)
            rules.append(
                f'.car--{name} .car__wheel--{side} {{\n'
                f'  left: {(cx - r - x0) / fw * 100:.3f}%;\n'
                f'  top: {(cy - r - y0) / fh * 100:.3f}%;\n'
                f'  width: {2 * r / fw * 100:.3f}%;\n}}\n'
            )

    Path(css).write_text(
        '/* Generated by tools/car/export.py from the design PDF: re-run it, do not edit by hand.\n'
        '   --car-ratio is the body art\'s height over its width; --tyre-share the tyre\'s diameter over\n'
        '   the body\'s width (scroll/car.ts spins the rims by it); each rim\'s box is in % of the body. */\n'
        f':root {{\n  --car-ratio: {fh / fw:.4f};\n  --tyre-share: {2 * np.median(tyres) / fw:.4f};\n}}\n\n'
        + '\n'.join(rules)
    )
    print(f'  wrote {css}')


if __name__ == '__main__':
    main(*sys.argv[1:5])
