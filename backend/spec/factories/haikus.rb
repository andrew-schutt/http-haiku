FactoryBot.define do
  factory :haiku do
    association :http_code
    association :user
    content { "An old silent pond\nA frog jumps into the pond\nSplash silence again" }
  end
end
