
import React, { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ChevronDown, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { Order } from '@/pages/Index';

interface OrdersTableProps {
  orders: Order[];
  onUpdateComment: (id: string, comment: string) => void;
  onUpdateStatus: (id: string, status: string) => void;
}

const OrdersTable: React.FC<OrdersTableProps> = ({ orders, onUpdateComment, onUpdateStatus }) => {
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [lastPanOffset, setLastPanOffset] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  
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

  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 0.2, 3));
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 0.2, 0.8));
  };

  const handleZoomReset = () => {
    setZoomLevel(1);
    setPanOffset({ x: 0, y: 0 });
    setLastPanOffset({ x: 0, y: 0 });
  };

  const handleFitToScreen = () => {
    if (containerRef.current) {
      const container = containerRef.current;
      const containerWidth = container.clientWidth;
      const tableWidth = 800; // minimum table width
      const fitZoom = Math.min(containerWidth / tableWidth, 1);
      setZoomLevel(fitZoom);
      setPanOffset({ x: 0, y: 0 });
      setLastPanOffset({ x: 0, y: 0 });
    }
  };

  // Mouse/Touch Pan Handlers
  const handlePanStart = (clientX: number, clientY: number) => {
    if (zoomLevel > 1) {
      setIsPanning(true);
      setPanStart({ x: clientX - panOffset.x, y: clientY - panOffset.y });
    }
  };

  const handlePanMove = (clientX: number, clientY: number) => {
    if (isPanning && zoomLevel > 1) {
      const newOffset = {
        x: clientX - panStart.x,
        y: clientY - panStart.y
      };
      setPanOffset(newOffset);
    }
  };

  const handlePanEnd = () => {
    if (isPanning) {
      setIsPanning(false);
      setLastPanOffset(panOffset);
    }
  };

  // Mouse Events
  const handleMouseDown = (e: React.MouseEvent) => {
    handlePanStart(e.clientX, e.clientY);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    handlePanMove(e.clientX, e.clientY);
  };

  const handleMouseUp = () => {
    handlePanEnd();
  };

  // Touch Events
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      handlePanStart(touch.clientX, touch.clientY);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      e.preventDefault();
      const touch = e.touches[0];
      handlePanMove(touch.clientX, touch.clientY);
    }
  };

  const handleTouchEnd = () => {
    handlePanEnd();
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

  return (
    <div className="w-full bg-white">
      {/* Mobile-Friendly Zoom Controls */}
      <div className="flex items-center justify-between p-3 bg-gray-50 border-b border-gray-300">
        <div className="flex items-center gap-2">
          <Button
            onClick={handleZoomOut}
            variant="outline"
            size="sm"
            className="h-8 w-8 p-0"
            disabled={zoomLevel <= 0.8}
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          
          <span className="text-sm font-medium text-gray-700 min-w-[50px] text-center">
            {Math.round(zoomLevel * 100)}%
          </span>
          
          <Button
            onClick={handleZoomIn}
            variant="outline"
            size="sm"
            className="h-8 w-8 p-0"
            disabled={zoomLevel >= 3}
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            onClick={handleFitToScreen}
            variant="outline"
            size="sm"
            className="text-xs px-2 h-8"
          >
            ملائم للشاشة
          </Button>
          
          <Button
            onClick={handleZoomReset}
            variant="outline"
            size="sm"
            className="h-8 w-8 p-0"
          >
            <RotateCcw className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Scrollable Table Container */}
      <div 
        ref={containerRef}
        className="w-full overflow-hidden border border-gray-300 bg-white relative"
        style={{ 
          cursor: zoomLevel > 1 ? (isPanning ? 'grabbing' : 'grab') : 'default',
          touchAction: zoomLevel > 1 ? 'none' : 'auto'
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div 
          className="w-full overflow-x-auto"
          style={{
            transform: `scale(${zoomLevel}) translate(${panOffset.x / zoomLevel}px, ${panOffset.y / zoomLevel}px)`,
            transformOrigin: 'top left',
            transition: isPanning ? 'none' : 'transform 0.2s ease-out'
          }}
        >
          <div className="min-w-[800px] w-full shadow-lg rounded-lg overflow-hidden">
            {/* Header Row - Optimized for Mobile */}
            <div className="flex w-full border-b border-gray-300 bg-gradient-to-r from-gray-100 to-gray-200 h-12">
              <div className="flex-none w-28 px-3 py-3 border-r border-gray-300 flex items-center justify-center text-sm font-semibold text-gray-700">
                الكود
              </div>
              <div className="flex-none w-44 px-3 py-3 border-r border-gray-300 flex items-center justify-center text-sm font-semibold text-gray-700">
                العميل/الموزع
              </div>
              <div className="flex-none w-36 px-3 py-3 border-r border-gray-300 flex items-center justify-center text-sm font-semibold text-gray-700">
                الرقم
              </div>
              <div className="flex-none w-24 px-3 py-3 border-r border-gray-300 flex items-center justify-center text-sm font-semibold text-gray-700">
                السعر
              </div>
              <div className="flex-none w-28 px-3 py-3 border-r border-gray-300 flex items-center justify-center text-sm font-semibold text-gray-700">
                الحالة
              </div>
              <div className="flex-1 min-w-[240px] px-3 py-3 flex items-center justify-center text-sm font-semibold text-gray-700">
                التعليق
              </div>
            </div>

            {/* Data Rows - Enhanced for Mobile */}
            {orders.map((order, index) => (
              <div 
                key={order.id}
                className={cn(
                  "flex w-full border-b border-gray-200 h-14 hover:bg-blue-50 transition-colors duration-150",
                  order.isScanned && "bg-green-50 border-green-200",
                  index % 2 === 0 ? "bg-white" : "bg-gray-50"
                )}
              >
                {/* Code Column */}
                <div className="flex-none w-28 px-3 py-3 border-r border-gray-200 flex items-center text-sm font-mono text-gray-800">
                  <span className="truncate w-full text-center">{order.code}</span>
                </div>

                {/* Vendeur Column */}
                <div className="flex-none w-44 px-3 py-3 border-r border-gray-200 flex items-center text-sm text-gray-800">
                  <span className="truncate w-full">{order.vendeur}</span>
                </div>

                {/* Number Column */}
                <div className="flex-none w-36 px-3 py-3 border-r border-gray-200 flex items-center text-sm font-mono text-gray-800">
                  <span className="truncate w-full text-center">{order.numero}</span>
                </div>

                {/* Price Column */}
                <div className="flex-none w-24 px-3 py-3 border-r border-gray-200 flex items-center justify-center text-sm font-medium text-green-700">
                  {order.prix.toFixed(2)}
                </div>

                {/* Status Column */}
                <div className="flex-none w-28 px-2 py-3 border-r border-gray-200 flex items-center justify-center">
                  <DropdownMenu>
                    <DropdownMenuTrigger className="flex items-center justify-center w-full h-full focus:outline-none">
                      <div className="flex items-center gap-1">
                        {getStatusBadge(order.statut)}
                        <ChevronDown className="h-3 w-3 text-gray-500 flex-shrink-0" />
                      </div>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="bg-white shadow-lg border border-gray-300 rounded-md z-50 min-w-[140px]">
                      {getAvailableStatusOptions(order.statut).map((status) => (
                        <DropdownMenuItem
                          key={status}
                          onClick={() => onUpdateStatus(order.id, status)}
                          className="text-sm cursor-pointer hover:bg-gray-100 px-3 py-2 focus:bg-gray-100"
                        >
                          {getStatusBadge(status)}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Comment Column - Enhanced for Mobile */}
                <div className="flex-1 min-w-[240px] px-3 py-3 flex items-center">
                  <Input
                    value={order.commentaire}
                    onChange={(e) => handleCommentChange(order.id, e.target.value)}
                    className="text-sm h-8 w-full px-3 py-1 border border-gray-300 focus:border-blue-500 bg-white focus:ring-2 focus:ring-blue-200 shadow-sm focus:outline-none rounded-md"
                    placeholder="اكتب تعليق..."
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Empty State */}
      {orders.length === 0 && (
        <div className="text-center py-12 text-gray-500 border-t border-gray-300">
          <p className="text-base">لا توجد طلبات للعرض</p>
          <p className="text-sm mt-2">استخدم زر "طلب جديد" لإضافة أول طلب لك</p>
        </div>
      )}

      {/* Mobile Usage Instructions */}
      {zoomLevel > 1 && (
        <div className="p-3 bg-blue-50 border-t border-blue-200 text-center">
          <p className="text-xs text-blue-700">
            💡 يمكنك سحب الجدول للتنقل عند التكبير
          </p>
        </div>
      )}
    </div>
  );
};

export default OrdersTable;
