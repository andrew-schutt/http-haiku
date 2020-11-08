class CreateHaikus < ActiveRecord::Migration[6.0]
  def change
    create_table :haikus do |t|
      t.string :title
      t.string :line1
      t.string :line2
      t.string :line3
      t.references :http_status_code, null: false, foreign_key: true

      t.timestamps
    end
  end
end
