require 'rails_helper'

RSpec.describe Vote, type: :model do
  let(:http_code) { HttpCode.create!(code: 404, description: "Not Found", category: "client_error") }
  let(:user) { FactoryBot.create(:user) }
  let(:haiku) { http_code.haikus.create!(content: "An old silent pond\nA frog jumps into the pond\nSplash silence again", user: user) }

  describe "validations" do
    it "is valid with valid attributes" do
      vote = Vote.new(haiku: haiku, session_id: "test_session")
      expect(vote).to be_valid
    end

    it "requires a session_id" do
      vote = Vote.new(haiku: haiku, session_id: nil)
      expect(vote).not_to be_valid
    end

    it "prevents duplicate votes from same session" do
      Vote.create!(haiku: haiku, session_id: "test_session")
      duplicate = Vote.new(haiku: haiku, session_id: "test_session")
      expect(duplicate).not_to be_valid
    end

    it "allows same session to vote on different haikus" do
      haiku2 = http_code.haikus.create!(content: "Still mountain morning\nSnow falls on frozen forests\nWind stirs the dark pines", user: user)
      Vote.create!(haiku: haiku, session_id: "test_session")
      vote2 = Vote.new(haiku: haiku2, session_id: "test_session")
      expect(vote2).to be_valid
    end
  end

  describe "associations" do
    it "belongs to haiku" do
      vote = Vote.new(session_id: "test_session")
      expect(vote.haiku).to be_nil
      vote.haiku = haiku
      expect(vote.haiku).to eq(haiku)
    end
  end

  describe "counter_cache" do
    it "increments haiku vote_count when created" do
      expect {
        Vote.create!(haiku: haiku, session_id: "test_session")
      }.to change { haiku.reload.vote_count }.from(0).to(1)
    end

    it "decrements haiku vote_count when destroyed" do
      vote = Vote.create!(haiku: haiku, session_id: "test_session")
      expect {
        vote.destroy
      }.to change { haiku.reload.vote_count }.from(1).to(0)
    end
  end
end
