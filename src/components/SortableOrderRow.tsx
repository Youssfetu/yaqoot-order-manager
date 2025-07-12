import React from 'react';
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
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: order.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.8 : 1,
    zIndex: isDragging ? 1000 : 'auto',
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`${className} ${isDragging ? 'shadow-lg' : ''} relative group`}
    >
      <div className="flex items-center">
        {/* Drag Handle */}
        <div
          {...attributes}
          {...listeners}
          className="w-8 flex-shrink-0 flex items-center justify-center cursor-grab active:cursor-grabbing opacity-30 hover:opacity-100 transition-opacity"
        >
          <GripVertical size={16} className="text-gray-500" />
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