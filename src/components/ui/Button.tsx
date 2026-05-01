import type { ButtonHTMLAttributes } from 'react'

type ButtonVariant = 'primary' | 'ghost' | 'menu' | 'danger'

const BUTTON_CLASSES: Record<ButtonVariant, string> = {
  primary: 'btn-primary',
  ghost: 'btn-ghost',
  menu: 'menu-link',
  danger: 'menu-link danger',
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
}

export function Button({ variant = 'primary', className, ...props }: ButtonProps) {
  const classes = [BUTTON_CLASSES[variant], className].filter(Boolean).join(' ')
  return <button className={classes} {...props} />
}
