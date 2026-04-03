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
                                &.merge(has_voted: voted_haiku_ids.include?(top_haiku.id))
          }
        end

        render json: { http_codes: http_codes }
      end

      def haiku
        http_code = HttpCode.find_by!(code: params[:code])
        candidate = http_code.haikus.order(vote_count: :desc, created_at: :asc).limit(10).sample

        if candidate.nil?
          render json: { error: "No haikus found for this code" }, status: :not_found
        else
          render json: {
            code: http_code.code,
            description: http_code.description,
            haiku: candidate.content,
            author: candidate.author_name
          }
        end
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
            haikus: top_haikus.map { |h|
              h.as_json(only: [ :id, :content, :author_name, :vote_count, :user_id, :created_at ])
               .merge(has_voted: voted_haiku_ids.include?(h.id))
            }
          }
        }
      end
    end
  end
end
