import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Settings, Type, AlignLeft, AlignCenter, AlignRight } from 'lucide-react';

interface TableSettings {
  columnVisibility: {
    code: boolean;
    destination: boolean;
    phone: boolean;
    price: boolean;
    comment: boolean;
    status: boolean;
  };
  fontSize: 'small' | 'medium' | 'large';
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

  const updateFontSize = (fontSize: 'small' | 'medium' | 'large') => {
    onSettingsChange({
      ...settings,
      fontSize,
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
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            إعدادات الجدول
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Column Visibility */}
          <div>
            <h3 className="text-sm font-medium mb-3">عرض الأعمدة</h3>
            <div className="space-y-3">
              {[
                { key: 'code', label: 'الكود' },
                { key: 'destination', label: 'الوجهة' },
                { key: 'phone', label: 'رقم الهاتف' },
                { key: 'price', label: 'الثمن' },
                { key: 'comment', label: 'التعليق' },
                { key: 'status', label: 'الحالة' },
              ].map((column) => (
                <div key={column.key} className="flex items-center justify-between">
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
          <div>
            <h3 className="text-sm font-medium mb-3">حجم الخط</h3>
            <Select value={settings.fontSize} onValueChange={updateFontSize}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="small">صغير</SelectItem>
                <SelectItem value="medium">متوسط</SelectItem>
                <SelectItem value="large">كبير</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Text Alignment for Editable Columns */}
          <div>
            <h3 className="text-sm font-medium mb-3">محاذاة النص (للأعمدة القابلة للتحرير)</h3>
            <div className="space-y-3">
              {[
                { key: 'code', label: 'الكود' },
                { key: 'phone', label: 'رقم الهاتف' },
                { key: 'price', label: 'الثمن' },
                { key: 'comment', label: 'التعليق' },
              ].map((column) => (
                <div key={column.key} className="flex items-center justify-between">
                  <Label className="text-sm">{column.label}</Label>
                  <div className="flex gap-1">
                    {['left', 'center', 'right'].map((alignment) => (
                      <Button
                        key={alignment}
                        variant={settings.textAlignment[column.key as keyof typeof settings.textAlignment] === alignment ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => updateTextAlignment(column.key, alignment as 'left' | 'center' | 'right')}
                        className="p-2"
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
      </DialogContent>
    </Dialog>
  );
};

export default TableSettingsDialog;