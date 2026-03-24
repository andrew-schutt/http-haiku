FactoryBot.define do
  factory :http_code do
    sequence(:code) { |n| 200 + n }
    description { "OK" }
    category { "success" }
  end
end
