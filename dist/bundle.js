// Bundled Code from src/billing.ts and src/ui.ts

(function(global) {
    // === BILLING SYSTEM ===
    class BillingSystem {
        constructor() {
            this.taxRate = 0.11; // 11% PPN
        }

        formatCurrency(amount) {
            return new Intl.NumberFormat('id-ID', {
                style: 'currency',
                currency: 'IDR',
                minimumFractionDigits: 0
            }).format(amount);
        }

        calculateTotalWithTax(price) {
            const tax = price * this.taxRate;
            return {
                subtotal: price,
                tax: tax,
                total: price + tax
            };
        }

        generateInvoice(rental, item) {
            if (!window.jspdf) {
                console.error("jsPDF not loaded");
                alert("Sistem PDF belum siap. Coba refresh halaman.");
                return;
            }
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

    // === UI MANAGER ===
    class UIManager {
        constructor() {}

        initAnimations() {
            if (!window.gsap) return;

            // Sidebar Entrance
            window.gsap.from("aside", {
                duration: 1,
                x: -200,
                opacity: 0,
                ease: "power3.out"
            });

            // Main Content Fade In
            window.gsap.from("main", {
                duration: 1,
                y: 20,
                opacity: 0,
                delay: 0.3,
                ease: "power3.out"
            });

            // Cards Stagger
            window.gsap.from(".grid > div", {
                duration: 0.8,
                y: 30,
                opacity: 0,
                stagger: 0.1,
                delay: 0.5,
                ease: "back.out(1.7)"
            });
        }

        animatePageTransition(newPageId) {
            if (!window.gsap) return;
            const page = document.getElementById(`page-${newPageId}`);
            if(page) {
                 window.gsap.fromTo(page,
                    { opacity: 0, y: 10 },
                    { opacity: 1, y: 0, duration: 0.5, ease: "power2.out" }
                );
            }
        }

        animateModalOpen(modal) {
            const content = modal.querySelector('.modal-content-area');
            if (content && window.gsap) {
                window.gsap.fromTo(content,
                    { scale: 0.8, opacity: 0 },
                    { scale: 1, opacity: 1, duration: 0.4, ease: "elastic.out(1, 0.75)" }
                );
            }
        }
    }

    // Expose to Global
    global.app = {
        billing: new BillingSystem(),
        ui: new UIManager()
    };

    // Initialize Animations
    document.addEventListener("DOMContentLoaded", () => {
        global.app.ui.initAnimations();
    });

    console.log("RentalYuk Bundle Loaded");

})(window);
