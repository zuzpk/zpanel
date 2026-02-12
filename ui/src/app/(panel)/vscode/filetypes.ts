/**
 * Returns the best Monaco language identifier based on file extension
 * Used for monaco.editor.createModel(..., language)
 */
export function detectMonacoLanguage(fileName: string): string {
  const ext = fileName.split('.').pop()?.toLowerCase() || '';

  const extensionMap: Record<string, string> = {
    // Web / JS / TS
    js: 'javascript',
    jsx: 'javascript',
    ts: 'typescript',
    tsx: 'typescript',
    json: 'json',
    jsonc: 'json',

    // Config / Markup
    html: 'html',
    htm: 'html',
    css: 'css',
    scss: 'scss',
    sass: 'sass',
    less: 'less',

    // Config files
    conf: 'ini',                    // ← most .conf files
    config: 'ini',
    cfg: 'ini',
    ini: 'ini',
    properties: 'properties',
    env: 'ini',                     // .env files
    toml: 'toml',
    yaml: 'yaml',
    yml: 'yaml',
    xml: 'xml',
    md: 'markdown',
    markdown: 'markdown',

    // Shell / Scripts
    sh: 'shellscript',
    bash: 'shellscript',
    zsh: 'shellscript',
    fish: 'shellscript',
    py: 'python',
    rb: 'ruby',
    php: 'php',

    // Others
    sql: 'sql',
    dockerfile: 'dockerfile',
    Dockerfile: 'dockerfile',
    gitignore: 'gitignore',
    log: 'plaintext',
    txt: 'plaintext',
  };

  return extensionMap[ext] || 'plaintext'; // fallback
}