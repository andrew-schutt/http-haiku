require 'rails_helper'

RSpec.describe "Api::V1::Haikus#daily", type: :request do
  describe "GET /api/v1/haikus/daily" do
    context "when no haikus exist" do
      it "returns 404" do
        get "/api/v1/haikus/daily"
        expect(response).to have_http_status(:not_found)
      end
    end

    context "when haikus exist" do
      let!(:http_code) { HttpCode.create!(code: 200, description: "OK", category: "success") }
      let!(:user) { FactoryBot.create(:user) }
      let!(:haiku) { http_code.haikus.create!(content: "An old silent pond\nA frog jumps into the pond\nSplash silence again", user: user) }

      it "returns 200 with haiku data" do
        get "/api/v1/haikus/daily"
        expect(response).to have_http_status(:ok)
      end

      it "returns haiku fields" do
        get "/api/v1/haikus/daily"
        json = JSON.parse(response.body)
        expect(json["haiku"]["id"]).to be_present
        expect(json["haiku"]["content"]).to be_present
        expect(json["haiku"]["author_name"]).to be_present
        expect(json["haiku"]["vote_count"]).to be_a(Integer)
      end

      it "includes http_code with code and description" do
        get "/api/v1/haikus/daily"
        json = JSON.parse(response.body)
        expect(json["haiku"]["http_code"]["code"]).to eq(200)
        expect(json["haiku"]["http_code"]["description"]).to eq("OK")
      end

      it "returns the same haiku on two calls within the same day" do
        get "/api/v1/haikus/daily"
        first_id = JSON.parse(response.body)["haiku"]["id"]

        get "/api/v1/haikus/daily"
        second_id = JSON.parse(response.body)["haiku"]["id"]

        expect(first_id).to eq(second_id)
      end
    end
  end
end
