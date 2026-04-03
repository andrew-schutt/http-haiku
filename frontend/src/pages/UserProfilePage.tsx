import { useQuery } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import { usersApi } from '../lib/api';
import Layout from '../components/Layout';

export default function UserProfilePage() {
  const { username } = useParams<{ username: string }>();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['userProfile', username],
    queryFn: () => usersApi.getProfile(username!),
    enabled: !!username,
    retry: false,
  });

  const memberSince = data
    ? new Date(data.user.created_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
      })
    : null;

  return (
    <Layout>
      <div className="container">
        <div className="profile-page">
          <Link to="/" className="back-link">
            ← Back to all codes
          </Link>

          {isLoading && <div className="loading">Loading profile…</div>}

          {isError && <div className="error">Poet not found.</div>}

          {data && (
            <>
              <div className="profile-header">
                <h1 className="profile-username">{data.user.username}</h1>
                <div className="profile-stats">
                  <span className="profile-stat">
                    <strong>{data.haikus.length}</strong>{' '}
                    {data.haikus.length === 1 ? 'haiku' : 'haikus'}
                  </span>
                  <span className="profile-stat-divider">·</span>
                  <span className="profile-stat">
                    <strong>{data.total_votes}</strong> {data.total_votes === 1 ? 'vote' : 'votes'}
                  </span>
                  <span className="profile-stat-divider">·</span>
                  <span className="profile-stat">Member since {memberSince}</span>
                </div>
              </div>

              {data.haikus.length === 0 ? (
                <div className="empty-state">No haikus submitted yet.</div>
              ) : (
                <div className="profile-haiku-list">
                  {data.haikus.map((haiku) => (
                    <div key={haiku.id} className="profile-haiku-card">
                      <Link to={`/code/${haiku.http_code.code}`} className="profile-haiku-code">
                        {haiku.http_code.code} {haiku.http_code.description}
                      </Link>
                      <pre className="haiku-content">{haiku.content}</pre>
                      <div className="profile-haiku-meta">
                        <span className="profile-haiku-votes">❤️ {haiku.vote_count}</span>
                        <span className="profile-haiku-date">
                          {new Date(haiku.created_at).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </Layout>
  );
}
