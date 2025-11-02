import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Trophy, 
  TrendingUp, 
  DollarSign, 
  Package,
  Crown,
  Medal,
  Award
} from "lucide-react";
import { motion } from "framer-motion";

interface TopArticle {
  ref_article: string;
  designation: string;
  sales_avg_forecast?: number;
  qty_avg_forecast?: number;
}

interface TopProductsRankingProps {
  topBySales: TopArticle[];
  topByQty: TopArticle[];
  maxItems?: number;
}

const TopProductsRanking: React.FC<TopProductsRankingProps> = ({ 
  topBySales, 
  topByQty,
  maxItems = 10
}) => {
  const [selectedTab, setSelectedTab] = useState<"sales" | "quantity">("sales");

  const formatCurrency = (num: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'MAD',
      maximumFractionDigits: 0
    }).format(num);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('fr-FR').format(Math.round(num));
  };

  const getRankIcon = (index: number) => {
    switch(index) {
      case 0: return <Crown className="h-5 w-5 text-yellow-500" />;
      case 1: return <Medal className="h-5 w-5 text-gray-400" />;
      case 2: return <Award className="h-5 w-5 text-amber-700" />;
      default: return null;
    }
  };

  const getRankBadgeColor = (index: number) => {
    switch(index) {
      case 0: return "bg-gradient-to-r from-yellow-400 to-yellow-600 text-white";
      case 1: return "bg-gradient-to-r from-gray-300 to-gray-500 text-white";
      case 2: return "bg-gradient-to-r from-amber-600 to-amber-800 text-white";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  const renderProductList = (products: TopArticle[], type: "sales" | "quantity") => {
    return (
      <div className="space-y-3">
        {products.slice(0, maxItems).map((product, index) => {
          const value = type === "sales" ? product.sales_avg_forecast : product.qty_avg_forecast;
          const rankIcon = getRankIcon(index);
          
          return (
            <motion.div
              key={product.ref_article}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="hover:shadow-md transition-all duration-300 border-l-4"
                style={{
                  borderLeftColor: index === 0 ? '#EAB308' : index === 1 ? '#9CA3AF' : index === 2 ? '#D97706' : '#E5E7EB'
                }}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    {/* Rank Badge */}
                    <div className={`flex items-center justify-center w-12 h-12 rounded-full font-bold text-lg ${getRankBadgeColor(index)}`}>
                      {rankIcon || (index + 1)}
                    </div>

                    {/* Product Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm truncate" title={product.designation}>
                            {product.designation}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Ref: {product.ref_article}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Value */}
                    <div className="text-right">
                      <p className="text-lg font-bold text-primary">
                        {value ? (type === "sales" ? formatCurrency(value) : formatNumber(value)) : "N/A"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {type === "sales" ? "Forecast" : "Units"}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>
    );
  };

  return (
    <Card className="col-span-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="h-6 w-6 text-yellow-500" />
            <CardTitle>Top Performing Products</CardTitle>
          </div>
          <Badge variant="secondary">{maxItems} Leaders</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={selectedTab} onValueChange={(v) => setSelectedTab(v as "sales" | "quantity")}>
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="sales" className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              By Sales Value
            </TabsTrigger>
            <TabsTrigger value="quantity" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              By Quantity
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="sales" className="mt-0">
            {renderProductList(topBySales, "sales")}
          </TabsContent>
          
          <TabsContent value="quantity" className="mt-0">
            {renderProductList(topByQty, "quantity")}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default TopProductsRanking;
