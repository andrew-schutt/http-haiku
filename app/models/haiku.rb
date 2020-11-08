# frozen_string_literal: true

class Haiku < ApplicationRecord
  belongs_to :http_status_code
  belongs_to :writer
end
