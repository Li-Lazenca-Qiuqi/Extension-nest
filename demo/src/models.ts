/** 单个自定义扩展组。 */
export interface Group {
  id: string;
  name: string;
  color: string;
}

/** 演示用的扩展安装记录。 */
export interface Extension {
  id: string;
  name: string;
  publisher: string;
  description: string;
  version: string;
  update?: string;
  groupId: string | null;
  enabled: boolean;
  monogram: string;
  color: string;
  tags: string[];
}

/** 演示状态的持久化结构。 */
export interface DemoState {
  schemaVersion: 1;
  groups: Group[];
  extensions: Extension[];
}

/** 演示状态支持的全部操作。 */
export type Action =
  | { type: "move"; ids: string[]; groupId: string | null }
  | { type: "toggle"; id: string }
  | { type: "update"; id: string }
  | { type: "setTags"; ids: string[]; tags: string[] }
  | { type: "createGroup"; name: string }
  | { type: "renameGroup"; id: string; name: string }
  | { type: "deleteGroup"; id: string }
  | { type: "reorderGroup"; id: string; targetId: string }
  | { type: "reset" };
