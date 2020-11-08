# frozen_string_literal: true

Rails.application.routes.draw do
  root 'http_status_codes#index'
  resources :http_status_codes, only: %i[show index] do
    resources :haikus
  end
end
