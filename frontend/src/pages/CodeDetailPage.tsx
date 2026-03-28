import { useQuery } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import { httpCodesApi } from '../lib/api';
import Layout from '../components/Layout';
import HaikuList from '../components/HaikuList';
import HaikuForm from '../components/HaikuForm';

export default function CodeDetailPage() {
  const { code } = useParams<{ code: string }>();
  const codeNumber = parseInt(code || '0', 10);

  const {
    data: httpCode,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['httpCode', codeNumber],
    queryFn: () => httpCodesApi.getByCode(codeNumber),
    enabled: !!codeNumber,
  });

  if (isLoading) {
    return (
      <Layout>
        <div className="loading">Loading haikus...</div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="error">
          <h2>HTTP code not found</h2>
          <Link to="/" className="back-link">
            ← Back to all codes
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="code-detail-page">
        <div className="page-header">
          <Link to="/" className="back-link">
            ← Back to all codes
          </Link>
          <div className="code-info">
            <h1>
              <span className="code-number">{httpCode?.code}</span>
              <span className="code-description">{httpCode?.description}</span>
            </h1>
            <span className="category-badge">{httpCode?.category.replace('_', ' ')}</span>
          </div>
        </div>

        <div className="content-grid">
          <div className="haikus-section">
            <h2>Top Haikus</h2>
            {httpCode && <HaikuList haikus={httpCode.haikus} code={codeNumber} />}
          </div>

          <div className="form-section">{codeNumber && <HaikuForm httpCode={codeNumber} />}</div>
        </div>
      </div>
    </Layout>
  );
}
