class OgController < ActionController::Base
  BOT_PATTERNS = /Slackbot|Twitterbot|facebookexternalhit|LinkedInBot|WhatsApp|Discordbot|TelegramBot/i

  def show
    if bot_request?
      http_code = HttpCode.find_by!(code: params[:code].to_i)
      @http_code = http_code
      @haiku = params[:haiku] ? http_code.haikus.find_by(id: params[:haiku]) : nil
      @haiku ||= http_code.haikus.order(vote_count: :desc).first
      render :show, layout: false
    else
      serve_spa
    end
  rescue ActiveRecord::RecordNotFound
    serve_spa
  end

  def image
    http_code = HttpCode.find_by!(code: params[:code].to_i)
    @http_code = http_code
    @haiku = params[:haiku] ? http_code.haikus.find_by(id: params[:haiku]) : nil
    @haiku ||= http_code.haikus.order(vote_count: :desc).first

    svg = render_to_string(template: "og/image", formats: [ :svg ], layout: false)
    png = svg_to_png(svg)

    if png
      send_data png, type: "image/png", disposition: "inline"
    else
      render plain: svg, content_type: "image/svg+xml"
    end
  rescue ActiveRecord::RecordNotFound
    head :not_found
  end

  private

  def bot_request?
    request.user_agent.to_s.match?(BOT_PATTERNS)
  end

  def svg_to_png(svg)
    require "open3"
    out, _err, status = Open3.capture3(
      "rsvg-convert", "-w", "1200", "-h", "630", "--format", "png",
      stdin_data: svg
    )
    status.success? ? out : nil
  end

  def serve_spa
    index_path = Rails.root.join("public/index.html")
    if index_path.exist?
      send_file index_path, type: "text/html", disposition: "inline"
    else
      render plain: "Frontend not built. Run 'npm run build' in the frontend directory.", status: :ok
    end
  end
end
