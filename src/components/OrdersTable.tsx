
import React, { useState } from 'react';
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
    <div className="w-full border border-gray-400 rounded-lg overflow-hidden bg-white">
      <Table className="w-full text-xs">
        <TableHeader>
          <TableRow className="bg-gray-100 border-b border-gray-400 h-8">
            <TableHead className="text-center font-bold text-gray-800 border-r border-gray-400 px-2 py-1 text-xs h-8 w-20">
              Code
            </TableHead>
            <TableHead className="text-center font-bold text-gray-800 border-r border-gray-400 px-2 py-1 text-xs h-8 w-32">
              Client/Distributeur
            </TableHead>
            <TableHead className="text-center font-bold text-gray-800 border-r border-gray-400 px-2 py-1 text-xs h-8 w-24">
              Numéro
            </TableHead>
            <TableHead className="text-center font-bold text-gray-800 border-r border-gray-400 px-2 py-1 text-xs h-8 w-20">
              Prix
            </TableHead>
            <TableHead className="text-center font-bold text-gray-800 border-r border-gray-400 px-2 py-1 text-xs h-8 w-24">
              Statut
            </TableHead>
            <TableHead className="text-center font-bold text-gray-800 px-2 py-1 text-xs h-8 w-40">
              Commentaire
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
              <TableCell className="text-center font-mono text-xs font-medium text-blue-600 border-r border-gray-300 px-2 py-1 h-8 w-20">
                {order.code}
              </TableCell>

              {/* Vendeur/Client */}
              <TableCell className="text-center text-xs text-gray-900 border-r border-gray-300 px-2 py-1 h-8 w-32">
                {order.vendeur}
              </TableCell>

              {/* Number */}
              <TableCell className="text-center font-mono text-xs text-gray-700 border-r border-gray-300 px-2 py-1 h-8 w-24">
                {order.numero}
              </TableCell>

              {/* Price */}
              <TableCell className="text-center text-xs font-semibold text-green-600 border-r border-gray-300 px-2 py-1 h-8 w-20">
                {order.prix.toFixed(2)}
              </TableCell>

              {/* Status - Now with Dropdown */}
              <TableCell className="text-center border-r border-gray-300 px-2 py-1 h-8 w-24">
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
              </TableCell>

              {/* Comment - Direct Input with increased width */}
              <TableCell className="text-center px-2 py-1 h-8 w-40">
                <Input
                  value={order.commentaire}
                  onChange={(e) => handleCommentChange(order.id, e.target.value)}
                  className="text-xs h-6 w-full px-2 py-1 border-gray-300 focus:border-blue-500"
                  placeholder="اكتب تعليق..."
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

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
