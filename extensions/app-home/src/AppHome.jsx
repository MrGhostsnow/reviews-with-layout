import {render} from 'preact';
import {LocationProvider, ErrorBoundary, Router, Route} from 'preact-iso';
import DashboardPage from './pages/DashboardPage.jsx';
import ReviewsPage from './pages/ReviewsPage.jsx';
import SettingsPage from './pages/SettingsPage.jsx';
import NotFoundPage from './pages/NotFoundPage.jsx';

export default async () => {
  render(<App />, document.body);
};

function App() {
  return (
    <LocationProvider>
      <s-app-nav>
        <s-link href="/">Dashboard</s-link>
        <s-link href="/reviews">Reviews</s-link>
        <s-link href="/settings">Settings</s-link>
      </s-app-nav>
      <ErrorBoundary>
        <Router>
          <Route path="/" component={DashboardPage} />
          <Route path="/reviews" component={ReviewsPage} />
          <Route path="/settings" component={SettingsPage} />
          <Route default component={NotFoundPage} />
        </Router>
      </ErrorBoundary>
    </LocationProvider>
  );
}
