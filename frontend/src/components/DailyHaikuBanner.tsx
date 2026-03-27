import { Link } from "react-router-dom";
import type { DailyHaiku } from "../lib/api";

export default function DailyHaikuBanner({ haiku }: { haiku: DailyHaiku }) {
  return (
    <div className="daily-haiku-banner">
      <div className="daily-haiku-label">✨ Haiku of the Day</div>
      <Link to={`/code/${haiku.http_code.code}`} className="daily-haiku-code">
        HTTP {haiku.http_code.code} — {haiku.http_code.description}
      </Link>
      <pre className="haiku-content daily-haiku-content">{haiku.content}</pre>
      <div className="daily-haiku-meta">
        <span className="author">— {haiku.author_name}</span>
        <span className="votes">❤️ {haiku.vote_count}</span>
      </div>
    </div>
  );
}
