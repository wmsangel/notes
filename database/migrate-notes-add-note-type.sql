-- Добавляем тип заметки: 'note' (обычная) или 'page' (страница с режимом просмотра/редактирования)
-- Выполнить для существующих БД, где колонки note_type ещё нет.
ALTER TABLE notes
ADD COLUMN note_type VARCHAR(20) NOT NULL DEFAULT 'note' AFTER content;
