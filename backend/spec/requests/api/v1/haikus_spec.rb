require 'rails_helper'

RSpec.describe "Api::V1::Haikus", type: :request do
  let!(:http_code) { HttpCode.create!(code: 404, description: "Not Found", category: "client_error") }
  let!(:user) { FactoryBot.create(:user) }

  before do
    post "/api/v1/session", params: { session: { email: user.email, password: "password123" } }, as: :json
  end

  describe "POST /api/v1/haikus" do
    let(:valid_params) do
      {
        haiku: {
          http_code: 404,
          content: "An old silent pond\nA frog jumps into the pond\nSplash silence again"
        }
      }
    end

    it "creates a new haiku with valid params" do
      expect {
        post "/api/v1/haikus", params: valid_params, as: :json
      }.to change(Haiku, :count).by(1)

      expect(response).to have_http_status(:created)
      json = JSON.parse(response.body)
      expect(json["haiku"]["content"]).to eq(valid_params[:haiku][:content])
    end

    it "sets author_name from the logged-in user's username" do
      post "/api/v1/haikus", params: valid_params, as: :json

      json = JSON.parse(response.body)
      expect(json["haiku"]["author_name"]).to eq(user.username)
    end

    it "returns 401 when not authenticated" do
      cookies.delete("_http_haiku_session")

      post "/api/v1/haikus", params: valid_params, as: :json

      expect(response).to have_http_status(:unauthorized)
      json = JSON.parse(response.body)
      expect(json["error"]).to eq("Authentication required")
    end

    it "returns error for invalid content (not 3 lines)" do
      valid_params[:haiku][:content] = "Only one line"

      post "/api/v1/haikus", params: valid_params, as: :json

      expect(response).to have_http_status(:unprocessable_entity)
      json = JSON.parse(response.body)
      expect(json["errors"]).to include("Content must have exactly 3 lines")
    end

    it "returns error when syllable counts do not follow 5-7-5" do
      # Line 1: "An old silent frozen pond" = 7 syllables (expected 5)
      valid_params[:haiku][:content] = "An old silent frozen pond\nA frog jumps into the pond\nSplash silence again"

      post "/api/v1/haikus", params: valid_params, as: :json

      expect(response).to have_http_status(:unprocessable_entity)
      json = JSON.parse(response.body)
      expect(json["errors"].first).to include("5-7-5")
      expect(json["errors"].first).to include("line 1")
    end

    it "returns error for non-existent HTTP code" do
      valid_params[:haiku][:http_code] = 999

      post "/api/v1/haikus", params: valid_params, as: :json

      expect(response).to have_http_status(:not_found)
    end
  end

  describe "POST /api/v1/haikus/:id/vote" do
    let!(:haiku) { http_code.haikus.create!(content: "An old silent pond\nA frog jumps into the pond\nSplash silence again", user: user) }

    it "increments vote count" do
      expect {
        post "/api/v1/haikus/#{haiku.id}/vote"
      }.to change { haiku.reload.vote_count }.from(0).to(1)

      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json["haiku"]["vote_count"]).to eq(1)
    end

    it "prevents duplicate votes from same session" do
      # First vote
      post "/api/v1/haikus/#{haiku.id}/vote"
      expect(response).to have_http_status(:ok)

      # Second vote from same session
      post "/api/v1/haikus/#{haiku.id}/vote"
      expect(response).to have_http_status(:unprocessable_entity)

      json = JSON.parse(response.body)
      expect(json["error"]).to include("already voted")
    end

    it "allows different sessions to vote" do
      # First vote
      post "/api/v1/haikus/#{haiku.id}/vote"

      # Simulate new session by clearing cookies
      reset_session!

      # Second vote from different session
      expect {
        post "/api/v1/haikus/#{haiku.id}/vote"
      }.to change { haiku.reload.vote_count }.by(1)

      expect(response).to have_http_status(:ok)
    end

    it "returns 404 for non-existent haiku" do
      post "/api/v1/haikus/99999/vote"

      expect(response).to have_http_status(:not_found)
    end
  end

  describe "PATCH /api/v1/haikus/:id" do
    let!(:other_user) { FactoryBot.create(:user) }
    let!(:haiku) { http_code.haikus.create!(content: "An old silent pond\nA frog jumps into the pond\nSplash silence again", user: user) }

    it "updates haiku content with valid params" do
      new_content = "Haiku edit test\nNew words to fill seven here\nFinal line done now"

      patch "/api/v1/haikus/#{haiku.id}", params: { haiku: { content: new_content } }, as: :json

      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json["haiku"]["content"]).to eq(new_content)
    end

    it "returns 401 when not authenticated" do
      cookies.delete("_http_haiku_session")

      patch "/api/v1/haikus/#{haiku.id}", params: { haiku: { content: "New content\nLine two here\nLine three done" } }, as: :json

      expect(response).to have_http_status(:unauthorized)
    end

    it "returns 403 when not the author" do
      cookies.delete("_http_haiku_session")
      post "/api/v1/session", params: { session: { email: other_user.email, password: "password123" } }, as: :json

      patch "/api/v1/haikus/#{haiku.id}", params: { haiku: { content: "New content\nLine two here\nLine three done" } }, as: :json

      expect(response).to have_http_status(:forbidden)
    end

    it "returns 422 for invalid content (not 3 lines)" do
      patch "/api/v1/haikus/#{haiku.id}", params: { haiku: { content: "Only one line" } }, as: :json

      expect(response).to have_http_status(:unprocessable_entity)
      json = JSON.parse(response.body)
      expect(json["errors"]).to include("Content must have exactly 3 lines")
    end
  end

  describe "DELETE /api/v1/haikus/:id" do
    let!(:other_user) { FactoryBot.create(:user) }
    let!(:haiku) { http_code.haikus.create!(content: "An old silent pond\nA frog jumps into the pond\nSplash silence again", user: user) }

    it "deletes the haiku" do
      expect {
        delete "/api/v1/haikus/#{haiku.id}"
      }.to change(Haiku, :count).by(-1)

      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json["message"]).to eq("Haiku deleted")
    end

    it "returns 401 when not authenticated" do
      cookies.delete("_http_haiku_session")

      delete "/api/v1/haikus/#{haiku.id}"

      expect(response).to have_http_status(:unauthorized)
    end

    it "returns 403 when not the author" do
      cookies.delete("_http_haiku_session")
      post "/api/v1/session", params: { session: { email: other_user.email, password: "password123" } }, as: :json

      delete "/api/v1/haikus/#{haiku.id}"

      expect(response).to have_http_status(:forbidden)
    end
  end

  describe "rate limiting" do
    let(:valid_content) { "An old silent pond\nA frog jumps into the pond\nSplash silence again" }

    describe "haiku creation" do
      it "returns 429 when the submission rate limit is exceeded" do
        allow(Rails.cache).to receive(:increment).and_return(11)

        post "/api/v1/haikus", params: { haiku: { http_code: 404, content: valid_content } }, as: :json

        expect(response).to have_http_status(:too_many_requests)
        json = JSON.parse(response.body)
        expect(json["error"]).to include("Too many haikus")
      end

      it "allows requests within the submission rate limit" do
        allow(Rails.cache).to receive(:increment).and_return(10)

        post "/api/v1/haikus", params: { haiku: { http_code: 404, content: valid_content } }, as: :json

        expect(response).to have_http_status(:created)
      end
    end

    describe "voting" do
      let!(:haiku) { http_code.haikus.create!(content: valid_content, user: user) }

      it "returns 429 when the vote rate limit is exceeded" do
        allow(Rails.cache).to receive(:increment).and_return(31)

        post "/api/v1/haikus/#{haiku.id}/vote"

        expect(response).to have_http_status(:too_many_requests)
        json = JSON.parse(response.body)
        expect(json["error"]).to include("Too many votes")
      end

      it "allows requests within the vote rate limit" do
        allow(Rails.cache).to receive(:increment).and_return(30)

        post "/api/v1/haikus/#{haiku.id}/vote"

        expect(response).to have_http_status(:ok)
      end
    end
  end

  def reset_session!
    cookies.delete("_http_haiku_session")
  end
end
