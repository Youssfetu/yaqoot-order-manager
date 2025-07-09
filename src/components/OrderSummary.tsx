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
    <div className="grid grid-cols-4 gap-1 sm:gap-2">
      {/* 1. Total - مجموع أثمان الطلبيات المُسلمة */}
      <Card className="bg-white shadow-md border-0 rounded-2xl overflow-hidden">
        <CardContent className="p-1.5 sm:p-2">
          <div className="flex items-center gap-1 sm:gap-2">
            <Calculator className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 flex-shrink-0" />
            <p className="text-xs sm:text-sm font-bold text-gray-800 truncate">{totalDeliveredAmount.toFixed(0)}</p>
          </div>
        </CardContent>
      </Card>

      {/* 2. Revenue - مجموع أثمان الطلبيات المُسلمة ناقص الكوميسيون */}
      <Card className="bg-white shadow-md border-0 rounded-2xl overflow-hidden">
        <CardContent className="p-1.5 sm:p-2">
          <div className="flex items-center gap-1 sm:gap-2">
            <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 flex-shrink-0" />
            <p className="text-xs sm:text-sm font-bold text-gray-800 truncate">{revenue.toFixed(0)}</p>
          </div>
        </CardContent>
      </Card>

      {/* 3. Commission - مجموع الطلبيات المُسلمة ضرب الكوميسيون */}
      <Card className="bg-white shadow-md border-0 rounded-2xl overflow-hidden">
        <CardContent className="p-1.5 sm:p-2">
          <div className="flex items-center gap-1 sm:gap-2">
            <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-orange-600 flex-shrink-0" />
            <p className="text-xs sm:text-sm font-bold text-gray-800 truncate">{totalCommission.toFixed(0)}</p>
          </div>
        </CardContent>
      </Card>

      {/* 4. Number of delivered orders - عدد الطلبيات المُسلمة */}
      <Card className="bg-white shadow-md border-0 rounded-2xl overflow-hidden">
        <CardContent className="p-1.5 sm:p-2">
          <div className="flex items-center gap-1 sm:gap-2">
            <Package className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600 flex-shrink-0" />
            <p className="text-xs sm:text-sm font-bold text-gray-800 truncate">{deliveredOrderCount}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OrderSummary;