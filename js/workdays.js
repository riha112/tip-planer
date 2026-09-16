function workdaysLeftUntil(targetDate) {
  const now = new Date();
  const target = new Date(targetDate);

  let count = 0;
  const date = new Date(now);
  date.setHours(0, 0, 0, 0);

  while (date <= target) {
    const day = date.getDay();
    const isWeekend = day === 0 || day === 6;
    const isToday = date.toDateString() === now.toDateString();

    if (!isWeekend) {
      // Don't count today if work has already ended
      if (!isToday || now.getHours() < 18) {
        count++;
      }
    }

    date.setDate(date.getDate() + 1);
  }

  return count;
}
