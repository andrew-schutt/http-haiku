FactoryBot.define do
  factory :haiku do
    association :http_code
    content { "An old silent pond\nA frog jumps into the pond\nSplash silence again" }
    author_name { "Anonymous" }
  end
end
