import { Link } from 'react-router-dom';
import type { HttpCode } from '../lib/api';

interface HttpCodeCardProps {
  httpCode: HttpCode;
}

export default function HttpCodeCard({ httpCode }: HttpCodeCardProps) {
  return (
    <Link to={`/code/${httpCode.code}`} className="http-code-card">
      <div className="code-header">
        <span className="code-number">{httpCode.code}</span>
        <span className="code-description">{httpCode.description}</span>
      </div>
      {httpCode.top_haiku ? (
        <div className="haiku-preview">
          <pre className="haiku-content">{httpCode.top_haiku.content}</pre>
          <div className="haiku-meta">
            <span className="author">— {httpCode.top_haiku.author_name}</span>
            <span className="votes">❤️ {httpCode.top_haiku.vote_count}</span>
          </div>
        </div>
      ) : (
        <div className="no-haiku">
          <p>No haikus yet. Be the first!</p>
        </div>
      )}
    </Link>
  );
}
