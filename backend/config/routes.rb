Rails.application.routes.draw do
  # Define your application routes per the DSL in https://guides.rubyonrails.org/routing.html

  # Reveal health status on /up that returns 200 if the app boots with no exceptions, otherwise 500.
  # Can be used by load balancers and uptime monitors to verify that the app is live.
  get "up" => "rails/health#show", as: :rails_health_check

  # API routes
  namespace :api do
    namespace :v1 do
      resources :http_codes, only: [:index, :show], param: :code

      resources :haikus, only: [:create, :update, :destroy] do
        collection do
          get :daily
        end
        member do
          post :vote
        end
      end

      resources :users, only: [:create]
      get "users/me", to: "users#me", as: :current_user
      resource :session, only: [:create, :destroy]

      namespace :admin do
        resources :haikus, only: [:index, :destroy]
        resources :users, only: [:index, :destroy]
      end
    end
  end
end
