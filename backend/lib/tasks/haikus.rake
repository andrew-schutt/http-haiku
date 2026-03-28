namespace :haikus do
  desc "Remove all haikus and their votes from the database"
  task clear: :environment do
    count = Haiku.count
    Haiku.destroy_all
    puts "Cleared #{count} haikus (and their votes)"
  end

  desc "Clear haikus then reseed them. Optionally pass COUNT=n to limit haikus per code."
  task :reseed, [ :count ] => :environment do |_t, args|
    count = args[:count] || ENV["COUNT"]
    ENV["HAIKU_COUNT"] = count.to_s if count
    Rake::Task["haikus:clear"].invoke
    load Rails.root.join("db/seeds.rb")
  end
end
