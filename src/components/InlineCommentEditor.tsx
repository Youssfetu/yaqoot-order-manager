import React from 'react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';

interface InlineCommentEditorProps {
  order: any;
  isEditing: boolean;
  liveCommentText: string;
  onCommentTextChange: (text: string) => void;
  onSave: (orderId: string, comment: string) => void;
  onCancel: () => void;
  onCellClick: () => void;
}

const PRIORITY_COLORS = {
  1: "bg-red-500 border-red-600 hover:bg-red-600",
  2: "bg-orange-500 border-orange-600 hover:bg-orange-600", 
  3: "bg-yellow-500 border-yellow-600 hover:bg-yellow-600",
  4: "bg-blue-500 border-blue-600 hover:bg-blue-600",
  5: "bg-green-500 border-green-600 hover:bg-green-600",
  6: "bg-purple-500 border-purple-600 hover:bg-purple-600",
  7: "bg-gray-500 border-gray-600 hover:bg-gray-600"
};

const PRIORITY_LABELS = {
  ar: {
    1: "عاجل جداً",
    2: "عاجل", 
    3: "مهم",
    4: "عادي",
    5: "منخفض",
    6: "متأخر",
    7: "مؤجل"
  },
  en: {
    1: "Urgent",
    2: "High",
    3: "Important", 
    4: "Normal",
    5: "Low",
    6: "Late",
    7: "Delayed"
  }
};

const InlineCommentEditor: React.FC<InlineCommentEditorProps> = ({
  order,
  isEditing,
  liveCommentText,
  onCommentTextChange,
  onSave,
  onCancel,
  onCellClick
}) => {
  const { t, isRTL } = useLanguage();
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  const saveTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  React.useEffect(() => {
    if (isEditing && textareaRef.current) {
      setTimeout(() => {
        textareaRef.current?.focus();
        textareaRef.current?.select();
      }, 100);
    }
    
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [isEditing]);

  const handlePriorityClick = (priority: number) => {
    console.log(`🔥 Priority ${priority} clicked for order:`, order.id);
    console.log(`🔥 Current liveCommentText:`, liveCommentText);
    console.log(`🔥 All priorities available: 1,2,3,4,5,6,7`);
    
    // إزالة أي أولوية موجودة
    const cleanText = liveCommentText.replace(/^\d+\.\s*/, '');
    
    // إضافة الأولوية الجديدة
    const newComment = `${priority}. ${cleanText}`;
    
    console.log(`🔥 Setting comment: ${newComment}`);
    onCommentTextChange(newComment);
    
    // حفظ فوري
    setTimeout(() => {
      console.log(`🔥 Saving comment: ${newComment} for order: ${order.id}`);
      onSave(order.id, newComment);
    }, 100);
  };

  const handleTextChange = (newComment: string) => {
    onCommentTextChange(newComment);
    
    // حفظ تلقائي مع debounce
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    saveTimeoutRef.current = setTimeout(() => {
      onSave(order.id, newComment);
    }, 1000);
  };

  const handleBlur = () => {
    // حفظ عند فقدان التركيز
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    onSave(order.id, liveCommentText);
    setTimeout(() => onCancel(), 100);
  };

  // استخراج الأولوية من النص
  const getPriorityFromText = (text: string): number | null => {
    const match = text.match(/^(\d+)\.\s*/);
    if (match) {
      const num = parseInt(match[1]);
      return num >= 1 && num <= 7 ? num : null;
    }
    return null;
  };

  if (isEditing) {
    const currentPriority = getPriorityFromText(liveCommentText);
    
    return (
      <div className="relative">
        <textarea
          ref={textareaRef}
          value={liveCommentText}
          onChange={(e) => handleTextChange(e.target.value)}
          onKeyDown={(e) => {
            e.stopPropagation();
            if (e.key === 'Escape') {
              onCancel();
            } else if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
              onSave(order.id, liveCommentText);
              onCancel();
            }
          }}
          onBlur={handleBlur}
          className={cn(
            "w-full h-20 px-2 py-1 border-2 border-blue-500 rounded-md resize-none",
            "focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-600",
            "bg-white shadow-lg z-50 text-sm",
            "absolute top-0 left-0 right-0",
            isRTL && "text-right"
          )}
          placeholder={t('add_comment')}
          style={{ 
            fontSize: '14px',
            minHeight: '60px',
            maxHeight: '120px'
          }}
        />
        
        {/* أزرار الأولوية */}
        <div className="absolute -top-20 left-0 right-0 bg-white border border-gray-300 rounded-lg shadow-xl p-3 z-[1000]">
          <div className="text-xs text-gray-600 text-center mb-2 font-medium">
            {isRTL ? "اختر الأولوية" : "Select Priority"}
          </div>
          <div className="grid grid-cols-7 gap-2">
            {[1, 2, 3, 4, 5, 6, 7].map((priority) => {
              const isSelected = currentPriority === priority;
              const label = isRTL ? PRIORITY_LABELS.ar[priority] : PRIORITY_LABELS.en[priority];
              
              return (
                <button
                  key={priority}
                  type="button"
                  className={cn(
                    "w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold text-lg transition-all duration-200 border-2",
                    "active:scale-95 focus:outline-none focus:ring-2 focus:ring-blue-300",
                    "touch-manipulation select-none",
                    PRIORITY_COLORS[priority],
                    isSelected && "ring-4 ring-blue-400 scale-110 shadow-lg"
                  )}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handlePriorityClick(priority);
                  }}
                  title={label}
                >
                  {priority}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // عرض التعليق العادي
  const displayComment = order.commentaire || '';
  const priority = getPriorityFromText(displayComment);
  const textWithoutPriority = displayComment.replace(/^\d+\.\s*/, '');
  
  return (
    <div 
      className="h-7 px-2 py-1 border-b border-gray-300 flex items-center cursor-pointer transition-all duration-200 relative hover:bg-blue-50 hover:border-blue-300 group"
      onClick={(e) => {
        e.stopPropagation();
        e.preventDefault();
        onCellClick();
      }}
    >
      <div className="flex items-center gap-2 w-full">
        {priority && (
          <div className={cn(
            "flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-sm border-2",
            PRIORITY_COLORS[priority]
          )}>
            {priority}
          </div>
        )}
        <span className={cn(
          "truncate flex-1 text-sm",
          priority ? "text-gray-900 font-medium" : "text-gray-500",
          priority === 1 && "text-red-700 font-semibold",
          "group-hover:text-blue-600"
        )}>
          {textWithoutPriority || t('add_comment')}
        </span>
        
        {/* مؤشر التحرير */}
        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </div>
      </div>
    </div>
  );
};

export default InlineCommentEditor;