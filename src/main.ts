import { LocalDatabase, ProfileDatabase } from './database';
import { InvoiceGenerator } from './invoice';
import { UIAnimator } from './ui';
import { InventoryItem, Rental, HistoryEntry, UserProfile, PricingMap } from './types';

// Constants
const STORAGE_KEYS = {
    INVENTORY: 'rentalyuk_inventory',
    RENTALS: 'rentalyuk_rentals',
    HISTORY: 'rentalyuk_history',
    PROFILE: 'rentalyuk_profile'
};

const DEFAULT_PRICING_MAP: PricingMap = {
    "30": 0, "60": 0, "120": 0, "180": 0, "240": 0, "300": 0, "360": 0,
    "420": 0, "480": 0, "540": 0, "600": 0, "660": 0, "720": 0, "780": 0,
    "840": 0, "900": 0, "960": 0, "1020": 0, "1080": 0, "1140": 0, "1200": 0,
    "1260": 0, "1320": 0, "1380": 0, "1440": 0
};

// Databases
const inventoryDB = new LocalDatabase<InventoryItem>(STORAGE_KEYS.INVENTORY);
const rentalsDB = new LocalDatabase<Rental>(STORAGE_KEYS.RENTALS);
const historyDB = new LocalDatabase<HistoryEntry>(STORAGE_KEYS.HISTORY);
const profileDB = new ProfileDatabase(STORAGE_KEYS.PROFILE);

// State
let confirmCallback: (() => void) | null = null;
let countdownTimerInterval: any = null;
let selectedSettingsPicDataUrl: string | null = null;
let selectedSetupPicDataUrl: string | null = null;
let statsChart: any = null;

// Declare external libs
declare const Chart: any;

// DOM Selectors (Simplified for brevity, assuming IDs exist)
const getEl = (id: string) => document.getElementById(id) as HTMLElement;
const getInp = (id: string) => document.getElementById(id) as HTMLInputElement;

// App Logic
class App {
    static init() {
        console.log("Initializing RentalYuk Pro (TypeScript Edition)...");
        this.checkSetup();
    }

    static checkSetup() {
        const profile = profileDB.get();
        if (!profile.rentalName) {
            this.openModal(getEl('setup-modal'));
        } else {
            this.startApp();
        }
    }

    static startApp() {
        this.renderAll();
        this.setupEventListeners();
        this.startTimer();
        UIAnimator.animateEntry('.bg-gray-800'); // Animate dashboard cards
    }

    static renderAll() {
        this.updateProfileUI();
        this.renderInventory();
        this.renderRentals();
        this.renderHistory();
        this.updateStats();
        // Stats page rendering is triggered on navigation
    }

    static startTimer() {
        if (countdownTimerInterval) clearInterval(countdownTimerInterval);
        countdownTimerInterval = setInterval(() => this.updateCountdowns(), 1000);
    }

    static updateCountdowns() {
        document.querySelectorAll('[classid="countdown-cell"]').forEach((cell: any) => {
            const startTimeStr = cell.dataset.startTime;
            const duration = parseInt(cell.dataset.durationMinutes || '0');
            if (!startTimeStr) return;

            const start = new Date(startTimeStr).getTime();
            const end = start + (duration * 60 * 1000);
            const now = new Date().getTime();
            const remaining = end - now;

            if (remaining <= 0) {
                cell.textContent = "Waktu Habis";
                cell.classList.remove('text-yellow-400');
                cell.classList.add('text-red-500');
            } else {
                cell.textContent = this.formatTime(remaining);
            }
        });
    }

    static formatTime(ms: number) {
        let s = Math.floor(ms / 1000);
        let m = Math.floor(s / 60);
        let h = Math.floor(m / 60);
        s %= 60; m %= 60;
        const pad = (n: number) => n.toString().padStart(2, '0');
        return `${pad(h)}:${pad(m)}:${pad(s)}`;
    }

    static updateProfileUI() {
        const profile = profileDB.get();
        const name = profile.rentalName || "Rental";
        getEl('dashboard-greeting').textContent = `Selamat datang di ${name}!`;
        getInp('settings-rental-name').value = name;

        if (profile.photoURL) {
            (getEl('sidebar-profile-pic') as HTMLImageElement).src = profile.photoURL;
            getEl('sidebar-profile-pic').classList.remove('hidden');
        }
    }

    static renderInventory() {
        const tbody = getEl('inventory-table-body');
        tbody.innerHTML = '';
        const items = inventoryDB.selectAll();

        if (items.length === 0) {
            tbody.innerHTML = `<tr><td colspan="5" class="px-4 py-3 text-center text-gray-500">Inventaris kosong.</td></tr>`;
            getEl('seed-data-btn').classList.remove('hidden');
            return;
        }
        getEl('seed-data-btn').classList.add('hidden');

        items.forEach(item => {
            const avail = item.totalStock - item.rentedStock;
            const row = document.createElement('tr');
            row.innerHTML = `
                <td class="px-4 py-3 whitespace-nowrap"><div class="text-sm font-medium text-gray-100">${item.name}</div></td>
                <td class="px-4 py-3 whitespace-nowrap"><span class="h-4 w-4 rounded-full inline-block border border-gray-600" style="background-color: ${item.color}"></span></td>
                <td class="px-4 py-3 whitespace-nowrap text-sm font-bold ${avail > 0 ? 'text-green-400' : 'text-gray-500'}">${avail}</td>
                <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-300">${item.totalStock}</td>
                <td class="px-4 py-3 whitespace-nowrap text-right text-sm font-medium space-x-2">
                    <button data-id="${item.id}" class="edit-stock-btn text-blue-400 hover:text-blue-600 text-xs">Stok</button>
                    <button data-id="${item.id}" class="delete-item-btn text-red-500 hover:text-red-700 text-xs" ${item.rentedStock > 0 ? 'disabled' : ''}>Hapus</button>
                </td>
            `;
            tbody.appendChild(row);
        });

        // Re-attach listeners for dynamic buttons
        tbody.querySelectorAll('.edit-stock-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = (e.target as HTMLElement).dataset.id;
                if(id) this.openStockModal(id);
            });
        });

         tbody.querySelectorAll('.delete-item-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = (e.target as HTMLElement).dataset.id;
                 if(id) {
                     this.showConfirm("Hapus item ini?", () => {
                         inventoryDB.delete(i => i.id === id);
                         this.renderInventory();
                         this.updateStats();
                     });
                 }
            });
        });
    }

    static openStockModal(id: string) {
        const item = inventoryDB.find(i => i.id === id);
        if (!item) return;
        getInp('stock-item-id').value = id;
        getEl('stock-item-name').textContent = item.name;
        this.openModal(getEl('stock-modal'));
    }

    static renderRentals() {
        const tbody = getEl('rentals-table-body');
        const rptBody = getEl('laporan-table-body');

        tbody.innerHTML = '';
        if(rptBody) rptBody.innerHTML = '';

        const rentals = rentalsDB.selectAll();

        if (rentals.length === 0) {
            tbody.innerHTML = `<tr><td colspan="4" class="px-6 py-4 text-center text-gray-500">Tidak ada data sewa aktif.</td></tr>`;
            return;
        }

        rentals.forEach(rental => {
            const item = inventoryDB.find(i => i.id === rental.itemId);
            const itemName = item ? item.name : "Unknown";

            // Dashboard Table
            const row = document.createElement('tr');
            row.innerHTML = `
                <td class="px-6 py-4 whitespace-nowrap"><div class="text-sm font-medium text-gray-100">${itemName}</div></td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-300">${rental.renterName}</td>
                 <td classid="countdown-cell" class="px-6 py-4 whitespace-nowrap text-sm font-semibold text-yellow-400"
                    data-start-time="${rental.startTime}" data-duration-minutes="${rental.durationMinutes}">...</td>
                <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                     <button data-id="${rental.id}" class="return-btn text-red-500 hover:text-red-700 font-semibold transition-colors">Selesai</button>
                     <button data-id="${rental.id}" class="invoice-btn bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded ml-2 text-xs">Invoice</button>
                </td>
            `;
            tbody.appendChild(row);

            // Report Table
             if(rptBody) {
                const rRow = document.createElement('tr');
                rRow.innerHTML = `
                    <td class="px-6 py-4"><span class="text-sm font-medium text-green-400">Online</span></td>
                    <td class="px-6 py-4 text-sm text-gray-300">${rental.renterName}</td>
                    <td class="px-6 py-4 text-sm text-gray-100">${itemName}</td>
                    <td class="px-6 py-4 text-sm text-green-400">Rp ${rental.price}</td>
                    <td classid="countdown-cell" data-start-time="${rental.startTime}" data-duration-minutes="${rental.durationMinutes}" class="px-6 py-4 text-yellow-400 font-bold">...</td>
                `;
                rptBody.appendChild(rRow);
            }
        });

        // Listeners
        tbody.querySelectorAll('.return-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.handleReturn((e.target as HTMLElement).dataset.id!));
        });
        tbody.querySelectorAll('.invoice-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.generateInvoice((e.target as HTMLElement).dataset.id!));
        });

        this.updateCountdowns();
        UIAnimator.animateEntry('#rentals-table-body tr');
    }

    static handleReturn(rentalId: string) {
        const rental = rentalsDB.find(r => r.id === rentalId);
        if (!rental) return;

        // Move to history
        historyDB.insert({
            id: crypto.randomUUID(),
            itemId: rental.itemId,
            renterName: rental.renterName,
            returnDate: new Date().toISOString().split('T')[0],
            status: 'Selesai',
            durationMinutes: rental.durationMinutes,
            price: rental.price
        });

        // Update inventory
        inventoryDB.update(i => i.id === rental.itemId, i => {
            i.rentedStock = Math.max(0, i.rentedStock - 1);
            return i;
        });

        // Remove rental
        rentalsDB.delete(r => r.id === rentalId);

        this.renderAll();
    }

    static generateInvoice(rentalId: string) {
        const rental = rentalsDB.find(r => r.id === rentalId);
        if (!rental) return;
        const item = inventoryDB.find(i => i.id === rental.itemId);
        InvoiceGenerator.generate(rental, item);
    }

    static renderHistory() {
        const tbody = getEl('history-table-body');
        tbody.innerHTML = '';
        const history = historyDB.selectAll();

        if(history.length === 0) {
            tbody.innerHTML = `<tr><td colspan="5" class="px-4 py-3 text-center text-gray-500">Belum ada histori.</td></tr>`;
            return;
        }

        // Sort latest first
        history.sort((a, b) => b.returnDate.localeCompare(a.returnDate));

        history.forEach(h => {
             const item = inventoryDB.find(i => i.id === h.itemId);
             const row = document.createElement('tr');
             row.innerHTML = `
                <td class="px-4 py-3 text-sm text-gray-100">${item?.name || 'Deleted'}</td>
                <td class="px-4 py-3 text-sm text-gray-300">${h.renterName}</td>
                <td class="px-4 py-3 text-sm text-gray-300">${h.durationMinutes} Min</td>
                <td class="px-4 py-3 text-sm text-green-400">Rp ${h.price}</td>
                <td class="px-4 py-3"><span class="px-3 py-1 text-xs rounded-full bg-green-800 text-green-200">Selesai</span></td>
             `;
             tbody.appendChild(row);
        });
    }

    static updateStats() {
        const items = inventoryDB.selectAll();
        const history = historyDB.selectAll();

        const totalRev = history.reduce((sum, h) => sum + h.price, 0);
        const totalItems = items.reduce((sum, i) => sum + i.totalStock, 0);
        const onRent = items.reduce((sum, i) => sum + i.rentedStock, 0);
        const avail = totalItems - onRent;

        UIAnimator.animateNumber(getEl('stat-total-revenue'), totalRev, 'Rp ');
        getEl('stat-total-items').textContent = totalItems.toString();
        getEl('stat-on-rent').textContent = onRent.toString();
        getEl('stat-available').textContent = avail.toString();
    }

    static populateItemDropdown() {
        const ul = getEl('item-select-options');
        ul.innerHTML = '';
        const items = inventoryDB.selectAll().filter(i => (i.totalStock - i.rentedStock) > 0);

        if (items.length === 0) {
             ul.innerHTML = '<li class="dropdown-option text-gray-400">Habis / Kosong</li>';
             return;
        }

        items.forEach(item => {
            const li = document.createElement('li');
            li.className = 'dropdown-option';
            li.textContent = `${item.name} (Sisa: ${item.totalStock - item.rentedStock})`;
            li.dataset.value = item.id;
            ul.appendChild(li);
        });
    }

    // --- Modal & UI Handlers ---
    static openModal(modal: HTMLElement) {
        modal.classList.remove('hidden');
        modal.classList.add('flex');
        const content = modal.querySelector('.modal-content-area') as HTMLElement;
        if(content) UIAnimator.animateModalOpen(content);
    }

    static closeModal(modal: HTMLElement) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }

    static showConfirm(msg: string, callback: () => void) {
        getEl('message-text').textContent = msg;
        getEl('message-ok-btn').onclick = () => {
            callback();
            this.closeModal(getEl('message-modal'));
        };
        getEl('message-cancel-btn').onclick = () => this.closeModal(getEl('message-modal'));
        getEl('message-cancel-btn').classList.remove('hidden');
        this.openModal(getEl('message-modal'));
    }

    static setupEventListeners() {
        // Nav
        ['dashboard', 'inventory', 'stats', 'laporan', 'settings'].forEach(page => {
            getEl(`nav-${page}`)?.addEventListener('click', (e) => {
                e.preventDefault();
                this.navigateTo(page);
            });
        });

        // Rental Modal
        getEl('addRentalBtn').addEventListener('click', () => {
            this.populateItemDropdown();
            this.openModal(getEl('rental-modal'));
        });
        getEl('cancelBtn').addEventListener('click', () => this.closeModal(getEl('rental-modal')));

        // Rental Form Submit
        getEl('rental-form').addEventListener('submit', (e) => {
            e.preventDefault();
            const itemId = getInp('item-select').value;
            const name = getInp('renter-name').value;
            const duration = parseInt(getInp('rental-duration').value || '0');
            const price = parseInt(getInp('rental-price').value || '0');

            if(!itemId || !name || duration <= 0 || price <= 0) return alert("Isi semua data dan pilih paket harga!");

            rentalsDB.insert({
                id: crypto.randomUUID(),
                itemId,
                renterName: name,
                startTime: new Date().toISOString(),
                durationMinutes: duration,
                price
            });

            // Update stock
            inventoryDB.update(i => i.id === itemId, i => {
                i.rentedStock++;
                return i;
            });

            this.closeModal(getEl('rental-modal'));
            this.renderAll();
        });

        // Add Inventory
        getEl('add-inventory-btn').addEventListener('click', () => this.openModal(getEl('inventory-modal')));
        getEl('inventory-cancel-btn').addEventListener('click', () => this.closeModal(getEl('inventory-modal')));
        getEl('inventory-form').addEventListener('submit', (e) => {
            e.preventDefault();
            const id = getInp('item-id').value.toUpperCase();
            const name = getInp('item-name').value;
            const stock = parseInt(getInp('item-stock').value);

            inventoryDB.insert({
                id, name, category: 'General', totalStock: stock, rentedStock: 0, color: '#3b82f6', pricing: DEFAULT_PRICING_MAP
            });
            this.closeModal(getEl('inventory-modal'));
            this.renderInventory();
        });

        // Setup Form
        getEl('setup-form')?.addEventListener('submit', (e) => {
            e.preventDefault();
            profileDB.save({ rentalName: getInp('setup-rental-name').value });
            this.closeModal(getEl('setup-modal'));
            this.startApp();
        });

        // Seed Data
        getEl('seed-data-btn').addEventListener('click', () => {
             inventoryDB.insert({ id: 'PS5', name: 'PlayStation 5', category: 'Console', totalStock: 5, rentedStock: 0, color: '#blue', pricing: DEFAULT_PRICING_MAP});
             this.renderInventory();
        });

        // Custom Dropdown Logic (Simplified for TS)
        const setupDropdown = (triggerId: string, optionsId: string, inputId: string, textId: string, onSelect?: (val: string, el: HTMLElement) => void) => {
            getEl(triggerId).addEventListener('click', () => {
                getEl(optionsId).classList.toggle('open');
            });
            getEl(optionsId).addEventListener('click', (e) => {
                const target = e.target as HTMLElement;
                if(target.classList.contains('dropdown-option')) {
                    const val = target.dataset.value!;
                    getInp(inputId).value = val;
                    getEl(textId).textContent = target.textContent;
                    getEl(optionsId).classList.remove('open');
                    if (onSelect) onSelect(val, target);
                }
            });
        };

        setupDropdown('item-select-trigger', 'item-select-options', 'item-select', 'item-select-text', (itemId) => {
            this.populateDurationDropdown(itemId);
        });

        setupDropdown('rental-duration-trigger', 'rental-duration-options', 'rental-duration', 'rental-duration-text', (val, el) => {
             const price = el.dataset.price || '0';
             getInp('rental-price').value = price;
             getEl('rental-price-display').textContent = `Harga: Rp ${parseInt(price).toLocaleString('id-ID')}`;
        });
    }

    static populateDurationDropdown(itemId: string) {
        const ul = getEl('rental-duration-options');
        ul.innerHTML = '';
        const item = inventoryDB.find(i => i.id === itemId);

        // Reset fields
        getInp('rental-duration').value = '';
        getInp('rental-price').value = '';
        getEl('rental-duration-text').textContent = "Pilih durasi...";
        getEl('rental-price-display').textContent = "Harga: Rp 0";
        (getEl('rental-duration-trigger') as HTMLButtonElement).disabled = true;

        if (!item) return;

        (getEl('rental-duration-trigger') as HTMLButtonElement).disabled = false;

        const prices = Object.entries(item.pricing).filter(([_, p]) => p > 0);
        if (prices.length === 0) {
            ul.innerHTML = '<li class="dropdown-option text-gray-400">Belum ada paket harga</li>';
            return;
        }

        prices.sort((a, b) => parseInt(a[0]) - parseInt(b[0])).forEach(([min, price]) => {
            const li = document.createElement('li');
            li.className = 'dropdown-option';
            li.textContent = `${min} Menit - Rp ${price}`;
            li.dataset.value = min;
            li.dataset.price = price.toString();
            ul.appendChild(li);
        });
    }

    static navigateTo(pageId: string) {
        document.querySelectorAll('main > div').forEach(div => div.classList.add('hidden'));
        const page = getEl(`page-${pageId}`);
        if(page) page.classList.remove('hidden');

        document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
        getEl(`nav-${pageId}`)?.classList.add('active');
    }
}

// Start
App.init();
