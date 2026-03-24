import axios from "axios";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { Haiku } from "../lib/api";
import { haikusApi } from "../lib/api";
import { useState } from "react";

interface HaikuCardProps {
  haiku: Haiku;
}

export default function HaikuCard({ haiku }: HaikuCardProps) {
  const queryClient = useQueryClient();
  const [hasVoted, setHasVoted] = useState(false);

  const voteMutation = useMutation({
    mutationFn: () => haikusApi.vote(haiku.id),
    onSuccess: () => {
      setHasVoted(true);
      // Invalidate queries to refresh the data
      queryClient.invalidateQueries({ queryKey: ["httpCode"] });
      queryClient.invalidateQueries({ queryKey: ["httpCodes"] });
    },
    onError: (error: unknown) => {
      const message =
        axios.isAxiosError(error) && error.response?.data?.error
          ? error.response.data.error
          : "Failed to vote. Please try again.";
      alert(message);
    },
  });

  return (
    <div className="haiku-card">
      <pre className="haiku-content">{haiku.content}</pre>
      <div className="haiku-footer">
        <span className="author">— {haiku.author_name}</span>
        <button
          className={`vote-button ${hasVoted ? "voted" : ""}`}
          onClick={() => voteMutation.mutate()}
          disabled={voteMutation.isPending || hasVoted}
        >
          ❤️ {haiku.vote_count}
        </button>
      </div>
    </div>
  );
}
