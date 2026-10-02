/**
 * Dependencias del view-model de clientes.
 */
import { useMemo } from "react";
import { useDispatch } from "react-redux";
import { clearSpecificCatalogCache } from "@app/core/hooks/catalog.hook";
import { showToast } from "@app/core/store/toast/toast.slice";
import {
  deleteClient,
  fetchClientsTable,
  getClientById,
  type Client,
  type ClientCreate,
  type ClientUpdate,
} from "@entities/client";
import { createClient, updateClient } from "@entities/client";
import type { ITDataTableFetchParams, ITDataTableResponse, TResult } from "@shared/api";

export interface ClientsDeps {
  fetchTable: (params: ITDataTableFetchParams) => Promise<ITDataTableResponse<Client>>;
  getById: (id: string) => Promise<TResult<Client>>;
  create: (data: ClientCreate) => Promise<TResult<Client>>;
  update: (id: string, data: ClientUpdate) => Promise<TResult<Client>>;
  remove: (id: string) => Promise<TResult<boolean>>;
  notify: (message: string, type: "success" | "error") => void;
  /** El catálogo de clientes se cachea; al mutar hay que invalidarlo. */
  invalidateCatalog: () => void;
}

export const useClientsDeps = (): ClientsDeps => {
  const dispatch = useDispatch();

  return useMemo(
    () => ({
      fetchTable: fetchClientsTable,
      getById: getClientById,
      create: createClient,
      update: updateClient,
      remove: deleteClient,
      notify: (message, type) => dispatch(showToast({ message, type })),
      invalidateCatalog: () => clearSpecificCatalogCache("client"),
    }),
    [dispatch],
  );
};
