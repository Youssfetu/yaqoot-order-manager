
import React from 'react';
import OrdersTable from './OrdersTable';
import type { Order } from '@/pages/Index';

interface InteractiveTableProps {
  orders: Order[];
  onUpdateComment: (id: string, comment: string) => void;
  onUpdateStatus: (id: string, status: string) => void;
  onUpdatePhone: (id: string, phone: string) => void;
  onUpdatePrice: (id: string, price: number) => void;
}

const InteractiveTable: React.FC<InteractiveTableProps> = ({ orders, onUpdateComment, onUpdateStatus, onUpdatePhone, onUpdatePrice }) => {
  return (
    <div className="w-full">
      <OrdersTable
        orders={orders}
        onUpdateComment={onUpdateComment}
        onUpdateStatus={onUpdateStatus}
        onUpdatePhone={onUpdatePhone}
        onUpdatePrice={onUpdatePrice}
      />
    </div>
  );
};

export default InteractiveTable;
