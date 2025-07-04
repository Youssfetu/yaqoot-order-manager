
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calculator, TrendingUp, Package, DollarSign } from 'lucide-react';
import type { Order } from '@/pages/Index';

interface OrderSummaryProps {
  orders: Order[];
  commission: number;
}

const OrderSummary: React.FC<OrderSummaryProps> = ({ orders, commission }) => {
  const totalAmount = orders.reduce((sum, order) => sum + order.prix, 0);
  const totalCommission = commission * orders.length;
  const orderCount = orders.length;
  
  // Calculate payment status
  const confirmedOrders = orders.filter(order => order.statut === 'مؤكد');
  const totalPaid = confirmedOrders.reduce((sum, order) => sum + order.prix, 0);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">المبلغ الإجمالي</p>
              <p className="text-2xl font-bold">{totalAmount.toFixed(2)} د.م</p>
            </div>
            <Calculator className="h-8 w-8 text-blue-200" />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">المدفوع</p>
              <p className="text-2xl font-bold">{totalPaid.toFixed(2)} د.م</p>
            </div>
            <DollarSign className="h-8 w-8 text-green-200" />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm">العمولة الإجمالية</p>
              <p className="text-2xl font-bold">{totalCommission.toFixed(2)} د.م</p>
            </div>
            <TrendingUp className="h-8 w-8 text-orange-200" />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm">عدد الطلبيات</p>
              <p className="text-2xl font-bold">{orderCount}</p>
            </div>
            <Package className="h-8 w-8 text-purple-200" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OrderSummary;
