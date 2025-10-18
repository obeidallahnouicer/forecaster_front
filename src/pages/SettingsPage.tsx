import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useUIStore } from "@/store/uiStore";
import { useToast } from "@/hooks/use-toast";
import {
  Moon,
  Sun,
  Monitor,
  Bell,
  Database,
  Sliders,
  Save,
  Check,
  AlertCircle,
} from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Settings, ForecastModel } from "@/domain/types";

const SettingsPage: React.FC = () => {
  const { theme, setTheme, settings: uiSettings, updateSettings } = useUIStore();
  const { toast } = useToast();
  const [saved, setSaved] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [activeTab, setActiveTab] = useState("appearance");

  // Local state for settings form - properly initialized from store
  const [settings, setSettings] = useState<{
    theme: "light" | "dark" | "system";
    notifications: {
      anomalies: boolean;
      forecast_ready: boolean;
      daily_summary: boolean;
    };
    forecast: {
      period: number;
      alpha: number;
      fastMode: boolean;
      models: ForecastModel[];
    };
    export: {
      format: "csv" | "excel" | "pdf" | "json";
      includeMetadata: boolean;
    };
    viewType: "yearly" | "monthly";
  }>(() => ({
    theme: (theme || "system") as "light" | "dark" | "system",
    notifications: {
      anomalies: true,
      forecast_ready: true,
      daily_summary: false,
    },
    forecast: {
      period: uiSettings?.period || 3,
      alpha: uiSettings?.alpha || 0.3,
      fastMode: uiSettings?.fastMode || true,
      models: (uiSettings?.includeMethods || ["SMA", "ExpSmoothing", "LinearReg", "XGBOOST"]) as ForecastModel[],
    },
    export: {
      format: "csv",
      includeMetadata: true,
    },
    viewType: "yearly",
  }));

  // Track changes
  useEffect(() => {
    const hasChanged =
      settings.theme !== (theme || "system") ||
      settings.forecast.period !== (uiSettings?.period || 3) ||
      settings.forecast.alpha !== (uiSettings?.alpha || 0.3) ||
      settings.forecast.fastMode !== (uiSettings?.fastMode || true) ||
      JSON.stringify(settings.forecast.models) !== JSON.stringify(uiSettings?.includeMethods || ["SMA", "ExpSmoothing", "LinearReg", "XGBOOST"]);

    setIsDirty(hasChanged);
  }, [settings, theme, uiSettings]);

  const handleSave = () => {
    try {
      // Update theme if changed
      const themeChanged = settings.theme !== theme;
      if (themeChanged) {
        setTheme(settings.theme);
        // Apply theme to document
        const root = document.documentElement;
        if (settings.theme === 'dark') {
          root.classList.add('dark');
          localStorage.setItem('theme', 'dark');
        } else if (settings.theme === 'light') {
          root.classList.remove('dark');
          localStorage.setItem('theme', 'light');
        } else {
          // System theme
          const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
          if (isDark) {
            root.classList.add('dark');
          } else {
            root.classList.remove('dark');
          }
          localStorage.setItem('theme', 'system');
        }
      }

      // Update UI store with new settings
      updateSettings({
        period: settings.forecast.period,
        alpha: settings.forecast.alpha,
        fastMode: settings.forecast.fastMode,
        includeMethods: settings.forecast.models,
      });

      setSaved(true);
      setIsDirty(false);

      toast({
        title: "Settings saved successfully!",
        description: "Your preferences have been updated and will apply immediately",
      });

      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      toast({
        title: "Failed to save settings",
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive",
      });
    }
  };

  const handleCancel = () => {
    // Reset to saved state
    setSettings((prev) => ({
      ...prev,
      theme: (theme || "system") as "light" | "dark" | "system",
      forecast: {
        period: uiSettings?.period || 3,
        alpha: uiSettings?.alpha || 0.3,
        fastMode: uiSettings?.fastMode || true,
        models: (uiSettings?.includeMethods || ["SMA", "ExpSmoothing", "LinearReg", "XGBOOST"]) as ForecastModel[],
      },
    }));
    setIsDirty(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-background/80">
      {/* Header */}
      <div className="sticky top-20 z-30 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Settings & Preferences
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Customize your forecasting experience
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Tabs defaultValue="appearance" className="w-full" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="forecast">Forecast</TabsTrigger>
          <TabsTrigger value="data">Data & Export</TabsTrigger>
        </TabsList>          {/* Appearance Settings */}
          <TabsContent value="appearance" className="mt-6 space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Theme</CardTitle>
                  <CardDescription>
                    Choose your preferred color scheme
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    {[
                      { value: "light", icon: Sun, label: "Light" },
                      { value: "dark", icon: Moon, label: "Dark" },
                      { value: "system", icon: Monitor, label: "System" },
                    ].map((option) => {
                      const Icon = option.icon;
                      return (
                        <button
                          key={option.value}
                          onClick={() =>
                            setSettings({
                              ...settings,
                              theme: option.value as any,
                            })
                          }
                          className={cn(
                            "p-4 rounded-lg border-2 transition-all flex flex-col items-center gap-2",
                            settings.theme === option.value
                              ? "border-primary bg-primary/5"
                              : "border-border hover:border-primary/50"
                          )}
                        >
                          <Icon className="w-6 h-6" />
                          <span className="text-sm font-medium">
                            {option.label}
                          </span>
                          {settings.theme === option.value && (
                            <Check className="w-4 h-4 text-primary" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          {/* Notification Settings */}
          <TabsContent value="notifications" className="mt-6 space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="w-5 h-5" />
                    Notification Preferences
                  </CardTitle>
                  <CardDescription>
                    Manage how and when you receive updates
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {[
                    {
                      id: "anomalies",
                      label: "Anomaly Alerts",
                      desc: "Get notified when unusual patterns are detected",
                    },
                    {
                      id: "forecast_ready",
                      label: "Forecast Ready",
                      desc: "Notify when new forecasts are completed",
                    },
                    {
                      id: "daily_summary",
                      label: "Daily Summary",
                      desc: "Receive a daily digest of key metrics",
                    },
                  ].map((notif) => (
                    <div
                      key={notif.id}
                      className="flex items-center justify-between p-4 rounded-lg bg-card border border-border"
                    >
                      <div>
                        <Label className="font-medium">{notif.label}</Label>
                        <p className="text-sm text-muted-foreground mt-1">
                          {notif.desc}
                        </p>
                      </div>
                      <Switch
                        checked={
                          settings.notifications[notif.id as keyof typeof settings.notifications]
                        }
                        onCheckedChange={(checked) =>
                          setSettings({
                            ...settings,
                            notifications: {
                              ...settings.notifications,
                              [notif.id]: checked,
                            },
                          })
                        }
                      />
                    </div>
                  ))}
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          {/* Forecast Settings */}
          <TabsContent value="forecast" className="mt-6 space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sliders className="w-5 h-5" />
                    Forecast Configuration
                  </CardTitle>
                  <CardDescription>
                    Adjust parameters for ML models
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <Label htmlFor="alpha" className="font-medium">
                      Smoothing Factor (Alpha)
                    </Label>
                    <p className="text-sm text-muted-foreground mb-2">
                      Controls weight of recent observations (0.1-0.9)
                    </p>
                    <div className="flex items-center gap-4">
                      <input
                        type="range"
                        id="alpha"
                        min="0.1"
                        max="0.9"
                        step="0.1"
                        value={settings.forecast.alpha}
                        onChange={(e) => {
                          setSettings({
                            ...settings,
                            forecast: {
                              ...settings.forecast,
                              alpha: parseFloat(e.target.value),
                            },
                          });
                          setIsDirty(true);
                        }}
                        className="flex-1"
                      />
                      <Badge variant="outline">
                        {settings.forecast.alpha.toFixed(1)}
                      </Badge>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-lg bg-card border border-border">
                    <div>
                      <Label className="font-medium">Fast Mode</Label>
                      <p className="text-sm text-muted-foreground mt-1">
                        Use faster models for quick forecasting
                      </p>
                    </div>
                    <Switch
                      checked={settings.forecast.fastMode}
                      onCheckedChange={(checked) => {
                        setSettings({
                          ...settings,
                          forecast: {
                            ...settings.forecast,
                            fastMode: checked,
                          },
                        });
                        setIsDirty(true);
                      }}
                    />
                  </div>

                  <div>
                    <Label className="font-medium block mb-3">Models to Use</Label>
                    <div className="flex flex-wrap gap-2">
                      {(["SMA", "ExpSmoothing", "LinearReg", "ARIMA", "PROPHET", "XGBOOST"] as ForecastModel[]).map(
                        (model) => (
                          <button
                            key={model}
                            onClick={() => {
                              const models = settings.forecast.models;
                              if (models.includes(model)) {
                                setSettings({
                                  ...settings,
                                  forecast: {
                                    ...settings.forecast,
                                    models: models.filter((m) => m !== model),
                                  },
                                });
                              } else {
                                setSettings({
                                  ...settings,
                                  forecast: {
                                    ...settings.forecast,
                                    models: [...models, model],
                                  },
                                });
                              }
                              setIsDirty(true);
                            }}
                            className={cn(
                              "px-3 py-1.5 rounded-full text-sm font-medium transition-all border",
                              settings.forecast.models.includes(model)
                                ? "bg-primary text-primary-foreground border-primary"
                                : "bg-background border-border hover:border-primary"
                            )}
                          >
                            {model}
                          </button>
                        )
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          {/* Data & Export Settings */}
          <TabsContent value="data" className="mt-6 space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="w-5 h-5" />
                    Export Settings
                  </CardTitle>
                  <CardDescription>
                    Configure how data is exported
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <Label htmlFor="format" className="font-medium">
                      Default Export Format
                    </Label>
                    <p className="text-sm text-muted-foreground mb-2">
                      Choose format for data exports
                    </p>
                    <Select
                      value={settings.export.format}
                      onValueChange={(val: any) => {
                        setSettings({
                          ...settings,
                          export: { ...settings.export, format: val },
                        });
                        setIsDirty(true);
                      }}
                    >
                      <SelectTrigger id="format">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="csv">CSV</SelectItem>
                        <SelectItem value="excel">Excel (XLSX)</SelectItem>
                        <SelectItem value="pdf">PDF</SelectItem>
                        <SelectItem value="json">JSON</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-lg bg-card border border-border">
                    <div>
                      <Label className="font-medium">Include Metadata</Label>
                      <p className="text-sm text-muted-foreground mt-1">
                        Add timestamps and model info to exports
                      </p>
                    </div>
                    <Switch
                      checked={settings.export.includeMetadata}
                      onCheckedChange={(checked) => {
                        setSettings({
                          ...settings,
                          export: {
                            ...settings.export,
                            includeMetadata: checked,
                          },
                        });
                        setIsDirty(true);
                      }}
                    />
                  </div>

                  <div>
                    <Label htmlFor="viewType" className="font-medium">
                      Default View Type
                    </Label>
                    <p className="text-sm text-muted-foreground mb-2">
                      Choose between yearly or monthly data aggregation
                    </p>
                    <Select
                      value={settings.viewType}
                      onValueChange={(val: any) => {
                        setSettings({
                          ...settings,
                          viewType: val,
                        });
                        setIsDirty(true);
                      }}
                    >
                      <SelectTrigger id="viewType">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="yearly">Yearly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>
        </Tabs>

        {/* Save button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="mt-8 flex gap-3 flex-col sm:flex-row"
        >
          {isDirty && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-2 text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 px-3 py-2 rounded-lg text-sm w-full sm:w-auto"
            >
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span className="flex-1">Unsaved changes</span>
            </motion.div>
          )}
          <Button
            size="lg"
            onClick={handleSave}
            className="gap-2"
            disabled={saved || !isDirty}
          >
            {saved ? (
              <>
                <Check className="w-4 h-4" />
                Settings Saved
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Settings
              </>
            )}
          </Button>
          <Button
            size="lg"
            variant="outline"
            onClick={handleCancel}
            disabled={!isDirty}
          >
            Cancel
          </Button>
        </motion.div>
      </div>
    </div>
  );
};

export default SettingsPage;
