require 'rails_helper'

RSpec.describe HttpCode, type: :model do

  subject {
    described_class.new(
      code: 200,
      description: "any string will do",
      name: "anything",
      category: "successful"
    )
  }

  context "validations" do
    it "is valid with valid attributes" do
      expect(subject).to be_valid
    end

    it "is not valid with invalid http code" do
      subject.code = 999
      expect(subject).to_not be_valid
    end

    it "is not valid without a code" do
      subject.code = nil
      expect(subject).to_not be_valid
    end

    it "is not valid without a description" do
      subject.description =  nil
      expect(subject).to_not be_valid
    end

    it "is not valid without a name" do
      subject.name = nil
      expect(subject).to_not be_valid
    end

    it "is not valid without a category" do
      subject.category = nil
      expect(subject).to_not be_valid
    end
  end
end
