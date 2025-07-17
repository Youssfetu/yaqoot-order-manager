
import React, { useState, useEffect } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  restrictToVerticalAxis,
  restrictToParentElement,
} from '@dnd-kit/modifiers';
import type { Order } from '@/pages/Index';
import SortableOrderRow from './SortableOrderRow';
import { useLanguage } from '@/contexts/LanguageContext';

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

interface OrdersTableProps {
  orders: Order[];
  onUpdateComment: (id: string, comment: string) => void;
  onUpdateStatus: (id: string, status: string) => void;
  onUpdatePhone: (id: string, phone: string) => void;
  onUpdatePrice: (id: string, price: number) => void;
  onReorderOrders: (newOrders: Order[]) => void;
  tableSettings: TableSettings;
}

const OrdersTable: React.FC<OrdersTableProps> = ({
  orders,
  onUpdateComment,
  onUpdateStatus,
  onUpdatePhone,
  onUpdatePrice,
  onReorderOrders,
  tableSettings,
}) => {
  const { t } = useLanguage();
  const [highlightedOrderId, setHighlightedOrderId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Effect to handle highlighting of scanned orders
  useEffect(() => {
    const scannedOrder = orders.find(order => order.isScanned);
    if (scannedOrder) {
      setHighlightedOrderId(scannedOrder.id);
      
      // Remove the temporary highlight after 3 seconds
      const timer = setTimeout(() => {
        setHighlightedOrderId(null);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [orders]);

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = orders.findIndex((order) => order.id === active.id);
      const newIndex = orders.findIndex((order) => order.id === over.id);
      
      const newOrders = arrayMove(orders, oldIndex, newIndex);
      onReorderOrders(newOrders);
    }
  }

  const visibleColumns = Object.entries(tableSettings.columnVisibility)
    .filter(([_, visible]) => visible)
    .map(([column, _]) => column);

  const getColumnWidth = (column: string) => {
    switch (column) {
      case 'code':
        return 'min-w-[100px] w-[100px]';
      case 'destination':
        return 'min-w-[120px] w-[120px]';
      case 'phone':
        return 'min-w-[120px] w-[120px]';
      case 'price':
        return 'min-w-[80px] w-[80px]';
      case 'comment':
        return 'min-w-[200px] flex-1';
      case 'status':
        return 'min-w-[100px] w-[100px]';
      default:
        return 'min-w-[100px]';
    }
  };

  const getColumnAlignment = (column: string) => {
    const alignment = tableSettings.textAlignment[column as keyof typeof tableSettings.textAlignment];
    switch (alignment) {
      case 'center':
        return 'text-center justify-center';
      case 'right':
        return 'text-right justify-end';
      default:
        return 'text-left justify-start';
    }
  };

  return (
    <div className="w-full">
      {/* Table Header */}
      <div className="sticky top-0 z-20 bg-gradient-to-r from-primary/5 via-background to-primary/5 backdrop-blur-sm border-b-2 border-primary/20 shadow-sm">
        <div className="flex items-center h-12 px-2 text-sm font-semibold text-primary">
          {visibleColumns.map((column) => (
            <div
              key={column}
              className={`${getColumnWidth(column)} ${getColumnAlignment(column)} px-2 flex items-center`}
              style={{
                fontSize: `${tableSettings.fontSize}px`,
                fontWeight: tableSettings.fontWeight,
              }}
            >
              {column === 'code' && t('name_code')}
              {column === 'destination' && t('destination')}
              {column === 'phone' && t('phone')}
              {column === 'price' && t('price')}
              {column === 'comment' && t('comment')}
              {column === 'status' && t('status')}
            </div>
          ))}
        </div>
      </div>

      {/* Table Body */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
        modifiers={[restrictToVerticalAxis, restrictToParentElement]}
      >
        <SortableContext items={orders.map(order => order.id)} strategy={verticalListSortingStrategy}>
          <div className="divide-y divide-border/30">
            {orders.map((order, index) => (
              <SortableOrderRow
                key={order.id}
                order={order}
                index={index}
                onUpdateComment={onUpdateComment}
                onUpdateStatus={onUpdateStatus}
                onUpdatePhone={onUpdatePhone}
                onUpdatePrice={onUpdatePrice}
                tableSettings={tableSettings}
                visibleColumns={visibleColumns}
                getColumnWidth={getColumnWidth}
                getColumnAlignment={getColumnAlignment}
                isHighlighted={highlightedOrderId === order.id}
                isScanned={order.isScanned}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {orders.length === 0 && (
        <div className="flex items-center justify-center h-40 text-muted-foreground">
          <p className="text-sm">{t('no_orders')}</p>
        </div>
      )}
    </div>
  );
};

export default OrdersTable;
