import React, { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
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
  const [showScrollbar, setShowScrollbar] = useState(false);
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

  // Check if scrollbar should be visible
  useEffect(() => {
    const checkScrollbarVisibility = () => {
      if (containerRef.current) {
        const container = containerRef.current;
        const needsHorizontalScroll = container.scrollWidth > container.clientWidth;
        const isZoomedOut = zoomLevel < 0.8;
        setShowScrollbar(needsHorizontalScroll || isZoomedOut);
      }
    };

    checkScrollbarVisibility();
    window.addEventListener('resize', checkScrollbarVisibility);
    
    return () => {
      window.removeEventListener('resize', checkScrollbarVisibility);
    };
  }, [zoomLevel, orders]);

  // Keyboard shortcuts for zoom
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === '=' || e.key === '+') {
          e.preventDefault();
          setZoomLevel(prev => Math.min(3, prev + 0.1));
        } else if (e.key === '-') {
          e.preventDefault();
          setZoomLevel(prev => Math.max(0.3, prev - 0.1));
        } else if (e.key === '0') {
          e.preventDefault();
          setZoomLevel(1);
          setPanOffset({ x: 0, y: 0 });
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

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
        'inline-flex items-center justify-center rounded-sm text-white font-medium w-16 h-4 text-center',
        statusColors[status as keyof typeof statusColors] || 'bg-gray-500'
      )}>
        <span className="truncate text-[9px]">{status}</span>
      </div>
    );
  };

  const getAvailableStatusOptions = (currentStatus: string) => {
    return statusOptions.filter(status => status !== currentStatus);
  };

  return (
    <div className="w-full bg-white">
      {/* Google Sheets Style Compact Table Container */}
      <div 
        ref={containerRef}
        className={cn(
          "w-full h-[calc(100vh-200px)] border border-gray-300 bg-white relative",
          showScrollbar ? "overflow-x-auto" : "overflow-x-hidden",
          "overflow-y-auto"
        )}
        style={{ 
          cursor: zoomLevel > 1 ? (isPanning ? 'grabbing' : 'grab') : 'default',
          touchAction: 'none',
          scrollbarWidth: showScrollbar ? 'thin' : 'none',
          scrollbarColor: showScrollbar ? '#cbd5e0 #f7fafc' : 'transparent transparent'
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
            fontSize: '11px'
          }}
        >
          <div className="w-full shadow-lg rounded-sm overflow-hidden bg-white">
            {/* Resizable Columns Container */}
            <ResizablePanelGroup direction="horizontal" className="w-full">
              {/* Code Column */}
              <ResizablePanel defaultSize={12} minSize={8}>
                <div className="h-full flex flex-col">
                  {/* Header */}
                  <div className="h-7 px-2 py-1 border-b-2 border-gray-400 bg-gradient-to-r from-gray-200 to-gray-300 flex items-center justify-center sticky top-0 z-10">
                    <span className="text-xs font-bold text-gray-800">الكود</span>
                  </div>
                  {/* Data Rows */}
                  <div className="flex-1">
                    {orders.map((order, index) => (
                      <div 
                        key={order.id}
                        className={cn(
                          "h-7 px-2 py-1 border-b border-gray-300 flex items-center hover:bg-blue-50 transition-colors duration-150",
                          order.isScanned && "bg-green-50 border-green-200",
                          index % 2 === 0 ? "bg-white" : "bg-gray-50"
                        )}
                      >
                        <span className="truncate w-full text-center text-xs font-mono text-gray-800">
                          {order.code}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </ResizablePanel>

              <ResizableHandle withHandle />

              {/* Vendeur Column */}
              <ResizablePanel defaultSize={20} minSize={15}>
                <div className="h-full flex flex-col">
                  {/* Header */}
                  <div className="h-7 px-2 py-1 border-b-2 border-gray-400 bg-gradient-to-r from-gray-200 to-gray-300 flex items-center justify-center sticky top-0 z-10">
                    <span className="text-xs font-bold text-gray-800">العميل/الموزع</span>
                  </div>
                  {/* Data Rows */}
                  <div className="flex-1">
                    {orders.map((order, index) => (
                      <div 
                        key={order.id}
                        className={cn(
                          "h-7 px-2 py-1 border-b border-gray-300 flex items-center hover:bg-blue-50 transition-colors duration-150",
                          order.isScanned && "bg-green-50 border-green-200",
                          index % 2 === 0 ? "bg-white" : "bg-gray-50"
                        )}
                      >
                        <span className="truncate w-full text-xs text-gray-800">
                          {order.vendeur}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </ResizablePanel>

              <ResizableHandle withHandle />

              {/* Number Column */}
              <ResizablePanel defaultSize={16} minSize={12}>
                <div className="h-full flex flex-col">
                  {/* Header */}
                  <div className="h-7 px-2 py-1 border-b-2 border-gray-400 bg-gradient-to-r from-gray-200 to-gray-300 flex items-center justify-center sticky top-0 z-10">
                    <span className="text-xs font-bold text-gray-800">الرقم</span>
                  </div>
                  {/* Data Rows */}
                  <div className="flex-1">
                    {orders.map((order, index) => (
                      <div 
                        key={order.id}
                        className={cn(
                          "h-7 px-2 py-1 border-b border-gray-300 flex items-center hover:bg-blue-50 transition-colors duration-150",
                          order.isScanned && "bg-green-50 border-green-200",
                          index % 2 === 0 ? "bg-white" : "bg-gray-50"
                        )}
                      >
                        <span className="truncate w-full text-center text-xs font-mono text-gray-800">
                          {order.numero}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </ResizablePanel>

              <ResizableHandle withHandle />

              {/* Price Column */}
              <ResizablePanel defaultSize={10} minSize={8}>
                <div className="h-full flex flex-col">
                  {/* Header */}
                  <div className="h-7 px-2 py-1 border-b-2 border-gray-400 bg-gradient-to-r from-gray-200 to-gray-300 flex items-center justify-center sticky top-0 z-10">
                    <span className="text-xs font-bold text-gray-800">السعر</span>
                  </div>
                  {/* Data Rows */}
                  <div className="flex-1">
                    {orders.map((order, index) => (
                      <div 
                        key={order.id}
                        className={cn(
                          "h-7 px-2 py-1 border-b border-gray-300 flex items-center justify-center hover:bg-blue-50 transition-colors duration-150",
                          order.isScanned && "bg-green-50 border-green-200",
                          index % 2 === 0 ? "bg-white" : "bg-gray-50"
                        )}
                      >
                        <span className="text-xs font-medium text-green-700">
                          {order.prix.toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </ResizablePanel>

              <ResizableHandle withHandle />

              {/* Status Column */}
              <ResizablePanel defaultSize={12} minSize={10}>
                <div className="h-full flex flex-col">
                  {/* Header */}
                  <div className="h-7 px-2 py-1 border-b-2 border-gray-400 bg-gradient-to-r from-gray-200 to-gray-300 flex items-center justify-center sticky top-0 z-10">
                    <span className="text-xs font-bold text-gray-800">الحالة</span>
                  </div>
                  {/* Data Rows */}
                  <div className="flex-1">
                    {orders.map((order, index) => (
                      <div 
                        key={order.id}
                        className={cn(
                          "h-7 px-1 py-1 border-b border-gray-300 flex items-center justify-center hover:bg-blue-50 transition-colors duration-150",
                          order.isScanned && "bg-green-50 border-green-200",
                          index % 2 === 0 ? "bg-white" : "bg-gray-50"
                        )}
                      >
                        <DropdownMenu>
                          <DropdownMenuTrigger className="flex items-center justify-center w-full h-full focus:outline-none">
                            <div className="flex items-center gap-1">
                              {getStatusBadge(order.statut)}
                              <ChevronDown className="h-2 w-2 text-gray-500 flex-shrink-0" />
                            </div>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent className="bg-white shadow-lg border border-gray-300 rounded-md z-50 min-w-[120px]">
                            {getAvailableStatusOptions(order.statut).map((status) => (
                              <DropdownMenuItem
                                key={status}
                                onClick={() => onUpdateStatus(order.id, status)}
                                className="text-xs cursor-pointer hover:bg-gray-100 px-2 py-1 focus:bg-gray-100"
                              >
                                {getStatusBadge(status)}
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    ))}
                  </div>
                </div>
              </ResizablePanel>

              <ResizableHandle withHandle />

              {/* Comment Column */}
              <ResizablePanel defaultSize={30} minSize={20}>
                <div className="h-full flex flex-col">
                  {/* Header */}
                  <div className="h-7 px-2 py-1 border-b-2 border-gray-400 bg-gradient-to-r from-gray-200 to-gray-300 flex items-center justify-center sticky top-0 z-10">
                    <span className="text-xs font-bold text-gray-800">التعليق</span>
                  </div>
                  {/* Data Rows */}
                  <div className="flex-1">
                    {orders.map((order, index) => (
                      <div 
                        key={order.id}
                        className={cn(
                          "h-7 px-2 py-1 border-b border-gray-300 flex items-center hover:bg-blue-50 transition-colors duration-150",
                          order.isScanned && "bg-green-50 border-green-200",
                          index % 2 === 0 ? "bg-white" : "bg-gray-50"
                        )}
                      >
                        <Input
                          value={order.commentaire}
                          onChange={(e) => handleCommentChange(order.id, e.target.value)}
                          className="text-xs h-5 w-full px-2 py-1 border border-gray-300 focus:border-blue-500 bg-white focus:ring-1 focus:ring-blue-200 shadow-none focus:outline-none rounded-sm"
                          placeholder="اكتب تعليق..."
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </ResizablePanel>
            </ResizablePanelGroup>
          </div>
        </div>
      </div>

      {/* Empty State */}
      {orders.length === 0 && (
        <div className="text-center py-8 text-gray-500 border-t border-gray-300">
          <p className="text-sm">لا توجد طلبات للعرض</p>
          <p className="text-xs mt-1">استخدم زر "طلب جديد" لإضافة أول طلب لك</p>
        </div>
      )}

      {/* Touch Instructions */}
      <div className="p-2 bg-blue-50 border-t border-blue-200 text-center">
        <p className="text-xs text-blue-700">
          💡 استخدم إصبعين للتكبير والتصغير • اسحب بإصبع واحد للتنقل عند التكبير • اسحب الخطوط الفاصلة لتغيير حجم الأعمدة
        </p>
        <p className="text-xs text-blue-600 mt-1">
          ⌨️ على الكمبيوتر: Ctrl + / Ctrl - للزوم • Ctrl 0 للعودة للحجم الطبيعي
        </p>
      </div>

      {/* Custom scrollbar styles */}
      <style>{`
        div[data-scrollbar="${showScrollbar ? 'show' : 'hide'}"] {
          scrollbar-width: ${showScrollbar ? 'thin' : 'none'};
        }
        div[data-scrollbar="${showScrollbar ? 'show' : 'hide'}"]::-webkit-scrollbar {
          height: ${showScrollbar ? '6px' : '0px'};
        }
        div[data-scrollbar="${showScrollbar ? 'show' : 'hide'}"]::-webkit-scrollbar-track {
          background: ${showScrollbar ? '#f1f5f9' : 'transparent'};
          border-radius: 3px;
        }
        div[data-scrollbar="${showScrollbar ? 'show' : 'hide'}"]::-webkit-scrollbar-thumb {
          background: ${showScrollbar ? '#cbd5e0' : 'transparent'};
          border-radius: 3px;
        }
        div[data-scrollbar="${showScrollbar ? 'show' : 'hide'}"]::-webkit-scrollbar-thumb:hover {
          background: ${showScrollbar ? '#a0aec0' : 'transparent'};
        }
      `}</style>
    </div>
  );
};

export default OrdersTable;
