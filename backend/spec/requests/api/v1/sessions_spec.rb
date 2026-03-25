require 'rails_helper'

RSpec.describe "Api::V1::Sessions", type: :request do
  let!(:user) { User.create!(email: "test@example.com", username: "testuser", password: "password123", password_confirmation: "password123") }

  describe "POST /api/v1/session" do
    it "returns 200 and user json on successful login" do
      post "/api/v1/session", params: { session: { email: "test@example.com", password: "password123" } }, as: :json

      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json["user"]["id"]).to eq(user.id)
      expect(json["user"]["email"]).to eq(user.email)
      expect(json["user"]["username"]).to eq(user.username)
      expect(json["user"].keys).not_to include("password_digest")
    end

    it "sets session user_id on successful login" do
      post "/api/v1/session", params: { session: { email: "test@example.com", password: "password123" } }, as: :json

      # Verify session is set by calling /me
      get "/api/v1/users/me"
      expect(response).to have_http_status(:ok)
    end

    it "returns 401 for wrong password" do
      post "/api/v1/session", params: { session: { email: "test@example.com", password: "wrongpassword" } }, as: :json

      expect(response).to have_http_status(:unauthorized)
      json = JSON.parse(response.body)
      expect(json["error"]).to eq("Invalid email or password")
    end

    it "returns 401 for unknown email" do
      post "/api/v1/session", params: { session: { email: "nobody@example.com", password: "password123" } }, as: :json

      expect(response).to have_http_status(:unauthorized)
      json = JSON.parse(response.body)
      expect(json["error"]).to eq("Invalid email or password")
    end

    it "matches email case-insensitively" do
      post "/api/v1/session", params: { session: { email: "TEST@EXAMPLE.COM", password: "password123" } }, as: :json

      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json["user"]["id"]).to eq(user.id)
    end

    it "matches email with leading/trailing whitespace" do
      post "/api/v1/session", params: { session: { email: "  test@example.com  ", password: "password123" } }, as: :json

      expect(response).to have_http_status(:ok)
    end
  end

  describe "DELETE /api/v1/session" do
    before do
      post "/api/v1/session", params: { session: { email: "test@example.com", password: "password123" } }, as: :json
    end

    it "returns 200 with logout message" do
      delete "/api/v1/session"

      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json["message"]).to eq("Logged out successfully")
    end

    it "clears user_id from session" do
      # Verify user is logged in
      get "/api/v1/users/me"
      expect(response).to have_http_status(:ok)

      # Log out
      delete "/api/v1/session"

      # Verify user is no longer authenticated
      get "/api/v1/users/me"
      expect(response).to have_http_status(:unauthorized)
    end

    it "preserves voter_token in session after logout" do
      http_code = HttpCode.create!(code: 404, description: "Not Found", category: "client_error")
      haiku = http_code.haikus.create!(
        content: "An old silent pond\nA frog jumps into the pond\nSplash silence again",
        user: user
      )

      # Cast a vote to establish voter_token
      post "/api/v1/haikus/#{haiku.id}/vote"
      expect(response).to have_http_status(:ok)

      # Log out
      delete "/api/v1/session"
      expect(response).to have_http_status(:ok)

      # Try to vote again — should be blocked (same voter_token preserved)
      post "/api/v1/haikus/#{haiku.id}/vote"
      expect(response).to have_http_status(:unprocessable_entity)
      json = JSON.parse(response.body)
      expect(json["error"]).to include("already voted")
    end
  end
end
