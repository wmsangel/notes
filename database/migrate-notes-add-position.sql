-- Ручная сортировка заметок (drag-and-drop)
ALTER TABLE notes ADD COLUMN position INT NULL DEFAULT NULL AFTER updated_at;
CREATE INDEX idx_position ON notes (position);
