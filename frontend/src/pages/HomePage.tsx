import { useQuery } from '@tanstack/react-query';
import type { HttpCode } from '../lib/api';
import { httpCodesApi, haikusApi } from '../lib/api';
import HttpCodeCard from '../components/HttpCodeCard';
import DailyHaikuBanner from '../components/DailyHaikuBanner';
import Layout from '../components/Layout';

export default function HomePage() {
  const {
    data: httpCodes,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['httpCodes'],
    queryFn: httpCodesApi.getAll,
  });

  const { data: dailyHaiku } = useQuery({
    queryKey: ['dailyHaiku'],
    queryFn: haikusApi.getDaily,
    retry: false,
  });

  if (isLoading) {
    return (
      <Layout>
        <div className="loading">Loading HTTP codes...</div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="error">Failed to load HTTP codes. Please try again.</div>
      </Layout>
    );
  }

  // Group codes by category
  const groupedCodes = httpCodes?.reduce(
    (acc, code) => {
      if (!acc[code.category]) {
        acc[code.category] = [];
      }
      acc[code.category].push(code);
      return acc;
    },
    {} as Record<string, HttpCode[]>
  );

  const categoryTitles: Record<string, string> = {
    informational: '1xx Informational',
    success: '2xx Success',
    redirection: '3xx Redirection',
    client_error: '4xx Client Error',
    server_error: '5xx Server Error',
  };

  const categoryOrder = ['informational', 'success', 'redirection', 'client_error', 'server_error'];

  return (
    <Layout>
      <div className="home-page">
        {dailyHaiku && <DailyHaikuBanner haiku={dailyHaiku} />}
        <div className="intro">
          <p className="tagline">
            Explore HTTP status codes through the art of haiku. Vote for your favorites or submit
            your own!
          </p>
        </div>

        {categoryOrder.map((category) => {
          const codes = groupedCodes?.[category];
          if (!codes || codes.length === 0) return null;

          return (
            <section key={category} className="category-section">
              <h2 className="category-title">{categoryTitles[category]}</h2>
              <div className="http-codes-grid">
                {codes.map((code) => (
                  <HttpCodeCard key={code.id} httpCode={code} />
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </Layout>
  );
}
