import { get, post, put, remove } from "@app/core/axios/axios";

export interface Zone {
    id: number;
    clientId: number;
    name: string;
    active: boolean;
}

export const getZonesByClient = async (clientId: number) => {
    const res = await get<any>(`/zones/client/${clientId}`);
    return res.data || [];
};

export const createZone = async (data: { clientId: number; name: string }) => {
    return await post<Zone>("/zones", data);
};

export const updateZone = async (id: number, data: { name?: string; active?: boolean }) => {
    return await put<Zone>(`/zones/${id}`, data);
};

export const deleteZone = async (id: number) => {
    return await remove(`/zones/${id}`);
};
