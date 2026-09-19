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
  groupId: string | null;
  visibility: "Visible" | "NotVisible" | "Unverified";
  lastSeenAt?: string;
  monogram: string;
  color: string;
  tags: string[];
  /** 已安装版本声明的自动类别；与可编辑的手动 tags 分开。 */
  categories?: string[];
}

/** 演示状态的持久化结构。 */
export interface DemoState {
  schemaVersion: 1;
  groups: Group[];
  extensions: Extension[];
  freshness?: "Loading" | "Ready" | "Stale" | "Error";
  lastSuccessfulAt?: string;
  error?: string;
  readOnly?: boolean;
  damagedData?: Array<'organization' | 'discovery'>;
  canRepair?: boolean;
}

/** 演示状态支持的全部操作。 */
export type Action =
  | { type: "sortGroups"; direction:-1|1 }
  | { type: "move"; ids: string[]; groupId: string | null; beforeId?: string | null }
  | { type: "setTags"; ids: string[]; tags: string[] }
  | { type: "createGroup"; name: string }
  | { type: "renameGroup"; id: string; name: string }
  | { type: "deleteGroup"; id: string }
  | { type: "reorderGroup"; id: string; targetId: string; after?: boolean }
  | { type: "shiftGroup"; id:string; direction:-1|1 }
  | { type: "sortExtensions"; groupId:string|null; field:'name'|'publisher'; direction:-1|1 }
  | { type: "shiftExtension"; id:string; direction:-1|1 }
  | { type: "reset" };
