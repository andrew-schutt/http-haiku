require "rails_helper"

RSpec.describe "OG endpoints", type: :request do
  let!(:http_code) { HttpCode.create!(code: 404, description: "Not Found", category: "client_error") }
  let(:user) { FactoryBot.create(:user) }
  let!(:haiku) { FactoryBot.create(:haiku, http_code: http_code, user: user, vote_count: 5) }

  describe "GET /og/code/:code" do
    context "when rsvg-convert succeeds" do
      before do
        fake_status = instance_double(Process::Status, success?: true)
        allow(Open3).to receive(:capture3).and_return([ "\x89PNG fake", "", fake_status ])
      end

      it "returns a PNG image" do
        get "/og/code/404"
        expect(response).to have_http_status(:ok)
        expect(response.content_type).to include("image/png")
      end

      it "uses a specific haiku when ?haiku= param is provided" do
        get "/og/code/404?haiku=#{haiku.id}"
        expect(response).to have_http_status(:ok)
        expect(response.content_type).to include("image/png")
      end
    end

    context "when rsvg-convert is unavailable" do
      before do
        fake_status = instance_double(Process::Status, success?: false)
        allow(Open3).to receive(:capture3).and_return([ "", "error", fake_status ])
      end

      it "falls back to SVG" do
        get "/og/code/404"
        expect(response).to have_http_status(:ok)
        expect(response.content_type).to include("image/svg+xml")
        expect(response.body).to include("<svg")
        expect(response.body).to include("404")
      end
    end

    it "returns 404 for an unknown code" do
      get "/og/code/9999"
      expect(response).to have_http_status(:not_found)
    end
  end

  describe "GET /code/:code" do
    context "with a bot user agent" do
      let(:bot_headers) { { "HTTP_USER_AGENT" => "Slackbot-LinkExpanding 1.0 (+https://api.slack.com/robots)" } }

      it "returns OG meta HTML" do
        get "/code/404", headers: bot_headers
        expect(response).to have_http_status(:ok)
        expect(response.content_type).to include("text/html")
        expect(response.body).to include('property="og:image"')
        expect(response.body).to include('property="og:title"')
        expect(response.body).to include("404")
        expect(response.body).to include("Not Found")
      end

      it "includes the haiku content in the OG description" do
        get "/code/404", headers: bot_headers
        expect(response.body).to include("An old silent pond")
      end

      it "includes the haiku ID in OG URLs when ?haiku= param is provided" do
        get "/code/404?haiku=#{haiku.id}", headers: bot_headers
        expect(response.body).to include("haiku=#{haiku.id}")
      end

      it "falls back to top haiku when ?haiku= references a nonexistent haiku" do
        get "/code/404?haiku=9999999", headers: bot_headers
        expect(response).to have_http_status(:ok)
        expect(response.body).to include("An old silent pond")
      end

      it "handles a Twitterbot user agent" do
        get "/code/404", headers: { "HTTP_USER_AGENT" => "Twitterbot/1.0" }
        expect(response.body).to include('property="og:image"')
      end

      it "handles a facebookexternalhit user agent" do
        get "/code/404", headers: { "HTTP_USER_AGENT" => "facebookexternalhit/1.1" }
        expect(response.body).to include('property="og:image"')
      end
    end

    context "with a regular browser user agent" do
      it "returns 200 (serves the SPA)" do
        get "/code/404"
        expect(response).to have_http_status(:ok)
        expect(response.body).not_to include('property="og:image"')
      end
    end

    context "when the code does not exist" do
      it "returns 200 and serves the SPA (React router handles the 404)" do
        get "/code/9999"
        expect(response).to have_http_status(:ok)
      end
    end
  end

  describe "GET *path (SPA catch-all)" do
    it "returns 200 for arbitrary HTML paths" do
      get "/some/random/path"
      expect(response).to have_http_status(:ok)
    end
  end
end
