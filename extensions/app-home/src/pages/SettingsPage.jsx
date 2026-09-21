import {useState, useEffect} from 'preact/hooks';
import {
  getOnboardingStatus,
  connectJudgeMe,
  disconnectJudgeMe,
  forceSync,
} from '../api/onboarding';
import {updateSyncInterval} from '../api/admin';
import {upgradeToPro} from '../api/billing';
import {formatRelativeTime, fetchShopDomain} from '../utils/format';

const BILLING_BANNERS = {
  success: {tone: 'success', heading: "You're on Pro", message: 'Carousel and List layouts are now unlocked.'},
  cancelled: {tone: 'warning', heading: 'Upgrade cancelled', message: "You're still on the Free plan."},
  error: {tone: 'critical', heading: "Couldn't confirm upgrade", message: 'Please try again from Settings.'},
};

const SYNC_INTERVAL_OPTIONS = [
  {value: '60', label: 'Every hour'},
  {value: '360', label: 'Every 6 hours'},
  {value: '1440', label: 'Every 24 hours'},
];

export default function SettingsPage() {
  const [phase, setPhase] = useState('loading'); // loading | not_connected | connected
  const [shopDomain, setShopDomain] = useState('');
  const [status, setStatus] = useState(null);
  const [apiToken, setApiToken] = useState('');
  const [showToken, setShowToken] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [connectError, setConnectError] = useState(null);
  const [syncing, setSyncing] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [syncInterval, setSyncInterval] = useState('60');
  const [savingInterval, setSavingInterval] = useState(false);
  const [intervalSaved, setIntervalSaved] = useState(false);
  const [upgrading, setUpgrading] = useState(false);
  const [upgradeError, setUpgradeError] = useState(null);
  const [billingBanner] = useState(
    () => BILLING_BANNERS[new URLSearchParams(window.location.search).get('billing')] ?? null
  );

  const loadStatus = async (domain) => {
    const result = await getOnboardingStatus(domain);
    setStatus(result);
    setPhase(result.connected ? 'connected' : 'not_connected');
    if (result.syncInterval) setSyncInterval(String(result.syncInterval));
  };

  useEffect(() => {
    (async () => {
      shopify.loading(true);
      const domain = await fetchShopDomain();
      setShopDomain(domain);
      try {
        await loadStatus(domain);
      } catch (_) {
        setPhase('not_connected');
      }
      shopify.loading(false);
    })();
  }, []);

  const handleConnect = async () => {
    if (!apiToken || !shopDomain) return;
    setConnecting(true);
    setConnectError(null);
    try {
      await connectJudgeMe(shopDomain, apiToken);
      setApiToken('');
      await loadStatus(shopDomain);
    } catch (err) {
      setConnectError(err.message || 'Could not connect to Judge.me');
    } finally {
      setConnecting(false);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      await forceSync(shopDomain);
      await loadStatus(shopDomain);
    } finally {
      setSyncing(false);
    }
  };

  const handleDisconnect = async () => {
    setDisconnecting(true);
    try {
      await disconnectJudgeMe(shopDomain);
      setStatus(null);
      setPhase('not_connected');
    } finally {
      setDisconnecting(false);
    }
  };

  const handleSaveInterval = async () => {
    setSavingInterval(true);
    setIntervalSaved(false);
    try {
      await updateSyncInterval(shopDomain, Number(syncInterval));
      await loadStatus(shopDomain);
      setIntervalSaved(true);
    } finally {
      setSavingInterval(false);
    }
  };

  const handleUpgrade = async () => {
    setUpgrading(true);
    setUpgradeError(null);
    try {
      const data = await upgradeToPro();
      if (data.confirmationUrl) {
        // Full-page navigation out of the iframe to Shopify's billing
        // confirmation screen — it redirects back via returnUrl once the
        // merchant approves or declines.
        window.open(data.confirmationUrl, '_top');
      } else {
        throw new Error('No confirmation URL returned');
      }
    } catch (err) {
      setUpgradeError(err.message || 'Could not start the upgrade');
      setUpgrading(false);
    }
  };

  if (phase === 'loading') {
    return (
      <s-page heading="Settings">
        <s-section>
          <s-paragraph>Loading...</s-paragraph>
        </s-section>
      </s-page>
    );
  }

  const plan = status?.plan === 'pro' ? 'pro' : 'free';

  return (
    <s-page heading="Settings">
      {billingBanner && (
        <s-banner tone={billingBanner.tone} heading={billingBanner.heading}>
          {billingBanner.message}
        </s-banner>
      )}
      {phase === 'connected' && status ? (
        <s-section heading="Judge.me integration">
          <s-stack direction="inline" gap="small" alignItems="center">
            <s-badge tone="success">Connected</s-badge>
            <s-badge tone={plan === 'pro' ? 'success' : 'neutral'}>
              {plan === 'pro' ? 'Pro plan' : 'Free plan'}
            </s-badge>
          </s-stack>
          <s-paragraph>
            {status.reviewCount} review{status.reviewCount === 1 ? '' : 's'} synced · Last sync:{' '}
            {formatRelativeTime(status.lastSyncedAt)}
          </s-paragraph>
          <s-stack direction="inline" gap="small">
            <s-button onClick={handleSync} loading={syncing} disabled={disconnecting}>
              {syncing ? 'Syncing...' : 'Force sync now'}
            </s-button>
            <s-button
              tone="critical"
              onClick={handleDisconnect}
              loading={disconnecting}
              disabled={syncing}
            >
              Disconnect
            </s-button>
          </s-stack>
        </s-section>
      ) : (
        <s-section heading="Connect Judge.me">
          <s-text-field
            label="Private API Token"
            labelAccessibilityVisibility="visible"
            placeholder="Paste your Judge.me Private API Token"
            value={apiToken}
            onInput={(e) => setApiToken(e.target.value)}
            required
          />
          <s-text-field
            label="Shop domain"
            labelAccessibilityVisibility="visible"
            value={shopDomain}
            disabled
          />
          <s-paragraph>
            Find your token in Judge.me → Settings → Integrations → View API tokens
          </s-paragraph>
          <s-button variant="primary" onClick={handleConnect} loading={connecting} disabled={!apiToken}>
            Connect Judge.me
          </s-button>
          {connectError && (
            <s-banner tone="critical" heading="Couldn't connect to Judge.me">
              {connectError}
            </s-banner>
          )}
        </s-section>
      )}

      {phase === 'connected' && status && (
        <s-section heading="Auto-sync interval">
          <s-select
            label="Auto-sync interval"
            labelAccessibilityVisibility="visible"
            value={syncInterval}
            onChange={(e) => {
              setSyncInterval(e.target.value);
              setIntervalSaved(false);
            }}
          >
            {SYNC_INTERVAL_OPTIONS.map((option) => (
              <s-option key={option.value} value={option.value}>
                {option.label}
              </s-option>
            ))}
          </s-select>
          <s-button onClick={handleSaveInterval} loading={savingInterval}>
            Save
          </s-button>
          <s-paragraph>
            Current interval:{' '}
            {SYNC_INTERVAL_OPTIONS.find((o) => o.value === String(status.syncInterval ?? 60))?.label ??
              'Every hour'}
            {intervalSaved && ' · Saved'}
          </s-paragraph>
        </s-section>
      )}

      {plan === 'free' ? (
        <s-section heading="Your plan">
          <s-badge tone="neutral">Free plan</s-badge>
          <s-paragraph>Included in Free: Grid layout, basic customization, sync up to 100 reviews.</s-paragraph>
          <s-paragraph>
            Upgrade to Pro for $11.99/month to unlock Carousel and List layouts, unlimited reviews, and
            priority support. Includes a 7-day free trial.
          </s-paragraph>
          <s-button variant="primary" onClick={handleUpgrade} loading={upgrading}>
            Upgrade to Pro — $11.99/month
          </s-button>
          {upgradeError && (
            <s-banner tone="critical" heading="Couldn't start upgrade">
              {upgradeError}
            </s-banner>
          )}
        </s-section>
      ) : (
        <s-section heading="Your plan">
          <s-badge tone="success">Pro plan</s-badge>
          <s-paragraph>You have access to all FlexReviews features.</s-paragraph>
        </s-section>
      )}
    </s-page>
  );
}
