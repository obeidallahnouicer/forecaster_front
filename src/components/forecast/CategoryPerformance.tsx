import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell,
  Legend
} from "recharts";
import { TrendingUp, Tag, Layers } from "lucide-react";

interface BrandMetric {
  marque: string;
  mean_sales_forecast?: number;
  mean_qty_forecast?: number;
  count: number;
}

interface FamilyMetric {
  famille: string;
  mean_sales_forecast?: number;
  mean_qty_forecast?: number;
  count: number;
}

interface CategoryPerformanceProps {
  topMarquesBySales: BrandMetric[];
  topMarquesByQty: BrandMetric[];
  topFamillesBySales: FamilyMetric[];
  topFamillesByQty: FamilyMetric[];
}

const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4', '#6366f1', '#84cc16'];

const CategoryPerformance: React.FC<CategoryPerformanceProps> = ({
  topMarquesBySales,
  topMarquesByQty,
  topFamillesBySales,
  topFamillesByQty,
}) => {
  const formatCurrency = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M MAD`;
    if (num >= 1000) return `${(num / 1000).toFixed(0)}K MAD`;
    return `${num.toFixed(0)} MAD`;
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(0)}K`;
    return num.toFixed(0);
  };

  // Transform data for charts
  const brandsData = topMarquesBySales.map((brand, idx) => ({
    name: brand.marque,
    sales: brand.mean_sales_forecast || 0,
    qty: topMarquesByQty.find(b => b.marque === brand.marque)?.mean_qty_forecast || 0,
    products: brand.count,
    color: COLORS[idx % COLORS.length]
  }));

  const familiesData = topFamillesBySales.slice(0, 8).map((family, idx) => ({
    name: family.famille.length > 15 ? family.famille.substring(0, 15) + '...' : family.famille,
    fullName: family.famille,
    sales: family.mean_sales_forecast || 0,
    qty: topFamillesByQty.find(f => f.famille === family.famille)?.mean_qty_forecast || 0,
    products: family.count,
    color: COLORS[idx % COLORS.length]
  }));

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
          <p className="font-semibold mb-2">{payload[0].payload.fullName || label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {entry.name === 'Sales' ? formatCurrency(entry.value) : formatNumber(entry.value)}
            </p>
          ))}
          <p className="text-xs text-muted-foreground mt-1">
            Products: {payload[0].payload.products}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Brands Performance */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Tag className="h-5 w-5 text-blue-600" />
              <CardTitle className="text-lg">Brand Performance</CardTitle>
            </div>
            <Badge variant="secondary">{brandsData.length} Brands</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={brandsData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis 
                dataKey="name" 
                angle={-45} 
                textAnchor="end" 
                height={80}
                tick={{ fontSize: 12 }}
              />
              <YAxis 
                tickFormatter={formatCurrency}
                tick={{ fontSize: 12 }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                wrapperStyle={{ paddingTop: '20px' }}
                iconType="circle"
              />
              <Bar 
                dataKey="sales" 
                name="Avg Sales" 
                radius={[8, 8, 0, 0]}
              >
                {brandsData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>

          {/* Brand Stats */}
          <div className="mt-6 grid grid-cols-3 gap-4">
            {brandsData.map((brand, idx) => (
              <div key={brand.name} className="text-center p-3 rounded-lg bg-muted/50">
                <div 
                  className="w-3 h-3 rounded-full mx-auto mb-2" 
                  style={{ backgroundColor: brand.color }}
                />
                <p className="text-xs font-medium truncate">{brand.name}</p>
                <p className="text-lg font-bold mt-1">{brand.products}</p>
                <p className="text-xs text-muted-foreground">SKUs</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Families Performance */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="h-5 w-5 text-purple-600" />
              <CardTitle className="text-lg">Family Performance</CardTitle>
            </div>
            <Badge variant="secondary">{familiesData.length} Families</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={familiesData} margin={{ top: 20, right: 30, left: 20, bottom: 80 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis 
                dataKey="name" 
                angle={-45} 
                textAnchor="end" 
                height={100}
                tick={{ fontSize: 11 }}
              />
              <YAxis 
                tickFormatter={formatCurrency}
                tick={{ fontSize: 12 }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                wrapperStyle={{ paddingTop: '20px' }}
                iconType="circle"
              />
              <Bar 
                dataKey="sales" 
                name="Avg Sales" 
                radius={[8, 8, 0, 0]}
              >
                {familiesData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>

          {/* Top Families Summary */}
          <div className="mt-6 space-y-2">
            {familiesData.slice(0, 3).map((family, idx) => (
              <div 
                key={family.name} 
                className="flex items-center justify-between p-2 rounded-lg bg-muted/50"
              >
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: family.color }}
                  />
                  <span className="text-sm font-medium truncate" title={family.fullName}>
                    {family.name}
                  </span>
                </div>
                <Badge variant="outline">{family.products} SKUs</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CategoryPerformance;
