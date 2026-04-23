"use client"
import * as React from "react"
import { Input } from "./input"

interface CurrencyInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> {
  value: string;
  onValueChange: (value: string) => void;
}

export function CurrencyInput({ value, onValueChange, className, ...props }: CurrencyInputProps) {
  const formatValue = (val: string) => {
    if (!val) return ""
    const numericValue = val.replace(/[^0-9]/g, "")
    if (!numericValue) return ""
    return new Intl.NumberFormat('en-IN').format(Number(numericValue))
  }

  const [displayValue, setDisplayValue] = React.useState(formatValue(value))

  React.useEffect(() => {
    setDisplayValue(formatValue(value))
  }, [value])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/[^0-9]/g, "")
    setDisplayValue(formatValue(rawValue))
    onValueChange(rawValue) // pass raw numeric string back up
  }

  return (
    <Input
      {...props}
      type="text"
      value={displayValue}
      onChange={handleChange}
      className={className}
    />
  )
}
