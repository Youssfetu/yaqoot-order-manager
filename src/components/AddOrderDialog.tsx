
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import type { Order } from '@/pages/Index';

interface AddOrderDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (order: Partial<Order>) => void;
}

const AddOrderDialog: React.FC<AddOrderDialogProps> = ({ isOpen, onClose, onAdd }) => {
  const [formData, setFormData] = useState({
    code: '',
    vendeur: '',
    numero: '',
    prix: '',
    statut: 'جديد',
    commentaire: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.code || !formData.vendeur || !formData.prix) {
      return;
    }

    onAdd({
      ...formData,
      prix: parseFloat(formData.prix) || 0
    });

    // Reset form
    setFormData({
      code: '',
      vendeur: '',
      numero: '',
      prix: '',
      statut: 'جديد',
      commentaire: ''
    });

    onClose();
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle>إضافة طلبية جديدة</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="code">كود الطلبية *</Label>
              <Input
                id="code"
                value={formData.code}
                onChange={(e) => handleInputChange('code', e.target.value)}
                placeholder="CMD001"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="vendeur">اسم العميل/الموزع *</Label>
              <Input
                id="vendeur"
                value={formData.vendeur}
                onChange={(e) => handleInputChange('vendeur', e.target.value)}
                placeholder="أحمد محمد"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="numero">رقم الهاتف</Label>
              <Input
                id="numero"
                value={formData.numero}
                onChange={(e) => handleInputChange('numero', e.target.value)}
                placeholder="123456789"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="prix">السعر (د.م) *</Label>
              <Input
                id="prix"
                type="number"
                step="0.01"
                value={formData.prix}
                onChange={(e) => handleInputChange('prix', e.target.value)}
                placeholder="250.00"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="statut">حالة الطلبية</Label>
            <Select
              value={formData.statut}
              onValueChange={(value) => handleInputChange('statut', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="جديد">جديد</SelectItem>
                <SelectItem value="مؤكد">مؤكد</SelectItem>
                <SelectItem value="قيد المعالجة">قيد المعالجة</SelectItem>
                <SelectItem value="ألغيت">ألغيت</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="commentaire">التعليق</Label>
            <Textarea
              id="commentaire"
              value={formData.commentaire}
              onChange={(e) => handleInputChange('commentaire', e.target.value)}
              placeholder="ملاحظات إضافية..."
              rows={3}
            />
          </div>

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              إلغاء
            </Button>
            <Button 
              type="submit"
              className="bg-gradient-to-r from-blue-600 to-orange-600 hover:from-blue-700 hover:to-orange-700"
            >
              إضافة الطلبية
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddOrderDialog;
