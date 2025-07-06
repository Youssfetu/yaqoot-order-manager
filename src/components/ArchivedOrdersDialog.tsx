
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { Order } from '@/pages/Index';

interface ArchivedOrdersDialogProps {
  isOpen: boolean;
  onClose: () => void;
  archivedOrders: Order[];
}

const ArchivedOrdersDialog: React.FC<ArchivedOrdersDialogProps> = ({
  isOpen,
  onClose,
  archivedOrders
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-center">
            الطلبيات المسلمة (Archive)
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-auto">
          {archivedOrders.length === 0 ? (
            <div className="flex items-center justify-center h-40">
              <p className="text-gray-500 text-lg">لا توجد طلبيات مسلمة بعد</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-center font-semibold">Code</TableHead>
                  <TableHead className="text-center font-semibold">Client/Vendeur</TableHead>
                  <TableHead className="text-center font-semibold">Numéro</TableHead>
                  <TableHead className="text-center font-semibold">Prix</TableHead>
                  <TableHead className="text-center font-semibold">Statut</TableHead>
                  <TableHead className="text-center font-semibold">Commentaire</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {archivedOrders.map((order) => (
                  <TableRow key={order.id} className="hover:bg-gray-50">
                    <TableCell className="text-center font-mono text-sm">
                      {order.code}
                    </TableCell>
                    <TableCell className="text-center">
                      {order.vendeur}
                    </TableCell>
                    <TableCell className="text-center font-mono">
                      {order.numero}
                    </TableCell>
                    <TableCell className="text-center text-green-600 font-medium">
                      {order.prix.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge className="bg-green-600 hover:bg-green-700 text-white">
                        Livré
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      {order.commentaire || '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
        
        <div className="border-t pt-4 mt-4">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">
              إجمالي الطلبيات المسلمة: {archivedOrders.length}
            </span>
            <span className="text-sm font-medium text-green-600">
              إجمالي القيمة: {archivedOrders.reduce((sum, order) => sum + order.prix, 0).toFixed(2)}
            </span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ArchivedOrdersDialog;
