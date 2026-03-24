class HaikuCheck
  STRUCTURE = [5, 7, 5].freeze

  # Pure-Ruby syllable counter. Counts vowel groups then applies targeted
  # deduction rules for common silent-vowel patterns in English.
  module SyllableCounter
    # Non-sibilant consonants that produce a silent 'e' when followed by 'es':
    # "comes" → 1, "leaves" → 1. Sibilants (s, c, x, z) are excluded because
    # they force a new syllable: "roses" → 2, "faces" → 2.
    SILENT_ES_PATTERN = /[bdfgklmnprtvw]es\z/

    def self.count(word)
      word = word.downcase.gsub(/[^a-z']/, "").delete("'")
      return 0 if word.empty?

      count = word.scan(/[aeiouy]+/).length

      # Silent trailing 'e': "make" → 1, "grace" → 1, "time" → 1
      count -= 1 if word =~ /[^aeiouy]e\z/ && count > 1

      # Silent '-es' after a non-sibilant consonant: "comes" → 1, "leaves" → 1
      count -= 1 if word =~ SILENT_ES_PATTERN && count > 1

      # Silent '-ed' after a non-d/t consonant: "walked" → 1, "called" → 1
      # Excludes 'd' and 't' so "wanted" → 2 and "needed" → 2 are preserved.
      count -= 1 if word =~ /[^aeiouydt]ed\z/ && count > 1

      [count, 1].max
    end
  end

  def initialize(content)
    @lines = content.split("\n").reject(&:empty?)
  end

  def valid?
    line_errors.empty?
  end

  def error_message
    return nil if valid?

    "does not follow the 5-7-5 syllable structure — #{line_errors.join('; ')}"
  end

  private

  def line_errors
    @line_errors ||= STRUCTURE.each_with_index.filter_map do |expected, i|
      line = @lines[i]
      next "line #{i + 1} is missing" unless line

      actual = syllables_in(line)
      next if actual == expected

      "line #{i + 1} has #{actual} #{actual == 1 ? 'syllable' : 'syllables'} (expected #{expected})"
    end
  end

  def syllables_in(line)
    line.split.sum { |word| SyllableCounter.count(word) }
  end
end
