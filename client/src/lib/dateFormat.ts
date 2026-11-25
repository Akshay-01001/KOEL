// Koel shows every date as DD/MM/YYYY and every time as HH:MM (24-hour), the
// same way people type them into the schedule form.

export const DATE_PLACEHOLDER = "DD/MM/YYYY";
export const TIME_PLACEHOLDER = "HH:MM";

const pad = (value: number) => {
    return String(value).padStart(2, "0");
};

// "23/11/2026"
export function formatDate(date: Date) {
    return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}`;
}

// "23/11", for places too narrow for the year.
export function formatDayMonth(date: Date) {
    return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}`;
}

// "09:05", "21:30"
export function formatTime(date: Date) {
    return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export const isSameDay = (a: Date, b: Date) => {
    return (
        a.getFullYear() === b.getFullYear() &&
        a.getMonth() === b.getMonth() &&
        a.getDate() === b.getDate()
    );
};

// Shapes typed text into fixed-size digit groups, e.g. [2, 2, 4] with "/" for a
// date. Separators are added as each group fills. A separator typed after a
// single digit pads that group instead: "9:" -> "09", "2/" -> "02".
const maskDigitGroups = (raw: string, sizes: number[], separator: string) => {
    const groups = [""];
    for (const char of raw) {
        const index = groups.length - 1;
        const size = sizes[index];
        if (/\d/.test(char)) {
            if (groups[index].length < size) {
                groups[index] += char;
            } else if (index < sizes.length - 1) {
                groups.push(char);
            } else {
                break;
            }
        } else if (groups[index].length > 0 && index < sizes.length - 1) {
            groups[index] = groups[index].padStart(size, "0");
            groups.push("");
        }
    }
    return groups.filter(Boolean).join(separator);
};

// For the date field while typing: "2311" -> "23/11", "2/11/2026" -> "02/11/2026".
export function maskDateInput(raw: string) {
    return maskDigitGroups(raw, [2, 2, 4], "/");
}

// For the time fields while typing: "0930" -> "09:30", "9:30" -> "09:30".
export function maskTimeInput(raw: string) {
    return maskDigitGroups(raw, [2, 2], ":");
}

// "23/11/2026" -> its parts, or null if it isn't a complete, real date.
export function parseDate(value: string) {
    const match = value.trim().match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (!match) return null;
    const day = Number(match[1]);
    const month = Number(match[2]);
    const year = Number(match[3]);
    const date = new Date(year, month - 1, day);
    const isReal =
        date.getFullYear() === year &&
        date.getMonth() === month - 1 &&
        date.getDate() === day;
    return isReal ? { year, month, day } : null;
}

// "09:30" -> its parts, or null if it isn't a complete 24-hour time.
export function parseTime(value: string) {
    const match = value.trim().match(/^(\d{2}):(\d{2})$/);
    if (!match) return null;
    const hours = Number(match[1]);
    const minutes = Number(match[2]);
    if (hours > 23 || minutes > 59) return null;
    return { hours, minutes };
}
