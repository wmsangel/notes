// frontend/src/services/api/calendar.js
import api from '@/config/api'

export const calendarApi = {
  getAll() {
    return api.get('/calendar/events')
  },
  getUpcoming(days = 7) {
    return api.get('/calendar/upcoming', { params: { days } })
  },
  create(data) {
    return api.post('/calendar/events', data)
  },
  update(id, data) {
    return api.put(`/calendar/events/${id}`, data)
  },
  delete(id) {
    return api.delete(`/calendar/events/${id}`)
  }
}
