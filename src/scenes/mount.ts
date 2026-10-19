import coverageSvg from './coverage.svg?raw';
import { mountVan } from '../van/van';

/**
 * Injects the illustrated art into the page's stages. Tolerates a page without a given stage
 * (tests, partial DOMs) and can safely run more than once.
 */
export function mountScenes(root: ParentNode): void {
  const coverage = root.querySelector('#coverage [data-stage]');
  if (coverage) coverage.innerHTML = coverageSvg;

  // The parked van; an occupied stage is left alone, so a second run adds nothing.
  const hero = root.querySelector('#hero [data-stage]');
  if (hero && hero.childElementCount === 0) mountVan(hero, { id: 'hero' });
}
