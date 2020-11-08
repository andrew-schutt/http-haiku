# frozen_string_literal: true

class HttpStatusCodesController < ApplicationController
  def index
    @http_status_codes = HttpStatusCode.all
  end

  def show
    @http_status_code = HttpStatusCode.find(params[:id])
  end
end
