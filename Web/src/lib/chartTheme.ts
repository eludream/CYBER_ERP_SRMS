// ========================
// Recharts Theme Configuration
// Centralized chart styles with dark mode support
// ========================

// Use CSS variables for theme-aware colors
export const chartTheme = {
  // Axis colors
  axisStroke: "hsl(220, 9%, 46%)",
  axisFontSize: 12,

  // Grid
  gridStroke: "hsl(var(--border))",
  gridStrokeDasharray: "3 3",

  // Tooltip
  tooltipStyle: {
    background: "hsl(var(--card))",
    border: "1px solid hsl(var(--border))",
    borderRadius: 8,
    color: "hsl(var(--foreground))",
    boxShadow: "0 4px 12px rgba(0,0,0,0.12)",
  },

  // Chart colors (navy-based palette)
  colors: {
    primary: "hsl(var(--primary))",
    secondary: "hsl(224, 71%, 50%)",
    accent: "hsl(var(--info))",
    success: "hsl(var(--success))",
    warning: "hsl(var(--warning))",
    destructive: "hsl(var(--destructive))",
    muted: "hsl(var(--muted))",
    info: "hsl(var(--info))",
  },

  // Multi-series palette
  seriesPalette: [
    "hsl(224, 71%, 45%)",
    "hsl(217, 91%, 55%)",
    "hsl(142, 71%, 40%)",
    "hsl(38, 92%, 50%)",
    "hsl(199, 89%, 48%)",
    "hsl(0, 72%, 55%)",
    "hsl(280, 60%, 50%)",
    "hsl(160, 60%, 45%)",
  ],

  // Planned/target bar color (subtle)
  plannedFill: "hsl(var(--muted))",
};
