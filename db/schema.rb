# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `rails
# db:schema:load`. When creating a new database, `rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema.define(version: 2020_11_08_203252) do

  create_table "haikus", force: :cascade do |t|
    t.string "title"
    t.string "line1"
    t.string "line2"
    t.string "line3"
    t.integer "http_status_code_id", null: false
    t.datetime "created_at", precision: 6, null: false
    t.datetime "updated_at", precision: 6, null: false
    t.integer "writer_id"
    t.index ["http_status_code_id"], name: "index_haikus_on_http_status_code_id"
  end

  create_table "http_status_codes", force: :cascade do |t|
    t.integer "code"
    t.string "description"
    t.string "name"
    t.string "category"
    t.datetime "created_at", precision: 6, null: false
    t.datetime "updated_at", precision: 6, null: false
  end

  create_table "writers", force: :cascade do |t|
    t.string "email"
    t.string "firstname"
    t.string "lastname"
    t.datetime "created_at", precision: 6, null: false
    t.datetime "updated_at", precision: 6, null: false
  end

  add_foreign_key "haikus", "http_status_codes"
end
