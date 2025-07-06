import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Order } from '@/pages/Index';

interface InteractiveTableProps {
  orders: Order[];
  onUpdateComment: (id: string, comment: string) => void;
  onUpdateStatus: (id: string, status: string) => void;
}

interface ColumnWidths {
  code: number;
  vendeur: number;
  numero: number;
  prix: number;
  statut: number;
  commentaire: number;
}

const InteractiveTable: React.FC<InteractiveTableProps> = ({ orders, onUpdateComment, onUpdateStatus }) => {
  const [columnWidths, setColumnWidths] = useState<ColumnWidths>({
    code: 120,
    vendeur: 180,
    numero: 140,
    prix: 100,
    statut: 130,
    commentaire: 200
  });

  const [zoomLevel, setZoomLevel] = useState(1);
  const [isResizing, setIsResizing] = useState<string | null>(null);
  const [resizeStart, setResizeStart] = useState({ x: 0, width: 0 });
  const [editingCell, setEditingCell] = useState<string | null>(null);
  const [lastPinchDistance, setLastPinchDistance] = useState<number | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingStatusChange, setPendingStatusChange] = useState<{orderId: string, status: string} | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const tableRef = useRef<HTMLDivElement>(null);

  const statusOptions = [
    'Confirmé', 'Livré', 'Reporté', 'Annulé', 'Refusé', 'Numéro erroné', 'Hors zone', 'Programmé'
  ];

  const getSortedOrders = (ordersToSort: Order[]) => {
    const bottomStatuses = ['Annulé', 'Refusé', 'Hors zone'];
    
    return [...ordersToSort].sort((a, b) => {
      const aIsBottom = bottomStatuses.includes(a.statut);
      const bIsBottom = bottomStatuses.includes(b.statut);
      
      if (aIsBottom && !bIsBottom) return 1;
      if (!aIsBottom && bIsBottom) return -1;
      
      return 0;
    });
  };

  const handleZoomIn = () => {
    const newZoom = Math.min(3, zoomLevel + 0.2);
    setZoomLevel(newZoom);
  };

  const handleZoomOut = () => {
    const newZoom = Math.max(0.5, zoomLevel - 0.2);
    setZoomLevel(newZoom);
  };

  const handleResetZoom = () => {
    setZoomLevel(1);
  };

  const getZoomPercentage = () => Math.round(zoomLevel * 100);

  const handleResizeStart = (e: React.MouseEvent | React.TouchEvent, column: keyof ColumnWidths) => {
    e.preventDefault();
    e.stopPropagation();
    
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    setIsResizing(column);
    setResizeStart({
      x: clientX,
      width: columnWidths[column]
    });
  };

  const handleResizeMove = useCallback((e: MouseEvent | TouchEvent) => {
    if (!isResizing) return;
    
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const deltaX = clientX - resizeStart.x;
    const newWidth = Math.max(60, resizeStart.width + deltaX);
    
    setColumnWidths(prev => ({
      ...prev,
      [isResizing]: newWidth
    }));
  }, [isResizing, resizeStart]);

  const handleResizeEnd = useCallback(() => {
    setIsResizing(null);
  }, []);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (editingCell || isResizing) return;
    
    if (e.touches.length === 2) {
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const distance = Math.sqrt(
        Math.pow(touch2.clientX - touch1.clientX, 2) + 
        Math.pow(touch2.clientY - touch1.clientY, 2)
      );
      
      setLastPinchDistance(distance);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (editingCell || isResizing) return;
    
    if (e.touches.length === 2 && lastPinchDistance !== null) {
      e.preventDefault();
      
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const distance = Math.sqrt(
        Math.pow(touch2.clientX - touch1.clientX, 2) + 
        Math.pow(touch2.clientY - touch1.clientY, 2)
      );
      
      const scale = distance / lastPinchDistance;
      const newZoom = Math.max(0.5, Math.min(3, zoomLevel * scale));
      
      setZoomLevel(newZoom);
      setLastPinchDistance(distance);
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (e.touches.length < 2) {
      setLastPinchDistance(null);
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (editingCell || isResizing) return;
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      
      const deltaZoom = e.deltaY > 0 ? -0.1 : 0.1;
      const newZoom = Math.max(0.5, Math.min(3, zoomLevel + deltaZoom));
      
      setZoomLevel(newZoom);
    }
  };

  const handleStatusChangeRequest = (orderId: string, newStatus: string) => {
    if (newStatus === 'Livré') {
      setPendingStatusChange({ orderId, status: newStatus });
      setShowConfirmDialog(true);
    } else {
      onUpdateStatus(orderId, newStatus);
    }
  };

  const handleConfirmStatusChange = () => {
    if (pendingStatusChange) {
      onUpdateStatus(pendingStatusChange.orderId, pendingStatusChange.status);
      setPendingStatusChange(null);
    }
    setShowConfirmDialog(false);
  };

  const handleCancelStatusChange = () => {
    setPendingStatusChange(null);
    setShowConfirmDialog(false);
  };

  useEffect(() => {
    if (isResizing) {
      const handleMouseMove = (e: MouseEvent) => handleResizeMove(e);
      const handleMouseUp = () => handleResizeEnd();
      const handleTouchMove = (e: TouchEvent) => handleResizeMove(e);
      const handleTouchEnd = () => handleResizeEnd();

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.addEventListener('touchmove', handleTouchMove);
      document.addEventListener('touchend', handleTouchEnd);

      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.removeEventListener('touchmove', handleTouchMove);
        document.removeEventListener('touchend', handleTouchEnd);
      };
    }
  }, [isResizing, handleResizeMove, handleResizeEnd]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && !editingCell) {
        if (e.key === '=' || e.key === '+') {
          e.preventDefault();
          handleZoomIn();
        } else if (e.key === '-') {
          e.preventDefault();
          handleZoomOut();
        } else if (e.key === '0') {
          e.preventDefault();
          handleResetZoom();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [editingCell, zoomLevel]);

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'Confirmé': { 
        bg: 'bg-emerald-500 hover:bg-emerald-600', 
        text: 'text-white',
        ring: 'ring-emerald-200',
        label: 'Confirmé'
      },
      'En cours': { 
        bg: 'bg-amber-500 hover:bg-amber-600', 
        text: 'text-white',
        ring: 'ring-amber-200',
        label: 'En cours'
      },
      'Livré': { 
        bg: 'bg-green-600 hover:bg-green-700', 
        text: 'text-white',
        ring: 'ring-green-200',
        label: 'Livré'
      },
      'Reporté': { 
        bg: 'bg-orange-500 hover:bg-orange-600', 
        text: 'text-white',
        ring: 'ring-orange-200',
        label: 'Reporté'
      },
      'Annulé': { 
        bg: 'bg-red-500 hover:bg-red-600', 
        text: 'text-white',
        ring: 'ring-red-200',
        label: 'Annulé'
      },
      'Refusé': { 
        bg: 'bg-red-600 hover:bg-red-700', 
        text: 'text-white',
        ring: 'ring-red-200',
        label: 'Refusé'
      },
      'Numéro erroné': { 
        bg: 'bg-purple-500 hover:bg-purple-600', 
        text: 'text-white',
        ring: 'ring-purple-200',
        label: 'Numéro erroné'
      },
      'Hors zone': { 
        bg: 'bg-gray-500 hover:bg-gray-600', 
        text: 'text-white',
        ring: 'ring-gray-200',
        label: 'Hors zone'
      },
      'Programmé': { 
        bg: 'bg-blue-500 hover:bg-blue-600', 
        text: 'text-white',
        ring: 'ring-blue-200',
        label: 'Programmé'
      },
      'Nouveau': { 
        bg: 'bg-indigo-500 hover:bg-indigo-600', 
        text: 'text-white',
        ring: 'ring-indigo-200',
        label: 'Nouveau'
      }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || {
      bg: 'bg-gray-500 hover:bg-gray-600',
      text: 'text-white',
      ring: 'ring-gray-200',
      label: status
    };
    
    return (
      <div className={cn(
        'inline-flex items-center justify-center rounded-md font-medium px-3 py-1.5 text-xs transition-all duration-200 cursor-pointer',
        'shadow-sm ring-1 ring-inset',
        config.bg,
        config.text,
        config.ring,
        'hover:shadow-md transform hover:scale-105'
      )}>
        <span className="font-semibold">{config.label}</span>
      </div>
    );
  };

  const totalWidth = Object.values(columnWidths).reduce((sum, width) => sum + width, 0);
  
  const sortedOrders = getSortedOrders(orders);

  return (
    <>
      <div className="w-full h-[calc(100vh-200px)] bg-white border border-gray-300 relative overflow-hidden">
        <div 
          ref={containerRef}
          className="w-full h-full overflow-auto"
          style={{
            touchAction: editingCell || isResizing ? 'auto' : 'manipulation'
          }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onWheel={handleWheel}
        >
          <div 
            ref={tableRef}
            style={{
              transform: `scale(${zoomLevel})`,
              transformOrigin: 'top left',
              transition: isResizing ? 'none' : 'transform 0.2s ease-out',
              minWidth: `${totalWidth}px`,
              minHeight: '100%'
            }}
          >
            <div className="bg-white shadow-sm">
              {/* Header Row */}
              <div 
                className="flex bg-gray-100 border-b-2 border-gray-300 sticky top-0 z-20"
                style={{ height: '32px' }}
              >
                <div 
                  className="relative flex items-center justify-center border-r border-gray-300 bg-gray-200 hover:bg-gray-300 transition-colors font-semibold text-xs text-gray-800"
                  style={{ width: `${columnWidths.code}px` }}
                >
                  Code
                  <div 
                    className="absolute right-0 top-0 w-2 h-full cursor-col-resize hover:bg-blue-500 hover:opacity-50 z-30"
                    onMouseDown={(e) => handleResizeStart(e, 'code')}
                    onTouchStart={(e) => handleResizeStart(e, 'code')}
                  />
                </div>

                <div 
                  className="relative flex items-center justify-center border-r border-gray-300 bg-gray-200 hover:bg-gray-300 transition-colors font-semibold text-xs text-gray-800"
                  style={{ width: `${columnWidths.vendeur}px` }}
                >
                  Client/Vendeur
                  <div 
                    className="absolute right-0 top-0 w-2 h-full cursor-col-resize hover:bg-blue-500 hover:opacity-50 z-30"
                    onMouseDown={(e) => handleResizeStart(e, 'vendeur')}
                    onTouchStart={(e) => handleResizeStart(e, 'vendeur')}
                  />
                </div>

                <div 
                  className="relative flex items-center justify-center border-r border-gray-300 bg-gray-200 hover:bg-gray-300 transition-colors font-semibold text-xs text-gray-800"
                  style={{ width: `${columnWidths.numero}px` }}
                >
                  Numéro
                  <div 
                    className="absolute right-0 top-0 w-2 h-full cursor-col-resize hover:bg-blue-500 hover:opacity-50 z-30"
                    onMouseDown={(e) => handleResizeStart(e, 'numero')}
                    onTouchStart={(e) => handleResizeStart(e, 'numero')}
                  />
                </div>

                <div 
                  className="relative flex items-center justify-center border-r border-gray-300 bg-gray-200 hover:bg-gray-300 transition-colors font-semibold text-xs text-gray-800"
                  style={{ width: `${columnWidths.prix}px` }}
                >
                  Prix
                  <div 
                    className="absolute right-0 top-0 w-2 h-full cursor-col-resize hover:bg-blue-500 hover:opacity-50 z-30"
                    onMouseDown={(e) => handleResizeStart(e, 'prix')}
                    onTouchStart={(e) => handleResizeStart(e, 'prix')}
                  />
                </div>

                <div 
                  className="relative flex items-center justify-center border-r border-gray-300 bg-gray-200 hover:bg-gray-300 transition-colors font-semibold text-xs text-gray-800"
                  style={{ width: `${columnWidths.statut}px` }}
                >
                  Statut
                  <div 
                    className="absolute right-0 top-0 w-2 h-full cursor-col-resize hover:bg-blue-500 hover:opacity-50 z-30"
                    onMouseDown={(e) => handleResizeStart(e, 'statut')}
                    onTouchStart={(e) => handleResizeStart(e, 'statut')}
                  />
                </div>

                <div 
                  className="relative flex items-center justify-center border-r border-gray-300 bg-gray-200 hover:bg-gray-300 transition-colors font-semibold text-xs text-gray-800"
                  style={{ width: `${columnWidths.commentaire}px` }}
                >
                  Commentaire
                  <div 
                    className="absolute right-0 top-0 w-2 h-full cursor-col-resize hover:bg-blue-500 hover:opacity-50 z-30"
                    onMouseDown={(e) => handleResizeStart(e, 'commentaire')}
                    onTouchStart={(e) => handleResizeStart(e, 'commentaire')}
                  />
                </div>
              </div>

              {/* Data Rows */}
              <div>
                {sortedOrders.map((order, index) => (
                  <div 
                    key={order.id}
                    data-code={order.code}
                    data-order-id={order.id}
                    className={cn(
                      "flex border-b border-gray-200 hover:bg-blue-50 transition-colors",
                      order.isScanned && "bg-green-100 border-green-300",
                      !order.isScanned && (index % 2 === 0 ? "bg-white" : "bg-gray-50")
                    )}
                    style={{ height: '36px' }}
                  >
                    <div 
                      className={cn(
                        "flex items-center justify-center border-r border-gray-200 px-2 text-xs font-mono",
                        order.isScanned ? "text-green-800 bg-green-200 font-bold" : "text-gray-800"
                      )}
                      style={{ width: `${columnWidths.code}px` }}
                    >
                      {order.code}
                    </div>

                    <div 
                      className="flex items-center px-2 border-r border-gray-200 text-xs text-gray-800"
                      style={{ width: `${columnWidths.vendeur}px` }}
                    >
                      <span className="truncate">{order.vendeur}</span>
                    </div>

                    <div 
                      className="flex items-center justify-center border-r border-gray-200 px-2 text-xs font-mono text-gray-800"
                      style={{ width: `${columnWidths.numero}px` }}
                    >
                      {order.numero}
                    </div>

                    <div 
                      className="flex items-center justify-center border-r border-gray-200 px-2 text-xs font-medium text-green-700"
                      style={{ width: `${columnWidths.prix}px` }}
                    >
                      {order.prix.toFixed(2)}
                    </div>

                    <div 
                      className="flex items-center justify-center border-r border-gray-200 px-2"
                      style={{ width: `${columnWidths.statut}px` }}
                    >
                      <DropdownMenu>
                        <DropdownMenuTrigger className="flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 rounded-md p-1">
                          {getStatusBadge(order.statut)}
                          <ChevronDown className="h-3 w-3 text-gray-400 hover:text-gray-600 transition-colors" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="z-50 bg-white shadow-xl border border-gray-200 rounded-lg p-1 min-w-[140px]">
                          {statusOptions.filter(s => s !== order.statut).map((status) => (
                            <DropdownMenuItem
                              key={status}
                              onClick={() => handleStatusChangeRequest(order.id, status)}
                              className="cursor-pointer hover:bg-gray-50 rounded-md p-2 focus:bg-gray-50 transition-colors"
                            >
                              {getStatusBadge(status)}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    <div 
                      className="relative flex items-center border-r border-gray-200 px-2"
                      style={{ width: `${columnWidths.commentaire}px` }}
                    >
                      {editingCell === order.id ? (
                        <input
                          value={order.commentaire}
                          onChange={(e) => onUpdateComment(order.id, e.target.value)}
                          onBlur={() => setEditingCell(null)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') setEditingCell(null);
                          }}
                          className="w-full h-full text-xs border-none outline-none bg-white focus:ring-0 px-0"
                          placeholder="اكتب تعليق..."
                          autoFocus
                        />
                      ) : (
                        <div
                          className="w-full h-full flex items-center cursor-text text-xs text-gray-800"
                          onClick={() => setEditingCell(order.id)}
                        >
                          <span className="truncate">{order.commentaire || 'اكتب تعليق...'}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Dialog for "Livré" status */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد تغيير الحالة</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من أنك تريد تغيير حالة هذه الطلبية إلى "Livré"؟
              هذا يعني أن الطلبية قد تم تسليمها بنجاح.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelStatusChange}>
              إلغاء
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmStatusChange}>
              تأكيد التسليم
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default InteractiveTable;
