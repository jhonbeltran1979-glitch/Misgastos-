// ============================================================
//  MisGastos — Google Apps Script API
//  Pega este código en: script.google.com → Nuevo proyecto
// ============================================================

const SHEET_NAME = "Gastos";
const HEADERS = ["ID", "Fecha", "FechaHora", "Categoria", "Label", "Icon", "Color", "Monto", "Descripcion"];

// ── Obtener o crear la hoja ──────────────────────────────────
function getSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow(HEADERS);
    // Estilo encabezados
    const header = sheet.getRange(1, 1, 1, HEADERS.length);
    header.setBackground("#ED1C24");
    header.setFontColor("#FFFFFF");
    header.setFontWeight("bold");
    sheet.setFrozenRows(1);
  }
  return sheet;
}

// ── GET — Devuelve todos los gastos como JSON ────────────────
function doGet(e) {
  try {
    const sheet = getSheet();
    const data  = sheet.getDataRange().getValues();
    if (data.length <= 1) {
      return jsonResponse({ gastos: [] });
    }
    const gastos = data.slice(1).map(row => ({
      id:          row[0],
      fecha:       row[1],
      fechaHora:   row[2],
      categoria:   row[3],
      label:       row[4],
      icon:        row[5],
      color:       row[6],
      monto:       parseFloat(row[7]) || 0,
      descripcion: row[8],
    })).filter(g => g.id); // filtrar filas vacías
    return jsonResponse({ gastos });
  } catch (err) {
    return jsonResponse({ error: err.message }, 500);
  }
}

// ── POST — Recibe acción: "add" o "delete" ───────────────────
function doPost(e) {
  try {
    const body   = JSON.parse(e.postData.contents);
    const accion = body.accion;

    if (accion === "add") {
      const g = body.gasto;
      getSheet().appendRow([
        g.id, g.fecha, g.fechaHora, g.categoria,
        g.label, g.icon, g.color, g.monto, g.descripcion
      ]);
      return jsonResponse({ ok: true, id: g.id });
    }

    if (accion === "delete") {
      const sheet = getSheet();
      const data  = sheet.getDataRange().getValues();
      for (let i = 1; i < data.length; i++) {
        if (String(data[i][0]) === String(body.id)) {
          sheet.deleteRow(i + 1);
          return jsonResponse({ ok: true });
        }
      }
      return jsonResponse({ ok: false, msg: "No encontrado" });
    }

    return jsonResponse({ error: "Acción desconocida" }, 400);
  } catch (err) {
    return jsonResponse({ error: err.message }, 500);
  }
}

// ── Helper: respuesta JSON con headers CORS ─────────────────
function jsonResponse(data, code) {
  const output = ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
  return output;
}
