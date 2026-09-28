export type Example = {label:string; input:Record<string,unknown>; expected:unknown; walkthrough:string[]};
export type Lesson = {idea:string; steps:string[]; why:string; cost:string; original:string[]; examples:Example[]};
export const example=(label:string,input:Record<string,unknown>,expected:unknown,walkthrough:string):Example=>({label,input,expected,walkthrough:walkthrough.split('|')});
export const lesson=(idea:string,steps:string,why:string,cost:string,original:string,...examples:Example[]):Lesson=>({idea,steps:steps.split('|'),why,cost,original:original.split('|'),examples});
