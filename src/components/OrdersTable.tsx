import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { ChevronDown, ZoomIn, ZoomOut, RotateCcw, Move } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { Order } from '@/pages/Index';

interface OrdersTableProps {
  orders: Order[];
  onUpdateComment: (id: string, comment: string) => void;
  onUpdateStatus: (id: string, status: string) => void;
}

const OrdersTable: React.FC<OrdersTableProps> = ({ orders, onUpdateComment, onUpdateStatus }) => {
  const [zoom, setZoom] = useState(1);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [transformOrigin, setTransformOrigin] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const tableRef = useRef<HTMLDivElement>(null);

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

  // Smart zoom to cursor position
  const zoomAtPoint = useCallback((newZoom: number, clientX?: number, clientY?: number) => {
    if (!containerRef.current) return;
    
    const container = containerRef.current;
    const rect = container.getBoundingClientRect();
    
    // Use mouse position or center if not provided
    const pointX = clientX !== undefined ? clientX - rect.left : rect.width / 2;
    const pointY = clientY !== undefined ? clientY - rect.top : rect.height / 2;
    
    // Calculate new transform origin and offset
    const zoomRatio = newZoom / zoom;
    const newOriginX = pointX;
    const newOriginY = pointY;
    
    // Adjust pan offset to keep the zoom point in place
    const deltaX = (pointX - panOffset.x) * (1 - zoomRatio);
    const deltaY = (pointY - panOffset.y) * (1 - zoomRatio);
    
    setTransformOrigin({ x: newOriginX, y: newOriginY });
    setPanOffset({
      x: panOffset.x + deltaX,
      y: panOffset.y + deltaY
    });
    setZoom(newZoom);
  }, [zoom, panOffset]);

  // Handle wheel zoom with cursor position
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const delta = e.deltaY * -0.01;
        const newZoom = Math.min(Math.max(zoom + delta, 0.3), 5);
        zoomAtPoint(newZoom, e.clientX, e.clientY);
      }
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('wheel', handleWheel, { passive: false });
      return () => container.removeEventListener('wheel', handleWheel);
    }
  }, [zoom, zoomAtPoint]);

  // Enhanced touch gestures for mobile
  useEffect(() => {
    let lastTouchDistance = 0;
    let touchCenter = { x: 0, y: 0 };

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
        lastTouchDistance = Math.hypot(
          touch1.clientX - touch2.clientX,
          touch1.clientY - touch2.clientY
        );
        touchCenter = {
          x: (touch1.clientX + touch2.clientX) / 2,
          y: (touch1.clientY + touch2.clientY) / 2
        };
      } else if (e.touches.length === 1) {
        setIsPanning(true);
        setPanStart({
          x: e.touches[0].clientX - panOffset.x,
          y: e.touches[0].clientY - panOffset.y
        });
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        e.preventDefault();
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
        const currentDistance = Math.hypot(
          touch1.clientX - touch2.clientX,
          touch1.clientY - touch2.clientY
        );
        
        if (lastTouchDistance > 0) {
          const scale = currentDistance / lastTouchDistance;
          const newZoom = Math.min(Math.max(zoom * scale, 0.3), 5);
          zoomAtPoint(newZoom, touchCenter.x, touchCenter.y);
        }
        lastTouchDistance = currentDistance;
      } else if (e.touches.length === 1 && isPanning) {
        e.preventDefault();
        setPanOffset({
          x: e.touches[0].clientX - panStart.x,
          y: e.touches[0].clientY - panStart.y
        });
      }
    };

    const handleTouchEnd = () => {
      setIsPanning(false);
      lastTouchDistance = 0;
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('touchstart', handleTouchStart);
      container.addEventListener('touchmove', handleTouchMove, { passive: false });
      container.addEventListener('touchend', handleTouchEnd);
      
      return () => {
        container.removeEventListener('touchstart', handleTouchStart);
        container.removeEventListener('touchmove', handleTouchMove);
        container.removeEventListener('touchend', handleTouchEnd);
      };
    }
  }, [zoom, isPanning, panStart, panOffset, zoomAtPoint]);

  // Enhanced mouse pan with better UX
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0) { // Left mouse button
      setIsPanning(true);
      setPanStart({
        x: e.clientX - panOffset.x,
        y: e.clientY - panOffset.y
      });
      e.preventDefault();
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      setPanOffset({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
  };

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

  const handleZoomIn = () => {
    zoomAtPoint(Math.min(zoom + 0.3, 5));
  };

  const handleZoomOut = () => {
    zoomAtPoint(Math.max(zoom - 0.3, 0.3));
  };

  const handleResetZoom = () => {
    setZoom(1);
    setPanOffset({ x: 0, y: 0 });
    setTransformOrigin({ x: 0, y: 0 });
  };

  const handleFitToScreen = () => {
    if (!containerRef.current || !tableRef.current) return;
    
    const container = containerRef.current;
    const table = tableRef.current;
    
    const containerRect = container.getBoundingClientRect();
    const tableRect = table.getBoundingClientRect();
    
    const scaleX = (containerRect.width * 0.9) / (tableRect.width / zoom);
    const scaleY = (containerRect.height * 0.9) / (tableRect.height / zoom);
    
    const newZoom = Math.min(scaleX, scaleY, 3);
    
    setZoom(newZoom);
    setPanOffset({ x: 0, y: 0 });
    setTransformOrigin({ x: 0, y: 0 });
  };

  return (
    <div className="w-full border border-gray-300 bg-white relative">
      {/* Enhanced Zoom Controls */}
      <div className="absolute top-2 right-2 z-20 flex flex-col gap-1 bg-white rounded-lg shadow-lg border border-gray-200 p-2">
        <div className="flex gap-1">
          <Button
            onClick={handleZoomIn}
            size="sm"
            variant="ghost"
            className="h-8 w-8 p-0 hover:bg-gray-100"
            title="تكبير"
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button
            onClick={handleZoomOut}
            size="sm"
            variant="ghost"
            className="h-8 w-8 p-0 hover:bg-gray-100"
            title="تصغير"
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <Button
            onClick={handleResetZoom}
            size="sm"
            variant="ghost"
            className="h-8 w-8 p-0 hover:bg-gray-100"
            title="إعادة تعيين"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>
        <Button
          onClick={handleFitToScreen}
          size="sm"
          variant="ghost"
          className="h-8 w-full p-0 hover:bg-gray-100 text-xs"
          title="ملء الشاشة"
        >
          ملء الشاشة
        </Button>
        <div className="flex items-center justify-center px-2 text-xs text-gray-600 border-t border-gray-200 pt-1">
          {Math.round(zoom * 100)}%
        </div>
      </div>

      {/* Enhanced Instructions */}
      <div className="absolute top-2 left-2 z-20 text-xs text-gray-500 bg-white/95 rounded-lg px-3 py-2 shadow-sm border border-gray-200">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <Move className="h-3 w-3" />
            <span>اسحب للتنقل</span>
          </div>
          <div>Ctrl + عجلة الماوس للزوم</div>
        </div>
      </div>

      {/* Enhanced Zoomable Container */}
      <div 
        ref={containerRef}
        className="w-full overflow-hidden select-none relative bg-gray-50"
        style={{ 
          cursor: isPanning ? 'grabbing' : 'grab',
          height: '70vh',
          touchAction: 'none'
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <div
          ref={tableRef}
          className="transition-transform duration-100 ease-out bg-white"
          style={{
            transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoom})`,
            transformOrigin: `${transformOrigin.x}px ${transformOrigin.y}px`
          }}
        >
          {/* Horizontal Scroll Container */}
          <div className="w-full overflow-x-auto overflow-y-visible">
            {/* Table with fixed minimum width for mobile */}
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
