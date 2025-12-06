const FRAMEWORK_CSS_VARS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)"];

const hashString = (str: string): number => {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 33) ^ str.charCodeAt(i);
  }
  return hash >>> 0;
};

const generateFallbackColor = (name: string): string => {
  const hash = hashString(name.toLowerCase());
  const hue = hash % 360;
  return `hsl(${hue}, 65%, 50%)`;
};

export const getFrameworkColor = (index: number, fallbackName?: string): string => {
  if (index < FRAMEWORK_CSS_VARS.length) {
    return FRAMEWORK_CSS_VARS[index];
  }
  return generateFallbackColor(fallbackName ?? `framework-${index}`);
};
