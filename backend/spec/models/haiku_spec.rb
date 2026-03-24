require 'rails_helper'

RSpec.describe Haiku, type: :model do
  let(:http_code) { HttpCode.create!(code: 404, description: "Not Found", category: "client_error") }
  # Canonical valid haiku used throughout: 5-7-5
  let(:valid_content) { "An old silent pond\nA frog jumps into the pond\nSplash silence again" }

  describe "validations" do
    it "is valid with valid attributes" do
      haiku = Haiku.new(http_code: http_code, content: valid_content)
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

    it "accepts a valid 5-7-5 haiku" do
      haiku = Haiku.new(http_code: http_code, content: valid_content)
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

    describe "5-7-5 syllable structure" do
      it "rejects a haiku with the wrong syllable count and reports the line" do
        # Line 1: "An old silent frozen pond" = An(1)+old(1)+si·lent(2)+fro·zen(2)+pond(1) = 7, not 5
        content = "An old silent frozen pond\nA frog jumps into the pond\nSplash silence again"
        haiku = Haiku.new(http_code: http_code, content: content)

        expect(haiku).not_to be_valid
        expect(haiku.errors[:content].first).to include("5-7-5")
        expect(haiku.errors[:content].first).to include("line 1")
        expect(haiku.errors[:content].first).to include("7 syllables")
        expect(haiku.errors[:content].first).to include("expected 5")
      end

      it "does not run syllable validation when line count is wrong" do
        haiku = Haiku.new(http_code: http_code, content: "Only one line")
        haiku.valid?

        expect(haiku.errors[:content]).to include("must have exactly 3 lines")
        expect(haiku.errors[:content].none? { |e| e.include?("5-7-5") }).to be true
      end
    end
  end

  describe "associations" do
    it "belongs to http_code" do
      haiku = Haiku.new(content: valid_content)
      expect(haiku.http_code).to be_nil
      haiku.http_code = http_code
      expect(haiku.http_code).to eq(http_code)
    end

    it "has many votes" do
      haiku = Haiku.create!(http_code: http_code, content: valid_content)
      expect(haiku.votes).to be_empty
    end
  end

  describe "default values" do
    it "defaults author_name to Anonymous" do
      haiku = Haiku.create!(http_code: http_code, content: valid_content, author_name: nil)
      expect(haiku.author_name).to be_nil
    end

    it "defaults vote_count to 0" do
      haiku = Haiku.create!(http_code: http_code, content: valid_content)
      expect(haiku.vote_count).to eq(0)
    end
  end
end
