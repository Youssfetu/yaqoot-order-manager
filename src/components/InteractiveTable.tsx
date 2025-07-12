
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
}

interface InteractiveTableProps {
  orders: Order[];
  onUpdateComment: (id: string, comment: string) => void;
  onUpdateStatus: (id: string, status: string) => void;
  onUpdatePhone: (id: string, phone: string) => void;
  onUpdatePrice: (id: string, price: number) => void;
  tableSettings: TableSettings;
}

const InteractiveTable: React.FC<InteractiveTableProps> = ({ orders, onUpdateComment, onUpdateStatus, onUpdatePhone, onUpdatePrice, tableSettings }) => {
  return (
    <div className="w-full relative">
      <OrdersTable
        orders={orders}
        onUpdateComment={onUpdateComment}
        onUpdateStatus={onUpdateStatus}
        onUpdatePhone={onUpdatePhone}
        onUpdatePrice={onUpdatePrice}
        tableSettings={tableSettings}
      />
    </div>
  );
};

export default InteractiveTable;
