export interface IDataSource {
    fetch(config: any): Promise<any[]>;
    map(data: any[], mapping: any): any[];
}
