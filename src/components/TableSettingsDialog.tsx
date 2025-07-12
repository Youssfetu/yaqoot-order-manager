import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Settings, Type, AlignLeft, AlignCenter, AlignRight } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface TableSettings {
  columnVisibility: {
    code: boolean;
    destination: boolean;
    phone: boolean;
    price: boolean;
    comment: boolean;
    status: boolean;
  };
  fontSize: number;
  fontWeight: 'normal' | 'bold' | 'light';
  textAlignment: {
    code: 'left' | 'center' | 'right';
    phone: 'left' | 'center' | 'right';
    price: 'left' | 'center' | 'right';
    comment: 'left' | 'center' | 'right';
  };
}

interface TableSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  settings: TableSettings;
  onSettingsChange: (settings: TableSettings) => void;
}

const TableSettingsDialog: React.FC<TableSettingsDialogProps> = ({
  open,
  onOpenChange,
  settings,
  onSettingsChange,
}) => {
  const updateColumnVisibility = (column: string, visible: boolean) => {
    onSettingsChange({
      ...settings,
      columnVisibility: {
        ...settings.columnVisibility,
        [column]: visible,
      },
    });
  };

  const updateFontSize = (fontSize: number) => {
    onSettingsChange({
      ...settings,
      fontSize,
    });
  };

  const updateFontWeight = (fontWeight: 'normal' | 'bold' | 'light') => {
    onSettingsChange({
      ...settings,
      fontWeight,
    });
  };

  const updateTextAlignment = (column: string, alignment: 'left' | 'center' | 'right') => {
    onSettingsChange({
      ...settings,
      textAlignment: {
        ...settings.textAlignment,
        [column]: alignment,
      },
    });
  };

  const getAlignmentIcon = (alignment: string) => {
    switch (alignment) {
      case 'left':
        return <AlignLeft className="h-4 w-4" />;
      case 'center':
        return <AlignCenter className="h-4 w-4" />;
      case 'right':
        return <AlignRight className="h-4 w-4" />;
      default:
        return <AlignLeft className="h-4 w-4" />;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm mx-auto max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-center">
            <Settings className="h-5 w-5" />
            إعدادات الجدول
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-2">
          {/* Column Visibility */}
          <div className="bg-gray-50 rounded-lg p-3">
            <h3 className="text-sm font-medium mb-2 text-center">عرض الأعمدة</h3>
            <div className="space-y-2">
              {[
                { key: 'code', label: 'الكود' },
                { key: 'destination', label: 'الوجهة' },
                { key: 'phone', label: 'رقم الهاتف' },
                { key: 'price', label: 'الثمن' },
                { key: 'comment', label: 'التعليق' },
                { key: 'status', label: 'الحالة' },
              ].map((column) => (
                <div key={column.key} className="flex items-center justify-between py-1">
                  <Label htmlFor={column.key} className="text-sm">{column.label}</Label>
                  <Switch
                    id={column.key}
                    checked={settings.columnVisibility[column.key as keyof typeof settings.columnVisibility]}
                    onCheckedChange={(checked) => updateColumnVisibility(column.key, checked)}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Font Size */}
          <div className="bg-gray-50 rounded-lg p-3">
            <h3 className="text-sm font-medium mb-2 text-center">حجم الخط</h3>
            <Select value={settings.fontSize.toString()} onValueChange={(value) => updateFontSize(Number(value))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="12">12</SelectItem>
                <SelectItem value="14">14</SelectItem>
                <SelectItem value="16">16</SelectItem>
                <SelectItem value="18">18</SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="24">24</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Font Weight */}
          <div className="bg-gray-50 rounded-lg p-3">
            <h3 className="text-sm font-medium mb-2 text-center">سمك الخط</h3>
            <Select value={settings.fontWeight} onValueChange={updateFontWeight}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">رقيق</SelectItem>
                <SelectItem value="normal">عادي</SelectItem>
                <SelectItem value="bold">عريض</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Text Alignment for Editable Columns */}
          <div className="bg-gray-50 rounded-lg p-3">
            <h3 className="text-sm font-medium mb-2 text-center">محاذاة النص</h3>
            <div className="space-y-2">
              {[
                { key: 'code', label: 'الكود' },
                { key: 'phone', label: 'رقم الهاتف' },
                { key: 'price', label: 'الثمن' },
                { key: 'comment', label: 'التعليق' },
              ].map((column) => (
                <div key={column.key} className="flex items-center justify-between py-1">
                  <Label className="text-sm">{column.label}</Label>
                  <div className="flex gap-1 bg-white rounded border p-1">
                    {['left', 'center', 'right'].map((alignment) => (
                      <Button
                        key={alignment}
                        variant={settings.textAlignment[column.key as keyof typeof settings.textAlignment] === alignment ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => updateTextAlignment(column.key, alignment as 'left' | 'center' | 'right')}
                        className="p-1.5 w-8 h-8"
                      >
                        {getAlignmentIcon(alignment)}
                      </Button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {/* Close Button */}
        <div className="pt-3 border-t">
          <Button 
            onClick={() => onOpenChange(false)} 
            className="w-full" 
            variant="outline"
          >
            إغلاق
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TableSettingsDialog;