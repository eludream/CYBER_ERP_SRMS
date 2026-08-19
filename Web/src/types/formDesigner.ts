// ========================
// Form Designer Types — mapped to .NET Core Web API DTOs
// ========================

// ── Field Types ──────────────────────────────────────────────

export type BasicFieldType = "text" | "number" | "date" | "datetime" | "time" | "select" | "multiselect" | "checkbox" | "radio" | "textarea" | "email" | "phone" | "url" | "password";

export type AdvancedFieldType = "file" | "image" | "richtext" | "lookup" | "reference" | "signature" | "color" | "rating" | "repeater";

export type ERPFieldType = "currency" | "quantity" | "accountPicker" | "itemPicker" | "employeePicker" | "supplierPicker" | "customerPicker" | "warehousePicker" | "costCenterPicker" | "taxCode";

export type LayoutFieldType = "section" | "tab" | "columns" | "divider" | "heading" | "spacer" | "infoPanel";

export type FormFieldType = BasicFieldType | AdvancedFieldType | ERPFieldType | LayoutFieldType;

// ── Field Categories (for palette) ──────────────────────────

export interface FieldCategory {
  id: string;
  label: string;
  icon: string;
  fields: FieldPaletteItem[];
}

export interface FieldPaletteItem {
  type: FormFieldType;
  label: string;
  icon: string;
  category: "basic" | "advanced" | "erp" | "layout";
}

// ── Validation Rules ────────────────────────────────────────

export interface ValidationRule {
  type: "required" | "minLength" | "maxLength" | "min" | "max" | "pattern" | "email" | "url" | "custom";
  value?: string | number | boolean;
  message: string;
}

// ── Select / Radio Options ──────────────────────────────────

export interface FieldOption {
  label: string;
  value: string;
  color?: string;
}

// ── Conditional Visibility ──────────────────────────────────

export interface ConditionalRule {
  fieldId: string;
  operator: "equals" | "notEquals" | "contains" | "greaterThan" | "lessThan" | "isEmpty" | "isNotEmpty";
  value: string | number | boolean;
  action: "show" | "hide" | "require" | "disable";
}

// ── Form Field Definition ───────────────────────────────────

export interface FormFieldDefinition {
  id: string;
  type: FormFieldType;
  label: string;
  name: string; // API field name
  placeholder?: string;
  helpText?: string;
  defaultValue?: string | number | boolean;
  validations: ValidationRule[];
  options?: FieldOption[];
  conditions?: ConditionalRule[];
  
  // Layout properties
  width: "full" | "half" | "third" | "quarter";
  row?: number;
  order: number;
  
  // ERP-specific
  lookupModule?: string; // e.g. "finance", "inventory"
  lookupEntity?: string; // e.g. "accounts", "items"
  lookupDisplayField?: string;
  lookupValueField?: string;
  
  // Currency / Quantity
  unitOfMeasure?: string;
  currencyCode?: string;
  decimalPlaces?: number;
  
  // File upload
  allowedExtensions?: string[];
  maxFileSize?: number; // in MB
  maxFiles?: number;
  
  // Rich text
  maxCharacters?: number;
  
  // Tab / Section / Columns / Repeater
  children?: FormFieldDefinition[];
  columnCount?: number; // for columns layout
  collapsed?: boolean; // for sections
  
  // Repeater
  minRows?: number;
  maxRows?: number;
  addButtonText?: string;
  
  // Computed
  formula?: string; // e.g. "{{quantity}} * {{unitPrice}}"
  
  // Styling
  className?: string;
  readOnly?: boolean;
  disabled?: boolean;
  hidden?: boolean;
}

// ── Form Schema ─────────────────────────────────────────────

export interface FormSchema {
  id: string;
  name: string;
  description?: string;
  module: string; // which ERP module this belongs to
  entity: string; // e.g. "purchase_order", "employee", "custom"
  version: number;
  status: "draft" | "published" | "archived";
  fields: FormFieldDefinition[];
  
  // Layout
  layout: "single" | "tabs" | "wizard" | "multi-column";
  columnsCount?: number;
  
  // Workflow integration
  workflowId?: string;
  triggerWorkflowOnSubmit?: boolean;
  
  // Permissions
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
  publishedAt?: string;
  
  // Settings
  settings: FormSettings;
}

export interface FormSettings {
  allowDraft: boolean;
  allowPrint: boolean;
  allowExport: boolean;
  showProgressBar: boolean; // for wizard layout
  submitButtonText: string;
  cancelButtonText: string;
  successMessage: string;
  redirectUrl?: string;
  notifyOnSubmit: boolean;
  notifyEmails?: string[];
  customCss?: string;
  maxSubmissions?: number;
}

// ── Form Submission ─────────────────────────────────────────

export interface FormSubmission {
  id: string;
  formId: string;
  formVersion: number;
  data: Record<string, unknown>;
  status: "draft" | "submitted" | "approved" | "rejected";
  workflowDocumentId?: number;
  submittedBy: string;
  submittedAt: string;
  updatedAt?: string;
}

// ── Designer State ──────────────────────────────────────────

export interface FormDesignerState {
  schema: FormSchema;
  selectedFieldId: string | null;
  isDirty: boolean;
  clipboard: FormFieldDefinition | null;
  undoStack: FormSchema[];
  redoStack: FormSchema[];
  previewMode: boolean;
  draggedField: FieldPaletteItem | FormFieldDefinition | null;
}

// ── API DTOs ────────────────────────────────────────────────

export interface CreateFormDto {
  name: string;
  description?: string;
  module: string;
  entity: string;
  layout: FormSchema["layout"];
}

export interface UpdateFormDto {
  name?: string;
  description?: string;
  fields?: FormFieldDefinition[];
  layout?: FormSchema["layout"];
  settings?: Partial<FormSettings>;
  workflowId?: string;
  triggerWorkflowOnSubmit?: boolean;
}

export interface FormListItem {
  id: string;
  name: string;
  description?: string;
  module: string;
  entity: string;
  status: FormSchema["status"];
  version: number;
  fieldCount: number;
  submissionCount: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}
