
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
    <div className="w-full bg-white">
      <div className="w-full overflow-hidden">
        {/* Header Row with Resizable Panels */}
        <ResizablePanelGroup direction="horizontal" className="min-h-[40px] border-b border-gray-200 bg-gray-50">
          <ResizablePanel defaultSize={15} minSize={10}>
            <div className="h-10 flex items-center justify-center text-center font-bold text-gray-700 text-xs px-2">
              Code
            </div>
          </ResizablePanel>
          <ResizableHandle />
          <ResizablePanel defaultSize={20} minSize={15}>
            <div className="h-10 flex items-center justify-center text-center font-bold text-gray-700 text-xs px-2">
              Client/Distributeur
            </div>
          </ResizablePanel>
          <ResizableHandle />
          <ResizablePanel defaultSize={15} minSize={10}>
            <div className="h-10 flex items-center justify-center text-center font-bold text-gray-700 text-xs px-2">
              Numéro
            </div>
          </ResizablePanel>
          <ResizableHandle />
          <ResizablePanel defaultSize={10} minSize={8}>
            <div className="h-10 flex items-center justify-center text-center font-bold text-gray-700 text-xs px-2">
              Prix
            </div>
          </ResizablePanel>
          <ResizableHandle />
          <ResizablePanel defaultSize={15} minSize={12}>
            <div className="h-10 flex items-center justify-center text-center font-bold text-gray-700 text-xs px-2">
              Statut
            </div>
          </ResizablePanel>
          <ResizableHandle />
          <ResizablePanel defaultSize={25} minSize={20}>
            <div className="h-10 flex items-center justify-center text-center font-bold text-gray-700 text-xs px-2">
              Commentaire
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>

        {/* Data Rows with Resizable Panels */}
        {orders.map((order, index) => (
          <ResizablePanelGroup 
            key={order.id}
            direction="horizontal" 
            className={cn(
              "min-h-[40px] border-b border-gray-100 hover:bg-gray-50 transition-colors",
              order.isScanned && "bg-green-50",
              index % 2 === 0 ? "bg-white" : "bg-gray-50"
            )}
          >
            {/* Code Column */}
            <ResizablePanel defaultSize={15} minSize={10}>
              <div className="h-10 flex items-center justify-center text-center font-mono text-xs font-medium text-blue-600 px-2">
                {order.code}
              </div>
            </ResizablePanel>
            <ResizableHandle />

            {/* Vendeur/Client Column */}
            <ResizablePanel defaultSize={20} minSize={15}>
              <div className="h-10 flex items-center justify-center text-center text-xs text-gray-900 px-2">
                {order.vendeur}
              </div>
            </ResizablePanel>
            <ResizableHandle />

            {/* Number Column */}
            <ResizablePanel defaultSize={15} minSize={10}>
              <div className="h-10 flex items-center justify-center text-center font-mono text-xs text-gray-700 px-2">
                {order.numero}
              </div>
            </ResizablePanel>
            <ResizableHandle />

            {/* Price Column */}
            <ResizablePanel defaultSize={10} minSize={8}>
              <div className="h-10 flex items-center justify-center text-center text-xs font-semibold text-green-600 px-2">
                {order.prix.toFixed(2)}
              </div>
            </ResizablePanel>
            <ResizableHandle />

            {/* Status Column */}
            <ResizablePanel defaultSize={15} minSize={12}>
              <div className="h-10 flex items-center justify-center px-2">
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
            </ResizablePanel>
            <ResizableHandle />

            {/* Comment Column */}
            <ResizablePanel defaultSize={25} minSize={20}>
              <div className="h-10 flex items-center px-2">
                <Input
                  value={order.commentaire}
                  onChange={(e) => handleCommentChange(order.id, e.target.value)}
                  className="text-xs h-8 w-full px-2 py-1 border-gray-200 focus:border-blue-400 bg-white"
                  placeholder="اكتب تعليق..."
                />
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        ))}
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
