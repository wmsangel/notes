-- Колонки защиты заметок паролем (если таблица создана без них)
-- Выполните по очереди; если колонка уже есть — будет ошибка "Duplicate column", можно пропустить эту строку.

ALTER TABLE notes ADD COLUMN is_protected BOOLEAN DEFAULT FALSE;
ALTER TABLE notes ADD COLUMN protection_password VARCHAR(255) NULL;
ALTER TABLE notes ADD COLUMN protection_hint VARCHAR(500) NULL;
