import { Rental, InventoryItem } from './types';
import { jsPDF } from 'jspdf';

export class InvoiceGenerator {
    public static generate(rental: Rental, item: InventoryItem | undefined) {
        const doc = new jsPDF();

        const itemName = item ? item.name : "Item Dihapus";
        const date = new Date().toLocaleDateString('id-ID');
        const time = new Date().toLocaleTimeString('id-ID');

        // Header
        doc.setFontSize(22);
        doc.setTextColor(40, 40, 40);
        doc.text("RENTALYUK - INVOICE", 105, 20, { align: "center" });

        doc.setFontSize(12);
        doc.setTextColor(100, 100, 100);
        doc.text("Bukti Pembayaran Sewa", 105, 28, { align: "center" });

        // Line
        doc.setLineWidth(0.5);
        doc.line(20, 35, 190, 35);

        // Content
        let y = 50;
        const addLine = (label: string, value: string) => {
            doc.setFont("helvetica", "bold");
            doc.text(label, 20, y);
            doc.setFont("helvetica", "normal");
            doc.text(value, 80, y);
            y += 10;
        };

        addLine("ID Transaksi:", rental.id.substring(0, 8).toUpperCase());
        addLine("Tanggal:", `${date} ${time}`);
        addLine("Penyewa:", rental.renterName);
        addLine("Barang:", itemName);
        addLine("Durasi:", `${rental.durationMinutes} Menit`);

        y += 5;
        doc.setFontSize(16);
        doc.setTextColor(0, 128, 0);
        addLine("Total Bayar:", `Rp ${rental.price.toLocaleString('id-ID')}`);

        // Footer
        y = 130;
        doc.setFontSize(10);
        doc.setTextColor(150, 150, 150);
        doc.text("Terima kasih telah menyewa di RentalYuk.", 105, y, { align: "center" });
        doc.text("Simpan struk ini sebagai bukti pengembalian.", 105, y + 5, { align: "center" });

        // Save
        doc.save(`invoice_${rental.renterName}_${date}.pdf`);
    }
}
