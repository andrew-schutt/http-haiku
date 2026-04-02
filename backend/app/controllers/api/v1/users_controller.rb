class Api::V1::UsersController < ApplicationController
  before_action :require_authentication, only: [ :me ]
  before_action :throttle_registration, only: :create

  def create
    user = User.new(user_params)
    if user.save
      session[:user_id] = user.id
      render json: { user: user.as_json(only: [ :id, :email, :username, :is_admin ]) }, status: :created
    else
      render json: { errors: user.errors.full_messages }, status: :unprocessable_content
    end
  end

  def me
    render json: { user: current_user.as_json(only: [ :id, :email, :username, :is_admin ]) }
  end

  private

  def throttle_registration
    count = Rails.cache.increment("rl:registration:#{request.remote_ip}", 1, expires_in: 1.hour) || 1
    if count > 5
      render json: { error: "Too many accounts created from this IP. Please try again later." }, status: :too_many_requests
    end
  end

  def user_params
    params.expect(user: [ :email, :username, :password, :password_confirmation ])
  end
end
