-- Extend allowed values for calendar_events.frequency to support new recurrence types
ALTER TABLE calendar_events
  MODIFY COLUMN frequency ENUM('none', 'daily', 'weekdays', 'weekly', 'monthly', 'yearly') DEFAULT 'none';

