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
  const [editingCell, setEditingCell] = useState<string | null>(null);
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

  // Enhanced keyboard shortcuts for zoom with focus point preservation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === '=' || e.key === '+') {
          e.preventDefault();
          zoomAtPoint(0.1, null);
        } else if (e.key === '-') {
          e.preventDefault();
          zoomAtPoint(-0.1, null);
        } else if (e.key === '0') {
          e.preventDefault();
          setZoomLevel(1);
          setPanOffset({ x: 0, y: 0 });
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [zoomLevel, panOffset]);

  // Enhanced zoom function that preserves focus point
  const zoomAtPoint = (deltaZoom: number, focusPoint: { x: number, y: number } | null) => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const rect = container.getBoundingClientRect();
    
    // Use center of viewport if no focus point provided
    const focusX = focusPoint?.x ?? rect.width / 2;
    const focusY = focusPoint?.y ?? rect.height / 2;
    
    const newZoom = Math.max(0.3, Math.min(3, zoomLevel + deltaZoom));
    const zoomFactor = newZoom / zoomLevel;
    
    // Calculate the position of the focus point relative to the current pan offset
    const currentFocusX = (focusX - panOffset.x) / zoomLevel;
    const currentFocusY = (focusY - panOffset.y) / zoomLevel;
    
    // Calculate new pan offset to keep the focus point at the same screen position
    const newPanX = focusX - currentFocusX * newZoom;
    const newPanY = focusY - currentFocusY * newZoom;
    
    // Apply limits to prevent excessive panning
    const maxPanX = 0;
    const maxPanY = 0;
    const minPanX = Math.min(0, rect.width - (800 * newZoom));
    const minPanY = Math.min(0, rect.height - (600 * newZoom));
    
    setZoomLevel(newZoom);
    setPanOffset({
      x: Math.max(minPanX, Math.min(maxPanX, newPanX)),
      y: Math.max(minPanY, Math.min(maxPanY, newPanY))
    });
  };

  // Enhanced touch-based zoom functionality with focus point
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      // Pinch zoom start
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const distance = Math.sqrt(
        Math.pow(touch2.clientX - touch1.clientX, 2) + 
        Math.pow(touch2.clientY - touch1.clientY, 2)
      );
      
      // Calculate the center point between two fingers
      const centerX = (touch1.clientX + touch2.clientX) / 2;
      const centerY = (touch1.clientY + touch2.clientY) / 2;
      
      // Convert to container-relative coordinates
      const rect = containerRef.current?.getBoundingClientRect();
      if (rect) {
        const focusX = centerX - rect.left;
        const focusY = centerY - rect.top;
        (e.currentTarget as any).focusPoint = { x: focusX, y: focusY };
      }
      
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
      // Pinch zoom with focus point preservation
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const distance = Math.sqrt(
        Math.pow(touch2.clientX - touch1.clientX, 2) + 
        Math.pow(touch2.clientY - touch1.clientY, 2)
      );
      
      const initialDistance = (e.currentTarget as any).initialDistance;
      const initialZoom = (e.currentTarget as any).initialZoom;
      const focusPoint = (e.currentTarget as any).focusPoint;
      
      if (initialDistance && initialZoom && focusPoint) {
        const scale = distance / initialDistance;
        const newZoom = Math.max(0.3, Math.min(3, initialZoom * scale));
        const deltaZoom = newZoom - zoomLevel;
        
        if (Math.abs(deltaZoom) > 0.01) {
          zoomAtPoint(deltaZoom, focusPoint);
        }
      }
    } else if (e.touches.length === 1 && isPanning && zoomLevel > 1) {
      // Single touch pan with improved limits
      const touch = e.touches[0];
      const rect = containerRef.current?.getBoundingClientRect();
      
      if (rect) {
        const maxPanX = 0;
        const maxPanY = 0;
        const minPanX = Math.min(0, rect.width - (800 * zoomLevel));
        const minPanY = Math.min(0, rect.height - (600 * zoomLevel));
        
        const newOffsetX = Math.max(minPanX, Math.min(maxPanX, touch.clientX - panStart.x));
        const newOffsetY = Math.max(minPanY, Math.min(maxPanY, touch.clientY - panStart.y));
        
        setPanOffset({ x: newOffsetX, y: newOffsetY });
      }
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

  const handleCommentFocus = (id: string) => {
    setEditingCell(id);
  };

  const handleCommentBlur = () => {
    setEditingCell(null);
  };

  const handleCommentKeyDown = (e: React.KeyboardEvent, id: string) => {
    if (e.key === 'Enter') {
      setEditingCell(null);
    }
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

  // Enhanced wheel zoom with focus point preservation
  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      
      const rect = containerRef.current?.getBoundingClientRect();
      if (rect) {
        const focusX = e.clientX - rect.left;
        const focusY = e.clientY - rect.top;
        const deltaZoom = e.deltaY > 0 ? -0.1 : 0.1;
        
        zoomAtPoint(deltaZoom, { x: focusX, y: focusY });
      }
    }
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
          touchAction: editingCell ? 'auto' : 'none',
          scrollbarWidth: showScrollbar ? 'thin' : 'none',
          scrollbarColor: showScrollbar ? '#cbd5e0 #f7fafc' : 'transparent transparent'
        }}
        onTouchStart={editingCell ? undefined : handleTouchStart}
        onTouchMove={editingCell ? undefined : handleTouchMove}
        onTouchEnd={editingCell ? undefined : handleTouchEnd}
        onWheel={editingCell ? undefined : handleWheel}
      >
        {/* Enhanced Transform Container with Focus Point Preservation */}
        <div 
          className="absolute top-0 left-0 w-full h-full"
          style={{
            transform: `scale(${zoomLevel}) translate(${panOffset.x}px, ${panOffset.y}px)`,
            transformOrigin: 'top left',
            transition: isPanning ? 'none' : 'transform 0.2s ease-out',
            minWidth: '800px',
            minHeight: '100%',
            fontSize: '11px',
            pointerEvents: editingCell ? 'none' : 'auto'
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
                        data-code={order.code}
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

              {/* Comment Column - Updated for direct editing */}
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
                          "h-7 px-2 py-1 border-b border-gray-300 flex items-center hover:bg-blue-50 transition-colors duration-150 relative",
                          order.isScanned && "bg-green-50 border-green-200",
                          index % 2 === 0 ? "bg-white" : "bg-gray-50",
                          editingCell === order.id && "bg-white border-blue-500 shadow-sm"
                        )}
                      >
                        {editingCell === order.id ? (
                          <div 
                            className="absolute inset-0 z-50"
                            style={{
                              transform: `scale(${1/zoomLevel}) translate(${-panOffset.x/zoomLevel}px, ${-panOffset.y/zoomLevel}px)`,
                              transformOrigin: 'top left'
                            }}
                          >
                            <input
                              value={order.commentaire}
                              onChange={(e) => handleCommentChange(order.id, e.target.value)}
                              onBlur={handleCommentBlur}
                              onKeyDown={(e) => handleCommentKeyDown(e, order.id)}
                              className="w-full h-full px-2 text-xs border-none outline-none bg-white focus:ring-0"
                              placeholder="اكتب تعليق..."
                              autoFocus
                              style={{
                                fontSize: `${11 * zoomLevel}px`,
                                padding: `${1 * zoomLevel}px ${8 * zoomLevel}px`
                              }}
                            />
                          </div>
                        ) : (
                          <div
                            className="w-full h-full flex items-center cursor-text px-0"
                            onClick={() => handleCommentFocus(order.id)}
                          >
                            <span className="text-xs text-gray-800 truncate w-full">
                              {order.commentaire || 'اكتب تعليق...'}
                            </span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </ResizablePanel>
            </ResizablePanelGroup>
          </div>
        </div>

        {/* Editing Overlay - Prevents zoom/pan when editing */}
        {editingCell && (
          <div 
            className="absolute inset-0 bg-transparent z-30 pointer-events-auto"
            onClick={handleCommentBlur}
          />
        )}
      </div>

      {/* Empty State */}
      {orders.length === 0 && (
        <div className="text-center py-8 text-gray-500 border-t border-gray-300">
          <p className="text-sm">لا توجد طلبات للعرض</p>
          <p className="text-xs mt-1">استخدم زر "طلب جديد" لإضافة أول طلب لك</p>
        </div>
      )}

      {/* Enhanced Touch Instructions */}
      <div className="p-2 bg-blue-50 border-t border-blue-200 text-center">
        <p className="text-xs text-blue-700">
          💡 استخدم إصبعين للتكبير والتصغير في النقطة المحددة • اسحب بإصبع واحد للتنقل عند التكبير • اسحب الخطوط الفاصلة لتغيير حجم الأعمدة
        </p>
        <p className="text-xs text-blue-600 mt-1">
          ⌨️ على الكمبيوتر: Ctrl + / Ctrl - للزوم • Ctrl 0 للعودة للحجم الطبيعي • استخدم Ctrl + عجلة الماوس للزوم على النقطة المحددة
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
