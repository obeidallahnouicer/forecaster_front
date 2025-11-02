import React, { useCallback, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAsyncData } from "@/hooks/useAsyncData";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getMetrics } from "@/infrastructure/forecastApi";
import { ErrorState, EmptyState } from "@/components/ErrorStates";
import { SkeletonCard } from "@/components/LoadingStates";
import {
  RefreshCw,
  Download,
  TrendingUp,
  BarChart3,
  Package,
  Filter,
  X,
  Sparkles
} from "lucide-react";
import { motion } from "framer-motion";
import {
  BusinessMetricsOverview,
  TopProductsRanking,
  CategoryPerformance,
  ProductCatalogExplorer,
} from "@/components/forecast";

interface MetricsFilters {
  marque?: string;
  famille?: string;
  trend_label?: string;
}

const DashboardPage: React.FC = () => {
  const { toast } = useToast();
  
  // State Management
  const [filters, setFilters] = useState<MetricsFilters>({});
  const [filterOpen, setFilterOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  // Data Fetching
  const metricsData = useAsyncData(
    useCallback(async () => {
      try {
        return await getMetrics(filters);
      } catch (err) {
        console.error("Failed to fetch metrics:", err);
        throw err;
      }
    }, [filters]),
    [filters],
    { timeout: 15000, retries: 2 }
  );

  const handleRefresh = () => {
    metricsData.retry();
    toast({
      title: "Refreshing data...",
      description: "Fetching latest metrics",
    });
  };

  const handleExport = () => {
    if (!metricsData.data) return;
    
    const dataStr = JSON.stringify(metricsData.data, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `business-metrics-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
    
    toast({
      title: "Export successful",
      description: "Metrics data exported to JSON",
    });
  };

  const clearFilters = () => {
    setFilters({});
    setFilterOpen(false);
    toast({
      title: "Filters cleared",
      description: "Showing all data",
    });
  };

  const hasActiveFilters = Object.values(filters).some(v => v);

  // Get unique brands and families for filters
  const availableBrands = metricsData.data?.top_marques_by_sales?.map(m => m.marque) || [];
  const availableFamilies = metricsData.data?.top_familles_by_sales?.map(f => f.famille) || [];

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
      >
        <div>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl">
              <Sparkles className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Business Intelligence Dashboard
              </h1>
              <p className="text-muted-foreground mt-1">
                Comprehensive sales forecasting and product analytics
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setFilterOpen(!filterOpen)}
            className={hasActiveFilters ? "border-primary" : ""}
          >
            <Filter className="h-4 w-4 mr-2" />
            Filters
            {hasActiveFilters && (
              <Badge variant="secondary" className="ml-2">
                {Object.values(filters).filter(v => v).length}
              </Badge>
            )}
          </Button>
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={metricsData.isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${metricsData.isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport} disabled={!metricsData.data}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </motion.div>

      {/* Filters Panel */}
      {filterOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
        >
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Filters</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => setFilterOpen(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Brand</label>
                  <Select
                    value={filters.marque || "all"}
                    onValueChange={(value) =>
                      setFilters({ ...filters, marque: value === "all" ? undefined : value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All Brands" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Brands</SelectItem>
                      {availableBrands.map((brand) => (
                        <SelectItem key={brand} value={brand}>
                          {brand}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Family</label>
                  <Select
                    value={filters.famille || "all"}
                    onValueChange={(value) =>
                      setFilters({ ...filters, famille: value === "all" ? undefined : value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All Families" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Families</SelectItem>
                      {availableFamilies.map((family) => (
                        <SelectItem key={family} value={family}>
                          {family}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Trend</label>
                  <Select
                    value={filters.trend_label || "all"}
                    onValueChange={(value) =>
                      setFilters({ ...filters, trend_label: value === "all" ? undefined : value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All Trends" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Trends</SelectItem>
                      <SelectItem value="Rising">Rising</SelectItem>
                      <SelectItem value="Stable">Stable</SelectItem>
                      <SelectItem value="Declining">Declining</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {hasActiveFilters && (
                <div className="mt-4 flex justify-end">
                  <Button variant="outline" size="sm" onClick={clearFilters}>
                    <X className="h-4 w-4 mr-2" />
                    Clear All Filters
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Loading State */}
      {metricsData.isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      )}

      {/* Error State */}
      {metricsData.error && (
        <ErrorState
          title="Failed to load metrics"
          message={metricsData.error.message || "Please try again"}
          onRetry={handleRefresh}
        />
      )}

      {/* Data Display */}
      {metricsData.data && !metricsData.isLoading && (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="products" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              Top Products
            </TabsTrigger>
            <TabsTrigger value="categories" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Categories
            </TabsTrigger>
            <TabsTrigger value="catalog" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              Catalog
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <BusinessMetricsOverview
              metrics={{
                total_rows: metricsData.data.total_rows,
                sales_avg_forecast: metricsData.data.sales_avg_forecast,
                qty_avg_forecast: metricsData.data.qty_avg_forecast,
                avg_data_points: metricsData.data.avg_data_points,
                sales_trend_avg: metricsData.data.sales_trend_avg,
                qty_trend_avg: metricsData.data.qty_trend_avg,
              }}
            />

            <CategoryPerformance
              topMarquesBySales={metricsData.data.top_marques_by_sales || []}
              topMarquesByQty={metricsData.data.top_marques_by_qty || []}
              topFamillesBySales={metricsData.data.top_familles_by_sales || []}
              topFamillesByQty={metricsData.data.top_familles_by_qty || []}
            />
          </TabsContent>

          {/* Products Tab */}
          <TabsContent value="products" className="space-y-6">
            <TopProductsRanking
              topBySales={metricsData.data.top_articles_by_sales || []}
              topByQty={metricsData.data.top_articles_by_qty || []}
              maxItems={10}
            />
          </TabsContent>

          {/* Categories Tab */}
          <TabsContent value="categories" className="space-y-6">
            <CategoryPerformance
              topMarquesBySales={metricsData.data.top_marques_by_sales || []}
              topMarquesByQty={metricsData.data.top_marques_by_qty || []}
              topFamillesBySales={metricsData.data.top_familles_by_sales || []}
              topFamillesByQty={metricsData.data.top_familles_by_qty || []}
            />
          </TabsContent>

          {/* Catalog Tab */}
          <TabsContent value="catalog" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ProductCatalogExplorer
                productsByFamille={metricsData.data.products_by_famille || {}}
                productsByMarque={metricsData.data.products_by_marque || {}}
                type="famille"
              />
              <ProductCatalogExplorer
                productsByFamille={metricsData.data.products_by_famille || {}}
                productsByMarque={metricsData.data.products_by_marque || {}}
                type="marque"
              />
            </div>
          </TabsContent>
        </Tabs>
      )}

      {/* Empty State */}
      {!metricsData.isLoading && !metricsData.error && !metricsData.data && (
        <EmptyState
          title="No data available"
          message="Please check your filters or try again later"
        />
      )}
    </div>
  );
};

export default DashboardPage;
