CREATE TABLE IF NOT EXISTS calendar_event_occurrences (
  event_id INT NOT NULL,
  occurrence_date DATE NOT NULL,
  completed_at DATETIME NULL,
  PRIMARY KEY (event_id, occurrence_date),
  CONSTRAINT fk_calendar_occ_event
    FOREIGN KEY (event_id) REFERENCES calendar_events(id)
    ON DELETE CASCADE
);
