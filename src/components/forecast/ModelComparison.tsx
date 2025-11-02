import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ModelPerformanceCard, { ModelMetrics } from "./ModelPerformanceCard";
import { DollarSign, Package } from "lucide-react";

interface ModelData {
  name: string;
  label: string;
  forecast: number;
  metrics: ModelMetrics;
}

interface ModelComparisonProps {
  // Sales models
  salesModels: {
    sma?: { forecast: number; metrics: ModelMetrics };
    es?: { forecast: number; metrics: ModelMetrics };
    lr?: { forecast: number; metrics: ModelMetrics };
    arima?: { forecast: number; metrics: ModelMetrics };
    prophet?: { forecast: number; metrics: ModelMetrics };
    xgb?: { forecast: number; metrics: ModelMetrics };
  };
  
  // Quantity models
  qtyModels: {
    sma?: { forecast: number; metrics: ModelMetrics };
    es?: { forecast: number; metrics: ModelMetrics };
    lr?: { forecast: number; metrics: ModelMetrics };
    arima?: { forecast: number; metrics: ModelMetrics };
    prophet?: { forecast: number; metrics: ModelMetrics };
    xgb?: { forecast: number; metrics: ModelMetrics };
  };
}

const ModelComparison: React.FC<ModelComparisonProps> = ({ salesModels, qtyModels }) => {
  const [activeTab, setActiveTab] = useState<"sales" | "quantity">("sales");

  const modelLabels: Record<string, string> = {
    sma: "Simple Moving Average (SMA)",
    es: "Exponential Smoothing (ES)",
    lr: "Linear Regression (LR)",
    arima: "ARIMA",
    prophet: "Prophet (META)",
    xgb: "XGBoost (XGB)",
  };

  // Convert models object to array
  const getSalesModelsArray = (): ModelData[] => {
    return Object.entries(salesModels)
      .filter(([_, data]) => data !== undefined)
      .map(([key, data]) => ({
        name: key.toUpperCase(),
        label: modelLabels[key],
        forecast: data!.forecast,
        metrics: data!.metrics,
      }));
  };

  const getQtyModelsArray = (): ModelData[] => {
    return Object.entries(qtyModels)
      .filter(([_, data]) => data !== undefined)
      .map(([key, data]) => ({
        name: key.toUpperCase(),
        label: modelLabels[key],
        forecast: data!.forecast,
        metrics: data!.metrics,
      }));
  };

  // Find best model (highest R2)
  const findBestModel = (models: ModelData[]): string | null => {
    if (models.length === 0) return null;
    
    const validModels = models.filter(m => m.metrics.R2 !== null);
    if (validModels.length === 0) return null;
    
    const best = validModels.reduce((prev, current) => 
      (current.metrics.R2! > prev.metrics.R2!) ? current : prev
    );
    
    return best.name;
  };

  const salesModelsArray = getSalesModelsArray();
  const qtyModelsArray = getQtyModelsArray();
  const bestSalesModel = findBestModel(salesModelsArray);
  const bestQtyModel = findBestModel(qtyModelsArray);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          📊 Model Performance Comparison
        </CardTitle>
        <CardDescription>
          Compare forecasting model performance across different algorithms
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "sales" | "quantity")}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="sales" className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Sales Models
            </TabsTrigger>
            <TabsTrigger value="quantity" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              Quantity Models
            </TabsTrigger>
          </TabsList>

          {/* Sales Models Tab */}
          <TabsContent value="sales" className="mt-4">
            {salesModelsArray.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                No sales model data available
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {salesModelsArray.map((model) => (
                  <ModelPerformanceCard
                    key={model.name}
                    modelName={model.name}
                    modelLabel={model.label}
                    forecast={model.forecast}
                    metrics={model.metrics}
                    isSales={true}
                    isBestModel={model.name === bestSalesModel}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          {/* Quantity Models Tab */}
          <TabsContent value="quantity" className="mt-4">
            {qtyModelsArray.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                No quantity model data available
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {qtyModelsArray.map((model) => (
                  <ModelPerformanceCard
                    key={model.name}
                    modelName={model.name}
                    modelLabel={model.label}
                    forecast={model.forecast}
                    metrics={model.metrics}
                    isSales={false}
                    isBestModel={model.name === bestQtyModel}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default ModelComparison;
