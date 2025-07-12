import React, { useState, useRef, useEffect } from 'react';
import { Search, Plus, BarChart3, Upload, QrCode, Share2, Calculator, Menu, Package, Archive, X, Settings, SlidersHorizontal } from 'lucide-react';
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
import TableSettingsDialog from '@/components/TableSettingsDialog';

import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { exportOrdersToExcel } from '@/utils/excelExport';
import { useNavigate } from 'react-router-dom';

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
  const { t } = useLanguage();
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [archivedOrders, setArchivedOrders] = useState<Order[]>([]);

  const [searchTerm, setSearchTerm] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isArchivedDialogOpen, setIsArchivedDialogOpen] = useState(false);
  const [isTableSettingsOpen, setIsTableSettingsOpen] = useState(false);
  const [commission, setCommission] = useState(50);
  const [isMenuDrawerOpen, setIsMenuDrawerOpen] = useState(false);

  const [tableSettings, setTableSettings] = useState({
    columnVisibility: {
      code: true,
      destination: true,
      phone: true,
      price: true,
      comment: true,
      status: true,
    },
    fontSize: 14,
    fontWeight: 'normal' as 'normal' | 'bold' | 'light',
    textAlignment: {
      code: 'left' as 'left' | 'center' | 'right',
      phone: 'left' as 'left' | 'center' | 'right',
      price: 'left' as 'left' | 'center' | 'right',
      comment: 'left' as 'left' | 'center' | 'right',
    },
  });
  const { toast } = useToast();
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Focus search input when search opens
  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
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
      title: t('order_added'),
      description: `${t('order_added_desc')} ${order.code}`,
    });
  };

  const handleUpdateComment = (id: string, comment: string) => {
    setOrders(orders.map(order => 
      order.id === id ? { ...order, commentaire: comment } : order
    ));
  };

  const handleUpdatePhone = (id: string, phone: string) => {
    setOrders(orders.map(order => 
      order.id === id ? { ...order, numero: phone } : order
    ));
  };

  const handleUpdatePrice = (id: string, price: number) => {
    setOrders(orders.map(order => 
      order.id === id ? { ...order, prix: price } : order
    ));
  };

  const handleReorderOrders = (newOrders: Order[]) => {
    setOrders(newOrders);
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
          title: t('order_archived'),
          description: `${t('order_archived_desc')} ${orderToArchive.code}`,
        });
        return;
      }
    }
    
    setOrders(orders.map(order => 
      order.id === id ? { ...order, statut: status } : order
    ));
    toast({
      title: t('status_updated'),
      description: `${t('status_updated_desc')} "${status}"`,
    });
  };

  const handleBarcodeScanned = (code: string) => {
    console.log('Scanning for code:', code);
    const foundOrder = orders.find(order => order.code === code);
    if (foundOrder) {
      setOrders(orders.map(order => 
        order.code === code ? { ...order, isScanned: true } : order
      ));
      
      toast({
        title: t('order_found'),
        description: `${t('order_found_desc')} ${code}`,
      });
      
      return 'success';
    } else {
      toast({
        title: t('order_not_found'),
        description: `${t('order_not_found_desc')} ${code}`,
        variant: "destructive",
      });
      return 'not-found';
    }
  };

  const handleFileUpload = (newOrders: Order[]) => {
    setOrders(prevOrders => [...prevOrders, ...newOrders]);
    toast({
      title: t('file_uploaded_success'),
      description: `${t('file_uploaded_desc')} ${newOrders.length}`,
    });
  };

  const handleSearchToggle = () => {
    console.log('Search toggle clicked, current state:', isSearchOpen);
    setIsSearchOpen(!isSearchOpen);
    if (isSearchOpen) {
      setSearchTerm('');
    }
  };

  const handleSearchClear = () => {
    console.log('Search clear clicked');
    setSearchTerm('');
    setIsSearchOpen(false);
  };

  const handleShare = async () => {
    try {
      console.log('Share button clicked on mobile');
      
      // إذا كان هناك طلبيات، قم بتصدير ملف Excel
      if (orders.length > 0) {
        const fileName = exportOrdersToExcel(orders, archivedOrders);
        
        toast({
          title: t('export_success'),
          description: `${t('export_success_desc')} ${fileName}`,
        });
        
        return;
      }
      
      // إذا لم تكن هناك طلبيات، أظهر رسالة
      toast({
        title: t('no_orders'),
        description: t('no_orders_desc'),
        variant: "destructive"
      });
      
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      
      toast({
        title: t('export_error'),
        description: t('export_error_desc'),
        variant: "destructive"
      });
    }
  };

  const handleClearAllData = () => {
    setOrders([]);
    setArchivedOrders([]);
    toast({
      title: t('data_cleared'),
      description: t('data_cleared_desc'),
    });
  };

  // Helper function to sort orders - cancelled orders go to bottom
  const sortOrdersByStatus = (orders: Order[]) => {
    const cancelledStatuses = ['Annulé', 'Refusé', 'Hors zone', 'Pas de réponse'];
    
    return [...orders].sort((a, b) => {
      const aIsCancelled = cancelledStatuses.includes(a.statut);
      const bIsCancelled = cancelledStatuses.includes(b.statut);
      
      // If both are cancelled or both are not cancelled, maintain original order
      if (aIsCancelled === bIsCancelled) {
        return 0;
      }
      
      // If only 'a' is cancelled, it goes to bottom (return 1)
      // If only 'b' is cancelled, it goes to bottom (return -1)
      return aIsCancelled ? 1 : -1;
    });
  };

  const filteredOrders = orders.filter(order =>
    order.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.vendeur.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.numero.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Apply sorting to filtered orders
  const sortedFilteredOrders = sortOrdersByStatus(filteredOrders);

  console.log('Search state:', { isSearchOpen, searchTerm, filteredOrdersCount: filteredOrders.length, totalOrders: orders.length });

  // Redirect to auth if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>جاري التحميل...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect to auth page
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Android Style Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="px-2 sm:px-4 py-3">
          <div className="flex items-center justify-between mb-3">
            {/* Menu Icon and User Info */}
            <div className="flex items-center gap-2">
              <Button
                onClick={() => setIsMenuDrawerOpen(true)}
                variant="ghost"
                size="sm"
                className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-xl"
              >
                <Menu className="h-5 w-5 sm:h-6 sm:w-6 text-gray-600" />
              </Button>
              <span className="text-sm text-gray-600">
                مرحباً {user?.email}
              </span>
            </div>
            
            {/* Header Icons */}
            <div className="flex items-center gap-1 sm:gap-3">
              {/* Logout Button */}
              <Button
                onClick={signOut}
                variant="outline"
                size="sm"
                className="text-xs p-1.5 sm:p-2 hover:bg-red-50 border-red-200 text-red-600"
              >
                خروج
              </Button>
              {/* Table Settings - First on the left */}
              <Button
                onClick={() => setIsTableSettingsOpen(true)}
                variant="ghost"
                size="sm"
                className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-xl"
              >
                <SlidersHorizontal className="h-5 w-5 sm:h-6 sm:w-6 text-gray-600" />
              </Button>

              <Button
                onClick={() => setIsScannerOpen(true)}
                variant="ghost"
                size="sm"
                className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-xl"
              >
                <QrCode className="h-5 w-5 sm:h-6 sm:w-6 text-gray-600" />
              </Button>

              <Button
                onClick={() => setIsArchivedDialogOpen(true)}
                variant="ghost"
                size="sm"
                className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-xl"
              >
                <Archive className="h-5 w-5 sm:h-6 sm:w-6 text-gray-600" />
              </Button>


              {/* Search Button - Now Functional */}
              <Button
                variant="ghost"
                size="sm"
                className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-xl"
                onClick={handleSearchToggle}
              >
                <Search className="h-5 w-5 sm:h-6 sm:w-6 text-gray-600" />
              </Button>

              <Button
                onClick={() => setIsAddDialogOpen(true)}
                variant="ghost"
                size="sm"
                className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-xl"
              >
                <Plus className="h-5 w-5 sm:h-6 sm:w-6 text-gray-600" />
              </Button>

              <Button
                onClick={() => setIsUploadDialogOpen(true)}
                variant="ghost"
                size="sm"
                className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-xl"
              >
                <Upload className="h-5 w-5 sm:h-6 sm:w-6 text-gray-600" />
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
                  placeholder={t('search_placeholder')}
                  value={searchTerm}
                  onChange={(e) => {
                    console.log('Search input changed:', e.target.value);
                    setSearchTerm(e.target.value);
                  }}
                  className="w-full pr-4 pl-10 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  dir="rtl"
                />
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              </div>
              <Button
                onClick={handleSearchClear}
                variant="ghost"
                size="sm"
                className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-lg"
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
          orders={sortedFilteredOrders}
          onUpdateComment={handleUpdateComment}
          onUpdateStatus={handleUpdateStatus}
          onUpdatePhone={handleUpdatePhone}
          onUpdatePrice={handleUpdatePrice}
          onReorderOrders={handleReorderOrders}
          tableSettings={tableSettings}
        />

        {/* Summary Cards - Now Below Table */}
        <div className="px-2 sm:px-4 py-4">
          <OrderSummary orders={archivedOrders} commission={commission} />
        </div>
      </div>

      {/* Search Results Info */}
      {isSearchOpen && searchTerm && (
        <div className="px-2 sm:px-4 py-2 bg-blue-50 border-t border-blue-200">
          <p className="text-xs sm:text-sm text-blue-700" dir="rtl">
            {t('search_results')} {filteredOrders.length} {t('search_results_desc')} {orders.length} {t('orders')}
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

      <TableSettingsDialog
        open={isTableSettingsOpen}
        onOpenChange={setIsTableSettingsOpen}
        settings={tableSettings}
        onSettingsChange={setTableSettings}
      />

      <MenuDrawer
        isOpen={isMenuDrawerOpen}
        onClose={() => setIsMenuDrawerOpen(false)}
        commission={commission}
        onCommissionChange={setCommission}
        totalOrders={orders.length + archivedOrders.length}
        deliveredOrders={archivedOrders.length}
        archivedOrders={archivedOrders}
        orders={orders}
        onClearAllData={handleClearAllData}
        onShare={handleShare}
      />
    </div>
  );
};

export default Index;
