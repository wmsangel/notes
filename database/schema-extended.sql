-- database/schema-extended.sql
-- Дополнительные поля для новых функций

-- Добавляем поле для защиты паролем в заметки
ALTER TABLE notes
ADD COLUMN is_protected BOOLEAN DEFAULT FALSE AFTER tags,
ADD COLUMN protection_password VARCHAR(255) NULL AFTER is_protected,
ADD COLUMN protection_hint VARCHAR(500) NULL AFTER protection_password;

-- Цветная метка заметки
ALTER TABLE notes
ADD COLUMN color VARCHAR(7) DEFAULT NULL AFTER is_pinned;

-- Добавляем поля для меток/тегов в TODO листы
ALTER TABLE todo_lists
ADD COLUMN tags JSON AFTER description,
ADD COLUMN color VARCHAR(7) DEFAULT '#6366f1' AFTER tags;

-- Привязка заметки к списку задач (одна заметка)
ALTER TABLE todo_lists
ADD COLUMN note_id INT NULL AFTER description;

-- Создаем таблицу связи TODO задач с заметками
CREATE TABLE IF NOT EXISTS todo_note_links (
    id INT PRIMARY KEY AUTO_INCREMENT,
    todo_item_id INT NOT NULL,
    note_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (todo_item_id) REFERENCES todo_items(id) ON DELETE CASCADE,
    FOREIGN KEY (note_id) REFERENCES notes(id) ON DELETE CASCADE,
    UNIQUE KEY unique_link (todo_item_id, note_id),
    INDEX idx_todo (todo_item_id),
    INDEX idx_note (note_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Показывать задачу на главной
ALTER TABLE todo_items
ADD COLUMN show_on_dashboard BOOLEAN DEFAULT FALSE AFTER is_completed;

-- Создаем таблицу для тегов (опционально, для автокомплита)
CREATE TABLE IF NOT EXISTS tags (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL UNIQUE,
    color VARCHAR(7) DEFAULT '#6366f1',
    usage_count INT DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
