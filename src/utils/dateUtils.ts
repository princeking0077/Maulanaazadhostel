export function formatDateDDMonthYYYY(dateInput: string | Date): string {
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (isNaN(date.getTime())) return '';
  const day = date.getDate().toString().padStart(2, '0');
  const month = date.toLocaleString('en-GB', { month: 'long' });
  const year = date.getFullYear();
  return `${day} ${month} ${year}`;
}

export function calculateAcademicPeriodEnd(joiningDate: string | Date, months: number = 10): Date {
  const d = typeof joiningDate === 'string' ? new Date(joiningDate) : new Date(joiningDate.getTime());
  d.setMonth(d.getMonth() + months);
  return d;
}

export function getRemainingPeriod(endDate: string | Date): { monthsRemaining: number; daysRemaining: number } {
  const end = typeof endDate === 'string' ? new Date(endDate) : endDate;
  const now = new Date();
  if (isNaN(end.getTime())) return { monthsRemaining: 0, daysRemaining: 0 };
  const diffMs = end.getTime() - now.getTime();
  const days = Math.max(Math.floor(diffMs / (1000 * 60 * 60 * 24)), 0);
  const months = Math.max(Math.floor(days / 30), 0);
  return { monthsRemaining: months, daysRemaining: days };
}
