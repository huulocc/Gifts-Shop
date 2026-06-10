export function QuantityStepper({
  value,
  min = 1,
  max = 99,
  onChange,
  disabled = false,
  label = "Quantity",
  id,
}) {
  const numericValue = Number(value || min);

  function setNext(nextValue) {
    const parsed = Number(nextValue);
    if (!Number.isInteger(parsed)) {
      onChange(nextValue);
      return;
    }
    onChange(Math.min(Math.max(parsed, min), max));
  }

  return (
    <div className="quantity-stepper" aria-label={label}>
      <button
        type="button"
        onClick={() => setNext(numericValue - 1)}
        disabled={disabled || numericValue <= min}
        aria-label="Decrease quantity"
      >
        -
      </button>
      <input
        id={id}
        type="number"
        min={min}
        max={max}
        value={value}
        disabled={disabled}
        onChange={(event) => setNext(event.target.value)}
        aria-label={label}
      />
      <button
        type="button"
        onClick={() => setNext(numericValue + 1)}
        disabled={disabled || numericValue >= max}
        aria-label="Increase quantity"
      >
        +
      </button>
    </div>
  );
}
