require 'rails_helper'

RSpec.describe HttpStatusCode, type: :request do
  context "#index" do
    it "responds successfully" do
      get http_status_codes_path
      expect(response).to be_successful
    end

    it "displays all http codes" do
      get http_status_codes_path
      HttpStatusCodeConstants::CODES.each do |code|
        expect(response.body).to include(code.to_s)
      end
    end
  end

  context "#show" do
    it "responds successfully" do
      get http_status_code_path
      expect(response).to be_successful
    end
  end
end