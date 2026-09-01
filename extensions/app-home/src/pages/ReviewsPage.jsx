import {useState, useEffect} from 'preact/hooks';
import {getAdminReviews} from '../api/admin.js';
import {formatRelativeTime, fetchShopDomain} from '../utils/format.js';

const RATINGS = [null, 5, 4, 3, 2, 1]; // null = All

const SORT_OPTIONS = [
  {value: 'recent', label: 'Most recent'},
  {value: 'highest', label: 'Highest rated'},
  {value: 'lowest', label: 'Lowest rated'},
];

function buildStars(rating) {
  return '★'.repeat(rating) + '☆'.repeat(5 - rating);
}

export default function ReviewsPage() {
  const [shopDomain, setShopDomain] = useState('');
  const [reviews, setReviews] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [activeRating, setActiveRating] = useState(null);
  const [sort, setSort] = useState('recent');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchReviews = async (domain, opts) => {
    setLoading(true);
    try {
      const result = await getAdminReviews(domain, opts);
      setReviews(result.reviews ?? []);
      setTotal(result.total ?? 0);
      setTotalPages(result.totalPages ?? 1);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    (async () => {
      shopify.loading(true);
      const domain = await fetchShopDomain();
      setShopDomain(domain);
      await fetchReviews(domain, {page: 1, limit: 20, sort: 'recent'});
      shopify.loading(false);
    })();
  }, []);

  const applyFilters = (newPage = 1) => {
    setPage(newPage);
    fetchReviews(shopDomain, {
      page: newPage,
      limit: 20,
      sort,
      rating: activeRating ?? undefined,
      search: search || undefined,
    });
  };

  return (
    <s-page heading="Reviews">
      <s-section heading="Filters">
        <s-stack direction="inline" gap="small" alignItems="center">
          {RATINGS.map((r) => (
            <s-button
              key={r ?? 'all'}
              variant={activeRating === r ? 'primary' : 'secondary'}
              onClick={() => {
                setActiveRating(r);
                applyFilters();
              }}
            >
              {r === null ? 'All' : `${r}★`}
            </s-button>
          ))}
        </s-stack>
        <s-select
          label="Sort"
          labelAccessibilityVisibility="visible"
          value={sort}
          onChange={(e) => {
            setSort(e.target.value);
            applyFilters();
          }}
        >
          {SORT_OPTIONS.map((option) => (
            <s-option key={option.value} value={option.value}>
              {option.label}
            </s-option>
          ))}
        </s-select>
      </s-section>

      {loading && (
        <s-section>
          <s-paragraph>Loading...</s-paragraph>
        </s-section>
      )}

      {!loading && reviews.length === 0 && (
        <s-section>
          <s-banner tone="info" heading="No reviews found">
            Try adjusting your filters.
          </s-banner>
        </s-section>
      )}

      {!loading && reviews.length > 0 && (
        <s-section heading="Reviews">
          <s-stack direction="block" gap="base">
            {reviews.map((r) => (
              <s-stack key={r.id} direction="block" gap="small-200">
                <s-stack direction="inline" gap="small" alignItems="center">
                  <s-paragraph>{buildStars(r.rating)}</s-paragraph>
                  <s-paragraph>{r.reviewerName ?? 'Anonymous'}</s-paragraph>
                  <s-paragraph>{formatRelativeTime(r.createdAt)}</s-paragraph>
                </s-stack>
                <s-paragraph>{r.body ?? ''}</s-paragraph>
              </s-stack>
            ))}
          </s-stack>
        </s-section>
      )}

      <s-section>
        <s-stack direction="inline" gap="base" alignItems="center">
          <s-button onClick={() => applyFilters(page - 1)} disabled={page <= 1}>
            ← Previous
          </s-button>
          <s-paragraph>
            Page {page} of {totalPages}
          </s-paragraph>
          <s-button onClick={() => applyFilters(page + 1)} disabled={page >= totalPages}>
            Next →
          </s-button>
        </s-stack>
      </s-section>
    </s-page>
  );
}
