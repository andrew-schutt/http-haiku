import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "../lib/api";
import { useAuth } from "../hooks/useAuth";
import Layout from "../components/Layout";

export default function AdminPage() {
  const { user, isLoggedIn, isLoading } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"haikus" | "users">("haikus");

  if (!isLoading && (!isLoggedIn || !user?.is_admin)) {
    navigate("/");
    return null;
  }

  return (
    <Layout>
      <div className="admin-page">
        <h2>Admin Dashboard</h2>
        <div className="admin-tabs">
          <button
            className={`admin-tab${activeTab === "haikus" ? " active" : ""}`}
            onClick={() => setActiveTab("haikus")}
          >
            Haikus
          </button>
          <button
            className={`admin-tab${activeTab === "users" ? " active" : ""}`}
            onClick={() => setActiveTab("users")}
          >
            Users
          </button>
        </div>
        {activeTab === "haikus" ? (
          <AdminHaikusTab currentUserId={user?.id} queryClient={queryClient} />
        ) : (
          <AdminUsersTab currentUserId={user?.id} queryClient={queryClient} />
        )}
      </div>
    </Layout>
  );
}

function AdminHaikusTab({ queryClient }: { currentUserId?: number; queryClient: ReturnType<typeof useQueryClient> }) {
  const { data: haikus, isLoading, error } = useQuery({
    queryKey: ["admin", "haikus"],
    queryFn: adminApi.getHaikus,
  });

  const deleteMutation = useMutation({
    mutationFn: adminApi.deleteHaiku,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "haikus"] });
    },
  });

  if (isLoading) return <div className="loading">Loading haikus...</div>;
  if (error) return <div className="error">Failed to load haikus.</div>;

  const handleDelete = (id: number, content: string) => {
    if (!window.confirm(`Delete haiku: "${content.slice(0, 50)}"?`)) return;
    deleteMutation.mutate(id);
  };

  return (
    <table className="admin-table">
      <thead>
        <tr>
          <th>Content</th>
          <th>Author</th>
          <th>HTTP Code</th>
          <th>Votes</th>
          <th>Created</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {haikus?.map((haiku) => (
          <tr key={haiku.id}>
            <td><pre style={{ margin: 0, fontFamily: "Georgia, serif", fontSize: "0.85rem" }}>{haiku.content}</pre></td>
            <td>{haiku.author_name}</td>
            <td>{haiku.http_code.code} {haiku.http_code.description}</td>
            <td>{haiku.vote_count}</td>
            <td>{new Date(haiku.created_at).toLocaleDateString()}</td>
            <td>
              <button
                className="admin-delete-btn"
                onClick={() => handleDelete(haiku.id, haiku.content)}
                disabled={deleteMutation.isPending}
              >
                Delete
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function AdminUsersTab({ currentUserId, queryClient }: { currentUserId?: number; queryClient: ReturnType<typeof useQueryClient> }) {
  const { data: users, isLoading, error } = useQuery({
    queryKey: ["admin", "users"],
    queryFn: adminApi.getUsers,
  });

  const deleteMutation = useMutation({
    mutationFn: adminApi.deleteUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
    },
  });

  if (isLoading) return <div className="loading">Loading users...</div>;
  if (error) return <div className="error">Failed to load users.</div>;

  const handleDelete = (id: number, username: string) => {
    if (!window.confirm(`Delete user "${username}"? This cannot be undone.`)) return;
    deleteMutation.mutate(id);
  };

  return (
    <table className="admin-table">
      <thead>
        <tr>
          <th>Username</th>
          <th>Email</th>
          <th>Admin</th>
          <th>Joined</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {users?.map((user) => (
          <tr key={user.id}>
            <td>{user.username}</td>
            <td>{user.email}</td>
            <td>{user.is_admin ? <span className="admin-badge">Admin</span> : null}</td>
            <td>{new Date(user.created_at).toLocaleDateString()}</td>
            <td>
              <button
                className="admin-delete-btn"
                onClick={() => handleDelete(user.id, user.username)}
                disabled={deleteMutation.isPending || user.id === currentUserId}
              >
                Delete
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
