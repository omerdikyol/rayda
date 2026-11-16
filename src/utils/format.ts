export function formatDuration(
  seconds: number,
  language: 'tr' | 'en'
): string {
  const totalMinutes = Math.max(1, Math.round(seconds / 60));
  if (totalMinutes < 60) {
    return `${totalMinutes} ${language === 'tr' ? 'dk' : 'min'}`;
  }
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return minutes === 0
    ? `${hours} ${language === 'tr' ? 'sa' : 'hr'}`
    : `${hours} ${language === 'tr' ? 'sa' : 'hr'} ${minutes} ${language === 'tr' ? 'dk' : 'min'}`;
}

export function formatMinutesAway(
  minutes: number,
  language: 'tr' | 'en'
): string {
  if (minutes <= 0) return language === 'tr' ? 'Şimdi' : 'Now';
  return `${minutes} ${language === 'tr' ? 'dk' : 'min'}`;
}
