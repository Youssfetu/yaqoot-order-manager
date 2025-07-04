
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
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
    <div className="grid grid-cols-4 gap-2">
      <Card className="bg-white shadow-md border-0 rounded-2xl overflow-hidden">
        <CardContent className="p-3">
          <div className="text-center">
            <div className="bg-blue-100 p-2 rounded-full w-10 h-10 mx-auto mb-2 flex items-center justify-center">
              <Calculator className="h-4 w-4 text-blue-600" />
            </div>
            <p className="text-sm font-bold text-gray-800">{totalAmount.toFixed(0)}</p>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white shadow-md border-0 rounded-2xl overflow-hidden">
        <CardContent className="p-3">
          <div className="text-center">
            <div className="bg-green-100 p-2 rounded-full w-10 h-10 mx-auto mb-2 flex items-center justify-center">
              <DollarSign className="h-4 w-4 text-green-600" />
            </div>
            <p className="text-sm font-bold text-gray-800">{totalPaid.toFixed(0)}</p>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white shadow-md border-0 rounded-2xl overflow-hidden">
        <CardContent className="p-3">
          <div className="text-center">
            <div className="bg-orange-100 p-2 rounded-full w-10 h-10 mx-auto mb-2 flex items-center justify-center">
              <TrendingUp className="h-4 w-4 text-orange-600" />
            </div>
            <p className="text-sm font-bold text-gray-800">{totalCommission.toFixed(0)}</p>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white shadow-md border-0 rounded-2xl overflow-hidden">
        <CardContent className="p-3">
          <div className="text-center">
            <div className="bg-purple-100 p-2 rounded-full w-10 h-10 mx-auto mb-2 flex items-center justify-center">
              <Package className="h-4 w-4 text-purple-600" />
            </div>
            <p className="text-sm font-bold text-gray-800">{orderCount}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OrderSummary;
