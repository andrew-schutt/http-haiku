class Api::V1::SessionsController < ApplicationController
  before_action :throttle_login, only: :create

  def create
    user = User.find_by_normalized_email(session_params[:email])
    if user&.authenticate(session_params[:password])
      session[:user_id] = user.id
      render json: { user: user.as_json(only: [:id, :email, :username]) }
    else
      render json: { error: "Invalid email or password" }, status: :unauthorized
    end
  end

  def destroy
    session.delete(:user_id)
    render json: { message: "Logged out successfully" }
  end

  private

  def throttle_login
    count = Rails.cache.increment("rl:login:#{request.remote_ip}", 1, expires_in: 1.minute) || 1
    if count > 10
      render json: { error: "Too many login attempts. Please try again later." }, status: :too_many_requests
    end
  end

  def session_params
    params.expect(session: [:email, :password])
  end
end
