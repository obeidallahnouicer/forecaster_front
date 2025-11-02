import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Package, 
  Search, 
  ChevronDown,
  ChevronUp,
  Filter
} from "lucide-react";
import { motion } from "framer-motion";

interface ProductsByCategory {
  [category: string]: string[];
}

interface ProductCatalogExplorerProps {
  productsByFamille: ProductsByCategory;
  productsByMarque: ProductsByCategory;
  type: "famille" | "marque";
}

const ProductCatalogExplorer: React.FC<ProductCatalogExplorerProps> = ({
  productsByFamille,
  productsByMarque,
  type
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [showProductSearch, setShowProductSearch] = useState<string | null>(null);
  const [productSearchTerm, setProductSearchTerm] = useState("");

  const data = type === "famille" ? productsByFamille : productsByMarque;
  const title = type === "famille" ? "Products by Family" : "Products by Brand";

  // Filter categories by search
  const filteredCategories = Object.entries(data)
    .filter(([category]) => 
      category.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => b[1].length - a[1].length);

  const toggleCategory = (category: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  };

  const getFilteredProducts = (products: string[], category: string) => {
    if (showProductSearch !== category || !productSearchTerm) {
      return products;
    }
    return products.filter(p => 
      p.toLowerCase().includes(productSearchTerm.toLowerCase())
    );
  };

  return (
    <Card className="col-span-full">
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <Package className="h-6 w-6 text-primary" />
            <CardTitle>{title}</CardTitle>
            <Badge variant="secondary">
              {Object.keys(data).length} {type === "famille" ? "Families" : "Brands"}
            </Badge>
          </div>
          
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={`Search ${type}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 max-h-[600px] overflow-y-auto">
          {filteredCategories.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No {type}s found</p>
            </div>
          ) : (
            filteredCategories.map(([category, products], index) => {
              const isExpanded = expandedCategories.has(category);
              const filteredProducts = getFilteredProducts(products, category);
              
              return (
                <motion.div
                  key={category}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                >
                  <Card className="border-l-4 border-l-primary/50">
                    <CardContent className="p-4">
                      {/* Category Header */}
                      <div 
                        className="flex items-center justify-between cursor-pointer hover:bg-muted/50 -m-4 p-4 rounded-lg transition-colors"
                        onClick={() => toggleCategory(category)}
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="p-2 bg-primary/10 rounded-lg">
                            <Package className="h-5 w-5 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold truncate">{category}</p>
                            <p className="text-sm text-muted-foreground">
                              {products.length} products
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">{products.length}</Badge>
                          {isExpanded ? (
                            <ChevronUp className="h-5 w-5 text-muted-foreground" />
                          ) : (
                            <ChevronDown className="h-5 w-5 text-muted-foreground" />
                          )}
                        </div>
                      </div>

                      {/* Expanded Products List */}
                      {isExpanded && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.3 }}
                          className="mt-4 pt-4 border-t"
                        >
                          {/* Product Search */}
                          <div className="mb-3 flex gap-2">
                            <div className="relative flex-1">
                              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input
                                placeholder="Search products..."
                                value={showProductSearch === category ? productSearchTerm : ""}
                                onChange={(e) => {
                                  setShowProductSearch(category);
                                  setProductSearchTerm(e.target.value);
                                }}
                                className="pl-10 text-sm"
                              />
                            </div>
                            {showProductSearch === category && productSearchTerm && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setProductSearchTerm("");
                                  setShowProductSearch(null);
                                }}
                              >
                                Clear
                              </Button>
                            )}
                          </div>

                          {/* Products Grid */}
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 max-h-96 overflow-y-auto">
                            {filteredProducts.length === 0 ? (
                              <div className="col-span-full text-center py-4 text-muted-foreground text-sm">
                                No products match your search
                              </div>
                            ) : (
                              filteredProducts.map((product, idx) => (
                                <motion.div
                                  key={idx}
                                  initial={{ opacity: 0, scale: 0.95 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  transition={{ delay: idx * 0.02 }}
                                  className="p-3 rounded-lg bg-muted/30 hover:bg-muted/60 transition-colors border border-border/50"
                                >
                                  <p className="text-sm font-medium leading-tight">
                                    {product}
                                  </p>
                                </motion.div>
                              ))
                            )}
                          </div>

                          {filteredProducts.length < products.length && (
                            <p className="text-xs text-muted-foreground mt-3 text-center">
                              Showing {filteredProducts.length} of {products.length} products
                            </p>
                          )}
                        </motion.div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ProductCatalogExplorer;
