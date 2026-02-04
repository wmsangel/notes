-- Создать таблицу связи TODO задач с заметками (если её ещё нет).
-- Выполнить: mysql -h 127.0.0.1 -P 8889 -u root -p notes < database/migrate-todo-note-links.sql

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
