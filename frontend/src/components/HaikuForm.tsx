import axios from "axios";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { CreateHaikuRequest } from "../lib/api";
import { haikusApi } from "../lib/api";

interface HaikuFormProps {
  httpCode: number;
}

export default function HaikuForm({ httpCode }: HaikuFormProps) {
  const queryClient = useQueryClient();
  const [content, setContent] = useState("");
  const [authorName, setAuthorName] = useState("");
  const [error, setError] = useState<string | null>(null);

  const createMutation = useMutation({
    mutationFn: (data: CreateHaikuRequest) => haikusApi.create(data),
    onSuccess: () => {
      // Clear form
      setContent("");
      setAuthorName("");
      setError(null);
      // Invalidate queries to refresh the data
      queryClient.invalidateQueries({ queryKey: ["httpCode", httpCode] });
      queryClient.invalidateQueries({ queryKey: ["httpCodes"] });
    },
    onError: (error: unknown) => {
      if (axios.isAxiosError(error) && error.response?.data?.errors) {
        setError(error.response.data.errors.join(", "));
      } else {
        setError("Failed to submit haiku. Please try again.");
      }
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate 3 lines
    const lines = content.split("\n").filter((line) => line.trim() !== "");
    if (lines.length !== 3) {
      setError("Haiku must have exactly 3 lines");
      return;
    }

    createMutation.mutate({
      http_code: httpCode,
      content,
      author_name: authorName,
    });
  };

  return (
    <div className="haiku-form">
      <h2>Submit Your Haiku</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="content">
            Haiku (3 lines)
            <span className="hint">
              Press Enter between lines. Traditional format: 5-7-5 syllables
            </span>
          </label>
          <textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Status code speaks&#10;Silent errors in the night&#10;Response comes at dawn"
            rows={5}
            maxLength={200}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="authorName">
            Your Name (optional)
            <span className="hint">Leave blank to post as "Anonymous"</span>
          </label>
          <input
            type="text"
            id="authorName"
            value={authorName}
            onChange={(e) => setAuthorName(e.target.value)}
            placeholder="Anonymous"
            maxLength={50}
          />
        </div>
        {error && <div className="error-message">{error}</div>}
        <button type="submit" disabled={createMutation.isPending}>
          {createMutation.isPending ? "Submitting..." : "Submit Haiku"}
        </button>
      </form>
    </div>
  );
}
