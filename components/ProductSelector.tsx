"use client";

import { Product } from "@/lib/supabase/types";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { Package } from "lucide-react";

interface ProductSelectorProps {
  products: Product[];
  selectedIds: string[];
  onToggle: (id: string) => void;
}

export default function ProductSelector({
  products,
  selectedIds,
  onToggle,
}: ProductSelectorProps) {
  if (products.length === 0) {
    return (
      <div className="text-center py-8 text-midnight-500">
        <Package className="w-10 h-10 mx-auto mb-2 opacity-50" />
        <p className="text-sm">No add-on products available</p>
      </div>
    );
  }

  const totalAddons = products
    .filter((p) => selectedIds.includes(p.id))
    .reduce((sum, p) => sum + p.price, 0);

  return (
    <div className="space-y-3">
      {products.map((product) => {
        const isSelected = selectedIds.includes(product.id);
        return (
          <label
            key={product.id}
            className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
              isSelected
                ? "border-gold-500/60 bg-gold-500/5"
                : "border-midnight-700 bg-midnight-900 hover:border-midnight-600"
            }`}
          >
            <Checkbox
              id={product.id}
              checked={isSelected}
              onCheckedChange={() => onToggle(product.id)}
              className="mt-0.5 border-midnight-600 data-[state=checked]:bg-gold-500 data-[state=checked]:border-gold-500"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span
                  className={`text-sm font-medium ${
                    isSelected ? "text-white" : "text-midnight-200"
                  }`}
                >
                  {product.name}
                </span>
                <Badge
                  variant={isSelected ? "gold" : "outline"}
                  className={`text-xs flex-shrink-0 ${
                    !isSelected ? "border-midnight-600 text-midnight-400" : ""
                  }`}
                >
                  {formatCurrency(product.price)}
                </Badge>
              </div>
              {product.description && (
                <p className="text-midnight-400 text-xs mt-0.5 line-clamp-1">
                  {product.description}
                </p>
              )}
            </div>
          </label>
        );
      })}

      {selectedIds.length > 0 && (
        <div className="flex items-center justify-between pt-2 border-t border-midnight-700 text-sm">
          <span className="text-midnight-400">
            {selectedIds.length} add-on{selectedIds.length > 1 ? "s" : ""} selected
          </span>
          <span className="text-gold-400 font-semibold">
            +{formatCurrency(totalAddons)}
          </span>
        </div>
      )}
    </div>
  );
}
