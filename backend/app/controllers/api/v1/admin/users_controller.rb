class Api::V1::Admin::UsersController < ApplicationController
  before_action :require_authentication
  before_action :require_admin

  def index
    users = User.order(created_at: :desc)
    render json: { users: users.as_json(only: [ :id, :email, :username, :is_admin, :created_at ]) }
  end

  def destroy
    user = User.find(params[:id])
    render json: { error: "Cannot delete yourself" }, status: :unprocessable_entity and return if user == current_user
    user.destroy!
    head :no_content
  end
end
