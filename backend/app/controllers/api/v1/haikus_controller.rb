module Api
  module V1
    class HaikusController < ApplicationController
      def create
        http_code = HttpCode.find_by!(code: haiku_params[:http_code])
        haiku = http_code.haikus.build(
          content: haiku_params[:content],
          author_name: haiku_params[:author_name].presence || "Anonymous"
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
        params.expect(haiku: [:http_code, :content, :author_name])
      end
    end
  end
end
