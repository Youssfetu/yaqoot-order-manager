
import React, { useState } from 'react';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Download, Receipt, Percent, DollarSign, ChevronRight, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { generateInvoicePDF, Order } from '@/utils/pdfGenerator';
import { exportOrdersToExcel } from '@/utils/excelExport';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

interface MenuDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  commission: number;
  onCommissionChange: (value: number) => void;
  totalOrders: number;
  deliveredOrders: number;
  archivedOrders: Order[];
  orders: Order[];
  onClearAllData: () => void;
}

const MenuDrawer: React.FC<MenuDrawerProps> = ({ 
  isOpen, 
  onClose, 
  commission, 
  onCommissionChange,
  totalOrders,
  deliveredOrders,
  archivedOrders,
  orders,
  onClearAllData
}) => {
  const [tempCommission, setTempCommission] = useState(commission);
  const { toast } = useToast();

  const handleSaveCommission = () => {
    onCommissionChange(tempCommission);
    toast({
      title: 'Paramètres sauvegardés',
      description: 'Commission mise à jour avec succès',
    });
  };

  const handleDownloadExcel = () => {
    try {
      const fileName = exportOrdersToExcel(orders, archivedOrders);
      toast({
        title: 'Excel téléchargé',
        description: `Le fichier ${fileName} a été téléchargé avec succès`,
      });
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Une erreur est survenue lors du téléchargement',
        variant: 'destructive'
      });
    }
  };

  const handleGenerateInvoice = () => {
    console.log('Generate invoice clicked');
    console.log('Archived orders:', archivedOrders);
    console.log('Commission:', commission);
    
    try {
      if (archivedOrders.length === 0) {
        console.log('No delivered orders found');
        toast({
          title: 'Aucune commande livrée',
          description: 'Il n\'y a pas de commandes livrées pour générer une facture',
          variant: 'destructive'
        });
        return;
      }

      console.log('Generating PDF...');
      const fileName = generateInvoicePDF(archivedOrders, commission);
      console.log('PDF generated successfully:', fileName);
      
      toast({
        title: 'Facture générée avec succès',
        description: `La facture ${fileName} a été téléchargée`,
      });
    } catch (error) {
      console.error('Error generating invoice:', error);
      toast({
        title: 'Erreur',
        description: 'Une erreur est survenue lors de la génération de la facture',
        variant: 'destructive'
      });
    }
  };

  const handleClearAllData = () => {
    onClearAllData();
    toast({
      title: 'Données supprimées',
      description: 'Toutes les commandes ont été supprimées avec succès',
    });
    onClose();
  };

  // Calcul automatique du pourcentage de livraison
  const deliveryPercentage = totalOrders > 0 ? Math.round((deliveredOrders / totalOrders) * 100) : 0;

  return (
    <Drawer open={isOpen} onOpenChange={onClose}>
      <DrawerContent className="max-h-[85vh]">
        <DrawerHeader className="text-center border-b pb-4">
          <DrawerTitle className="text-xl font-bold text-gray-800">Paramètres</DrawerTitle>
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
                  <h3 className="font-medium text-gray-900">Commission</h3>
                  <p className="text-sm text-gray-500">{commission}</p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-gray-400" />
            </div>
            
            <div className="px-4 pb-4 space-y-3">
              <Input
                type="number"
                value={tempCommission}
                onChange={(e) => setTempCommission(Number(e.target.value))}
                placeholder="Entrez la valeur de la commission"
                className="text-right"
              />
              <Button 
                onClick={handleSaveCommission} 
                className="w-full bg-blue-600 hover:bg-blue-700"
                size="sm"
              >
                Sauvegarder les modifications
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
                  <h3 className="font-medium text-gray-900">Pourcentage de livraison</h3>
                  <p className="text-sm text-gray-500">{deliveredOrders} sur {totalOrders} commandes livrées</p>
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
                  <h3 className="font-medium text-gray-900">Générer facture</h3>
                  <p className="text-sm text-gray-500">Créer une facture pour les commandes</p>
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
                  <h3 className="font-medium text-gray-900">Télécharger Excel</h3>
                  <p className="text-sm text-gray-500">Télécharger les commandes en fichier Excel</p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-gray-400" />
            </div>
          </div>

          {/* Clear All Data */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <div className="flex items-center justify-between p-4 hover:bg-gray-50 cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                      <Trash2 className="h-5 w-5 text-red-600" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">Effacer toutes les données</h3>
                      <p className="text-sm text-gray-500">Supprimer toutes les commandes</p>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-gray-400" />
                </div>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Cette action supprimera toutes les commandes (actives et archivées). 
                    Cette action ne peut pas être annulée. Les paramètres de commission seront conservés.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Annuler</AlertDialogCancel>
                  <AlertDialogAction onClick={handleClearAllData} className="bg-red-600 hover:bg-red-700">
                    Supprimer tout
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        <DrawerFooter className="border-t pt-4">
          <Button variant="outline" onClick={onClose} className="w-full">
            Fermer
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};

export default MenuDrawer;
