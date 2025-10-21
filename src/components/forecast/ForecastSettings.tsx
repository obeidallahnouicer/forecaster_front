import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface ForecastSettingsProps {
  onRefresh?: () => void;
  onRunBacktest?: () => void;
}

export const ForecastSettings: React.FC<ForecastSettingsProps> = ({ onRefresh, onRunBacktest }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Forecast Settings</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={onRefresh}>Refresh Data</Button>
          <Button onClick={onRunBacktest}>Run Backtest</Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ForecastSettings;
