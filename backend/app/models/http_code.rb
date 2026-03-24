class HttpCode < ApplicationRecord
  has_many :haikus, dependent: :destroy

  validates :code, presence: true, uniqueness: true, numericality: { only_integer: true, greater_than_or_equal_to: 100, less_than: 600 }
  validates :description, presence: true
  validates :category, presence: true, inclusion: { in: %w[informational success redirection client_error server_error] }

  def top_haiku
    haikus.order(vote_count: :desc, created_at: :asc).first
  end
end
