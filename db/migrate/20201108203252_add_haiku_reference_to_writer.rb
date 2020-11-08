class AddHaikuReferenceToWriter < ActiveRecord::Migration[6.0]
  def change
    add_column :haikus, :writer_id, :integer¬
  end
end
