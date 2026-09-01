import {apiRequest} from './client';

export function getOnboardingStatus(shopDomain) {
  return apiRequest(`/api/onboarding/status?shopDomain=${encodeURIComponent(shopDomain)}`);
}

export function connectJudgeMe(shopDomain, apiToken) {
  return apiRequest('/api/onboarding/connect', {
    method: 'POST',
    body: JSON.stringify({shopDomain, apiToken}),
  });
}

export function disconnectJudgeMe(shopDomain) {
  return apiRequest(`/api/onboarding/disconnect?shopDomain=${encodeURIComponent(shopDomain)}`, {
    method: 'POST',
  });
}

export function forceSync(shopDomain) {
  return apiRequest(`/api/sync?shopDomain=${encodeURIComponent(shopDomain)}`, {
    method: 'POST',
  });
}
