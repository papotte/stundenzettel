import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { format } from "date-fns";
import type { AuthenticatedUser } from "@/lib/types";
import type { UserSettings } from "@/lib/types";

interface PdfExportParams {
  selectedMonth: Date;
  user: AuthenticatedUser | null;
  userSettings: UserSettings;
  t: (key: string, replacements?: Record<string, string | number>) => string;
}

export const exportToPdf = async ({
  selectedMonth,
  user,
  userSettings,
  t,
}: PdfExportParams) => {
  const printableArea = document.querySelector('.printable-area') as HTMLElement;
  if (!printableArea) {
    console.error("Printable area not found");
    return;
  }

  // Hide elements not needed for the canvas capture
  const header = printableArea.querySelector('header');
  const footer = printableArea.querySelector('.signature-footer');
  if(header) header.style.display = 'none';
  if(footer) (footer as HTMLElement).style.display = 'none';

  const canvas = await html2canvas(printableArea, {
    scale: 2, // Higher scale for better quality
    useCORS: true,
  });

  // Restore hidden elements
  if(header) header.style.display = '';
  if(footer) (footer as HTMLElement).style.display = '';

  const imgData = canvas.toDataURL('image/png');

  const pdf = new jsPDF({
    orientation: 'p',
    unit: 'mm',
    format: 'a4',
  });

  const pageHeight = pdf.internal.pageSize.getHeight();
  const pageWidth = pdf.internal.pageSize.getWidth();
  const margin = 10;

  // --- HEADER ---
  const companyName = userSettings?.companyName || '';
  const email = userSettings?.companyEmail || '';
  const phone1 = userSettings?.companyPhone1 || '';
  const phone2 = userSettings?.companyPhone2 || '';
  const fax = userSettings?.companyFax || '';
  const phoneNumbers = [phone1, phone2].filter(Boolean).join(' / ');
  const contactParts = [companyName, email, phoneNumbers ? `Tel.: ${phoneNumbers}` : '', fax ? `FAX: ${fax}` : ''].filter(Boolean);
  
  pdf.setFontSize(8);
  if (contactParts.length > 0) {
    pdf.text(t('export_preview.headerCompany'), margin, margin);
    pdf.text(contactParts.join(' '), pageWidth - margin, margin, { align: 'right' });
  }

  // --- FOOTER ---
  const signatureString = t('export_preview.signatureLine');
  const signatureWidth = pdf.getStringUnitWidth(signatureString) * pdf.getFontSize() / pdf.internal.scaleFactor;
  pdf.text(signatureString, pageWidth - margin - signatureWidth, pageHeight - margin - 10);
  pdf.line(pageWidth - margin - signatureWidth - 2, pageHeight - margin - 12, pageWidth - margin, pageHeight - margin - 12);

  // --- CONTENT ---
  const imgWidth = canvas.width;
  const imgHeight = canvas.height;
  const contentWidth = pageWidth - (margin * 2);
  const contentHeight = pageHeight - (margin * 2) - 20; // available height for image
  
  const ratio = imgWidth / imgHeight;
  let finalImgWidth = contentWidth;
  let finalImgHeight = finalImgWidth / ratio;

  if (finalImgHeight > contentHeight) {
    finalImgHeight = contentHeight;
    finalImgWidth = finalImgHeight * ratio;
  }
  
  const x = (pageWidth - finalImgWidth) / 2;
  const y = margin + 10;

  pdf.addImage(imgData, 'PNG', x, y, finalImgWidth, finalImgHeight);

  // --- SAVE ---
  pdf.save(`Stundenzettel_${user?.displayName || 'Export'}_${format(selectedMonth, "yyyy-MM")}.pdf`);
};
