import {apiRequest} from './client';

export function getAdminStats(shopDomain) {
  return apiRequest(`/api/admin/stats?shopDomain=${encodeURIComponent(shopDomain)}`);
}

export function getAdminReviews(shopDomain, {page, limit, rating, sort, search} = {}) {
  const params = new URLSearchParams({shopDomain});
  if (page) params.set('page', String(page));
  if (limit) params.set('limit', String(limit));
  if (rating) params.set('rating', String(rating));
  if (sort) params.set('sort', sort);
  if (search) params.set('search', search);

  return apiRequest(`/api/admin/reviews?${params.toString()}`);
}

export function updateSyncInterval(shopDomain, interval) {
  return apiRequest(`/api/admin/sync-interval?shopDomain=${encodeURIComponent(shopDomain)}`, {
    method: 'POST',
    body: JSON.stringify({interval}),
  });
}
