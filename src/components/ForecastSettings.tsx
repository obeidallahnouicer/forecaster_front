import React from "react";
import { useUIStore } from "@/store/uiStore";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";

export const ForecastSettings: React.FC = () => {
  const { settings, updateSettings, sessionFrequency, setSessionFrequency } = useUIStore();

  const methods = ["SMA", "ExpSmoothing", "LinearReg", "ARIMA", "PROPHET", "XGBOOST"];

  return (
    <div className="space-y-4">
      {/* Frequency Selector */}
      <div>
        <Label className="text-sm font-medium mb-2 block">
          Forecast Frequency
        </Label>
        <p className="text-xs text-muted-foreground mb-3">
          Choose between yearly or monthly forecasting intervals
        </p>
        <div className="flex gap-2">
          <Button
            type="button"
            onClick={() => setSessionFrequency("yearly")}
            variant={sessionFrequency === "yearly" ? "default" : "outline"}
            className="flex-1"
          >
            Yearly
          </Button>
          <Button
            type="button"
            onClick={() => setSessionFrequency("monthly")}
            variant={sessionFrequency === "monthly" ? "default" : "outline"}
            className="flex-1"
          >
            Monthly
          </Button>
        </div>
      </div>

      {/* Algorithm Parameters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="sma-period" className="text-sm font-medium">
            SMA Period
          </Label>
          <p className="text-xs text-muted-foreground">
            Number of periods for Simple Moving Average
          </p>
          <Input
            id="sma-period"
            type="number"
            min="1"
            max="12"
            value={settings.period}
            onChange={(e) => updateSettings({ period: Number(e.target.value) })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="alpha" className="text-sm font-medium">
            Alpha (Smoothing Factor)
          </Label>
          <p className="text-xs text-muted-foreground">
            Value between 0 and 1 for exponential smoothing
          </p>
          <Input
            id="alpha"
            type="number"
            step="0.01"
            min="0"
            max="1"
            value={settings.alpha}
            onChange={(e) => updateSettings({ alpha: Number(e.target.value) })}
          />
        </div>
      </div>

      {/* Fast Mode Toggle */}
      <div className="flex items-center space-x-2">
        <Checkbox
          id="fast-mode"
          checked={settings.fastMode}
          onCheckedChange={(checked) => updateSettings({ fastMode: checked as boolean })}
        />
        <div className="grid gap-1.5 leading-none">
          <Label
            htmlFor="fast-mode"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            Fast Mode
          </Label>
          <p className="text-xs text-muted-foreground">
            Skip complex models for faster computation
          </p>
        </div>
      </div>

      {/* Forecast Methods Selection */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">
          Forecast Methods
        </Label>
        <p className="text-xs text-muted-foreground">
          Select which algorithms to include in the forecast ensemble
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {methods.map((method) => (
            <div key={method} className="flex items-center space-x-2">
              <Checkbox
                id={`method-${method}`}
                checked={(settings.includeMethods ?? []).includes(method as any)}
                onCheckedChange={(checked) => {
                  const current = settings.includeMethods ?? [];
                  if (checked) {
                    updateSettings({ includeMethods: Array.from(new Set([...current, method as any])) });
                  } else {
                    updateSettings({ includeMethods: current.filter((x) => x !== method) });
                  }
                }}
              />
              <Label
                htmlFor={`method-${method}`}
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                {method}
              </Label>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
