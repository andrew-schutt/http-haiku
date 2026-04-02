require "rails_helper"

RSpec.describe "Admin Users", type: :request do
  let(:admin) { FactoryBot.create(:user, :admin) }
  let(:user) { FactoryBot.create(:user) }

  describe "GET /api/v1/admin/users" do
    context "when authenticated as admin" do
      before { post "/api/v1/session", params: { session: { email: admin.email, password: "password123" } } }

      it "returns 200 with all users" do
        get "/api/v1/admin/users"
        expect(response).to have_http_status(:ok)
        json = JSON.parse(response.body)
        expect(json["users"]).to be_an(Array)
        expect(json["users"].first).to include("id", "email", "username", "is_admin", "created_at")
      end
    end

    context "when unauthenticated" do
      it "returns 401" do
        get "/api/v1/admin/users"
        expect(response).to have_http_status(:unauthorized)
      end
    end

    context "when authenticated as non-admin" do
      before { post "/api/v1/session", params: { session: { email: user.email, password: "password123" } } }

      it "returns 403" do
        get "/api/v1/admin/users"
        expect(response).to have_http_status(:forbidden)
      end
    end
  end

  describe "DELETE /api/v1/admin/users/:id" do
    context "when authenticated as admin" do
      before { post "/api/v1/session", params: { session: { email: admin.email, password: "password123" } } }

      it "returns 204 and destroys the user" do
        delete "/api/v1/admin/users/#{user.id}"
        expect(response).to have_http_status(:no_content)
        expect(User.exists?(user.id)).to be false
      end

      it "returns 422 when trying to delete self" do
        delete "/api/v1/admin/users/#{admin.id}"
        expect(response).to have_http_status(:unprocessable_content)
        json = JSON.parse(response.body)
        expect(json["error"]).to eq("Cannot delete yourself")
      end

      it "returns 404 when user not found" do
        delete "/api/v1/admin/users/0"
        expect(response).to have_http_status(:not_found)
      end
    end

    context "when authenticated as non-admin" do
      before { post "/api/v1/session", params: { session: { email: user.email, password: "password123" } } }

      it "returns 403" do
        delete "/api/v1/admin/users/#{user.id}"
        expect(response).to have_http_status(:forbidden)
      end
    end
  end
end
