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
    console.log('Priority clicked:', priority);
    const priorityText = `${priority}. `;
    let newComment = '';
    
    // إزالة أي أولوية موجودة أولاً
    const commentWithoutPriority = liveCommentText.replace(/^\d+\.\s*/, '');
    
    // إضافة الأولوية الجديدة
    newComment = priorityText + commentWithoutPriority;
    
    console.log('New comment with priority:', newComment);
    onCommentTextChange(newComment);
    
    // حفظ فوري للأولوية
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    setTimeout(() => {
      console.log('Saving priority comment:', newComment);
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

  if (isEditing) {
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
        
        {/* أزرار الأولوية السريعة */}
        <div className="absolute -top-16 left-0 right-0 bg-white border border-gray-200 rounded-md shadow-lg p-3 z-[999]">
          <div className="flex gap-2 justify-center flex-wrap">
            {[
              { num: 1, color: "orange", label: isRTL ? "عاجل جداً" : "Very Urgent" },
              { num: 2, color: "red", label: isRTL ? "عاجل" : "Urgent" },
              { num: 3, color: "yellow", label: isRTL ? "مهم" : "Important" },
              { num: 4, color: "blue", label: isRTL ? "عادي" : "Normal" },
              { num: 5, color: "gray", label: isRTL ? "مؤجل" : "Delayed" },
              { num: 6, color: "purple", label: isRTL ? "متأخر" : "Late" },
              { num: 7, color: "pink", label: isRTL ? "ملغى" : "Cancelled" }
            ].map((priority) => {
              const isSelected = liveCommentText.startsWith(`${priority.num}. `);
              return (
                <button
                  key={priority.num}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handlePriorityClick(priority.num);
                  }}
                  onTouchStart={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handlePriorityClick(priority.num);
                  }}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handlePriorityClick(priority.num);
                  }}
                  className={cn(
                    "w-10 h-10 md:w-8 md:h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm md:text-xs transition-all duration-200",
                    "hover:scale-110 active:scale-95 border border-white/20 focus:outline-none touch-manipulation",
                    priority.color === "orange" && (isSelected ? "bg-orange-600 shadow-lg scale-105" : "bg-orange-500 shadow-md opacity-80 hover:opacity-100"),
                    priority.color === "red" && (isSelected ? "bg-red-600 shadow-lg scale-105" : "bg-red-500 shadow-md opacity-80 hover:opacity-100"),
                    priority.color === "yellow" && (isSelected ? "bg-yellow-600 shadow-lg scale-105" : "bg-yellow-500 shadow-md opacity-80 hover:opacity-100"),
                    priority.color === "blue" && (isSelected ? "bg-blue-600 shadow-lg scale-105" : "bg-blue-500 shadow-md opacity-80 hover:opacity-100"),
                    priority.color === "gray" && (isSelected ? "bg-gray-600 shadow-lg scale-105" : "bg-gray-500 shadow-md opacity-80 hover:opacity-100"),
                    priority.color === "purple" && (isSelected ? "bg-purple-600 shadow-lg scale-105" : "bg-purple-500 shadow-md opacity-80 hover:opacity-100"),
                    priority.color === "pink" && (isSelected ? "bg-pink-600 shadow-lg scale-105" : "bg-pink-500 shadow-md opacity-80 hover:opacity-100")
                  )}
                  type="button"
                  title={priority.label}
                >
                  {priority.num}
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
  const priorityMatch = displayComment.match(/^(\d+)\.\s*/);
  const priority = priorityMatch ? parseInt(priorityMatch[1]) : null;
  const textWithoutPriority = displayComment.replace(/^\d+\.\s*/, '');
  
  console.log('Priority Debug:', { displayComment, priorityMatch, priority, textWithoutPriority });

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
        {priority && priority >= 1 && priority <= 7 && (
          <div className={cn(
            "flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shadow-sm border",
            priority === 1 && "bg-orange-500 text-white border-orange-600",
            priority === 2 && "bg-red-500 text-white border-red-600",
            priority === 3 && "bg-yellow-500 text-white border-yellow-600", 
            priority === 4 && "bg-blue-500 text-white border-blue-600",
            priority === 5 && "bg-gray-500 text-white border-gray-600",
            priority === 6 && "bg-purple-500 text-white border-purple-600",
            priority === 7 && "bg-pink-500 text-white border-pink-600"
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