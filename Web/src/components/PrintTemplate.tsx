import { useRef } from "react";
import { Printer, X, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useTenant } from "@/contexts/TenantContext";
import { Separator } from "@/components/ui/separator";

// ── Types ──

export interface PrintLineItem {
  no: number;
  description: string;
  quantity?: number;
  unit?: string;
  unitPrice?: number;
  amount: number;
  [key: string]: unknown;
}

export interface PrintDocumentData {
  type: "invoice" | "purchase_order" | "quotation" | "receipt" | "financial_statement" | "custom";
  title: string;
  documentNo: string;
  date: string;
  dueDate?: string;
  // Parties
  from?: { name: string; address?: string; phone?: string; email?: string; taxId?: string };
  to?: { name: string; address?: string; phone?: string; email?: string; taxId?: string };
  // Line items
  columns?: string[];
  items: PrintLineItem[];
  // Totals
  subtotal?: number;
  taxRate?: number;
  taxAmount?: number;
  discount?: number;
  total: number;
  currency?: string;
  // Footer
  notes?: string;
  terms?: string;
  preparedBy?: string;
  approvedBy?: string;
  // Custom header fields
  headerFields?: { label: string; value: string }[];
}

interface PrintTemplateProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: PrintDocumentData;
}

const PrintTemplate = ({ open, onOpenChange, data }: PrintTemplateProps) => {
  const printRef = useRef<HTMLDivElement>(null);
  const { currentTenant } = useTenant();

  const currency = data.currency || currentTenant?.currency || "USD";

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency }).format(val);

  const handlePrint = () => {
    const content = printRef.current;
    if (!content) return;

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>${data.title} - ${data.documentNo}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Inter', -apple-system, sans-serif; color: #1a1a2e; font-size: 12px; line-height: 1.5; padding: 40px; }
          .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 30px; }
          .company-name { font-size: 20px; font-weight: 700; color: #1e3a5f; }
          .company-details { font-size: 11px; color: #666; margin-top: 4px; }
          .doc-title { font-size: 24px; font-weight: 700; color: #1e3a5f; text-align: right; text-transform: uppercase; letter-spacing: 1px; }
          .doc-no { font-size: 13px; color: #666; text-align: right; margin-top: 4px; }
          .parties { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-bottom: 24px; }
          .party-label { font-size: 10px; font-weight: 600; color: #999; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 6px; }
          .party-name { font-weight: 600; font-size: 14px; }
          .party-detail { font-size: 11px; color: #555; }
          .meta-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 12px; margin-bottom: 24px; padding: 12px; background: #f8f9fa; border-radius: 6px; }
          .meta-label { font-size: 10px; font-weight: 600; color: #999; text-transform: uppercase; }
          .meta-value { font-size: 13px; font-weight: 500; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
          th { background: #1e3a5f; color: white; padding: 10px 12px; text-align: left; font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
          th:last-child { text-align: right; }
          td { padding: 10px 12px; border-bottom: 1px solid #eee; font-size: 12px; }
          td:last-child { text-align: right; font-variant-numeric: tabular-nums; }
          tr:nth-child(even) { background: #fafbfc; }
          .totals { display: flex; justify-content: flex-end; margin-bottom: 30px; }
          .totals-table { width: 280px; }
          .totals-row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 12px; }
          .totals-row.total { border-top: 2px solid #1e3a5f; padding-top: 10px; margin-top: 6px; font-size: 16px; font-weight: 700; color: #1e3a5f; }
          .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; }
          .notes { font-size: 11px; color: #555; margin-bottom: 16px; }
          .signatures { display: grid; grid-template-columns: 1fr 1fr; gap: 60px; margin-top: 50px; }
          .sig-line { border-top: 1px solid #999; padding-top: 6px; font-size: 11px; color: #666; }
          @media print { body { padding: 20px; } @page { margin: 1cm; } }
        </style>
      </head>
      <body>${content.innerHTML}</body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0">
        {/* Toolbar */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-3 bg-card border-b border-border">
          <DialogTitle className="font-display text-base">Print Preview</DialogTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handlePrint}>
              <Printer className="w-4 h-4 mr-1" /> Print
            </Button>
            <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Print content */}
        <div className="p-8 bg-white" ref={printRef}>
          {/* Header */}
          <div className="header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 30 }}>
            <div>
              <div className="company-name" style={{ fontSize: 20, fontWeight: 700, color: "#1e3a5f" }}>
                {currentTenant?.name || "Company Name"}
              </div>
              <div style={{ fontSize: 11, color: "#666", marginTop: 4 }}>
                {currentTenant?.code && <span>{currentTenant.code} · </span>}
                {data.from?.address || "Company Address"}
              </div>
              {data.from?.phone && <div style={{ fontSize: 11, color: "#666" }}>{data.from.phone}</div>}
              {data.from?.email && <div style={{ fontSize: 11, color: "#666" }}>{data.from.email}</div>}
              {data.from?.taxId && <div style={{ fontSize: 11, color: "#666" }}>Tax ID: {data.from.taxId}</div>}
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 24, fontWeight: 700, color: "#1e3a5f", textTransform: "uppercase", letterSpacing: 1 }}>
                {data.title}
              </div>
              <div style={{ fontSize: 13, color: "#666", marginTop: 4 }}>{data.documentNo}</div>
            </div>
          </div>

          {/* Meta fields */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 12, marginBottom: 24, padding: 12, background: "#f8f9fa", borderRadius: 6 }}>
            <div>
              <div style={{ fontSize: 10, fontWeight: 600, color: "#999", textTransform: "uppercase" }}>Date</div>
              <div style={{ fontSize: 13, fontWeight: 500 }}>{data.date}</div>
            </div>
            {data.dueDate && (
              <div>
                <div style={{ fontSize: 10, fontWeight: 600, color: "#999", textTransform: "uppercase" }}>Due Date</div>
                <div style={{ fontSize: 13, fontWeight: 500 }}>{data.dueDate}</div>
              </div>
            )}
            <div>
              <div style={{ fontSize: 10, fontWeight: 600, color: "#999", textTransform: "uppercase" }}>Currency</div>
              <div style={{ fontSize: 13, fontWeight: 500 }}>{currency}</div>
            </div>
            {data.headerFields?.map((f, i) => (
              <div key={i}>
                <div style={{ fontSize: 10, fontWeight: 600, color: "#999", textTransform: "uppercase" }}>{f.label}</div>
                <div style={{ fontSize: 13, fontWeight: 500 }}>{f.value}</div>
              </div>
            ))}
          </div>

          {/* Bill To */}
          {data.to && (
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 10, fontWeight: 600, color: "#999", textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>
                {data.type === "purchase_order" ? "Supplier" : "Bill To"}
              </div>
              <div style={{ fontWeight: 600, fontSize: 14 }}>{data.to.name}</div>
              {data.to.address && <div style={{ fontSize: 11, color: "#555" }}>{data.to.address}</div>}
              {data.to.phone && <div style={{ fontSize: 11, color: "#555" }}>{data.to.phone}</div>}
              {data.to.email && <div style={{ fontSize: 11, color: "#555" }}>{data.to.email}</div>}
              {data.to.taxId && <div style={{ fontSize: 11, color: "#555" }}>Tax ID: {data.to.taxId}</div>}
            </div>
          )}

          {/* Line Items Table */}
          <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 24 }}>
            <thead>
              <tr>
                <th style={{ background: "#1e3a5f", color: "white", padding: "10px 12px", textAlign: "left", fontSize: 10, fontWeight: 600, textTransform: "uppercase" }}>#</th>
                <th style={{ background: "#1e3a5f", color: "white", padding: "10px 12px", textAlign: "left", fontSize: 10, fontWeight: 600, textTransform: "uppercase" }}>Description</th>
                {data.items[0]?.quantity !== undefined && (
                  <th style={{ background: "#1e3a5f", color: "white", padding: "10px 12px", textAlign: "right", fontSize: 10, fontWeight: 600, textTransform: "uppercase" }}>Qty</th>
                )}
                {data.items[0]?.unitPrice !== undefined && (
                  <th style={{ background: "#1e3a5f", color: "white", padding: "10px 12px", textAlign: "right", fontSize: 10, fontWeight: 600, textTransform: "uppercase" }}>Unit Price</th>
                )}
                <th style={{ background: "#1e3a5f", color: "white", padding: "10px 12px", textAlign: "right", fontSize: 10, fontWeight: 600, textTransform: "uppercase" }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((item, i) => (
                <tr key={i} style={{ background: i % 2 === 1 ? "#fafbfc" : "white" }}>
                  <td style={{ padding: "10px 12px", borderBottom: "1px solid #eee", fontSize: 12 }}>{item.no}</td>
                  <td style={{ padding: "10px 12px", borderBottom: "1px solid #eee", fontSize: 12 }}>
                    {item.description}
                    {item.unit && <span style={{ color: "#999", marginLeft: 4 }}>({item.unit})</span>}
                  </td>
                  {item.quantity !== undefined && (
                    <td style={{ padding: "10px 12px", borderBottom: "1px solid #eee", fontSize: 12, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
                      {item.quantity}
                    </td>
                  )}
                  {item.unitPrice !== undefined && (
                    <td style={{ padding: "10px 12px", borderBottom: "1px solid #eee", fontSize: 12, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
                      {formatCurrency(item.unitPrice)}
                    </td>
                  )}
                  <td style={{ padding: "10px 12px", borderBottom: "1px solid #eee", fontSize: 12, textAlign: "right", fontVariantNumeric: "tabular-nums", fontWeight: 500 }}>
                    {formatCurrency(item.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals */}
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 30 }}>
            <div style={{ width: 280 }}>
              {data.subtotal !== undefined && (
                <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", fontSize: 12 }}>
                  <span style={{ color: "#666" }}>Subtotal</span>
                  <span>{formatCurrency(data.subtotal)}</span>
                </div>
              )}
              {data.discount !== undefined && data.discount > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", fontSize: 12 }}>
                  <span style={{ color: "#666" }}>Discount</span>
                  <span>-{formatCurrency(data.discount)}</span>
                </div>
              )}
              {data.taxAmount !== undefined && (
                <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", fontSize: 12 }}>
                  <span style={{ color: "#666" }}>Tax{data.taxRate ? ` (${data.taxRate}%)` : ""}</span>
                  <span>{formatCurrency(data.taxAmount)}</span>
                </div>
              )}
              <div style={{ display: "flex", justifyContent: "space-between", borderTop: "2px solid #1e3a5f", paddingTop: 10, marginTop: 6, fontSize: 16, fontWeight: 700, color: "#1e3a5f" }}>
                <span>Total</span>
                <span>{formatCurrency(data.total)}</span>
              </div>
            </div>
          </div>

          {/* Notes & Terms */}
          {(data.notes || data.terms) && (
            <div style={{ marginTop: 20 }}>
              {data.notes && (
                <div style={{ fontSize: 11, color: "#555", marginBottom: 8 }}>
                  <strong>Notes:</strong> {data.notes}
                </div>
              )}
              {data.terms && (
                <div style={{ fontSize: 11, color: "#555" }}>
                  <strong>Terms & Conditions:</strong> {data.terms}
                </div>
              )}
            </div>
          )}

          {/* Signatures */}
          {(data.preparedBy || data.approvedBy) && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 60, marginTop: 60 }}>
              {data.preparedBy && (
                <div>
                  <div style={{ borderTop: "1px solid #999", paddingTop: 6, fontSize: 11, color: "#666" }}>
                    Prepared By: {data.preparedBy}
                  </div>
                </div>
              )}
              {data.approvedBy && (
                <div>
                  <div style={{ borderTop: "1px solid #999", paddingTop: 6, fontSize: 11, color: "#666" }}>
                    Approved By: {data.approvedBy}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Footer */}
          <div style={{ marginTop: 40, paddingTop: 16, borderTop: "1px solid #ddd", textAlign: "center", fontSize: 11, color: "#999" }}>
            Thank you for your business
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PrintTemplate;
