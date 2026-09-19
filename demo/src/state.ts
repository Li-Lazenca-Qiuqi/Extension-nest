import type { Action, DemoState, Extension, Group } from "./models";
import { seedState } from "./seed";
import { normalizeTags, tagsEqual } from "./tags";

const STORAGE_KEY = "extension-nest-demo-v1";
const MAX_GROUP_NAME_LENGTH = 50;
const GROUP_COLOR_PALETTE = ["#7C3AED", "#2563EB", "#D97706", "#059669", "#DB2777", "#0EA5E9"];

type RecordValue = Record<string, unknown>;

/** 判断未知值是否为可读取的普通对象。 */
function isRecord(value: unknown): value is RecordValue {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** 判断字符串是否为非空且去除首尾空白后的值。 */
function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

/** 判断组名是否符合演示界面的输入约束。 */
function isValidGroupName(name: string): boolean {
  const trimmedName = name.trim();
  return trimmedName.length > 0 && Array.from(trimmedName).length <= MAX_GROUP_NAME_LENGTH && trimmedName.toLowerCase() !== "ungrouped";
}

/** 返回大小写不敏感的组名键。 */
function groupNameKey(name: string): string {
  return name.trim().toLocaleLowerCase();
}

/** 深复制状态，避免状态操作或持久化读写共享可变对象。 */
function cloneState(state: DemoState): DemoState {
  return {
    ...state,
    schemaVersion: 1,
    groups: state.groups.map((group) => ({ ...group })),
    extensions: state.extensions.map((extension) => ({ ...extension, tags: [...extension.tags],
      ...(extension.categories ? { categories: [...extension.categories] } : {}) })),
  };
}

/** 生成可读且稳定的组 ID，并处理同名 slug 冲突。 */
function createGroupId(name: string, groups: Group[]): string {
  const slug = name
    .toLocaleLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "custom";
  const usedIds = new Set(groups.map((group) => group.id));
  const baseId = `group-${slug}`;
  let candidate = baseId;
  let suffix = 2;
  while (usedIds.has(candidate)) {
    candidate = `${baseId}-${suffix}`;
    suffix += 1;
  }
  return candidate;
}

/** 判断目标组是否存在，null 代表合法的 Ungrouped 目标。 */
function hasValidTargetGroup(state: DemoState, groupId: string | null): boolean {
  return groupId === null || state.groups.some((group) => group.id === groupId);
}

/** 把选中的扩展一次性移动到唯一目标组。 */
function moveExtensions(state: DemoState, ids: string[], groupId: string | null, beforeId?: string | null): DemoState {
  if (!hasValidTargetGroup(state, groupId) || ids.length === 0) {
    return state;
  }

  const selectedIds = new Set(ids);
  if (beforeId !== undefined) {
    if (beforeId !== null && !state.extensions.some(e => e.id === beforeId && e.groupId === groupId && !selectedIds.has(e.id))) return state;
    const moving = state.extensions.filter(e => selectedIds.has(e.id)).map(e => ({...e, groupId}));
    if (!moving.length) return state;
    const extensions = state.extensions.filter(e => !selectedIds.has(e.id));
    const index = beforeId === null ? extensions.length : extensions.findIndex(e => e.id === beforeId);
    extensions.splice(index, 0, ...moving);
    return {...state, extensions};
  }

  let changed = false;
  const extensions = state.extensions.map((extension) => {
    if (!selectedIds.has(extension.id) || extension.groupId === groupId) {
      return extension;
    }
    changed = true;
    return { ...extension, groupId };
  });

  return changed ? { ...state, extensions } : state;
}

/** 为选中的扩展设置同一组独立标签；标签不会影响 groupId。 */
function setExtensionTags(state: DemoState, ids: string[], tags: string[]): DemoState {
  let normalizedTags: string[];
  try {
    normalizedTags = normalizeTags(tags);
  } catch {
    return state;
  }

  if (ids.length === 0) {
    return state;
  }
  const selectedIds = new Set(ids);
  let changed = false;
  const extensions = state.extensions.map((extension) => {
    if (!selectedIds.has(extension.id) || tagsEqual(extension.tags, normalizedTags)) {
      return extension;
    }
    changed = true;
    return { ...extension, tags: [...normalizedTags] };
  });
  return changed ? { ...state, extensions } : state;
}

/** 创建一个经过名称校验的新组。 */
function createGroup(state: DemoState, name: string): DemoState {
  const trimmedName = name.trim();
  if (
    !isValidGroupName(name) ||
    state.groups.some((group) => groupNameKey(group.name) === groupNameKey(trimmedName))
  ) {
    return state;
  }

  const group: Group = {
    id: createGroupId(trimmedName, state.groups),
    name: trimmedName,
    color: GROUP_COLOR_PALETTE[state.groups.length % GROUP_COLOR_PALETTE.length],
  };
  return { ...state, groups: [...state.groups, group] };
}

/** 重命名组并保持组 ID 与扩展归属不变。 */
function renameGroup(state: DemoState, id: string, name: string): DemoState {
  const trimmedName = name.trim();
  if (
    !isValidGroupName(name) ||
    !state.groups.some((group) => group.id === id) ||
    state.groups.some((group) => group.id !== id && groupNameKey(group.name) === groupNameKey(trimmedName))
  ) {
    return state;
  }

  return {
    ...state,
    groups: state.groups.map((group) => (group.id === id ? { ...group, name: trimmedName } : group)),
  };
}

/** 删除组并将该组扩展设为 Ungrouped。 */
function deleteGroup(state: DemoState, id: string): DemoState {
  if (!state.groups.some((group) => group.id === id)) {
    return state;
  }
  return {
    ...state,
    groups: state.groups.filter((group) => group.id !== id),
    extensions: state.extensions.map((extension) =>
      extension.groupId === id ? { ...extension, groupId: null } : extension,
    ),
  };
}

/** 按目标组的位置重新排列组，Ungrouped 不在数组中因此保持固定。 */
function reorderGroup(state: DemoState, id: string, targetId: string, after = false): DemoState {
  const sourceIndex = state.groups.findIndex((group) => group.id === id);
  const targetIndex = state.groups.findIndex((group) => group.id === targetId);
  if (sourceIndex < 0 || targetIndex < 0 || sourceIndex === targetIndex) {
    return state;
  }

  const groups = [...state.groups];
  const [source] = groups.splice(sourceIndex, 1);
  const insertionIndex = groups.findIndex((group) => group.id === targetId);
  groups.splice(insertionIndex + (after ? 1 : 0), 0, source);
  return { ...state, groups };
}

/** 校验单个组的结构和输入约束。 */
function validateGroup(value: unknown): value is Group {
  if (!isRecord(value)) {
    return false;
  }
  return (
    isNonEmptyString(value.id) &&
    value.id === value.id.trim() &&
    isNonEmptyString(value.name) &&
    value.name === value.name.trim() &&
    isValidGroupName(value.name) &&
    typeof value.color === "string" &&
    value.color.trim().length > 0
  );
}

/** 校验单个扩展的结构和字段类型。 */
function validateExtension(value: unknown, groupIds: Set<string>): value is Extension {
  if (!isRecord(value)) {
    return false;
  }

  const groupId = value.groupId;
  const validGroupId = groupId === null || (isNonEmptyString(groupId) && groupIds.has(groupId));
  const rawTags = value.tags;
  if (value.categories !== undefined && (!Array.isArray(value.categories)
    || !value.categories.every(category => typeof category === 'string' && category === category.trim()
      && category.length > 0 && Array.from(category).length <= 30)
    || new Set(value.categories.map(category => category.toLocaleLowerCase())).size !== value.categories.length)) return false;
  if (!Array.isArray(rawTags) || !rawTags.every((tag) => typeof tag === "string")) {
    return false;
  }

  let normalizedTags: string[];
  try {
    normalizedTags = normalizeTags(rawTags);
  } catch {
    return false;
  }

  return (
    isNonEmptyString(value.id) &&
    value.id === value.id.trim() &&
    isNonEmptyString(value.name) &&
    isNonEmptyString(value.publisher) &&
    typeof value.description === "string" &&
    isNonEmptyString(value.version) &&
    validGroupId &&
    ["Visible", "NotVisible", "Unverified"].includes(value.visibility as string) &&
    isNonEmptyString(value.monogram) &&
    typeof value.color === "string" &&
    value.color.trim().length > 0 &&
    tagsEqual(rawTags, normalizedTags)
  );
}

/** 深校验持久化值，拒绝重复 ID、重复组名和失效归属引用。 */
export function validateState(value: unknown): value is DemoState {
  if (!isRecord(value) || value.schemaVersion !== 1 || !Array.isArray(value.groups) || !Array.isArray(value.extensions)) {
    return false;
  }
  if (value.damagedData !== undefined && (!Array.isArray(value.damagedData)
    || !value.damagedData.every(target => target === 'organization' || target === 'discovery'))) return false;
  if (value.canRepair !== undefined && typeof value.canRepair !== 'boolean') return false;

  const groups = value.groups;
  const groupIds = new Set<string>();
  const groupNames = new Set<string>();
  for (const group of groups) {
    if (!validateGroup(group)) {
      return false;
    }
    if (groupIds.has(group.id) || groupNames.has(groupNameKey(group.name))) {
      return false;
    }
    groupIds.add(group.id);
    groupNames.add(groupNameKey(group.name));
  }

  const extensionIds = new Set<string>();
  for (const extension of value.extensions) {
    if (!validateExtension(extension, groupIds) || extensionIds.has(extension.id)) {
      return false;
    }
    extensionIds.add(extension.id);
  }

  return true;
}

/** 把没有 tags 字段的旧 schemaVersion=1 快照迁移到当前严格结构。 */
export function migrateState(value: unknown): DemoState | undefined {
  if (!isRecord(value) || value.schemaVersion !== 1 || !Array.isArray(value.groups) || !Array.isArray(value.extensions)) {
    return undefined;
  }

  const extensions = value.extensions.map((extension) => {
    if (!isRecord(extension) || Object.prototype.hasOwnProperty.call(extension, "tags")) {
      return extension;
    }
    return { ...extension, tags: [] };
  });
  const candidate: unknown = { ...value, extensions };
  return validateState(candidate) ? cloneState(candidate) : undefined;
}

/** 安全获取浏览器存储；运行在无 localStorage 的环境时返回 null。 */
function getStorage(): Storage | null {
  try {
    return typeof globalThis.localStorage === "undefined" ? null : globalThis.localStorage;
  } catch {
    return null;
  }
}

/** 从 localStorage 读取有效状态；读取失败或损坏时返回 seed 副本。 */
export function loadState(): DemoState {
  try {
    const storage = getStorage();
    const raw = storage?.getItem(STORAGE_KEY);
    if (!raw) {
      return cloneState(seedState);
    }
    const parsed: unknown = JSON.parse(raw);
    return migrateState(parsed) ?? cloneState(seedState);
  } catch {
    return cloneState(seedState);
  }
}

/** 校验并保存状态，无法访问存储或序列化失败时返回 false。 */
export function saveState(state: DemoState): boolean {
  try {
    const storage = getStorage();
    if (!storage || !validateState(state)) {
      return false;
    }
    storage.setItem(STORAGE_KEY, JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
}

/** 根据动作返回新的状态，所有分支都保留单组归属并避免原地修改。 */
export function reducer(state: DemoState, action: Action): DemoState {
  switch (action.type) {
    case "move":
      return moveExtensions(state, action.ids, action.groupId, action.beforeId);
    case "setTags":
      return setExtensionTags(state, action.ids, action.tags);
    case "createGroup":
      return createGroup(state, action.name);
    case "renameGroup":
      return renameGroup(state, action.id, action.name);
    case "deleteGroup":
      return deleteGroup(state, action.id);
    case "reorderGroup":
      return reorderGroup(state, action.id, action.targetId, action.after);
    case "sortGroups":
      return {...state,groups:[...state.groups].sort((a,b)=>action.direction*(a.name.localeCompare(b.name)||a.id.localeCompare(b.id)))};
    case "shiftGroup": {
      const groups=[...state.groups];const index=groups.findIndex(g=>g.id===action.id);const target=index+action.direction;
      if(index<0||target<0||target>=groups.length)return state;
      [groups[index],groups[target]]=[groups[target],groups[index]];return {...state,groups};
    }
    case "sortExtensions": {
      if(!hasValidTargetGroup(state,action.groupId))return state;
      const sorted=state.extensions.filter(e=>e.groupId===action.groupId).sort((a,b)=>action.direction*(a[action.field].localeCompare(b[action.field])||a.id.localeCompare(b.id)));
      let index=0;return {...state,extensions:state.extensions.map(e=>e.groupId===action.groupId?sorted[index++]:e)};
    }
    case "shiftExtension": {
      const extensions=[...state.extensions];const index=extensions.findIndex(e=>e.id===action.id);if(index<0)return state;
      const peers=extensions.map((e,i)=>e.groupId===extensions[index].groupId?i:-1).filter(i=>i>=0);
      const target=peers[peers.indexOf(index)+action.direction];if(target===undefined)return state;
      [extensions[index],extensions[target]]=[extensions[target],extensions[index]];return {...state,extensions};
    }
    case "reset":
      return cloneState(seedState);
  }
}
