class Api::V1::Admin::HaikusController < ApplicationController
  before_action :require_authentication
  before_action :require_admin

  def index
    haikus = Haiku.includes(:http_code, :user).order(created_at: :desc)
    render json: { haikus: haikus.map { |h| haiku_json(h) } }
  end

  def destroy
    haiku = Haiku.find(params[:id])
    haiku.destroy!
    head :no_content
  end

  private

  def haiku_json(haiku)
    haiku.as_json(only: [:id, :content, :author_name, :vote_count, :created_at]).merge(
      http_code: haiku.http_code.as_json(only: [:code, :description]),
      user: haiku.user.as_json(only: [:id, :username])
    )
  end
end
