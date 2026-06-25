export type MonthOption = {
  value: string;
  label: string;
};

const SEASON_START = 5;
const SEASON_END = 9;

function monthValue(year: number, month: number) {
  return `${year}-${String(month).padStart(2, '0')}-01`;
}

function monthLabel(year: number, month: number) {
  return new Date(year, month - 1, 1).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });
}

function seasonYear(now = new Date()) {
  const month = now.getMonth() + 1;
  return month > SEASON_END ? now.getFullYear() + 1 : now.getFullYear();
}

export function getCampingMonths(now = new Date()): MonthOption[] {
  const year = seasonYear(now);
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  return Array.from({ length: SEASON_END - SEASON_START + 1 }, (_, i) => {
    const month = SEASON_START + i;
    return {
      value: monthValue(year, month),
      label: monthLabel(year, month),
    };
  }).filter(({ value }) => {
    const [optionYear, optionMonth] = value.split('-').map(Number);
    return optionYear > currentYear || (optionYear === currentYear && optionMonth >= currentMonth);
  });
}

export function defaultCampingMonth(now = new Date()) {
  const year = seasonYear(now);
  const month = now.getMonth() + 1;

  if (month < SEASON_START) return monthValue(year, SEASON_START);
  if (month > SEASON_END) return monthValue(year, SEASON_START);
  return monthValue(year, month);
}

export function formatMonthLabel(startDate: string) {
  const [year, month] = startDate.split('-').map(Number);
  return monthLabel(year, month);
}
