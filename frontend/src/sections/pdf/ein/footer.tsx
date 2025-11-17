export async function drawFooter(page: any, pageNumber: number, pageTotal: number) {
  page.drawText(`Page ${pageNumber} of ${pageTotal}`, {
    x: 520,
    y: 20,
    size: 9,
  });
}
