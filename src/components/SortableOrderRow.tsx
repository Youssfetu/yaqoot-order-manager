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
        navigator.vibrate(50);
      }
    }, 300); // 300ms long press
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
    transition: isDragging ? 'none' : 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    opacity: isDragging ? 0.7 : 1,
    zIndex: isDragging ? 1000 : 'auto',
    scale: isDragging ? '1.02' : '1',
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`${className} ${isDragging ? 'shadow-2xl bg-background/95 border border-border rounded-md' : ''} ${
        isPressed ? 'scale-[0.98]' : ''
      } ${longPressActivated ? 'ring-2 ring-primary/30' : ''} relative group transition-all duration-200`}
    >
      <div className="flex items-center">
        {/* Drag Handle */}
        <div
          ref={setActivatorNodeRef}
          {...attributes}
          {...listeners}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
          onTouchStart={handleMouseDown}
          onTouchEnd={handleMouseUp}
          className={`w-8 flex-shrink-0 flex items-center justify-center select-none touch-none
            ${longPressActivated ? 'cursor-grabbing' : 'cursor-grab'} 
            ${isPressed ? 'opacity-100 scale-110' : 'opacity-0 group-hover:opacity-60'} 
            ${longPressActivated ? 'opacity-100' : ''} 
            transition-all duration-200 ease-out`}
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