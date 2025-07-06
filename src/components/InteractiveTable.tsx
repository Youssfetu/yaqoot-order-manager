import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
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
    statut: 120,
    commentaire: 200
  });

  const [zoomLevel, setZoomLevel] = useState(1);
  const [isPanning, setIsPanning] = useState(false);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [isResizing, setIsResizing] = useState<string | null>(null);
  const [resizeStart, setResizeStart] = useState({ x: 0, width: 0 });
  const [editingCell, setEditingCell] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const tableRef = useRef<HTMLDivElement>(null);

  const statusOptions = [
    'Confirmé', 'Livré', 'Reporté', 'Annulé', 'Refusé', 'Numéro erroné', 'Hors zone', 'Programmé'
  ];

  // Column resize handlers - only from header
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

  // Touch and mouse event handlers for zoom and pan
  const handleTouchStart = (e: React.TouchEvent) => {
    if (editingCell || isResizing) return;
    
    if (e.touches.length === 2) {
      // Pinch zoom start
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const distance = Math.sqrt(
        Math.pow(touch2.clientX - touch1.clientX, 2) + 
        Math.pow(touch2.clientY - touch1.clientY, 2)
      );
      
      const centerX = (touch1.clientX + touch2.clientX) / 2;
      const centerY = (touch1.clientY + touch2.clientY) / 2;
      
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
    if (editingCell || isResizing) return;
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
        const newZoom = Math.max(0.5, Math.min(3, initialZoom * scale));
        setZoomLevel(newZoom);
      }
    } else if (e.touches.length === 1 && isPanning && zoomLevel > 1) {
      // Single touch pan
      const touch = e.touches[0];
      const newOffsetX = touch.clientX - panStart.x;
      const newOffsetY = touch.clientY - panStart.y;
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

  // Wheel zoom with focus point
  const handleWheel = (e: React.WheelEvent) => {
    if (editingCell || isResizing) return;
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      
      const rect = containerRef.current?.getBoundingClientRect();
      if (rect) {
        const focusX = e.clientX - rect.left;
        const focusY = e.clientY - rect.top;
        const deltaZoom = e.deltaY > 0 ? -0.1 : 0.1;
        const newZoom = Math.max(0.5, Math.min(3, zoomLevel + deltaZoom));
        
        // Calculate pan offset to keep focus point stable
        const zoomFactor = newZoom / zoomLevel;
        const currentFocusX = (focusX - panOffset.x) / zoomLevel;
        const currentFocusY = (focusY - panOffset.y) / zoomLevel;
        const newPanX = focusX - currentFocusX * newZoom;
        const newPanY = focusY - currentFocusY * newZoom;
        
        setZoomLevel(newZoom);
        setPanOffset({ x: newPanX, y: newPanY });
      }
    }
  };

  // Event listeners for resize
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

  // Keyboard shortcuts for zoom
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && !editingCell) {
        if (e.key === '=' || e.key === '+') {
          e.preventDefault();
          setZoomLevel(prev => Math.min(3, prev + 0.1));
        } else if (e.key === '-') {
          e.preventDefault();
          setZoomLevel(prev => Math.max(0.5, prev - 0.1));
        } else if (e.key === '0') {
          e.preventDefault();
          setZoomLevel(1);
          setPanOffset({ x: 0, y: 0 });
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [editingCell]);

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
        'inline-flex items-center justify-center rounded-sm text-white font-medium px-2 py-1 text-[10px]',
        statusColors[status as keyof typeof statusColors] || 'bg-gray-500'
      )}>
        {status}
      </div>
    );
  };

  const totalWidth = Object.values(columnWidths).reduce((sum, width) => sum + width, 0);

  return (
    <div className="w-full h-[calc(100vh-200px)] bg-white border border-gray-300 relative overflow-hidden">
      {/* Main container */}
      <div 
        ref={containerRef}
        className="w-full h-full overflow-auto"
        style={{
          cursor: zoomLevel > 1 ? (isPanning ? 'grabbing' : 'grab') : 'default',
          touchAction: editingCell || isResizing ? 'auto' : 'none'
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onWheel={handleWheel}
      >
        {/* Transformed content */}
        <div 
          ref={tableRef}
          style={{
            transform: `scale(${zoomLevel}) translate(${panOffset.x}px, ${panOffset.y}px)`,
            transformOrigin: 'top left',
            transition: isPanning || isResizing ? 'none' : 'transform 0.2s ease-out',
            minWidth: `${totalWidth}px`,
            minHeight: '100%'
          }}
        >
          {/* Google Sheets style table */}
          <div className="bg-white shadow-sm">
            {/* Header Row */}
            <div 
              className="flex bg-gray-100 border-b-2 border-gray-300 sticky top-0 z-20"
              style={{ height: '32px' }}
            >
              {/* Code Header */}
              <div 
                className="relative flex items-center justify-center border-r border-gray-300 bg-gray-200 hover:bg-gray-300 transition-colors font-semibold text-xs text-gray-800"
                style={{ width: `${columnWidths.code}px` }}
              >
                الكود
                <div 
                  className="absolute right-0 top-0 w-2 h-full cursor-col-resize hover:bg-blue-500 hover:opacity-50 z-30"
                  onMouseDown={(e) => handleResizeStart(e, 'code')}
                  onTouchStart={(e) => handleResizeStart(e, 'code')}
                />
              </div>

              {/* Vendeur Header */}
              <div 
                className="relative flex items-center justify-center border-r border-gray-300 bg-gray-200 hover:bg-gray-300 transition-colors font-semibold text-xs text-gray-800"
                style={{ width: `${columnWidths.vendeur}px` }}
              >
                العميل/الموزع
                <div 
                  className="absolute right-0 top-0 w-2 h-full cursor-col-resize hover:bg-blue-500 hover:opacity-50 z-30"
                  onMouseDown={(e) => handleResizeStart(e, 'vendeur')}
                  onTouchStart={(e) => handleResizeStart(e, 'vendeur')}
                />
              </div>

              {/* Numero Header */}
              <div 
                className="relative flex items-center justify-center border-r border-gray-300 bg-gray-200 hover:bg-gray-300 transition-colors font-semibold text-xs text-gray-800"
                style={{ width: `${columnWidths.numero}px` }}
              >
                الرقم
                <div 
                  className="absolute right-0 top-0 w-2 h-full cursor-col-resize hover:bg-blue-500 hover:opacity-50 z-30"
                  onMouseDown={(e) => handleResizeStart(e, 'numero')}
                  onTouchStart={(e) => handleResizeStart(e, 'numero')}
                />
              </div>

              {/* Prix Header */}
              <div 
                className="relative flex items-center justify-center border-r border-gray-300 bg-gray-200 hover:bg-gray-300 transition-colors font-semibold text-xs text-gray-800"
                style={{ width: `${columnWidths.prix}px` }}
              >
                السعر
                <div 
                  className="absolute right-0 top-0 w-2 h-full cursor-col-resize hover:bg-blue-500 hover:opacity-50 z-30"
                  onMouseDown={(e) => handleResizeStart(e, 'prix')}
                  onTouchStart={(e) => handleResizeStart(e, 'prix')}
                />
              </div>

              {/* Status Header */}
              <div 
                className="relative flex items-center justify-center border-r border-gray-300 bg-gray-200 hover:bg-gray-300 transition-colors font-semibold text-xs text-gray-800"
                style={{ width: `${columnWidths.statut}px` }}
              >
                الحالة
                <div 
                  className="absolute right-0 top-0 w-2 h-full cursor-col-resize hover:bg-blue-500 hover:opacity-50 z-30"
                  onMouseDown={(e) => handleResizeStart(e, 'statut')}
                  onTouchStart={(e) => handleResizeStart(e, 'statut')}
                />
              </div>

              {/* Comment Header */}
              <div 
                className="relative flex items-center justify-center border-r border-gray-300 bg-gray-200 hover:bg-gray-300 transition-colors font-semibold text-xs text-gray-800"
                style={{ width: `${columnWidths.commentaire}px` }}
              >
                التعليق
                <div 
                  className="absolute right-0 top-0 w-2 h-full cursor-col-resize hover:bg-blue-500 hover:opacity-50 z-30"
                  onMouseDown={(e) => handleResizeStart(e, 'commentaire')}
                  onTouchStart={(e) => handleResizeStart(e, 'commentaire')}
                />
              </div>
            </div>

            {/* Data Rows */}
            <div>
              {orders.map((order, index) => (
                <div 
                  key={order.id}
                  className={cn(
                    "flex border-b border-gray-200 hover:bg-blue-50 transition-colors",
                    order.isScanned && "bg-green-50",
                    index % 2 === 0 ? "bg-white" : "bg-gray-50"
                  )}
                  style={{ height: '28px' }}
                >
                  {/* Code Cell */}
                  <div 
                    className="flex items-center justify-center border-r border-gray-200 px-2 text-xs font-mono text-gray-800"
                    style={{ width: `${columnWidths.code}px` }}
                  >
                    {order.code}
                  </div>

                  {/* Vendeur Cell */}
                  <div 
                    className="flex items-center px-2 border-r border-gray-200 text-xs text-gray-800"
                    style={{ width: `${columnWidths.vendeur}px` }}
                  >
                    <span className="truncate">{order.vendeur}</span>
                  </div>

                  {/* Numero Cell */}
                  <div 
                    className="flex items-center justify-center border-r border-gray-200 px-2 text-xs font-mono text-gray-800"
                    style={{ width: `${columnWidths.numero}px` }}
                  >
                    {order.numero}
                  </div>

                  {/* Prix Cell */}
                  <div 
                    className="flex items-center justify-center border-r border-gray-200 px-2 text-xs font-medium text-green-700"
                    style={{ width: `${columnWidths.prix}px` }}
                  >
                    {order.prix.toFixed(2)}
                  </div>

                  {/* Status Cell */}
                  <div 
                    className="flex items-center justify-center border-r border-gray-200 px-1"
                    style={{ width: `${columnWidths.statut}px` }}
                  >
                    <DropdownMenu>
                      <DropdownMenuTrigger className="flex items-center gap-1 focus:outline-none">
                        {getStatusBadge(order.statut)}
                        <ChevronDown className="h-2 w-2 text-gray-500" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="z-50">
                        {statusOptions.filter(s => s !== order.statut).map((status) => (
                          <DropdownMenuItem
                            key={status}
                            onClick={() => onUpdateStatus(order.id, status)}
                            className="text-xs cursor-pointer"
                          >
                            {getStatusBadge(status)}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {/* Comment Cell - Editable */}
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

      {/* Instructions */}
      <div className="absolute bottom-0 left-0 right-0 bg-blue-50 border-t border-blue-200 p-2 text-center">
        <p className="text-xs text-blue-700">
          💡 اسحب رؤوس الأعمدة لتغيير الحجم • استخدم إصبعين للتكبير والتصغير • اسحب بإصبع واحد للتنقل عند التكبير
        </p>
        <p className="text-xs text-blue-600 mt-1">
          ⌨️ على الكمبيوتر: Ctrl + / Ctrl - للزوم • Ctrl 0 للعودة للحجم الطبيعي • استخدم Ctrl + عجلة الماوس للزوم
        </p>
      </div>
    </div>
  );
};

export default InteractiveTable;
