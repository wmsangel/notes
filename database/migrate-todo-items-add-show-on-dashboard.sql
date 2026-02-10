-- Add show_on_dashboard flag to todo items
ALTER TABLE todo_items
ADD COLUMN show_on_dashboard BOOLEAN DEFAULT FALSE AFTER is_completed;
