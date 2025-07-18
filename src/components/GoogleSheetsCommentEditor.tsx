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
            {/* Compact Priority Icons */}
            <div className="bg-gradient-to-r from-primary/5 to-primary/10 rounded-lg p-2">
              <div className="grid grid-cols-5 gap-1">
              {[
                { num: 1, color: "red", label: isRTL ? "عاجل" : "Urgent", icon: "⚡" },
                { num: 2, color: "orange", label: isRTL ? "مهم" : "Important", icon: "🔥" },
                { num: 3, color: "yellow", label: isRTL ? "عادي" : "Normal", icon: "⭐" },
                { num: 4, color: "blue", label: isRTL ? "مؤجل" : "Delayed", icon: "📅" },
                { num: 5, color: "gray", label: isRTL ? "أخير" : "Last", icon: "📦" }
              ].map((priority) => {
                const isSelected = comment.startsWith(`${priority.num}. `);
                return (
                  <div key={priority.num} className="flex flex-col items-center">
                    <button
                      onClick={() => {
                        const priorityText = `${priority.num}. `;
                        const newComment = comment.startsWith(priorityText) 
                          ? comment.substring(priorityText.length)
                          : priorityText + comment.replace(/^\d+\.\s*/, '');
                         setComment(newComment);
                         onCommentChange?.(newComment);
                      }}
                      className={cn(
                        "w-8 h-8 rounded-full border-2 flex flex-col items-center justify-center text-xs font-bold transition-all duration-300 relative overflow-hidden",
                        priority.color === "red" && (isSelected 
                          ? "bg-red-500 text-white border-red-600 shadow-sm scale-105" 
                          : "bg-red-50 text-red-600 border-red-300 hover:bg-red-500 hover:text-white"),
                        priority.color === "orange" && (isSelected 
                          ? "bg-orange-500 text-white border-orange-600 shadow-sm scale-105" 
                          : "bg-orange-50 text-orange-600 border-orange-300 hover:bg-orange-500 hover:text-white"),
                        priority.color === "yellow" && (isSelected 
                          ? "bg-yellow-500 text-white border-yellow-600 shadow-sm scale-105" 
                          : "bg-yellow-50 text-yellow-600 border-yellow-400 hover:bg-yellow-500 hover:text-white"),
                        priority.color === "blue" && (isSelected 
                          ? "bg-blue-500 text-white border-blue-600 shadow-sm scale-105" 
                          : "bg-blue-50 text-blue-600 border-blue-300 hover:bg-blue-500 hover:text-white"),
                        priority.color === "gray" && (isSelected 
                          ? "bg-gray-500 text-white border-gray-600 shadow-sm scale-105" 
                          : "bg-gray-50 text-gray-600 border-gray-300 hover:bg-gray-500 hover:text-white")
                      )}
                      type="button"
                    >
                      <span className="text-sm leading-none">{priority.icon}</span>
                      <span className="text-xs font-bold leading-none">{priority.num}</span>
                    </button>
                    <span className={cn(
                      "text-xs mt-0.5 font-medium transition-colors",
                      isSelected ? `text-${priority.color}-600` : "text-gray-500"
                    )}>
                      {priority.label}
                    </span>
                  </div>
                );
              })}
            </div>
            </div>
            
            <Textarea
              ref={textareaRef}
              value={comment}
              onChange={(e) => {
                setComment(e.target.value);
                onCommentChange?.(e.target.value);
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
            
            <div className="flex gap-2 justify-center pt-1">
              <Button
                onClick={onCancel}
                variant="outline"
                className="h-8 px-4 rounded-lg border-2 text-sm"
                size="sm"
              >
                {t('cancel')}
              </Button>
              
              <Button
                onClick={handleSave}
                className="h-8 px-4 bg-primary hover:bg-primary/90 text-white rounded-lg text-sm"
                size="sm"
              >
                <Check className="h-3 w-3 mr-1" />
                {t('save')}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GoogleSheetsCommentEditor;