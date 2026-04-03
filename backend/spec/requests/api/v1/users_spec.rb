require 'rails_helper'

RSpec.describe "Api::V1::Users", type: :request do
  describe "POST /api/v1/users" do
    let(:valid_params) do
      {
        user: {
          email: "newuser@example.com",
          username: "newuser",
          password: "password123",
          password_confirmation: "password123"
        }
      }
    end

    it "creates a new user and returns 201" do
      expect {
        post "/api/v1/users", params: valid_params, as: :json
      }.to change(User, :count).by(1)

      expect(response).to have_http_status(:created)
    end

    it "returns the user json (id, email, username)" do
      post "/api/v1/users", params: valid_params, as: :json

      json = JSON.parse(response.body)
      expect(json["user"]["email"]).to eq("newuser@example.com")
      expect(json["user"]["username"]).to eq("newuser")
      expect(json["user"]["id"]).to be_present
      expect(json["user"].keys).not_to include("password_digest")
    end

    it "sets the session user_id on success" do
      post "/api/v1/users", params: valid_params, as: :json

      # Follow up with a call to /me to verify session is set
      get "/api/v1/users/me"
      expect(response).to have_http_status(:ok)
    end

    it "returns 422 for duplicate email" do
      User.create!(email: "newuser@example.com", username: "existinguser", password: "password123", password_confirmation: "password123")

      post "/api/v1/users", params: valid_params, as: :json

      expect(response).to have_http_status(:unprocessable_content)
      json = JSON.parse(response.body)
      expect(json["errors"]).to be_present
    end

    it "returns 422 for duplicate username" do
      User.create!(email: "other@example.com", username: "newuser", password: "password123", password_confirmation: "password123")

      post "/api/v1/users", params: valid_params, as: :json

      expect(response).to have_http_status(:unprocessable_content)
      json = JSON.parse(response.body)
      expect(json["errors"]).to be_present
    end

    it "returns 422 for invalid email format" do
      valid_params[:user][:email] = "not-an-email"

      post "/api/v1/users", params: valid_params, as: :json

      expect(response).to have_http_status(:unprocessable_content)
      json = JSON.parse(response.body)
      expect(json["errors"]).to be_present
    end

    it "returns 422 for password too short" do
      valid_params[:user][:password] = "short"
      valid_params[:user][:password_confirmation] = "short"

      post "/api/v1/users", params: valid_params, as: :json

      expect(response).to have_http_status(:unprocessable_content)
      json = JSON.parse(response.body)
      expect(json["errors"]).to be_present
    end
  end

  describe "rate limiting" do
    let(:reg_params) do
      { user: { email: "newuser@example.com", username: "newuser", password: "password123", password_confirmation: "password123" } }
    end

    it "returns 429 when the registration rate limit is exceeded" do
      allow(Rails.cache).to receive(:increment).and_return(6)

      post "/api/v1/users", params: reg_params, as: :json

      expect(response).to have_http_status(:too_many_requests)
      json = JSON.parse(response.body)
      expect(json["error"]).to include("Too many accounts")
    end

    it "allows requests within the registration rate limit" do
      allow(Rails.cache).to receive(:increment).and_return(5)

      post "/api/v1/users", params: reg_params, as: :json

      expect(response).to have_http_status(:created)
    end
  end

  describe "GET /api/v1/users/:username" do
    let!(:user) { FactoryBot.create(:user) }
    let!(:http_code) { FactoryBot.create(:http_code, code: 418) }
    let!(:haiku) { FactoryBot.create(:haiku, user: user, http_code: http_code) }

    it "returns the user profile with haikus and stats" do
      get "/api/v1/users/#{user.username}"

      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json["user"]["username"]).to eq(user.username)
      expect(json["user"]["created_at"]).to be_present
      expect(json["user"].keys).not_to include("email", "password_digest")
      expect(json["haikus"].length).to eq(1)
      expect(json["haikus"][0]["content"]).to eq(haiku.content)
      expect(json["haikus"][0]["http_code"]["code"]).to eq(418)
      expect(json["total_votes"]).to eq(0)
    end

    it "returns haikus sorted by vote_count descending" do
      http_code2 = FactoryBot.create(:http_code, code: 200)
      haiku2 = FactoryBot.create(:haiku, user: user, http_code: http_code2)
      haiku.update_columns(vote_count: 5)

      get "/api/v1/users/#{user.username}"

      json = JSON.parse(response.body)
      expect(json["haikus"][0]["id"]).to eq(haiku.id)
      expect(json["haikus"][1]["id"]).to eq(haiku2.id)
    end

    it "returns total_votes as sum of all haiku vote counts" do
      haiku.update_columns(vote_count: 3)

      get "/api/v1/users/#{user.username}"

      json = JSON.parse(response.body)
      expect(json["total_votes"]).to eq(3)
    end

    it "returns 404 for unknown username" do
      get "/api/v1/users/doesnotexist"

      expect(response).to have_http_status(:not_found)
    end
  end

  describe "GET /api/v1/users/me" do
    let!(:user) { FactoryBot.create(:user) }

    it "returns the current user when authenticated" do
      post "/api/v1/session", params: { session: { email: user.email, password: "password123" } }, as: :json

      get "/api/v1/users/me"

      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json["user"]["id"]).to eq(user.id)
      expect(json["user"]["email"]).to eq(user.email)
      expect(json["user"]["username"]).to eq(user.username)
    end

    it "returns 401 when not authenticated" do
      get "/api/v1/users/me"

      expect(response).to have_http_status(:unauthorized)
      json = JSON.parse(response.body)
      expect(json["error"]).to eq("Authentication required")
    end
  end
end
