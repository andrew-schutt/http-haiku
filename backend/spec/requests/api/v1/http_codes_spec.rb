require 'rails_helper'

RSpec.describe "Api::V1::HttpCodes", type: :request do
  describe "GET /api/v1/http_codes" do
    let!(:http_code1) { HttpCode.create!(code: 200, description: "OK", category: "success") }
    let!(:http_code2) { HttpCode.create!(code: 404, description: "Not Found", category: "client_error") }

    it "returns all HTTP codes" do
      get "/api/v1/http_codes"
      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json["http_codes"].length).to eq(2)
    end

    it "includes top haiku for each code" do
      haiku = http_code1.haikus.create!(content: "Line 1\nLine 2\nLine 3", vote_count: 5)

      get "/api/v1/http_codes"
      json = JSON.parse(response.body)
      code_200 = json["http_codes"].find { |c| c["code"] == 200 }

      expect(code_200["top_haiku"]).to be_present
      expect(code_200["top_haiku"]["content"]).to eq("Line 1\nLine 2\nLine 3")
    end

    it "returns null for top_haiku when no haikus exist" do
      get "/api/v1/http_codes"
      json = JSON.parse(response.body)
      code_404 = json["http_codes"].find { |c| c["code"] == 404 }

      expect(code_404["top_haiku"]).to be_nil
    end
  end

  describe "GET /api/v1/http_codes/:code" do
    let!(:http_code) { HttpCode.create!(code: 404, description: "Not Found", category: "client_error") }
    let!(:haiku1) { http_code.haikus.create!(content: "A\nB\nC", vote_count: 10) }
    let!(:haiku2) { http_code.haikus.create!(content: "X\nY\nZ", vote_count: 5) }

    it "returns the HTTP code with haikus" do
      get "/api/v1/http_codes/404"
      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)

      expect(json["http_code"]["code"]).to eq(404)
      expect(json["http_code"]["description"]).to eq("Not Found")
      expect(json["http_code"]["haikus"].length).to eq(2)
    end

    it "returns haikus ordered by vote count descending" do
      get "/api/v1/http_codes/404"
      json = JSON.parse(response.body)
      haikus = json["http_code"]["haikus"]

      expect(haikus.first["vote_count"]).to eq(10)
      expect(haikus.last["vote_count"]).to eq(5)
    end

    it "limits to 20 haikus" do
      25.times do |i|
        http_code.haikus.create!(content: "L1\nL2\nL3", vote_count: i)
      end

      get "/api/v1/http_codes/404"
      json = JSON.parse(response.body)

      expect(json["http_code"]["haikus"].length).to eq(20)
    end

    it "returns 404 for non-existent code" do
      get "/api/v1/http_codes/999"
      expect(response).to have_http_status(:not_found)
    end
  end
end
