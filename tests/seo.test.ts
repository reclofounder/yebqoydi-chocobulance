// What search engines get: the copy written into the HTML, the structured data, robots and sitemap.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import uz from '../src/i18n/uz.json';
import { t } from '../src/i18n';
import { PHONE, PRICE } from '../src/config';
import { prerenderCopy, seoFiles } from '../vite.config';

const html = readFileSync(resolve(process.cwd(), 'index.html'), 'utf8');

/** index.html as the build writes it (just the copy step). */
function prerendered(): Document {
  const plugin = prerenderCopy();
  const hook = plugin.transformIndexHtml as { handler: (html: string) => string };
  return new DOMParser().parseFromString(hook.handler(html), 'text/html');
}

describe('the copy in the HTML', () => {
  it('fills every data-i18n element with its Uzbek text, for crawlers that run no script', () => {
    const doc = prerendered();
    const slots = [...doc.querySelectorAll<HTMLElement>('body [data-i18n]')];
    expect(slots.length).toBeGreaterThanOrEqual(20);
    for (const el of slots) {
      expect(el.textContent, el.dataset.i18n).toBe(t(el.dataset.i18n!, 'uz'));
    }
    // The question itself, word for word, in the h1.
    expect(doc.querySelector('h1 .visually-hidden')!.textContent).toBe(uz['hero.title']);
  });

  it('fills the labels of the controls too', () => {
    const doc = prerendered();
    for (const el of doc.querySelectorAll<HTMLElement>('[data-i18n-attr]')) {
      for (const pair of el.dataset.i18nAttr!.split(',')) {
        const [attr, key] = pair.split(':').map((part) => part.trim());
        expect(el.getAttribute(attr), `${attr} of ${el.className}`).toBe(t(key, 'uz'));
      }
    }
  });
});

describe('structured data', () => {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const data = JSON.parse(doc.querySelector('script[type="application/ld+json"]')!.textContent!);
  const node = (type: string) =>
    data['@graph'].find((n: { '@type': string }) => n['@type'] === type);

  it('names the site under every way people type it', () => {
    const site = node('WebSite');
    expect(site.name).toBe('yebqoydi.uz');
    expect(site.alternateName).toEqual(
      expect.arrayContaining(['Yebqoʻydi.uz', "Yebqo'ydi.uz", 'Yebqoydi', 'Chocobulance']),
    );
  });

  it('describes the service with the same phone and price as the page', () => {
    const service = node('Service');
    expect(service.availableChannel.servicePhone.telephone).toBe(PHONE);
    expect(service.offers.price).toBe(PRICE.replace(/\D/g, ''));
    expect(service.offers.priceCurrency).toBe('UZS');
    expect(service.areaServed.name).toBe('Toshkent');
  });
});

describe('robots.txt and sitemap.xml', () => {
  /** The files the build emits, for this site origin. */
  function emitted(origin: string): Record<string, string> {
    const plugin = seoFiles();
    (plugin.configResolved as (config: { env: Record<string, string> }) => void)({
      env: { VITE_SITE_URL: origin },
    });
    const files: Record<string, string> = {};
    (plugin.generateBundle as (this: unknown) => void).call({
      emitFile: (file: { fileName: string; source: string }) => {
        files[file.fileName] = file.source;
      },
    });
    return files;
  }

  it('lists both language pages with their alternates, and points robots at the sitemap', () => {
    const files = emitted('https://yebqoydi.uz/');
    expect(files['robots.txt']).toBe(
      'User-agent: *\nAllow: /\n\nSitemap: https://yebqoydi.uz/sitemap.xml\n',
    );
    const xml = new DOMParser().parseFromString(files['sitemap.xml'], 'application/xml');
    expect([...xml.querySelectorAll('loc')].map((l) => l.textContent)).toEqual([
      'https://yebqoydi.uz/',
      'https://yebqoydi.uz/?lang=ru',
    ]);
    expect(xml.getElementsByTagName('xhtml:link')).toHaveLength(6);
  });

  it('writes no sitemap without a site origin (it needs absolute addresses)', () => {
    const files = emitted('');
    expect(Object.keys(files)).toEqual(['robots.txt']);
    expect(files['robots.txt']).not.toMatch(/Sitemap/);
  });
});

describe('one address for the site', () => {
  it('sends the vercel.app address to yebqoydi.uz, page for page', () => {
    const config = JSON.parse(readFileSync(resolve(process.cwd(), 'vercel.json'), 'utf8'));
    // The root needs its own rule: Vercel's /:path* does not match it.
    const host = [{ type: 'host', value: 'chocobulance-omega.vercel.app' }];
    expect(config.redirects).toEqual([
      { source: '/', has: host, destination: 'https://yebqoydi.uz/', permanent: true },
      {
        source: '/:path+',
        has: host,
        destination: 'https://yebqoydi.uz/:path+',
        permanent: true,
      },
    ]);
  });
});
