export interface PricingMap {
    [durationMinutes: string]: number;
}

export interface InventoryItem {
    id: string;
    name: string;
    category: string;
    totalStock: number;
    rentedStock: number;
    color: string;
    pricing: PricingMap;
}

export interface Rental {
    id: string;
    itemId: string;
    renterName: string;
    startTime: string; // ISO String
    durationMinutes: number;
    price: number;
}

export interface HistoryEntry {
    id: string;
    itemId: string;
    renterName: string;
    returnDate: string; // YYYY-MM-DD
    status: string;
    durationMinutes: number;
    price: number;
}

export interface UserProfile {
    rentalName?: string;
    photoURL?: string;
}

export interface DashboardStats {
    totalRevenue: number;
    totalItems: number;
    onRent: number;
    available: number;
}
