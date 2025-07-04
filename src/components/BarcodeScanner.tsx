
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { QrCode, Camera } from 'lucide-react';

interface BarcodeScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (code: string) => void;
}

const BarcodeScanner: React.FC<BarcodeScannerProps> = ({ isOpen, onClose, onScan }) => {
  const [manualCode, setManualCode] = useState('');
  const [isScanning, setIsScanning] = useState(false);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualCode.trim()) {
      onScan(manualCode.trim());
      setManualCode('');
    }
  };

  const startScanning = () => {
    setIsScanning(true);
    // Simulate barcode scanning
    setTimeout(() => {
      // Mock scanned code
      const mockCode = 'CMD001';
      onScan(mockCode);
      setIsScanning(false);
    }, 3000);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle>مسح الباركود</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Camera Scanner */}
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900">مسح بالكاميرا</h4>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              {isScanning ? (
                <div className="space-y-4">
                  <div className="animate-pulse">
                    <Camera className="h-16 w-16 text-blue-500 mx-auto" />
                  </div>
                  <p className="text-sm text-gray-600">جاري البحث عن الباركود...</p>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-blue-600 h-2 rounded-full animate-pulse" style={{ width: '60%' }}></div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <QrCode className="h-16 w-16 text-gray-400 mx-auto" />
                  <p className="text-sm text-gray-600">انقر لبدء مسح الباركود</p>
                  <Button
                    onClick={startScanning}
                    className="gap-2 bg-gradient-to-r from-blue-600 to-orange-600 hover:from-blue-700 hover:to-orange-700"
                  >
                    <Camera className="h-4 w-4" />
                    بدء المسح
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Manual Input */}
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900">إدخال يدوي</h4>
            <form onSubmit={handleManualSubmit} className="flex gap-2">
              <Input
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                placeholder="أدخل كود الطلبية..."
                className="flex-1"
              />
              <Button type="submit" variant="outline">
                بحث
              </Button>
            </form>
          </div>

          {/* Instructions */}
          <div className="bg-amber-50 p-4 rounded-lg">
            <h5 className="font-medium text-amber-900 mb-2">تعليمات:</h5>
            <ul className="text-sm text-amber-800 space-y-1">
              <li>• وجه الكاميرا نحو الباركود</li>
              <li>• تأكد من وضوح الإضاءة</li>
              <li>• يمكنك إدخال الكود يدوياً إذا لم يعمل المسح</li>
            </ul>
          </div>
        </div>

        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => {
              setIsScanning(false);
              setManualCode('');
              onClose();
            }}
          >
            إغلاق
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BarcodeScanner;
