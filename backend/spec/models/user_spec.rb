require 'rails_helper'

RSpec.describe User, type: :model do
  describe "has_secure_password" do
    it "stores a password_digest when password is set" do
      user = User.new(email: "test@example.com", username: "testuser", password: "password123", password_confirmation: "password123")
      expect(user.password_digest).to be_present
    end

    it "authenticates with correct password" do
      user = User.create!(email: "test@example.com", username: "testuser", password: "password123", password_confirmation: "password123")
      expect(user.authenticate("password123")).to eq(user)
    end

    it "returns false when authenticating with wrong password" do
      user = User.create!(email: "test@example.com", username: "testuser", password: "password123", password_confirmation: "password123")
      expect(user.authenticate("wrongpassword")).to be_falsey
    end
  end

  describe "email validations" do
    it "is valid with a valid email" do
      user = User.new(email: "test@example.com", username: "testuser", password: "password123", password_confirmation: "password123")
      expect(user).to be_valid
    end

    it "requires email presence" do
      user = User.new(email: nil, username: "testuser", password: "password123", password_confirmation: "password123")
      expect(user).not_to be_valid
      expect(user.errors[:email]).to include("can't be blank")
    end

    it "requires email uniqueness (case insensitive)" do
      User.create!(email: "test@example.com", username: "firstuser", password: "password123", password_confirmation: "password123")
      duplicate = User.new(email: "TEST@EXAMPLE.COM", username: "seconduser", password: "password123", password_confirmation: "password123")
      expect(duplicate).not_to be_valid
      expect(duplicate.errors[:email]).to include("has already been taken")
    end

    it "requires valid email format" do
      user = User.new(email: "not-an-email", username: "testuser", password: "password123", password_confirmation: "password123")
      expect(user).not_to be_valid
      expect(user.errors[:email]).to be_present
    end

    it "rejects email without @ sign" do
      user = User.new(email: "invalidemail.com", username: "testuser", password: "password123", password_confirmation: "password123")
      expect(user).not_to be_valid
    end
  end

  describe "username validations" do
    it "requires username presence" do
      user = User.new(email: "test@example.com", username: nil, password: "password123", password_confirmation: "password123")
      expect(user).not_to be_valid
      expect(user.errors[:username]).to include("can't be blank")
    end

    it "requires username uniqueness" do
      User.create!(email: "first@example.com", username: "samename", password: "password123", password_confirmation: "password123")
      duplicate = User.new(email: "second@example.com", username: "samename", password: "password123", password_confirmation: "password123")
      expect(duplicate).not_to be_valid
      expect(duplicate.errors[:username]).to include("has already been taken")
    end

    it "requires username to be at least 2 characters" do
      user = User.new(email: "test@example.com", username: "a", password: "password123", password_confirmation: "password123")
      expect(user).not_to be_valid
      expect(user.errors[:username]).to be_present
    end

    it "requires username to be at most 30 characters" do
      user = User.new(email: "test@example.com", username: "a" * 31, password: "password123", password_confirmation: "password123")
      expect(user).not_to be_valid
      expect(user.errors[:username]).to be_present
    end

    it "accepts username of exactly 2 characters" do
      user = User.new(email: "test@example.com", username: "ab", password: "password123", password_confirmation: "password123")
      expect(user).to be_valid
    end

    it "accepts username of exactly 30 characters" do
      user = User.new(email: "test@example.com", username: "a" * 30, password: "password123", password_confirmation: "password123")
      expect(user).to be_valid
    end
  end

  describe "password validations" do
    it "requires password to be at least 8 characters" do
      user = User.new(email: "test@example.com", username: "testuser", password: "short", password_confirmation: "short")
      expect(user).not_to be_valid
      expect(user.errors[:password]).to be_present
    end

    it "does not add a length error for nil password (allow_nil: true on length validation)" do
      user = User.new(email: "test@example.com", username: "testuser", password: nil)
      user.valid?
      # The length validation is skipped, but has_secure_password adds presence: true
      # so errors may still include presence—but NOT a length error
      expect(user.errors[:password].none? { |e| e.include?("too short") }).to be true
    end
  end

  describe "email normalization" do
    it "strips whitespace from email" do
      user = User.create!(email: "  test@example.com  ", username: "testuser", password: "password123", password_confirmation: "password123")
      expect(user.email).to eq("test@example.com")
    end

    it "downcases email" do
      user = User.create!(email: "TEST@EXAMPLE.COM", username: "testuser", password: "password123", password_confirmation: "password123")
      expect(user.email).to eq("test@example.com")
    end

    it "strips and downcases email" do
      user = User.create!(email: "  Test@Example.COM  ", username: "testuser", password: "password123", password_confirmation: "password123")
      expect(user.email).to eq("test@example.com")
    end
  end

  describe ".find_by_normalized_email" do
    let!(:user) { User.create!(email: "test@example.com", username: "testuser", password: "password123", password_confirmation: "password123") }

    it "finds a user by exact email" do
      found = User.find_by_normalized_email("test@example.com")
      expect(found).to eq(user)
    end

    it "finds a user by uppercase email" do
      found = User.find_by_normalized_email("TEST@EXAMPLE.COM")
      expect(found).to eq(user)
    end

    it "finds a user by email with whitespace" do
      found = User.find_by_normalized_email("  test@example.com  ")
      expect(found).to eq(user)
    end

    it "returns nil when email is not found" do
      expect(User.find_by_normalized_email("nobody@example.com")).to be_nil
    end

    it "handles nil email safely" do
      expect(User.find_by_normalized_email(nil)).to be_nil
    end
  end

  describe "associations" do
    it "has many haikus" do
      user = User.create!(email: "test@example.com", username: "testuser", password: "password123", password_confirmation: "password123")
      expect(user.haikus).to be_empty
    end

    it "destroys associated haikus when user is destroyed" do
      user = FactoryBot.create(:user)
      haiku = FactoryBot.create(:haiku, user: user)
      expect { user.destroy }.to change(Haiku, :count).by(-1)
    end
  end
end
