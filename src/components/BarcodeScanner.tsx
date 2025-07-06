
import React, { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { QrCode, Camera, X, CheckCircle } from 'lucide-react';

interface BarcodeScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (code: string) => void;
}

const BarcodeScanner: React.FC<BarcodeScannerProps> = ({ isOpen, onClose, onScan }) => {
  const [manualCode, setManualCode] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [lastScannedCode, setLastScannedCode] = useState<string | null>(null);
  const [scanResult, setScanResult] = useState<'success' | 'not-found' | null>(null);
  const scanTimeoutRef = useRef<NodeJS.Timeout>();

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualCode.trim()) {
      handleScanResult(manualCode.trim());
      setManualCode('');
    }
  };

  const handleScanResult = (code: string) => {
    setLastScannedCode(code);
    const result = onScan(code);
    // We'll assume the parent component will handle the toast and return success/failure
    // For now, we'll show success feedback
    setScanResult('success');
  };

  const startScanning = () => {
    setIsScanning(true);
    setScanResult(null);
    setLastScannedCode(null);
    // محاكاة مسح الكود
    scanTimeoutRef.current = setTimeout(() => {
      // كود وهمي للاختبار
      const mockCode = 'CMD001';
      handleScanResult(mockCode);
      setIsScanning(false);
    }, 3000);
  };

  const stopScanning = () => {
    if (scanTimeoutRef.current) {
      clearTimeout(scanTimeoutRef.current);
    }
    setIsScanning(false);
  };

  const handleClose = () => {
    // إيقاف المسح عند إغلاق النافذة
    stopScanning();
    setManualCode('');
    setLastScannedCode(null);
    setScanResult(null);
    onClose();
  };

  const handleContinueScanning = () => {
    setScanResult(null);
    setLastScannedCode(null);
  };

  // تنظيف عند إغلاق المكون
  React.useEffect(() => {
    return () => {
      if (scanTimeoutRef.current) {
        clearTimeout(scanTimeoutRef.current);
      }
    };
  }, []);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Scanner le code-barres</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Success Message */}
          {scanResult === 'success' && lastScannedCode && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-6 w-6 text-green-600" />
                <div>
                  <h4 className="font-medium text-green-800">تم العثور على الطلبية!</h4>
                  <p className="text-sm text-green-700">الكود: {lastScannedCode}</p>
                </div>
              </div>
              <div className="mt-3 flex gap-2">
                <Button
                  onClick={handleContinueScanning}
                  variant="outline"
                  size="sm"
                  className="border-green-300 text-green-700 hover:bg-green-100"
                >
                  مسح كود آخر
                </Button>
                <Button
                  onClick={handleClose}
                  size="sm"
                  className="bg-green-600 hover:bg-green-700"
                >
                  إنهاء المسح
                </Button>
              </div>
            </div>
          )}

          {/* Camera Scanner */}
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900">Scanner avec la caméra</h4>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              {isScanning ? (
                <div className="space-y-4">
                  <div className="animate-pulse">
                    <Camera className="h-16 w-16 text-blue-500 mx-auto" />
                  </div>
                  <p className="text-sm text-gray-600">Recherche du code-barres en cours...</p>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-blue-600 h-2 rounded-full animate-pulse" style={{ width: '60%' }}></div>
                  </div>
                  <Button
                    onClick={stopScanning}
                    variant="outline"
                    className="gap-2"
                  >
                    <X className="h-4 w-4" />
                    إيقاف المسح
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <QrCode className="h-16 w-16 text-gray-400 mx-auto" />
                  <p className="text-sm text-gray-600">Cliquez pour commencer le scan du code-barres</p>
                  <Button
                    onClick={startScanning}
                    className="gap-2 bg-gradient-to-r from-blue-600 to-orange-600 hover:from-blue-700 hover:to-orange-700"
                    disabled={scanResult === 'success'}
                  >
                    <Camera className="h-4 w-4" />
                    Commencer le scan
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Manual Input */}
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900">Saisie manuelle</h4>
            <form onSubmit={handleManualSubmit} className="flex gap-2">
              <Input
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                placeholder="Entrez le code de commande..."
                className="flex-1"
                disabled={isScanning}
              />
              <Button 
                type="submit" 
                variant="outline" 
                disabled={isScanning || !manualCode.trim()}
              >
                Rechercher
              </Button>
            </form>
          </div>

          {/* Instructions */}
          <div className="bg-amber-50 p-4 rounded-lg">
            <h5 className="font-medium text-amber-900 mb-2">Instructions :</h5>
            <ul className="text-sm text-amber-800 space-y-1">
              <li>• Dirigez la caméra vers le code-barres</li>
              <li>• Assurez-vous que l'éclairage est suffisant</li>
              <li>• Vous pouvez saisir le code manuellement si le scan ne fonctionne pas</li>
              <li>• بعد العثور على الكود، يمكنك الاستمرار في المسح أو إنهاء العملية</li>
            </ul>
          </div>
        </div>

        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={handleClose}
          >
            Fermer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BarcodeScanner;
