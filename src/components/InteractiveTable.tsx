
import React from 'react';
import OrdersTable from './OrdersTable';
import type { Order } from '@/pages/Index';

interface InteractiveTableProps {
  orders: Order[];
  onUpdateComment: (id: string, comment: string) => void;
  onUpdateStatus: (id: string, status: string) => void;
  onUpdatePhone: (id: string, phone: string) => void;
}

const InteractiveTable: React.FC<InteractiveTableProps> = ({ orders, onUpdateComment, onUpdateStatus, onUpdatePhone }) => {
  return (
    <div className="w-full">
      <OrdersTable
        orders={orders}
        onUpdateComment={onUpdateComment}
        onUpdateStatus={onUpdateStatus}
        onUpdatePhone={onUpdatePhone}
      />
    </div>
  );
};

export default InteractiveTable;
