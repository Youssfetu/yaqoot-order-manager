import React from 'react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';

interface CommentEditorProps {
  orderId: string;
  initialComment: string;
  onSave: (comment: string) => void;
  onCancel: () => void;
  isRTL?: boolean;
}

const CommentEditor: React.FC<CommentEditorProps> = ({
  orderId,
  initialComment,
  onSave,
  onCancel,
  isRTL = false
}) => {
  const { t } = useLanguage();
  const [comment, setComment] = React.useState(initialComment);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  const saveTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  React.useEffect(() => {
    // Focus textarea
    if (textareaRef.current) {
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
  }, []);

  const handleSave = (newComment: string) => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    onSave(newComment);
  };

  const handleCommentChange = (newComment: string) => {
    setComment(newComment);
    
    // Auto-save with debounce
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    saveTimeoutRef.current = setTimeout(() => {
      handleSave(newComment);
    }, 1000);
  };

  const handlePriorityClick = (priority: number) => {
    const priorityText = `${priority}. `;
    const newComment = comment.startsWith(priorityText) 
      ? comment.substring(priorityText.length)
      : priorityText + comment.replace(/^\d+\.\s*/, '');
    
    setComment(newComment);
    
    // Immediate save for priority
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    setTimeout(() => {
      handleSave(newComment);
    }, 200);
  };

  const priorities = [
    { num: 1, color: "red", label: isRTL ? "عاجل" : "Urgent", gradient: "from-red-500 to-red-600" },
    { num: 2, color: "orange", label: isRTL ? "مهم" : "Important", gradient: "from-orange-500 to-orange-600" },
    { num: 3, color: "yellow", label: isRTL ? "عادي" : "Normal", gradient: "from-yellow-500 to-amber-600" },
    { num: 4, color: "blue", label: isRTL ? "مؤجل" : "Delayed", gradient: "from-blue-500 to-blue-600" },
    { num: 5, color: "gray", label: isRTL ? "أخير" : "Last", gradient: "from-gray-500 to-gray-600" }
  ];

  return (
    <div className="fixed inset-0 z-[9999] bg-black/30 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-md mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold text-gray-900">
            {t('edit_comment')}
          </h3>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Priority Buttons */}
        <div className="p-4 border-b bg-gray-50">
          <div className="text-sm font-medium text-gray-700 mb-2">
            {isRTL ? "الأولوية:" : "Priority:"}
          </div>
          <div className="flex gap-2 justify-center">
            {priorities.map((priority) => {
              const isSelected = comment.startsWith(`${priority.num}. `);
              return (
                <button
                  key={priority.num}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handlePriorityClick(priority.num);
                  }}
                  className={cn(
                    "w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-sm transition-all duration-200",
                    "hover:scale-110 active:scale-95 border-2",
                    isSelected 
                      ? `bg-gradient-to-br ${priority.gradient} shadow-lg scale-105 border-white` 
                      : `bg-gradient-to-br ${priority.gradient} shadow-md opacity-80 hover:opacity-100 border-gray-300`
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

        {/* Comment Textarea */}
        <div className="p-4">
          <textarea
            ref={textareaRef}
            value={comment}
            onChange={(e) => handleCommentChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                onCancel();
              } else if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                handleSave(comment);
              }
            }}
            className={cn(
              "w-full h-32 px-3 py-2 border border-gray-300 rounded-lg resize-none",
              "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
              "text-sm",
              isRTL && "text-right"
            )}
            placeholder={isRTL ? "أضف تعليق..." : "Add comment..."}
            style={{ 
              fontSize: '14px',
              lineHeight: '1.4'
            }}
          />
        </div>

        {/* Footer */}
        <div className="flex gap-2 p-4 border-t bg-gray-50">
          <button
            onClick={() => handleSave(comment)}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
          >
            {isRTL ? "حفظ" : "Save"}
          </button>
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2 bg-gray-500 text-white rounded-lg text-sm font-medium hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors"
          >
            {isRTL ? "إلغاء" : "Cancel"}
          </button>
        </div>

        {/* Keyboard shortcuts hint */}
        <div className="px-4 pb-2 text-xs text-gray-500 text-center">
          {isRTL ? "Ctrl+Enter للحفظ • Escape للإلغاء" : "Ctrl+Enter to save • Escape to cancel"}
        </div>
      </div>
    </div>
  );
};

export default CommentEditor;