module Api
  module V1
    class HttpCodesController < ApplicationController
      def index
        http_codes = HttpCode.includes(:haikus).order(:code).map do |code|
          top_haiku = code.haikus.sort_by { |h| [ -h.vote_count, h.created_at ] }.first
          {
            id: code.id,
            code: code.code,
            description: code.description,
            category: code.category,
            top_haiku: top_haiku&.as_json(only: [ :id, :content, :author_name, :vote_count, :user_id ])
          }
        end

        render json: { http_codes: http_codes }
      end

      def show
        http_code = HttpCode.find_by!(code: params[:code])
        top_haikus = http_code.haikus.order(vote_count: :desc, created_at: :asc).limit(20)

        render json: {
          http_code: {
            id: http_code.id,
            code: http_code.code,
            description: http_code.description,
            category: http_code.category,
            haikus: top_haikus.as_json(only: [ :id, :content, :author_name, :vote_count, :user_id, :created_at ])
          }
        }
      end
    end
  end
end
