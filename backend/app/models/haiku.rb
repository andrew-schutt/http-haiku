class Haiku < ApplicationRecord
  belongs_to :http_code
  belongs_to :user
  has_many :votes, dependent: :destroy

  before_validation :set_author_name_from_user

  validates :author_name, presence: true
  validates :content, presence: true, length: { maximum: 200 }
  validate :must_have_three_lines
  validate :must_follow_syllable_structure, if: :three_lines?

  private

  def set_author_name_from_user
    self.author_name = user.username if user.present?
  end

  def must_have_three_lines
    return unless content.present?

    lines = content.split("\n").reject(&:empty?)
    errors.add(:content, "must have exactly 3 lines") unless lines.length == 3
  end

  def must_follow_syllable_structure
    checker = HaikuCheck.new(content)
    errors.add(:content, checker.error_message) unless checker.valid?
  end

  def three_lines?
    content.present? && content.split("\n").reject(&:empty?).length == 3
  end
end
