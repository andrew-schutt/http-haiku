class HttpStatusCodesController < ApplicationController
  def index
    @http_status_codes = HttpStatusCode.all
  end

  def show
  end
end
