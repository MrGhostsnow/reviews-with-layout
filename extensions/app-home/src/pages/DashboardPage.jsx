import {useState, useEffect} from 'preact/hooks';
import {useLocation} from 'preact-iso';
import {getAdminStats, getAdminReviews} from '../api/admin.js';
import {getOnboardingStatus, forceSync} from '../api/onboarding.js';
import {formatRelativeTime, fetchShopDomain} from '../utils/format.js';

function buildStars(rating) {
  return '★'.repeat(rating) + '☆'.repeat(5 - rating);
}

export default function DashboardPage() {
  const {route} = useLocation();
  const [shopDomain, setShopDomain] = useState('');
  const [stats, setStats] = useState(null);
  const [recentReviews, setRecentReviews] = useState([]);
  const [connected, setConnected] = useState(null); // null = loading
  const [syncing, setSyncing] = useState(false);

  const load = async (domain) => {
    const status = await getOnboardingStatus(domain);
    setConnected(status.connected);
    if (status.connected) {
      const [s, r] = await Promise.all([
        getAdminStats(domain),
        getAdminReviews(domain, {page: 1, limit: 5, sort: 'recent'}),
      ]);
      setStats(s);
      setRecentReviews(r.reviews ?? []);
    }
  };

  useEffect(() => {
    (async () => {
      shopify.loading(true);
      const domain = await fetchShopDomain();
      setShopDomain(domain);
      try { await load(domain); } catch (_) { setConnected(false); }
      shopify.loading(false);
    })();
  }, []);

  const handleSync = async () => {
    setSyncing(true);
    try {
      await forceSync(shopDomain);
      await load(shopDomain);
    } finally {
      setSyncing(false);
    }
  };

  if (connected === null) {
    return (
      <s-page heading="Dashboard">
        <s-section>
          <s-paragraph>Loading...</s-paragraph>
        </s-section>
      </s-page>
    );
  }

  if (!connected) {
    return (
      <s-page heading="Dashboard">
        <s-section>
          <s-banner tone="info" heading="Connect your Judge.me account to get started">
            Sync your existing reviews and display them with full layout freedom.
          </s-banner>
          <s-stack direction="inline" gap="small">
            <s-button variant="primary" onClick={() => route('/settings')}>
              Connect Judge.me
            </s-button>
          </s-stack>
        </s-section>
      </s-page>
    );
  }

  const total = stats?.total ?? 0;
  const avg = stats?.averageRating ?? 0;
  const dist = stats?.distribution ?? {};

  return (
    <s-page heading="Dashboard">
      <s-section>
        <s-grid gridTemplateColumns="1fr 1fr" gap="base">
          <s-section>
            <s-stack direction="block" gap="small-200">
              <s-heading>Total reviews</s-heading>
              <s-heading>{total}</s-heading>
              <s-paragraph>Last sync: {formatRelativeTime(stats?.lastSyncedAt)}</s-paragraph>
            </s-stack>
          </s-section>
          <s-section>
            <s-stack direction="block" gap="small-200">
              <s-heading>Average rating</s-heading>
              <s-heading>{avg.toFixed(1)} / 5 ★</s-heading>
              <s-paragraph>across all reviews</s-paragraph>
            </s-stack>
          </s-section>
        </s-grid>
      </s-section>

      <s-section heading="Rating breakdown">
        <s-stack direction="block" gap="small-300">
          {[5, 4, 3, 2, 1].map((n) => {
            const count = dist[n] ?? 0;
            const pct = total > 0 ? Math.round((count / total) * 100) : 0;
            return (
              <s-stack key={n} direction="inline" gap="base" alignItems="center">
                <s-paragraph>{n} ★</s-paragraph>
                <s-paragraph>{count} ({pct}%)</s-paragraph>
              </s-stack>
            );
          })}
        </s-stack>
      </s-section>

      <s-section heading="Recent reviews">
        <s-stack direction="block" gap="base">
          {recentReviews.length === 0 && <s-paragraph>No reviews synced yet.</s-paragraph>}
          {recentReviews.map((r) => (
            <s-box key={r.id} padding="base" borderWidth="base" borderColor="base" borderRadius="base">
              <s-stack direction="block" gap="small-200">
                <s-paragraph>
                  {buildStars(r.rating)} — {r.reviewerName ?? 'Anonymous'}
                </s-paragraph>
                <s-paragraph>
                  {(r.body ?? '').slice(0, 150)}
                  {(r.body ?? '').length > 150 ? '...' : ''}
                </s-paragraph>
              </s-stack>
            </s-box>
          ))}
        </s-stack>
        <s-link
          href="/reviews"
          onClick={(e) => {
            e.preventDefault();
            route('/reviews');
          }}
        >
          View all reviews →
        </s-link>
      </s-section>

      <s-section>
        <s-stack direction="inline" gap="small" alignItems="center">
          <s-badge tone="success">Connected</s-badge>
          <s-badge tone={stats?.plan === 'pro' ? 'success' : 'neutral'}>
            {stats?.plan === 'pro' ? 'Pro plan' : 'Free plan'}
          </s-badge>
        </s-stack>
        <s-paragraph>
          {total} review{total === 1 ? '' : 's'} synced · Last sync: {formatRelativeTime(stats?.lastSyncedAt)}
        </s-paragraph>
        <s-stack direction="inline" gap="small">
          <s-button onClick={handleSync} loading={syncing}>
            {syncing ? 'Syncing...' : 'Force sync now'}
          </s-button>
        </s-stack>
      </s-section>
    </s-page>
  );
}
