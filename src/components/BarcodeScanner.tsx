import React, { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { QrCode, Camera, X, AlertCircle } from 'lucide-react';

interface BarcodeScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (code: string) => string;
}

const BarcodeScanner: React.FC<BarcodeScannerProps> = ({ isOpen, onClose, onScan }) => {
  const [manualCode, setManualCode] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [cameraError, setCameraError] = useState<string>('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleScanResult = (code: string) => {
    console.log('Scanned code:', code);
    onScan(code);
    stopScanning();
    onClose();
  };

  const handleManualScanResult = (code: string) => {
    console.log('Manual code:', code);
    onScan(code);
    setManualCode('');
    onClose();
  };

  const startCamera = async () => {
    try {
      setCameraError('');
      setIsScanning(true);

      const constraints = {
        video: {
          facingMode: 'environment',
          width: { ideal: 640 },
          height: { ideal: 480 }
        }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        
        // بدء المسح باستخدام ZXing
        startZXingScanning();
      }
    } catch (error) {
      console.error('Camera error:', error);
      setIsScanning(false);
      
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          setCameraError('تم رفض الإذن للوصول إلى الكاميرا. يرجى السماح بالوصول.');
        } else if (error.name === 'NotFoundError') {
          setCameraError('لم يتم العثور على كاميرا في هذا الجهاز.');
        } else {
          setCameraError('خطأ في الوصول إلى الكاميرا: ' + error.message);
        }
      }
    }
  };

  const startZXingScanning = async () => {
    try {
      // تحميل ZXing بشكل ديناميكي
      const { BrowserMultiFormatReader } = await import('@zxing/library');
      const codeReader = new BrowserMultiFormatReader();
      
      if (videoRef.current) {
        codeReader.decodeFromVideoDevice(undefined, videoRef.current, (result, error) => {
          if (result) {
            handleScanResult(result.getText());
          }
          // تجاهل أخطاء عدم الوجود
        });
      }
    } catch (error) {
      console.error('ZXing error:', error);
      setCameraError('خطأ في مكتبة المسح. جرب الإدخال اليدوي.');
    }
  };

  const stopScanning = () => {
    setIsScanning(false);
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
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
          <DialogTitle className="text-right">مسح الكود الشريطي</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Manual Input - الأولوية للإدخال اليدوي */}
          <div className="space-y-4">
            <h4 className="font-medium text-right">إدخال يدوي</h4>
            <form onSubmit={handleManualSubmit} className="flex gap-2">
              <Button 
                type="submit" 
                variant="outline" 
                disabled={!manualCode.trim()}
                className="px-6"
              >
                بحث
              </Button>
              <Input
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                placeholder="أدخل كود الطلبية..."
                className="flex-1 text-right"
                autoComplete="off"
                inputMode="text"
                dir="rtl"
              />
            </form>
          </div>

          {/* Camera Scanner */}
          <div className="space-y-4">
            <h4 className="font-medium text-right">مسح بالكاميرا</h4>
            
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
                  
                  <canvas
                    ref={canvasRef}
                    className="hidden"
                  />
                  
                  {/* إطار المسح */}
                  <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-48 h-32 border-2 border-green-400 rounded-lg">
                      <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-green-400"></div>
                      <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-green-400"></div>
                      <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-green-400"></div>
                      <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-green-400"></div>
                    </div>
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
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600 font-medium">مسح الكود الشريطي</p>
                    <p className="text-xs text-gray-500">وجه الكاميرا نحو الكود</p>
                  </div>
                  <Button
                    onClick={startCamera}
                    className="gap-2"
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
                  <div className="text-right flex-1">
                    <h5 className="font-medium text-red-900 mb-1">خطأ في الكاميرا</h5>
                    <p className="text-sm text-red-800">{cameraError}</p>
                    <p className="text-xs text-red-600 mt-2">يمكنك استخدام الإدخال اليدوي بدلاً من ذلك</p>
                  </div>
                </div>
              </div>
            )}
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