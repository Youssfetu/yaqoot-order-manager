
import React, { useState } from 'react';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Download, Receipt, Percent, DollarSign } from 'lucide-react';
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
  const deliveryPercentage = 15; // هذه ستُحسب بناءً على الطلبيات المُوزعة

  return (
    <Drawer open={isOpen} onOpenChange={onClose}>
      <DrawerContent className="max-h-[85vh]">
        <DrawerHeader className="text-center border-b pb-4">
          <DrawerTitle className="text-xl font-bold text-gray-800">إعدادات التطبيق</DrawerTitle>
        </DrawerHeader>

        <div className="px-6 py-4 space-y-8">
          {/* Commission Settings */}
          <div className="bg-blue-50 rounded-lg p-4 space-y-4">
            <div className="flex items-center gap-3">
              <div className="bg-blue-600 p-2 rounded-lg">
                <DollarSign className="h-5 w-5 text-white" />
              </div>
              <Label className="text-lg font-semibold text-gray-800">إعدادات العمولة</Label>
            </div>
            <div className="space-y-3">
              <Label htmlFor="commission" className="text-sm text-gray-600">العمولة (ريال سعودي)</Label>
              <Input
                id="commission"
                type="number"
                value={tempCommission}
                onChange={(e) => setTempCommission(Number(e.target.value))}
                placeholder="أدخل قيمة العمولة"
                className="text-right text-lg font-medium"
              />
              <Button onClick={handleSaveCommission} className="w-full bg-blue-600 hover:bg-blue-700">
                حفظ العمولة
              </Button>
            </div>
          </div>

          {/* Delivery Percentage - Read Only */}
          <div className="bg-green-50 rounded-lg p-4 space-y-4">
            <div className="flex items-center gap-3">
              <div className="bg-green-600 p-2 rounded-lg">
                <Percent className="h-5 w-5 text-white" />
              </div>
              <Label className="text-lg font-semibold text-gray-800">نسبة التوصيل</Label>
            </div>
            <div className="space-y-3">
              <Label className="text-sm text-gray-600">النسبة المئوية للتوصيل (محسوبة تلقائياً)</Label>
              <div className="bg-gray-100 border border-gray-300 px-4 py-3 rounded-lg text-right">
                <span className="text-2xl font-bold text-green-600">{deliveryPercentage}%</span>
              </div>
              <p className="text-xs text-gray-500 text-center">
                تُحسب هذه النسبة تلقائياً حسب الطلبيات الموزعة
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-4">
            <Label className="text-lg font-semibold text-gray-800">الإجراءات</Label>
            
            <div className="grid grid-cols-1 gap-3">
              <Button 
                onClick={handleGenerateInvoice} 
                className="flex items-center justify-center gap-3 bg-orange-600 hover:bg-orange-700 text-white py-3"
                variant="default"
              >
                <Receipt className="h-5 w-5" />
                <span className="font-medium">إنشاء فاتورة</span>
              </Button>

              <Button 
                onClick={handleDownloadExcel} 
                className="flex items-center justify-center gap-3 bg-gray-600 hover:bg-gray-700 text-white py-3"
                variant="default"
              >
                <Download className="h-5 w-5" />
                <span className="font-medium">تحميل الطلبيات (Excel)</span>
              </Button>
            </div>
          </div>
        </div>

        <DrawerFooter className="border-t pt-4">
          <Button variant="outline" onClick={onClose} className="w-full py-3 text-lg">
            إغلاق
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};

export default MenuDrawer;
