import { httpClient } from "./httpClient";

export interface ModuleDto {
  id: string;
  code: string;
  subSystem: string;
  name: string;
  abbreviation: string;
  description: string;
  landingPath: string;
  icon: string | null;
  displayOrder: number;
  isActive: boolean;
  moduleCount: number;
  operationCount: number;
}

export interface SystemResourceRouteDto {
  code: string;
  abbreviation: string;
  name: string;
  description: string;
}

export type CreateModuleRequest = Omit<ModuleDto, "id" | "abbreviation" | "moduleCount" | "operationCount"> & { abbreviation?: string };
export type UpdateModuleRequest = Omit<ModuleDto, "code" | "abbreviation" | "moduleCount" | "operationCount"> & { abbreviation?: string };

export const moduleService = {
  systemResource: async () => {
    const baseUrl = import.meta.env.VITE_API_BASE_URL || "/api/v1";
    const response = await fetch(`${baseUrl}/Module/system-resource`, { headers: { Accept: "application/json" }, credentials: "omit" });
    if (!response.ok) throw new Error("Unable to load the System Resource application route.");
    const payload = await response.json();
    const data = payload && typeof payload === "object" && "data" in payload ? payload.data : payload;
    return { data: data as SystemResourceRouteDto, success: true, message: "" };
  },
  list: async () => {
    const response = await httpClient.get<ModuleDto[]>("/Module", { page: 1, pageSize: 250 });
    return {
      ...response,
      data: [...response.data].sort((left, right) => left.displayOrder - right.displayOrder || left.name.localeCompare(right.name)),
    };
  },
  create: (data: CreateModuleRequest) => httpClient.post<ModuleDto>("/Module", data),
  update: (data: UpdateModuleRequest) => httpClient.put<ModuleDto>("/Module", data),
  delete: (id: string) => httpClient.delete<void>(`/Module/${id}`),
};
