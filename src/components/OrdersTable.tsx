
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
      'Confirmé': 'bg-green-500',
      'En cours': 'bg-yellow-500',
      'Livré': 'bg-emerald-500',
      'Reporté': 'bg-orange-500',
      'Annulé': 'bg-red-500',
      'Refusé': 'bg-red-600',
      'Numéro erroné': 'bg-purple-500',
      'Hors zone': 'bg-gray-500',
      'Programmé': 'bg-blue-500',
      'Nouveau': 'bg-blue-500'
    };
    
    return (
      <span className={cn(
        'inline-block rounded-sm text-white text-xs font-medium px-2 py-1 min-w-fit text-center',
        statusColors[status as keyof typeof statusColors] || 'bg-gray-500'
      )}>
        {status}
      </span>
    );
  };

  return (
    <div className="w-full border border-gray-300">
      <div className="w-full overflow-hidden">
        {/* Table with fixed heights similar to Google Sheets */}
        <ResizablePanelGroup direction="horizontal" className="w-full min-h-0">
          {/* Code Column */}
          <ResizablePanel defaultSize={12} minSize={8} maxSize={20}>
            <div className="w-full border-r border-gray-300">
              {/* Header */}
              <div className="h-8 flex items-center justify-center text-center font-semibold text-gray-700 text-xs px-2 border-b border-gray-300 bg-gray-100">
                Code
              </div>
              {/* Data Rows */}
              {orders.map((order, index) => (
                <div 
                  key={`code-${order.id}`}
                  className={cn(
                    "h-8 flex items-center px-2 border-b border-gray-200 text-xs font-mono text-gray-800 truncate",
                    order.isScanned && "bg-green-50",
                    index % 2 === 0 ? "bg-white" : "bg-gray-50"
                  )}
                  title={order.code}
                >
                  {order.code}
                </div>
              ))}
            </div>
          </ResizablePanel>
          
          <ResizableHandle className="w-px bg-gray-300 hover:bg-blue-400 hover:w-0.5 transition-all" />

          {/* Vendeur/Client Column */}
          <ResizablePanel defaultSize={18} minSize={12} maxSize={25}>
            <div className="w-full border-r border-gray-300">
              {/* Header */}
              <div className="h-8 flex items-center justify-center text-center font-semibold text-gray-700 text-xs px-2 border-b border-gray-300 bg-gray-100">
                Client/Distributeur
              </div>
              {/* Data Rows */}
              {orders.map((order, index) => (
                <div 
                  key={`vendeur-${order.id}`}
                  className={cn(
                    "h-8 flex items-center px-2 border-b border-gray-200 text-xs text-gray-800 truncate",
                    order.isScanned && "bg-green-50",
                    index % 2 === 0 ? "bg-white" : "bg-gray-50"
                  )}
                  title={order.vendeur}
                >
                  {order.vendeur}
                </div>
              ))}
            </div>
          </ResizablePanel>
          
          <ResizableHandle className="w-px bg-gray-300 hover:bg-blue-400 hover:w-0.5 transition-all" />

          {/* Number Column */}
          <ResizablePanel defaultSize={15} minSize={10} maxSize={20}>
            <div className="w-full border-r border-gray-300">
              {/* Header */}
              <div className="h-8 flex items-center justify-center text-center font-semibold text-gray-700 text-xs px-2 border-b border-gray-300 bg-gray-100">
                Numéro
              </div>
              {/* Data Rows */}
              {orders.map((order, index) => (
                <div 
                  key={`numero-${order.id}`}
                  className={cn(
                    "h-8 flex items-center px-2 border-b border-gray-200 text-xs font-mono text-gray-800 truncate",
                    order.isScanned && "bg-green-50",
                    index % 2 === 0 ? "bg-white" : "bg-gray-50"
                  )}
                  title={order.numero}
                >
                  {order.numero}
                </div>
              ))}
            </div>
          </ResizablePanel>
          
          <ResizableHandle className="w-px bg-gray-300 hover:bg-blue-400 hover:w-0.5 transition-all" />

          {/* Price Column */}
          <ResizablePanel defaultSize={10} minSize={8} maxSize={15}>
            <div className="w-full border-r border-gray-300">
              {/* Header */}
              <div className="h-8 flex items-center justify-center text-center font-semibold text-gray-700 text-xs px-2 border-b border-gray-300 bg-gray-100">
                Prix
              </div>
              {/* Data Rows */}
              {orders.map((order, index) => (
                <div 
                  key={`prix-${order.id}`}
                  className={cn(
                    "h-8 flex items-center justify-end px-2 border-b border-gray-200 text-xs font-medium text-green-700 truncate",
                    order.isScanned && "bg-green-50",
                    index % 2 === 0 ? "bg-white" : "bg-gray-50"
                  )}
                  title={order.prix.toFixed(2)}
                >
                  {order.prix.toFixed(2)}
                </div>
              ))}
            </div>
          </ResizablePanel>
          
          <ResizableHandle className="w-px bg-gray-300 hover:bg-blue-400 hover:w-0.5 transition-all" />

          {/* Status Column */}
          <ResizablePanel defaultSize={15} minSize={12} maxSize={20}>
            <div className="w-full border-r border-gray-300">
              {/* Header */}
              <div className="h-8 flex items-center justify-center text-center font-semibold text-gray-700 text-xs px-2 border-b border-gray-300 bg-gray-100">
                Statut
              </div>
              {/* Data Rows */}
              {orders.map((order, index) => (
                <div 
                  key={`statut-${order.id}`}
                  className={cn(
                    "h-8 flex items-center justify-center px-2 border-b border-gray-200",
                    order.isScanned && "bg-green-50",
                    index % 2 === 0 ? "bg-white" : "bg-gray-50"
                  )}
                >
                  <DropdownMenu>
                    <DropdownMenuTrigger className="flex items-center justify-center gap-1 hover:bg-gray-200 rounded-sm px-1 py-0.5 w-full h-full border-0 bg-transparent focus:outline-none focus:ring-0">
                      {getStatusBadge(order.statut)}
                      <ChevronDown className="h-3 w-3 text-gray-500 ml-1" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="bg-white shadow-lg border border-gray-300 rounded-md z-50 min-w-[140px]">
                      {statusOptions.map((status) => (
                        <DropdownMenuItem
                          key={status}
                          onClick={() => onUpdateStatus(order.id, status)}
                          className="text-xs cursor-pointer hover:bg-gray-100 px-3 py-2 focus:bg-gray-100"
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
          
          <ResizableHandle className="w-px bg-gray-300 hover:bg-blue-400 hover:w-0.5 transition-all" />

          {/* Comment Column */}
          <ResizablePanel defaultSize={30} minSize={20} maxSize={40}>
            <div className="w-full">
              {/* Header */}
              <div className="h-8 flex items-center justify-center text-center font-semibold text-gray-700 text-xs px-2 border-b border-gray-300 bg-gray-100">
                Commentaire
              </div>
              {/* Data Rows */}
              {orders.map((order, index) => (
                <div 
                  key={`comment-${order.id}`}
                  className={cn(
                    "h-8 flex items-center px-1 border-b border-gray-200",
                    order.isScanned && "bg-green-50",
                    index % 2 === 0 ? "bg-white" : "bg-gray-50"
                  )}
                >
                  <Input
                    value={order.commentaire}
                    onChange={(e) => handleCommentChange(order.id, e.target.value)}
                    className="text-xs h-6 w-full px-2 py-0 border-0 focus:border-0 bg-transparent focus:ring-0 shadow-none focus:outline-none rounded-none"
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
        <div className="text-center py-8 text-gray-500 border-t border-gray-300">
          <p className="text-sm">Aucune commande à afficher</p>
          <p className="text-xs mt-1">Utilisez le bouton "Nouvelle commande" pour ajouter votre première commande</p>
        </div>
      )}
    </div>
  );
};

export default OrdersTable;
