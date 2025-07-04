import React, { useState, useRef } from 'react';
import { Search, Plus, BarChart3, Upload, QrCode, Share2, Calculator, Menu, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import OrdersTable from '@/components/OrdersTable';
import AddOrderDialog from '@/components/AddOrderDialog';
import UploadDialog from '@/components/UploadDialog';
import BarcodeScanner from '@/components/BarcodeScanner';
import OrderSummary from '@/components/OrderSummary';
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
  const [orders, setOrders] = useState<Order[]>([
    {
      id: '1',
      code: 'CMD001',
      vendeur: 'أحمد محمد',
      numero: '123456789',
      prix: 250.00,
      statut: 'مؤكد',
      commentaire: 'تم التسليم بنجاح'
    },
    {
      id: '2',
      code: 'CMD002',
      vendeur: 'فاطمة علي',
      numero: '987654321',
      prix: 180.50,
      statut: 'قيد المعالجة',
      commentaire: ''
    },
    {
      id: '3',
      code: 'CMD003',
      vendeur: 'محمد حسن',
      numero: '456789123',
      prix: 320.75,
      statut: 'ألغيت',
      commentaire: 'العميل غير متاح'
    }
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [commission, setCommission] = useState(50);
  const { toast } = useToast();

  const handleAddOrder = (newOrder: Partial<Order>) => {
    const order: Order = {
      id: Date.now().toString(),
      code: newOrder.code || '',
      vendeur: newOrder.vendeur || '',
      numero: newOrder.numero || '',
      prix: newOrder.prix || 0,
      statut: newOrder.statut || 'جديد',
      commentaire: newOrder.commentaire || ''
    };
    setOrders([...orders, order]);
    toast({
      title: "تم إضافة الطلبية",
      description: `تم إضافة الطلبية ${order.code} بنجاح`,
    });
  };

  const handleUpdateComment = (id: string, comment: string) => {
    setOrders(orders.map(order => 
      order.id === id ? { ...order, commentaire: comment } : order
    ));
  };

  const handleBarcodeScanned = (code: string) => {
    const foundOrder = orders.find(order => order.code === code);
    if (foundOrder) {
      setOrders(orders.map(order => 
        order.code === code ? { ...order, isScanned: true } : order
      ));
      toast({
        title: "تم العثور على الطلبية",
        description: `الطلبية ${code} تم تحديدها بنجاح`,
      });
    } else {
      toast({
        title: "لم يتم العثور على الطلبية",
        description: `الكود ${code} غير موجود`,
        variant: "destructive"
      });
    }
    setIsScannerOpen(false);
  };

  const filteredOrders = orders.filter(order =>
    order.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.vendeur.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      {/* Android Style Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="bg-blue-600 p-2 rounded-xl">
                <Package className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">إدارة الطلبيات</h1>
                <p className="text-xs text-gray-500">نظام متقدم للموزعين</p>
              </div>
            </div>
            <Button variant="ghost" size="sm" className="p-2">
              <Menu className="h-5 w-5 text-gray-600" />
            </Button>
          </div>

          {/* Action Buttons Row */}
          <div className="flex gap-2 mb-3">
            <Button
              onClick={() => setIsAddDialogOpen(true)}
              className="flex-1 h-12 bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md border-0 text-white font-medium"
            >
              <Plus className="h-5 w-5" />
            </Button>
            
            <Button
              onClick={() => setIsScannerOpen(true)}
              variant="outline"
              className="flex-1 h-12 bg-white border-gray-200 rounded-xl shadow-md hover:bg-gray-50"
            >
              <QrCode className="h-5 w-5" />
            </Button>

            <Button
              onClick={() => setIsUploadDialogOpen(true)}
              variant="outline"
              className="flex-1 h-12 bg-white border-gray-200 rounded-xl shadow-md hover:bg-gray-50"
            >
              <Upload className="h-5 w-5" />
            </Button>
            
            <Button
              variant="outline"
              className="flex-1 h-12 bg-white border-gray-200 rounded-xl shadow-md hover:bg-gray-50"
              onClick={() => {
                toast({
                  title: "تم تصدير البيانات",
                  description: "سيتم تطوير هذه الميزة قريباً",
                });
              }}
            >
              <Share2 className="h-5 w-5" />
            </Button>
          </div>
          
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="البحث بالكود أو اسم العميل..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pr-10 bg-gray-50 border-gray-200 rounded-xl h-12"
            />
          </div>
        </div>
      </div>

      <div className="px-4 py-4 space-y-4">
        {/* Commission Input */}
        <Card className="bg-white shadow-md border-0 rounded-2xl">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm text-gray-600 mb-2">العمولة لكل طلبية</p>
                <Input
                  type="number"
                  value={commission}
                  onChange={(e) => setCommission(Number(e.target.value))}
                  className="w-full bg-gray-50 border-gray-200 rounded-xl h-12"
                  placeholder="العمولة"
                />
              </div>
              <div className="mr-4">
                <p className="text-lg font-semibold text-gray-700">درهم</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Orders Table */}
        <Card className="bg-white shadow-md border-0 rounded-2xl overflow-hidden">
          <CardHeader className="bg-gray-50 border-b border-gray-100">
            <CardTitle className="text-lg font-bold text-gray-900">
              قائمة الطلبيات ({filteredOrders.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <OrdersTable
              orders={filteredOrders}
              onUpdateComment={handleUpdateComment}
            />
          </CardContent>
        </Card>

        {/* Summary Cards - Now Below Table */}
        <OrderSummary orders={orders} commission={commission} />
      </div>

      {/* Dialogs */}
      <AddOrderDialog
        isOpen={isAddDialogOpen}
        onClose={() => setIsAddDialogOpen(false)}
        onAdd={handleAddOrder}
      />

      <UploadDialog
        isOpen={isUploadDialogOpen}
        onClose={() => setIsUploadDialogOpen(false)}
        onUpload={(data) => {
          setOrders([...orders, ...data]);
          toast({
            title: "تم تحميل الملف",
            description: `تم إضافة ${data.length} طلبية جديدة`,
          });
        }}
      />

      <BarcodeScanner
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScan={handleBarcodeScanned}
      />
    </div>
  );
};

export default Index;
