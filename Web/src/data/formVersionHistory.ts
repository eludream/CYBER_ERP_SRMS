// ========================
// Form Version History Types & Data
// ========================

import type { FormSchema } from "@/types/formDesigner";

export interface FormVersionSnapshot {
  id: string;
  formId: string;
  version: number;
  schema: FormSchema;
  createdAt: string;
  createdBy: string;
  changeType: "created" | "fields_added" | "fields_removed" | "fields_modified" | "settings_changed" | "published" | "restored" | "layout_changed";
  changeSummary: string;
  fieldCount: number;
  /** Diff details: what changed */
  fieldsAdded?: string[];
  fieldsRemoved?: string[];
  fieldsModified?: string[];
}

/** In-memory version store (production = API) */
const versionStore: Map<string, FormVersionSnapshot[]> = new Map();

/** Generate a change summary by diffing two schemas */
export function diffSchemas(prev: FormSchema, next: FormSchema): {
  changeType: FormVersionSnapshot["changeType"];
  changeSummary: string;
  fieldsAdded: string[];
  fieldsRemoved: string[];
  fieldsModified: string[];
} {
  const prevFieldIds = new Set(prev.fields.map(f => f.id));
  const nextFieldIds = new Set(next.fields.map(f => f.id));

  const added = next.fields.filter(f => !prevFieldIds.has(f.id)).map(f => f.label);
  const removed = prev.fields.filter(f => !nextFieldIds.has(f.id)).map(f => f.label);
  const modified: string[] = [];

  for (const field of next.fields) {
    if (prevFieldIds.has(field.id)) {
      const prevField = prev.fields.find(f => f.id === field.id);
      if (prevField && JSON.stringify(prevField) !== JSON.stringify(field)) {
        modified.push(field.label);
      }
    }
  }

  const settingsChanged = JSON.stringify(prev.settings) !== JSON.stringify(next.settings);
  const layoutChanged = prev.layout !== next.layout;
  const nameChanged = prev.name !== next.name;

  let changeType: FormVersionSnapshot["changeType"] = "fields_modified";
  const parts: string[] = [];

  if (added.length > 0) {
    changeType = "fields_added";
    parts.push(`Added ${added.length} field${added.length > 1 ? "s" : ""}: ${added.slice(0, 3).join(", ")}${added.length > 3 ? ` +${added.length - 3} more` : ""}`);
  }
  if (removed.length > 0) {
    changeType = removed.length > 0 && added.length === 0 ? "fields_removed" : changeType;
    parts.push(`Removed ${removed.length} field${removed.length > 1 ? "s" : ""}: ${removed.slice(0, 3).join(", ")}${removed.length > 3 ? ` +${removed.length - 3} more` : ""}`);
  }
  if (modified.length > 0) {
    parts.push(`Modified ${modified.length} field${modified.length > 1 ? "s" : ""}: ${modified.slice(0, 3).join(", ")}${modified.length > 3 ? ` +${modified.length - 3} more` : ""}`);
  }
  if (settingsChanged) {
    changeType = added.length === 0 && removed.length === 0 && modified.length === 0 ? "settings_changed" : changeType;
    parts.push("Settings updated");
  }
  if (layoutChanged) {
    changeType = "layout_changed";
    parts.push(`Layout changed to ${next.layout}`);
  }
  if (nameChanged) {
    parts.push(`Renamed to "${next.name}"`);
  }

  return {
    changeType,
    changeSummary: parts.length > 0 ? parts.join(". ") : "No changes detected",
    fieldsAdded: added,
    fieldsRemoved: removed,
    fieldsModified: modified,
  };
}

/** Save a version snapshot */
export function saveVersionSnapshot(
  schema: FormSchema,
  changeType: FormVersionSnapshot["changeType"],
  changeSummary: string,
  details?: { fieldsAdded?: string[]; fieldsRemoved?: string[]; fieldsModified?: string[] }
): FormVersionSnapshot {
  const versions = versionStore.get(schema.id) || [];
  const snapshot: FormVersionSnapshot = {
    id: `ver-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    formId: schema.id,
    version: versions.length + 1,
    schema: JSON.parse(JSON.stringify(schema)), // deep clone
    createdAt: new Date().toISOString(),
    createdBy: "Current User",
    changeType,
    changeSummary,
    fieldCount: schema.fields.length,
    fieldsAdded: details?.fieldsAdded,
    fieldsRemoved: details?.fieldsRemoved,
    fieldsModified: details?.fieldsModified,
  };
  versions.push(snapshot);
  versionStore.set(schema.id, versions);
  return snapshot;
}

/** Get all versions for a form */
export function getVersionHistory(formId: string): FormVersionSnapshot[] {
  return [...(versionStore.get(formId) || [])].reverse(); // newest first
}

/** Initialize version history with seed data for mock forms */
export function initializeMockVersionHistory(schemas: Record<string, FormSchema>) {
  for (const [id, schema] of Object.entries(schemas)) {
    if (versionStore.has(id)) continue;

    const versions: FormVersionSnapshot[] = [];

    // Create initial version
    const baseSchema = { ...schema, fields: schema.fields.slice(0, Math.max(3, Math.floor(schema.fields.length * 0.5))) };
    versions.push({
      id: `ver-init-${id}`,
      formId: id,
      version: 1,
      schema: JSON.parse(JSON.stringify(baseSchema)),
      createdAt: schema.createdAt || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      createdBy: schema.createdBy || "Admin",
      changeType: "created",
      changeSummary: `Form created with ${baseSchema.fields.length} initial fields`,
      fieldCount: baseSchema.fields.length,
    });

    // v2: Fields added
    const midSchema = { ...schema, fields: schema.fields.slice(0, Math.floor(schema.fields.length * 0.8)) };
    const addedFields = midSchema.fields.slice(baseSchema.fields.length).map(f => f.label);
    versions.push({
      id: `ver-v2-${id}`,
      formId: id,
      version: 2,
      schema: JSON.parse(JSON.stringify(midSchema)),
      createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
      createdBy: schema.createdBy || "Admin",
      changeType: "fields_added",
      changeSummary: `Added ${addedFields.length} fields: ${addedFields.slice(0, 3).join(", ")}${addedFields.length > 3 ? ` +${addedFields.length - 3} more` : ""}`,
      fieldCount: midSchema.fields.length,
      fieldsAdded: addedFields,
    });

    // v3: Current version
    const finalAdded = schema.fields.slice(midSchema.fields.length).map(f => f.label);
    versions.push({
      id: `ver-v3-${id}`,
      formId: id,
      version: 3,
      schema: JSON.parse(JSON.stringify(schema)),
      createdAt: schema.updatedAt || new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      createdBy: schema.createdBy || "Admin",
      changeType: finalAdded.length > 0 ? "fields_added" : "settings_changed",
      changeSummary: finalAdded.length > 0
        ? `Added remaining fields and finalized settings. ${finalAdded.length} fields added.`
        : "Settings and validation rules updated",
      fieldCount: schema.fields.length,
      fieldsAdded: finalAdded.length > 0 ? finalAdded : undefined,
    });

    if (schema.status === "published") {
      versions.push({
        id: `ver-pub-${id}`,
        formId: id,
        version: 4,
        schema: JSON.parse(JSON.stringify(schema)),
        createdAt: schema.publishedAt || new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        createdBy: schema.createdBy || "Admin",
        changeType: "published",
        changeSummary: "Form published and made available for document entry",
        fieldCount: schema.fields.length,
      });
    }

    versionStore.set(id, versions);
  }
}
