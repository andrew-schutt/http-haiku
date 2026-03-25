class Api::V1::UsersController < ApplicationController
  before_action :require_authentication, only: [:me]

  def create
    user = User.new(user_params)
    if user.save
      session[:user_id] = user.id
      render json: { user: user.as_json(only: [:id, :email, :username]) }, status: :created
    else
      render json: { errors: user.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def me
    render json: { user: current_user.as_json(only: [:id, :email, :username]) }
  end

  private

  def user_params
    params.expect(user: [:email, :username, :password, :password_confirmation])
  end
end
