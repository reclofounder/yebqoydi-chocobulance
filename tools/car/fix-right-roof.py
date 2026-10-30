"""Puts the right-facing car's red roof stripe where the left-facing one has it.

On page 2 of the design PDF (the car facing right) the red stripe on the roof sits about 20 px lower
(at 1440 px wide) than on page 1: a sliver of white roof shows above it and it covers the top of the
windows. The two pages are the same photo mirrored, so the roof band is taken from the mirrored
left-facing image (1 px to the left lines them up) and blended in; the rest of the right-facing image,
its "Chococream 20" lettering included, stays as it is.

    python tools/car/fix-right-roof.py public/car

Run it after tools/car/export.py, until the design itself is corrected. Needs Pillow (AVIF), numpy, scipy.
"""

import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter, ImageOps
from scipy import ndimage


def premultiply(a: np.ndarray) -> np.ndarray:
    return np.concatenate([a[..., :3] * a[..., 3:4] / 255, a[..., 3:4]], -1)


def main(folder: str) -> None:
    car = Path(folder)
    right = np.array(Image.open(car / 'right.avif').convert('RGBA')).astype(np.float64)
    mirrored = np.array(ImageOps.mirror(Image.open(car / 'left.avif').convert('RGBA'))).astype(np.float64)
    left = np.zeros_like(mirrored)
    left[:, :-1] = mirrored[:, 1:]

    # Where the two differ along the roof (the top 135 px, the front 1000 px): the misplaced stripe.
    diff = np.abs(right[..., :3] - left[..., :3]).sum(-1) + np.abs(right[..., 3] - left[..., 3]) * 3
    found = ndimage.binary_opening(diff > 90, iterations=2)
    roof = np.zeros_like(found)
    roof[:135, :1000] = found[:135, :1000]
    labels, n = ndimage.label(ndimage.binary_dilation(roof, iterations=6))
    sizes = ndimage.sum(roof, labels, range(1, n + 1))
    band = ndimage.binary_fill_holes(ndimage.binary_dilation(labels == np.argmax(sizes) + 1, iterations=4))
    soft = Image.fromarray((band * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(1.5))
    m = np.array(soft).astype(np.float64)[..., None] / 255

    mixed = premultiply(right) * (1 - m) + premultiply(left) * m
    alpha = mixed[..., 3:4]
    out = np.concatenate([np.where(alpha > 0, mixed[..., :3] * 255 / np.maximum(alpha, 1e-6), 0), alpha], -1)
    image = Image.fromarray(out.round().clip(0, 255).astype(np.uint8), 'RGBA')
    image.save(car / 'right.avif', 'AVIF', quality=90, subsampling='4:4:4', speed=4)
    small = image.convert('RGBa').resize((image.width // 2, round(image.height / 2)), Image.LANCZOS)
    small.convert('RGBA').save(car / 'right-720.avif', 'AVIF', quality=90, subsampling='4:4:4', speed=4)
    print(f'roof band: {int(band.sum())} px replaced')


if __name__ == '__main__':
    main(sys.argv[1])
