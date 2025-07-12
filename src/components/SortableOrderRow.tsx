import React, { useState, useRef, useCallback } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
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
  const [isPressed, setIsPressed] = useState(false);
  const [longPressActivated, setLongPressActivated] = useState(false);
  const pressTimer = useRef<NodeJS.Timeout>();
  
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
    disabled: !longPressActivated
  });

  const handleMouseDown = useCallback(() => {
    setIsPressed(true);
    pressTimer.current = setTimeout(() => {
      setLongPressActivated(true);
      // Add haptic feedback if available
      if ('vibrate' in navigator) {
        navigator.vibrate([50, 25, 50]);
      }
    }, 250); // Reduced to 250ms for faster response like Google Sheets
  }, []);

  const handleMouseUp = useCallback(() => {
    setIsPressed(false);
    if (pressTimer.current) {
      clearTimeout(pressTimer.current);
    }
    // Reset after a short delay if not dragging
    setTimeout(() => {
      if (!isDragging) {
        setLongPressActivated(false);
      }
    }, 100);
  }, [isDragging]);

  const handleMouseLeave = useCallback(() => {
    setIsPressed(false);
    if (pressTimer.current) {
      clearTimeout(pressTimer.current);
    }
  }, []);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: isDragging ? 'none' : transition || 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
    opacity: isDragging ? 0.9 : 1,
    zIndex: isDragging ? 1000 : 'auto',
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`${className} ${
        isDragging 
          ? 'shadow-[0_8px_30px_rgb(0,0,0,0.12)] bg-background border border-primary/20 rounded-lg scale-105' 
          : ''
      } ${
        isPressed ? 'scale-[0.985] bg-muted/30' : ''
      } ${
        longPressActivated ? 'ring-1 ring-primary/40 bg-primary/5 cursor-grabbing' : 'cursor-default'
      } relative group transition-all duration-150 ease-out hover:bg-muted/20`}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      onTouchStart={handleMouseDown}
      onTouchEnd={handleMouseUp}
    >
      <div 
        ref={longPressActivated ? setActivatorNodeRef : undefined}
        {...(longPressActivated ? attributes : {})}
        {...(longPressActivated ? listeners : {})}
        className="flex items-center"
      >
        {/* Drag Handle */}
        <div
          className={`w-8 flex-shrink-0 flex items-center justify-center select-none touch-none
            ${isPressed ? 'opacity-100 scale-110 bg-primary/10 rounded' : 'opacity-0 group-hover:opacity-70'} 
            ${longPressActivated ? 'opacity-100 bg-primary/15 rounded' : ''} 
            transition-all duration-150 ease-out hover:bg-muted/30`}
        >
          <GripVertical 
            size={16} 
            className={`${longPressActivated ? 'text-primary' : 'text-muted-foreground'} transition-colors duration-200`} 
          />
        </div>
        
        {/* Order Content */}
        <div className="flex-1">
          {children}
        </div>
      </div>
    </div>
  );
};

export default SortableOrderRow;