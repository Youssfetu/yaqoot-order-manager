
import React from 'react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
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
    'Confirmé',
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
      <div className={cn(
        'inline-flex items-center justify-center rounded-sm text-white text-xs font-medium w-20 h-5 text-center',
        statusColors[status as keyof typeof statusColors] || 'bg-gray-500'
      )}>
        <span className="truncate text-[10px]">{status}</span>
      </div>
    );
  };

  const getAvailableStatusOptions = (currentStatus: string) => {
    return statusOptions.filter(status => status !== currentStatus);
  };

  return (
    <div className="w-full border border-gray-300 bg-white">
      <div className="w-full overflow-x-auto">
        <div className="min-w-[800px] w-full shadow-lg rounded-lg overflow-hidden">
          {/* Header Row */}
          <div className="flex w-full border-b border-gray-300 bg-gradient-to-r from-gray-100 to-gray-200 h-10">
            <div className="flex-none w-24 px-2 py-2 border-r border-gray-300 flex items-center justify-center text-xs font-semibold text-gray-700">
              Code
            </div>
            <div className="flex-none w-40 px-2 py-2 border-r border-gray-300 flex items-center justify-center text-xs font-semibold text-gray-700">
              Client/Distributeur
            </div>
            <div className="flex-none w-32 px-2 py-2 border-r border-gray-300 flex items-center justify-center text-xs font-semibold text-gray-700">
              Numéro
            </div>
            <div className="flex-none w-20 px-2 py-2 border-r border-gray-300 flex items-center justify-center text-xs font-semibold text-gray-700">
              Prix
            </div>
            <div className="flex-none w-24 px-2 py-2 border-r border-gray-300 flex items-center justify-center text-xs font-semibold text-gray-700">
              Statut
            </div>
            <div className="flex-1 min-w-[200px] px-2 py-2 flex items-center justify-center text-xs font-semibold text-gray-700">
              Commentaire
            </div>
          </div>

          {/* Data Rows */}
          {orders.map((order, index) => (
            <div 
              key={order.id}
              className={cn(
                "flex w-full border-b border-gray-200 h-10 hover:bg-blue-50 transition-colors duration-150",
                order.isScanned && "bg-green-50 border-green-200",
                index % 2 === 0 ? "bg-white" : "bg-gray-50"
              )}
            >
              {/* Code Column */}
              <div className="flex-none w-24 px-2 py-2 border-r border-gray-200 flex items-center text-xs font-mono text-gray-800 truncate">
                {order.code}
              </div>

              {/* Vendeur Column */}
              <div className="flex-none w-40 px-2 py-2 border-r border-gray-200 flex items-center text-xs text-gray-800 truncate">
                {order.vendeur}
              </div>

              {/* Number Column */}
              <div className="flex-none w-32 px-2 py-2 border-r border-gray-200 flex items-center text-xs font-mono text-gray-800 truncate">
                {order.numero}
              </div>

              {/* Price Column */}
              <div className="flex-none w-20 px-2 py-2 border-r border-gray-200 flex items-center justify-end text-xs font-medium text-green-700">
                {order.prix.toFixed(2)}
              </div>

              {/* Status Column */}
              <div className="flex-none w-24 px-1 py-2 border-r border-gray-200 flex items-center justify-center">
                <DropdownMenu>
                  <DropdownMenuTrigger className="flex items-center justify-center w-full h-full focus:outline-none">
                    <div className="flex items-center gap-1">
                      {getStatusBadge(order.statut)}
                      <ChevronDown className="h-2 w-2 text-gray-500 flex-shrink-0" />
                    </div>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="bg-white shadow-lg border border-gray-300 rounded-md z-50 min-w-[140px]">
                    {getAvailableStatusOptions(order.statut).map((status) => (
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

              {/* Comment Column */}
              <div className="flex-1 min-w-[200px] px-2 py-2 flex items-center">
                <Input
                  value={order.commentaire}
                  onChange={(e) => handleCommentChange(order.id, e.target.value)}
                  className="text-xs h-6 w-full px-2 py-0 border-0 focus:border-0 bg-transparent focus:ring-1 focus:ring-blue-300 shadow-none focus:outline-none rounded-sm"
                  placeholder="اكتب تعليق..."
                />
              </div>
            </div>
          ))}
        </div>
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
