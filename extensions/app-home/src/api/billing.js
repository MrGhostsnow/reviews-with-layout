import {apiRequest} from './client';

export function upgradeToPro() {
  return apiRequest('/api/billing/upgrade');
}
