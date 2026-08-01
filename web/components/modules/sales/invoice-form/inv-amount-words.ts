const ONES = [
  '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
  'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
  'Seventeen', 'Eighteen', 'Nineteen',
];

const TENS = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

function chunkToWords(n: number): string {
  if (n === 0) return '';
  if (n < 20) return ONES[n];
  if (n < 100) {
    const tens = Math.floor(n / 10);
    const ones = n % 10;
    return `${TENS[tens]}${ones ? ` ${ONES[ones]}` : ''}`.trim();
  }
  if (n < 1000) {
    const hundreds = Math.floor(n / 100);
    const rest = n % 100;
    return `${ONES[hundreds]} Hundred${rest ? ` ${chunkToWords(rest)}` : ''}`.trim();
  }
  if (n < 100000) {
    const thousands = Math.floor(n / 1000);
    const rest = n % 1000;
    return `${chunkToWords(thousands)} Thousand${rest ? ` ${chunkToWords(rest)}` : ''}`.trim();
  }
  if (n < 10000000) {
    const lakhs = Math.floor(n / 100000);
    const rest = n % 100000;
    return `${chunkToWords(lakhs)} Lakh${rest ? ` ${chunkToWords(rest)}` : ''}`.trim();
  }
  const crores = Math.floor(n / 10000000);
  const rest = n % 10000000;
  return `${chunkToWords(crores)} Crore${rest ? ` ${chunkToWords(rest)}` : ''}`.trim();
}

export function amountToWordsTaka(amount: number): string {
  const safe = Math.max(0, Number(amount) || 0);
  const whole = Math.floor(safe);
  const fraction = Math.round((safe - whole) * 100);

  if (whole === 0 && fraction === 0) return 'Zero Taka Only';

  let words = whole > 0 ? `${chunkToWords(whole)} Taka` : '';
  if (fraction > 0) {
    words += words ? ` and ${chunkToWords(fraction)} Poisha` : `${chunkToWords(fraction)} Poisha`;
  }
  return `${words} Only`;
}
