
import React, { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Upload, FileText, FileSpreadsheet } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Order } from '@/pages/Index';

interface UploadDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (orders: Order[]) => void;
}

const UploadDialog: React.FC<UploadDialogProps> = ({ isOpen, onClose, onUpload }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const file = files[0];
    
    // Check file type
    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.ms-excel', // .xls
      'application/pdf',
      'text/csv'
    ];

    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "نوع ملف غير مدعوم",
        description: "يرجى تحميل ملف Excel، PDF أو CSV",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);

    // Simulate file processing
    setTimeout(() => {
      const mockOrders: Order[] = [
        {
          id: Date.now().toString(),
          code: 'CMD100',
          vendeur: 'خالد أحمد',
          numero: '555123456',
          prix: 425.00,
          statut: 'مؤكد',
          commentaire: 'مستورد من الملف'
        },
        {
          id: (Date.now() + 1).toString(),
          code: 'CMD101',
          vendeur: 'سارة محمد',
          numero: '555987654',
          prix: 380.50,
          statut: 'قيد المعالجة',
          commentaire: 'مستورد من الملف'
        }
      ];

      onUpload(mockOrders);
      setIsProcessing(false);
      onClose();

      toast({
        title: "تم تحميل الملف بنجاح",
        description: `تم استيراد ${mockOrders.length} طلبية من الملف`,
      });
    }, 2000);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle>تحميل ملف الطلبيات</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              isDragging
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-300 hover:border-gray-400'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            {isProcessing ? (
              <div className="space-y-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-sm text-gray-600">جاري معالجة الملف...</p>
              </div>
            ) : (
              <div className="space-y-4">
                <Upload className="h-12 w-12 text-gray-400 mx-auto" />
                <div>
                  <p className="text-lg font-medium text-gray-900">
                    اسحب الملف هنا أو انقر للتحديد
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    يدعم ملفات Excel (.xlsx, .xls) و PDF و CSV
                  </p>
                </div>
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  variant="outline"
                  className="gap-2"
                >
                  <Upload className="h-4 w-4" />
                  اختيار ملف
                </Button>
              </div>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls,.pdf,.csv"
            onChange={(e) => handleFileSelect(e.target.files)}
            className="hidden"
          />

          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">الأعمدة المدعومة:</h4>
            <div className="grid grid-cols-2 gap-2 text-sm text-blue-800">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="h-4 w-4" />
                Code
              </div>
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Vendeur/Client
              </div>
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="h-4 w-4" />
                Numéro
              </div>
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Prix
              </div>
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="h-4 w-4" />
                Statut
              </div>
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Commentaire
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isProcessing}>
            إلغاء
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default UploadDialog;
