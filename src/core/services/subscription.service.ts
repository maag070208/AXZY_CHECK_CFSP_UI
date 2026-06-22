import { get } from "../axios/axios";

export interface ISubscriptionConfig {
  id: string;
  paid: boolean;
  trialDaysRemaining: number;
  showTrialWatermark: boolean;
  showTrialBadge: boolean;
}

export const getSubscriptionConfig = async () => {
  return get<ISubscriptionConfig>("/subscription/config");
};
