import jsPDF from 'jspdf';
import 'jspdf-autotable';

declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => void;
  }
}

export interface Order {
  id: string;
  code: string;
  vendeur: string;
  numero: string;
  prix: number;
  statut: string;
  commentaire: string;
}

export const generateInvoicePDF = (
  deliveredOrders: Order[],
  commission: number
) => {
  const doc = new jsPDF();
  
  // Calculate totals
  const totalOrders = deliveredOrders.length;
  const totalAmount = deliveredOrders.reduce((sum, order) => sum + order.prix, 0);
  const commissionAmount = (totalAmount * commission) / 100;
  const finalAmount = totalAmount - commissionAmount;
  
  // Current date
  const currentDate = new Date().toLocaleDateString('ar-EG');
  
  // Header
  doc.setFontSize(18);
  doc.text('Invoice / Facture', 105, 20, { align: 'center' });
  
  doc.setFontSize(12);
  doc.text(`Date: ${currentDate}`, 20, 35);
  doc.text(`Total Orders: ${totalOrders}`, 20, 45);
  
  // Table headers
  const headers = [['Code', 'Client', 'Telephone', 'Prix (DH)', 'Statut']];
  
  // Table data
  const data = deliveredOrders.map(order => [
    order.code,
    order.vendeur,
    order.numero,
    order.prix.toFixed(2),
    order.statut
  ]);
  
  // Generate table
  doc.autoTable({
    head: headers,
    body: data,
    startY: 55,
    styles: {
      fontSize: 10,
      cellPadding: 5,
    },
    headStyles: {
      fillColor: [63, 81, 181],
      textColor: 255,
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245],
    },
    margin: { left: 15, right: 15 },
  });
  
  // Get the Y position after the table
  const finalY = (doc as any).lastAutoTable.finalY + 20;
  
  // Summary section
  doc.setFontSize(12);
  doc.setFont(undefined, 'bold');
  
  // Draw summary box
  const boxY = finalY;
  const boxHeight = 50;
  doc.rect(15, boxY, 180, boxHeight);
  
  // Summary content
  doc.text('RESUME / SUMMARY:', 20, boxY + 10);
  doc.text(`Total des commandes: ${totalOrders}`, 20, boxY + 20);
  doc.text(`Montant total: ${totalAmount.toFixed(2)} DH`, 20, boxY + 30);
  doc.text(`Commission (${commission}%): ${commissionAmount.toFixed(2)} DH`, 20, boxY + 40);
  
  // Final amount (highlighted)
  doc.setFontSize(14);
  doc.setTextColor(255, 0, 0); // Red color
  doc.text(`Montant à verser: ${finalAmount.toFixed(2)} DH`, 105, boxY + 40, { align: 'center' });
  
  // Reset color
  doc.setTextColor(0, 0, 0);
  
  // Footer
  doc.setFontSize(10);
  doc.setFont(undefined, 'normal');
  doc.text('Generated automatically - Généré automatiquement', 105, 280, { align: 'center' });
  
  // Generate filename with current date
  const fileName = `facture_${new Date().toISOString().split('T')[0]}.pdf`;
  
  // Save the PDF
  doc.save(fileName);
  
  return fileName;
};