class ConvertStringColumnsToText < ActiveRecord::Migration[8.0]
  def change
    change_column :haikus, :author_name, :text
    change_column :http_codes, :category, :text
    change_column :votes, :session_id, :text
  end
end
