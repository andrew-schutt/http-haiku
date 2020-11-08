class CreateWriters < ActiveRecord::Migration[6.0]
  def change
    create_table :writers do |t|
      t.string :email
      t.string :firstname
      t.string :lastname

      t.timestamps
    end
  end
end
