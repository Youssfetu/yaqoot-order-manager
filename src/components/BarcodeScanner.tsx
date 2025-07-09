import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { QrCode, Camera, X, AlertCircle, Zap, ScanLine } from 'lucide-react';
import { BrowserMultiFormatReader, NotFoundException, DecodeHintType, BarcodeFormat } from '@zxing/library';

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
  const [scanCount, setScanCount] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);
  const scanIntervalRef = useRef<number | null>(null);
  const lastScanTimeRef = useRef<number>(0);

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

  const handleCameraScanResult = useCallback((code: string) => {
    const now = Date.now();
    if (now - lastScanTimeRef.current < 500) return; // منع المسح المزدوج
    
    lastScanTimeRef.current = now;
    setIsProcessing(true);
    
    setTimeout(() => {
      const result = onScan(code);
      playSound(result);
      setIsProcessing(false);
      stopScanning();
      onClose();
    }, 100);
  }, [onScan, onClose]);

  const handleManualScanResult = (code: string) => {
    const result = onScan(code);
    playSound(result);
    setManualCode('');
  };

  const startCamera = async () => {
    try {
      setCameraError('');
      setIsScanning(true);
      setScanCount(0);

      // إعدادات متقدمة للكاميرا للحصول على أفضل جودة وسرعة
      const constraints = {
        video: {
          facingMode: 'environment',
          width: { ideal: 1920, min: 640 },
          height: { ideal: 1080, min: 480 },
          focusMode: 'continuous',
          exposureMode: 'continuous',
          whiteBalanceMode: 'continuous',
          frameRate: { ideal: 30, min: 15 }
        }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      setHasPermission(true);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();

        if (!readerRef.current) {
          readerRef.current = new BrowserMultiFormatReader();
          
          // إعداد تحسينات المسح للكودات الطويلة والصغيرة
          const hints = new Map();
          hints.set(DecodeHintType.POSSIBLE_FORMATS, [
            BarcodeFormat.QR_CODE,
            BarcodeFormat.CODE_128,
            BarcodeFormat.CODE_39,
            BarcodeFormat.CODE_93,
            BarcodeFormat.CODABAR,
            BarcodeFormat.EAN_13,
            BarcodeFormat.EAN_8,
            BarcodeFormat.UPC_A,
            BarcodeFormat.UPC_E,
            BarcodeFormat.DATA_MATRIX,
            BarcodeFormat.PDF_417,
            BarcodeFormat.AZTEC
          ]);
          hints.set(DecodeHintType.TRY_HARDER, true);
          hints.set(DecodeHintType.PURE_BARCODE, false);
          
          readerRef.current.hints = hints;
        }

        // مسح متطور ومحسن للسرعة باستخدام ZXing المباشر
        const startScanning = () => {
          if (!videoRef.current || !readerRef.current || !isScanning) return;

          scanIntervalRef.current = window.setInterval(async () => {
            if (!videoRef.current || !readerRef.current || !isScanning || isProcessing) return;

            setScanCount(prev => prev + 1);
            
            try {
              // استخدام المسح المباشر من الفيديو مع تحسينات متعددة
              const result = await readerRef.current.decodeOnceFromVideoDevice(undefined, videoRef.current);
              
              if (result) {
                const scannedCode = result.getText();
                console.log('Barcode scanned:', scannedCode);
                handleCameraScanResult(scannedCode);
                return;
              }
            } catch (error) {
              // جربة مسح بدقة أقل للكودات الصغيرة
              try {
                const canvas = document.createElement('canvas');
                const context = canvas.getContext('2d');
                const video = videoRef.current;
                
                if (context && video && video.videoWidth > 0 && video.videoHeight > 0) {
                  // مسح بدقات مختلفة
                  const resolutions = [
                    { width: video.videoWidth, height: video.videoHeight },
                    { width: video.videoWidth * 0.8, height: video.videoHeight * 0.8 },
                    { width: video.videoWidth * 1.2, height: video.videoHeight * 1.2 },
                    { width: video.videoWidth * 0.6, height: video.videoHeight * 0.6 }
                  ];

                  for (const res of resolutions) {
                    canvas.width = res.width;
                    canvas.height = res.height;
                    
                    // تحسين الصورة للمسح
                    context.filter = 'contrast(150%) brightness(120%)';
                    context.drawImage(video, 0, 0, res.width, res.height);
                    
                    try {
                      // تحويل Canvas إلى image URL ثم مسحه
                      const dataUrl = canvas.toDataURL('image/png');
                      const img = new Image();
                      img.onload = async () => {
                        try {
                          const result = await readerRef.current!.decodeFromImage(img);
                          if (result) {
                            const scannedCode = result.getText();
                            console.log('Barcode scanned with enhanced processing:', scannedCode);
                            handleCameraScanResult(scannedCode);
                          }
                        } catch (imgError) {
                          // تجاهل أخطاء الصورة الفردية
                        }
                      };
                      img.src = dataUrl;
                    } catch (resError) {
                      // تجاهل أخطاء الدقة الفردية
                    }
                  }
                }
              } catch (canvasError) {
                if (!(canvasError instanceof NotFoundException)) {
                  console.error('Canvas scanning error:', canvasError);
                }
              }
            }
          }, 150); // مسح كل 150 مللي ثانية للتوازن بين السرعة والأداء
        };

        // بدء المسح بعد تحميل الفيديو
        videoRef.current.addEventListener('loadedmetadata', startScanning);
        if (videoRef.current.readyState >= 2) {
          startScanning();
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
    setIsProcessing(false);
    setScanCount(0);
    
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    
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
                  
                  {/* شبكة المسح المتقدمة */}
                  <div className="absolute inset-0 pointer-events-none">
                    {/* الإطار الرئيسي */}
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-48 h-32 border-2 border-green-400 rounded-lg">
                      {/* الزوايا المتحركة */}
                      <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-green-400 rounded-tl-lg animate-pulse"></div>
                      <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-green-400 rounded-tr-lg animate-pulse"></div>
                      <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-green-400 rounded-bl-lg animate-pulse"></div>
                      <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-green-400 rounded-br-lg animate-pulse"></div>
                      
                      {/* خط المسح المتحرك */}
                      <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-green-400 to-transparent animate-pulse" 
                           style={{
                             animation: 'scanLine 2s linear infinite',
                             transformOrigin: 'center'
                           }}></div>
                    </div>
                    
                    {/* مناطق المسح الإضافية للكودات الطويلة والصغيرة */}
                    <div className="absolute top-4 left-4 right-4 h-16 border border-blue-300 border-dashed opacity-30 rounded"></div>
                    <div className="absolute bottom-4 left-4 right-4 h-16 border border-blue-300 border-dashed opacity-30 rounded"></div>
                    <div className="absolute top-4 bottom-4 left-4 w-16 border border-purple-300 border-dashed opacity-30 rounded"></div>
                    <div className="absolute top-4 bottom-4 right-4 w-16 border border-purple-300 border-dashed opacity-30 rounded"></div>
                  </div>

                  {/* معلومات المسح */}
                  <div className="absolute top-4 left-4 bg-black bg-opacity-70 text-white px-3 py-1 rounded-lg text-xs flex items-center gap-2">
                    {isProcessing ? (
                      <>
                        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                        معالجة...
                      </>
                    ) : (
                      <>
                        <Zap className="w-3 h-3 text-green-400" />
                        مسح سريع: {scanCount}
                      </>
                    )}
                  </div>
                  
                  <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
                    <Button
                      onClick={stopScanning}
                      variant="destructive"
                      size="sm"
                      className="gap-2 bg-red-600 hover:bg-red-700"
                    >
                      <X className="h-4 w-4" />
                      إيقاف المسح
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center space-y-4">
                  <div className="relative">
                    <QrCode className="h-16 w-16 text-gray-400 mx-auto" />
                    <ScanLine className="h-4 w-4 text-blue-500 absolute -bottom-1 left-1/2 transform -translate-x-1/2 animate-bounce" />
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600 font-medium">مسح فائق السرعة ومحسن</p>
                    <p className="text-xs text-gray-500">يدعم الكودات الطويلة والصغيرة جداً</p>
                  </div>
                  <Button
                    onClick={startCamera}
                    className="gap-2 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 shadow-lg"
                  >
                    <Zap className="h-4 w-4" />
                    بدء المسح السريع
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
        
        {/* إضافة CSS للحركة */}
        <style>{`
          @keyframes scanLine {
            0% { top: 0; }
            50% { top: 100%; }
            100% { top: 0; }
          }
        `}</style>
      </DialogContent>
    </Dialog>
  );
};

export default BarcodeScanner;
