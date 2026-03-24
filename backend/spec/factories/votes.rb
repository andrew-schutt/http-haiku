FactoryBot.define do
  factory :vote do
    association :haiku
    sequence(:session_id) { |n| "session_#{n}" }
    ip_address { nil }
  end
end
