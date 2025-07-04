
import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { Order } from '@/pages/Index';

interface OrdersTableProps {
  orders: Order[];
  onUpdateComment: (id: string, comment: string) => void;
}

const OrdersTable: React.FC<OrdersTableProps> = ({ orders, onUpdateComment }) => {
  const [editingComment, setEditingComment] = useState<string | null>(null);
  const [tempComment, setTempComment] = useState('');

  const handleCommentEdit = (id: string, currentComment: string) => {
    setEditingComment(id);
    setTempComment(currentComment);
  };

  const handleCommentSave = (id: string) => {
    onUpdateComment(id, tempComment);
    setEditingComment(null);
    setTempComment('');
  };

  const handleCommentCancel = () => {
    setEditingComment(null);
    setTempComment('');
  };

  const getStatusBadge = (status: string) => {
    const statusColors = {
      'مؤكد': 'bg-green-100 text-green-800',
      'قيد المعالجة': 'bg-yellow-100 text-yellow-800',
      'ألغيت': 'bg-red-100 text-red-800',
      'جديد': 'bg-blue-100 text-blue-800'
    };
    
    return (
      <Badge className={cn('text-xs', statusColors[status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800')}>
        {status}
      </Badge>
    );
  };

  return (
    <div className="w-full overflow-auto">
      <div className="min-w-full bg-white rounded-lg border">
        {/* Table Header */}
        <div className="grid grid-cols-6 gap-4 p-4 bg-gray-50 border-b font-semibold text-sm text-gray-700">
          <div className="text-center">الكود</div>
          <div className="text-center">العميل/الموزع</div>
          <div className="text-center">الرقم</div>
          <div className="text-center">السعر</div>
          <div className="text-center">الحالة</div>
          <div className="text-center">التعليق</div>
        </div>

        {/* Table Body */}
        <div className="divide-y divide-gray-200">
          {orders.map((order) => (
            <div
              key={order.id}
              className={cn(
                "grid grid-cols-6 gap-4 p-4 hover:bg-gray-50 transition-colors",
                order.isScanned && "bg-green-50 border-r-4 border-green-500"
              )}
            >
              {/* Code */}
              <div className="text-center font-mono text-sm font-medium text-blue-600">
                {order.code}
              </div>

              {/* Vendeur/Client */}
              <div className="text-center text-sm text-gray-900">
                {order.vendeur}
              </div>

              {/* Number */}
              <div className="text-center font-mono text-sm text-gray-700">
                {order.numero}
              </div>

              {/* Price */}
              <div className="text-center text-sm font-semibold text-green-600">
                {order.prix.toFixed(2)} د.م
              </div>

              {/* Status */}
              <div className="text-center">
                {getStatusBadge(order.statut)}
              </div>

              {/* Comment - Editable */}
              <div className="text-center">
                {editingComment === order.id ? (
                  <div className="flex gap-2">
                    <Input
                      value={tempComment}
                      onChange={(e) => setTempComment(e.target.value)}
                      className="text-xs h-8"
                      placeholder="أدخل التعليق..."
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleCommentSave(order.id);
                        } else if (e.key === 'Escape') {
                          handleCommentCancel();
                        }
                      }}
                      autoFocus
                    />
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleCommentSave(order.id)}
                        className="text-green-600 hover:text-green-800 text-xs px-2 py-1 rounded"
                      >
                        ✓
                      </button>
                      <button
                        onClick={handleCommentCancel}
                        className="text-red-600 hover:text-red-800 text-xs px-2 py-1 rounded"
                      >
                        ✗
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => handleCommentEdit(order.id, order.commentaire)}
                    className="text-xs text-gray-600 cursor-pointer hover:bg-gray-100 p-2 rounded min-h-8 flex items-center justify-center"
                    title="انقر للتعديل"
                  >
                    {order.commentaire || 'انقر لإضافة تعليق...'}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {orders.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <p>لا توجد طلبيات لعرضها</p>
            <p className="text-sm mt-2">استخدم زر "طلبية جديدة" لإضافة أول طلبية</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrdersTable;
