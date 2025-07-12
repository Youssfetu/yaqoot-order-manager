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