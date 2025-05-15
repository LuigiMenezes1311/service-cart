import type * as React from "react"
import { cn } from "@/lib/utils"

interface StepsProps extends React.HTMLAttributes<HTMLDivElement> {
  steps: {
    id: string
    name: string
    description?: string
    hidden?: boolean
  }[]
  activeStep: number
}

export function Steps({ steps, activeStep, className, ...props }: StepsProps) {
  return (
    <div className={cn("w-full", className)} {...props}>
      <nav aria-label="Progress">
        <ol role="list" className="space-y-4 md:flex md:space-x-8 md:space-y-0">
          {steps.map(
            (step, index) =>
              !step.hidden && (
                <li key={step.id} className="md:flex-1">
                  <div
                    className={cn(
                      "group flex flex-col border-l-4 py-2 pl-4 md:border-l-0 md:border-t-4 md:pb-0 md:pl-0 md:pt-4",
                      index < activeStep
                        ? "border-primary"
                        : index === activeStep
                          ? "border-primary"
                          : "border-gray-200",
                    )}
                  >
                    <span
                      className={cn(
                        "text-sm font-medium",
                        index < activeStep ? "text-primary" : index === activeStep ? "text-primary" : "text-gray-500",
                      )}
                    >
                      {`Etapa ${index + 1}`}
                    </span>
                    <span
                      className={cn(
                        "text-sm font-medium",
                        index < activeStep ? "text-gray-900" : index === activeStep ? "text-gray-900" : "text-gray-500",
                      )}
                    >
                      {step.name}
                    </span>
                    {step.description && (
                      <span
                        className={cn(
                          "text-xs",
                          index < activeStep || index === activeStep ? "text-gray-500" : "text-gray-400",
                        )}
                      >
                        {step.description}
                      </span>
                    )}
                  </div>
                </li>
              ),
          )}
        </ol>
      </nav>
    </div>
  )
}

