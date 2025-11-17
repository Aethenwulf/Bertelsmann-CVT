'use client';

import { useEffect, useState } from 'react';
import { PDFDocument, StandardFonts } from 'pdf-lib';
import Box from '@mui/material/Box';
import { Typography } from '@mui/material';

import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';
import { DashboardContent } from 'src/layouts/dashboard';
import { paths } from 'src/routes/paths';

import { drawHeader } from '../header';
import { drawFooter } from '../footer';
import { addSection1 } from '../section-1';
import { addSection2 } from '../section-2';
import { addSection3 } from '../section-3';

// ----------------------------------------------------------------------

export function EINForm() {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  useEffect(() => {
    const generatePdf = async () => {
      const pdfDoc = await PDFDocument.create();
      const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      const fontSize = 11;
      const form = pdfDoc.getForm();

      // ---------------- First Page ----------------
      const page1 = pdfDoc.addPage([612, 792]);

      await drawHeader(pdfDoc, page1, boldFont);
      addSection1(page1, form, boldFont, fontSize);
      addSection2(page1, form, boldFont, fontSize);
      addSection3(page1, form, boldFont, fontSize);
      await drawFooter(page1, 1, 2);

      // ---------------- Second Page ----------------
      const page2 = pdfDoc.addPage([612, 792]);

      await drawHeader(pdfDoc, page2, boldFont);
      await drawFooter(page2, 2, 2);

      // ---------------- Save ----------------
      const pdfBytes = await pdfDoc.save();
      const safeBytes = new Uint8Array(pdfBytes);
      const blob = new Blob([safeBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      setPdfUrl(url);
    };

    generatePdf();
  }, []);

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="Employee Infringement Notice "
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          { name: 'Form', href: paths.dashboard.pdf.ein },
          { name: 'EIN' },
        ]}
        sx={{ mb: 3 }}
      />
      <Box sx={{ width: '100%', height: '100%' }}>
        {pdfUrl ? (
          <iframe
            src={pdfUrl}
            style={{ width: '100%', height: '70vh', border: 'none' }}
            title="PDF Form"
          />
        ) : (
          <Typography>Generating PDF…</Typography>
        )}
      </Box>
    </DashboardContent>
  );
}
