HttpStatusCodeConstants::CODES.each do |code|
  http_code = HttpStatusCode.new(
    code: code,
    description: 'test value',
    name: "#{code} code",
    category: "#{code[0]}xx"
  )
  http_code.save!
end