// src/components/ui/select.tsx
"use client"

import * as React from "react"
import { ChevronDown, Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"

export interface SelectOption {
  value: string
  label: string
  disabled?: boolean
}

export interface SelectProps {
  value: string
  onValueChange: (value: string) => void
  placeholder?: string
  options: SelectOption[]
  disabled?: boolean
  className?: string
  id?: string
  error?: boolean
}

export const Select = React.forwardRef<HTMLDivElement, SelectProps>(
  ({ value, onValueChange, placeholder = "Pilih opsi", options, disabled, className, id, error }, ref) => {
    const [open, setOpen] = React.useState(false)
    const selectRef = React.useRef<HTMLDivElement>(null)

    // Menggabungkan referensi
    React.useImperativeHandle(ref, () => selectRef.current as HTMLDivElement)

    // Tangani klik di luar untuk menutup dropdown
    React.useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
          setOpen(false)
        }
      }

      document.addEventListener("mousedown", handleClickOutside)
      return () => {
        document.removeEventListener("mousedown", handleClickOutside)
      }
    }, [])

    // Temukan opsi yang dipilih
    const selectedOption = options.find(option => option.value === value)

    return (
      <div 
        ref={selectRef}
        className={cn(
          "relative",
          className
        )}
      >
        <button
          type="button"
          id={id}
          onClick={() => !disabled && setOpen(!open)}
          className={cn(
            "flex h-10 w-full items-center justify-between rounded-md border bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
            error ? "border-red-300" : "border-input",
            disabled && "opacity-50 cursor-not-allowed"
          )}
          disabled={disabled}
          aria-expanded={open}
          aria-haspopup="listbox"
        >
          <span className="flex-1 text-left truncate">
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <ChevronDown className={cn("h-4 w-4 opacity-50 transition-transform", open && "transform rotate-180")} />
        </button>

        {open && (
          <motion.div 
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.2 }}
            className="absolute z-50 w-full min-w-[8rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md mt-1"
          >
            <ul className="max-h-60 overflow-auto p-1" role="listbox">
              {options.map((option) => (
                <motion.li
                  key={option.value}
                  role="option"
                  aria-selected={value === option.value}
                  onClick={() => {
                    if (!option.disabled) {
                      onValueChange(option.value)
                      setOpen(false)
                    }
                  }}
                  whileHover={{ backgroundColor: 'rgba(0, 0, 0, 0.05)' }}
                  className={cn(
                    "relative flex cursor-pointer select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors",
                    value === option.value ? "bg-accent text-accent-foreground" : "hover:bg-accent/50",
                    option.disabled && "opacity-50 cursor-not-allowed"
                  )}
                >
                  <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
                    {value === option.value && <Check className="h-4 w-4" />}
                  </span>
                  <span className="truncate">{option.label}</span>
                </motion.li>
              ))}
            </ul>
          </motion.div>
        )}
      </div>
    )
  }
)

Select.displayName = "Select"