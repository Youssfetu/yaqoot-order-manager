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
import { supabase } from '@/integrations/supabase/client';
import { exportToExcel } from '@/utils/excelExport';
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
    coordinatesVisibility: false,
  });
  const { toast } = useToast();
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Load orders and archived orders from database on component mount
  useEffect(() => {
    if (user) {
      loadOrdersFromDatabase();
      loadArchivedOrdersFromDatabase();
    }
  }, [user]);

  // Focus search input when search opens
  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    }
  }, [isSearchOpen]);

  // Load orders from database
  const loadOrdersFromDatabase = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      if (data) {
        const formattedOrders = data.map(order => ({
          id: order.id,
          code: order.code,
          vendeur: order.vendeur,
          numero: order.numero,
          prix: Number(order.prix),
          statut: order.statut,
          commentaire: order.commentaire || '',
          isScanned: order.is_scanned || false
        }));
        setOrders(formattedOrders);
      }
    } catch (error) {
      console.error('Error loading orders:', error);
      toast({
        title: "خطأ",
        description: "فشل في تحميل الطلبات",
        variant: "destructive",
      });
    }
  };

  // Load archived orders from database
  const loadArchivedOrdersFromDatabase = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('archived_orders')
        .select('*')
        .eq('user_id', user.id)
        .order('archived_at', { ascending: false });
      
      if (error) throw error;
      
      if (data) {
        const formattedArchivedOrders = data.map(order => ({
          id: order.id,
          code: order.code,
          vendeur: order.vendeur,
          numero: order.numero,
          prix: Number(order.prix),
          statut: order.statut,
          commentaire: order.commentaire || '',
          isScanned: order.is_scanned || false
        }));
        setArchivedOrders(formattedArchivedOrders);
      }
    } catch (error) {
      console.error('Error loading archived orders:', error);
      toast({
        title: "خطأ",
        description: "فشل في تحميل الطلبات المؤرشفة",
        variant: "destructive",
      });
    }
  };

  const handleAddOrder = async (newOrder: Partial<Order>) => {
    if (!user) return;

    try {
      // Save to database - لا نضع ID مخصص، نترك قاعدة البيانات تولد UUID
      const { data, error } = await supabase
        .from('orders')
        .insert({
          user_id: user.id,
          code: newOrder.code || '',
          vendeur: newOrder.vendeur || '',
          numero: newOrder.numero || '',
          prix: newOrder.prix || 0,
          statut: newOrder.statut || 'Nouveau',
          commentaire: newOrder.commentaire || '',
          is_scanned: false
        })
        .select();

      if (error) throw error;

      // Update local state with returned data
      if (data && data[0]) {
        const order: Order = {
          id: data[0].id,
          code: data[0].code,
          vendeur: data[0].vendeur,
          numero: data[0].numero,
          prix: Number(data[0].prix),
          statut: data[0].statut,
          commentaire: data[0].commentaire || '',
          isScanned: data[0].is_scanned || false
        };
        
        setOrders([...orders, order]);
        toast({
          title: t('order_added'),
          description: `${t('order_added_desc')} ${order.code}`,
        });
      }
    } catch (error) {
      console.error('Error adding order:', error);
      toast({
        title: "خطأ",
        description: "فشل في إضافة الطلبية",
        variant: "destructive",
      });
    }
  };

  const handleUpdateComment = async (id: string, comment: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('orders')
        .update({ commentaire: comment })
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      setOrders(orders.map(order => 
        order.id === id ? { ...order, commentaire: comment } : order
      ));
    } catch (error) {
      console.error('Error updating comment:', error);
      toast({
        title: "خطأ",
        description: "فشل في تحديث التعليق",
        variant: "destructive",
      });
    }
  };

  const handleUpdatePhone = async (id: string, phone: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('orders')
        .update({ numero: phone })
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      setOrders(orders.map(order => 
        order.id === id ? { ...order, numero: phone } : order
      ));
    } catch (error) {
      console.error('Error updating phone:', error);
      toast({
        title: "خطأ",
        description: "فشل في تحديث رقم الهاتف",
        variant: "destructive",
      });
    }
  };

  const handleUpdatePrice = async (id: string, price: number) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('orders')
        .update({ prix: price })
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      setOrders(orders.map(order => 
        order.id === id ? { ...order, prix: price } : order
      ));
    } catch (error) {
      console.error('Error updating price:', error);
      toast({
        title: "خطأ",
        description: "فشل في تحديث السعر",
        variant: "destructive",
      });
    }
  };

  const handleReorderOrders = (newOrders: Order[]) => {
    setOrders(newOrders);
  };

  const handleUpdateStatus = async (id: string, status: string) => {
    if (!user) return;

    // إذا تم تغيير الحالة إلى Livré، نقل الطلبية إلى الأرشيف
    if (status === 'Livré') {
      const orderToArchive = orders.find(order => order.id === id);
      if (orderToArchive) {
        try {
          // حذف من جدول orders
          const { error: deleteError } = await supabase
            .from('orders')
            .delete()
            .eq('id', id)
            .eq('user_id', user.id);

          if (deleteError) throw deleteError;

          // إضافة إلى جدول archived_orders
          const { error: insertError } = await supabase
            .from('archived_orders')
            .insert({
              id: orderToArchive.id,
              user_id: user.id,
              code: orderToArchive.code,
              vendeur: orderToArchive.vendeur,
              numero: orderToArchive.numero,
              prix: orderToArchive.prix,
              statut: status,
              commentaire: orderToArchive.commentaire,
              is_scanned: orderToArchive.isScanned || false
            });

          if (insertError) throw insertError;

          // تحديث الحالة المحلية
          const archivedOrder = { ...orderToArchive, statut: status };
          setArchivedOrders(prev => [...prev, archivedOrder]);
          setOrders(orders.filter(order => order.id !== id));
          
          toast({
            title: t('order_archived'),
            description: `${t('order_archived_desc')} ${orderToArchive.code}`,
            duration: 4000,
            className: "border-l-4 border-l-primary bg-primary/10 text-primary-foreground font-medium shadow-lg backdrop-blur-sm rounded-md flex items-center gap-2 before:content-['✅'] before:mr-2",
          });
          return;
        } catch (error) {
          console.error('Error archiving order:', error);
          toast({
            title: "خطأ",
            description: "فشل في أرشفة الطلبية",
            variant: "destructive",
          });
          return;
        }
      }
    }
    
    try {
      // تحديث الحالة في قاعدة البيانات
      const { error } = await supabase
        .from('orders')
        .update({ statut: status })
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      // تحديث الحالة المحلية
      setOrders(orders.map(order => 
        order.id === id ? { ...order, statut: status } : order
      ));
      
      toast({
        title: t('status_updated'),
        description: `${t('status_updated_desc')} "${status}"`,
      });
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: "خطأ",
        description: "فشل في تحديث الحالة",
        variant: "destructive",
      });
    }
  };

  const handleBarcodeScanned = async (code: string) => {
    if (!user) return 'not-found';

    console.log('Scanning for code:', code);
    const foundOrder = orders.find(order => order.code === code);
    if (foundOrder) {
      try {
        const { error } = await supabase
          .from('orders')
          .update({ is_scanned: true })
          .eq('id', foundOrder.id)
          .eq('user_id', user.id);

        if (error) throw error;

        setOrders(orders.map(order => 
          order.code === code ? { ...order, isScanned: true } : order
        ));
        
        toast({
          title: t('order_found'),
          description: `${t('order_found_desc')} ${code}`,
        });
        
        return 'success';
      } catch (error) {
        console.error('Error updating scanned status:', error);
        toast({
          title: "خطأ",
          description: "فشل في تحديث حالة المسح",
          variant: "destructive",
        });
        return 'not-found';
      }
    } else {
      toast({
        title: t('order_not_found'),
        description: `${t('order_not_found_desc')} ${code}`,
        variant: "destructive",
      });
      return 'not-found';
    }
  };

  const handleFileUpload = async (newOrders: Order[]) => {
    if (!user) return;

    try {
      // حفظ الطلبات في قاعدة البيانات - لا نضع ID مخصص، نترك قاعدة البيانات تولد UUID
      const ordersToInsert = newOrders.map(order => ({
        user_id: user.id,
        code: order.code,
        vendeur: order.vendeur,
        numero: order.numero,
        prix: order.prix,
        statut: order.statut,
        commentaire: order.commentaire,
        is_scanned: false
      }));

      const { data, error } = await supabase
        .from('orders')
        .insert(ordersToInsert)
        .select(); // نحتاج select() لاسترجاع البيانات المدرجة مع الـ ID الجديد

      if (error) throw error;

      // تحديث الحالة المحلية بالبيانات المسترجعة من قاعدة البيانات
      if (data) {
        const formattedOrders = data.map(order => ({
          id: order.id,
          code: order.code,
          vendeur: order.vendeur,
          numero: order.numero,
          prix: Number(order.prix),
          statut: order.statut,
          commentaire: order.commentaire || '',
          isScanned: order.is_scanned || false
        }));
        
        setOrders(prevOrders => [...prevOrders, ...formattedOrders]);
        toast({
          title: t('file_uploaded_success'),
          description: `${t('file_uploaded_desc')} ${formattedOrders.length}`,
        });
      }
    } catch (error) {
      console.error('Error uploading orders:', error);
      toast({
        title: "خطأ",
        description: "فشل في رفع الطلبات",
        variant: "destructive",
      });
    }
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
        const fileName = exportToExcel(orders, archivedOrders);
        
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

  const handleClearAllData = async () => {
    if (!user) return;

    try {
      // حذف جميع البيانات من قاعدة البيانات
      const { error: ordersError } = await supabase
        .from('orders')
        .delete()
        .eq('user_id', user.id);

      if (ordersError) throw ordersError;

      const { error: archivedError } = await supabase
        .from('archived_orders')
        .delete()
        .eq('user_id', user.id);

      if (archivedError) throw archivedError;

      // تحديث الحالة المحلية
      setOrders([]);
      setArchivedOrders([]);
      toast({
        title: t('data_cleared'),
        description: t('data_cleared_desc'),
      });
    } catch (error) {
      console.error('Error clearing data:', error);
      toast({
        title: "خطأ",
        description: "فشل في مسح البيانات",
        variant: "destructive",
      });
    }
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
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-accent/20">
      {/* Modern Header with Glass Effect */}
      <div className="bg-background/80 backdrop-blur-md border-b border-border/50 sticky top-0 z-10 shadow-lg">
        <div className="px-2 sm:px-4 py-3">
          <div className="flex items-center justify-between mb-3">
            {/* Menu Icon Only */}
            <div className="flex items-center gap-2">
              <Button
                onClick={() => setIsMenuDrawerOpen(true)}
                variant="ghost"
                size="sm"
                className="p-1.5 sm:p-2 hover:bg-primary/10 rounded-xl transition-all duration-200 hover:scale-105"
              >
                <Menu className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
              </Button>
            </div>
            
            {/* Header Icons */}
            <div className="flex items-center gap-1 sm:gap-3">
              {/* Table Settings - First on the left */}
              <Button
                onClick={() => setIsTableSettingsOpen(true)}
                variant="ghost"
                size="sm"
                className="p-1.5 sm:p-2 hover:bg-primary/10 rounded-xl transition-all duration-200 hover:scale-105"
              >
                <SlidersHorizontal className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
              </Button>

              <Button
                onClick={() => setIsScannerOpen(true)}
                variant="ghost"
                size="sm"
                className="p-1.5 sm:p-2 hover:bg-primary/10 rounded-xl transition-all duration-200 hover:scale-105"
              >
                <QrCode className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
              </Button>

              <Button
                onClick={() => setIsArchivedDialogOpen(true)}
                variant="ghost"
                size="sm"
                className="p-1.5 sm:p-2 hover:bg-primary/10 rounded-xl transition-all duration-200 hover:scale-105"
              >
                <Archive className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
              </Button>

              {/* Search Button - Now Functional */}
              <Button
                variant="ghost"
                size="sm"
                className="p-1.5 sm:p-2 hover:bg-primary/10 rounded-xl transition-all duration-200 hover:scale-105"
                onClick={handleSearchToggle}
              >
                <Search className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
              </Button>

              <Button
                onClick={() => setIsAddDialogOpen(true)}
                variant="ghost"
                size="sm"
                className="p-1.5 sm:p-2 hover:bg-primary/10 rounded-xl transition-all duration-200 hover:scale-105"
              >
                <Plus className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
              </Button>

              <Button
                onClick={() => setIsUploadDialogOpen(true)}
                variant="ghost"
                size="sm"
                className="p-1.5 sm:p-2 hover:bg-primary/10 rounded-xl transition-all duration-200 hover:scale-105"
              >
                <Upload className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
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
                  className="w-full pr-4 pl-10 py-2 text-sm sm:text-base border border-primary/20 bg-background/50 backdrop-blur-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-primary shadow-sm"
                  dir="rtl"
                />
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              </div>
                <Button
                  onClick={handleSearchClear}
                  variant="ghost"
                  size="sm"
                  className="p-1.5 sm:p-2 hover:bg-primary/10 rounded-lg transition-all duration-200"
                >
                  <X className="h-4 w-4 text-primary" />
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
        <div className="px-2 sm:px-4 py-2 bg-primary/5 backdrop-blur-sm border-t border-primary/20">
          <p className="text-xs sm:text-sm text-primary" dir="rtl">
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
