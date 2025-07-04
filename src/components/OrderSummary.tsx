

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
    <div className="space-y-3">
      <Card className="bg-white shadow-md border-0 rounded-2xl overflow-hidden">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-600 text-xs font-medium mb-1">T</p>
              <p className="text-lg font-bold text-gray-800">{totalAmount.toFixed(0)}</p>
            </div>
            <div className="bg-blue-100 p-2 rounded-full">
              <Calculator className="h-5 w-5 text-blue-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white shadow-md border-0 rounded-2xl overflow-hidden">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-600 text-xs font-medium mb-1">V</p>
              <p className="text-lg font-bold text-gray-800">{totalPaid.toFixed(0)}</p>
            </div>
            <div className="bg-green-100 p-2 rounded-full">
              <DollarSign className="h-5 w-5 text-green-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white shadow-md border-0 rounded-2xl overflow-hidden">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-600 text-xs font-medium mb-1">C</p>
              <p className="text-lg font-bold text-gray-800">{totalCommission.toFixed(0)}</p>
            </div>
            <div className="bg-orange-100 p-2 rounded-full">
              <TrendingUp className="h-5 w-5 text-orange-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white shadow-md border-0 rounded-2xl overflow-hidden">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-600 text-xs font-medium mb-1">N</p>
              <p className="text-lg font-bold text-gray-800">{orderCount}</p>
            </div>
            <div className="bg-purple-100 p-2 rounded-full">
              <Package className="h-5 w-5 text-purple-600" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OrderSummary;
