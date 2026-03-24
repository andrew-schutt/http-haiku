class CreateHaikus < ActiveRecord::Migration[8.0]
  def change
    create_table :haikus do |t|
      t.references :http_code, null: false, foreign_key: true
      t.text :content, null: false
      t.string :author_name
      t.integer :vote_count, default: 0, null: false

      t.timestamps
    end

    add_index :haikus, [:http_code_id, :vote_count]
  end
end
