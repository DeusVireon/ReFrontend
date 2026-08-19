import { useRefClock } from "@/stores/ReferenceClock";

export const formatShowTime = (isoString: string) => {
    if (!isoString) return "UNDEFINED TIME";
    const baseTimestamp = useRefClock.getState().getTime();
    const diffInSeconds = Math.floor((new Date(isoString).getTime() - baseTimestamp) / 1000);
    const rtf = new Intl.RelativeTimeFormat('zh-CN', { numeric: 'auto' });

    if (diffInSeconds > 0) return formatShowTimeStr(isoString);

    if (Math.abs(diffInSeconds) < 60) return rtf.format(Math.floor(diffInSeconds), 'second');
    if (Math.abs(diffInSeconds) < 3600) return rtf.format(Math.floor(diffInSeconds / 60), 'minute');
    if (Math.abs(diffInSeconds) < 86400) return rtf.format(Math.floor(diffInSeconds / 3600), 'hour');
    return rtf.format(Math.floor(diffInSeconds / 86400), 'day');
};

const formatShowTimeStr = (isoString: string, locale = 'zh-CN') => {
    if (!isoString) return '';
    const date = new Date(isoString);
    return new Intl.DateTimeFormat(locale, {
        year: 'numeric',
        month: '2-digit',  // '2-digit' -> "07", 'short' -> "7月"
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,     // 24小时制
    }).format(date);
};