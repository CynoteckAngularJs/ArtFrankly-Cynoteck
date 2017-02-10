export interface IFormListItem {
  '@id'?: string
}

export interface IFormList {
  items: IFormListItem[];
  find(id: string): IFormListItem;
  remove(id: string): IFormListItem;
  add(IFormListItem): void;
}

export class FormListModel implements IFormList {
  items: IFormListItem[] = [];

  constructor(items: IFormListItem[] = []) {
    this.items = [...items];
  }

  isItem(id: string) {
    return (item: IFormListItem) => {
      return item['@id'] === id; 
    }
  }

  find(id: string): IFormListItem {
    return this.items.find(this.isItem(id));
  }

  remove(id: string): IFormListItem {
    let removedItem: IFormListItem;
    let index = this.items.indexOf(this.isItem(id));
    if (index >= 0) {
      removedItem = Object.assign({}, this.items[index]);
      this.items = [
        ...this.items.slice(0, index),
        ...this.items.slice(index+1),
      ];
    }
    return removedItem;
  }

  add(item: IFormListItem): void {
    this.items = [...this.items, item];
  }
}
