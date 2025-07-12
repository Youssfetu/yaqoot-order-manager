
import React from 'react';
import OrdersTable from './OrdersTable';
import { ScrollArea } from '@/components/ui/scroll-area';
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
      <ScrollArea className="h-[calc(100vh-200px)]">
        <OrdersTable
          orders={orders}
          onUpdateComment={onUpdateComment}
          onUpdateStatus={onUpdateStatus}
          onUpdatePhone={onUpdatePhone}
          onUpdatePrice={onUpdatePrice}
          tableSettings={tableSettings}
        />
      </ScrollArea>
    </div>
  );
};

export default InteractiveTable;
