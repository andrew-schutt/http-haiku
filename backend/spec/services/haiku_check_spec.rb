require "rails_helper"

RSpec.describe HaikuCheck do
  # Canonical valid haiku: 5-7-5
  # "An old silent pond"       = An(1) + old(1) + si·lent(2) + pond(1)    = 5
  # "A frog jumps into the pond" = A(1) + frog(1) + jumps(1) + in·to(2) + the(1) + pond(1) = 7
  # "Splash silence again"     = Splash(1) + si·lence(2) + a·gain(2)       = 5
  let(:valid_haiku) do
    "An old silent pond\nA frog jumps into the pond\nSplash silence again"
  end

  describe HaikuCheck::SyllableCounter do
    describe ".count" do
      it "counts single-syllable words" do
        expect(described_class.count("pond")).to eq(1)
        expect(described_class.count("frog")).to eq(1)
        expect(described_class.count("splash")).to eq(1)
        expect(described_class.count("moon")).to eq(1)
        expect(described_class.count("the")).to eq(1)
      end

      it "counts multi-syllable words" do
        expect(described_class.count("silent")).to eq(2)
        expect(described_class.count("silence")).to eq(2)
        expect(described_class.count("again")).to eq(2)
        expect(described_class.count("into")).to eq(2)
        expect(described_class.count("frozen")).to eq(2)
      end

      it "handles silent trailing 'e'" do
        expect(described_class.count("make")).to eq(1)
        expect(described_class.count("time")).to eq(1)
        expect(described_class.count("grace")).to eq(1)
        expect(described_class.count("lake")).to eq(1)
      end

      it "handles silent '-es' after non-sibilant consonants" do
        expect(described_class.count("comes")).to eq(1)
        expect(described_class.count("leaves")).to eq(1)
        expect(described_class.count("loves")).to eq(1)
      end

      it "does not reduce '-es' after sibilant consonants" do
        expect(described_class.count("roses")).to eq(2)
        expect(described_class.count("faces")).to eq(2)
      end

      it "handles silent '-ed' after non-d/t consonants" do
        expect(described_class.count("walked")).to eq(1)
        expect(described_class.count("called")).to eq(1)
        expect(described_class.count("moved")).to eq(1)
      end

      it "preserves syllables when '-ed' adds a new syllable" do
        expect(described_class.count("wanted")).to eq(2)
        expect(described_class.count("needed")).to eq(2)
      end

      it "ignores punctuation and casing" do
        expect(described_class.count("Pond!")).to eq(1)
        expect(described_class.count("SILENT,")).to eq(2)
        expect(described_class.count("it's")).to eq(1)
      end

      it "returns 0 for empty or non-alpha input" do
        expect(described_class.count("")).to eq(0)
        expect(described_class.count("123")).to eq(0)
      end

      it "returns at least 1 for any real word" do
        expect(described_class.count("hmm")).to eq(1)
        expect(described_class.count("nth")).to eq(1)
      end
    end
  end

  describe "#valid?" do
    it "returns true for a correctly structured 5-7-5 haiku" do
      expect(described_class.new(valid_haiku).valid?).to be true
    end

    it "returns false when a line has the wrong syllable count" do
      # "An old silent frozen pond" = An(1)+old(1)+si·lent(2)+fro·zen(2)+pond(1) = 7, not 5
      content = "An old silent frozen pond\nA frog jumps into the pond\nSplash silence again"
      expect(described_class.new(content).valid?).to be false
    end

    it "returns false when multiple lines are wrong" do
      content = "Hi\nA frog jumps into the pond\nHi"
      expect(described_class.new(content).valid?).to be false
    end
  end

  describe "#error_message" do
    it "returns nil for a valid haiku" do
      expect(described_class.new(valid_haiku).error_message).to be_nil
    end

    it "names the offending line, its actual syllable count, and the expected count" do
      # Line 1: "An old silent frozen pond" = 7 syllables (expected 5)
      content = "An old silent frozen pond\nA frog jumps into the pond\nSplash silence again"
      message = described_class.new(content).error_message

      expect(message).to include("5-7-5")
      expect(message).to include("line 1")
      expect(message).to include("7 syllables")
      expect(message).to include("expected 5")
    end

    it "reports errors for all incorrect lines, not just the first" do
      # Line 1 and line 3 each have 1 syllable (expected 5)
      content = "Hi\nA frog jumps into the pond\nHi"
      message = described_class.new(content).error_message

      expect(message).to include("line 1")
      expect(message).to include("line 3")
      expect(message).not_to include("line 2")
    end

    it "uses singular 'syllable' when a line has exactly one" do
      content = "An old silent pond\nA frog jumps into the pond\nHi"
      message = described_class.new(content).error_message

      expect(message).to include("1 syllable (expected 5)")
    end
  end
end
