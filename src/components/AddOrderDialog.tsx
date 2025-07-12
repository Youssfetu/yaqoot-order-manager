
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useLanguage } from '@/contexts/LanguageContext';
import type { Order } from '@/pages/Index';

interface AddOrderDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (order: Partial<Order>) => void;
}

const AddOrderDialog: React.FC<AddOrderDialogProps> = ({ isOpen, onClose, onAdd }) => {
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    code: '',
    vendeur: '',
    numero: '',
    prix: '',
    statut: 'Nouveau',
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
      statut: 'Nouveau',
      commentaire: ''
    });

    onClose();
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('add_new_order')}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="code">{t('order_code')} *</Label>
              <Input
                id="code"
                value={formData.code}
                onChange={(e) => handleInputChange('code', e.target.value)}
                placeholder="CMD001"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="vendeur">{t('client_name')} *</Label>
              <Input
                id="vendeur"
                value={formData.vendeur}
                onChange={(e) => handleInputChange('vendeur', e.target.value)}
                placeholder="Ahmed Mohamed"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="numero">{t('phone_number')}</Label>
              <Input
                id="numero"
                value={formData.numero}
                onChange={(e) => handleInputChange('numero', e.target.value)}
                placeholder="123456789"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="prix">{t('order_price')} *</Label>
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
            <Label htmlFor="statut">{t('order_status')}</Label>
            <Select
              value={formData.statut}
              onValueChange={(value) => handleInputChange('statut', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white shadow-lg border border-gray-300 rounded-md z-50">
                <SelectItem value="Nouveau">{t('Nouveau')}</SelectItem>
                <SelectItem value="Confirmé">{t('Confirmé')}</SelectItem>
                <SelectItem value="En cours">{t('En cours')}</SelectItem>
                <SelectItem value="Annulé">{t('Annulé')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="commentaire">{t('order_comment')}</Label>
            <Textarea
              id="commentaire"
              value={formData.commentaire}
              onChange={(e) => handleInputChange('commentaire', e.target.value)}
              placeholder={t('write_comment')}
              rows={3}
            />
          </div>

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              {t('cancel')}
            </Button>
            <Button 
              type="submit"
              className="bg-gradient-to-r from-blue-600 to-orange-600 hover:from-blue-700 hover:to-orange-700"
            >
              {t('add_order')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddOrderDialog;
