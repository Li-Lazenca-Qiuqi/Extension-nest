/** 共用主题标识，确保原生树图标和 Dashboard 色线同步适配主题。 */
export function groupColorToken(color: string | undefined): string | undefined {
 const names: Record<string, string> = {
  '#7c3aed':'purple', '#2563eb':'blue', '#d97706':'orange',
  '#059669':'green', '#db2777':'pink', '#0ea5e9':'cyan',
 };
 const name=color?names[color.toLowerCase()]:undefined;
 return name?`extensionNest.group.${name}`:undefined;
}

export function groupCssColor(color: string | undefined): string {
 const token=groupColorToken(color);
 return token?`var(--vscode-${token.replaceAll('.','-')},${color})`:color??'var(--vscode-descriptionForeground,#9aa7b7)';
}
