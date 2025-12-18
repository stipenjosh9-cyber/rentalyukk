import { jsPDF } from "jspdf";
import { Rental, HistoryEntry, Item } from "./types";

declare global {
  interface Window {
    jspdf: any;
  }
}

export class BillingSystem {
    private taxRate: number = 0.11; // 11% PPN

    constructor() {}

    formatCurrency(amount: number): string {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(amount);
    }

    calculateTotalWithTax(price: number): { subtotal: number, tax: number, total: number } {
        const tax = price * this.taxRate;
        return {
            subtotal: price,
            tax: tax,
            total: price + tax
        };
    }

    generateInvoice(rental: Rental | HistoryEntry, item: Item) {
        // Ensure jsPDF is loaded
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        const costs = this.calculateTotalWithTax(rental.price);
        const date = new Date().toLocaleDateString('id-ID');

        // Header
        doc.setFontSize(22);
        doc.setTextColor(40, 40, 40);
        doc.text("INVOICE", 105, 20, { align: "center" });

        // Rental Info
        doc.setFontSize(12);
        doc.setTextColor(100, 100, 100);
        doc.text(`Invoice ID: ${rental.id.substring(0, 8).toUpperCase()}`, 20, 40);
        doc.text(`Date: ${date}`, 20, 46);
        doc.text(`Billed To: ${rental.renterName}`, 20, 52);

        // Line
        doc.setDrawColor(200, 200, 200);
        doc.line(20, 60, 190, 60);

        // Item Details
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(14);
        doc.text("Description", 20, 70);
        doc.text("Amount", 160, 70, { align: "right" });

        doc.setFontSize(12);
        doc.setTextColor(80, 80, 80);
        doc.text(`${item.name} (${item.category})`, 20, 80);
        doc.text(`${rental.durationMinutes} Minutes Rental`, 20, 86);

        doc.text(this.formatCurrency(costs.subtotal), 160, 80, { align: "right" });

        // Totals
        doc.line(20, 100, 190, 100);
        doc.text("Subtotal:", 120, 110);
        doc.text(this.formatCurrency(costs.subtotal), 160, 110, { align: "right" });

        doc.text("Tax (11%):", 120, 116);
        doc.text(this.formatCurrency(costs.tax), 160, 116, { align: "right" });

        doc.setFontSize(14);
        doc.setTextColor(0, 0, 0);
        doc.text("Total:", 120, 126);
        doc.text(this.formatCurrency(costs.total), 160, 126, { align: "right" });

        // Footer
        doc.setFontSize(10);
        doc.setTextColor(150, 150, 150);
        doc.text("Thank you for your business!", 105, 150, { align: "center" });
        doc.text("RentalYuk System", 105, 155, { align: "center" });

        // Save
        doc.save(`invoice_${rental.renterName}_${date}.pdf`);
    }
}
