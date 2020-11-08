# frozen_string_literal: true

class HttpStatusCode < ApplicationRecord
  has_many :haikus

  validates :description, :name, :category, presence: true
  validates :code, inclusion: { in: HttpStatusCodeConstants::CODES }
end
