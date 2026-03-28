module Api
  module V1
    class HaikusController < ApplicationController
      before_action :require_authentication, only: [ :create, :update, :destroy ]
      before_action :set_haiku, only: [ :update, :destroy, :vote ]
      before_action :require_ownership, only: [ :update, :destroy ]
      before_action :throttle_haiku_create, only: :create
      before_action :throttle_vote, only: :vote

      def create
        http_code = HttpCode.find_by!(code: haiku_params[:http_code])
        haiku = http_code.haikus.build(
          content: haiku_params[:content],
          user: current_user
        )

        if haiku.save
          render json: {
            haiku: haiku.as_json(only: [ :id, :content, :author_name, :vote_count, :user_id, :created_at ])
          }, status: :created
        else
          render json: {
            errors: haiku.errors.full_messages
          }, status: :unprocessable_entity
        end
      end

      def update
        if @haiku.update(update_params)
          render json: {
            haiku: @haiku.as_json(only: [ :id, :content, :author_name, :vote_count, :user_id, :created_at ])
          }, status: :ok
        else
          render json: {
            errors: @haiku.errors.full_messages
          }, status: :unprocessable_entity
        end
      end

      def destroy
        @haiku.destroy
        render json: { message: "Haiku deleted" }, status: :ok
      end

      def daily
        count = Haiku.count
        return render json: { error: "No haikus yet" }, status: :not_found if count.zero?

        offset = Random.new(Date.today.jd).rand(count)
        haiku = Haiku.includes(:http_code).offset(offset).first

        render json: {
          haiku: haiku.as_json(only: [ :id, :content, :author_name, :vote_count, :user_id ])
                    .merge(http_code: haiku.http_code.as_json(only: [ :code, :description ]))
        }, status: :ok
      end

      def vote
        voter_token = session[:voter_token] ||= SecureRandom.uuid

        existing_vote = @haiku.votes.find_by(session_id: voter_token)

        if existing_vote
          render json: {
            error: "You have already voted on this haiku"
          }, status: :unprocessable_entity
        else
          @haiku.votes.create!(
            session_id: voter_token,
            ip_address: request.remote_ip
          )

          render json: {
            haiku: @haiku.reload.as_json(only: [ :id, :content, :author_name, :vote_count, :user_id ])
          }, status: :ok
        end
      end

      private

      def throttle_haiku_create
        count = Rails.cache.increment("rl:haiku_create:#{current_user.id}", 1, expires_in: 1.hour) || 1
        if count > 10
          render json: { error: "Too many haikus submitted. Please try again later." }, status: :too_many_requests
        end
      end

      def throttle_vote
        count = Rails.cache.increment("rl:vote:#{request.remote_ip}", 1, expires_in: 1.hour) || 1
        if count > 30
          render json: { error: "Too many votes cast. Please try again later." }, status: :too_many_requests
        end
      end

      def set_haiku
        @haiku = Haiku.find(params[:id])
      end

      def require_ownership
        unless @haiku.user_id == current_user.id
          render json: { error: "Forbidden" }, status: :forbidden
        end
      end

      def haiku_params
        params.expect(haiku: [ :http_code, :content ])
      end

      def update_params
        params.expect(haiku: [ :content ])
      end
    end
  end
end
