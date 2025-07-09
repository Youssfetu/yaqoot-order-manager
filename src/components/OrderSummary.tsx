
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
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
      {/* 1. Total - مجموع أثمان الطلبيات المُسلمة */}
      <Card className="bg-white shadow-md border-0 rounded-2xl overflow-hidden">
        <CardContent className="p-2 sm:p-3">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="bg-blue-100 p-1.5 sm:p-2 rounded-full w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center flex-shrink-0">
              <Calculator className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600" />
            </div>
            <p className="text-sm sm:text-lg font-bold text-gray-800 truncate">{totalDeliveredAmount.toFixed(0)}</p>
          </div>
        </CardContent>
      </Card>

      {/* 2. Revenue - مجموع أثمان الطلبيات المُسلمة ناقص الكوميسيون */}
      <Card className="bg-white shadow-md border-0 rounded-2xl overflow-hidden">
        <CardContent className="p-2 sm:p-3">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="bg-green-100 p-1.5 sm:p-2 rounded-full w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center flex-shrink-0">
              <DollarSign className="h-3 w-3 sm:h-4 sm:w-4 text-green-600" />
            </div>
            <p className="text-sm sm:text-lg font-bold text-gray-800 truncate">{revenue.toFixed(0)}</p>
          </div>
        </CardContent>
      </Card>

      {/* 3. Commission - مجموع الطلبيات المُسلمة ضرب الكوميسيون */}
      <Card className="bg-white shadow-md border-0 rounded-2xl overflow-hidden">
        <CardContent className="p-2 sm:p-3">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="bg-orange-100 p-1.5 sm:p-2 rounded-full w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center flex-shrink-0">
              <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-orange-600" />
            </div>
            <p className="text-sm sm:text-lg font-bold text-gray-800 truncate">{totalCommission.toFixed(0)}</p>
          </div>
        </CardContent>
      </Card>

      {/* 4. Number of delivered orders - عدد الطلبيات المُسلمة */}
      <Card className="bg-white shadow-md border-0 rounded-2xl overflow-hidden">
        <CardContent className="p-2 sm:p-3">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="bg-purple-100 p-1.5 sm:p-2 rounded-full w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center flex-shrink-0">
              <Package className="h-3 w-3 sm:h-4 sm:w-4 text-purple-600" />
            </div>
            <p className="text-sm sm:text-lg font-bold text-gray-800 truncate">{deliveredOrderCount}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OrderSummary;
