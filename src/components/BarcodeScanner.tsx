import React, { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { QrCode, Camera, X, AlertCircle } from 'lucide-react';
import { BrowserMultiFormatReader, NotFoundException } from '@zxing/library';

interface BarcodeScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (code: string) => string;
}

const BarcodeScanner: React.FC<BarcodeScannerProps> = ({ isOpen, onClose, onScan }) => {
  const [manualCode, setManualCode] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [cameraError, setCameraError] = useState<string>('');
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);

  const playSound = (result: string) => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      if (result === 'success') {
        // صوت النجاح - نغمة بيب إيجابية
        oscillator.type = 'square';
        oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
        oscillator.frequency.setValueAtTime(1000, audioContext.currentTime + 0.1);
        oscillator.frequency.setValueAtTime(1200, audioContext.currentTime + 0.2);
        oscillator.frequency.setValueAtTime(1500, audioContext.currentTime + 0.3);
        gainNode.gain.setValueAtTime(1.0, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.8);
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.8);
      } else if (result === 'not-found') {
        // صوت عدم الوجود - نغمة خطأ حادة
        oscillator.type = 'sawtooth';
        oscillator.frequency.setValueAtTime(400, audioContext.currentTime);
        oscillator.frequency.setValueAtTime(350, audioContext.currentTime + 0.1);
        oscillator.frequency.setValueAtTime(300, audioContext.currentTime + 0.2);
        oscillator.frequency.setValueAtTime(250, audioContext.currentTime + 0.3);
        oscillator.frequency.setValueAtTime(200, audioContext.currentTime + 0.4);
        gainNode.gain.setValueAtTime(1.0, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 1.2);
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 1.2);
      } else {
        // صوت التحذير - صوت "برن" كلاسيكي
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
        oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1);
        oscillator.frequency.setValueAtTime(800, audioContext.currentTime + 0.2);
        oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.3);
        oscillator.frequency.setValueAtTime(800, audioContext.currentTime + 0.4);
        oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.5);
        gainNode.gain.setValueAtTime(0.8, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.8);
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.8);
      }
    } catch (error) {
      console.log('Audio not supported');
    }
  };

  const handleCameraScanResult = (code: string) => {
    const result = onScan(code);
    playSound(result);
    stopScanning();
    onClose();
  };

  const handleManualScanResult = (code: string) => {
    const result = onScan(code);
    playSound(result);
    setManualCode('');
  };

  const startCamera = async () => {
    try {
      setCameraError('');
      setIsScanning(true);

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment'
        }
      });

      streamRef.current = stream;
      setHasPermission(true);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();

        if (!readerRef.current) {
          readerRef.current = new BrowserMultiFormatReader();
        }

        try {
          const result = await readerRef.current.decodeFromVideoDevice(
            undefined,
            videoRef.current,
            (result, error) => {
              if (result) {
                const scannedCode = result.getText();
                console.log('Barcode scanned:', scannedCode);
                handleCameraScanResult(scannedCode);
              }
              if (error && !(error instanceof NotFoundException)) {
                console.error('Scanning error:', error);
              }
            }
          );
        } catch (scanError) {
          console.error('Scan error:', scanError);
          setCameraError('خطأ في بدء المسح الضوئي');
        }
      }
    } catch (error) {
      console.error('Camera error:', error);
      setHasPermission(false);
      setIsScanning(false);
      
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          setCameraError('تم رفض الإذن للوصول إلى الكاميرا. يرجى السماح بالوصول إلى الكاميرا في إعدادات المتصفح.');
        } else if (error.name === 'NotFoundError') {
          setCameraError('لم يتم العثور على كاميرا في هذا الجهاز.');
        } else {
          setCameraError('خطأ في الوصول إلى الكاميرا: ' + error.message);
        }
      } else {
        setCameraError('خطأ غير معروف في الوصول إلى الكاميرا');
      }
    }
  };

  const stopScanning = () => {
    setIsScanning(false);
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    if (readerRef.current) {
      readerRef.current.reset();
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualCode.trim()) {
      handleManualScanResult(manualCode.trim());
    }
  };

  const handleClose = () => {
    stopScanning();
    setManualCode('');
    setCameraError('');
    onClose();
  };

  useEffect(() => {
    return () => {
      stopScanning();
    };
  }, []);

  useEffect(() => {
    if (!isOpen) {
      stopScanning();
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>مسح الكود الشريطي</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Camera Scanner */}
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900">مسح بالكاميرا</h4>
            
            <div className="border-2 border-dashed border-gray-300 rounded-lg overflow-hidden">
              {isScanning ? (
                <div className="relative">
                  <video
                    ref={videoRef}
                    className="w-full h-64 object-cover bg-black"
                    autoPlay
                    muted
                    playsInline
                  />
                  <div className="absolute inset-0 border-2 border-blue-500 border-dashed opacity-70 pointer-events-none">
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-48 h-32 border-2 border-red-500"></div>
                  </div>
                  <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
                    <Button
                      onClick={stopScanning}
                      variant="destructive"
                      size="sm"
                      className="gap-2"
                    >
                      <X className="h-4 w-4" />
                      إيقاف المسح
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center space-y-4">
                  <QrCode className="h-16 w-16 text-gray-400 mx-auto" />
                  <p className="text-sm text-gray-600">اضغط لبدء مسح الكود الشريطي</p>
                  <Button
                    onClick={startCamera}
                    className="gap-2 bg-gradient-to-r from-blue-600 to-orange-600 hover:from-blue-700 hover:to-orange-700"
                  >
                    <Camera className="h-4 w-4" />
                    بدء المسح
                  </Button>
                </div>
              )}
            </div>

            {/* Error Message */}
            {cameraError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <h5 className="font-medium text-red-900 mb-1">خطأ في الكاميرا</h5>
                    <p className="text-sm text-red-800">{cameraError}</p>
                  </div>
                </div>
              </div>
            )}
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
                disabled={isScanning}
              />
              <Button 
                type="submit" 
                variant="outline" 
                disabled={isScanning || !manualCode.trim()}
              >
                بحث
              </Button>
            </form>
          </div>
        </div>

        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={handleClose}
          >
            إغلاق
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BarcodeScanner;
