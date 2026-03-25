module Api
  module V1
    class HaikusController < ApplicationController
      before_action :require_authentication, only: [:create]

      def create
        http_code = HttpCode.find_by!(code: haiku_params[:http_code])
        haiku = http_code.haikus.build(
          content: haiku_params[:content],
          user: current_user
        )

        if haiku.save
          render json: {
            haiku: haiku.as_json(only: [:id, :content, :author_name, :vote_count, :created_at])
          }, status: :created
        else
          render json: {
            errors: haiku.errors.full_messages
          }, status: :unprocessable_entity
        end
      end

      def daily
        count = Haiku.count
        return render json: { error: "No haikus yet" }, status: :not_found if count.zero?

        offset = Random.new(Date.today.jd).rand(count)
        haiku = Haiku.includes(:http_code).offset(offset).first

        render json: {
          haiku: haiku.as_json(only: [:id, :content, :author_name, :vote_count])
                    .merge(http_code: haiku.http_code.as_json(only: [:code, :description]))
        }, status: :ok
      end

      def vote
        haiku = Haiku.find(params[:id])

        voter_token = session[:voter_token] ||= SecureRandom.uuid

        # Check if session has already voted
        existing_vote = haiku.votes.find_by(session_id: voter_token)

        if existing_vote
          render json: {
            error: "You have already voted on this haiku"
          }, status: :unprocessable_entity
        else
          haiku.votes.create!(
            session_id: voter_token,
            ip_address: request.remote_ip
          )

          render json: {
            haiku: haiku.reload.as_json(only: [:id, :content, :author_name, :vote_count])
          }, status: :ok
        end
      end

      private

      def haiku_params
        params.expect(haiku: [:http_code, :content])
      end
    end
  end
end
