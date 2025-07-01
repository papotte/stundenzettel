import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { format } from "date-fns";
import type { AuthenticatedUser } from "@/lib/types";
import type { UserSettings } from "@/lib/types";

interface PdfExportParams {
  selectedMonth: Date;
  user: AuthenticatedUser;
  userSettings: UserSettings;
  t: (key: string, replacements?: Record<string, string | number>) => string;
}

export const exportToPdf = async ({
  selectedMonth,
  user,
  userSettings,
  t,
}: PdfExportParams) => {
  const printableArea = document.querySelector('.printable-area') as HTMLElement | null;
  const headerElement = document.getElementById('pdf-header-section') as HTMLElement | null;
  const mainElement = document.getElementById('pdf-main-section') as HTMLElement | null;
  const footerElement = document.getElementById('pdf-footer-section') as HTMLElement | null;

  if (!printableArea || !headerElement || !mainElement || !footerElement) {
    console.error("Required elements for PDF export not found in the DOM.");
    return;
  }

  // Store original styles
  const headerOriginalDisplay = headerElement.style.display;
  const footerOriginalDisplay = footerElement.style.display;
  const printableOriginalBg = printableArea.style.backgroundColor;

  // Temporarily modify for capture
  headerElement.style.display = 'none';
  footerElement.style.display = 'none';
  printableArea.style.backgroundColor = 'white';

  const canvas = await html2canvas(mainElement, {
    scale: 2, // Higher scale for better quality
    useCORS: true,
    backgroundColor: 'white',
  });

  // Restore original styles
  headerElement.style.display = headerOriginalDisplay;
  footerElement.style.display = footerOriginalDisplay;
  printableArea.style.backgroundColor = printableOriginalBg;

  const imgData = canvas.toDataURL('image/png');
  const pdf = new jsPDF({
    orientation: 'p',
    unit: 'mm',
    format: 'a4',
  });

  const pageHeight = pdf.internal.pageSize.getHeight();
  const pageWidth = pdf.internal.pageSize.getWidth();
  const margin = 10;
  let cursorY = margin;

  // --- PDF HEADER ---
  const companyHeaderText = (headerElement.querySelector('div')?.textContent || '').replace('Name and Phone / Radio:', '').trim();
  pdf.setFontSize(8);
  pdf.text(t('export_preview.headerCompany'), margin, cursorY);
  pdf.text(companyHeaderText, pageWidth - margin, cursorY, { align: 'right' });
  cursorY += 5;

  const titleText = headerElement.querySelector('h1')?.textContent || '';
  const userText = headerElement.querySelector('div:last-child')?.textContent || '';
  pdf.setFontSize(12);
  pdf.text(titleText, margin, cursorY, { align: 'left' });
  pdf.setFontSize(10);
  pdf.text(userText, pageWidth - margin, cursorY, { align: 'right' });
  cursorY += 10;
  
  // --- PDF CONTENT (CANVAS IMAGE) ---
  const imgWidth = canvas.width;
  const imgHeight = canvas.height;
  const contentWidth = pageWidth - (margin * 2);
  const contentHeight = pageHeight - cursorY - 30; // available height for image, leave 30mm for footer
  
  const ratio = imgWidth / imgHeight;
  let finalImgWidth = contentWidth;
  let finalImgHeight = finalImgWidth / ratio;

  if (finalImgHeight > contentHeight) {
    finalImgHeight = contentHeight;
    finalImgWidth = finalImgHeight * ratio;
  }
  
  pdf.addImage(imgData, 'PNG', margin, cursorY, finalImgWidth, finalImgHeight);

  // --- PDF FOOTER ---
  const signatureString = footerElement.textContent || t('export_preview.signatureLine');
  pdf.setFontSize(10);
  const signatureX = pageWidth - margin - 80;
  const signatureY = pageHeight - 20;
  pdf.line(signatureX, signatureY, pageWidth - margin, signatureY); // Signature line
  pdf.text(signatureString, signatureX + 40, signatureY + 5, { align: 'center'});


  // --- SAVE ---
  pdf.save(`Stundenzettel_${user.displayName || 'Export'}_${format(selectedMonth, "yyyy-MM")}.pdf`);
};
