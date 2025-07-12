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
    touchAction: isLongPress ? 'none' : 'manipulation',
  };

  // Handle long press for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    console.log('Touch start detected on mobile');
    e.stopPropagation(); // منع الحاوي الرئيسي من التدخل
    const touch = e.touches[0];
    touchStartPos.current = { x: touch.clientX, y: touch.clientY };
    
    // Clear any existing timer
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
    }
    
    console.log('Starting long press timer...');
    // Start long press timer
    longPressTimer.current = setTimeout(() => {
      console.log('Long press activated!');
      setIsLongPress(true);
      
      // Add haptic feedback on mobile
      if ('vibrate' in navigator) {
        console.log('Vibrating device');
        navigator.vibrate(50);
      }
      
      console.log('Triggering drag start manually');
      // Force enable dragging and trigger pointer event
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
    }, 200); // 0.2 seconds for faster response
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    console.log('Touch move detected');
    if (!touchStartPos.current) return;
    
    const touch = e.touches[0];
    const deltaX = Math.abs(touch.clientX - touchStartPos.current.x);
    const deltaY = Math.abs(touch.clientY - touchStartPos.current.y);
    
    console.log(`Touch movement: deltaX=${deltaX}, deltaY=${deltaY}`);
    
    // Cancel long press if finger moves too much (more than 10px)
    if ((deltaX > 10 || deltaY > 10) && longPressTimer.current) {
      console.log('Cancelling long press due to movement');
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    
    // If we're in drag mode, handle the move
    if (isLongPress) {
      e.stopPropagation(); // منع الحاوي الرئيسي من التدخل
      e.preventDefault(); // منع التمرير الافتراضي
      if (listeners?.onPointerMove) {
        console.log('Handling drag move');
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
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    console.log('Touch end detected');
    e.stopPropagation(); // منع الحاوي الرئيسي من التدخل
    
    // Clear long press timer
    if (longPressTimer.current) {
      console.log('Clearing long press timer');
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    
    // If we were dragging, end the drag
    if (isLongPress && listeners?.onPointerUp) {
      console.log('Ending drag');
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
    console.log('Resetting drag state');
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
      className={`${className} ${isDragging ? 'shadow-lg' : ''} relative cursor-pointer`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleMouseDown}
      {...attributes}
    >
      {/* Long press visual indicator */}
      {longPressTimer.current && !isDragging && (
        <div className="absolute inset-0 bg-blue-100 opacity-30 pointer-events-none animate-pulse rounded" />
      )}
      
      {/* Drag mode indicator */}
      {isDragging && (
        <div className="absolute inset-0 bg-blue-200 opacity-40 pointer-events-none rounded shadow-lg" />
      )}
      
      {children}
    </div>
  );
};

export default SortableOrderRow;