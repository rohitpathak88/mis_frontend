export interface Role {
    id: number;
    name: string;
    description?: string;
}

export interface User {
    id: number;
    name: string;
    email: string;
    status: "ACTIVE" | "INACTIVE";
    lastLoginAt: string | null;
    createdAt: string;
    updatedAt: string;
    role: Role;
}

export interface CreateUserRequest {
    name: string;
    email: string;
    password: string;
    roleId: number;
}

export interface UpdateUserRequest {
    name: string;
    email: string;
    roleId: number;
}