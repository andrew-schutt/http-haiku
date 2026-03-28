# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema[8.0].define(version: 2026_03_27_000000) do
  # These are extensions that must be enabled in order to support this database
  enable_extension "pg_catalog.plpgsql"

  create_table "haikus", force: :cascade do |t|
    t.bigint "http_code_id", null: false
    t.text "content", null: false
    t.text "author_name"
    t.integer "vote_count", default: 0, null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.bigint "user_id", null: false
    t.index ["http_code_id", "vote_count"], name: "index_haikus_on_http_code_id_and_vote_count"
    t.index ["http_code_id"], name: "index_haikus_on_http_code_id"
    t.index ["user_id"], name: "index_haikus_on_user_id"
  end

  create_table "http_codes", force: :cascade do |t|
    t.integer "code", null: false
    t.text "description", null: false
    t.text "category", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["category"], name: "index_http_codes_on_category"
    t.index ["code"], name: "index_http_codes_on_code", unique: true
  end

  create_table "users", force: :cascade do |t|
    t.text "email", null: false
    t.text "username", null: false
    t.text "password_digest", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.boolean "is_admin", default: false, null: false
    t.index ["email"], name: "index_users_on_email", unique: true
    t.index ["username"], name: "index_users_on_username", unique: true
  end

  create_table "votes", force: :cascade do |t|
    t.bigint "haiku_id", null: false
    t.text "session_id", null: false
    t.inet "ip_address"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["haiku_id", "session_id"], name: "index_votes_on_haiku_id_and_session_id", unique: true
    t.index ["haiku_id"], name: "index_votes_on_haiku_id"
    t.index ["session_id"], name: "index_votes_on_session_id"
  end

  add_foreign_key "haikus", "http_codes"
  add_foreign_key "haikus", "users"
  add_foreign_key "votes", "haikus"
end
