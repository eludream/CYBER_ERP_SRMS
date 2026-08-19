import { httpClient } from "./httpClient";
import * as finance from "@/data/financeData";
import * as hr from "@/data/hrData";
import * as inventory from "@/data/inventoryData";
import * as procurement from "@/data/procurementData";
import * as production from "@/data/productionData";
import * as quality from "@/data/qualityData";
import * as sales from "@/data/salesData";

export interface ModuleDataDto { name: string; payloadJson: string; }

const modules: Record<string, Record<string, unknown>> = {
  finance, hr, inventory, procurement, production, quality, sales,
};

const registry = new Map<string, unknown>();
for (const [moduleName, exports] of Object.entries(modules)) {
  for (const [exportName, value] of Object.entries(exports)) {
    if (Array.isArray(value) || (value !== null && typeof value === "object")) {
      registry.set(`${moduleName}.${exportName}`, value);
    }
  }
}

function applyPayload(target: unknown, payload: unknown) {
  if (Array.isArray(target) && Array.isArray(payload)) {
    target.splice(0, target.length, ...payload);
    return;
  }
  if (target && payload && typeof target === "object" && typeof payload === "object" && !Array.isArray(payload)) {
    const mutableTarget = target as Record<string, unknown>;
    for (const key of Object.keys(mutableTarget)) delete mutableTarget[key];
    Object.assign(mutableTarget, payload);
  }
}

export const moduleDataService = {
  getAll: () => httpClient.get<ModuleDataDto[]>("/ModuleData"),
  seed: (dataSets: ModuleDataDto[]) => httpClient.post<ModuleDataDto[]>("/ModuleData/seed", dataSets),
  update: (name: string, value: unknown) =>
    httpClient.put<void>(`/ModuleData/${encodeURIComponent(name)}`, { name, payloadJson: JSON.stringify(value) }),

  hydrate: async () => {
    const { data } = await moduleDataService.getAll();
    const remoteNames = new Set(data.map(item => item.name));
    const missing = Array.from(registry.keys()).filter(name => !remoteNames.has(name));
    if (missing.length) throw new Error(`Module datasets are missing from the database: ${missing.join(", ")}`);

    for (const item of data) {
      const target = registry.get(item.name);
      if (target === undefined) continue;
      applyPayload(target, JSON.parse(item.payloadJson));
    }
  },
};
