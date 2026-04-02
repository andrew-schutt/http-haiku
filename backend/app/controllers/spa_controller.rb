class SpaController < ActionController::Base
  def index
    index_path = Rails.root.join("public/index.html")
    if index_path.exist?
      send_file index_path, type: "text/html", disposition: "inline"
    else
      render plain: "Frontend not built. Run 'npm run build' in the frontend directory.", status: :ok
    end
  end
end
