class Haiku < ApplicationRecord
  belongs_to :http_code
  has_many :votes, dependent: :destroy

  validates :content, presence: true, length: { maximum: 200 }
  validate :must_have_three_lines

  private

  def must_have_three_lines
    return unless content.present?

    lines = content.split("\n").reject(&:empty?)
    errors.add(:content, "must have exactly 3 lines") unless lines.length == 3
  end
end
