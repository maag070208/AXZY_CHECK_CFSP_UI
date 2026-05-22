import { get, post } from "@app/core/axios/axios";

export const getRecurringConfigurationsList = async () => {
  return get(`/recurring`);
};

export const generateAdministrativeMatrixPDF = async (params: {
  recurringConfigurationIds: string[];
  startDate: string;
  endDate: string;
}) => {
  return post(`/reports/administrative/matrix/pdf`, params, {
    responseType: "blob",
  });
};
