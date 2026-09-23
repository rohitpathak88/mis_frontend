export type EntityStatus = "ACTIVE" | "INACTIVE";

export interface Department {
    id: number;
    organizationId: number;
    name: string;
    code: string | null;
    status: EntityStatus;
    createdAt: string;
    updatedAt: string;
}

export interface Team {
    id: number;
    organizationId: number;
    departmentId: number;
    departmentName: string;
    name: string;
    code: string | null;
    status: EntityStatus;
    createdAt: string;
    updatedAt: string;
}