FactoryBot.define do
  factory :haiku do
    association :http_code
    content { "Status code speaks\nSilent errors in the night\nResponse comes at dawn" }
    author_name { "Anonymous" }
  end
end
