export interface Item {
    id: string;
    name: string;
    category: string;
    totalStock: number;
    rentedStock: number;
    color: string;
    pricing: Record<string, number>;
}

export interface Rental {
    id: string;
    itemId: string;
    renterName: string;
    startTime: string;
    durationMinutes: number;
    price: number;
}

export interface HistoryEntry {
    id: string;
    itemId: string;
    renterName: string;
    returnDate: string;
    status: string;
    durationMinutes: number;
    price: number;
}

export interface UserProfile {
    rentalName: string;
    photoURL: string | null;
}
