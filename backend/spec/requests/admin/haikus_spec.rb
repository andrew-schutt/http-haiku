require "rails_helper"

RSpec.describe "Admin Haikus", type: :request do
  let(:admin) { FactoryBot.create(:user, :admin) }
  let(:user) { FactoryBot.create(:user) }
  let(:http_code) { FactoryBot.create(:http_code) }
  let!(:haiku) { FactoryBot.create(:haiku, http_code: http_code, user: user) }

  describe "GET /api/v1/admin/haikus" do
    context "when authenticated as admin" do
      before { post "/api/v1/session", params: { session: { email: admin.email, password: "password123" } } }

      it "returns 200 with all haikus" do
        get "/api/v1/admin/haikus"
        expect(response).to have_http_status(:ok)
        json = JSON.parse(response.body)
        expect(json["haikus"]).to be_an(Array)
        expect(json["haikus"].first).to include("id", "content", "author_name", "vote_count", "http_code", "user")
      end
    end

    context "when unauthenticated" do
      it "returns 401" do
        get "/api/v1/admin/haikus"
        expect(response).to have_http_status(:unauthorized)
      end
    end

    context "when authenticated as non-admin" do
      before { post "/api/v1/session", params: { session: { email: user.email, password: "password123" } } }

      it "returns 403" do
        get "/api/v1/admin/haikus"
        expect(response).to have_http_status(:forbidden)
      end
    end
  end

  describe "DELETE /api/v1/admin/haikus/:id" do
    context "when authenticated as admin" do
      before { post "/api/v1/session", params: { session: { email: admin.email, password: "password123" } } }

      it "returns 204 and destroys the haiku" do
        delete "/api/v1/admin/haikus/#{haiku.id}"
        expect(response).to have_http_status(:no_content)
        expect(Haiku.exists?(haiku.id)).to be false
      end

      it "returns 404 when haiku not found" do
        delete "/api/v1/admin/haikus/0"
        expect(response).to have_http_status(:not_found)
      end
    end

    context "when authenticated as non-admin" do
      before { post "/api/v1/session", params: { session: { email: user.email, password: "password123" } } }

      it "returns 403" do
        delete "/api/v1/admin/haikus/#{haiku.id}"
        expect(response).to have_http_status(:forbidden)
      end
    end
  end
end
