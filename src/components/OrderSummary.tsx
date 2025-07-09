
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Calculator, TrendingUp, Package, DollarSign } from 'lucide-react';
import type { Order } from '@/pages/Index';

interface OrderSummaryProps {
  orders: Order[];
  commission: number;
}

const OrderSummary: React.FC<OrderSummaryProps> = ({ orders, commission }) => {
  // Filter delivered orders
  const deliveredOrders = orders.filter(order => order.statut === 'Livré');
  
  // Calculate totals for delivered orders
  const totalDeliveredAmount = deliveredOrders.reduce((sum, order) => sum + order.prix, 0);
  const totalDeliveredCommission = commission * deliveredOrders.length;
  const deliveredOrderCount = deliveredOrders.length;
  const totalDeliveredMinusCommission = totalDeliveredAmount - totalDeliveredCommission;

  return (
    <div className="grid grid-cols-4 gap-2">
      <Card className="bg-white shadow-md border-0 rounded-2xl overflow-hidden">
        <CardContent className="p-3">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 p-2 rounded-full w-10 h-10 flex items-center justify-center flex-shrink-0">
              <Calculator className="h-4 w-4 text-blue-600" />
            </div>
            <p className="text-lg font-bold text-gray-800">{totalDeliveredMinusCommission.toFixed(0)}</p>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white shadow-md border-0 rounded-2xl overflow-hidden">
        <CardContent className="p-3">
          <div className="flex items-center gap-3">
            <div className="bg-green-100 p-2 rounded-full w-10 h-10 flex items-center justify-center flex-shrink-0">
              <DollarSign className="h-4 w-4 text-green-600" />
            </div>
            <p className="text-lg font-bold text-gray-800">{totalDeliveredCommission.toFixed(0)}</p>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white shadow-md border-0 rounded-2xl overflow-hidden">
        <CardContent className="p-3">
          <div className="flex items-center gap-3">
            <div className="bg-orange-100 p-2 rounded-full w-10 h-10 flex items-center justify-center flex-shrink-0">
              <Package className="h-4 w-4 text-orange-600" />
            </div>
            <p className="text-lg font-bold text-gray-800">{deliveredOrderCount}</p>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white shadow-md border-0 rounded-2xl overflow-hidden">
        <CardContent className="p-3">
          <div className="flex items-center gap-3">
            <div className="bg-purple-100 p-2 rounded-full w-10 h-10 flex items-center justify-center flex-shrink-0">
              <TrendingUp className="h-4 w-4 text-purple-600" />
            </div>
            <p className="text-lg font-bold text-gray-800">{totalDeliveredAmount.toFixed(0)}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OrderSummary;
