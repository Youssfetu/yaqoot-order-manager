import React, { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ChevronDown, Phone, MessageCircle, Edit2, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
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
  const [isResizing, setIsResizing] = useState(false);
  const [resizingColumn, setResizingColumn] = useState<string | null>(null);
  const [recentlyScannedOrders, setRecentlyScannedOrders] = useState<Set<string>>(new Set());
  const [scannedOrdersTimer, setScannedOrdersTimer] = useState<Map<string, NodeJS.Timeout>>(new Map());
  const [permanentlyScannedOrders, setPermanentlyScannedOrders] = useState<Set<string>>(new Set());
  const [touchVelocity, setTouchVelocity] = useState({ x: 0, y: 0 });
  const [lastTouchTime, setLastTouchTime] = useState(0);
  const [lastTouchPosition, setLastTouchPosition] = useState({ x: 0, y: 0 });
  const [columnWidths, setColumnWidths] = useState({
    code: 12,      // 12%
    vendeur: 20,   // 20%
    numero: 16,    // 16%
    prix: 10,      // 10%
    status: 12,    // 12%
    comment: 30    // 30%
  });

  // إضافة حالة للحوار التأكيدي
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    orderId: string;
    orderCode: string;
  }>({
    isOpen: false,
    orderId: '',
    orderCode: ''
  });

  // إضافة حالة لعرض أيقونات التفاعل مع رقم الهاتف
  const [phoneActionsPopup, setPhoneActionsPopup] = useState<{
    isOpen: boolean;
    phoneNumber: string;
    orderId: string;
    position: { x: number; y: number };
  }>({
    isOpen: false,
    phoneNumber: '',
    orderId: '',
    position: { x: 0, y: 0 }
  });

  const containerRef = useRef<HTMLDivElement>(null);
  const momentumAnimationRef = useRef<number | null>(null);
  const resizeStartPosRef = useRef<{ x: number; initialWidth: number }>({ x: 0, initialWidth: 0 });

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

  // Helper function to check if status is rejected/cancelled
  const isRejectedStatus = (status: string) => {
    return ['Annulé', 'Refusé', 'Hors zone'].includes(status);
  };

  // Enhanced tracking for recently scanned orders - show animation only once then keep permanent state
  useEffect(() => {
    console.log('Current orders scan status:', orders.map(o => ({ id: o.id, code: o.code, isScanned: o.isScanned })));
    
    orders.forEach(order => {
      if (order.isScanned && !permanentlyScannedOrders.has(order.id)) {
        console.log('New scanned order detected (first time):', order.id, order.code);
        
        // Add to permanently scanned set immediately
        setPermanentlyScannedOrders(prev => {
          const newSet = new Set(prev);
          newSet.add(order.id);
          console.log('Added to permanently scanned:', order.id);
          return newSet;
        });

        // Add to recently scanned set for 3-second animation
        setRecentlyScannedOrders(prev => {
          const newSet = new Set(prev);
          newSet.add(order.id);
          console.log('Added to recently scanned for animation:', order.id);
          return newSet;
        });
        
        // Clear any existing timer for this order
        const existingTimer = scannedOrdersTimer.get(order.id);
        if (existingTimer) {
          clearTimeout(existingTimer);
        }
        
        // Set new timer to remove animation after 3 seconds (but keep permanent state)
        const newTimer = setTimeout(() => {
          console.log('Removing animation for order (keeping permanent state):', order.id);
          setRecentlyScannedOrders(prev => {
            const updated = new Set(prev);
            updated.delete(order.id);
            console.log('Removed from recently scanned animation:', order.id);
            return updated;
          });
          
          // Clean up timer from map
          setScannedOrdersTimer(prev => {
            const newMap = new Map(prev);
            newMap.delete(order.id);
            return newMap;
          });
        }, 3000);
        
        // Store timer reference
        setScannedOrdersTimer(prev => {
          const newMap = new Map(prev);
          newMap.set(order.id, newTimer);
          return newMap;
        });
      }
    });
    
    // Clean up timers for orders that are no longer scanned
    scannedOrdersTimer.forEach((timer, orderId) => {
      const order = orders.find(o => o.id === orderId);
      if (!order || !order.isScanned) {
        clearTimeout(timer);
        setScannedOrdersTimer(prev => {
          const newMap = new Map(prev);
          newMap.delete(orderId);
          return newMap;
        });
        // Also remove from permanent state if order is no longer scanned
        setPermanentlyScannedOrders(prev => {
          const newSet = new Set(prev);
          newSet.delete(orderId);
          return newSet;
        });
      }
    });
  }, [orders, permanentlyScannedOrders]);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      scannedOrdersTimer.forEach(timer => clearTimeout(timer));
      if (momentumAnimationRef.current) {
        cancelAnimationFrame(momentumAnimationRef.current);
      }
    };
  }, []);

  // Enhanced momentum scrolling for smooth touch experience
  const applyMomentumScrolling = (velocity: { x: number, y: number }) => {
    if (!containerRef.current) return;
    
    const friction = 0.95;
    const minVelocity = 0.5;
    
    const animate = () => {
      if (Math.abs(velocity.x) < minVelocity && Math.abs(velocity.y) < minVelocity) {
        momentumAnimationRef.current = null;
        return;
      }
      
      const rect = containerRef.current?.getBoundingClientRect();
      if (rect) {
        const maxPanX = 0;
        const maxPanY = 0;
        const minPanX = Math.min(0, rect.width - (800 * zoomLevel));
        const minPanY = Math.min(0, rect.height - (600 * zoomLevel));
        
        setPanOffset(prev => ({
          x: Math.max(minPanX, Math.min(maxPanX, prev.x + velocity.x)),
          y: Math.max(minPanY, Math.min(maxPanY, prev.y + velocity.y))
        }));
      }
      
      velocity.x *= friction;
      velocity.y *= friction;
      
      momentumAnimationRef.current = requestAnimationFrame(animate);
    };
    
    momentumAnimationRef.current = requestAnimationFrame(animate);
  };

  // Fixed column resizing with proper event listener options
  const handleResizeStart = (e: React.MouseEvent | React.TouchEvent, column: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    console.log('Resize start for column:', column);
    setIsResizing(true);
    setResizingColumn(column);
    
    const startX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const currentWidth = columnWidths[column as keyof typeof columnWidths];
    
    // Store initial position and width for smoother calculations
    resizeStartPosRef.current = { x: startX, initialWidth: currentWidth };
    
    const handleMove = (moveEvent: MouseEvent | TouchEvent) => {
      if (!containerRef.current) return;
      
      moveEvent.preventDefault();
      moveEvent.stopPropagation();
      
      const rect = containerRef.current.getBoundingClientRect();
      const totalWidth = rect.width;
      const currentX = 'touches' in moveEvent ? moveEvent.touches[0].clientX : moveEvent.clientX;
      
      // Calculate delta from the initial position
      const deltaX = currentX - resizeStartPosRef.current.x;
      const deltaPercent = (deltaX / totalWidth) * 100;
      
      // Apply the change relative to the initial width
      const newWidth = Math.max(8, Math.min(40, resizeStartPosRef.current.initialWidth + deltaPercent));
      
      console.log(`Resizing ${column}: deltaX=${deltaX}, deltaPercent=${deltaPercent.toFixed(2)}, newWidth=${newWidth.toFixed(2)}`);
      
      setColumnWidths(prev => ({
        ...prev,
        [column]: newWidth
      }));
    };
    
    const handleEnd = (endEvent?: MouseEvent | TouchEvent) => {
      console.log('Resize end for column:', column);
      setIsResizing(false);
      setResizingColumn(null);
      
      // Clean up event listeners
      document.removeEventListener('mousemove', handleMove as EventListener);
      document.removeEventListener('mouseup', handleEnd as EventListener);
      document.removeEventListener('touchmove', handleMove as EventListener);
      document.removeEventListener('touchend', handleEnd as EventListener);
    };
    
    // Add event listeners with proper options for touch devices
    document.addEventListener('mousemove', handleMove as EventListener);
    document.addEventListener('mouseup', handleEnd as EventListener);
    document.addEventListener('touchmove', handleMove as EventListener);
    document.addEventListener('touchend', handleEnd as EventListener);
  };

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

  // Enhanced touch handling that doesn't interfere with column resizing
  const handleTouchStart = (e: React.TouchEvent) => {
    // Don't handle zoom/pan if we're resizing columns or editing
    if (isResizing || editingCell) return;
    
    // Cancel any ongoing momentum animation
    if (momentumAnimationRef.current) {
      cancelAnimationFrame(momentumAnimationRef.current);
      momentumAnimationRef.current = null;
    }
    
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
    } else if (e.touches.length === 1) {
      // Enhanced single touch pan start with velocity tracking
      const touch = e.touches[0];
      setIsPanning(true);
      setPanStart({ x: touch.clientX - panOffset.x, y: touch.clientY - panOffset.y });
      
      // Initialize velocity tracking
      const currentTime = Date.now();
      setLastTouchTime(currentTime);
      setLastTouchPosition({ x: touch.clientX, y: touch.clientY });
      setTouchVelocity({ x: 0, y: 0 });
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    // Don't handle zoom/pan if we're resizing columns or editing
    if (isResizing || editingCell) return;
    
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
    } else if (e.touches.length === 1 && isPanning) {
      // Enhanced single touch pan with smooth velocity calculation
      const touch = e.touches[0];
      const currentTime = Date.now();
      const deltaTime = currentTime - lastTouchTime;
      
      if (deltaTime > 0) {
        // Calculate velocity for momentum scrolling
        const deltaX = touch.clientX - lastTouchPosition.x;
        const deltaY = touch.clientY - lastTouchPosition.y;
        const velocityX = deltaX / deltaTime * 16; // Scale for 60fps
        const velocityY = deltaY / deltaTime * 16;
        
        setTouchVelocity({ x: velocityX, y: velocityY });
        setLastTouchTime(currentTime);
        setLastTouchPosition({ x: touch.clientX, y: touch.clientY });
      }
      
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
    // Don't interfere with column resizing
    if (isResizing) return;
    
    if (e.touches.length < 2) {
      (e.currentTarget as any).initialDistance = null;
      (e.currentTarget as any).initialZoom = null;
    }
    
    if (e.touches.length === 0) {
      setIsPanning(false);
      
      // Apply momentum scrolling if there's sufficient velocity
      if (Math.abs(touchVelocity.x) > 1 || Math.abs(touchVelocity.y) > 1) {
        applyMomentumScrolling({ ...touchVelocity });
      }
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

  // Reverted getStatusBadge function to original static version
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

  // دالة معالجة تغيير الحالة مع إضافة التأكيد للحالة "Livré"
  const handleStatusChange = (orderId: string, newStatus: string) => {
    if (newStatus === 'Livré') {
      // العثور على الطلبية للحصول على الكود
      const order = orders.find(o => o.id === orderId);
      if (order) {
        setConfirmDialog({
          isOpen: true,
          orderId: orderId,
          orderCode: order.code
        });
      }
    } else {
      // تغيير الحالة مباشرة للحالات الأخرى
      onUpdateStatus(orderId, newStatus);
    }
  };

  // دالة تأكيد التسليم
  const handleConfirmDelivery = () => {
    onUpdateStatus(confirmDialog.orderId, 'Livré');
    setConfirmDialog({
      isOpen: false,
      orderId: '',
      orderCode: ''
    });
  };

  // دالة إلغاء التأكيد
  const handleCancelConfirmation = () => {
    setConfirmDialog({
      isOpen: false,
      orderId: '',
      orderCode: ''
    });
  };

  // دالة معالجة النقر المزدوج على رقم الهاتف
  const handlePhoneDoubleClick = (e: React.MouseEvent, phoneNumber: string, orderId: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    const rect = e.currentTarget.getBoundingClientRect();
    const containerRect = containerRef.current?.getBoundingClientRect();
    
    if (containerRect) {
      setPhoneActionsPopup({
        isOpen: true,
        phoneNumber,
        orderId,
        position: {
          x: rect.left - containerRect.left + rect.width / 2,
          y: rect.top - containerRect.top - 60
        }
      });
    }
  };

  // دالة إغلاق قائمة أيقونات الهاتف
  const closePhoneActionsPopup = () => {
    setPhoneActionsPopup({
      isOpen: false,
      phoneNumber: '',
      orderId: '',
      position: { x: 0, y: 0 }
    });
  };

  // دالة الاتصال
  const handlePhoneCall = (phoneNumber: string) => {
    window.open(`tel:${phoneNumber}`, '_self');
    closePhoneActionsPopup();
  };

  // دالة إرسال رسالة واتساب
  const handleWhatsAppMessage = (phoneNumber: string) => {
    const cleanNumber = phoneNumber.replace(/[\s-+()]/g, '');
    window.open(`https://wa.me/${cleanNumber}`, '_blank');
    closePhoneActionsPopup();
  };

  // دالة إرسال رسالة عادية
  const handleSMSMessage = (phoneNumber: string) => {
    window.open(`sms:${phoneNumber}`, '_self');
    closePhoneActionsPopup();
  };

  // دالة تحرير رقم الهاتف
  const handleEditPhone = (orderId: string) => {
    // يمكن إضافة منطق لتحرير رقم الهاتف هنا
    console.log('Edit phone for order:', orderId);
    closePhoneActionsPopup();
  };

  return (
    <div className="w-full bg-white">
      {/* Google Sheets Style Compact Table Container with Enhanced Touch Support */}
      <div 
        ref={containerRef}
        className={cn(
          "w-full h-[calc(100vh-200px)] border border-gray-300 bg-white relative",
          showScrollbar ? "overflow-x-auto" : "overflow-x-hidden",
          "overflow-y-auto"
        )}
        style={{ 
          cursor: zoomLevel > 1 ? (isPanning ? 'grabbing' : 'grab') : 'default',
          touchAction: editingCell || isResizing ? 'none' : 'pan-x pan-y pinch-zoom',
          scrollbarWidth: showScrollbar ? 'thin' : 'none',
          scrollbarColor: showScrollbar ? '#cbd5e0 #f7fafc' : 'transparent transparent',
          userSelect: isResizing ? 'none' : 'auto',
          WebkitUserSelect: isResizing ? 'none' : 'auto',
          WebkitTouchCallout: 'none'
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onWheel={editingCell ? undefined : handleWheel}
      >
        {/* Enhanced Transform Container with Smooth Transitions */}
        <div 
          className="absolute top-0 left-0 w-full h-full"
          style={{
            transform: `scale(${zoomLevel}) translate(${panOffset.x}px, ${panOffset.y}px)`,
            transformOrigin: 'top left',
            transition: isPanning || isResizing || momentumAnimationRef.current ? 'none' : 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            minWidth: '800px',
            minHeight: '100%',
            fontSize: '11px',
            pointerEvents: editingCell ? 'none' : 'auto',
            willChange: isPanning || isResizing ? 'transform' : 'auto'
          }}
        >
          <div className="w-full shadow-lg rounded-sm overflow-hidden bg-white">
            {/* Header Row with Significantly Enhanced Resizable Handles for Touch */}
            <div className="flex">
              {/* Code Column Header */}
              <div className="relative" style={{ width: `${columnWidths.code}%`, minWidth: '80px' }}>
                <div className="h-7 px-2 py-1 border-b-2 border-gray-400 bg-gradient-to-r from-gray-200 to-gray-300 flex items-center justify-center">
                  <span className="text-xs font-bold text-gray-800">الكود</span>
                </div>
                {/* Professional Resize Handle */}
                <div 
                  className={cn(
                    "absolute top-0 right-0 w-2 h-7 cursor-col-resize touch-manipulation flex items-center justify-center",
                    "hover:bg-blue-300 bg-gray-400 opacity-40 hover:opacity-70 transition-all duration-200",
                    "border-l border-gray-300",
                    isResizing && resizingColumn === 'code' && "bg-blue-400 opacity-80"
                  )}
                  onMouseDown={(e) => handleResizeStart(e, 'code')}
                  onTouchStart={(e) => handleResizeStart(e, 'code')}
                  style={{ 
                    touchAction: 'none',
                    minHeight: '28px',
                    minWidth: '8px',
                    zIndex: isResizing ? 50 : 10
                  }}
                >
                  <div className="w-0.5 h-3 bg-white rounded-full opacity-60" />
                </div>
              </div>

              {/* Vendeur Column Header */}
              <div className="relative" style={{ width: `${columnWidths.vendeur}%`, minWidth: '120px' }}>
                <div className="h-7 px-2 py-1 border-b-2 border-gray-400 bg-gradient-to-r from-gray-200 to-gray-300 flex items-center justify-center">
                  <span className="text-xs font-bold text-gray-800">العميل/الموزع</span>
                </div>
                {/* Professional Resize Handle */}
                <div 
                  className={cn(
                    "absolute top-0 right-0 w-2 h-7 cursor-col-resize touch-manipulation flex items-center justify-center",
                    "hover:bg-blue-300 bg-gray-400 opacity-40 hover:opacity-70 transition-all duration-200",
                    "border-l border-gray-300",
                    isResizing && resizingColumn === 'vendeur' && "bg-blue-400 opacity-80"
                  )}
                  onMouseDown={(e) => handleResizeStart(e, 'vendeur')}
                  onTouchStart={(e) => handleResizeStart(e, 'vendeur')}
                  style={{ 
                    touchAction: 'none',
                    minHeight: '28px',
                    minWidth: '8px',
                    zIndex: isResizing ? 50 : 10
                  }}
                >
                  <div className="w-0.5 h-3 bg-white rounded-full opacity-60" />
                </div>
              </div>

              {/* Number Column Header */}
              <div className="relative" style={{ width: `${columnWidths.numero}%`, minWidth: '100px' }}>
                <div className="h-7 px-2 py-1 border-b-2 border-gray-400 bg-gradient-to-r from-gray-200 to-gray-300 flex items-center justify-center">
                  <span className="text-xs font-bold text-gray-800">الرقم</span>
                </div>
                {/* Professional Resize Handle */}
                <div 
                  className={cn(
                    "absolute top-0 right-0 w-2 h-7 cursor-col-resize touch-manipulation flex items-center justify-center",
                    "hover:bg-blue-300 bg-gray-400 opacity-40 hover:opacity-70 transition-all duration-200",
                    "border-l border-gray-300",
                    isResizing && resizingColumn === 'numero' && "bg-blue-400 opacity-80"
                  )}
                  onMouseDown={(e) => handleResizeStart(e, 'numero')}
                  onTouchStart={(e) => handleResizeStart(e, 'numero')}
                  style={{ 
                    touchAction: 'none',
                    minHeight: '28px',
                    minWidth: '8px',
                    zIndex: isResizing ? 50 : 10
                  }}
                >
                  <div className="w-0.5 h-3 bg-white rounded-full opacity-60" />
                </div>
              </div>

              {/* Price Column Header */}
              <div className="relative" style={{ width: `${columnWidths.prix}%`, minWidth: '70px' }}>
                <div className="h-7 px-2 py-1 border-b-2 border-gray-400 bg-gradient-to-r from-gray-200 to-gray-300 flex items-center justify-center">
                  <span className="text-xs font-bold text-gray-800">السعر</span>
                </div>
                {/* Professional Resize Handle */}
                <div 
                  className={cn(
                    "absolute top-0 right-0 w-2 h-7 cursor-col-resize touch-manipulation flex items-center justify-center",
                    "hover:bg-blue-300 bg-gray-400 opacity-40 hover:opacity-70 transition-all duration-200",
                    "border-l border-gray-300",
                    isResizing && resizingColumn === 'prix' && "bg-blue-400 opacity-80"
                  )}
                  onMouseDown={(e) => handleResizeStart(e, 'prix')}
                  onTouchStart={(e) => handleResizeStart(e, 'prix')}
                  style={{ 
                    touchAction: 'none',
                    minHeight: '28px',
                    minWidth: '8px',
                    zIndex: isResizing ? 50 : 10
                  }}
                >
                  <div className="w-0.5 h-3 bg-white rounded-full opacity-60" />
                </div>
              </div>

              {/* Status Column Header */}
              <div className="relative" style={{ width: `${columnWidths.status}%`, minWidth: '90px' }}>
                <div className="h-7 px-2 py-1 border-b-2 border-gray-400 bg-gradient-to-r from-gray-200 to-gray-300 flex items-center justify-center">
                  <span className="text-xs font-bold text-gray-800">الحالة</span>
                </div>
                {/* Professional Resize Handle */}
                <div 
                  className={cn(
                    "absolute top-0 right-0 w-2 h-7 cursor-col-resize touch-manipulation flex items-center justify-center",
                    "hover:bg-blue-300 bg-gray-400 opacity-40 hover:opacity-70 transition-all duration-200",
                    "border-l border-gray-300",
                    isResizing && resizingColumn === 'status' && "bg-blue-400 opacity-80"
                  )}
                  onMouseDown={(e) => handleResizeStart(e, 'status')}
                  onTouchStart={(e) => handleResizeStart(e, 'status')}
                  style={{ 
                    touchAction: 'none',
                    minHeight: '28px',
                    minWidth: '8px',
                    zIndex: isResizing ? 50 : 10
                  }}
                >
                  <div className="w-0.5 h-3 bg-white rounded-full opacity-60" />
                </div>
              </div>

              {/* Comment Column Header */}
              <div className="flex-1" style={{ minWidth: '150px' }}>
                <div className="h-7 px-2 py-1 border-b-2 border-gray-400 bg-gradient-to-r from-gray-200 to-gray-300 flex items-center justify-center">
                  <span className="text-xs font-bold text-gray-800">التعليق</span>
                </div>
              </div>
            </div>

            {/* Data Rows */}
            <div className="flex-1">
              {orders.map((order, index) => {
                const isRecentlyScanned = recentlyScannedOrders.has(order.id);
                const isPermanentlyScanned = permanentlyScannedOrders.has(order.id);
                const isRejected = isRejectedStatus(order.statut);
                console.log(`Order ${order.code}: isScanned=${order.isScanned}, isRecentlyScanned=${isRecentlyScanned}, isPermanentlyScanned=${isPermanentlyScanned}, isRejected=${isRejected}`);
                
                // Enhanced row background logic with permanent state and temporary animation
                const getRowBackgroundClass = () => {
                  if (isRecentlyScanned) {
                    // Show red for rejected statuses, green for others during the 3-second highlight
                    return isRejected 
                      ? "bg-red-200 border-red-300 animate-pulse" 
                      : "bg-green-200 border-green-300 animate-pulse";
                  } else if (isPermanentlyScanned) {
                    // Permanent light blue background for previously scanned orders
                    return "bg-blue-50 border-blue-200";
                  } else {
                    return index % 2 === 0 ? "bg-white" : "bg-gray-50";
                  }
                };

                const rowBackgroundClass = getRowBackgroundClass();

                return (
                  <div key={order.id} className="flex">
                    {/* Code Column Data with Enhanced Highlighting */}
                    <div style={{ width: `${columnWidths.code}%`, minWidth: '80px' }}>
                      <div 
                        data-code={order.code}
                        className={cn(
                          "h-7 px-2 py-1 border-b border-gray-300 flex items-center hover:bg-blue-50 transition-all duration-300",
                          isPermanentlyScanned 
                            ? "bg-green-100 border-green-200 font-semibold" 
                            : rowBackgroundClass
                        )}
                      >
                        <span className="truncate w-full text-center text-xs font-mono text-gray-800">
                          {order.code}
                        </span>
                      </div>
                    </div>

                    {/* Vendeur Column Data */}
                    <div style={{ width: `${columnWidths.vendeur}%`, minWidth: '120px' }}>
                      <div 
                        className={cn(
                          "h-7 px-2 py-1 border-b border-gray-300 flex items-center hover:bg-blue-50 transition-all duration-300",
                          rowBackgroundClass
                        )}
                      >
                        <span className="truncate w-full text-xs text-gray-800">
                          {order.vendeur}
                        </span>
                      </div>
                    </div>

                    {/* Number Column Data */}
                    <div style={{ width: `${columnWidths.numero}%`, minWidth: '100px' }}>
                      <div 
                        className={cn(
                          "h-7 px-2 py-1 border-b border-gray-300 flex items-center hover:bg-blue-50 transition-all duration-300 cursor-pointer",
                          rowBackgroundClass
                        )}
                        onDoubleClick={(e) => handlePhoneDoubleClick(e, order.numero, order.id)}
                      >
                        <span className="truncate w-full text-center text-xs font-mono text-gray-800 select-text">
                          {order.numero}
                        </span>
                      </div>
                    </div>

                    {/* Price Column Data */}
                    <div style={{ width: `${columnWidths.prix}%`, minWidth: '70px' }}>
                      <div 
                        className={cn(
                          "h-7 px-2 py-1 border-b border-gray-300 flex items-center justify-center hover:bg-blue-50 transition-all duration-300",
                          rowBackgroundClass
                        )}
                      >
                        <span className="text-xs font-medium text-green-700">
                          {order.prix.toFixed(2)}
                        </span>
                      </div>
                    </div>

                    {/* Status Column Data - Updated to use confirmation dialog */}
                    <div style={{ width: `${columnWidths.status}%`, minWidth: '90px' }}>
                      <div 
                        className={cn(
                          "h-7 px-1 py-1 border-b border-gray-300 flex items-center justify-center hover:bg-blue-50 transition-all duration-300",
                          rowBackgroundClass
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
                                onClick={() => handleStatusChange(order.id, status)}
                                className="text-xs cursor-pointer hover:bg-gray-100 px-2 py-1 focus:bg-gray-100"
                              >
                                {getStatusBadge(status)} 
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>

                    {/* Comment Column Data */}
                    <div className="flex-1" style={{ minWidth: '150px' }}>
                      <div 
                        className={cn(
                          "h-7 px-2 py-1 border-b border-gray-300 flex items-center hover:bg-blue-50 transition-all duration-300 relative",
                          rowBackgroundClass,
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
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Editing Overlay - Prevents zoom/pan when editing */}
        {editingCell && (
          <div 
            className="absolute inset-0 bg-transparent z-30 pointer-events-auto"
            onClick={handleCommentBlur}
          />
        )}

        {/* Resizing Overlay - Shows feedback during column resizing */}
        {isResizing && (
          <div className="absolute inset-0 bg-blue-50 bg-opacity-10 z-40 pointer-events-none flex items-center justify-center">
            <div className="bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg text-sm font-medium">
              تغيير حجم العمود: {resizingColumn}
            </div>
          </div>
        )}

        {/* Phone Actions Popup */}
        {phoneActionsPopup.isOpen && (
          <>
            {/* Backdrop للإغلاق عند النقر خارج القائمة */}
            <div 
              className="absolute inset-0 z-[60] bg-transparent"
              onClick={closePhoneActionsPopup}
            />
            
            {/* قائمة الأيقونات */}
            <div 
              className="absolute z-[70] bg-white rounded-xl shadow-2xl border border-gray-200 p-3 transform -translate-x-1/2 min-w-[280px] sm:min-w-[320px]"
              style={{
                left: phoneActionsPopup.position.x,
                top: phoneActionsPopup.position.y,
                transform: `scale(${1/zoomLevel}) translate(-50%, 0)`,
                transformOrigin: 'top center'
              }}
            >
              {/* رقم الهاتف */}
              <div className="text-center mb-4 px-2">
                <span className="text-sm font-mono text-gray-700 bg-gray-100 px-3 py-2 rounded-lg border">
                  {phoneActionsPopup.phoneNumber}
                </span>
              </div>
              
              {/* الأيقونات */}
              <div className="grid grid-cols-2 gap-3 sm:flex sm:justify-center">
                {/* أيقونة الاتصال */}
                <button
                  onClick={() => handlePhoneCall(phoneActionsPopup.phoneNumber)}
                  className="flex flex-col items-center gap-2 p-4 hover:bg-green-50 rounded-xl transition-all duration-200 group border-2 border-transparent hover:border-green-200 min-h-[80px]"
                  title="اتصال"
                >
                  <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center group-hover:bg-green-600 transition-colors shadow-md">
                    <Phone className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-sm text-green-700 font-medium">اتصال</span>
                </button>

                {/* أيقونة واتساب */}
                <button
                  onClick={() => handleWhatsAppMessage(phoneActionsPopup.phoneNumber)}
                  className="flex flex-col items-center gap-2 p-4 hover:bg-green-50 rounded-xl transition-all duration-200 group border-2 border-transparent hover:border-green-200 min-h-[80px]"
                  title="واتساب"
                >
                  <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center group-hover:bg-green-600 transition-colors shadow-md">
                    <MessageCircle className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-sm text-green-700 font-medium">واتساب</span>
                </button>

                {/* أيقونة رسالة نصية */}
                <button
                  onClick={() => handleSMSMessage(phoneActionsPopup.phoneNumber)}
                  className="flex flex-col items-center gap-2 p-4 hover:bg-blue-50 rounded-xl transition-all duration-200 group border-2 border-transparent hover:border-blue-200 min-h-[80px]"
                  title="رسالة"
                >
                  <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center group-hover:bg-blue-600 transition-colors shadow-md">
                    <Send className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-sm text-blue-700 font-medium">رسالة</span>
                </button>

                {/* أيقونة تحرير */}
                <button
                  onClick={() => handleEditPhone(phoneActionsPopup.orderId)}
                  className="flex flex-col items-center gap-2 p-4 hover:bg-orange-50 rounded-xl transition-all duration-200 group border-2 border-transparent hover:border-orange-200 min-h-[80px]"
                  title="تحرير"
                >
                  <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center group-hover:bg-orange-600 transition-colors shadow-md">
                    <Edit2 className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-sm text-orange-700 font-medium">تحرير</span>
                </button>
              </div>

              {/* سهم يشير للأسفل */}
              <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
                <div className="w-4 h-4 bg-white border-b border-r border-gray-200 rotate-45"></div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* حوار التأكيد للتسليم - Enhanced styling */}
      <AlertDialog open={confirmDialog.isOpen} onOpenChange={(open) => !open && handleCancelConfirmation()}>
        <AlertDialogContent className="max-w-md mx-4 rounded-xl border-0 shadow-2xl bg-white">
          <AlertDialogHeader className="text-center pb-4">
            <AlertDialogTitle className="text-xl font-bold text-gray-900 mb-2" dir="rtl">
              تأكيد التسليم
            </AlertDialogTitle>
            <AlertDialogDescription className="text-base text-gray-700 leading-relaxed" dir="rtl">
              هل أنت متأكد من أنك تريد تغيير حالة الطلبية{' '}
              <span className="font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-md">
                {confirmDialog.orderCode}
              </span>{' '}
              إلى "تم التسليم"؟
              <div className="mt-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                <span className="text-orange-700 font-medium text-sm">
                  ⚠️ سيتم نقل هذه الطلبية إلى الأرشيف ولن تظهر في القائمة الرئيسية.
                </span>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex gap-3 pt-4" dir="rtl">
            <AlertDialogCancel 
              onClick={handleCancelConfirmation} 
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 border-0 rounded-lg font-medium py-3"
            >
              إلغاء
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmDelivery} 
              className="flex-1 bg-green-600 hover:bg-green-700 text-white border-0 rounded-lg font-medium py-3 shadow-lg"
            >
              تأكيد التسليم ✓
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Empty State */}
      {orders.length === 0 && (
        <div className="text-center py-8 text-gray-500 border-t border-gray-300">
          <p className="text-sm">لا توجد طلبات للعرض</p>
          <p className="text-xs mt-1">استخدم زر "طلب جديد" لإضافة أول طلب لك</p>
        </div>
      )}

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
