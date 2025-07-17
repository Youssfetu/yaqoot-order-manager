
import React, { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import GoogleSheetsCommentEditor from './GoogleSheetsCommentEditor';
import type { Order } from '@/pages/Index';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

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
}

interface SortableOrderRowProps {
  order: Order;
  index: number;
  onUpdateComment: (id: string, comment: string) => void;
  onUpdateStatus: (id: string, status: string) => void;
  onUpdatePhone: (id: string, phone: string) => void;
  onUpdatePrice: (id: string, price: number) => void;
  tableSettings: TableSettings;
  visibleColumns: string[];
  getColumnWidth: (column: string) => string;
  getColumnAlignment: (column: string) => string;
  isHighlighted?: boolean;
  isScanned?: boolean;
}

const SortableOrderRow: React.FC<SortableOrderRowProps> = ({
  order,
  index,
  onUpdateComment,
  onUpdateStatus,
  onUpdatePhone,
  onUpdatePrice,
  tableSettings,
  visibleColumns,
  getColumnWidth,
  getColumnAlignment,
  isHighlighted = false,
  isScanned = false,
}) => {
  const { t } = useLanguage();
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  
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
  };

  const statuses = [
    { value: 'Nouveau', color: 'bg-blue-100 text-blue-800 border-blue-200' },
    { value: 'Confirmé', color: 'bg-green-100 text-green-800 border-green-200' },
    { value: 'Expédié', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
    { value: 'Livré', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
    { value: 'Annulé', color: 'bg-red-100 text-red-800 border-red-200' },
    { value: 'Refusé', color: 'bg-gray-100 text-gray-800 border-gray-200' },
    { value: 'Hors zone', color: 'bg-orange-100 text-orange-800 border-orange-200' },
    { value: 'Pas de réponse', color: 'bg-purple-100 text-purple-800 border-purple-200' },
  ];

  const currentStatus = statuses.find(s => s.value === order.statut) || statuses[0];

  const handleDropdownToggle = (dropdownId: string, isOpen: boolean) => {
    if (isOpen) {
      setOpenDropdown(dropdownId);
    } else {
      setOpenDropdown(null);
    }
  };

  const handleStatusChange = (newStatus: string) => {
    onUpdateStatus(order.id, newStatus);
    setOpenDropdown(null);
  };

  const getCellContent = (column: string) => {
    switch (column) {
      case 'code':
        return (
          <div 
            className={cn(
              "px-2 py-1 rounded font-mono text-sm",
              isScanned ? "bg-green-100 text-green-800 border border-green-200" : ""
            )}
          >
            {order.code}
          </div>
        );
      case 'destination':
        return order.vendeur;
      case 'phone':
        return (
          <Input
            value={order.numero}
            onChange={(e) => onUpdatePhone(order.id, e.target.value)}
            className="h-8 text-sm border-0 bg-transparent hover:bg-muted/50 focus:bg-background focus:border-primary/20"
            style={{
              fontSize: `${tableSettings.fontSize}px`,
              fontWeight: tableSettings.fontWeight,
            }}
          />
        );
      case 'price':
        return (
          <Input
            type="number"
            value={order.prix}
            onChange={(e) => onUpdatePrice(order.id, parseFloat(e.target.value) || 0)}
            className="h-8 text-sm border-0 bg-transparent hover:bg-muted/50 focus:bg-background focus:border-primary/20"
            style={{
              fontSize: `${tableSettings.fontSize}px`,
              fontWeight: tableSettings.fontWeight,
            }}
          />
        );
      case 'comment':
        return (
          <GoogleSheetsCommentEditor
            value={order.commentaire}
            onChange={(value) => onUpdateComment(order.id, value)}
            style={{
              fontSize: `${tableSettings.fontSize}px`,
              fontWeight: tableSettings.fontWeight,
            }}
          />
        );
      case 'status':
        return (
          <DropdownMenu 
            open={openDropdown === `status-${order.id}`}
            onOpenChange={(isOpen) => handleDropdownToggle(`status-${order.id}`, isOpen)}
          >
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  "h-8 px-2 text-xs font-medium border rounded-md hover:shadow-sm transition-all",
                  currentStatus.color
                )}
                style={{
                  fontSize: `${tableSettings.fontSize}px`,
                  fontWeight: tableSettings.fontWeight,
                }}
              >
                {order.statut}
                <ChevronDown className="ml-1 h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              {statuses.map((status) => (
                <DropdownMenuItem
                  key={status.value}
                  onClick={() => handleStatusChange(status.value)}
                  className={cn(
                    "text-xs font-medium cursor-pointer",
                    status.color
                  )}
                >
                  {status.value}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      default:
        return null;
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group flex items-center min-h-[48px] hover:bg-muted/30 transition-all duration-200",
        isDragging && "opacity-50 shadow-lg bg-background border border-primary/20 rounded-lg z-50",
        isHighlighted && "bg-green-50 border-l-4 border-green-400 animate-pulse",
        index % 2 === 0 ? "bg-background/50" : "bg-muted/20"
      )}
      {...attributes}
    >
      {/* Drag Handle */}
      <div 
        className="px-2 py-2 cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity"
        {...listeners}
      >
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </div>

      {/* Table Cells */}
      {visibleColumns.map((column) => (
        <div
          key={column}
          className={cn(
            getColumnWidth(column),
            getColumnAlignment(column),
            "px-2 flex items-center min-h-[48px]"
          )}
          style={{
            fontSize: `${tableSettings.fontSize}px`,
            fontWeight: tableSettings.fontWeight,
          }}
        >
          {getCellContent(column)}
        </div>
      ))}
    </div>
  );
};

export default SortableOrderRow;
