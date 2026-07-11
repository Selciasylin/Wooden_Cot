const PDFDocument = require("pdfkit");

// Brand colors — same as the website theme
const BRAND = "#AE946D";
const TEXT = "#2c2c2c";
const MUTED = "#888888";
const BORDER = "#e8e0d5";

// Generate the invoice PDF and stream it straight into the response.
// Nothing is saved to disk or cloud — the PDF is built in memory
// from the order snapshot and sent to the browser as a download.
function generateInvoice(order, res) {
  const doc = new PDFDocument({ size: "A4", margin: 50 });

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename=invoice-${order.orderId}.pdf`
  );

  doc.pipe(res);

  // ── Header ──
  doc
    .fontSize(22)
    .fillColor(BRAND)
    .font("Helvetica-Bold")
    .text("Wooden Cot", 50, 50);

  doc
    .fontSize(9)
    .fillColor(MUTED)
    .font("Helvetica")
    .text("www.woodencot.com", 50, 76);

  doc
    .fontSize(16)
    .fillColor(TEXT)
    .font("Helvetica-Bold")
    .text("INVOICE", 400, 50, { align: "right" });

  doc
    .fontSize(9)
    .fillColor(MUTED)
    .font("Helvetica")
    .text(`Order ID: ${order.orderId}`, 400, 74, { align: "right" })
    .text(
      `Date: ${new Date(order.createdAt).toLocaleDateString("en-IN", {
        year: "numeric",
        month: "long",
        day: "2-digit",
      })}`,
      400,
      88,
      { align: "right" }
    )
    .text(`Payment: ${order.paymentMethod}`, 400, 102, { align: "right" });

  // Divider
  doc.moveTo(50, 125).lineTo(545, 125).strokeColor(BORDER).stroke();

  // ── Billing address (snapshot from the order) ──
  const addr = order.shippingAddress;

  doc
    .fontSize(10)
    .fillColor(BRAND)
    .font("Helvetica-Bold")
    .text("DELIVER TO", 50, 140);

  doc
    .fontSize(10)
    .fillColor(TEXT)
    .font("Helvetica-Bold")
    .text(addr.fullName, 50, 156);

  doc
    .fontSize(9)
    .fillColor(MUTED)
    .font("Helvetica")
    .text(
      `${addr.addressLine1}${addr.addressLine2 ? ", " + addr.addressLine2 : ""}`,
      50,
      170
    )
    .text(`${addr.city}, ${addr.state} - ${addr.zip}`, 50, 183)
    .text(`${addr.country} | Phone: ${addr.phone}`, 50, 196);

  // ── Items table ──
  let y = 235;

  // Table header
  doc.rect(50, y, 495, 22).fill("#f5ede0");
  doc
    .fontSize(9)
    .fillColor("#9a8260")
    .font("Helvetica-Bold")
    .text("PRODUCT", 58, y + 7)
    .text("QTY", 320, y + 7, { width: 40, align: "center" })
    .text("PRICE", 370, y + 7, { width: 75, align: "right" })
    .text("TOTAL", 455, y + 7, { width: 82, align: "right" });

  y += 30;

  // Table rows
  order.items.forEach((item) => {
    const isCancelled = item.status === "Cancelled";
    const nameColor = isCancelled ? MUTED : TEXT;

    doc
      .fontSize(9)
      .fillColor(nameColor)
      .font("Helvetica-Bold")
      .text(item.productName, 58, y, { width: 250 });

    // Variant options + cancelled note
    const variantLine =
      item.variantOptions.join(" / ") +
      (isCancelled ? "  (Cancelled)" : "");

    doc
      .fontSize(8)
      .fillColor(MUTED)
      .font("Helvetica")
      .text(variantLine, 58, y + 12, { width: 250 });

    doc
      .fontSize(9)
      .fillColor(nameColor)
      .font("Helvetica")
      .text(`${item.quantity}`, 320, y + 5, { width: 40, align: "center" })
      .text(`Rs. ${item.price.toLocaleString("en-IN")}`, 370, y + 5, {
        width: 75,
        align: "right",
      })
      .text(`Rs. ${item.itemTotal.toLocaleString("en-IN")}`, 455, y + 5, {
        width: 82,
        align: "right",
      });

    y += 32;
    doc.moveTo(50, y - 6).lineTo(545, y - 6).strokeColor(BORDER).stroke();
  });

  // ── Totals ──
  y += 10;

  function totalRow(label, value, bold = false) {
    doc
      .fontSize(bold ? 11 : 9)
      .fillColor(bold ? TEXT : MUTED)
      .font(bold ? "Helvetica-Bold" : "Helvetica")
      .text(label, 350, y, { width: 100, align: "right" })
      .text(value, 455, y, { width: 82, align: "right" });
    y += bold ? 22 : 16;
  }

  totalRow("Subtotal", `Rs. ${order.subtotal.toLocaleString("en-IN")}`);
  totalRow("Shipping", `Rs. ${order.shippingCost.toLocaleString("en-IN")}`);
  totalRow("Discount", `- Rs. ${(order.discount || 0).toLocaleString("en-IN")}`);

  doc.moveTo(350, y).lineTo(545, y).strokeColor(BORDER).stroke();
  y += 8;

  totalRow(
    "Grand Total",
    `Rs. ${order.totalAmount.toLocaleString("en-IN")}`,
    true
  );

  // ── Footer ──
  doc
    .fontSize(8)
    .fillColor(MUTED)
    .font("Helvetica")
    .text(
      "This is a computer generated invoice. Thank you for shopping with Wooden Cot!",
      50,
      770,
      { align: "center", width: 495 }
    );

  doc.end();
}

module.exports = { generateInvoice };