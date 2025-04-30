
import {
    startOfMonth,
    endOfMonth,
    startOfWeek,
    addDays,
    format,
    getISOWeek,
    getYear,
    isSameMonth,
} from "date-fns";

export function getWeeksOfCurrentMonth() {
    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);

    const weeks = [];
    let currentWeekStart = startOfWeek(monthStart, { weekStartsOn: 1 }); // lunedì

    while (currentWeekStart <= monthEnd) {
        const currentWeekEnd = addDays(currentWeekStart, 6);
        const weekNumber = getISOWeek(currentWeekStart);
        const year = getYear(currentWeekStart);
        const docId = `${year}-W${String(weekNumber).padStart(2, "0")}`;
        const label = `${format(currentWeekStart, "dd/MM")}–${format(currentWeekEnd, "dd/MM")}`;

        if (isSameMonth(currentWeekStart, now) || isSameMonth(currentWeekEnd, now)) {
            weeks.push({ docId, label });
        }

        currentWeekStart = addDays(currentWeekStart, 7);
    }

    return weeks;
}