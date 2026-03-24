# HTTP Status Codes Seed Data
# Based on RFC specifications and common usage

http_codes_data = [
  # 1xx Informational
  { code: 100, description: "Continue", category: "informational" },
  { code: 101, description: "Switching Protocols", category: "informational" },
  { code: 102, description: "Processing", category: "informational" },
  { code: 103, description: "Early Hints", category: "informational" },

  # 2xx Success
  { code: 200, description: "OK", category: "success" },
  { code: 201, description: "Created", category: "success" },
  { code: 202, description: "Accepted", category: "success" },
  { code: 203, description: "Non-Authoritative Information", category: "success" },
  { code: 204, description: "No Content", category: "success" },
  { code: 205, description: "Reset Content", category: "success" },
  { code: 206, description: "Partial Content", category: "success" },
  { code: 207, description: "Multi-Status", category: "success" },
  { code: 208, description: "Already Reported", category: "success" },
  { code: 226, description: "IM Used", category: "success" },

  # 3xx Redirection
  { code: 300, description: "Multiple Choices", category: "redirection" },
  { code: 301, description: "Moved Permanently", category: "redirection" },
  { code: 302, description: "Found", category: "redirection" },
  { code: 303, description: "See Other", category: "redirection" },
  { code: 304, description: "Not Modified", category: "redirection" },
  { code: 305, description: "Use Proxy", category: "redirection" },
  { code: 307, description: "Temporary Redirect", category: "redirection" },
  { code: 308, description: "Permanent Redirect", category: "redirection" },

  # 4xx Client Error
  { code: 400, description: "Bad Request", category: "client_error" },
  { code: 401, description: "Unauthorized", category: "client_error" },
  { code: 402, description: "Payment Required", category: "client_error" },
  { code: 403, description: "Forbidden", category: "client_error" },
  { code: 404, description: "Not Found", category: "client_error" },
  { code: 405, description: "Method Not Allowed", category: "client_error" },
  { code: 406, description: "Not Acceptable", category: "client_error" },
  { code: 407, description: "Proxy Authentication Required", category: "client_error" },
  { code: 408, description: "Request Timeout", category: "client_error" },
  { code: 409, description: "Conflict", category: "client_error" },
  { code: 410, description: "Gone", category: "client_error" },
  { code: 411, description: "Length Required", category: "client_error" },
  { code: 412, description: "Precondition Failed", category: "client_error" },
  { code: 413, description: "Payload Too Large", category: "client_error" },
  { code: 414, description: "URI Too Long", category: "client_error" },
  { code: 415, description: "Unsupported Media Type", category: "client_error" },
  { code: 416, description: "Range Not Satisfiable", category: "client_error" },
  { code: 417, description: "Expectation Failed", category: "client_error" },
  { code: 418, description: "I'm a teapot", category: "client_error" },
  { code: 421, description: "Misdirected Request", category: "client_error" },
  { code: 422, description: "Unprocessable Content", category: "client_error" },
  { code: 423, description: "Locked", category: "client_error" },
  { code: 424, description: "Failed Dependency", category: "client_error" },
  { code: 425, description: "Too Early", category: "client_error" },
  { code: 426, description: "Upgrade Required", category: "client_error" },
  { code: 428, description: "Precondition Required", category: "client_error" },
  { code: 429, description: "Too Many Requests", category: "client_error" },
  { code: 431, description: "Request Header Fields Too Large", category: "client_error" },
  { code: 451, description: "Unavailable For Legal Reasons", category: "client_error" },

  # 5xx Server Error
  { code: 500, description: "Internal Server Error", category: "server_error" },
  { code: 501, description: "Not Implemented", category: "server_error" },
  { code: 502, description: "Bad Gateway", category: "server_error" },
  { code: 503, description: "Service Unavailable", category: "server_error" },
  { code: 504, description: "Gateway Timeout", category: "server_error" },
  { code: 505, description: "HTTP Version Not Supported", category: "server_error" },
  { code: 506, description: "Variant Also Negotiates", category: "server_error" },
  { code: 507, description: "Insufficient Storage", category: "server_error" },
  { code: 508, description: "Loop Detected", category: "server_error" },
  { code: 510, description: "Not Extended", category: "server_error" },
  { code: 511, description: "Network Authentication Required", category: "server_error" }
]

puts "Seeding HTTP status codes..."

http_codes_data.each do |data|
  HttpCode.find_or_create_by!(code: data[:code]) do |http_code|
    http_code.description = data[:description]
    http_code.category = data[:category]
  end
end

puts "Created #{HttpCode.count} HTTP status codes"

# ---------------------------------------------------------------------------
# Haiku Seed Data
# ---------------------------------------------------------------------------
# Control how many haikus per code are seeded:
#   HAIKU_COUNT=2 rails db:seed   # seeds up to 2 haikus per code
#   HAIKU_COUNT=0 rails db:seed   # seeds no haikus (same as haikus:clear)
#   rails db:seed                 # seeds all haikus (default)
# ---------------------------------------------------------------------------

haikus_per_code = ENV.key?("HAIKU_COUNT") ? ENV["HAIKU_COUNT"].to_i : nil

haiku_data = {
  200 => [
    { content: "Request received well\nAll systems working as planned\nThe server smiles back", author: "DevPoet" },
    { content: "Two hundred returns\nEvery field you hoped to see\nPeace across the wire", author: "WebBard" },
    { content: "Nothing went awry\nYour call was heard and answered\nSuccess, plain and clean", author: nil },
  ],
  201 => [
    { content: "Born from your request\nA new resource now exists\nWelcome to the world", author: "DevPoet" },
    { content: "You asked, it was made\nA record lives in storage\nThe database grows", author: nil },
    { content: "From nothing, something\nYour data now persists here\nCreation complete", author: "WebBard" },
  ],
  204 => [
    { content: "Done but silence speaks\nThe action needs no reply\nEmpty is enough", author: "WebBard" },
    { content: "No body follows\nYet the work was done in full\nLess is sometimes more", author: nil },
  ],
  301 => [
    { content: "This place is no more\nFollow the new path I give\nDo not come back here", author: "WebBard" },
    { content: "Update your bookmarks\nI have left this address now\nForward, ever on", author: nil },
  ],
  304 => [
    { content: "Nothing has changed here\nUse what you already have\nCache saves us both time", author: "DevPoet" },
    { content: "Your copy still holds\nI checked and found no difference\nSave the bandwidth, friend", author: "WebBard" },
  ],
  400 => [
    { content: "I tried to parse you\nBut your syntax made no sense\nPlease try again, friend", author: nil },
    { content: "Malformed and unclear\nI cannot process this mess\nFix it and return", author: "DevPoet" },
    { content: "You sent me garbled\nWords I could not understand\nSpeak clearly next time", author: "WebBard" },
  ],
  401 => [
    { content: "Who goes there, stranger\nShow me your credentials first\nI must know your name", author: "GateKeeper" },
    { content: "The door remains closed\nAuthenticate yourself now\nThen we can proceed", author: "DevPoet" },
    { content: "You have not proven\nThat you are who you claim to\nKey please, then enter", author: nil },
  ],
  403 => [
    { content: "I know who you are\nBut you cannot pass through here\nThis is not your path", author: "GateKeeper" },
    { content: "Credentials correct\nYet the path remains barred shut\nNot all doors open", author: "WebBard" },
    { content: "Authenticated\nYet authorization fails\nRank has its limits", author: "DevPoet" },
  ],
  404 => [
    { content: "Searched high and low here\nNothing matches what you asked\nIt simply is not", author: "WebBard" },
    { content: "This page has vanished\nLike smoke into morning air\nNothing left to see", author: "DevPoet" },
    { content: "The address you seek\nExists in no record here\nPerhaps it once was", author: nil },
    { content: "Gone like autumn leaves\nNo trace of what you seek here\nThe void answers you", author: "HaikuBot" },
  ],
  405 => [
    { content: "You may GET from here\nBut POST is not permitted now\nRead the docs again", author: "DevPoet" },
    { content: "Wrong verb for this door\nNot every method applies\nCheck your allowed list", author: "WebBard" },
  ],
  408 => [
    { content: "You took too long, friend\nI gave up waiting for you\nConnect faster please", author: nil },
    { content: "The silence stretched long\nI waited but you never\nFinished what you start", author: "DevPoet" },
  ],
  409 => [
    { content: "Two truths collide here\nThe state you send fights the state\nSomething must give way", author: "WebBard" },
    { content: "Your edit conflicts\nWith a change already made\nResolve, then retry", author: "DevPoet" },
  ],
  410 => [
    { content: "It was here before\nNow gone without a return\nDo not look again", author: nil },
    { content: "Unlike four oh four\nThis one will not come back here\nRemove your bookmark", author: "WebBard" },
  ],
  418 => [
    { content: "Short and stout am I\nBrewing tea, not HTTP\nWrong appliance, friend", author: "Teapot" },
    { content: "I am not a server\nI am a humble teapot\nCoffee? Wrong device", author: "RFC2324" },
    { content: "Hyper Text Transfer\nProtocol? I make Earl Grey\nCheck your endpoints, friend", author: "DevPoet" },
  ],
  422 => [
    { content: "The syntax was fine\nBut semantics failed the check\nMeaning matters more", author: "WebBard" },
    { content: "I parsed what you sent\nBut logic within it fails\nContent makes no sense", author: "DevPoet" },
  ],
  429 => [
    { content: "Slow down, please calm down\nYou are flooding all my lanes\nWait and try again", author: "RateLimiter" },
    { content: "Fifteen per second\nYou flood every lane I have\nBreathe, then come back slow", author: "DevPoet" },
    { content: "Patience is a gift\nYou have asked too many times\nThe gate closes now", author: "WebBard" },
  ],
  500 => [
    { content: "Something broke inside\nThe error was not your fault\nWe are looking now", author: "OnCallEng" },
    { content: "The stack trace scrolls long\nSomewhere deep a nil explodes\nPagers start to buzz", author: "DevPoet" },
    { content: "It worked yesterday\nNow the logs fill up with flames\nBlame the last deploy", author: nil },
  ],
  502 => [
    { content: "I asked upstream but\nGot nonsense in reply back\nChain of broken links", author: "WebBard" },
    { content: "The proxy whispers\nTo a service that responds\nIn a tongue unknown", author: "DevPoet" },
  ],
  503 => [
    { content: "Down for maintenance\nOr crushed under heavy load\nPlease come back later", author: nil },
    { content: "Too many at once\nThe wheels have ground to a halt\nScaling takes a while", author: "DevPoet" },
    { content: "We are at capacity\nThe hamsters need a break now\nTry again at dawn", author: "WebBard" },
  ],
  504 => [
    { content: "I asked upstream friend\nAnd waited, and waited, and\nSilence was the gift", author: "DevPoet" },
    { content: "The upstream is slow\nMy patience has a limit set\nTimeout fires at last", author: "WebBard" },
  ],
}

if haikus_per_code == 0
  puts "Skipping haiku seeding (HAIKU_COUNT=0)"
else
  puts "Clearing existing haikus..."
  Haiku.destroy_all

  puts "Seeding haikus#{haikus_per_code ? " (#{haikus_per_code} per code)" : ""}..."

  haiku_data.each do |code, haikus|
    http_code = HttpCode.find_by(code: code)
    next unless http_code

    subset = haikus_per_code ? haikus.first(haikus_per_code) : haikus
    subset.each do |h|
      http_code.haikus.create!(content: h[:content], author_name: h[:author])
    end
  end

  puts "Created #{Haiku.count} haikus across #{haiku_data.keys.count} HTTP codes"
end
