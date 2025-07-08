
import * as XLSX from 'xlsx';
import { Order } from '@/pages/Index';

export const exportOrdersToExcel = (orders: Order[]) => {
  // تحضير البيانات للتصدير
  const exportData = orders.map(order => ({
    'الكود': order.code,
    'العميل': order.vendeur,
    'رقم الهاتف': order.numero,
    'السعر': order.prix,
    'الحالة': order.statut,
    'التعليق': order.commentaire
  }));

  // إنشاء ورقة عمل Excel
  const worksheet = XLSX.utils.json_to_sheet(exportData);
  
  // إنشاء كتاب العمل
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'الطلبيات');
  
  // تحديد اسم الملف مع التاريخ الحالي
  const currentDate = new Date().toISOString().split('T')[0];
  const fileName = `طلبيات_${currentDate}.xlsx`;
  
  // تصدير الملف
  XLSX.writeFile(workbook, fileName);
  
  return fileName;
};
