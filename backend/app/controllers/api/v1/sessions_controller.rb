class Api::V1::SessionsController < ApplicationController
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

  def session_params
    params.expect(session: [:email, :password])
  end
end
