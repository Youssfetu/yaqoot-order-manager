
import React from 'react';
import OrdersTable from './OrdersTable';
import type { Order } from '@/pages/Index';

interface TableSettings {
  columnVisibility: {
    code: boolean;
    destination: boolean;
    phone: boolean;
    price: boolean;
    comment: boolean;
    status: boolean;
  };
  fontSize: number;
  fontWeight: 'normal' | 'bold' | 'light';
  textAlignment: {
    code: 'left' | 'center' | 'right';
    phone: 'left' | 'center' | 'right';
    price: 'left' | 'center' | 'right';
    comment: 'left' | 'center' | 'right';
  };
  coordinatesVisibility: boolean;
}

interface InteractiveTableProps {
  orders: Order[];
  onUpdateComment: (id: string, comment: string) => void;
  onUpdateStatus: (id: string, status: string) => void;
  onUpdatePhone: (id: string, phone: string) => void;
  onUpdatePrice: (id: string, price: number) => void;
  onReorderOrders: (newOrders: Order[]) => void;
  tableSettings: TableSettings;
}

const InteractiveTable: React.FC<InteractiveTableProps> = ({ orders, onUpdateComment, onUpdateStatus, onUpdatePhone, onUpdatePrice, onReorderOrders, tableSettings }) => {
  return (
    <div className="w-full h-[calc(100vh-180px)] sm:h-[calc(100vh-200px)] overflow-auto">
      <OrdersTable
        orders={orders}
        onUpdateComment={onUpdateComment}
        onUpdateStatus={onUpdateStatus}
        onUpdatePhone={onUpdatePhone}
        onUpdatePrice={onUpdatePrice}
        onReorderOrders={onReorderOrders}
        tableSettings={tableSettings}
      />
    </div>
  );
};

export default InteractiveTable;
