class Api::V1::UsersController < ApplicationController
  before_action :require_authentication, only: [ :me ]
  before_action :throttle_registration, only: :create

  def show
    user = User.find_by!(username: params[:username])
    haikus = user.haikus.includes(:http_code).order(vote_count: :desc)
    total_votes = haikus.sum(:vote_count)

    render json: {
      user: user.as_json(only: [ :id, :username, :created_at ]),
      haikus: haikus.map { |h|
        h.as_json(only: [ :id, :content, :author_name, :vote_count, :created_at ])
         .merge(http_code: h.http_code.as_json(only: [ :code, :description ]))
      },
      total_votes: total_votes
    }
  end

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
