import React, { useState, useRef, useEffect } from 'react';
import { Search, Plus, BarChart3, Upload, QrCode, Share2, Calculator, Menu, Package, Archive, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import InteractiveTable from '@/components/InteractiveTable';
import AddOrderDialog from '@/components/AddOrderDialog';
import UploadDialog from '@/components/UploadDialog';
import BarcodeScanner from '@/components/BarcodeScanner';
import OrderSummary from '@/components/OrderSummary';
import MenuDrawer from '@/components/MenuDrawer';
import ArchivedOrdersDialog from '@/components/ArchivedOrdersDialog';
import { useToast } from '@/hooks/use-toast';

export interface Order {
  id: string;
  code: string;
  vendeur: string;
  numero: string;
  prix: number;
  statut: string;
  commentaire: string;
  isScanned?: boolean;
}

const Index = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [archivedOrders, setArchivedOrders] = useState<Order[]>([]);

  const [searchTerm, setSearchTerm] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isArchivedDialogOpen, setIsArchivedDialogOpen] = useState(false);
  const [commission, setCommission] = useState(50);
  const [isMenuDrawerOpen, setIsMenuDrawerOpen] = useState(false);
  const { toast } = useToast();
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Focus search input when search opens
  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchOpen]);

  const handleAddOrder = (newOrder: Partial<Order>) => {
    const order: Order = {
      id: Date.now().toString(),
      code: newOrder.code || '',
      vendeur: newOrder.vendeur || '',
      numero: newOrder.numero || '',
      prix: newOrder.prix || 0,
      statut: newOrder.statut || 'Nouveau',
      commentaire: newOrder.commentaire || ''
    };
    setOrders([...orders, order]);
    toast({
      title: "Commande ajoutée",
      description: `La commande ${order.code} a été ajoutée avec succès`,
    });
  };

  const handleUpdateComment = (id: string, comment: string) => {
    setOrders(orders.map(order => 
      order.id === id ? { ...order, commentaire: comment } : order
    ));
  };

  const handleUpdateStatus = (id: string, status: string) => {
    // إذا تم تغيير الحالة إلى Livré، نقل الطلبية إلى الأرشيف
    if (status === 'Livré') {
      const orderToArchive = orders.find(order => order.id === id);
      if (orderToArchive) {
        const archivedOrder = { ...orderToArchive, statut: status };
        setArchivedOrders(prev => [...prev, archivedOrder]);
        setOrders(orders.filter(order => order.id !== id));
        toast({
          title: "Commande archivée",
          description: `La commande ${orderToArchive.code} a été déplacée vers l'archive`,
        });
        return;
      }
    }
    
    setOrders(orders.map(order => 
      order.id === id ? { ...order, statut: status } : order
    ));
    toast({
      title: "Statut mis à jour",
      description: `Le statut a été changé vers "${status}"`,
    });
  };

  const handleBarcodeScanned = (code: string) => {
    const foundOrder = orders.find(order => order.code === code);
    if (foundOrder) {
      setOrders(orders.map(order => 
        order.code === code ? { ...order, isScanned: true } : order
      ));
      
      return 'success';
    } else {
      return 'not-found';
    }
  };

  const handleFileUpload = (newOrders: Order[]) => {
    setOrders(prevOrders => [...prevOrders, ...newOrders]);
    toast({
      title: "تم تحميل الملف بنجاح",
      description: `تم إضافة ${newOrders.length} طلبية جديدة إلى ${orders.length} طلبية موجودة`,
    });
  };

  const handleSearchToggle = () => {
    setIsSearchOpen(!isSearchOpen);
    if (isSearchOpen) {
      setSearchTerm('');
    }
  };

  const handleSearchClear = () => {
    setSearchTerm('');
    setIsSearchOpen(false);
  };

  const filteredOrders = orders.filter(order =>
    order.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.vendeur.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.numero.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-white">
      {/* Android Style Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between mb-3">
            {/* Menu Icon */}
            <Button
              onClick={() => setIsMenuDrawerOpen(true)}
              variant="ghost"
              size="sm"
              className="p-2 hover:bg-gray-100 rounded-xl"
            >
              <Menu className="h-6 w-6 text-gray-600" />
            </Button>
            
            {/* Header Icons */}
            <div className="flex items-center gap-3">
              <Button
                onClick={() => setIsScannerOpen(true)}
                variant="ghost"
                size="sm"
                className="p-2 hover:bg-gray-100 rounded-xl"
              >
                <QrCode className="h-6 w-6 text-gray-600" />
              </Button>

              <Button
                onClick={() => setIsArchivedDialogOpen(true)}
                variant="ghost"
                size="sm"
                className="p-2 hover:bg-gray-100 rounded-xl"
              >
                <Archive className="h-6 w-6 text-gray-600" />
              </Button>

              {/* Search Button - Now Functional */}
              <Button
                variant="ghost"
                size="sm"
                className="p-2 hover:bg-gray-100 rounded-xl"
                onClick={handleSearchToggle}
              >
                <Search className="h-6 w-6 text-gray-600" />
              </Button>

              <Button
                onClick={() => setIsAddDialogOpen(true)}
                variant="ghost"
                size="sm"
                className="p-2 hover:bg-gray-100 rounded-xl"
              >
                <Plus className="h-6 w-6 text-gray-600" />
              </Button>

              <Button
                onClick={() => setIsUploadDialogOpen(true)}
                variant="ghost"
                size="sm"
                className="p-2 hover:bg-gray-100 rounded-xl"
              >
                <Upload className="h-6 w-6 text-gray-600" />
              </Button>

              <Button
                variant="ghost"
                size="sm"
                className="p-2 hover:bg-gray-100 rounded-xl"
                onClick={() => {
                  toast({
                    title: "Données exportées",
                    description: "Cette fonctionnalité sera développée prochainement",
                  });
                }}
              >
                <Share2 className="h-6 w-6 text-gray-600" />
              </Button>
            </div>
          </div>

          {/* Search Bar - Shows when search is active */}
          {isSearchOpen && (
            <div className="flex items-center gap-2 mt-2">
              <div className="flex-1 relative">
                <Input
                  ref={searchInputRef}
                  type="text"
                  placeholder="ابحث بالكود، العميل، أو الرقم..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pr-4 pl-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  dir="rtl"
                />
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              </div>
              <Button
                onClick={handleSearchClear}
                variant="ghost"
                size="sm"
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="h-4 w-4 text-gray-600" />
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className="px-0 py-0">
        {/* Interactive Table - Google Sheets Style */}
        <InteractiveTable
          orders={filteredOrders}
          onUpdateComment={handleUpdateComment}
          onUpdateStatus={handleUpdateStatus}
        />

        {/* Summary Cards - Now Below Table */}
        <div className="px-4 py-4">
          <OrderSummary orders={orders} commission={commission} />
        </div>
      </div>

      {/* Search Results Info */}
      {isSearchOpen && searchTerm && (
        <div className="px-4 py-2 bg-blue-50 border-t border-blue-200">
          <p className="text-sm text-blue-700" dir="rtl">
            تم العثور على {filteredOrders.length} طلبية من أصل {orders.length} طلبية
          </p>
        </div>
      )}

      <AddOrderDialog
        isOpen={isAddDialogOpen}
        onClose={() => setIsAddDialogOpen(false)}
        onAdd={handleAddOrder}
      />

      <UploadDialog
        isOpen={isUploadDialogOpen}
        onClose={() => setIsUploadDialogOpen(false)}
        onUpload={handleFileUpload}
      />

      <BarcodeScanner
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScan={handleBarcodeScanned}
      />

      <ArchivedOrdersDialog
        isOpen={isArchivedDialogOpen}
        onClose={() => setIsArchivedDialogOpen(false)}
        archivedOrders={archivedOrders}
      />

      <MenuDrawer
        isOpen={isMenuDrawerOpen}
        onClose={() => setIsMenuDrawerOpen(false)}
        commission={commission}
        onCommissionChange={setCommission}
      />
    </div>
  );
};

export default Index;
