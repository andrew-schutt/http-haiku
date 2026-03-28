import { useState } from "react";
import { Link } from "react-router-dom";
import type { DailyHaiku } from "../lib/api";

export default function DailyHaikuBanner({ haiku }: { haiku: DailyHaiku }) {
  const [hasCopied, setHasCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(`${window.location.origin}/code/${haiku.http_code.code}`);
    setHasCopied(true);
    setTimeout(() => setHasCopied(false), 2000);
  };

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
        <button
          className={`copy-button ${hasCopied ? "copied" : ""}`}
          onClick={handleCopy}
        >
          {hasCopied ? "Copied!" : "Copy link"}
        </button>
      </div>
    </div>
  );
}
