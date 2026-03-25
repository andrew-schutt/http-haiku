class AddUserToHaikus < ActiveRecord::Migration[8.0]
  def change
    Vote.delete_all
    Haiku.delete_all
    add_reference :haikus, :user, null: false, foreign_key: true
  end
end
