import type { InputHTMLAttributes } from 'react'

type InputVariant = 'form' | 'name'

const INPUT_CLASSES: Record<InputVariant, string> = {
  form: 'form-input',
  name: 'name-input',
}

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  variant?: InputVariant
}

export function Input({ variant = 'form', className, ...props }: InputProps) {
  const classes = [INPUT_CLASSES[variant], className].filter(Boolean).join(' ')
  return <input className={classes} {...props} />
}
