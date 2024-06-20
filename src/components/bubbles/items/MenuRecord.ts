import {BubbleMenuItem} from "../types.ts";

export class MenuRecord {

    private record: Record<string, BubbleMenuItem> = {};

    constructor(menuItems: BubbleMenuItem[]) {
        for (let menuItem of menuItems) {
            this.push(menuItem);
        }
    }

    public push(menuItem: BubbleMenuItem) {
        this.record[menuItem.id.toLowerCase()] = menuItem;
    }

    public getItem(key: string) {
        return this.record[key.toLowerCase()];
    }

    public getAllItem() {
        return Object.values(this.record);
    }
}