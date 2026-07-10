/**
 * Category display helpers — shared across all components that render category tags.
 */
export function getCategoryColor(cat: string): string {
  const map: Record<string, string> = {
    '饮料': '#1677ff',
    '零食': '#fa8c16',
    '日用品': '#52c41a',
    '酒类': '#722ed1',
    '调味品': '#eb2f96',
    '粮油': '#13c2c2',
    '冷冻食品': '#2f54eb',
    '烟草': '#595959',
  }
  return map[cat] || '#1677ff'
}
