import { PDFFont, rgb } from 'pdf-lib';

export function addSection3(page: any, form: any, fieldFont: PDFFont, fontSize: number) {
  page.drawRectangle({
    x: 0,
    y: 365,
    width: 612,
    height: 16,
    color: rgb(48 / 255, 84 / 255, 150 / 255),
  });
  page.drawText('Description of Infraction by Employee', { x: 60, y: 345, size: fontSize });

  const situationLine01Field = form.createTextField('situation.01');
  situationLine01Field.addToPage(page, {
    x: 60,
    y: 320,
    width: 480,
    height: 15,
    borderWidth: 0,
    borderColor: undefined,
    backgroundColor: undefined,
  });
  const situationLine02Field = form.createTextField('situation.02');
  situationLine02Field.addToPage(page, {
    x: 60,
    y: 305,
    width: 480,
    height: 15,
    borderWidth: 0,
    borderColor: undefined,
    backgroundColor: undefined,
  });
  const situationLine03Field = form.createTextField('situation.03');
  situationLine03Field.addToPage(page, {
    x: 60,
    y: 290,
    width: 480,
    height: 15,
    borderWidth: 0,
    borderColor: undefined,
    backgroundColor: undefined,
  });
  const situationLine04Field = form.createTextField('situation.04');
  situationLine04Field.addToPage(page, {
    x: 60,
    y: 275,
    width: 480,
    height: 15,
    borderWidth: 0,
    borderColor: undefined,
    backgroundColor: undefined,
  });
  const situationLine05Field = form.createTextField('situation.05');
  situationLine05Field.addToPage(page, {
    x: 60,
    y: 260,
    width: 480,
    height: 15,
    borderWidth: 0,
    borderColor: undefined,
    backgroundColor: undefined,
  });

  page.drawText('Plan for Improvement by Team Leader', {
    x: 60,
    y: 240,
    size: fontSize,
  });

  const situationLine06Field = form.createTextField('situation.06');
  situationLine06Field.addToPage(page, {
    x: 60,
    y: 215,
    width: 480,
    height: 15,
    borderWidth: 0,
    borderColor: undefined,
    backgroundColor: undefined,
  });
  const situationLine07Field = form.createTextField('situation.07');
  situationLine07Field.addToPage(page, {
    x: 60,
    y: 200,
    width: 480,
    height: 15,
    borderWidth: 0,
    borderColor: undefined,
    backgroundColor: undefined,
  });
  const situationLine08Field = form.createTextField('situation.08');
  situationLine08Field.addToPage(page, {
    x: 60,
    y: 185,
    width: 480,
    height: 15,
    borderWidth: 0,
    borderColor: undefined,
    backgroundColor: undefined,
  });
  const situationLine09Field = form.createTextField('situation.09');
  situationLine09Field.addToPage(page, {
    x: 60,
    y: 170,
    width: 480,
    height: 15,
    borderWidth: 0,
    borderColor: undefined,
    backgroundColor: undefined,
  });
  const situationLine10Field = form.createTextField('situation.10');
  situationLine10Field.addToPage(page, {
    x: 60,
    y: 155,
    width: 480,
    height: 15,
    borderWidth: 0,
    borderColor: undefined,
    backgroundColor: undefined,
  });

  page.drawText('Date of last Infraction', { x: 60, y: 130, size: fontSize });
  const lastInfractionField = form.createTextField('last.infraction');
  lastInfractionField.addToPage(page, {
    x: 290,
    y: 125,
    width: 250,
    height: 15,
    borderWidth: 0,
    borderColor: undefined,
    backgroundColor: undefined,
  });

  page.drawText('Consequences of Further Infractions', { x: 60, y: 105, size: fontSize });
  const furtherInfractionField = form.createTextField('further.infraction');
  furtherInfractionField.addToPage(page, {
    x: 290,
    y: 100,
    width: 250,
    height: 15,
    borderWidth: 0,
    borderColor: undefined,
    backgroundColor: undefined,
  });
}
