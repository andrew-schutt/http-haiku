require 'rails_helper'

RSpec.describe Haiku, type: :model do
  let(:http_code) { HttpCode.create!(code: 404, description: "Not Found", category: "client_error") }

  describe "validations" do
    it "is valid with valid attributes" do
      haiku = Haiku.new(
        http_code: http_code,
        content: "Line one here now\nLine two follows closely\nLine three ends it all"
      )
      expect(haiku).to be_valid
    end

    it "requires content" do
      haiku = Haiku.new(http_code: http_code, content: nil)
      expect(haiku).not_to be_valid
      expect(haiku.errors[:content]).to include("can't be blank")
    end

    it "requires exactly 3 lines" do
      haiku = Haiku.new(http_code: http_code, content: "Only one line")
      expect(haiku).not_to be_valid
      expect(haiku.errors[:content]).to include("must have exactly 3 lines")
    end

    it "accepts 3 non-empty lines" do
      haiku = Haiku.new(
        http_code: http_code,
        content: "First line\nSecond line\nThird line"
      )
      expect(haiku).to be_valid
    end

    it "rejects content with only 2 lines" do
      haiku = Haiku.new(http_code: http_code, content: "Line one\nLine two")
      expect(haiku).not_to be_valid
    end

    it "enforces maximum length of 200 characters" do
      long_content = "A" * 70 + "\n" + "B" * 70 + "\n" + "C" * 70
      haiku = Haiku.new(http_code: http_code, content: long_content)
      expect(haiku).not_to be_valid
    end
  end

  describe "associations" do
    it "belongs to http_code" do
      haiku = Haiku.new(content: "Line 1\nLine 2\nLine 3")
      expect(haiku.http_code).to be_nil
      haiku.http_code = http_code
      expect(haiku.http_code).to eq(http_code)
    end

    it "has many votes" do
      haiku = Haiku.create!(
        http_code: http_code,
        content: "Line 1\nLine 2\nLine 3"
      )
      expect(haiku.votes).to be_empty
    end
  end

  describe "default values" do
    it "defaults author_name to Anonymous" do
      haiku = Haiku.create!(
        http_code: http_code,
        content: "Line 1\nLine 2\nLine 3",
        author_name: nil
      )
      expect(haiku.author_name).to be_nil
    end

    it "defaults vote_count to 0" do
      haiku = Haiku.create!(
        http_code: http_code,
        content: "Line 1\nLine 2\nLine 3"
      )
      expect(haiku.vote_count).to eq(0)
    end
  end
end
