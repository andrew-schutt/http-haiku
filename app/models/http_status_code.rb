# frozen_string_literal: true

class HttpStatusCode < ApplicationRecord
  validates :description, :name, :category, presence: true
  validates :code, inclusion: { in: HttpStatusCodeConstants::CODES }
end
