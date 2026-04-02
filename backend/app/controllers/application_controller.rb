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

  def current_voter_token
    session[:voter_token]
  end

  def voted_haiku_ids
    return @voted_haiku_ids ||= Set.new unless current_voter_token
    @voted_haiku_ids ||= Vote.where(session_id: current_voter_token).pluck(:haiku_id).to_set
  end
end
