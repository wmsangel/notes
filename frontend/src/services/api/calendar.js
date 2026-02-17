// frontend/src/services/api/calendar.js
import api from '@/config/api'

export const calendarApi = {
  getAll() {
    return api.get('/calendar/events')
  },
  getUpcoming(days = 7, includeCompleted = false) {
    return api.get('/calendar/upcoming', { params: { days, include_completed: includeCompleted ? 1 : 0 } })
  },
  create(data) {
    return api.post('/calendar/events', data)
  },
  update(id, data) {
    return api.put(`/calendar/events/${id}`, data)
  },
  delete(id) {
    return api.delete(`/calendar/events/${id}`)
  },
  setOccurrenceComplete(eventId, occurrenceDate, completed) {
    return api.post('/calendar/occurrences/complete', {
      event_id: eventId,
      occurrence_date: occurrenceDate,
      completed: !!completed
    })
  }
}
