
import React, { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { QrCode, Camera, X } from 'lucide-react';

interface BarcodeScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (code: string) => void;
}

const BarcodeScanner: React.FC<BarcodeScannerProps> = ({ isOpen, onClose, onScan }) => {
  const [manualCode, setManualCode] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const scanTimeoutRef = useRef<NodeJS.Timeout>();

  // دالة تشغيل الصوت
  const playSound = (success: boolean) => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      if (success) {
        // صوت نجاح - نوتتان متتاليتان صاعدتان
        oscillator.frequency.setValueAtTime(523, audioContext.currentTime); // C5
        oscillator.frequency.setValueAtTime(659, audioContext.currentTime + 0.1); // E5
        gainNode.gain.setValueAtTime(0.5, audioContext.currentTime); // زيادة مستوى الصوت من 0.3 إلى 0.5
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.3);
      } else {
        // صوت فشل - نوتتان متتاليتان هابطتان
        oscillator.frequency.setValueAtTime(330, audioContext.currentTime); // E4
        oscillator.frequency.setValueAtTime(262, audioContext.currentTime + 0.15); // C4
        gainNode.gain.setValueAtTime(0.5, audioContext.currentTime); // زيادة مستوى الصوت من 0.3 إلى 0.5
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4);
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.4);
      }
    } catch (error) {
      console.log('Audio not supported');
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualCode.trim()) {
      handleScanResult(manualCode.trim());
      setManualCode('');
    }
  };

  const handleScanResult = (code: string) => {
    onScan(code);
    const foundOrder = document.querySelector(`[data-code="${code}"]`);
    // تشغيل الصوت المناسب بناءً على وجود الكود
    playSound(!!foundOrder);
  };

  const startScanning = () => {
    setIsScanning(true);
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
    onClose();
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
              <li>• ستسمع صوت تأكيد عند العثور على الكود أو صوت تنبيه عند عدم وجوده</li>
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
