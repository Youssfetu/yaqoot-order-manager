import React, { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ChevronDown } from 'lucide-react';
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

  // Touch-based zoom functionality
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      // Pinch zoom start
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const distance = Math.sqrt(
        Math.pow(touch2.clientX - touch1.clientX, 2) + 
        Math.pow(touch2.clientY - touch1.clientY, 2)
      );
      (e.currentTarget as any).initialDistance = distance;
      (e.currentTarget as any).initialZoom = zoomLevel;
    } else if (e.touches.length === 1 && zoomLevel > 1) {
      // Single touch pan start
      const touch = e.touches[0];
      setIsPanning(true);
      setPanStart({ x: touch.clientX - panOffset.x, y: touch.clientY - panOffset.y });
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    e.preventDefault();
    
    if (e.touches.length === 2) {
      // Pinch zoom
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const distance = Math.sqrt(
        Math.pow(touch2.clientX - touch1.clientX, 2) + 
        Math.pow(touch2.clientY - touch1.clientY, 2)
      );
      
      const initialDistance = (e.currentTarget as any).initialDistance;
      const initialZoom = (e.currentTarget as any).initialZoom;
      
      if (initialDistance && initialZoom) {
        const scale = distance / initialDistance;
        const newZoom = Math.max(0.3, Math.min(3, initialZoom * scale));
        setZoomLevel(newZoom);
      }
    } else if (e.touches.length === 1 && isPanning && zoomLevel > 1) {
      // Single touch pan - limit panning to keep table anchored to top-left
      const touch = e.touches[0];
      const newOffsetX = Math.min(0, touch.clientX - panStart.x); // Prevent panning beyond left edge
      const newOffsetY = Math.min(0, touch.clientY - panStart.y); // Prevent panning beyond top edge
      setPanOffset({ x: newOffsetX, y: newOffsetY });
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (e.touches.length < 2) {
      (e.currentTarget as any).initialDistance = null;
      (e.currentTarget as any).initialZoom = null;
    }
    
    if (e.touches.length === 0) {
      setIsPanning(false);
    }
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
      {/* Google Sheets Style Table Container - Removed vertical scroll, added horizontal scroll */}
      <div 
        ref={containerRef}
        className="w-full h-[calc(100vh-200px)] overflow-x-auto overflow-y-hidden border border-gray-300 bg-white relative"
        style={{ 
          cursor: zoomLevel > 1 ? (isPanning ? 'grabbing' : 'grab') : 'default',
          touchAction: 'none'
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Enhanced Transform Container - Fixed Top-Left Anchor */}
        <div 
          className="absolute top-0 left-0 w-full h-full"
          style={{
            transform: `scale(${zoomLevel}) translate(${panOffset.x}px, ${panOffset.y}px)`,
            transformOrigin: 'top left',
            transition: isPanning ? 'none' : 'transform 0.2s ease-out',
            minWidth: '800px',
            minHeight: '100%',
            // Enhance text rendering at different zoom levels
            textRendering: 'optimizeLegibility',
            fontSmooth: 'always',
            WebkitFontSmoothing: 'antialiased',
            MozOsxFontSmoothing: 'grayscale',
            // Prevent text degradation on zoom
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            willChange: 'transform'
          }}
        >
          <div className="w-full shadow-lg rounded-lg overflow-hidden bg-white">
            {/* Header Row - Enhanced for better text quality */}
            <div className="flex w-full border-b-2 border-gray-400 bg-gradient-to-r from-gray-200 to-gray-300 h-12 sticky top-0 z-10">
              <div className="flex-none w-28 px-3 py-3 border-r border-gray-400 flex items-center justify-center text-sm font-bold text-gray-800 bg-gray-100">
                <span style={{ fontSize: `${Math.max(12, 14 / zoomLevel)}px` }}>الكود</span>
              </div>
              <div className="flex-none w-44 px-3 py-3 border-r border-gray-400 flex items-center justify-center text-sm font-bold text-gray-800 bg-gray-100">
                <span style={{ fontSize: `${Math.max(12, 14 / zoomLevel)}px` }}>العميل/الموزع</span>
              </div>
              <div className="flex-none w-36 px-3 py-3 border-r border-gray-400 flex items-center justify-center text-sm font-bold text-gray-800 bg-gray-100">
                <span style={{ fontSize: `${Math.max(12, 14 / zoomLevel)}px` }}>الرقم</span>
              </div>
              <div className="flex-none w-24 px-3 py-3 border-r border-gray-400 flex items-center justify-center text-sm font-bold text-gray-800 bg-gray-100">
                <span style={{ fontSize: `${Math.max(12, 14 / zoomLevel)}px` }}>السعر</span>
              </div>
              <div className="flex-none w-28 px-3 py-3 border-r border-gray-400 flex items-center justify-center text-sm font-bold text-gray-800 bg-gray-100">
                <span style={{ fontSize: `${Math.max(12, 14 / zoomLevel)}px` }}>الحالة</span>
              </div>
              <div className="flex-1 min-w-[240px] px-3 py-3 flex items-center justify-center text-sm font-bold text-gray-800 bg-gray-100">
                <span style={{ fontSize: `${Math.max(12, 14 / zoomLevel)}px` }}>التعليق</span>
              </div>
            </div>

            {/* Data Rows - Enhanced text rendering */}
            <div className="overflow-y-auto" style={{ maxHeight: 'calc(100vh - 280px)' }}>
              {orders.map((order, index) => (
                <div 
                  key={order.id}
                  className={cn(
                    "flex w-full border-b border-gray-300 h-14 hover:bg-blue-50 transition-colors duration-150",
                    order.isScanned && "bg-green-50 border-green-200",
                    index % 2 === 0 ? "bg-white" : "bg-gray-50"
                  )}
                >
                  {/* Code Column */}
                  <div className="flex-none w-28 px-3 py-3 border-r border-gray-300 flex items-center text-sm font-mono text-gray-800 bg-white">
                    <span 
                      className="truncate w-full text-center"
                      style={{ fontSize: `${Math.max(12, 14 / zoomLevel)}px` }}
                    >
                      {order.code}
                    </span>
                  </div>

                  {/* Vendeur Column */}
                  <div className="flex-none w-44 px-3 py-3 border-r border-gray-300 flex items-center text-sm text-gray-800 bg-white">
                    <span 
                      className="truncate w-full"
                      style={{ fontSize: `${Math.max(12, 14 / zoomLevel)}px` }}
                    >
                      {order.vendeur}
                    </span>
                  </div>

                  {/* Number Column */}
                  <div className="flex-none w-36 px-3 py-3 border-r border-gray-300 flex items-center text-sm font-mono text-gray-800 bg-white">
                    <span 
                      className="truncate w-full text-center"
                      style={{ fontSize: `${Math.max(12, 14 / zoomLevel)}px` }}
                    >
                      {order.numero}
                    </span>
                  </div>

                  {/* Price Column */}
                  <div className="flex-none w-24 px-3 py-3 border-r border-gray-300 flex items-center justify-center text-sm font-medium text-green-700 bg-white">
                    <span style={{ fontSize: `${Math.max(12, 14 / zoomLevel)}px` }}>
                      {order.prix.toFixed(2)}
                    </span>
                  </div>

                  {/* Status Column */}
                  <div className="flex-none w-28 px-2 py-3 border-r border-gray-300 flex items-center justify-center bg-white">
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

                  {/* Comment Column */}
                  <div className="flex-1 min-w-[240px] px-3 py-3 flex items-center bg-white">
                    <Input
                      value={order.commentaire}
                      onChange={(e) => handleCommentChange(order.id, e.target.value)}
                      className="text-sm h-8 w-full px-3 py-1 border border-gray-300 focus:border-blue-500 bg-white focus:ring-2 focus:ring-blue-200 shadow-sm focus:outline-none rounded-md"
                      placeholder="اكتب تعليق..."
                      style={{ fontSize: `${Math.max(12, 14 / zoomLevel)}px` }}
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
        <div className="text-center py-12 text-gray-500 border-t border-gray-300">
          <p className="text-base">لا توجد طلبات للعرض</p>
          <p className="text-sm mt-2">استخدم زر "طلب جديد" لإضافة أول طلب لك</p>
        </div>
      )}

      {/* Touch Instructions */}
      <div className="p-3 bg-blue-50 border-t border-blue-200 text-center">
        <p className="text-xs text-blue-700">
          💡 استخدم إصبعين للتكبير والتصغير • اسحب بإصبع واحد للتنقل عند التكبير • اسحب أفقياً للتنقل يميناً ويساراً
        </p>
      </div>
    </div>
  );
};

export default OrdersTable;
