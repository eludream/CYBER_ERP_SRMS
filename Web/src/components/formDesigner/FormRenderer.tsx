import { useState, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Star, Upload, Info, Search, Plus, Trash2, Repeat
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { FormSchema, FormFieldDefinition, ValidationRule } from "@/types/formDesigner";
import { toast } from "sonner";

// ── Props ───────────────────────────────────────────────────

interface FormRendererProps {
  schema: FormSchema;
  initialData?: Record<string, unknown>;
  onSubmit?: (data: Record<string, unknown>) => void;
  onSaveDraft?: (data: Record<string, unknown>) => void;
  readOnly?: boolean;
}

// ── Validation ──────────────────────────────────────────────

function validateField(field: FormFieldDefinition, value: unknown): string | null {
  for (const rule of field.validations) {
    switch (rule.type) {
      case "required":
        if (value === undefined || value === null || value === "") return rule.message;
        break;
      case "minLength":
        if (typeof value === "string" && value.length < (rule.value as number)) return rule.message;
        break;
      case "maxLength":
        if (typeof value === "string" && value.length > (rule.value as number)) return rule.message;
        break;
      case "min":
        if (typeof value === "number" && value < (rule.value as number)) return rule.message;
        break;
      case "max":
        if (typeof value === "number" && value > (rule.value as number)) return rule.message;
        break;
      case "pattern":
        if (typeof value === "string" && rule.value && !new RegExp(rule.value as string).test(value)) return rule.message;
        break;
      case "email":
        if (typeof value === "string" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return rule.message;
        break;
    }
  }
  return null;
}

// ── Main Renderer ───────────────────────────────────────────

const FormRenderer = ({ schema, initialData = {}, onSubmit, onSaveDraft, readOnly = false }: FormRendererProps) => {
  const [formData, setFormData] = useState<Record<string, unknown>>(initialData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Set<string>>(new Set());

  const setValue = (name: string, value: unknown) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    setTouched(prev => new Set(prev).add(name));
    // Clear error on change
    if (errors[name]) {
      setErrors(prev => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const validateAll = (): boolean => {
    const newErrors: Record<string, string> = {};
    const dataFields = schema.fields.filter(f => !["divider", "heading", "spacer", "infoPanel", "section", "tab", "columns"].includes(f.type));
    
    for (const field of dataFields) {
      if (field.hidden) continue;
      const error = validateField(field, formData[field.name]);
      if (error) newErrors[field.name] = error;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateAll()) {
      onSubmit?.(formData);
      toast.success(schema.settings.successMessage);
    } else {
      toast.error("Please fix the validation errors before submitting.");
    }
  };

  const handleSaveDraft = () => {
    onSaveDraft?.(formData);
    toast.success("Draft saved successfully!");
  };

  const { visibleFields, conditionalState } = useMemo(() => {
    const state: Record<string, { required?: boolean; disabled?: boolean }> = {};
    
    const visible = schema.fields.filter(f => {
      if (f.hidden) return false;
      if (!f.conditions || f.conditions.length === 0) return true;

      let shouldShow = true;
      for (const cond of f.conditions) {
        const val = formData[cond.fieldId];
        let matches = false;
        
        switch (cond.operator) {
          case "equals": matches = String(val) === String(cond.value); break;
          case "notEquals": matches = String(val) !== String(cond.value); break;
          case "contains": matches = typeof val === "string" && val.includes(String(cond.value)); break;
          case "greaterThan": matches = Number(val) > Number(cond.value); break;
          case "lessThan": matches = Number(val) < Number(cond.value); break;
          case "isEmpty": matches = !val && val !== 0; break;
          case "isNotEmpty": matches = !!val || val === 0; break;
        }

        switch (cond.action) {
          case "show": if (!matches) shouldShow = false; break;
          case "hide": if (matches) shouldShow = false; break;
          case "require":
            if (matches) state[f.name] = { ...state[f.name], required: true };
            break;
          case "disable":
            if (matches) state[f.name] = { ...state[f.name], disabled: true };
            break;
        }
      }
      return shouldShow;
    });

    return { visibleFields: visible, conditionalState: state };
  }, [schema.fields, formData]);

  return (
    <form onSubmit={handleSubmit} className="space-y-1">
      {visibleFields.map(field => {
        const condState = conditionalState[field.name];
        return (
          <FieldRenderer
            key={field.id}
            field={field}
            value={formData[field.name]}
            error={errors[field.name]}
            onChange={(v) => setValue(field.name, v)}
            readOnly={readOnly || field.readOnly}
            disabled={field.disabled || condState?.disabled}
            forceRequired={condState?.required}
          />
        );
      })}
      {/* Actions */}
      {!readOnly && (
        <>
          <Separator className="my-6" />
          <div className="flex items-center justify-end gap-3">
            {schema.settings.allowDraft && (
              <Button type="button" variant="outline" size="sm" onClick={handleSaveDraft}>
                {schema.settings.cancelButtonText || "Save Draft"}
              </Button>
            )}
            <Button type="submit" size="sm">
              {schema.settings.submitButtonText || "Submit"}
            </Button>
          </div>
        </>
      )}
    </form>
  );
};

// ── Field Renderer ──────────────────────────────────────────

interface FieldRendererProps {
  field: FormFieldDefinition;
  value: unknown;
  error?: string;
  onChange: (value: unknown) => void;
  readOnly?: boolean;
  disabled?: boolean;
  forceRequired?: boolean;
}

const FieldRenderer = ({ field, value, error, onChange, readOnly, disabled, forceRequired }: FieldRendererProps) => {
  const isRequired = forceRequired || field.validations.some(v => v.type === "required");
  const layoutTypes = ["divider", "heading", "spacer", "infoPanel"];

  // Layout fields
  if (field.type === "divider") return <Separator className="my-4" />;
  if (field.type === "spacer") return <div className="h-4" />;
  if (field.type === "heading") return <h3 className="text-sm font-semibold text-foreground pt-4 pb-1">{field.label}</h3>;
  if (field.type === "infoPanel") return (
    <div className="bg-accent/50 border border-border rounded-lg p-3 text-xs text-muted-foreground flex items-start gap-2">
      <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
      <span>{field.label}</span>
    </div>
  );

  const widthClass = {
    full: "w-full",
    half: "w-full md:w-[calc(50%-0.5rem)] inline-block align-top md:mr-2",
    third: "w-full md:w-[calc(33.33%-0.5rem)] inline-block align-top md:mr-2",
    quarter: "w-full md:w-[calc(25%-0.5rem)] inline-block align-top md:mr-2",
  }[field.width];

  return (
    <div className={cn("mb-3", widthClass, field.className)}>
      <Label className="text-xs text-foreground mb-1.5 block">
        {field.label}
        {isRequired && <span className="text-destructive ml-0.5">*</span>}
      </Label>

      {/* Text-like inputs */}
      {["text", "email", "phone", "url", "password"].includes(field.type) && (
        <Input
          type={field.type === "phone" ? "tel" : field.type}
          value={(value as string) || ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          readOnly={readOnly}
          disabled={disabled}
          className={cn("h-9 text-sm", error && "border-destructive")}
        />
      )}

      {field.type === "number" && (
        <Input
          type="number"
          value={value !== undefined ? String(value) : ""}
          onChange={(e) => onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
          placeholder={field.placeholder}
          readOnly={readOnly}
          disabled={disabled}
          className={cn("h-9 text-sm", error && "border-destructive")}
        />
      )}

      {["date", "datetime", "time"].includes(field.type) && (
        <Input
          type={field.type === "datetime" ? "datetime-local" : field.type}
          value={(value as string) || ""}
          onChange={(e) => onChange(e.target.value)}
          readOnly={readOnly}
          disabled={disabled}
          className={cn("h-9 text-sm", error && "border-destructive")}
        />
      )}

      {field.type === "textarea" && (
        <Textarea
          value={(value as string) || ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          readOnly={readOnly}
          disabled={disabled}
          className={cn("text-sm min-h-[80px]", error && "border-destructive")}
        />
      )}

      {["select", "multiselect"].includes(field.type) && (
        <Select value={(value as string) || ""} onValueChange={onChange} disabled={disabled}>
          <SelectTrigger className={cn("h-9 text-sm", error && "border-destructive")}>
            <SelectValue placeholder={field.placeholder || "Select..."} />
          </SelectTrigger>
          <SelectContent>
            {field.options?.map(opt => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {field.type === "checkbox" && (
        <div className="flex items-center gap-2 pt-1">
          <input
            type="checkbox"
            checked={!!value}
            onChange={(e) => onChange(e.target.checked)}
            disabled={disabled || readOnly}
            className="rounded border-border"
          />
          <span className="text-xs text-muted-foreground">{field.placeholder || ""}</span>
        </div>
      )}

      {field.type === "radio" && (
        <div className="space-y-1.5 pt-1">
          {field.options?.map(opt => (
            <label key={opt.value} className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="radio"
                name={field.name}
                value={opt.value}
                checked={value === opt.value}
                onChange={() => onChange(opt.value)}
                disabled={disabled || readOnly}
              />
              {opt.label}
            </label>
          ))}
        </div>
      )}

      {/* Currency */}
      {field.type === "currency" && (
        <div className="flex gap-1.5">
          <Input
            type="number"
            step={`0.${"0".repeat((field.decimalPlaces || 2) - 1)}1`}
            value={value !== undefined ? String(value) : ""}
            onChange={(e) => onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
            placeholder="0.00"
            readOnly={readOnly}
            disabled={disabled}
            className={cn("h-9 text-sm flex-1", error && "border-destructive")}
          />
          <Badge variant="outline" className="text-xs shrink-0 h-9 px-3 flex items-center">
            {field.currencyCode || "USD"}
          </Badge>
        </div>
      )}

      {/* Quantity */}
      {field.type === "quantity" && (
        <div className="flex gap-1.5">
          <Input
            type="number"
            value={value !== undefined ? String(value) : ""}
            onChange={(e) => onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
            placeholder="0"
            readOnly={readOnly}
            disabled={disabled}
            className={cn("h-9 text-sm flex-1", error && "border-destructive")}
          />
          {field.unitOfMeasure && (
            <Badge variant="outline" className="text-xs shrink-0 h-9 px-3 flex items-center">
              {field.unitOfMeasure}
            </Badge>
          )}
        </div>
      )}

      {/* ERP Pickers */}
      {["accountPicker", "itemPicker", "employeePicker", "supplierPicker", "customerPicker", "warehousePicker", "costCenterPicker", "taxCode", "lookup"].includes(field.type) && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            value={(value as string) || ""}
            onChange={(e) => onChange(e.target.value)}
            placeholder={`Search ${field.label}...`}
            readOnly={readOnly}
            disabled={disabled}
            className={cn("h-9 text-sm pl-9", error && "border-destructive")}
          />
        </div>
      )}

      {/* File upload */}
      {["file", "image"].includes(field.type) && (
        <div className="border-2 border-dashed border-border rounded-lg p-4 text-center hover:border-primary/30 transition-colors cursor-pointer">
          <Upload className="w-5 h-5 mx-auto text-muted-foreground/50 mb-1" />
          <p className="text-xs text-muted-foreground">Drop files here or click to upload</p>
          {field.maxFileSize && (
            <p className="text-[10px] text-muted-foreground/60 mt-0.5">
              Max {field.maxFileSize}MB · Up to {field.maxFiles || 1} file(s)
            </p>
          )}
        </div>
      )}

      {/* Rating */}
      {field.type === "rating" && (
        <div className="flex gap-1 pt-1">
          {[1, 2, 3, 4, 5].map(n => (
            <button
              key={n}
              type="button"
              onClick={() => !readOnly && !disabled && onChange(n)}
              className="p-0.5"
            >
              <Star
                className={cn(
                  "w-5 h-5 transition-colors",
                  n <= (value as number || 0) ? "text-amber-500 fill-amber-500" : "text-muted-foreground/30"
                )}
              />
            </button>
          ))}
        </div>
      )}

      {/* Repeater */}
      {field.type === "repeater" && (
        <RepeaterField
          field={field}
          value={value as Record<string, unknown>[] | undefined}
          onChange={onChange}
          readOnly={readOnly}
          disabled={disabled}
          error={error}
        />
      )}

      {/* Help text */}
      {field.helpText && <p className="text-[10px] text-muted-foreground mt-1">{field.helpText}</p>}

      {/* Error */}
      {error && <p className="text-[11px] text-destructive mt-1">{error}</p>}
    </div>
  );
};

// ── Repeater Field ──────────────────────────────────────────

interface RepeaterFieldProps {
  field: FormFieldDefinition;
  value: Record<string, unknown>[] | undefined;
  onChange: (value: unknown) => void;
  readOnly?: boolean;
  disabled?: boolean;
  error?: string;
}

const RepeaterField = ({ field, value, onChange, readOnly, disabled }: RepeaterFieldProps) => {
  const rows = value || Array.from({ length: field.minRows || 1 }, () => ({}));
  const children = field.children || [];

  const updateRow = (rowIndex: number, colName: string, cellValue: unknown) => {
    const updated = [...rows];
    updated[rowIndex] = { ...updated[rowIndex], [colName]: cellValue };
    onChange(updated);
  };

  const addRow = () => {
    if (field.maxRows && rows.length >= field.maxRows) return;
    onChange([...rows, {}]);
  };

  const removeRow = (index: number) => {
    if (rows.length <= (field.minRows || 1)) return;
    onChange(rows.filter((_, i) => i !== index));
  };

  if (children.length === 0) {
    return (
      <div className="border border-dashed border-border rounded-lg p-4 text-center text-xs text-muted-foreground">
        No columns configured for this repeater
      </div>
    );
  }

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      {/* Header */}
      <div className="bg-muted/50 flex items-center border-b border-border">
        {children.map(child => (
          <div key={child.id} className="flex-1 px-3 py-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
            {child.label}
            {child.validations?.some(v => v.type === "required") && <span className="text-destructive ml-0.5">*</span>}
          </div>
        ))}
        {!readOnly && <div className="w-10 px-2 py-2" />}
      </div>

      {/* Rows */}
      {rows.map((row, rowIdx) => (
        <div key={rowIdx} className="flex items-center border-b border-border last:border-b-0 hover:bg-muted/20 transition-colors">
          {children.map(child => (
            <div key={child.id} className="flex-1 px-2 py-1.5">
              {["text", "email", "phone", "url"].includes(child.type) && (
                <Input
                  value={(row[child.name] as string) || ""}
                  onChange={(e) => updateRow(rowIdx, child.name, e.target.value)}
                  placeholder={child.placeholder || child.label}
                  readOnly={readOnly}
                  disabled={disabled}
                  className="h-8 text-xs border-0 bg-transparent focus:bg-card"
                />
              )}
              {["number", "currency", "quantity"].includes(child.type) && (
                <Input
                  type="number"
                  value={row[child.name] !== undefined ? String(row[child.name]) : ""}
                  onChange={(e) => updateRow(rowIdx, child.name, e.target.value ? parseFloat(e.target.value) : undefined)}
                  placeholder={child.type === "currency" ? "0.00" : "0"}
                  readOnly={readOnly}
                  disabled={disabled}
                  className="h-8 text-xs border-0 bg-transparent focus:bg-card"
                />
              )}
              {child.type === "date" && (
                <Input
                  type="date"
                  value={(row[child.name] as string) || ""}
                  onChange={(e) => updateRow(rowIdx, child.name, e.target.value)}
                  readOnly={readOnly}
                  disabled={disabled}
                  className="h-8 text-xs border-0 bg-transparent focus:bg-card"
                />
              )}
              {child.type === "select" && (
                <Select value={(row[child.name] as string) || ""} onValueChange={(v) => updateRow(rowIdx, child.name, v)} disabled={disabled}>
                  <SelectTrigger className="h-8 text-xs border-0 bg-transparent"><SelectValue placeholder="Select..." /></SelectTrigger>
                  <SelectContent>
                    {child.options?.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              )}
              {child.type === "checkbox" && (
                <div className="flex items-center justify-center h-8">
                  <input
                    type="checkbox"
                    checked={!!row[child.name]}
                    onChange={(e) => updateRow(rowIdx, child.name, e.target.checked)}
                    disabled={disabled || readOnly}
                    className="rounded border-border"
                  />
                </div>
              )}
            </div>
          ))}
          {!readOnly && (
            <div className="w-10 px-2 flex items-center justify-center">
              <button
                type="button"
                onClick={() => removeRow(rowIdx)}
                disabled={rows.length <= (field.minRows || 1)}
                className="p-1 text-muted-foreground hover:text-destructive disabled:opacity-30 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      ))}

      {/* Add row */}
      {!readOnly && (
        <div className="px-3 py-2 border-t border-border bg-muted/30">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-xs h-7 gap-1.5"
            onClick={addRow}
            disabled={!!field.maxRows && rows.length >= field.maxRows}
          >
            <Plus className="w-3.5 h-3.5" /> {field.addButtonText || "Add Row"}
          </Button>
          <span className="text-[10px] text-muted-foreground ml-2">
            {rows.length}{field.maxRows ? ` / ${field.maxRows}` : ""} rows
          </span>
        </div>
      )}
    </div>
  );
};

export default FormRenderer;
