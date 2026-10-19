// mountScenes() injects the illustrated art into the page's stages.
import { mountScenes } from '../src/scenes/mount';

afterEach(() => {
  document.body.innerHTML = '';
});

describe('mountScenes', () => {
  it('injects the coverage art into the coverage stage only', () => {
    document.body.innerHTML = `
      <section class="scene"><div class="scene__stage" data-stage></div></section>
      <section id="coverage"><div data-stage></div></section>`;

    mountScenes(document);

    const svg = document.querySelector('#coverage [data-stage] > svg');
    expect(svg).not.toBeNull();
    expect(svg!.getAttribute('viewBox')).toBe('0 0 480 360');
    // Decorative: the readable labels are HTML elements placed over it, so the SVG has no text.
    expect(svg!.getAttribute('aria-hidden')).toBe('true');
    expect(svg!.querySelector('text')).toBeNull();
    expect(document.querySelector('.scene [data-stage]')!.childElementCount).toBe(0);
  });

  it('parks one van in the hero stage, once', () => {
    document.body.innerHTML = '<section id="hero"><div data-stage></div></section>';

    mountScenes(document);
    mountScenes(document);

    const vans = document.querySelectorAll('#hero [data-stage] > svg.van');
    expect(vans).toHaveLength(1);
    expect(vans[0].getAttribute('data-van')).toBe('hero');
    expect(document.getElementById('van-wheel-front-hero')).not.toBeNull();
  });

  it('does nothing on a page without a coverage stage', () => {
    document.body.innerHTML = '<p>hello</p>';
    expect(() => mountScenes(document)).not.toThrow();
    expect(document.body.innerHTML).toBe('<p>hello</p>');
  });

  it('is idempotent', () => {
    document.body.innerHTML = '<section id="coverage"><div data-stage></div></section>';
    mountScenes(document);
    mountScenes(document);
    expect(document.querySelectorAll('#coverage svg')).toHaveLength(1);
  });
});
