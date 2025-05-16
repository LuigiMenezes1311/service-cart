"use client"

import { RadioGroup } from "@/components/ui/radio-group"
import { Badge } from "@/components/ui/badge"

interface PaymentFormSelectorProps {
  selectedForm: "recorrente" | "avista"
  onFormSelect: (form: "recorrente" | "avista") => void
}

export function PaymentFormSelector({ selectedForm, onFormSelect }: PaymentFormSelectorProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div 
        className={`rounded-lg border-2 p-4 cursor-pointer ${
          selectedForm === "recorrente" 
            ? "border-primary bg-primary/5" 
            : "border-muted hover:bg-accent/5"
        }`}
        onClick={() => onFormSelect("recorrente")}
      >
        <div className="flex items-start gap-2">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-medium">Recorrente</h3>
              <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                Recomendado
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Cobrança recorrente de acordo com o período escolhido.
            </p>
          </div>
        </div>
      </div>
      
      <div 
        className={`rounded-lg border-2 p-4 cursor-pointer ${
          selectedForm === "avista" 
            ? "border-primary bg-primary/5" 
            : "border-muted hover:bg-accent/5"
        }`}
        onClick={() => onFormSelect("avista")}
      >
        <div className="flex items-start gap-2">
          <div>
            <h3 className="font-medium">À Vista</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Pagamento único do valor total do contrato.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
} 