import { get, post, put, remove } from "@app/core/axios/axios";

export interface Zone {
    id: string;
    clientId: string;
    name: string;
    active: boolean;
}

export const getZonesByClient = async (clientId: string) => {
    const res = await get<any>(`/zones/client/${clientId}`);
    return res.data || [];
};

export const createZone = async (data: { clientId: string; name: string }) => {
    return await post<Zone>("/zones", data);
};

export const updateZone = async (id: string, data: { name?: string; active?: boolean }) => {
    return await put<Zone>(`/zones/${id}`, data);
};

export const deleteZone = async (id: string) => {
    return await remove(`/zones/${id}`);
};
