import { PDFFont, rgb } from 'pdf-lib';
import { dropdowns } from './dropdown/list';

export function addSection1(page: any, form: any, fieldFont: PDFFont, fontSize: number) {
  page.drawRectangle({
    x: 0,
    y: 720,
    width: 612,
    height: 16,
    color: rgb(48 / 255, 84 / 255, 150 / 255),
  });

  page.drawText('Employee Information', {
    x: 25,
    y: 725,
    size: fontSize,
    font: fieldFont,
    color: rgb(1, 1, 1),
  });

  page.drawText('Employee Name', { x: 60, y: 700, size: fontSize });
  const staffNameField = form.createTextField('staff.name');
  staffNameField.addToPage(page, {
    x: 200,
    y: 695,
    width: 340,
    height: 15,
    borderWidth: 0,
    borderColor: undefined,
    backgroundColor: undefined,
  });

  page.drawText('Staff ID', { x: 60, y: 675, size: fontSize });
  const staffIdField = form.createTextField('staff.id');
  staffIdField.addToPage(page, {
    x: 200,
    y: 670,
    width: 340,
    height: 15,
    borderWidth: 0,
    borderColor: undefined,
    backgroundColor: undefined,
  });

  page.drawText('Supervisor', { x: 60, y: 650, size: fontSize });
  const supervisorField = form.createTextField('staff.supervisor');
  supervisorField.addToPage(page, {
    x: 200,
    y: 645,
    width: 340,
    height: 15,
    borderWidth: 0,
    borderColor: undefined,
    backgroundColor: undefined,
  });

  page.drawText('Officiating Officer', { x: 60, y: 625, size: fontSize });
  const officerField = form.createTextField('officiating.officer');
  officerField.addToPage(page, {
    x: 200,
    y: 620,
    width: 340,
    height: 15,
    borderWidth: 0,
    borderColor: undefined,
    backgroundColor: undefined,
  });

  page.drawText('Date', { x: 60, y: 600, size: fontSize });
  const incidentDateField = form.createTextField('report.date');
  incidentDateField.addToPage(page, {
    x: 200,
    y: 595,
    width: 100,
    height: 15,
    borderWidth: 0,
    borderColor: undefined,
    backgroundColor: undefined,
  });

  page.drawText('Job Title', { x: 360, y: 600, size: fontSize });
  const reportDateField = form.createTextField('staff.job');
  reportDateField.addToPage(page, {
    x: 440,
    y: 595,
    width: 100,
    height: 15,
    borderWidth: 0,
    borderColor: undefined,
    backgroundColor: undefined,
  });

  page.drawText('Department', { x: 60, y: 575, size: fontSize });
  const incidentCategoryField = form.createTextField('staff.department');
  incidentCategoryField.addToPage(page, {
    x: 200,
    y: 570,
    width: 340,
    height: 15,
    borderWidth: 0,
    borderColor: undefined,
    backgroundColor: undefined,
  });
}
