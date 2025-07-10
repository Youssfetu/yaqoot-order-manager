import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

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
  try {
    console.log('Starting PDF generation with orders:', deliveredOrders);
    console.log('Commission rate:', commission);
    
    const doc = new jsPDF();
    console.log('jsPDF initialized');
    
    // Calculate totals
    const totalOrders = deliveredOrders.length;
    const totalAmount = deliveredOrders.reduce((sum, order) => sum + order.prix, 0);
    const commissionAmount = commission * totalOrders; // Fixed commission per order
    const finalAmount = totalAmount - commissionAmount;
    
    console.log('Calculations done:', { totalOrders, totalAmount, commissionAmount, finalAmount });
    
    // Current date
    const currentDate = new Date().toLocaleDateString('fr-FR');
    
    // Header
    doc.setFontSize(18);
    doc.text('FACTURE / INVOICE', 105, 20, { align: 'center' });
    
    doc.setFontSize(12);
    doc.text(`Date: ${currentDate}`, 20, 35);
    doc.text(`Nombre de commandes: ${totalOrders}`, 20, 45);
    
    // Table headers and data
    const tableData = deliveredOrders.map(order => [
      order.code,
      order.vendeur,
      order.numero,
      `${order.prix.toFixed(2)} DH`,
      order.statut
    ]);
    
    console.log('Table data prepared');
    
    // Generate table using autoTable
    autoTable(doc, {
      head: [['Code', 'Client', 'Telephone', 'Prix', 'Statut']],
      body: tableData,
      startY: 55,
      styles: {
        fontSize: 10,
        cellPadding: 3,
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
    
    console.log('Table generated');
    
    // Get the Y position after the table
    const finalY = (doc as any).lastAutoTable.finalY + 20;
    
    // Summary section
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    
    // Summary content
    const summaryY = finalY;
    doc.text('RESUME:', 20, summaryY);
    doc.text(`Total des commandes: ${totalOrders}`, 20, summaryY + 15);
    doc.text(`Montant total: ${totalAmount.toFixed(2)} DH`, 20, summaryY + 25);
    doc.text(`Commission (${commission} DH x ${totalOrders}): ${commissionAmount.toFixed(2)} DH`, 20, summaryY + 35);
    
    // Final amount (highlighted)
    doc.setFontSize(16);
    doc.setTextColor(255, 0, 0);
    doc.text(`MONTANT A VERSER: ${finalAmount.toFixed(2)} DH`, 20, summaryY + 50);
    
    // Reset color
    doc.setTextColor(0, 0, 0);
    
    // Footer
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text('Facture generee automatiquement', 105, 280, { align: 'center' });
    
    console.log('PDF content ready, saving...');
    
    // Generate filename with current date
    const fileName = `facture_${new Date().toISOString().split('T')[0]}.pdf`;
    
    // Save the PDF
    doc.save(fileName);
    
    console.log('PDF saved successfully:', fileName);
    
    return fileName;
  } catch (error) {
    console.error('Error in generateInvoicePDF:', error);
    throw error;
  }
};