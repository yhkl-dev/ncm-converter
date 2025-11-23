export type Language = 'en' | 'zh';

export const messages: Record<Language, Record<string, string>> = {
  en: {
    'header.title': 'NCM Converter',
    'header.subtitle': 'Convert NetEase Cloud Music',
    'file.select': 'Select File',
    'file.selected': 'File Selected',
    'file.selectNcm': 'Select NCM File',
    'file.error': 'Please select a .ncm file',
    'button.convert': 'Start Convert',
    'button.converting': 'Converting...',
    'progress.converting': 'Converting... {progress}%',
    'convert.start': 'Please select a file first',
    'convert.error': 'Convert Error: {error}',
    'convert.success': '✓ Convert Success!\n{filename}',
    'footer.text': 'Auto download after conversion',
    'artist.unknown': 'Unknown',
  },
  zh: {
    'header.title': 'NCM 转换器',
    'header.subtitle': '音乐格式转换',
    'file.select': '选择文件',
    'file.selected': '已选择',
    'file.selectNcm': '选择 NCM 文件',
    'file.error': '请选择 .ncm 文件',
    'button.convert': '开始转换',
    'button.converting': '转换中...',
    'progress.converting': '转换中... {progress}%',
    'convert.start': '请先选择文件',
    'convert.error': '转换出错: {error}',
    'convert.success': '✓ 转换成功！\n{filename}',
    'footer.text': '转换完成后自动下载',
    'artist.unknown': '未知',
  }
};

export function t(key: string, language: Language = 'zh', params?: Record<string, string | number>): string {
  let text = messages[language][key] || messages['zh'][key] || key;

  if (params) {
    Object.entries(params).forEach(([paramKey, paramValue]) => {
      text = text.replace(`{${paramKey}}`, String(paramValue));
    });
  }

  return text;
}
