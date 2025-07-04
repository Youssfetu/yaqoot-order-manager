
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
      'مؤكد': 'bg-green-500 text-white text-xs px-2 py-0.5',
      'قيد المعالجة': 'bg-yellow-500 text-white text-xs px-2 py-0.5',
      'ألغيت': 'bg-red-500 text-white text-xs px-2 py-0.5',
      'جديد': 'bg-blue-500 text-white text-xs px-2 py-0.5'
    };
    
    return (
      <span className={cn('rounded text-xs font-medium', statusColors[status as keyof typeof statusColors] || 'bg-gray-500 text-white px-2 py-0.5')}>
        {status}
      </span>
    );
  };

  return (
    <div className="w-full border border-gray-400 rounded-lg overflow-hidden bg-white">
      <Table className="w-full text-xs">
        <TableHeader>
          <TableRow className="bg-gray-100 border-b border-gray-400 h-8">
            <TableHead className="text-center font-bold text-gray-800 border-r border-gray-400 px-2 py-1 text-xs h-8">
              الكود
            </TableHead>
            <TableHead className="text-center font-bold text-gray-800 border-r border-gray-400 px-2 py-1 text-xs h-8">
              العميل/الموزع
            </TableHead>
            <TableHead className="text-center font-bold text-gray-800 border-r border-gray-400 px-2 py-1 text-xs h-8">
              الرقم
            </TableHead>
            <TableHead className="text-center font-bold text-gray-800 border-r border-gray-400 px-2 py-1 text-xs h-8">
              السعر
            </TableHead>
            <TableHead className="text-center font-bold text-gray-800 border-r border-gray-400 px-2 py-1 text-xs h-8">
              الحالة
            </TableHead>
            <TableHead className="text-center font-bold text-gray-800 px-2 py-1 text-xs h-8">
              التعليق
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((order, index) => (
            <TableRow
              key={order.id}
              className={cn(
                "border-b border-gray-300 hover:bg-blue-50 transition-colors h-8",
                order.isScanned && "bg-green-50 border-green-300",
                index % 2 === 0 ? "bg-white" : "bg-gray-50"
              )}
            >
              {/* Code */}
              <TableCell className="text-center font-mono text-xs font-medium text-blue-600 border-r border-gray-300 px-2 py-1 h-8">
                {order.code}
              </TableCell>

              {/* Vendeur/Client */}
              <TableCell className="text-center text-xs text-gray-900 border-r border-gray-300 px-2 py-1 h-8">
                {order.vendeur}
              </TableCell>

              {/* Number */}
              <TableCell className="text-center font-mono text-xs text-gray-700 border-r border-gray-300 px-2 py-1 h-8">
                {order.numero}
              </TableCell>

              {/* Price */}
              <TableCell className="text-center text-xs font-semibold text-green-600 border-r border-gray-300 px-2 py-1 h-8">
                {order.prix.toFixed(2)}
              </TableCell>

              {/* Status */}
              <TableCell className="text-center border-r border-gray-300 px-2 py-1 h-8">
                {getStatusBadge(order.statut)}
              </TableCell>

              {/* Comment - Editable */}
              <TableCell className="text-center px-2 py-1 h-8">
                {editingComment === order.id ? (
                  <div className="flex gap-1 items-center">
                    <Input
                      value={tempComment}
                      onChange={(e) => setTempComment(e.target.value)}
                      className="text-xs h-6 flex-1 px-1 py-0"
                      placeholder="تعليق..."
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleCommentSave(order.id);
                        } else if (e.key === 'Escape') {
                          handleCommentCancel();
                        }
                      }}
                      autoFocus
                    />
                    <div className="flex gap-0.5">
                      <button
                        onClick={() => handleCommentSave(order.id)}
                        className="text-green-600 hover:text-green-800 text-xs px-1 py-0.5 rounded border border-green-300 hover:border-green-400 h-6 w-6 flex items-center justify-center"
                      >
                        ✓
                      </button>
                      <button
                        onClick={handleCommentCancel}
                        className="text-red-600 hover:text-red-800 text-xs px-1 py-0.5 rounded border border-red-300 hover:border-red-400 h-6 w-6 flex items-center justify-center"
                      >
                        ✗
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => handleCommentEdit(order.id, order.commentaire)}
                    className="text-xs text-gray-600 cursor-pointer hover:bg-gray-100 px-1 py-0.5 rounded h-6 flex items-center justify-center border border-transparent hover:border-gray-300 truncate"
                    title="انقر للتعديل"
                  >
                    {order.commentaire || 'تعليق...'}
                  </div>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Empty State */}
      {orders.length === 0 && (
        <div className="text-center py-8 text-gray-500 border-t border-gray-300">
          <p className="text-sm">لا توجد طلبيات لعرضها</p>
          <p className="text-xs mt-1">استخدم زر "طلبية جديدة" لإضافة أول طلبية</p>
        </div>
      )}
    </div>
  );
};

export default OrdersTable;
