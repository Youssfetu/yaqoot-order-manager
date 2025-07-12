import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'ar' | 'fr';

interface Translations {
  ar: Record<string, string>;
  fr: Record<string, string>;
}

const translations: Translations = {
  ar: {
    // Header & Navigation
    'settings': 'الإعدادات',
    'search': 'البحث',
    'add': 'إضافة طلبية',
    'upload': 'رفع ملف',
    'scanner': 'الماسح الضوئي',
    'archive': 'الأرشيف',
    'menu': 'القائمة',
    'close': 'إغلاق',
    
    // Table Headers
    'code': 'الكود',
    'client': 'العميل/الموزع',
    'phone': 'الرقم',
    'price': 'الثمن',
    'comment': 'التعليق',
    'status': 'الحالة',
    'destination': 'الوجهة',
    
    // Status
    'confirmed': 'مؤكد',
    'in_progress': 'قيد التنفيذ',
    'delivered': 'تم التوصيل',
    'postponed': 'مؤجل',
    'cancelled': 'ملغي',
    'refused': 'مرفوض',
    
    // Menu Items
    'commission': 'العمولة',
    'delivery_percentage': 'نسبة التوصيل',
    'generate_invoice': 'توليد الفاتورة',
    'share_excel': 'مشاركة ملف إكسل',
    'clear_all_data': 'مسح جميع البيانات',
    'language': 'اللغة',
    'select_language': 'اختر اللغة',
    
    // Language names
    'arabic': 'العربية',
    'french': 'الفرنسية',
    
    // Messages
    'save_changes': 'حفظ التغييرات',
    'settings_saved': 'تم حفظ الإعدادات',
    'commission_updated': 'تم تحديث العمولة بنجاح',
    'excel_downloaded': 'تم تحميل ملف Excel',
    'file_downloaded_success': 'تم تحميل الملف بنجاح',
    'error': 'خطأ',
    'download_error': 'حدث خطأ أثناء التحميل',
    'no_delivered_orders': 'لا توجد طلبيات مسلمة',
    'no_delivered_orders_desc': 'لا توجد طلبيات مسلمة لإنشاء فاتورة',
    'invoice_generated': 'تم إنشاء الفاتورة بنجاح',
    'invoice_downloaded': 'تم تحميل الفاتورة',
    'invoice_error': 'حدث خطأ أثناء إنشاء الفاتورة',
    'data_deleted': 'تم حذف البيانات',
    'all_orders_deleted': 'تم حذف جميع الطلبيات بنجاح',
    'are_you_sure': 'هل أنت متأكد؟',
    'delete_confirmation': 'هذا الإجراء سيحذف جميع الطلبيات (النشطة والمؤرشفة). لا يمكن التراجع عن هذا الإجراء. ستبقى إعدادات العمولة محفوظة.',
    'cancel': 'إلغاء',
    'delete_all': 'حذف الكل',
    'enter_commission': 'أدخل قيمة العمولة',
    'orders_delivered': 'طلبيات تم توصيلها',
    'from': 'من',
    'create_invoice': 'إنشاء فاتورة للطلبيات',
    'share_excel_desc': 'مشاركة البيانات كملف إكسل',
    'delete_all_desc': 'حذف جميع الطلبيات',
    'write_comment': 'اكتب تعليق...',
    'save': 'حفظ',
    'language_changed': 'تم تغيير اللغة',
    'language_changed_desc': 'تم تغيير اللغة بنجاح'
  },
  fr: {
    // Header & Navigation
    'settings': 'Paramètres',
    'search': 'Recherche',
    'add': 'Ajouter commande',
    'upload': 'Télécharger fichier',
    'scanner': 'Scanner',
    'archive': 'Archive',
    'menu': 'Menu',
    'close': 'Fermer',
    
    // Table Headers
    'code': 'Code',
    'client': 'Client/Distributeur',
    'phone': 'Numéro',
    'price': 'Prix',
    'comment': 'Commentaire',
    'status': 'Statut',
    'destination': 'Destination',
    
    // Status
    'confirmed': 'Confirmé',
    'in_progress': 'En cours',
    'delivered': 'Livré',
    'postponed': 'Reporté',
    'cancelled': 'Annulé',
    'refused': 'Refusé',
    
    // Menu Items
    'commission': 'Commission',
    'delivery_percentage': 'Pourcentage de livraison',
    'generate_invoice': 'Générer facture',
    'share_excel': 'Partager fichier Excel',
    'clear_all_data': 'Effacer toutes les données',
    'language': 'Langue',
    'select_language': 'Sélectionnez la langue',
    
    // Language names
    'arabic': 'العربية',
    'french': 'Français',
    
    // Messages
    'save_changes': 'Sauvegarder les modifications',
    'settings_saved': 'Paramètres sauvegardés',
    'commission_updated': 'Commission mise à jour avec succès',
    'excel_downloaded': 'Excel téléchargé',
    'file_downloaded_success': 'Le fichier a été téléchargé avec succès',
    'error': 'Erreur',
    'download_error': 'Une erreur est survenue lors du téléchargement',
    'no_delivered_orders': 'Aucune commande livrée',
    'no_delivered_orders_desc': 'Il n\'y a pas de commandes livrées pour générer une facture',
    'invoice_generated': 'Facture générée avec succès',
    'invoice_downloaded': 'La facture a été téléchargée',
    'invoice_error': 'Une erreur est survenue lors de la génération de la facture',
    'data_deleted': 'Données supprimées',
    'all_orders_deleted': 'Toutes les commandes ont été supprimées avec succès',
    'are_you_sure': 'Êtes-vous sûr ?',
    'delete_confirmation': 'Cette action supprimera toutes les commandes (actives et archivées). Cette action ne peut pas être annulée. Les paramètres de commission seront conservés.',
    'cancel': 'Annuler',
    'delete_all': 'Tout supprimer',
    'enter_commission': 'Entrez la valeur de la commission',
    'orders_delivered': 'commandes livrées',
    'from': 'sur',
    'create_invoice': 'Créer une facture pour les commandes',
    'share_excel_desc': 'Partager les données en fichier Excel',
    'delete_all_desc': 'Supprimer toutes les commandes',
    'write_comment': 'Écrire un commentaire...',
    'save': 'Sauvegarder',
    'language_changed': 'Langue modifiée',
    'language_changed_desc': 'La langue a été modifiée avec succès'
  }
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  isRTL: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

interface LanguageProviderProps {
  children: React.ReactNode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem('app-language');
    return (saved as Language) || 'ar';
  });

  const isRTL = language === 'ar';

  useEffect(() => {
    localStorage.setItem('app-language', language);
    document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  }, [language, isRTL]);

  const t = (key: string): string => {
    return translations[language][key] || key;
  };

  const value: LanguageContextType = {
    language,
    setLanguage,
    t,
    isRTL,
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};