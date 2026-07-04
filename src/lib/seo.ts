// Canonical domain, live since 2026-07-04 (https://50fivestargels.pages.dev remains as the Pages URL).
export const SITE_URL = 'https://50fivestargels.com';
export const siteName = '50FiveStarGels';
export const defaultDescription =
  'Compare gels by cost per gram of carbohydrate and calculate your own DIY race mix for marathon, half marathon, HYROX and long training.';

export function absoluteUrl(path = '/') {
  return new URL(path, SITE_URL).toString();
}

export function canonicalUrl(path: string) {
  const cleanPath = path.endsWith('/') ? path : `${path}/`;
  return absoluteUrl(cleanPath);
}

export function imageUrl(path?: string) {
  if (!path) return absoluteUrl('/images/social/default-og.png');
  if (path.startsWith('http')) return path;
  return absoluteUrl(path);
}

export function websiteJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': absoluteUrl('/#website'),
    name: siteName,
    url: SITE_URL,
    description: defaultDescription,
    inLanguage: 'en',
    publisher: { '@id': absoluteUrl('/#organization') },
  };
}

export function publisherJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': absoluteUrl('/#organization'),
    name: siteName,
    url: SITE_URL,
    logo: absoluteUrl('/favicon.svg'),
    description: defaultDescription,
  };
}

export function webPageJsonLd({
  title,
  description,
  path,
  type = 'WebPage',
}: {
  title: string;
  description: string;
  path: string;
  type?: 'WebPage' | 'CollectionPage' | 'AboutPage';
}) {
  const url = canonicalUrl(path);
  return {
    '@context': 'https://schema.org',
    '@type': type,
    '@id': `${url}#webpage`,
    name: title,
    description,
    url,
    isPartOf: { '@id': absoluteUrl('/#website') },
    publisher: { '@id': absoluteUrl('/#organization') },
    inLanguage: 'en',
  };
}

export function webApplicationJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'Race Fuel Cost Calculator',
    url: canonicalUrl('/running-gel-cost-calculator/'),
    applicationCategory: 'HealthApplication',
    operatingSystem: 'Web',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'EUR' },
    description:
      'A free calculator that compares DIY carbohydrate race mixes with commercial gels by cost per gram of carbohydrate.',
  };
}
