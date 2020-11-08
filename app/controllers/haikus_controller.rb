class HaikusController < ApplicationController
  def index
    @http_status_code = HttpStatusCode.find(params[:http_status_code_id])
    @haikus = @http_status_code.haikus
  end

  def new
    @http_status_code = HttpStatusCode.find(params[:http_status_code_id])
    @haiku = Haiku.new
  end

  def create
    @http_status_code = HttpStatusCode.find(params[:http_status_code_id])
    @haiku = @http_status_code.haikus.new(haiku_params)

    if @haiku.save
      redirect_to http_status_code_haikus_path(@http_status_code),
                  notice: "Thanks for your haiku, I'm sure it was written with care, Be sure to review"
    else
      render :new
    end
  end

  private

  def haiku_params
    params.require(:haiku).permit(:title, :line1, :line2, :line3)
  end
end
