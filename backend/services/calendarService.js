// backend/services/calendarService.js
import db from '../config/database.js'

function toDate(val) {
    return val ? new Date(val) : null
}

function addDays(date, days) {
    const d = new Date(date)
    d.setDate(d.getDate() + days)
    return d
}

function addWeeks(date, weeks) {
    return new Date(date.getTime() + weeks * 7 * 24 * 60 * 60 * 1000)
}

/** Следующий будний день (Пн–Пт). Суббота → понедельник, воскресенье → понедельник. */
function nextWeekday(date) {
    const d = new Date(date)
    d.setDate(d.getDate() + 1)
    const day = d.getDay()
    if (day === 0) d.setDate(d.getDate() + 1)
    if (day === 6) d.setDate(d.getDate() + 2)
    return d
}

function isWeekday(date) {
    const d = date.getDay()
    return d >= 1 && d <= 5
}

/** Ближайший будний день (сегодня или следующий Пн, если сейчас сб/вс). */
function toNextWeekday(date) {
    const d = new Date(date)
    const day = d.getDay()
    if (day === 0) return addDays(d, 1)
    if (day === 6) return addDays(d, 2)
    return d
}

function addMonthsClamped(date, months) {
    const d = new Date(date)
    const day = d.getDate()
    const target = new Date(d)
    target.setDate(1)
    target.setMonth(target.getMonth() + months)
    const daysInMonth = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate()
    target.setDate(Math.min(day, daysInMonth))
    target.setHours(d.getHours(), d.getMinutes(), d.getSeconds(), d.getMilliseconds())
    return target
}

function addYearsClamped(date, years) {
    return addMonthsClamped(date, years * 12)
}

function isSameDay(a, b) {
    return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

function generateOccurrences(event, rangeStart, rangeEnd) {
    const start = toDate(event.start_at)
    if (!start) return []
    const end = toDate(event.end_at)
    const durationMs = end ? Math.max(0, end.getTime() - start.getTime()) : 0
    const freq = event.frequency || 'none'
    const interval = Math.max(1, parseInt(event.interval_value || 1, 10))

    const occurrences = []
    const pushOccurrence = (d) => {
        const endAt = durationMs ? new Date(d.getTime() + durationMs) : null
        occurrences.push({
            id: event.id,
            title: event.title,
            description: event.description || null,
            start_at: d,
            end_at: endAt,
            frequency: freq,
            interval_value: interval,
            is_today: isSameDay(d, new Date()),
            source_event_id: event.id
        })
    }

    if (freq === 'none') {
        if (start >= rangeStart && start <= rangeEnd) pushOccurrence(start)
        return occurrences
    }

    let current = start

    if (freq === 'daily') {
        const step = interval * 24 * 60 * 60 * 1000
        if (current < rangeStart) {
            const diff = rangeStart.getTime() - start.getTime()
            const k = Math.ceil(diff / step)
            current = new Date(start.getTime() + k * step)
        }
        while (current <= rangeEnd) {
            if (current >= rangeStart) pushOccurrence(current)
            current = addDays(current, interval)
        }
        return occurrences
    }

    if (freq === 'weekdays') {
        current = toNextWeekday(current)
        while (current <= rangeEnd) {
            if (current >= rangeStart) pushOccurrence(current)
            current = nextWeekday(current)
        }
        return occurrences
    }

    if (freq === 'weekly') {
        const diff = rangeStart.getTime() - start.getTime()
        if (diff > 0) {
            const step = interval * 7 * 24 * 60 * 60 * 1000
            const k = Math.floor(diff / step)
            current = addWeeks(start, k * interval)
            if (current < rangeStart) current = addWeeks(current, interval)
        }
        while (current <= rangeEnd) {
            if (current >= rangeStart) pushOccurrence(current)
            current = addWeeks(current, interval)
        }
        return occurrences
    }

    if (freq === 'monthly') {
        const monthsDiff = (rangeStart.getFullYear() - start.getFullYear()) * 12 + (rangeStart.getMonth() - start.getMonth())
        if (monthsDiff > 0) {
            const k = Math.floor(monthsDiff / interval)
            current = addMonthsClamped(start, k * interval)
            if (current < rangeStart) current = addMonthsClamped(current, interval)
        }
        while (current <= rangeEnd) {
            if (current >= rangeStart) pushOccurrence(current)
            current = addMonthsClamped(current, interval)
        }
        return occurrences
    }

    if (freq === 'yearly') {
        const yearsDiff = rangeStart.getFullYear() - start.getFullYear()
        if (yearsDiff > 0) {
            const k = Math.floor(yearsDiff / interval)
            current = addYearsClamped(start, k * interval)
            if (current < rangeStart) current = addYearsClamped(current, interval)
        }
        while (current <= rangeEnd) {
            if (current >= rangeStart) pushOccurrence(current)
            current = addYearsClamped(current, interval)
        }
        return occurrences
    }

    return occurrences
}

export const calendarService = {
    async getAll() {
        try {
            const [rows] = await db.query('SELECT * FROM calendar_events ORDER BY start_at DESC')
            return rows
        } catch (err) {
            const msg = String(err.message || '')
            if (/calendar_events|doesn\\'t exist|ER_NO_SUCH_TABLE/i.test(msg)) {
                return []
            }
            throw err
        }
    },

    async create(data) {
        const { title, description, start_at, end_at, frequency, interval_value } = data
        const freq = ['none', 'daily', 'weekdays', 'weekly', 'monthly', 'yearly'].includes(frequency) ? frequency : 'none'
        const interval = Math.max(1, parseInt(interval_value || 1, 10))
        try {
            const [result] = await db.query(
                `INSERT INTO calendar_events (title, description, start_at, end_at, frequency, interval_value)
       VALUES (?, ?, ?, ?, ?, ?)`,
                [title, description || null, start_at, end_at || null, freq, interval]
            )
            const [rows] = await db.query('SELECT * FROM calendar_events WHERE id = ?', [result.insertId])
            return rows[0]
        } catch (err) {
            const msg = String(err.message || '')
            if (/calendar_events|doesn\\'t exist|ER_NO_SUCH_TABLE/i.test(msg)) {
                const e = new Error('Calendar migrations not applied')
                e.code = 'ER_MIGRATION_NEEDED'
                throw e
            }
            throw err
        }
    },

    async update(id, data) {
        const updates = []
        const values = []
        if (data.title !== undefined) {
            updates.push('title = ?')
            values.push(data.title)
        }
        if (data.description !== undefined) {
            updates.push('description = ?')
            values.push(data.description || null)
        }
        if (data.start_at !== undefined) {
            updates.push('start_at = ?')
            values.push(data.start_at)
        }
        if (data.end_at !== undefined) {
            updates.push('end_at = ?')
            values.push(data.end_at || null)
        }
        if (data.frequency !== undefined) {
            const freq = ['none', 'daily', 'weekdays', 'weekly', 'monthly', 'yearly'].includes(data.frequency) ? data.frequency : 'none'
            updates.push('frequency = ?')
            values.push(freq)
        }
        if (data.interval_value !== undefined) {
            const interval = Math.max(1, parseInt(data.interval_value || 1, 10))
            updates.push('interval_value = ?')
            values.push(interval)
        }
        try {
            if (!updates.length) {
                const [rows] = await db.query('SELECT * FROM calendar_events WHERE id = ?', [id])
                return rows[0]
            }
            values.push(id)
            await db.query(`UPDATE calendar_events SET ${updates.join(', ')} WHERE id = ?`, values)
            const [rows] = await db.query('SELECT * FROM calendar_events WHERE id = ?', [id])
            return rows[0]
        } catch (err) {
            const msg = String(err.message || '')
            if (/calendar_events|doesn\\'t exist|ER_NO_SUCH_TABLE/i.test(msg)) {
                const e = new Error('Calendar migrations not applied')
                e.code = 'ER_MIGRATION_NEEDED'
                throw e
            }
            throw err
        }
    },

    async delete(id) {
        try {
            await db.query('DELETE FROM calendar_events WHERE id = ?', [id])
            return { success: true }
        } catch (err) {
            const msg = String(err.message || '')
            if (/calendar_events|doesn\\'t exist|ER_NO_SUCH_TABLE/i.test(msg)) {
                const e = new Error('Calendar migrations not applied')
                e.code = 'ER_MIGRATION_NEEDED'
                throw e
            }
            throw err
        }
    },

    async getUpcoming(days = 7) {
        const now = new Date()
        const rangeStart = new Date(now)
        rangeStart.setHours(0, 0, 0, 0)
        const rangeEnd = new Date(rangeStart)
        rangeEnd.setDate(rangeEnd.getDate() + days)
        rangeEnd.setHours(23, 59, 59, 999)

        let rows = []
        try {
            const result = await db.query(
                `SELECT * FROM calendar_events
       WHERE frequency <> 'none'
          OR (start_at BETWEEN ? AND ?)
       ORDER BY start_at ASC`,
                [rangeStart, rangeEnd]
            )
            rows = result[0]
        } catch (err) {
            const msg = String(err.message || '')
            if (/calendar_events|doesn\\'t exist|ER_NO_SUCH_TABLE/i.test(msg)) {
                return []
            }
            throw err
        }

        const occurrences = []
        for (const row of rows) {
            occurrences.push(...generateOccurrences(row, rangeStart, rangeEnd))
        }

        return occurrences
            .filter(o => o.start_at >= rangeStart && o.start_at <= rangeEnd)
            .sort((a, b) => a.start_at.getTime() - b.start_at.getTime())
            .map(o => ({
                ...o,
                start_at: o.start_at.toISOString(),
                end_at: o.end_at ? o.end_at.toISOString() : null
            }))
    }
}
