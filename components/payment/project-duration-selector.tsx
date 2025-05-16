"use client"

import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"

export interface OfferDuration {
  id: string;
  months: number;
  discountPercentage: number;
  // createdAt e updatedAt podem ser omitidos se não forem usados no componente
}

interface ProjectDurationSelectorProps {
  offerDurations: OfferDuration[]; // Nova prop
  selectedDurationId: string | null; // Alterado para ID para consistência
  onDurationSelect: (durationId: string) => void;
}

export function ProjectDurationSelector({ 
  offerDurations, 
  selectedDurationId, 
  onDurationSelect 
}: ProjectDurationSelectorProps) {
  return (
    <div className="space-y-2">
      <h3 className="text-base font-medium">Duração do projeto</h3>
      <RadioGroup 
        value={selectedDurationId || ""} 
        onValueChange={onDurationSelect} 
        className="flex flex-wrap gap-x-4 gap-y-2" // Ajustado para melhor responsividade
      >
        {offerDurations.map((duration) => (
          <div key={duration.id} className="flex items-center space-x-2">
            <RadioGroupItem value={duration.id} id={`duration-${duration.id}`} />
            <Label htmlFor={`duration-${duration.id}`} className="cursor-pointer">
              {duration.months} meses
              {duration.discountPercentage > 0 && (
                <span className="ml-1 text-xs text-green-600">
                  ({duration.discountPercentage}% off)
                </span>
              )}
            </Label>
          </div>
        ))}
      </RadioGroup>
      <p className="text-xs text-gray-500 mt-1">
        A duração do projeto afeta o valor total do contrato.
      </p>
    </div>
  )
} 