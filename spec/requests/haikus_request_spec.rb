# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Haiku, type: :request do
  context '#index' do
    it 'responds successfully' do
      http_status_code_record = HttpStatusCode.first
      get http_status_code_haikus_path(http_status_code_record)
      expect(response).to be_successful
    end
  end

  context '#new' do
    it 'responds succesffully' do
      http_status_code_record = HttpStatusCode.first
      get new_http_status_code_haiku_path(http_status_code_record)
      expect(response).to be_successful
    end
  end
end