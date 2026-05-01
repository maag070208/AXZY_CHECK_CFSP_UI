import { post, put, remove } from "@app/core/axios/axios";

export interface Client {
    id: number;
    name: string;
    address?: string;
    rfc?: string;
    contactName?: string;
    contactPhone?: string;
    active: boolean;
    _count?: {
        locations: number;
    };
    users?: Array<{ id: number; username: string }>;
}

export const getPaginatedClients = async (params: any) => {
    try {
        const res = await post<any>("/clients/datatable", params);
        if (res.success && res.data) {
            return {
                data: res.data.rows || [],
                total: res.data.total || 0,
            };
        }
        return { data: [], total: 0 };
    } catch (error) {
        console.error("Error fetching clients", error);
        throw error;
    }
};

export const createClient = async (data: Partial<Client>) => {
    try {
        const response = await post("/clients", data);
        return response.data;
    } catch (error) {
        console.error("Error creating client", error);
        throw error;
    }
};

export const updateClient = async (id: number, data: Partial<Client>) => {
    try {
        const response = await put(`/clients/${id}`, data);
        return response.data;
    } catch (error) {
        console.error("Error updating client", error);
        throw error;
    }
};

export const deleteClient = async (id: number) => {
    try {
        const response = await remove(`/clients/${id}`);
        return response.data;
    } catch (error) {
        console.error("Error deleting client", error);
        throw error;
    }
};
