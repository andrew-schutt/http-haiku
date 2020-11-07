class CreateHttpStatusCodes < ActiveRecord::Migration[6.0]
  def change
    create_table :http_status_codes do |t|
      t.integer :code
      t.string :description
      t.string :name
      t.string :category

      t.timestamps
    end
  end
end
