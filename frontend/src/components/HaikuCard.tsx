import axios from 'axios';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import type { Haiku } from '../lib/api';
import { haikusApi } from '../lib/api';
import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';

interface HaikuCardProps {
  haiku: Haiku;
  code: number;
}

export default function HaikuCard({ haiku, code }: HaikuCardProps) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [hasVoted, setHasVoted] = useState(haiku.has_voted ?? false);
  const [hasCopied, setHasCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(haiku.content);
  const [editError, setEditError] = useState<string | null>(null);

  const isOwner = user?.id === haiku.user_id;

  const handleCopy = () => {
    navigator.clipboard.writeText(`${window.location.origin}/code/${code}?haiku=${haiku.id}`);
    setHasCopied(true);
    setTimeout(() => setHasCopied(false), 2000);
  };

  const voteMutation = useMutation({
    mutationFn: () => haikusApi.vote(haiku.id),
    onSuccess: () => {
      setHasVoted(true);
      queryClient.invalidateQueries({ queryKey: ['httpCode'] });
      queryClient.invalidateQueries({ queryKey: ['httpCodes'] });
    },
    onError: (error: unknown) => {
      const message =
        axios.isAxiosError(error) && error.response?.data?.error
          ? error.response.data.error
          : 'Failed to vote. Please try again.';
      alert(message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: () => haikusApi.update(haiku.id, editContent),
    onSuccess: () => {
      setIsEditing(false);
      queryClient.invalidateQueries({ queryKey: ['httpCode'] });
      queryClient.invalidateQueries({ queryKey: ['httpCodes'] });
    },
    onError: (error: unknown) => {
      const message =
        axios.isAxiosError(error) && error.response?.data?.errors
          ? (error.response.data.errors as string[]).join(', ')
          : 'Failed to update haiku. Please try again.';
      setEditError(message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => haikusApi.destroy(haiku.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['httpCode'] });
      queryClient.invalidateQueries({ queryKey: ['httpCodes'] });
    },
    onError: (error: unknown) => {
      const message =
        axios.isAxiosError(error) && error.response?.data?.error
          ? error.response.data.error
          : 'Failed to delete haiku. Please try again.';
      alert(message);
    },
  });

  const handleSave = () => {
    const lines = editContent.split('\n');
    if (lines.length !== 3) {
      setEditError('Content must have exactly 3 lines');
      return;
    }
    setEditError(null);
    updateMutation.mutate();
  };

  const handleDelete = () => {
    if (window.confirm('Delete this haiku?')) {
      deleteMutation.mutate();
    }
  };

  if (isEditing) {
    return (
      <div className="haiku-card">
        {editError && <div className="error-message">{editError}</div>}
        <textarea
          className="haiku-edit-textarea"
          value={editContent}
          onChange={(e) => setEditContent(e.target.value)}
          rows={3}
        />
        <div className="haiku-edit-actions">
          <button
            className="haiku-save-button"
            onClick={handleSave}
            disabled={updateMutation.isPending}
          >
            Save
          </button>
          <button
            className="haiku-cancel-button"
            onClick={() => {
              setIsEditing(false);
              setEditContent(haiku.content);
              setEditError(null);
            }}
            disabled={updateMutation.isPending}
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="haiku-card">
      <pre className="haiku-content">{haiku.content}</pre>
      <div className="haiku-footer">
        <Link to={`/user/${haiku.author_name}`} className="author author-link">
          — {haiku.author_name}
        </Link>
        <button
          className={`vote-button ${hasVoted ? 'voted' : ''}`}
          onClick={() => voteMutation.mutate()}
          disabled={voteMutation.isPending || hasVoted}
        >
          ❤️ {haiku.vote_count}
        </button>
        <button className={`copy-button ${hasCopied ? 'copied' : ''}`} onClick={handleCopy}>
          {hasCopied ? 'Copied!' : 'Copy link'}
        </button>
        {isOwner && (
          <div className="haiku-actions">
            <button className="haiku-edit-button" onClick={() => setIsEditing(true)}>
              Edit
            </button>
            <button
              className="haiku-delete-button"
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
            >
              Delete
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
