
import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
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
    <div className="w-full border border-gray-300 rounded-lg overflow-hidden bg-white">
      <Table className="w-full">
        <TableHeader>
          <TableRow className="bg-gray-100 border-b-2 border-gray-300">
            <TableHead className="text-center font-bold text-gray-700 border-r border-gray-300 px-4 py-3">
              الكود
            </TableHead>
            <TableHead className="text-center font-bold text-gray-700 border-r border-gray-300 px-4 py-3">
              العميل/الموزع
            </TableHead>
            <TableHead className="text-center font-bold text-gray-700 border-r border-gray-300 px-4 py-3">
              الرقم
            </TableHead>
            <TableHead className="text-center font-bold text-gray-700 border-r border-gray-300 px-4 py-3">
              السعر
            </TableHead>
            <TableHead className="text-center font-bold text-gray-700 border-r border-gray-300 px-4 py-3">
              الحالة
            </TableHead>
            <TableHead className="text-center font-bold text-gray-700 px-4 py-3">
              التعليق
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((order, index) => (
            <TableRow
              key={order.id}
              className={cn(
                "border-b border-gray-200 hover:bg-gray-50 transition-colors",
                order.isScanned && "bg-green-50 border-green-200",
                index % 2 === 0 ? "bg-white" : "bg-gray-50"
              )}
            >
              {/* Code */}
              <TableCell className="text-center font-mono text-sm font-medium text-blue-600 border-r border-gray-200 px-4 py-3">
                {order.code}
              </TableCell>

              {/* Vendeur/Client */}
              <TableCell className="text-center text-sm text-gray-900 border-r border-gray-200 px-4 py-3">
                {order.vendeur}
              </TableCell>

              {/* Number */}
              <TableCell className="text-center font-mono text-sm text-gray-700 border-r border-gray-200 px-4 py-3">
                {order.numero}
              </TableCell>

              {/* Price */}
              <TableCell className="text-center text-sm font-semibold text-green-600 border-r border-gray-200 px-4 py-3">
                {order.prix.toFixed(2)} د.م
              </TableCell>

              {/* Status */}
              <TableCell className="text-center border-r border-gray-200 px-4 py-3">
                {getStatusBadge(order.statut)}
              </TableCell>

              {/* Comment - Editable */}
              <TableCell className="text-center px-4 py-3">
                {editingComment === order.id ? (
                  <div className="flex gap-2 items-center">
                    <Input
                      value={tempComment}
                      onChange={(e) => setTempComment(e.target.value)}
                      className="text-xs h-8 flex-1"
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
                        className="text-green-600 hover:text-green-800 text-xs px-2 py-1 rounded border border-green-300 hover:border-green-400"
                      >
                        ✓
                      </button>
                      <button
                        onClick={handleCommentCancel}
                        className="text-red-600 hover:text-red-800 text-xs px-2 py-1 rounded border border-red-300 hover:border-red-400"
                      >
                        ✗
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => handleCommentEdit(order.id, order.commentaire)}
                    className="text-xs text-gray-600 cursor-pointer hover:bg-gray-100 p-2 rounded min-h-8 flex items-center justify-center border border-transparent hover:border-gray-300"
                    title="انقر للتعديل"
                  >
                    {order.commentaire || 'انقر لإضافة تعليق...'}
                  </div>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Empty State */}
      {orders.length === 0 && (
        <div className="text-center py-12 text-gray-500 border-t border-gray-200">
          <p>لا توجد طلبيات لعرضها</p>
          <p className="text-sm mt-2">استخدم زر "طلبية جديدة" لإضافة أول طلبية</p>
        </div>
      )}
    </div>
  );
};

export default OrdersTable;
