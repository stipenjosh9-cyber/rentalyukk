// Imports will be handled by our manual bundle construction since we can't run webpack/esbuild
import { BillingSystem } from "./billing";
import { UIManager } from "./ui";

const billing = new BillingSystem();
const ui = new UIManager();

// Expose to window for global access if needed
(window as any).app = {
    billing,
    ui
};

document.addEventListener("DOMContentLoaded", () => {
    ui.initAnimations();
});
