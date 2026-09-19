/** 单元测试使用的最小 VS Code API 替身，不控制实际编辑器。 */
export class EventEmitter<T>{event=()=>undefined;fire(_value:T):void{}dispose():void{}}
export class DataTransferItem{constructor(public value:unknown){}async asString(){return String(this.value)}}
export class DataTransfer extends Map<string,DataTransferItem>{}
export class ThemeColor{constructor(public id:string){}}
export class ThemeIcon{constructor(public id:string,public color?:ThemeColor){}}
export class TreeItem{constructor(public label:string,public collapsibleState:number){} }
export const TreeItemCollapsibleState={None:0,Collapsed:1,Expanded:2};
export const env={language:'en'};
