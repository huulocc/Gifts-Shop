export function moneyToString(value: { toString(): string } | number | string | null | undefined): string {
  if (value === null || value === undefined || value === '') return '0.00';
  return Number(value.toString()).toFixed(2);
}

export function multiplyMoney(unitPrice: { toString(): string } | number | string, quantity: number): string {
  return (Number(unitPrice.toString()) * quantity).toFixed(2);
}
