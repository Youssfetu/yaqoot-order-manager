
import React, { useState, useRef } from 'react';
import { Search, Plus, BarChart3, Upload, QrCode, Share2, Calculator } from 'lucide-react';
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
  const [commission, setCommission] = useState(50); // عمولة افتراضية
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

  const totalAmount = orders.reduce((sum, order) => sum + order.prix, 0);
  const totalCommission = commission * orders.length;
  const orderCount = orders.length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-orange-50 p-4" dir="rtl">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            إدارة الطلبيات
          </h1>
          <p className="text-gray-600">نظام متقدم لإدارة طلبيات الموزعين</p>
        </div>

        {/* Action Bar */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-3 items-center justify-between">
              {/* Search */}
              <div className="relative flex-1 min-w-64">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="البحث بالكود أو اسم العميل..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pr-10"
                />
              </div>
              
              {/* Action Buttons */}
              <div className="flex gap-2 flex-wrap">
                <Button
                  onClick={() => setIsUploadDialogOpen(true)}
                  variant="outline"
                  size="sm"
                  className="gap-2"
                >
                  <Upload className="h-4 w-4" />
                  تحميل ملف
                </Button>
                
                <Button
                  onClick={() => setIsScannerOpen(true)}
                  variant="outline"
                  size="sm"
                  className="gap-2"
                >
                  <QrCode className="h-4 w-4" />
                  مسح باركود
                </Button>
                
                <Button
                  onClick={() => setIsAddDialogOpen(true)}
                  size="sm"
                  className="gap-2 bg-gradient-to-r from-blue-600 to-orange-600 hover:from-blue-700 hover:to-orange-700"
                >
                  <Plus className="h-4 w-4" />
                  طلبية جديدة
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">إجمالي المبلغ</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {totalAmount.toFixed(2)} د.م
                  </p>
                </div>
                <Calculator className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">العمولة الإجمالية</p>
                  <p className="text-2xl font-bold text-orange-600">
                    {totalCommission.toFixed(2)} د.م
                  </p>
                </div>
                <BarChart3 className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">عدد الطلبيات</p>
                  <p className="text-2xl font-bold text-green-600">
                    {orderCount}
                  </p>
                </div>
                <Badge variant="secondary" className="text-lg px-3 py-1">
                  {orderCount}
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">العمولة لكل طلبية</p>
                  <Input
                    type="number"
                    value={commission}
                    onChange={(e) => setCommission(Number(e.target.value))}
                    className="w-24 mt-1"
                  />
                </div>
                <p className="text-sm text-gray-500">د.م</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Orders Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>قائمة الطلبيات ({filteredOrders.length})</span>
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => {
                  toast({
                    title: "تم تصدير البيانات",
                    description: "سيتم تطوير هذه الميزة قريباً",
                  });
                }}
              >
                <Share2 className="h-4 w-4" />
                تصدير ومشاركة
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <OrdersTable
              orders={filteredOrders}
              onUpdateComment={handleUpdateComment}
            />
          </CardContent>
        </Card>

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
    </div>
  );
};

export default Index;
