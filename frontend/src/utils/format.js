export function formatNumber(num, digits = 0) {
  if (num === null || num === undefined || isNaN(num)) {
    return '-';
  }
  const number = Number(num);
  return number.toLocaleString('zh-CN', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

export function formatPercent(num, digits = 1) {
  if (num === null || num === undefined || isNaN(num)) {
    return '-';
  }
  return `${(Number(num) * 100).toFixed(digits)}%`;
}

export function formatMoney(num, symbol = '¥') {
  if (num === null || num === undefined || isNaN(num)) {
    return '-';
  }
  const number = Number(num);
  const absNum = Math.abs(number);
  const formatted = absNum.toLocaleString('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return number < 0 ? `-${symbol}${formatted}` : `${symbol}${formatted}`;
}

export function formatDate(date, format = 'YYYY-MM-DD') {
  if (!date) return '-';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '-';
  
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');

  return format
    .replace('YYYY', year)
    .replace('MM', month)
    .replace('DD', day)
    .replace('HH', hours)
    .replace('mm', minutes)
    .replace('ss', seconds);
}

export function formatDays(days) {
  if (days === null || days === undefined || isNaN(days)) {
    return '-';
  }
  return `${Math.round(Number(days))}天`;
}
