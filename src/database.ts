// Simulating a more robust database layer
export class LocalDatabase<T> {
    private key: string;

    constructor(key: string) {
        this.key = key;
    }

    public selectAll(): T[] {
        try {
            const item = localStorage.getItem(this.key);
            return item ? JSON.parse(item) : [];
        } catch (e) {
            console.error(`DB Error: Failed to load ${this.key}`, e);
            return [];
        }
    }

    public insert(item: T): void {
        const data = this.selectAll();
        data.push(item);
        this.save(data);
    }

    public update(predicate: (item: T) => boolean, updater: (item: T) => T): void {
        let data = this.selectAll();
        data = data.map(item => predicate(item) ? updater(item) : item);
        this.save(data);
    }

    public delete(predicate: (item: T) => boolean): void {
        const data = this.selectAll();
        const newData = data.filter(item => !predicate(item));
        this.save(newData);
    }

    public find(predicate: (item: T) => boolean): T | undefined {
        return this.selectAll().find(predicate);
    }

    public save(data: T[]): void {
        try {
            localStorage.setItem(this.key, JSON.stringify(data));
        } catch (e) {
            console.error(`DB Error: Failed to save ${this.key}`, e);
            alert("Storage full! Cannot save data.");
        }
    }
}

// Singleton for Profile (Object instead of Array)
export class ProfileDatabase {
    private key: string;

    constructor(key: string) {
        this.key = key;
    }

    public get(): any {
        try {
            const item = localStorage.getItem(this.key);
            return item ? JSON.parse(item) : {};
        } catch (e) {
            return {};
        }
    }

    public save(data: any): void {
        localStorage.setItem(this.key, JSON.stringify(data));
    }
}
