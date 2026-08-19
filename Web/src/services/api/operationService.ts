import { httpClient } from "./httpClient";

export interface OperationDto {
  id: string;
  moduleId: string;
  parentOperationId: string | null;
  name: string;
  module: string;
  link: string;
  filter: string;
  icon: string;
  displayOrder: number;
  isActive: boolean;
  createdBy?: string | null;
}
export type CreateOperationRequest = Omit<OperationDto, "id" | "module" | "createdBy">;
export type UpdateOperationRequest = Omit<OperationDto, "module" | "createdBy">;

export const operationService = {
  list: () => httpClient.get<OperationDto[]>("/Operation", { page: 1, pageSize: 500 }),
  create: (data: CreateOperationRequest) => httpClient.post<OperationDto>("/Operation", data),
  update: (data: UpdateOperationRequest) => httpClient.put<OperationDto>("/Operation", data),
  delete: (id: string) => httpClient.delete<OperationDto>(`/Operation/${id}`),
};
