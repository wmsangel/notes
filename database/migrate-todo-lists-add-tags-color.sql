-- Добавить колонки tags и color в todo_lists (если их ещё нет).
-- Выполнить: mysql -h 127.0.0.1 -P 8889 -u root -p notes < database/migrate-todo-lists-add-tags-color.sql

ALTER TABLE todo_lists ADD COLUMN tags JSON NULL AFTER description;
ALTER TABLE todo_lists ADD COLUMN color VARCHAR(7) DEFAULT '#6366f1' AFTER tags;
