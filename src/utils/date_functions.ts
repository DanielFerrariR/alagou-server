type Day = string | number
type Month = string | number
type Hours = string | number
type Minutes = string | number

interface Options {
  omitHours: boolean
}

/**
 * Formats a date.
 * @param date - The `date` to be formatted
 * @returns A string formatted as `DD:MM:YYYY HH:mm` or `DD:MM:YYYY`
 */
const formatDate = (date: Date, options?: Options): string => {
  let day: Day = date.getDate()
  let month: Month = date.getMonth() + 1
  const year = date.getFullYear()
  let hours: Hours = date.getHours()
  let minutes: Minutes = date.getMinutes()

  day = day < 10 ? `0${day}` : day

  month = month < 10 ? `0${month}` : month

  hours = hours < 10 ? `0${hours}` : hours

  minutes = minutes < 10 ? `0${minutes}` : minutes

  if (options?.omitHours) {
    return `${day}/${month}/${year}`
  }

  return `${day}/${month}/${year} ${hours}:${minutes}`
}

const getDateForRange = (date: Date): number => {
  let day: Day = date.getDate()
  let month: Month = date.getMonth() + 1
  const year = date.getFullYear()

  day = day < 10 ? `0${day}` : day

  month = month < 10 ? `0${month}` : month

  return Number(`${year}${month}${day}`)
}

/**
 * Verify if the date is in the given range
 * @param currentDate - The `currentDate` to be compared
 * @param startDate - The `startDate` to be compared
 * @param endDate - The `endDate` to be compared
 * @returns A boolean with `true` if the date is in the range and `false` if not
 */
const isDateInRange = (
  currentDate: Date,
  startDate: Date,
  endDate: Date
): boolean => {
  const newCurrentDate = getDateForRange(new Date(currentDate))
  const newStartDate = getDateForRange(new Date(startDate))
  const newEndDate = getDateForRange(new Date(endDate))

  if (newCurrentDate >= newStartDate && newCurrentDate <= newEndDate) {
    return true
  }
  return false
}

export { formatDate, isDateInRange }
