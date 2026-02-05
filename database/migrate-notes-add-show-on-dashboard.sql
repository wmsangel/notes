-- Добавить колонку show_on_dashboard для отображения заметки на главной
ALTER TABLE notes ADD COLUMN show_on_dashboard TINYINT(1) NOT NULL DEFAULT 0 AFTER is_pinned;
ALTER TABLE notes ADD INDEX idx_show_on_dashboard (show_on_dashboard);
