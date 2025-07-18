import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { X, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import type { Order } from '@/pages/Index';

interface GoogleSheetsCommentEditorProps {
  selectedOrder: Order | null;
  onSave: (comment: string) => void;
  onCancel: () => void;
  onCommentChange?: (comment: string) => void; // إضافة خاصية جديدة للتحديث المباشر
}

const GoogleSheetsCommentEditor: React.FC<GoogleSheetsCommentEditorProps> = ({
  selectedOrder,
  onSave,
  onCancel,
  onCommentChange
}) => {
  const { t, isRTL } = useLanguage();
  const [comment, setComment] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (selectedOrder) {
      setComment(selectedOrder.commentaire || '');
      // Focus textarea after a short delay to ensure it's rendered
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 100);
    }
  }, [selectedOrder]);

  const handleSave = () => {
    onSave(comment);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onCancel();
    } else if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      handleSave();
    }
  };

  if (!selectedOrder) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/30 backdrop-blur-sm"
        onClick={onCancel}
      />
      
      {/* Modal Content - Compact Version */}
      <div className="relative w-full bg-white rounded-t-xl shadow-xl animate-slide-up max-h-[50vh] overflow-hidden">
        <div className="px-3 py-3">
          {/* Compact Header */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-primary">
                {selectedOrder.numero}
              </span>
              <span className="text-xs text-muted-foreground">
                ({selectedOrder.vendeur})
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onCancel}
              className="h-7 w-7 p-0 rounded-full hover:bg-gray-100"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="space-y-2">
            {/* Professional Priority Icons */}
            <div className="bg-gradient-to-r from-slate-50 to-gray-50 rounded-xl p-3 border border-gray-100 shadow-sm">
              <div className="flex gap-3 justify-center">
              {[
                { num: 1, color: "red", label: isRTL ? "عاجل" : "Urgent", icon: "⚡", gradient: "from-red-400 to-red-600", shadow: "shadow-red-200", ring: "ring-red-100" },
                { num: 2, color: "orange", label: isRTL ? "مهم" : "Important", icon: "🔥", gradient: "from-orange-400 to-orange-600", shadow: "shadow-orange-200", ring: "ring-orange-100" },
                { num: 3, color: "yellow", label: isRTL ? "عادي" : "Normal", icon: "⭐", gradient: "from-yellow-400 to-amber-500", shadow: "shadow-yellow-200", ring: "ring-yellow-100" },
                { num: 4, color: "blue", label: isRTL ? "مؤجل" : "Delayed", icon: "📅", gradient: "from-blue-400 to-blue-600", shadow: "shadow-blue-200", ring: "ring-blue-100" },
                { num: 5, color: "gray", label: isRTL ? "أخير" : "Last", icon: "📦", gradient: "from-gray-400 to-gray-600", shadow: "shadow-gray-200", ring: "ring-gray-100" }
              ].map((priority) => {
                const isSelected = comment.startsWith(`${priority.num}. `);
                return (
                  <div key={priority.num} className="flex flex-col items-center group">
                    <button
                      onClick={() => {
                        const priorityText = `${priority.num}. `;
                        const newComment = comment.startsWith(priorityText) 
                          ? comment.substring(priorityText.length)
                          : priorityText + comment.replace(/^\d+\.\s*/, '');
                         setComment(newComment);
                         onCommentChange?.(newComment);
                         // حفظ تلقائي عند تغيير الأولوية
                         onSave(newComment);
                      }}
                      className={cn(
                        "relative w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-sm transition-all duration-300 transform-gpu",
                        "hover:scale-110 hover:rotate-3 active:scale-95",
                        "border-2 border-white/20 backdrop-blur-sm",
                        isSelected 
                          ? `bg-gradient-to-br ${priority.gradient} shadow-lg ${priority.shadow} ring-4 ${priority.ring} scale-105 rotate-2` 
                          : `bg-gradient-to-br ${priority.gradient} shadow-md hover:shadow-lg opacity-75 hover:opacity-100`,
                        "before:absolute before:inset-0 before:rounded-xl before:bg-gradient-to-br before:from-white/20 before:to-transparent before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-300"
                      )}
                      type="button"
                    >
                      <span className="relative z-10 text-base drop-shadow-sm">{priority.num}</span>
                      
                      {/* Glowing effect when selected */}
                      {isSelected && (
                        <div className={cn(
                          "absolute inset-0 rounded-xl blur-xl opacity-40 animate-pulse",
                          `bg-gradient-to-br ${priority.gradient}`
                        )} />
                      )}
                      
                      {/* Icon overlay */}
                      <div className="absolute -top-1 -right-1 text-xs opacity-80">
                        {priority.icon}
                      </div>
                    </button>
                    
                    {/* Priority label with animation */}
                    <span className={cn(
                      "text-xs mt-2 font-medium transition-all duration-300 text-center",
                      isSelected 
                        ? `text-${priority.color}-600 font-semibold scale-105` 
                        : "text-gray-500 group-hover:text-gray-700"
                    )}>
                      {priority.label}
                    </span>
                    
                    {/* Selection indicator */}
                    {isSelected && (
                      <div className={cn(
                        "w-1 h-1 rounded-full mt-1 animate-pulse",
                        `bg-${priority.color}-500`
                      )} />
                    )}
                  </div>
                );
              })}
            </div>
            </div>
            
            <Textarea
              ref={textareaRef}
              value={comment}
              onChange={(e) => {
                const newComment = e.target.value;
                setComment(newComment);
                onCommentChange?.(newComment);
                // حفظ تلقائي فوري
                onSave(newComment);
              }}
              onKeyDown={handleKeyDown}
              placeholder={t('add_comment')}
              className={cn(
                "min-h-[60px] max-h-[80px] resize-none w-full",
                "focus:ring-2 focus:ring-primary focus:border-primary",
                "border-2 border-gray-300 rounded-lg text-sm",
                isRTL && "text-right"
              )}
              style={{ 
                fontSize: '16px', // Prevent zoom on iOS
                transform: 'scale(1)', // Prevent zoom
                transformOrigin: 'left top'
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default GoogleSheetsCommentEditor;