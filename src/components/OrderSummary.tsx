import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Calculator, TrendingUp, Package, DollarSign } from 'lucide-react';
import type { Order } from '@/pages/Index';

interface OrderSummaryProps {
  orders: Order[];
  commission: number;
}

const OrderSummary: React.FC<OrderSummaryProps> = ({ orders, commission }) => {
  // الطلبيات المرسلة هي الطلبيات الموجودة في archivedOrders (التي تم تغيير حالتها إلى 'Livré')
  // لذا نحن لا نحتاج لفلترة - جميع الطلبيات المرسلة هنا مُسلمة
  
  // 1. Total - مجموع أثمان الطلبيات المُسلمة (الموجودة في الأرشيف)
  const totalDeliveredAmount = orders.reduce((sum, order) => sum + order.prix, 0);
  
  // 2. Revenue - مجموع أثمان الطلبيات المُسلمة ناقص الكوميسيون
  const totalCommission = commission * orders.length;
  const revenue = totalDeliveredAmount - totalCommission;
  
  // 3. Commission - مجموع الطلبيات المُسلمة ضرب الكوميسيون
  // (already calculated as totalCommission)
  
  // 4. Number of delivered orders - عدد الطلبيات المُسلمة (الموجودة في الأرشيف)
  const deliveredOrderCount = orders.length;

  return (
    <div className="grid grid-cols-4 gap-2 sm:gap-4">
      {/* 1. Total - مجموع أثمان الطلبيات المُسلمة */}
      <div className="flex flex-col items-center gap-1">
        <Calculator className="h-6 w-6 sm:h-8 sm:w-8 text-summary-blue" />
        <p className="text-xs sm:text-sm font-bold text-gray-800">{totalDeliveredAmount.toFixed(0)}</p>
      </div>

      {/* 2. Revenue - مجموع أثمان الطلبيات المُسلمة ناقص الكوميسيون */}
      <div className="flex flex-col items-center gap-1">
        <DollarSign className="h-6 w-6 sm:h-8 sm:w-8 text-summary-green" />
        <p className="text-xs sm:text-sm font-bold text-gray-800">{revenue.toFixed(0)}</p>
      </div>

      {/* 3. Commission - مجموع الطلبيات المُسلمة ضرب الكوميسيون */}
      <div className="flex flex-col items-center gap-1">
        <TrendingUp className="h-6 w-6 sm:h-8 sm:w-8 text-summary-orange" />
        <p className="text-xs sm:text-sm font-bold text-gray-800">{totalCommission.toFixed(0)}</p>
      </div>

      {/* 4. Number of delivered orders - عدد الطلبيات المُسلمة */}
      <div className="flex flex-col items-center gap-1">
        <Package className="h-6 w-6 sm:h-8 sm:w-8 text-summary-purple" />
        <p className="text-xs sm:text-sm font-bold text-gray-800">{deliveredOrderCount}</p>
      </div>
    </div>
  );
};

export default OrderSummary;