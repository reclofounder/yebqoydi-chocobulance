import coverageSvg from './coverage.svg?raw';

/**
 * Injects the illustrated art into the page's stages. Tolerates a page without a given stage
 * (tests, partial DOMs) and can safely run more than once.
 */
export function mountScenes(root: ParentNode): void {
  const coverage = root.querySelector('#coverage [data-stage]');
  if (coverage) coverage.innerHTML = coverageSvg;
}
