import { PDFDocument, PDFFont } from 'pdf-lib';

import { CONFIG } from 'src/global-config';

export async function drawHeader(pdfDoc: PDFDocument, page: any, boldFont: PDFFont) {
  const { width, height } = page.getSize();

  // Load logo
  const logoBytes = await fetch(`${CONFIG.assetsDir}/logo/logo-full.png`).then((res) =>
    res.arrayBuffer()
  );
  const logoImage = await pdfDoc.embedPng(logoBytes);
  const logoDims = logoImage.scale(0.07);

  const centerX = (width - logoDims.width) / 2;

  // Draw logo
  page.drawImage(logoImage, {
    x: 25,
    y: height - logoDims.height - 10,
    width: logoDims.width,
    height: logoDims.height,
  });

  // Draw title text
  page.drawText('Employee Infringement Notice', {
    x: 350,
    y: height - logoDims.height,
    size: 13,
    font: boldFont,
  });
}
