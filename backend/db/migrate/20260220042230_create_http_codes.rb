class CreateHttpCodes < ActiveRecord::Migration[8.0]
  def change
    create_table :http_codes do |t|
      t.integer :code, null: false
      t.text :description, null: false
      t.string :category, null: false

      t.timestamps
    end

    add_index :http_codes, :code, unique: true
    add_index :http_codes, :category
  end
end
