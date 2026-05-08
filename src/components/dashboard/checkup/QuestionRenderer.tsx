import { useState } from "react";
import { Info, ChevronDown } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import type { Question } from "./form-schema";
import { HAS_NOTES } from "./form-schema";
import { getQuestionInfo } from "./explanations";
import DentalChartFDI from "./DentalChartFDI";
import BodyMap from "./BodyMap";

interface Props {
  question: Question;
  value: any;
  note: string;
  onValueChange: (v: any) => void;
  onNoteChange: (n: string) => void;
}

export default function QuestionRenderer({ question, value, note, onValueChange, onNoteChange }: Props) {
  const renderInput = () => {
    switch (question.type) {
      case "radio_si_no":
        return (
          <RadioGroup
            value={value ?? ""}
            onValueChange={onValueChange}
            className="flex gap-4"
          >
            {["SI", "NO"].map((opt) => (
              <div key={opt} className="flex items-center gap-1.5">
                <RadioGroupItem value={opt} id={`${question.id}-${opt}`} />
                <Label htmlFor={`${question.id}-${opt}`} className="text-sm font-normal cursor-pointer">
                  {opt}
                </Label>
              </div>
            ))}
          </RadioGroup>
        );

      case "radio":
        return (
          <RadioGroup
            value={value ?? ""}
            onValueChange={onValueChange}
            className="flex flex-col gap-1.5"
          >
            {question.options?.map((opt) => (
              <div key={opt} className="flex items-center gap-2">
                <RadioGroupItem value={opt} id={`${question.id}-${opt}`} />
                <Label htmlFor={`${question.id}-${opt}`} className="text-sm font-normal cursor-pointer">
                  {opt}
                </Label>
              </div>
            ))}
          </RadioGroup>
        );

      case "multi_checkbox": {
        const arr: string[] = Array.isArray(value) ? value : [];
        return (
          <div className="flex flex-col gap-1.5">
            {question.options?.map((opt) => (
              <div key={opt} className="flex items-center gap-2">
                <Checkbox
                  id={`${question.id}-${opt}`}
                  checked={arr.includes(opt)}
                  onCheckedChange={(c) => {
                    if (c) onValueChange([...arr, opt]);
                    else onValueChange(arr.filter((o) => o !== opt));
                  }}
                />
                <Label htmlFor={`${question.id}-${opt}`} className="text-sm font-normal cursor-pointer">
                  {opt}
                </Label>
              </div>
            ))}
          </div>
        );
      }

      case "radio_scale_1_10":
        return (
          <div className="flex flex-wrap gap-1">
            {Array.from({ length: 11 }, (_, i) => i).map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => onValueChange(n)}
                className={`w-8 h-8 rounded text-xs font-mono border transition-colors ${
                  value === n
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background border-border hover:border-primary/50"
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        );

      case "textarea":
        return (
          <Textarea
            value={value ?? ""}
            onChange={(e) => onValueChange(e.target.value)}
            placeholder="Scrivi qui..."
            rows={3}
            className="text-base md:text-sm"
          />
        );

      case "numeric_kg":
        return (
          <div className="flex items-center gap-2">
            <Input
              type="number"
              step="0.1"
              value={value ?? ""}
              onChange={(e) => onValueChange(e.target.value === "" ? "" : Number(e.target.value))}
              className="w-32 text-base md:text-sm"
              placeholder="0"
            />
            <span className="text-sm text-muted-foreground">Kg</span>
          </div>
        );

      case "dental_chart_fdi":
        return (
          <DentalChartFDI
            value={Array.isArray(value) ? value : []}
            onChange={onValueChange}
          />
        );

      case "body_map":
        return (
          <BodyMap
            value={Array.isArray(value) ? value : []}
            onChange={onValueChange}
          />
        );
    }
  };

  const hasNotes = HAS_NOTES(question.type);
  const isFullWidth = question.type === "textarea" || question.type === "dental_chart_fdi" || question.type === "body_map";

  return (
    <div className="border-b border-border py-3 first:pt-1">
      <Label className="block text-sm font-medium text-foreground mb-2">{question.label}</Label>
      {isFullWidth ? (
        renderInput()
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-[65%_35%] gap-3 items-start">
          <div>{renderInput()}</div>
          {hasNotes && (
            <Textarea
              value={note ?? ""}
              onChange={(e) => onNoteChange(e.target.value)}
              placeholder="Note..."
              rows={2}
              className="text-base md:text-sm bg-muted/30"
            />
          )}
        </div>
      )}
    </div>
  );
}
