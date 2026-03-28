import type { Haiku } from "../lib/api";
import HaikuCard from "./HaikuCard";

interface HaikuListProps {
  haikus: Haiku[];
  code: number;
}

export default function HaikuList({ haikus, code }: HaikuListProps) {
  if (haikus.length === 0) {
    return (
      <div className="empty-state">
        <p>No haikus yet. Be the first to write one!</p>
      </div>
    );
  }

  return (
    <div className="haiku-list">
      {haikus.map((haiku) => (
        <HaikuCard key={haiku.id} haiku={haiku} code={code} />
      ))}
    </div>
  );
}
