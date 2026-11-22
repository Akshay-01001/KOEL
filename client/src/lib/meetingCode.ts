// Meeting codes look like "abc-defg-hij" (see generateMeetingCode on the server).
const MEETING_CODE_PATTERN = /[a-z]{3}-[a-z]{4}-[a-z]{3}/;

// Pulls a meeting code out of whatever was typed or pasted: a bare code or a
// full meeting link. Returns null if there isn't one.
export function parseMeetingCode(input: string) {
    const match = input.trim().toLowerCase().match(MEETING_CODE_PATTERN);
    return match ? match[0] : null;
}

export function getMeetingPath(meetingCode: string) {
    return `/meet/${meetingCode}`;
}

export function getMeetingLink(meetingCode: string) {
    return `${window.location.origin}${getMeetingPath(meetingCode)}`;
}
