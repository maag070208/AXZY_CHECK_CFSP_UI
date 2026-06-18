export type CatalogOptionsType = 
    | 'role'
    | 'client'
    | 'location'
    | 'guard'
    | 'incident_category'
    | 'incident_type'
    | 'discipline_category'
    | 'discipline_type';

export interface ICatalogItem {
    id: number | string;
    name: string;
    value: string;
}
