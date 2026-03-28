class ApplicationController < ActionController::API
  include ActionController::Cookies

  def current_user
    @current_user ||= User.find_by(id: session[:user_id]) if session[:user_id]
  end

  def require_authentication
    render json: { error: "Authentication required" }, status: :unauthorized unless current_user
  end

  def require_admin
    render json: { error: "Forbidden" }, status: :forbidden unless current_user&.is_admin
  end
end
