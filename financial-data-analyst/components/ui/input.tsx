// @ts-nocheck

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

// Input component
const inputVariants = cva(
    "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
    {
        variants: {
            variant: {
                default: "bg-background",
                filled: "bg-muted",
            },
            size: {
                default: "h-9 px-3 py-1",
                sm: "h-8 px-2 text-xs",
                lg: "h-10 px-4",
            },
        },
        defaultVariants: {
            variant: "default",
            size: "default",
        },
    }
)

export interface InputProps
    extends React.InputHTMLAttributes<HTMLInputElement>,
        VariantProps<typeof inputVariants> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
    ({ className, variant, size, ...props }, ref) => {
        return (
            <input
                className={cn(inputVariants({ variant, size, className }))}
                ref={ref}
                {...props}
            />
        )
    }
)
Input.displayName = "Input"

// Label component
const labelVariants = cva(
    "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
    {
        variants: {
            variant: {
                default: "",
                required: "after:content-['*'] after:ml-0.5 after:text-red-500",
            },
        },
        defaultVariants: {
            variant: "default",
        },
    }
)

export interface LabelProps
    extends React.LabelHTMLAttributes<HTMLLabelElement>,
        VariantProps<typeof labelVariants> {}

const Label = React.forwardRef<HTMLLabelElement, LabelProps>(
    ({ className, variant, ...props }, ref) => {
        return (
            <label
                className={cn(labelVariants({ variant, className }))}
                ref={ref}
                {...props}
            />
        )
    }
)
Label.displayName = "Label"

export { Input, Label, inputVariants, labelVariants }