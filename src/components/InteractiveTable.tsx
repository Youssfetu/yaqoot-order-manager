import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ChevronDown, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
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
  const [lastPinchDistance, setLastPinchDistance] = useState<number | null>(null);
  const [zoomCenter, setZoomCenter] = useState({ x: 0, y: 0 });

  const containerRef = useRef<HTMLDivElement>(null);
  const tableRef = useRef<HTMLDivElement>(null);

  const statusOptions = [
    'Confirmé', 'Livré', 'Reporté', 'Annulé', 'Refusé', 'Numéro erroné', 'Hors zone', 'Programmé'
  ];

  // Zoom control functions
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
    setPanOffset({ x: 0, y: 0 });
  };

  const getZoomPercentage = () => Math.round(zoomLevel * 100);

  // Column resizing handlers
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

  // Touch and zoom handlers
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
      
      // Calculate zoom center
      const centerX = (touch1.clientX + touch2.clientX) / 2;
      const centerY = (touch1.clientY + touch2.clientY) / 2;
      
      const rect = containerRef.current?.getBoundingClientRect();
      if (rect) {
        setZoomCenter({
          x: centerX - rect.left,
          y: centerY - rect.top
        });
      }
    } else if (e.touches.length === 1 && zoomLevel > 1) {
      const touch = e.touches[0];
      setIsPanning(true);
      setPanStart({ x: touch.clientX - panOffset.x, y: touch.clientY - panOffset.y });
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (editingCell || isResizing) return;
    e.preventDefault();
    
    if (e.touches.length === 2 && lastPinchDistance !== null) {
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const distance = Math.sqrt(
        Math.pow(touch2.clientX - touch1.clientX, 2) + 
        Math.pow(touch2.clientY - touch1.clientY, 2)
      );
      
      const scale = distance / lastPinchDistance;
      const newZoom = Math.max(0.5, Math.min(3, zoomLevel * scale));
      
      // Apply zoom with center point
      const zoomFactor = newZoom / zoomLevel;
      const newPanX = zoomCenter.x - (zoomCenter.x - panOffset.x) * zoomFactor;
      const newPanY = zoomCenter.y - (zoomCenter.y - panOffset.y) * zoomFactor;
      
      setZoomLevel(newZoom);
      setPanOffset({ x: newPanX, y: newPanY });
      setLastPinchDistance(distance);
      
    } else if (e.touches.length === 1 && isPanning && zoomLevel > 1) {
      const touch = e.touches[0];
      const newOffsetX = touch.clientX - panStart.x;
      const newOffsetY = touch.clientY - panStart.y;
      setPanOffset({ x: newOffsetX, y: newOffsetY });
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (e.touches.length < 2) {
      setLastPinchDistance(null);
    }
    
    if (e.touches.length === 0) {
      setIsPanning(false);
    }
  };

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
        
        // Apply zoom with focus point
        const zoomFactor = newZoom / zoomLevel;
        const newPanX = focusX - (focusX - panOffset.x) * zoomFactor;
        const newPanY = focusY - (focusY - panOffset.y) * zoomFactor;
        
        setZoomLevel(newZoom);
        setPanOffset({ x: newPanX, y: newPanY });
      }
    }
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
      {/* Zoom Controls Toolbar */}
      <div className="absolute top-2 left-2 z-50 flex items-center gap-2 bg-white/90 backdrop-blur-sm rounded-lg border border-gray-200 px-3 py-2 shadow-lg">
        <Button
          onClick={handleZoomOut}
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0"
          disabled={zoomLevel <= 0.5}
        >
          <ZoomOut className="h-4 w-4" />
        </Button>
        
        <span className="text-xs font-medium text-gray-600 min-w-[3rem] text-center">
          {getZoomPercentage()}%
        </span>
        
        <Button
          onClick={handleZoomIn}
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0"
          disabled={zoomLevel >= 3}
        >
          <ZoomIn className="h-4 w-4" />
        </Button>
        
        <div className="w-px h-4 bg-gray-300" />
        
        <Button
          onClick={handleResetZoom}
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0"
          disabled={zoomLevel === 1 && panOffset.x === 0 && panOffset.y === 0}
        >
          <RotateCcw className="h-4 w-4" />
        </Button>
      </div>

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
                الكود
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
                العميل/الموزع
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
                الرقم
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
                السعر
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
                الحالة
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
                  <div 
                    className="flex items-center justify-center border-r border-gray-200 px-2 text-xs font-mono text-gray-800"
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
  );
};

export default InteractiveTable;
