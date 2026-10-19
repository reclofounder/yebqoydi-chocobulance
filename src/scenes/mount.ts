import heroSvg from './hero-bg.svg?raw';
import kitchenSvg from './kitchen.svg?raw';
import callSvg from './call.svg?raw';
import roadSkySvg from './road-sky.svg?raw';
import roadFarSvg from './road-far.svg?raw';
import roadMidSvg from './road-mid.svg?raw';
import roadNearSvg from './road-near.svg?raw';
import doorSvg from './door.svg?raw';
import coverageSvg from './coverage.svg?raw';
import { mountVan } from '../van/van';

/** Each stage's drawings, back to front, and the van that drives over them (its `mountVan` id). */
const STAGES: ReadonlyArray<{ stage: string; art: readonly string[]; van?: string }> = [
  { stage: '#hero [data-stage]', art: [heroSvg], van: 'hero' },
  { stage: '#scene-kitchen [data-stage]', art: [kitchenSvg] },
  { stage: '#scene-call [data-stage]', art: [callSvg] },
  {
    stage: '#scene-road [data-stage]',
    art: [roadSkySvg, roadFarSvg, roadMidSvg, roadNearSvg],
    van: 'road',
  },
  { stage: '#scene-door [data-stage]', art: [doorSvg] },
  { stage: '#coverage [data-stage]', art: [coverageSvg] },
];

/**
 * Injects the illustrated art into the page's stages: the drawings first, then the van on top.
 * Tolerates a page without a given stage (tests, partial DOMs) and can safely run more than once:
 * the drawings are replaced, and a van already in its stage is kept (with any state on it).
 */
export function mountScenes(root: ParentNode): void {
  for (const { stage: selector, art, van } of STAGES) {
    const stage = root.querySelector(selector);
    if (!stage) continue;

    // Drop everything but a van (whitespace between drawings included), then lay the art under it.
    for (const node of [...stage.childNodes]) {
      if (!(node instanceof Element && node.hasAttribute('data-van'))) node.remove();
    }
    stage.insertAdjacentHTML('afterbegin', art.join(''));

    if (van && !stage.querySelector(`[data-van="${van}"]`)) mountVan(stage, { id: van });
  }
}
