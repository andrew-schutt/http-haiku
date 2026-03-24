class Vote < ApplicationRecord
  belongs_to :haiku, counter_cache: :vote_count

  validates :session_id, presence: true
  validates :haiku_id, uniqueness: { scope: :session_id, message: "already voted on by this session" }
end
