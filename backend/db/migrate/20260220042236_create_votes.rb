class CreateVotes < ActiveRecord::Migration[8.0]
  def change
    create_table :votes do |t|
      t.references :haiku, null: false, foreign_key: true
      t.string :session_id, null: false
      t.inet :ip_address

      t.timestamps
    end

    add_index :votes, [ :haiku_id, :session_id ], unique: true
    add_index :votes, :session_id
  end
end
