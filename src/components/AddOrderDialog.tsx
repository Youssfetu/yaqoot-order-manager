
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
      <DialogContent className="sm:max-w-lg rounded-2xl border-0 shadow-xl bg-background">
        <DialogHeader className="text-center px-6 pt-8 pb-6">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-50 flex items-center justify-center">
            <svg className="w-8 h-8 text-green-600" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2v20"/>
              <path d="m5 9 7 7 7-7"/>
            </svg>
          </div>
          <DialogTitle className="text-xl font-bold text-foreground mb-2">{t('add_new_order')}</DialogTitle>
          <p className="text-sm text-muted-foreground">
            أضف طلبية جديدة إلى النظام
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 px-6">
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

          <DialogFooter className="flex flex-col sm:flex-row gap-3 px-6 pb-6 pt-6 border-t bg-muted/30">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
              className="w-full sm:w-auto bg-muted hover:bg-muted/80 text-muted-foreground border-0 rounded-xl font-medium py-4 px-6 text-base"
            >
              {t('cancel')}
            </Button>
            <Button 
              type="submit"
              className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white border-0 rounded-xl font-medium py-4 px-6 text-base shadow-lg"
            >
              <span className="flex items-center justify-center gap-2">
                <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2v20"/>
                  <path d="m5 9 7 7 7-7"/>
                </svg>
                {t('add_order')}
              </span>
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddOrderDialog;
