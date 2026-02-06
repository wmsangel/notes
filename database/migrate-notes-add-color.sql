-- Add color label to notes
ALTER TABLE notes
ADD COLUMN color VARCHAR(7) DEFAULT NULL AFTER is_pinned;
