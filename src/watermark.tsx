import React, { useEffect, useState } from "react";
import { getSubscriptionConfig, ISubscriptionConfig } from "./core/services/subscription.service";

const WatermarkFullPage: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [config, setConfig] = useState<ISubscriptionConfig | null>(null);

  useEffect(() => {
    getSubscriptionConfig()
      .then((res) => {
        if (res.success && res.data) {
          setConfig(res.data);
        }
      })
      .catch(() => {});
  }, []);

  const showWatermark = config && config.showTrialWatermark && !config.paid;
  const showBadge = config && config.showTrialBadge;

  return (
    <div className="relative min-h-screen">
      {showWatermark && (
        <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-[120px] font-black text-red-500/10 whitespace-nowrap -rotate-45 select-none">
              MODO PRUEBA
            </div>
          </div>
        </div>
      )}
      {showBadge && !config?.paid && (
        <div className="fixed bottom-4 right-4 z-50 bg-red-500 text-white text-xs font-bold px-3 py-1.5 rounded shadow pointer-events-none">
          {config!.trialDaysRemaining} días de prueba restantes
        </div>
      )}
      {children}
    </div>
  );
};

export default WatermarkFullPage;
