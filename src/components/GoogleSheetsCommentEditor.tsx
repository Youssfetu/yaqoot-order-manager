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
}

const GoogleSheetsCommentEditor: React.FC<GoogleSheetsCommentEditorProps> = ({
  selectedOrder,
  onSave,
  onCancel
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
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-primary shadow-lg z-50 animate-slide-up">
      <div className="max-w-4xl mx-auto p-4">
        <div className="flex items-center justify-between mb-3">
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
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="space-y-3">
          {/* Smart Priority Icons */}
          <div className="bg-gradient-to-r from-primary/5 to-primary/10 rounded-lg p-3 mb-3">
            <div className="text-center mb-2">
              <span className="text-sm font-semibold text-primary">{isRTL ? "🎯 أولوية التسليم الذكية" : "🎯 Priorité intelligente"}</span>
            </div>
            <div className="flex gap-2 justify-center">
              {[
                { num: 1, color: "red", label: isRTL ? "عاجل" : "Urgent", icon: "⚡" },
                { num: 2, color: "orange", label: isRTL ? "مهم" : "Important", icon: "🔥" },
                { num: 3, color: "yellow", label: isRTL ? "عادي" : "Normal", icon: "⭐" },
                { num: 4, color: "blue", label: isRTL ? "مؤجل" : "Différé", icon: "📅" },
                { num: 5, color: "gray", label: isRTL ? "أخير" : "Dernier", icon: "📦" }
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
                      }}
                      className={cn(
                        "w-12 h-12 rounded-full border-3 flex flex-col items-center justify-center text-xs font-bold transition-all duration-300 relative overflow-hidden",
                        priority.color === "red" && (isSelected 
                          ? "bg-red-500 text-white border-red-600 shadow-lg shadow-red-200 animate-pulse scale-110" 
                          : "bg-red-50 text-red-600 border-red-300 hover:bg-red-500 hover:text-white hover:border-red-600"),
                        priority.color === "orange" && (isSelected 
                          ? "bg-orange-500 text-white border-orange-600 shadow-lg shadow-orange-200 scale-110" 
                          : "bg-orange-50 text-orange-600 border-orange-300 hover:bg-orange-500 hover:text-white hover:border-orange-600"),
                        priority.color === "yellow" && (isSelected 
                          ? "bg-yellow-500 text-white border-yellow-600 shadow-lg shadow-yellow-200 scale-110" 
                          : "bg-yellow-50 text-yellow-600 border-yellow-400 hover:bg-yellow-500 hover:text-white hover:border-yellow-600"),
                        priority.color === "blue" && (isSelected 
                          ? "bg-blue-500 text-white border-blue-600 shadow-lg shadow-blue-200 scale-110" 
                          : "bg-blue-50 text-blue-600 border-blue-300 hover:bg-blue-500 hover:text-white hover:border-blue-600"),
                        priority.color === "gray" && (isSelected 
                          ? "bg-gray-500 text-white border-gray-600 shadow-lg shadow-gray-200 scale-110" 
                          : "bg-gray-50 text-gray-600 border-gray-300 hover:bg-gray-500 hover:text-white hover:border-gray-600")
                      )}
                      type="button"
                    >
                      <span className="text-lg leading-none">{priority.icon}</span>
                      <span className="text-xs font-bold leading-none">{priority.num}</span>
                      {isSelected && (
                        <div className="absolute inset-0 bg-white/20 rounded-full animate-ping"></div>
                      )}
                    </button>
                    <span className={cn(
                      "text-xs mt-1 font-medium transition-colors",
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
            onChange={(e) => setComment(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t('add_comment')}
            className={cn(
              "min-h-[80px] max-h-[120px] resize-none text-base w-full",
              "focus:ring-2 focus:ring-primary focus:border-primary",
              "border-2 border-gray-300",
              isRTL && "text-right"
            )}
            style={{ fontSize: '16px' }} // Prevent zoom on iOS
          />
          
          <div className="flex gap-2 justify-center">
            <Button
              onClick={onCancel}
              variant="outline"
              className="h-10"
              size="sm"
            >
              {t('cancel')}
            </Button>
            
            <Button
              onClick={handleSave}
              className="h-10 bg-primary hover:bg-primary/90 text-white"
              size="sm"
            >
              <Check className="h-4 w-4 mr-1" />
              {t('save')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GoogleSheetsCommentEditor;