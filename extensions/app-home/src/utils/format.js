export function formatRelativeTime(input) {
  if (!input) return 'never';

  const raw = input instanceof Date ? input.toISOString() : String(input);
  // Only append a 'Z' when the string has no timezone info at all. A string
  // that already ends in 'Z' or has an explicit offset (e.g. '+00:00') must
  // be left as-is — appending 'Z' on top of an offset produces an invalid
  // date string ('...+00:00Z'), which silently becomes NaN.
  const hasTimezone = /Z$|[+-]\d{2}:?\d{2}$/.test(raw);
  const normalized = hasTimezone ? raw.replace(' ', 'T') : `${raw.replace(' ', 'T')}Z`;
  const then = new Date(normalized);

  if (Number.isNaN(then.getTime())) return 'never';

  const diffMin = Math.round((Date.now() - then.getTime()) / 60000);

  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin} minute${diffMin === 1 ? '' : 's'} ago`;

  const diffHr = Math.round(diffMin / 60);
  if (diffHr < 24) return `${diffHr} hour${diffHr === 1 ? '' : 's'} ago`;

  const diffDay = Math.round(diffHr / 24);
  return `${diffDay} day${diffDay === 1 ? '' : 's'} ago`;
}

export function formatStars(rating) {
  const n = Math.round(rating) || 0;
  return '★'.repeat(n) + '☆'.repeat(Math.max(0, 5 - n));
}

export function fetchShopDomain() {
  return shopify.query(`#graphql
      query ShopDomain {
        shop { myshopifyDomain }
      }
    `)
    .then(({data}) => data?.shop?.myshopifyDomain ?? '')
    .catch(() => '');
}
