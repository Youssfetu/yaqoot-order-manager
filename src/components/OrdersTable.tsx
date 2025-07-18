import React, { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ChevronDown, Phone, MessageCircle, Edit2, Send, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn, formatPrice } from '@/lib/utils';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useLanguage } from '@/contexts/LanguageContext';
import GoogleSheetsCommentEditor from './GoogleSheetsCommentEditor';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import SortableOrderRow from './SortableOrderRow';
import type { Order } from '@/pages/Index';

interface TableSettings {
  columnVisibility: {
    code: boolean;
    destination: boolean;
    phone: boolean;
    price: boolean;
    comment: boolean;
    status: boolean;
  };
  fontSize: number;
  fontWeight: 'normal' | 'bold' | 'light';
  textAlignment: {
    code: 'left' | 'center' | 'right';
    phone: 'left' | 'center' | 'right';
    price: 'left' | 'center' | 'right';
    comment: 'left' | 'center' | 'right';
  };
  coordinatesVisibility: boolean;
}

interface OrdersTableProps {
  orders: Order[];
  onUpdateComment: (id: string, comment: string) => void;
  onUpdateStatus: (id: string, status: string) => void;
  onUpdatePhone: (id: string, phone: string) => void;
  onUpdatePrice: (id: string, price: number) => void;
  onReorderOrders: (newOrders: Order[]) => void;
  tableSettings: TableSettings;
}

const OrdersTable: React.FC<OrdersTableProps> = ({ orders, onUpdateComment, onUpdateStatus, onUpdatePhone, onUpdatePrice, onReorderOrders, tableSettings }) => {
  const { t, isRTL } = useLanguage();
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [showScrollbar, setShowScrollbar] = useState(false);
  const [editingCell, setEditingCell] = useState<string | null>(null);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
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

  // Google Sheets style comment editing
  const [selectedOrderForComment, setSelectedOrderForComment] = useState<Order | null>(null);

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
  
  // DND Kit sensors - optimized for mobile
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Allow a little movement before activating
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = orders.findIndex((order) => order.id === active.id);
      const newIndex = orders.findIndex((order) => order.id === over.id);

      const newOrders = arrayMove(orders, oldIndex, newIndex);
      onReorderOrders(newOrders);
    }
  };
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
    'Programmé',
    'Pas de réponse'
  ];

  // Helper function to check if status is rejected/cancelled
  const isRejectedStatus = (status: string) => {
    return ['Annulé', 'Refusé', 'Hors zone', 'Pas de réponse'].includes(status);
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

  // Enhanced momentum scrolling for ultra-smooth touch experience
  const applyMomentumScrolling = (velocity: { x: number, y: number }) => {
    if (!containerRef.current) return;
    
    // More refined friction for smoother deceleration
    const friction = 0.92;
    const minVelocity = 0.3;
    const elasticBounds = true;
    
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
        
        const newX = panOffset.x + velocity.x;
        const newY = panOffset.y + velocity.y;
        
        // Elastic bounds for more natural feel
        let finalX = newX;
        let finalY = newY;
        
        if (elasticBounds) {
          // Allow slight overscroll with elastic bounce back
          const elasticStrength = 0.3;
          
          if (newX > maxPanX) {
            finalX = maxPanX + (newX - maxPanX) * elasticStrength;
            velocity.x *= 0.7; // Reduce velocity when overscrolling
          } else if (newX < minPanX) {
            finalX = minPanX + (newX - minPanX) * elasticStrength;
            velocity.x *= 0.7;
          }
          
          if (newY > maxPanY) {
            finalY = maxPanY + (newY - maxPanY) * elasticStrength;
            velocity.y *= 0.7;
          } else if (newY < minPanY) {
            finalY = minPanY + (newY - minPanY) * elasticStrength;
            velocity.y *= 0.7;
          }
        } else {
          finalX = Math.max(minPanX, Math.min(maxPanX, newX));
          finalY = Math.max(minPanY, Math.min(maxPanY, newY));
        }
        
        setPanOffset({ x: finalX, y: finalY });
      }
      
      velocity.x *= friction;
      velocity.y *= friction;
      
      momentumAnimationRef.current = requestAnimationFrame(animate);
    };
    
    momentumAnimationRef.current = requestAnimationFrame(animate);
  };

  // Enhanced column resizing with better mobile support
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
      
      // Apply the change relative to the initial width with more flexible limits
      let minWidth = 5; // Default minimum width
      
      // Allow smaller minimum for specific columns
      if (column === 'vendeur' || column === 'code') {
        minWidth = 1; // Very small minimum for vendor and code columns
      } else if (column === 'numero' || column === 'prix') {
        minWidth = 1; // Very small minimum for phone and price
      }
      
      const newWidth = Math.max(minWidth, Math.min(50, resizeStartPosRef.current.initialWidth + deltaPercent));
      
      console.log(`Resizing ${column}: deltaX=${deltaX}, deltaPercent=${deltaPercent.toFixed(2)}, newWidth=${newWidth.toFixed(2)}, minWidth=${minWidth}`);
      
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
      document.removeEventListener('mousemove', handleMove as EventListener, { passive: false } as any);
      document.removeEventListener('mouseup', handleEnd as EventListener);
      document.removeEventListener('touchmove', handleMove as EventListener, { passive: false } as any);
      document.removeEventListener('touchend', handleEnd as EventListener);
    };
    
    // Add event listeners with proper options for touch devices
    document.addEventListener('mousemove', handleMove as EventListener, { passive: false });
    document.addEventListener('mouseup', handleEnd as EventListener);
    document.addEventListener('touchmove', handleMove as EventListener, { passive: false });
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

  // Ultra-smooth touch handling with professional gestures
  const handleTouchStart = (e: React.TouchEvent) => {
    // Prevent browser's default touch behaviors for smoother control
    e.preventDefault();
    
    // Allow column resizing to work - don't block if we're near a resize handle
    if (isResizing) return;
    
    // Check if touch is near a resize handle by looking for resize handle elements
    const target = e.target as HTMLElement;
    if (target.classList.contains('resize-handle') || target.closest('.resize-handle')) {
      return; // Let the resize handle work
    }
    
    // Cancel any ongoing momentum animation
    if (momentumAnimationRef.current) {
      cancelAnimationFrame(momentumAnimationRef.current);
      momentumAnimationRef.current = null;
    }
    
    if (e.touches.length === 2) {
      // Professional pinch zoom with smooth scaling
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const distance = Math.sqrt(
        Math.pow(touch2.clientX - touch1.clientX, 2) + 
        Math.pow(touch2.clientY - touch1.clientY, 2)
      );
      
      // Calculate the center point between two fingers with high precision
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
      
      // Stop any panning when starting pinch zoom
      setIsPanning(false);
    } else if (e.touches.length === 1) {
      // Ultra-smooth single touch pan with advanced velocity tracking
      const touch = e.touches[0];
      setIsPanning(true);
      setPanStart({ x: touch.clientX - panOffset.x, y: touch.clientY - panOffset.y });
      
      // High-precision velocity tracking for natural momentum
      const currentTime = performance.now(); // More precise timing
      setLastTouchTime(currentTime);
      setLastTouchPosition({ x: touch.clientX, y: touch.clientY });
      setTouchVelocity({ x: 0, y: 0 });
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    // Don't handle zoom/pan if we're resizing columns or editing
    if (isResizing || editingCell) return;
    
    if (e.touches.length === 2) {
      // Professional pinch zoom with ultra-smooth scaling
      e.preventDefault();
      e.stopPropagation();
      
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
        // Smooth zoom scaling with damping for natural feel
        const dampingFactor = 0.8;
        const smoothScale = 1 + (scale - 1) * dampingFactor;
        const newZoom = Math.max(0.3, Math.min(3, initialZoom * smoothScale));
        const deltaZoom = newZoom - zoomLevel;
        
        if (Math.abs(deltaZoom) > 0.005) { // More sensitive threshold
          zoomAtPoint(deltaZoom, focusPoint);
        }
      }
    } else if (e.touches.length === 1 && isPanning) {
      // Ultra-smooth single touch pan with advanced velocity tracking
      e.preventDefault();
      
      const touch = e.touches[0];
      const currentTime = performance.now(); // High precision timing
      const deltaTime = currentTime - lastTouchTime;
      
      if (deltaTime > 0) {
        // Advanced velocity calculation with smoothing
        const deltaX = touch.clientX - lastTouchPosition.x;
        const deltaY = touch.clientY - lastTouchPosition.y;
        
        // Apply exponential smoothing for more natural feel
        const smoothingFactor = 0.7;
        const velocityX = (deltaX / deltaTime * 1000) * smoothingFactor + touchVelocity.x * (1 - smoothingFactor);
        const velocityY = (deltaY / deltaTime * 1000) * smoothingFactor + touchVelocity.y * (1 - smoothingFactor);
        
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
        
        // Smooth panning with micro-adjustments for precision
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
      (e.currentTarget as any).focusPoint = null;
    }
    
    if (e.touches.length === 0) {
      setIsPanning(false);
      
      // Professional momentum scrolling with intelligent threshold
      const velocityMagnitude = Math.sqrt(touchVelocity.x * touchVelocity.x + touchVelocity.y * touchVelocity.y);
      
      if (velocityMagnitude > 0.5) { // Lower threshold for more responsive momentum
        // Scale velocity for optimal momentum feel
        const scaledVelocity = {
          x: touchVelocity.x * 0.8, // Slight damping for natural feel
          y: touchVelocity.y * 0.8
        };
        applyMomentumScrolling(scaledVelocity);
      }
      
      // Reset velocity tracking
      setTouchVelocity({ x: 0, y: 0 });
    }
  };

  // Google Sheets style comment editing
  const handleCommentCellClick = (order: Order) => {
    setSelectedOrderForComment(order);
  };

  const handleCommentSave = (comment: string) => {
    if (selectedOrderForComment) {
      onUpdateComment(selectedOrderForComment.id, comment);
      setSelectedOrderForComment(null);
    }
  };

  const handleCommentCancel = () => {
    setSelectedOrderForComment(null);
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
      'Numéro erroné': 'bg-blue-700',
      'Hors zone': 'bg-gray-500',
      'Programmé': 'bg-blue-500',
      'Nouveau': 'bg-blue-500',
      'Pas de réponse': 'bg-yellow-500'
    };
    
    return (
      <div className={cn(
        'inline-flex items-center justify-center rounded-sm text-white font-medium w-16 h-4 text-center',
        statusColors[status as keyof typeof statusColors] || 'bg-gray-500'
      )}>
        <span className="truncate text-[9px]">{t(status) || status}</span>
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
    
    setPhoneActionsPopup({
      isOpen: true,
      phoneNumber,
      orderId,
      position: {
        x: rect.left + rect.width / 2,
        y: rect.top - 35
      }
    });
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
  const handleWhatsAppMessage = (phoneNumber: string, orderCode: string) => {
    let cleanNumber = phoneNumber.replace(/[\s-+()]/g, '');
    
    // إضافة كود المغرب +212 إذا لم يكن موجوداً
    if (!cleanNumber.startsWith('212')) {
      // إزالة الصفر الأول إذا كان موجوداً
      if (cleanNumber.startsWith('0')) {
        cleanNumber = cleanNumber.substring(1);
      }
      cleanNumber = '212' + cleanNumber;
    }
    
    // Template message: "Bonjour, je vous (nom livreur) appelé à propos de votre commande N° (code) , Merci de me répondre."
    const message = `Bonjour, je vous appelé à propos de votre commande N° ${orderCode}, Merci de me répondre.`;
    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/${cleanNumber}?text=${encodedMessage}`, '_blank');
    closePhoneActionsPopup();
  };

  // دالة إرسال رسالة عادية
  const handleSMSMessage = (phoneNumber: string, orderCode: string) => {
    // Template message: "Bonjour, je vous (nom livreur) appelé à propos de votre commande N° (code) , Merci de me répondre."
    const message = `Bonjour, je vous appelé à propos de votre commande N° ${orderCode}, Merci de me répondre.`;
    window.open(`sms:${phoneNumber}?body=${encodeURIComponent(message)}`, '_self');
    closePhoneActionsPopup();
  };

  // دالة تحرير رقم الهاتف
  const handleEditPhone = (orderId: string) => {
    setEditingCell(`${orderId}-numero`);
    closePhoneActionsPopup();
  };

  // دالة تحديث رقم الهاتف
  const handlePhoneChange = (id: string, phone: string) => {
    onUpdatePhone(id, phone);
  };

  // دالة معالجة فوكس رقم الهاتف
  const handlePhoneFocus = (id: string) => {
    setEditingCell(`${id}-numero`);
  };

  // دالة معالجة blur رقم الهاتف
  const handlePhoneBlur = () => {
    setEditingCell(null);
  };

  // دالة معالجة الضغط على Enter في رقم الهاتف
  const handlePhoneKeyDown = (e: React.KeyboardEvent, id: string) => {
    if (e.key === 'Enter') {
      setEditingCell(null);
    }
  };

  // دوال تحرير السعر
  const handlePriceDoubleClick = (e: React.MouseEvent, price: number, orderId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setEditingCell(`${orderId}-prix`);
  };

  const handlePriceChange = (id: string, price: string) => {
    const numPrice = parseFloat(price) || 0;
    onUpdatePrice(id, numPrice);
  };

  const handlePriceFocus = (id: string) => {
    setEditingCell(`${id}-prix`);
  };

  const handlePriceBlur = () => {
    setEditingCell(null);
  };

  const handlePriceKeyDown = (e: React.KeyboardEvent, id: string) => {
    if (e.key === 'Enter') {
      setEditingCell(null);
    }
  };

  return (
    <div className="w-full bg-white">
      {/* Professional Table Container with Ultra-Smooth Touch Support */}
      <div 
        ref={containerRef}
        className={cn(
          "w-full h-[calc(100vh-200px)] border border-gray-300 bg-white relative",
          "ultra-smooth-table hardware-accelerated momentum-scroll",
          showScrollbar ? "overflow-x-auto" : "overflow-x-hidden",
          "overflow-y-auto touch-manipulation"
        )}
        data-scrollbar="show"
        style={{ 
          cursor: zoomLevel > 1 ? (isPanning ? 'grabbing' : 'grab') : 'default',
          scrollbarWidth: 'auto',
          scrollbarColor: 'hsl(210 100% 14%) rgba(0, 0, 0, 0.05)',
          userSelect: isResizing ? 'none' : 'auto',
          WebkitUserSelect: isResizing ? 'none' : 'auto',
          WebkitTouchCallout: 'none',
          touchAction: editingCell ? 'auto' : 'pan-x pan-y pinch-zoom',
          overscrollBehavior: 'contain'
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onWheel={editingCell ? undefined : handleWheel}
      >
        {/* Ultra-Smooth Transform Container with Professional Transitions */}
        <div 
          className="absolute top-0 left-0 w-full h-full hardware-accelerated"
          style={{
            transform: `scale(${zoomLevel}) translate(${panOffset.x}px, ${panOffset.y}px)`,
            transformOrigin: 'top left',
            transition: isPanning || isResizing || momentumAnimationRef.current ? 'none' : 'transform 0.15s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
            minWidth: '800px',
            minHeight: '100%',
            pointerEvents: editingCell ? 'none' : 'auto',
            willChange: isPanning || isResizing ? 'transform' : 'auto',
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden'
          }}
        >
          <div className="w-full shadow-lg rounded-sm overflow-hidden bg-white">
            {/* Header Row with Significantly Enhanced Resizable Handles for Touch */}
            <div className="flex">
              {/* Code Column Header */}
              {tableSettings.columnVisibility.code && (
                <div className="relative" style={{ width: `${columnWidths.code}%`, minWidth: '80px' }}>
                   <div className="h-7 px-2 py-1 border-b-2 border-gray-400 bg-gradient-to-r from-gray-200 to-gray-300 flex items-center justify-center">
                     <span className="text-xs font-bold text-gray-800">code</span>
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
              )}

              {/* CL/Vendeur Column Header */}
              {tableSettings.columnVisibility.destination && (
                <div className="relative" style={{ width: `${columnWidths.vendeur}%`, minWidth: '120px' }}>
                  <div className="h-7 px-2 py-1 border-b-2 border-gray-400 bg-gradient-to-r from-gray-200 to-gray-300 flex items-center justify-center">
                    <span className="text-xs font-bold text-gray-800">{t('client')}</span>
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
              )}

              {/* Number Column Header */}
              {tableSettings.columnVisibility.phone && (
                <div className="relative" style={{ width: `${columnWidths.numero}%`, minWidth: '100px' }}>
                  <div className="h-7 px-2 py-1 border-b-2 border-gray-400 bg-gradient-to-r from-gray-200 to-gray-300 flex items-center justify-center">
                    <span className="text-xs font-bold text-gray-800">{t('phone')}</span>
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
              )}

              {/* Price Column Header */}
              {tableSettings.columnVisibility.price && (
                <div className="relative" style={{ width: `${columnWidths.prix}%`, minWidth: '70px' }}>
                  <div className="h-7 px-2 py-1 border-b-2 border-gray-400 bg-gradient-to-r from-gray-200 to-gray-300 flex items-center justify-center">
                    <span className="text-xs font-bold text-gray-800">{t('price')}</span>
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
              )}

              {/* Status Column Header */}
              {tableSettings.columnVisibility.status && (
                <div className="relative" style={{ width: `${columnWidths.status}%`, minWidth: '90px' }}>
                  <div className="h-7 px-2 py-1 border-b-2 border-gray-400 bg-gradient-to-r from-gray-200 to-gray-300 flex items-center justify-center">
                    <span className="text-xs font-bold text-gray-800">{t('status')}</span>
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
              )}

              {/* Comment Column Header */}
              {tableSettings.columnVisibility.comment && (
                <div className="flex-1" style={{ minWidth: '150px' }}>
                  <div className="h-7 px-2 py-1 border-b-2 border-gray-400 bg-gradient-to-r from-gray-200 to-gray-300 flex items-center justify-center">
                    <span className="text-xs font-bold text-gray-800">{t('comment')}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Data Rows */}
            <DndContext 
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext items={orders.map(order => order.id)} strategy={verticalListSortingStrategy}>
                <div 
                  className="flex-1"
                  style={{
                    fontSize: `${tableSettings.fontSize}px`,
                    fontWeight: tableSettings.fontWeight === 'bold' ? 'bold' : tableSettings.fontWeight === 'light' ? '300' : 'normal'
                  }}
                >
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
                  <SortableOrderRow 
                    key={order.id} 
                    order={order} 
                    index={index}
                    className={cn(
                      "border-b border-gray-300 transition-all duration-300",
                      rowBackgroundClass
                    )}
                  >
                    <div className="flex">
                    {/* Code Column Data */}
                    {tableSettings.columnVisibility.code && (
                      <div style={{ width: `${columnWidths.code}%`, minWidth: '80px' }}>
                        <div 
                          className={cn(
                            "h-7 px-2 py-1 border-b border-gray-300 flex items-center hover:bg-blue-50 transition-all duration-300",
                            rowBackgroundClass,
                            // تلوين خانة الكود بالأخضر عند مسح الطلبية
                            (order.isScanned || isPermanentlyScanned) && "bg-green-100 border-green-300"
                          )}
                        >
                          <span 
                            className={cn(
                              "truncate w-full",
                              `text-${tableSettings.textAlignment.code}`,
                              // تلوين النص بالأخضر الداكن عند مسح الطلبية
                              (order.isScanned || isPermanentlyScanned) ? "text-green-800 font-medium" : "text-gray-800"
                            )}
                          >
                            {order.code}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Vendeur Column Data */}
                    {tableSettings.columnVisibility.destination && (
                      <div style={{ width: `${columnWidths.vendeur}%`, minWidth: '120px' }}>
                        <div 
                          className={cn(
                            "h-7 px-2 py-1 border-b border-gray-300 flex items-center hover:bg-blue-50 transition-all duration-300",
                            rowBackgroundClass
                          )}
                        >
                          <span className="truncate w-full text-gray-800">
                            {order.vendeur}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Number Column Data */}
                    {tableSettings.columnVisibility.phone && (
                      <div style={{ width: `${columnWidths.numero}%`, minWidth: '100px' }}>
                        <div 
                          className={cn(
                            "h-7 px-2 py-1 border-b border-gray-300 flex items-center hover:bg-blue-50 transition-all duration-300 cursor-pointer relative",
                            rowBackgroundClass,
                            editingCell === `${order.id}-numero` && "bg-white border-blue-500 shadow-sm"
                          )}
                          onDoubleClick={(e) => handlePhoneDoubleClick(e, order.numero, order.id)}
                        >
                        {editingCell === `${order.id}-numero` ? (
                          <div 
                            className="fixed inset-0 z-[100] bg-black/20 flex items-center justify-center"
                            onClick={handlePhoneBlur}
                          >
                            <div 
                              className="bg-white rounded-lg p-4 mx-4 w-full max-w-sm shadow-xl"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <div className="text-center mb-3">
                                <h3 className="text-lg font-semibold">تعديل رقم الهاتف</h3>
                              </div>
                              <input
                                value={order.numero}
                                onChange={(e) => handlePhoneChange(order.id, e.target.value)}
                                onBlur={handlePhoneBlur}
                                onKeyDown={(e) => handlePhoneKeyDown(e, order.id)}
                                className="w-full h-12 px-3 text-base border border-gray-300 rounded-md outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-center"
                                placeholder="أدخل رقم الهاتف..."
                                autoFocus
                                type="tel"
                                inputMode="tel"
                              />
                              <div className="flex gap-2 mt-4">
                                <button
                                  onClick={handlePhoneBlur}
                                  className="flex-1 px-4 py-2 bg-green-500 text-white rounded-md text-sm font-medium hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500"
                                >
                                  حفظ
                                </button>
                                <button
                                  onClick={handlePhoneBlur}
                                  className="flex-1 px-4 py-2 bg-gray-500 text-white rounded-md text-sm font-medium hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500"
                                >
                                  إلغاء
                                </button>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <span 
                            className={cn(
                              "truncate w-full font-mono text-gray-800 select-text",
                              `text-${tableSettings.textAlignment.phone}`
                            )}
                          >
                            {order.numero}
                          </span>
                        )}
                      </div>
                    </div>
                    )}

                    {/* Price Column Data */}
                    {tableSettings.columnVisibility.price && (
                      <div style={{ width: `${columnWidths.prix}%`, minWidth: '70px' }}>
                        <div 
                          className={cn(
                            "h-7 px-2 py-1 border-b border-gray-300 flex items-center justify-center hover:bg-blue-50 transition-all duration-300 cursor-pointer relative",
                            rowBackgroundClass,
                            editingCell === `${order.id}-prix` && "bg-white border-blue-500 shadow-sm"
                          )}
                          onDoubleClick={(e) => handlePriceDoubleClick(e, order.prix, order.id)}
                        >
                        {editingCell === `${order.id}-prix` ? (
                          <div 
                            className="fixed inset-0 z-[100] bg-black/20 flex items-center justify-center"
                            onClick={handlePriceBlur}
                          >
                            <div 
                              className="bg-white rounded-lg p-4 mx-4 w-full max-w-sm shadow-xl"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <div className="text-center mb-3">
                                <h3 className="text-lg font-semibold">{t('price')}</h3>
                              </div>
                              <input
                                value={order.prix.toString()}
                                onChange={(e) => handlePriceChange(order.id, e.target.value)}
                                onBlur={handlePriceBlur}
                                onKeyDown={(e) => handlePriceKeyDown(e, order.id)}
                                className="w-full h-12 px-3 text-base border border-gray-300 rounded-md outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-center"
                                placeholder="أدخل السعر..."
                                autoFocus
                                type="number"
                                inputMode="decimal"
                                step="0.01"
                                min="0"
                              />
                              <div className="flex gap-2 mt-4">
                                <button
                                  onClick={handlePriceBlur}
                                  className="flex-1 px-4 py-2 bg-green-500 text-white rounded-md text-sm font-medium hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500"
                                >
                                  حفظ
                                </button>
                                <button
                                  onClick={handlePriceBlur}
                                  className="flex-1 px-4 py-2 bg-gray-500 text-white rounded-md text-sm font-medium hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500"
                                >
                                  إلغاء
                                </button>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <span 
                            className={cn(
                              "font-medium text-green-700",
                              `text-${tableSettings.textAlignment.price}`
                            )}
                          >
                            {formatPrice(order.prix)}
                          </span>
                        )}
                      </div>
                    </div>
                    )}

                    {/* Status Column Data - Updated to use confirmation dialog */}
                    {tableSettings.columnVisibility.status && (
                      <div style={{ width: `${columnWidths.status}%`, minWidth: '90px' }}>
                        <div 
                          className={cn(
                            "h-7 px-1 py-1 border-b border-gray-300 flex items-center justify-center hover:bg-blue-50 transition-all duration-300",
                          rowBackgroundClass
                        )}
                      >
                         <DropdownMenu 
                           open={openDropdownId === order.id} 
                           onOpenChange={(open) => {
                             if (open) {
                               setOpenDropdownId(order.id);
                             } else {
                               setOpenDropdownId(null);
                             }
                           }}
                         >
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
                                 onClick={() => {
                                   handleStatusChange(order.id, status);
                                   setOpenDropdownId(null);
                                 }}
                                 className="cursor-pointer hover:bg-gray-100 px-2 py-1 focus:bg-gray-100"
                               >
                                 {getStatusBadge(status)} 
                               </DropdownMenuItem>
                             ))}
                           </DropdownMenuContent>
                         </DropdownMenu>
                      </div>
                    </div>
                    )}

                    {/* Comment Column Data */}
                    {tableSettings.columnVisibility.comment && (
                      <div className="flex-1" style={{ minWidth: '150px' }}>
                       <div 
                         className={cn(
                           "h-7 px-2 py-1 border-b border-gray-300 flex items-center cursor-pointer transition-all duration-300 relative",
                           `text-${tableSettings.textAlignment.comment}`,
                           rowBackgroundClass,
                           selectedOrderForComment?.id === order.id && "bg-blue-50 border-blue-300 ring-2 ring-blue-200",
                           "hover:bg-blue-50"
                         )}
                         onClick={() => handleCommentCellClick(order)}
                        >
                         {(() => {
                           const comment = order.commentaire || '';
                           const priorityMatch = comment.match(/^(\d+)\.\s*/);
                           const priority = priorityMatch ? parseInt(priorityMatch[1]) : null;
                           const textWithoutPriority = comment.replace(/^\d+\.\s*/, '');
                           
                           return (
                             <div className="flex items-center gap-2 w-full">
                               {priority && priority >= 1 && priority <= 5 && (
                                 <div className={cn(
                                   "flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shadow-md border-2",
                                   priority === 1 && "bg-red-500 text-white border-red-600 animate-pulse",
                                   priority === 2 && "bg-orange-500 text-white border-orange-600",
                                   priority === 3 && "bg-yellow-500 text-white border-yellow-600", 
                                   priority === 4 && "bg-blue-500 text-white border-blue-600",
                                   priority === 5 && "bg-gray-500 text-white border-gray-600"
                                 )}>
                                   {priority}
                                 </div>
                               )}
                               <span className={cn(
                                 "truncate flex-1",
                                 priority ? "text-gray-900 font-medium" : "text-gray-600",
                                 priority === 1 && "text-red-700 font-semibold"
                               )}>
                                 {textWithoutPriority || (priority ? `أولوية ${priority}` : t('add_comment'))}
                               </span>
                               {priority === 1 && (
                                 <div className="flex-shrink-0 text-red-500 animate-bounce">
                                   <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                     <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                                   </svg>
                                 </div>
                               )}
                             </div>
                           );
                         })()}
                       </div>
                     </div>
                     )}
                    </div>
                  </SortableOrderRow>
                );
              })}
                </div>
              </SortableContext>
            </DndContext>
          </div>
        </div>

        {/* Editing Overlay - Prevents zoom/pan when editing */}
        {(editingCell || selectedOrderForComment) && (
          <div 
            className="absolute inset-0 bg-transparent z-30 pointer-events-auto"
            onClick={() => {
              setEditingCell(null);
              setSelectedOrderForComment(null);
            }}
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
              className="fixed z-[70] bg-white rounded-lg shadow-xl border border-gray-200 p-1"
              style={{
                left: phoneActionsPopup.position.x,
                top: phoneActionsPopup.position.y - 25,
                transform: 'translate(-50%, 0)'
              }}
            >
              {/* الأيقونات */}
              <div className="flex gap-1">
                {/* أيقونة الاتصال */}
                <button
                  onClick={() => handlePhoneCall(phoneActionsPopup.phoneNumber)}
                  className="p-2 hover:bg-green-50 rounded-md transition-all duration-200 group"
                  title="اتصال"
                >
                  <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center group-hover:bg-green-600 transition-colors">
                    <Phone className="w-3 h-3 text-white" />
                  </div>
                </button>

                {/* أيقونة واتساب */}
                <button
                  onClick={() => {
                    const order = orders.find(o => o.id === phoneActionsPopup.orderId);
                    const orderCode = order?.code || '';
                    handleWhatsAppMessage(phoneActionsPopup.phoneNumber, orderCode);
                  }}
                  className="p-2 hover:bg-green-50 rounded-md transition-all duration-200 group"
                  title="واتساب"
                >
                  <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center group-hover:bg-green-600 transition-colors">
                    <MessageCircle className="w-3 h-3 text-white" />
                  </div>
                </button>

                {/* أيقونة رسالة نصية */}
                <button
                  onClick={() => {
                    const order = orders.find(o => o.id === phoneActionsPopup.orderId);
                    const orderCode = order?.code || '';
                    handleSMSMessage(phoneActionsPopup.phoneNumber, orderCode);
                  }}
                  className="p-2 hover:bg-blue-50 rounded-md transition-all duration-200 group"
                  title="رسالة"
                >
                  <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center group-hover:bg-blue-600 transition-colors">
                    <Send className="w-3 h-3 text-white" />
                  </div>
                </button>

                {/* أيقونة تحرير */}
                <button
                  onClick={() => handleEditPhone(phoneActionsPopup.orderId)}
                  className="p-2 hover:bg-orange-50 rounded-md transition-all duration-200 group"
                  title="تحرير"
                >
                  <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center group-hover:bg-orange-600 transition-colors">
                    <Edit2 className="w-3 h-3 text-white" />
                  </div>
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

      {/* نافذة تأكيد التسليم */}
      <AlertDialog open={confirmDialog.isOpen} onOpenChange={(open) => !open && handleCancelConfirmation()}>
        <AlertDialogContent className="max-w-xs sm:max-w-md mx-4 rounded-2xl border-0 shadow-xl bg-background animate-scale-in">
          <AlertDialogHeader className="text-center px-6 pt-8 pb-6">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-blue-50 flex items-center justify-center">
              <svg className="w-8 h-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
              </svg>
            </div>
            
            <AlertDialogTitle className="text-xl font-bold text-foreground mb-2" dir={isRTL ? 'rtl' : 'ltr'}>
              {t('confirm_delivery')}
            </AlertDialogTitle>
            
            <AlertDialogDescription className="text-sm text-muted-foreground" dir={isRTL ? 'rtl' : 'ltr'}>
              <div className="space-y-4">
                <p>
                  {t('confirm_delivery_question')}
                </p>
                <div className="inline-flex items-center bg-blue-50 px-4 py-3 rounded-xl">
                  <span className="font-bold text-blue-600 text-lg">
                    {confirmDialog.orderCode}
                  </span>
                </div>
                <div className="bg-amber-50 p-4 rounded-xl">
                  <p className="text-amber-700 text-sm">
                    {t('archive_warning')}
                  </p>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <AlertDialogFooter className="flex flex-col sm:flex-row gap-3 px-6 pb-6 border-t bg-muted/30" dir={isRTL ? 'rtl' : 'ltr'}>
            <AlertDialogCancel 
              onClick={handleCancelConfirmation} 
              className="w-full sm:w-auto bg-muted hover:bg-muted/80 text-muted-foreground border-0 rounded-xl font-medium py-4 px-6 text-base"
            >
              {t('cancel')}
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmDelivery} 
              className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white border-0 rounded-xl font-medium py-4 px-6 text-base shadow-lg"
            >
              <span className="flex items-center justify-center gap-2">
                <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                {t('confirm_delivery_action')}
              </span>
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

      {/* Custom scrollbar styles - Enhanced for mobile */}
      <style>{`
        div[data-scrollbar="${showScrollbar ? 'show' : 'hide'}"] {
          scrollbar-width: ${showScrollbar ? 'thin' : 'none'};
        }
        div[data-scrollbar="${showScrollbar ? 'show' : 'hide'}"]::-webkit-scrollbar {
          height: ${showScrollbar ? '8px' : '0px'};
          width: 8px;
        }
        div[data-scrollbar="${showScrollbar ? 'show' : 'hide'}"]::-webkit-scrollbar-track {
          background: ${showScrollbar ? 'rgba(0, 0, 0, 0.05)' : 'transparent'};
          border-radius: 10px;
        }
        div[data-scrollbar="${showScrollbar ? 'show' : 'hide'}"]::-webkit-scrollbar-thumb {
          background: ${showScrollbar ? 'linear-gradient(45deg, hsl(210 100% 14%), hsl(210 100% 24%))' : 'transparent'};
          border-radius: 10px;
          border: 2px solid transparent;
          background-clip: content-box;
        }
        div[data-scrollbar="${showScrollbar ? 'show' : 'hide'}"]::-webkit-scrollbar-thumb:hover {
          background: ${showScrollbar ? 'linear-gradient(45deg, hsl(210 100% 24%), hsl(210 100% 34%))' : 'transparent'};
          background-clip: content-box;
        }
        div[data-scrollbar="${showScrollbar ? 'show' : 'hide'}"]::-webkit-scrollbar-thumb:active {
          background: ${showScrollbar ? 'linear-gradient(45deg, hsl(210 100% 34%), hsl(210 100% 44%))' : 'transparent'};
          background-clip: content-box;
        }
        
        /* Force scrollbar visibility on mobile */
        @media (max-width: 768px) {
          div[data-scrollbar="show"]::-webkit-scrollbar {
            height: 10px !important;
            width: 10px !important;
          }
          div[data-scrollbar="show"]::-webkit-scrollbar-thumb {
            background: linear-gradient(45deg, hsl(210 100% 14%), hsl(210 100% 24%)) !important;
            border-radius: 12px !important;
            border: 1px solid rgba(255, 255, 255, 0.3) !important;
            background-clip: padding-box !important;
          }
          div[data-scrollbar="show"]::-webkit-scrollbar-track {
            background: rgba(0, 0, 0, 0.08) !important;
            border-radius: 12px !important;
            margin: 2px !important;
          }
        }
      `}</style>

      {/* Google Sheets Style Comment Editor */}
      <GoogleSheetsCommentEditor
        selectedOrder={selectedOrderForComment}
        onSave={handleCommentSave}
        onCancel={handleCommentCancel}
      />
    </div>
  );
};

export default OrdersTable;
