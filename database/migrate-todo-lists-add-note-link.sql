-- Add single note link to todo lists
ALTER TABLE todo_lists
ADD COLUMN note_id INT NULL AFTER description;

ALTER TABLE todo_lists
ADD CONSTRAINT fk_todo_lists_note
FOREIGN KEY (note_id) REFERENCES notes(id) ON DELETE SET NULL;
