
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
  const [deliveryPercentage, setDeliveryPercentage] = useState(15);
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

  return (
    <Drawer open={isOpen} onOpenChange={onClose}>
      <DrawerContent className="max-h-[80vh]">
        <DrawerHeader className="text-center">
          <DrawerTitle>إعدادات التطبيق</DrawerTitle>
        </DrawerHeader>

        <div className="px-4 space-y-6">
          {/* Commission Settings */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-blue-600" />
              <Label className="text-lg font-medium">إعدادات العمولة</Label>
            </div>
            <div className="space-y-2">
              <Label htmlFor="commission">العمولة (ريال)</Label>
              <Input
                id="commission"
                type="number"
                value={tempCommission}
                onChange={(e) => setTempCommission(Number(e.target.value))}
                placeholder="أدخل قيمة العمولة"
                className="text-right"
              />
            </div>
            <Button onClick={handleSaveCommission} className="w-full">
              حفظ العمولة
            </Button>
          </div>

          <Separator />

          {/* Delivery Percentage */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Percent className="h-5 w-5 text-green-600" />
              <Label className="text-lg font-medium">نسبة التوصيل</Label>
            </div>
            <div className="space-y-2">
              <Label htmlFor="delivery">النسبة المئوية للتوصيل (%)</Label>
              <Input
                id="delivery"
                type="number"
                value={deliveryPercentage}
                onChange={(e) => setDeliveryPercentage(Number(e.target.value))}
                placeholder="أدخل نسبة التوصيل"
                className="text-right"
              />
            </div>
          </div>

          <Separator />

          {/* Actions */}
          <div className="space-y-3">
            <Label className="text-lg font-medium">الإجراءات</Label>
            
            <Button 
              onClick={handleGenerateInvoice} 
              className="w-full flex items-center gap-2"
              variant="outline"
            >
              <Receipt className="h-4 w-4" />
              إنشاء فاتورة
            </Button>

            <Button 
              onClick={handleDownloadExcel} 
              className="w-full flex items-center gap-2"
              variant="outline"
            >
              <Download className="h-4 w-4" />
              تحميل الطلبيات (Excel)
            </Button>
          </div>
        </div>

        <DrawerFooter>
          <Button variant="outline" onClick={onClose}>
            إغلاق
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};

export default MenuDrawer;
