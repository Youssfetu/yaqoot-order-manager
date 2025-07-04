
import React, { useState } from 'react';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Download, Receipt, Percent, DollarSign, ChevronRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface MenuDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  commission: number;
  onCommissionChange: (value: number) => void;
}

const MenuDrawer: React.FC<MenuDrawerProps> = ({ 
  isOpen, 
  onClose, 
  commission, 
  onCommissionChange 
}) => {
  const [tempCommission, setTempCommission] = useState(commission);
  const { toast } = useToast();

  const handleSaveCommission = () => {
    onCommissionChange(tempCommission);
    toast({
      title: 'تم حفظ الإعدادات',
      description: 'تم تحديث العمولة بنجاح',
    });
  };

  const handleDownloadExcel = () => {
    toast({
      title: 'تحميل Excel',
      description: 'سيتم تحميل الطلبيات كملف Excel قريباً',
    });
  };

  const handleGenerateInvoice = () => {
    toast({
      title: 'إنشاء فاتورة',
      description: 'سيتم إنشاء الفاتورة قريباً',
    });
  };

  // حساب نسبة التوصيل تلقائياً (مثال)
  const deliveryPercentage = 15;

  return (
    <Drawer open={isOpen} onOpenChange={onClose}>
      <DrawerContent className="max-h-[85vh]">
        <DrawerHeader className="text-center border-b pb-4">
          <DrawerTitle className="text-xl font-bold text-gray-800">الإعدادات</DrawerTitle>
        </DrawerHeader>

        <div className="px-4 py-6 space-y-4">
          {/* Commission Settings */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="flex items-center justify-between p-4 hover:bg-gray-50 cursor-pointer">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <DollarSign className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">العمولة</h3>
                  <p className="text-sm text-gray-500">{commission} ريال سعودي</p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-gray-400" />
            </div>
            
            <div className="px-4 pb-4 space-y-3">
              <Input
                type="number"
                value={tempCommission}
                onChange={(e) => setTempCommission(Number(e.target.value))}
                placeholder="أدخل قيمة العمولة"
                className="text-right"
              />
              <Button 
                onClick={handleSaveCommission} 
                className="w-full bg-blue-600 hover:bg-blue-700"
                size="sm"
              >
                حفظ التغييرات
              </Button>
            </div>
          </div>

          {/* Delivery Percentage */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <Percent className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">نسبة التوصيل</h3>
                  <p className="text-sm text-gray-500">{deliveryPercentage}% محسوبة تلقائياً</p>
                </div>
              </div>
              <span className="text-lg font-semibold text-green-600">{deliveryPercentage}%</span>
            </div>
          </div>

          {/* Generate Invoice */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div 
              className="flex items-center justify-between p-4 hover:bg-gray-50 cursor-pointer"
              onClick={handleGenerateInvoice}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                  <Receipt className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">إنشاء فاتورة</h3>
                  <p className="text-sm text-gray-500">إنشاء فاتورة للطلبيات</p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-gray-400" />
            </div>
          </div>

          {/* Download Excel */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div 
              className="flex items-center justify-between p-4 hover:bg-gray-50 cursor-pointer"
              onClick={handleDownloadExcel}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                  <Download className="h-5 w-5 text-gray-600" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">تحميل Excel</h3>
                  <p className="text-sm text-gray-500">تحميل الطلبيات كملف Excel</p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-gray-400" />
            </div>
          </div>
        </div>

        <DrawerFooter className="border-t pt-4">
          <Button variant="outline" onClick={onClose} className="w-full">
            إغلاق
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};

export default MenuDrawer;
