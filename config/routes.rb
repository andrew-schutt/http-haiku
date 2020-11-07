Rails.application.routes.draw do
  root 'http_status_codes#index'
  resources :http_status_codes, only: [:show, :index]
end
