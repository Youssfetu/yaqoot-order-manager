
import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Order } from '@/pages/Index';

interface OrdersTableProps {
  orders: Order[];
  onUpdateComment: (id: string, comment: string) => void;
  onUpdateStatus: (id: string, status: string) => void;
}

const OrdersTable: React.FC<OrdersTableProps> = ({ orders, onUpdateComment, onUpdateStatus }) => {
  const statusOptions = [
    'Nouveau',
    'Confirmé',
    'En cours',
    'Livré',
    'Reporté',
    'Annulé',
    'Refusé',
    'Numéro erroné',
    'Hors zone',
    'Programmé'
  ];

  const handleCommentChange = (id: string, comment: string) => {
    onUpdateComment(id, comment);
  };

  const getStatusBadge = (status: string) => {
    const statusColors = {
      'Confirmé': 'bg-green-500 text-white text-xs px-2 py-0.5',
      'En cours': 'bg-yellow-500 text-white text-xs px-2 py-0.5',
      'Livré': 'bg-emerald-500 text-white text-xs px-2 py-0.5',
      'Reporté': 'bg-orange-500 text-white text-xs px-2 py-0.5',
      'Annulé': 'bg-red-500 text-white text-xs px-2 py-0.5',
      'Refusé': 'bg-red-600 text-white text-xs px-2 py-0.5',
      'Numéro erroné': 'bg-purple-500 text-white text-xs px-2 py-0.5',
      'Hors zone': 'bg-gray-500 text-white text-xs px-2 py-0.5',
      'Programmé': 'bg-blue-500 text-white text-xs px-2 py-0.5',
      'Nouveau': 'bg-blue-500 text-white text-xs px-2 py-0.5'
    };
    
    return (
      <span className={cn('rounded text-xs font-medium', statusColors[status as keyof typeof statusColors] || 'bg-gray-500 text-white px-2 py-0.5')}>
        {status}
      </span>
    );
  };

  return (
    <div className="w-full">
      <div className="w-full overflow-hidden">
        {/* Single ResizablePanelGroup for entire table */}
        <ResizablePanelGroup direction="horizontal" className="w-full">
          {/* Code Column */}
          <ResizablePanel defaultSize={15} minSize={10} maxSize={25}>
            <div className="w-full">
              {/* Header */}
              <div className="h-10 flex items-center justify-center text-center font-bold text-gray-700 text-xs px-2 border-b border-gray-200 bg-gray-50">
                Code
              </div>
              {/* Data Rows */}
              {orders.map((order, index) => (
                <div 
                  key={`code-${order.id}`}
                  className={cn(
                    "h-10 flex items-center justify-center text-center font-mono text-xs font-medium text-blue-600 px-2 border-b border-gray-100",
                    order.isScanned && "bg-green-50",
                    index % 2 === 0 ? "bg-white" : "bg-gray-50"
                  )}
                >
                  {order.code}
                </div>
              ))}
            </div>
          </ResizablePanel>
          
          <ResizableHandle />

          {/* Vendeur/Client Column */}
          <ResizablePanel defaultSize={20} minSize={15} maxSize={30}>
            <div className="w-full">
              {/* Header */}
              <div className="h-10 flex items-center justify-center text-center font-bold text-gray-700 text-xs px-2 border-b border-gray-200 bg-gray-50">
                Client/Distributeur
              </div>
              {/* Data Rows */}
              {orders.map((order, index) => (
                <div 
                  key={`vendeur-${order.id}`}
                  className={cn(
                    "h-10 flex items-center justify-center text-center text-xs text-gray-900 px-2 border-b border-gray-100",
                    order.isScanned && "bg-green-50",
                    index % 2 === 0 ? "bg-white" : "bg-gray-50"
                  )}
                >
                  {order.vendeur}
                </div>
              ))}
            </div>
          </ResizablePanel>
          
          <ResizableHandle />

          {/* Number Column */}
          <ResizablePanel defaultSize={15} minSize={10} maxSize={25}>
            <div className="w-full">
              {/* Header */}
              <div className="h-10 flex items-center justify-center text-center font-bold text-gray-700 text-xs px-2 border-b border-gray-200 bg-gray-50">
                Numéro
              </div>
              {/* Data Rows */}
              {orders.map((order, index) => (
                <div 
                  key={`numero-${order.id}`}
                  className={cn(
                    "h-10 flex items-center justify-center text-center font-mono text-xs text-gray-700 px-2 border-b border-gray-100",
                    order.isScanned && "bg-green-50",
                    index % 2 === 0 ? "bg-white" : "bg-gray-50"
                  )}
                >
                  {order.numero}
                </div>
              ))}
            </div>
          </ResizablePanel>
          
          <ResizableHandle />

          {/* Price Column */}
          <ResizablePanel defaultSize={10} minSize={8} maxSize={15}>
            <div className="w-full">
              {/* Header */}
              <div className="h-10 flex items-center justify-center text-center font-bold text-gray-700 text-xs px-2 border-b border-gray-200 bg-gray-50">
                Prix
              </div>
              {/* Data Rows */}
              {orders.map((order, index) => (
                <div 
                  key={`prix-${order.id}`}
                  className={cn(
                    "h-10 flex items-center justify-center text-center text-xs font-semibold text-green-600 px-2 border-b border-gray-100",
                    order.isScanned && "bg-green-50",
                    index % 2 === 0 ? "bg-white" : "bg-gray-50"
                  )}
                >
                  {order.prix.toFixed(2)}
                </div>
              ))}
            </div>
          </ResizablePanel>
          
          <ResizableHandle />

          {/* Status Column */}
          <ResizablePanel defaultSize={15} minSize={12} maxSize={20}>
            <div className="w-full">
              {/* Header */}
              <div className="h-10 flex items-center justify-center text-center font-bold text-gray-700 text-xs px-2 border-b border-gray-200 bg-gray-50">
                Statut
              </div>
              {/* Data Rows */}
              {orders.map((order, index) => (
                <div 
                  key={`statut-${order.id}`}
                  className={cn(
                    "h-10 flex items-center justify-center px-2 border-b border-gray-100",
                    order.isScanned && "bg-green-50",
                    index % 2 === 0 ? "bg-white" : "bg-gray-50"
                  )}
                >
                  <DropdownMenu>
                    <DropdownMenuTrigger className="flex items-center justify-center gap-1 hover:bg-gray-100 rounded px-1 py-0.5 w-full">
                      {getStatusBadge(order.statut)}
                      <ChevronDown className="h-3 w-3 text-gray-400" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="bg-white shadow-lg border rounded-md z-50 min-w-[140px]">
                      {statusOptions.map((status) => (
                        <DropdownMenuItem
                          key={status}
                          onClick={() => onUpdateStatus(order.id, status)}
                          className="text-xs cursor-pointer hover:bg-gray-100 px-2 py-1"
                        >
                          {getStatusBadge(status)}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))}
            </div>
          </ResizablePanel>
          
          <ResizableHandle />

          {/* Comment Column */}
          <ResizablePanel defaultSize={25} minSize={20} maxSize={40}>
            <div className="w-full">
              {/* Header */}
              <div className="h-10 flex items-center justify-center text-center font-bold text-gray-700 text-xs px-2 border-b border-gray-200 bg-gray-50">
                Commentaire
              </div>
              {/* Data Rows */}
              {orders.map((order, index) => (
                <div 
                  key={`comment-${order.id}`}
                  className={cn(
                    "h-10 flex items-center px-2 border-b border-gray-100",
                    order.isScanned && "bg-green-50",
                    index % 2 === 0 ? "bg-white" : "bg-gray-50"
                  )}
                >
                  <Input
                    value={order.commentaire}
                    onChange={(e) => handleCommentChange(order.id, e.target.value)}
                    className="text-xs h-8 w-full px-2 py-1 border-gray-200 focus:border-blue-400 bg-transparent border-0 focus:ring-0 shadow-none"
                    placeholder="اكتب تعليق..."
                  />
                </div>
              ))}
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>

      {/* Empty State */}
      {orders.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <p className="text-sm">Aucune commande à afficher</p>
          <p className="text-xs mt-1">Utilisez le bouton "Nouvelle commande" pour ajouter votre première commande</p>
        </div>
      )}
    </div>
  );
};

export default OrdersTable;
