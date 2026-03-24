require 'rails_helper'

RSpec.describe "Api::V1::Haikus", type: :request do
  let!(:http_code) { HttpCode.create!(code: 404, description: "Not Found", category: "client_error") }

  describe "POST /api/v1/haikus" do
    let(:valid_params) do
      {
        haiku: {
          http_code: 404,
          content: "Line one here\nLine two follows\nLine three ends",
          author_name: "Test Author"
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
      expect(json["haiku"]["author_name"]).to eq("Test Author")
    end

    it "defaults to Anonymous when author_name is blank" do
      valid_params[:haiku][:author_name] = ""

      post "/api/v1/haikus", params: valid_params, as: :json

      json = JSON.parse(response.body)
      expect(json["haiku"]["author_name"]).to eq("Anonymous")
    end

    it "returns error for invalid content (not 3 lines)" do
      valid_params[:haiku][:content] = "Only one line"

      post "/api/v1/haikus", params: valid_params, as: :json

      expect(response).to have_http_status(:unprocessable_entity)
      json = JSON.parse(response.body)
      expect(json["errors"]).to include("Content must have exactly 3 lines")
    end

    it "returns error for non-existent HTTP code" do
      valid_params[:haiku][:http_code] = 999

      post "/api/v1/haikus", params: valid_params, as: :json

      expect(response).to have_http_status(:not_found)
    end
  end

  describe "POST /api/v1/haikus/:id/vote" do
    let!(:haiku) { http_code.haikus.create!(content: "A\nB\nC") }

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

  def reset_session!
    cookies.delete("_http_haiku_session")
  end
end
