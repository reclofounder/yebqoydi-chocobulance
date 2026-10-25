"""Exports the Chocobulance car for the page from the two side views of the design PDF.

Input: the left-facing and right-facing pages rendered to transparent PNGs by render.swift (Quartz,
so the CMYK artwork gets ColorSync's colours, as Illustrator and Preview show them). Output, in
public/car/: each view's body as AVIF at 1440 and 720 px wide, and its two rims as round AVIF discs
the page spins (at both scales); and src/styles/car.css, the body's proportions and where each rim
sits.

    swift tools/car/render.swift design.pdf 1 2.0833333 left.png    # 150 dpi
    swift tools/car/render.swift design.pdf 2 2.0833333 right.png
    python tools/car/export.py left.png right.png public/car src/styles/car.css

AVIF with full-resolution colour (4:4:4): lossy WebP halves the colour resolution, which smears the
livery's thin red edges against the white body (measured: 4x the error on those edges, at a larger
file). Needs Pillow (with AVIF), numpy and scipy; a throwaway virtualenv is enough. See README,
"The car".
"""

import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage

WIDTH = 1440  # body width, px: the car shows at most 720 CSS px wide, so this is 2x
SMALL = 720  # the phone size
RIM_MARGIN = 5  # source px past the rim's outer edge kept in the spinning disc (a sliver of tyre)
QUALITY = 82


def luminance(im: np.ndarray) -> np.ndarray:
    return im[..., :3].astype(np.float64) @ [0.299, 0.587, 0.114]


def bbox(im: np.ndarray) -> tuple[int, int, int, int]:
    ys, xs = np.where(im[..., 3] > 8)
    return xs.min(), ys.min(), xs.max() + 1, ys.max() + 1


def fit_circle(px: np.ndarray, py: np.ndarray) -> tuple[float, float, float]:
    """Least-squares circle (Kasa): x^2 + y^2 + D x + E y + F = 0."""
    a = np.column_stack([px, py, np.ones_like(px)])
    d, e, f = np.linalg.lstsq(a, -(px**2 + py**2), rcond=None)[0]
    cx, cy = -d / 2, -e / 2
    return cx, cy, float(np.sqrt(cx**2 + cy**2 - f))


def rim_edge(lum: np.ndarray, alpha: np.ndarray, cx: float, cy: float, r: float):
    """Points on the rim's outer edge: along rays from the centre, where the bright alloy gives way
    to the dark tyre. Holes (transparent pixels) never count as alloy."""
    h, w = lum.shape
    xs, ys = [], []
    for t in np.linspace(0, 2 * np.pi, 360, endpoint=False):
        rr = np.arange(0.75 * r, 1.15 * r, 0.5)
        x = np.clip(np.round(cx + rr * np.cos(t)).astype(int), 0, w - 1)
        y = np.clip(np.round(cy + rr * np.sin(t)).astype(int), 0, h - 1)
        bright = (lum[y, x] > 110) & (alpha[y, x] > 250)
        dark = (lum[y, x] < 70) & (alpha[y, x] > 250)
        edge = None
        for i in range(len(rr) - 8):
            # The last bright sample that has only tyre (dark) within the next 4 px.
            if bright[i] and dark[i + 1 : i + 9].sum() >= 6:
                edge = rr[i] + 0.5
        if edge is not None:
            xs.append(cx + edge * np.cos(t))
            ys.append(cy + edge * np.sin(t))
    return np.array(xs), np.array(ys)


def wheels(im: np.ndarray) -> list[dict]:
    """The two wheels, left to right, in source px: centre, the rim's outer edge radius, the tyre's
    radius, and how round the fitted rim is (the spread of its edge points around the circle).

    Run on the render as it is, holes still transparent, so a hole between the spokes can never
    pass for alloy. First a circle fitted to the bottom edge of the tyre (the one part of it the
    body never covers) places each wheel; then a circle fitted to the rim's outer edge, with
    outliers (a spoke's shadow, a light hub) dropped, gives the centre the rim turns around.
    """
    lum = luminance(im)
    alpha = im[..., 3]
    sat = im[..., :3].max(-1).astype(int) - im[..., :3].min(-1)
    dark = (lum < 70) & (alpha > 200)
    h, w = lum.shape
    x0, y0, x1, y1 = bbox(im)
    depth = 0.05 * (y1 - y0)  # how far up from its lowest point the tyre's arc is sampled

    out = []
    yy, xx = np.mgrid[0:h, 0:w]
    for lo, hi in ((x0, (x0 + x1) // 2), ((x0 + x1) // 2, x1)):
        cols = np.arange(lo, hi)
        has = dark[:, lo:hi].any(0)
        bottom = np.where(has, h - 1 - np.argmax(dark[::-1, lo:hi], 0), -1)
        pick = bottom >= bottom.max() - depth
        cx, cy, tyre_fit = fit_circle(cols[pick].astype(float), bottom[pick].astype(float))

        # A first rim: the bright grey disc inside that circle.
        alloy = (lum > 95) & (sat < 40) & (alpha > 250)
        alloy &= (xx - cx) ** 2 + (yy - cy) ** 2 < (0.95 * tyre_fit) ** 2
        ys_, xs_ = np.where(alloy)
        cx = (np.percentile(xs_, 0.5) + np.percentile(xs_, 99.5)) / 2
        cy = (np.percentile(ys_, 0.5) + np.percentile(ys_, 99.5)) / 2
        r = (np.percentile(xs_, 99.5) - np.percentile(xs_, 0.5)) / 2

        # Then the rim's outer edge, fitted and refitted without the stray points.
        for _ in range(4):
            px, py = rim_edge(lum, alpha, cx, cy, r)
            cx, cy, r = fit_circle(px, py)
            res = np.hypot(px - cx, py - cy) - r
            keep = np.abs(res) < 2.5
            cx, cy, r = fit_circle(px[keep], py[keep])
        res = np.hypot(px[keep] - cx, py[keep] - cy) - r

        x, y = int(round(cx)), int(cy + r)
        while y < h - 1 and alpha[y, x] >= 128:  # the tyre ends where the car does (ground)
            y += 1
        out.append({'cx': cx, 'cy': cy, 'rim': r, 'tyre': float(y - cy),
                    'spread': float(res.std()), 'points': int(keep.sum())})
    return out


def solid(im: np.ndarray, found: list[dict]) -> np.ndarray:
    """Every pixel enclosed by the car becomes opaque, so the red page never shows through it.

    The photo cut-out leaves see-through holes. Inside a wheel (between the spokes) they become the
    dark of the brakes behind the spokes, sampled from that wheel; on the artboard they showed
    white, which would spin with the rim as a light patch. Anywhere else they become what they show
    on the white artboard. The outer soft edge (connected to the image border) is left alone.
    """
    rgba = im.astype(np.float64)
    alpha = rgba[..., 3] / 255
    lum = luminance(im)
    passable = alpha < 250 / 255
    labels, _ = ndimage.label(passable)
    border = np.unique(np.concatenate([labels[0], labels[-1], labels[:, 0], labels[:, -1]]))
    inside = ~np.isin(labels, border[border > 0])

    backdrop = np.full(rgba.shape[:2] + (3,), 255.0)
    h, w = alpha.shape
    yy, xx = np.mgrid[0:h, 0:w]
    for wheel in found:
        dist = np.hypot(xx - wheel['cx'], yy - wheel['cy'])
        disc = dist < wheel['tyre']
        behind = (dist > 0.3 * wheel['rim']) & (dist < 0.9 * wheel['rim'])
        behind &= (lum < 90) & (alpha > 250 / 255)
        backdrop[disc] = np.median(rgba[behind, :3], axis=0)

    filled = rgba[..., :3] * alpha[..., None] + backdrop * (1 - alpha[..., None])
    rgba[inside, :3] = filled[inside]
    rgba[inside, 3] = 255
    return rgba.round().clip(0, 255).astype(np.uint8)


def resize(im: Image.Image, size: tuple[int, int], box=None) -> Image.Image:
    # Premultiplied, so the soft edge does not pick up dark fringes from transparent pixels.
    return im.convert('RGBa').resize(size, Image.LANCZOS, box=box).convert('RGBA')


def save(im: Image.Image, path: Path) -> None:
    im.save(path, 'AVIF', quality=QUALITY, subsampling='4:4:4', speed=4)
    print(f'  {path.name:28} {im.size[0]}x{im.size[1]}  {path.stat().st_size / 1024:.1f} kB')


def main(left: str, right: str, out: str, css: str) -> None:
    dest = Path(out)
    dest.mkdir(parents=True, exist_ok=True)
    views = {}
    for name, path in (('left', left), ('right', right)):
        raw = np.array(Image.open(path).convert('RGBA'))
        found = wheels(raw)
        views[name] = (solid(raw, found), found)

    # One frame for both views, so the car keeps its size when it turns round.
    boxes = {k: bbox(v[0]) for k, v in views.items()}
    fw = max(b[2] - b[0] for b in boxes.values()) + 4
    fh = max(b[3] - b[1] for b in boxes.values()) + 4
    scale = WIDTH / fw
    height = round(fh * scale)

    rules, tyres = [], []
    for name, (im, found) in views.items():
        x0, y0 = boxes[name][0] - 2, boxes[name][1] - 2
        frame = Image.fromarray(im, 'RGBA').crop((x0, y0, x0 + fw, y0 + fh))
        save(resize(frame, (WIDTH, height)), dest / f'{name}.avif')
        save(resize(frame, (SMALL, round(fh * SMALL / fw))), dest / f'{name}-{SMALL}.avif')

        source = Image.fromarray(im, 'RGBA')
        for wheel, side in zip(found, ('a', 'b')):
            cx, cy = wheel['cx'], wheel['cy']
            size = round(2 * (wheel['rim'] + RIM_MARGIN) * scale)  # whole px at the output scale
            r = size / scale / 2  # back in source px
            disc = resize(source, (size, size), box=(cx - r, cy - r, cx + r, cy + r))
            # A round, softly edged mask: the square around the rim must not spin.
            mask = Image.new('L', (size * 4, size * 4), 0)
            ImageDraw.Draw(mask).ellipse((2, 2, size * 4 - 3, size * 4 - 3), fill=255)
            mask = mask.resize((size, size), Image.LANCZOS)
            disc.putalpha(Image.fromarray(np.minimum(np.array(disc)[..., 3], np.array(mask))))
            save(disc, dest / f'{name}-wheel-{side}.avif')
            save(resize(disc, (round(size * SMALL / WIDTH),) * 2), dest / f'{name}-wheel-{side}-{SMALL}.avif')
            print(f'    centre {cx:.1f},{cy:.1f}  rim r {wheel["rim"]:.1f} (edge points {wheel["points"]},'
                  f' spread {wheel["spread"]:.2f} px)  tyre r {wheel["tyre"]:.0f}')
            tyres.append(wheel['tyre'])
            rules.append(
                f'.car--{name} .car__wheel--{side} {{\n'
                f'  left: {(cx - r - x0) / fw * 100:.3f}%;\n'
                f'  top: {(cy - r - y0) / fh * 100:.3f}%;\n'
                f'  width: {2 * r / fw * 100:.3f}%;\n}}\n'
            )

    Path(css).write_text(
        '/* Generated by tools/car/export.py from the design PDF: re-run it, do not edit by hand.\n'
        "   --car-ratio is the body art's height over its width; --tyre-share the tyre's diameter over\n"
        "   the body's width (scroll/car.ts spins the rims by it); each rim's box is in % of the body. */\n"
        f':root {{\n  --car-ratio: {fh / fw:.4f};\n  --tyre-share: {2 * np.median(tyres) / fw:.4f};\n}}\n\n'
        + '\n'.join(rules)
    )
    print(f'  wrote {css}')


if __name__ == '__main__':
    main(*sys.argv[1:5])
