import { PDFFont, rgb } from 'pdf-lib';
import { dropdowns } from './dropdown/list';

export function addSection2(page: any, form: any, fieldFont: PDFFont, fontSize: number) {
  page.drawRectangle({
    x: 0,
    y: 545,
    width: 612,
    height: 16,
    color: rgb(48 / 255, 84 / 255, 150 / 255),
  });

  page.drawText('Type of Offence', {
    x: 25,
    y: 550,
    size: fontSize,
    font: fieldFont,
    color: rgb(1, 1, 1),
  });

  page.drawText('Category of Incident', { x: 60, y: 525, size: fontSize });
  const incidentCategoryField = form.createTextField('incident.category');
  incidentCategoryField.addToPage(page, {
    x: 200,
    y: 520,
    width: 100,
    height: 15,
    borderWidth: 0,
    borderColor: undefined,
    backgroundColor: undefined,
  });

  page.drawText('Sub Category', { x: 360, y: 525, size: fontSize });
  const incidentSubCategoryField = form.createTextField('incident.subCategory');
  incidentSubCategoryField.addToPage(page, {
    x: 440,
    y: 520,
    width: 100,
    height: 15,
    borderWidth: 0,
    borderColor: undefined,
    backgroundColor: undefined,
  });

  page.drawText('Coaching', { x: 60, y: 500, size: fontSize });
  const incidentCoachingField = form.createCheckBox('incident.coaching');
  incidentCoachingField.addToPage(page, {
    x: 170,
    y: 495,
    width: 15,
    height: 15,
    borderWidth: 0,
    borderColor: undefined,
    backgroundColor: undefined,
  });

  page.drawText('Verbal Warning', { x: 230, y: 500, size: fontSize });
  const verbalWarningField = form.createCheckBox('verbal.warning');
  verbalWarningField.addToPage(page, {
    x: 350,
    y: 495,
    width: 15,
    height: 15,
    borderWidth: 0,
    borderColor: undefined,
    backgroundColor: undefined,
  });

  page.drawText('Written Warning', { x: 410, y: 500, size: fontSize });
  const writtenWarningField = form.createCheckBox('written.warning');
  writtenWarningField.addToPage(page, {
    x: 520,
    y: 495,
    width: 15,
    height: 15,
    borderWidth: 0,
    borderColor: undefined,
    backgroundColor: undefined,
  });

  page.drawText('Suspension No Pay', { x: 60, y: 480, size: fontSize });
  const suspensionField = form.createCheckBox('incident.suspension');
  suspensionField.addToPage(page, {
    x: 170,
    y: 475,
    width: 15,
    height: 15,
    borderWidth: 0,
    borderColor: undefined,
    backgroundColor: undefined,
  });

  page.drawText('Final Written Warning', { x: 230, y: 480, size: fontSize });
  const finalWarningField = form.createCheckBox('final.warning');
  finalWarningField.addToPage(page, {
    x: 350,
    y: 475,
    width: 15,
    height: 15,
    borderWidth: 0,
    borderColor: undefined,
    backgroundColor: undefined,
  });

  page.drawText('Termination', { x: 410, y: 480, size: fontSize });
  const terminationField = form.createCheckBox('verbal.termination');
  terminationField.addToPage(page, {
    x: 520,
    y: 475,
    width: 15,
    height: 15,
    borderWidth: 0,
    borderColor: undefined,
    backgroundColor: undefined,
  });

  const conduct01Field = form.createDropdown('conduct.01');
  conduct01Field.addOptions(dropdowns.description);
  conduct01Field.select('Engaging in horseplay');
  conduct01Field.addToPage(page, {
    x: 60,
    y: 450,
    width: 480,
    height: 15,
    borderWidth: 0,
    borderColor: undefined,
    backgroundColor: undefined,
  });

  const conduct02Field = form.createDropdown('conduct.02');
  conduct02Field.addOptions(dropdowns.description);
  conduct02Field.select('');
  conduct02Field.addToPage(page, {
    x: 60,
    y: 435,
    width: 480,
    height: 15,
    borderWidth: 0,
    borderColor: undefined,
    backgroundColor: undefined,
  });

  const conduct03Field = form.createDropdown('conduct.03');
  conduct03Field.addOptions(dropdowns.description);
  conduct03Field.select('');
  conduct03Field.addToPage(page, {
    x: 60,
    y: 420,
    width: 480,
    height: 15,
    borderWidth: 0,
    borderColor: undefined,
    backgroundColor: undefined,
  });

  const conduct04Field = form.createDropdown('conduct.04');
  conduct04Field.addOptions(dropdowns.description);
  conduct04Field.select('');
  conduct04Field.addToPage(page, {
    x: 60,
    y: 405,
    width: 480,
    height: 15,
    borderWidth: 0,
    borderColor: undefined,
    backgroundColor: undefined,
  });

  const conduct05Field = form.createDropdown('conduct.05');
  conduct05Field.addOptions(dropdowns.description);
  conduct05Field.select('');
  conduct05Field.addToPage(page, {
    x: 60,
    y: 390,
    width: 480,
    height: 15,
    borderWidth: 0,
    borderColor: undefined,
    backgroundColor: undefined,
  });
}
