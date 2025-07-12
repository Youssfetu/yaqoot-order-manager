import React, { useState, useRef, useEffect } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Order } from '@/pages/Index';

interface SortableOrderRowProps {
  order: Order;
  index: number;
  children: React.ReactNode;
  className?: string;
}

const SortableOrderRow: React.FC<SortableOrderRowProps> = ({ 
  order, 
  index, 
  children, 
  className 
}) => {
  const [isLongPress, setIsLongPress] = useState(false);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const touchStartPos = useRef<{ x: number; y: number } | null>(null);
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
    setActivatorNodeRef,
  } = useSortable({ 
    id: order.id,
    disabled: !isLongPress
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: isDragging ? 'none' : transition,
    opacity: isDragging ? 0.9 : 1,
    zIndex: isDragging ? 1000 : 'auto',
    touchAction: 'none',
  };

  // Handle long press for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStartPos.current = { x: touch.clientX, y: touch.clientY };
    
    // Clear any existing timer
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
    }
    
    // Start long press timer
    longPressTimer.current = setTimeout(() => {
      setIsLongPress(true);
      
      // Add haptic feedback on mobile
      if ('vibrate' in navigator) {
        navigator.vibrate(50);
      }
      
      // Trigger drag start
      if (listeners?.onPointerDown) {
        const syntheticEvent = new PointerEvent('pointerdown', {
          clientX: touch.clientX,
          clientY: touch.clientY,
          pointerId: 1,
          pointerType: 'touch',
          isPrimary: true,
          bubbles: true,
        });
        listeners.onPointerDown(syntheticEvent as any);
      }
    }, 200); // 200ms for long press
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStartPos.current) return;
    
    const touch = e.touches[0];
    const deltaX = Math.abs(touch.clientX - touchStartPos.current.x);
    const deltaY = Math.abs(touch.clientY - touchStartPos.current.y);
    
    // Cancel long press if finger moves too much (more than 10px)
    if ((deltaX > 10 || deltaY > 10) && longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    
    // If we're in drag mode, handle the move
    if (isLongPress && listeners?.onPointerMove) {
      const syntheticEvent = new PointerEvent('pointermove', {
        clientX: touch.clientX,
        clientY: touch.clientY,
        pointerId: 1,
        pointerType: 'touch',
        isPrimary: true,
        bubbles: true,
      });
      listeners.onPointerMove(syntheticEvent as any);
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    // Clear long press timer
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    
    // If we were dragging, end the drag
    if (isLongPress && listeners?.onPointerUp) {
      const changedTouch = e.changedTouches[0];
      const syntheticEvent = new PointerEvent('pointerup', {
        clientX: changedTouch.clientX,
        clientY: changedTouch.clientY,
        pointerId: 1,
        pointerType: 'touch',
        isPrimary: true,
        bubbles: true,
      });
      listeners.onPointerUp(syntheticEvent as any);
    }
    
    // Reset states
    setIsLongPress(false);
    touchStartPos.current = null;
  };

  // Handle mouse events for desktop
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return; // Only left click
    
    setIsLongPress(true);
    if (listeners?.onPointerDown) {
      listeners.onPointerDown(e as any);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
      }
    };
  }, []);

  return (
    <div
      ref={(node) => {
        setNodeRef(node);
        setActivatorNodeRef(node);
      }}
      style={style}
      className={`
        ${className} 
        ${isDragging ? 'shadow-lg scale-105 bg-white border-2 border-blue-300 rounded-lg' : ''} 
        ${isLongPress && !isDragging ? 'bg-blue-50 scale-[1.02]' : ''}
        relative transition-all duration-200 ease-out
        touch-manipulation
        min-h-[48px]
        select-none
        cursor-grab
        active:cursor-grabbing
      `}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleMouseDown}
      {...attributes}
    >
      {/* Enhanced visual feedback for drag state */}
      {isDragging && (
        <div className="absolute inset-0 bg-gradient-to-r from-blue-100 to-indigo-100 opacity-50 rounded-lg pointer-events-none" />
      )}
      
      {/* Long press visual indicator */}
      {isLongPress && !isDragging && (
        <div className="absolute inset-0 bg-blue-100 opacity-30 rounded-md pointer-events-none animate-pulse" />
      )}
      
      {/* Order Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
};

export default SortableOrderRow;