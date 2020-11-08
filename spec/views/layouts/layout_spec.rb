require 'rails_helper'

RSpec.describe "layout", type: :request do
  it "should include header" do
    get root_path
    expect(response.body).to include('HTTP Haiku')
  end

  it "should include footer" do
    get root_path
    expect(response.body).to include('Made by')
    within('a') do
      expect(page).to have_content('Andrew Schutt')
    end
  end
end