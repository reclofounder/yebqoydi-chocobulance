"""Exports a cut-out photo (transparent PNG) for the page: fully opaque inside, soft edges kept,
as AVIF with full colour resolution at two heights (for desktop and phones).

    python tools/photos/export.py "imgs/Curly-haired boy ....png" public/boys/curly 900

writes public/boys/curly.avif (900 px tall) and curly-450.avif. Needs Pillow with AVIF and numpy.
"""

import sys
from pathlib import Path

import numpy as np
from PIL import Image

QUALITY = 80


def main(src: str, out: str, height: str) -> None:
    im = Image.open(src).convert('RGBA')
    rgba = np.array(im)
    # The cut-out's body is about 98% opaque (alpha 240-254): on the red page that would tint it.
    # Anything that solid becomes fully opaque; the soft edges (hair) keep their alpha.
    alpha = rgba[..., 3]
    alpha[alpha >= 240] = 255
    im = Image.fromarray(rgba, 'RGBA')
    ys, xs = np.where(alpha > 8)
    im = im.crop((xs.min(), ys.min(), xs.max() + 1, ys.max() + 1))

    dest = Path(out)
    dest.parent.mkdir(parents=True, exist_ok=True)
    for h, suffix in ((int(height), ''), (int(height) // 2, f'-{int(height) // 2}')):
        w = round(im.width * h / im.height)
        # Premultiplied, so the soft edge does not pick up dark fringes from transparent pixels.
        small = im.convert('RGBa').resize((w, h), Image.LANCZOS).convert('RGBA')
        path = dest.with_name(dest.name + suffix + '.avif')
        small.save(path, 'AVIF', quality=QUALITY, subsampling='4:4:4', speed=4)
        print(f'{path}  {w}x{h}  {path.stat().st_size / 1024:.1f} kB')


if __name__ == '__main__':
    main(*sys.argv[1:4])
