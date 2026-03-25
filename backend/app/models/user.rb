class User < ApplicationRecord
  has_secure_password
  has_many :haikus, dependent: :destroy

  normalizes :email, with: -> (e) { e.strip.downcase }

  validates :email, presence: true, uniqueness: { case_sensitive: false },
                    format: { with: URI::MailTo::EMAIL_REGEXP }
  validates :username, presence: true, uniqueness: true, length: { in: 2..30 }
  validates :password, length: { minimum: 8 }, allow_nil: true

  def self.find_by_normalized_email(email)
    find_by(email: email.to_s.strip.downcase)
  end
end
