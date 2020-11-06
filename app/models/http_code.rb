class HttpCode < ApplicationRecord
  validates :description, :name, :category, presence: true
  validates :code, inclusion: { in: HttpCodes::CODES }
end
