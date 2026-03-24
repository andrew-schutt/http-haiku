require 'rails_helper'

RSpec.describe HttpCode, type: :model do
  describe "validations" do
    it "is valid with valid attributes" do
      http_code = HttpCode.new(code: 200, description: "OK", category: "success")
      expect(http_code).to be_valid
    end

    it "requires a code" do
      http_code = HttpCode.new(description: "OK", category: "success")
      expect(http_code).not_to be_valid
    end

    it "requires a unique code" do
      HttpCode.create!(code: 200, description: "OK", category: "success")
      duplicate = HttpCode.new(code: 200, description: "OK", category: "success")
      expect(duplicate).not_to be_valid
    end

    it "requires code to be between 100 and 599" do
      expect(HttpCode.new(code: 99, description: "Test", category: "success")).not_to be_valid
      expect(HttpCode.new(code: 600, description: "Test", category: "success")).not_to be_valid
      expect(HttpCode.new(code: 200, description: "Test", category: "success")).to be_valid
    end

    it "requires a valid category" do
      http_code = HttpCode.new(code: 200, description: "OK", category: "invalid")
      expect(http_code).not_to be_valid
    end

    it "accepts valid categories" do
      categories = %w[informational success redirection client_error server_error]
      categories.each do |category|
        http_code = HttpCode.new(code: 200 + categories.index(category), description: "Test", category: category)
        expect(http_code).to be_valid
      end
    end
  end

  describe "associations" do
    it "has many haikus" do
      http_code = HttpCode.create!(code: 404, description: "Not Found", category: "client_error")
      expect(http_code.haikus).to be_empty
    end
  end

  describe "#top_haiku" do
    let(:http_code) { HttpCode.create!(code: 404, description: "Not Found", category: "client_error") }

    it "returns nil when there are no haikus" do
      expect(http_code.top_haiku).to be_nil
    end

    it "returns the haiku with the highest vote count" do
      haiku1 = http_code.haikus.create!(content: "An old silent pond\nA frog jumps into the pond\nSplash silence again", vote_count: 5)
      haiku2 = http_code.haikus.create!(content: "Still mountain morning\nSnow falls on frozen forests\nWind stirs the dark pines", vote_count: 10)
      haiku3 = http_code.haikus.create!(content: "Old moon in winter\nStars reflect in a still pond\nCold and far from dawn", vote_count: 3)

      expect(http_code.top_haiku).to eq(haiku2)
    end

    it "returns the oldest haiku when vote counts are equal" do
      haiku1 = http_code.haikus.create!(content: "An old silent pond\nA frog jumps into the pond\nSplash silence again", vote_count: 5)
      sleep 0.01
      haiku2 = http_code.haikus.create!(content: "Still mountain morning\nSnow falls on frozen forests\nWind stirs the dark pines", vote_count: 5)

      expect(http_code.top_haiku).to eq(haiku1)
    end
  end
end
