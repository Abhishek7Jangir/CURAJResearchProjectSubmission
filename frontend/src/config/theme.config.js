// ==========================================
// Central Theme Configuration
// ==========================================
// This file provides consistent theming across the entire application
// Import: import { themeClasses, themeColors, cn } from './config/theme.config';

// Helper function to combine theme classes
export const cn = (...classes) => {
    return classes.filter(Boolean).join(' ');
  };
  
  // ==========================================
  // Theme Colors
  // ==========================================
  export const themeColors = {
    // Background colors
    background: {
      primary: 'bg-gray-50 dark:bg-gradient-to-br dark:from-gray-900 dark:via-black dark:to-gray-900',
      secondary: 'bg-white dark:bg-gray-800/50',
      tertiary: 'bg-gray-100 dark:bg-gray-900/50',
      card: 'bg-white dark:bg-gray-800/50 backdrop-blur-sm',
      cardHover: 'hover:bg-gray-50 dark:hover:bg-gray-100/70 dark:bg-gray-900/70',
      navbar: 'bg-white dark:bg-gradient-to-r dark:from-gray-900 dark:via-black dark:to-gray-900',
      input: 'bg-white dark:bg-gray-800',
      modal: 'bg-white dark:bg-gradient-to-br dark:from-gray-900 dark:to-black',
      dropdown: 'bg-white dark:bg-gray-800',
      tabContainer: 'bg-white/80 dark:bg-gray-800/50',
    },
  
    // Text colors
    text: {
      primary: 'text-gray-900 dark:text-white',
      secondary: 'text-gray-600 dark:text-gray-400',
      tertiary: 'text-gray-500 dark:text-gray-500',
      muted: 'text-gray-400 dark:text-gray-600',
      inverse: 'text-gray-900 dark:text-white dark:text-gray-900',
      link: 'text-blue-600 dark:text-blue-400',
      linkHover: 'hover:text-blue-700 dark:hover:text-blue-300',
    },
  
    // Border colors
    border: {
      primary: 'border-gray-200 dark:border-gray-700',
      secondary: 'border-gray-300 dark:border-gray-700/50',
      focus: 'focus:border-blue-500 dark:focus:border-blue-500',
      hover: 'hover:border-gray-400 dark:hover:border-gray-600',
    },
  
    // Button colors
    button: {
      primary: 'bg-blue-600 hover:bg-blue-700 text-gray-900 dark:text-white',
      secondary: 'bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-900 dark:text-white',
      success: 'bg-green-600 hover:bg-green-700 text-gray-900 dark:text-white',
      danger: 'bg-red-600 hover:bg-red-700 text-gray-900 dark:text-white',
      warning: 'bg-yellow-600 hover:bg-yellow-700 text-gray-900 dark:text-white',
      ghost: 'bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-900 dark:text-white',
    },
  
    // Status colors (consistent in both themes)
    status: {
      pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50',
      approved: 'bg-green-500/20 text-green-400 border-green-500/50',
      rejected: 'bg-red-500/20 text-red-400 border-red-500/50',
      completed: 'bg-blue-500/20 text-blue-400 border-blue-500/50',
    },
  
    // Gradient backgrounds
    gradients: {
      primary: 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700',
      success: 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700',
      danger: 'bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700',
      warning: 'bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700',
      info: 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700',
    },
  
    // Card gradients for stats
    statCards: {
      pending: 'bg-gradient-to-br from-yellow-500 to-orange-600',
      approved: 'bg-gradient-to-br from-green-500 to-emerald-600',
      rejected: 'bg-gradient-to-br from-red-500 to-rose-600',
      total: 'bg-gradient-to-br from-blue-500 to-indigo-600',
    },
  
    // Ring colors for focus states
    ring: {
      primary: 'focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
      secondary: 'focus:ring-2 focus:ring-gray-500 focus:ring-offset-2',
    },
  
    // Shadow
    shadow: {
      sm: 'shadow-sm',
      md: 'shadow-md',
      lg: 'shadow-lg',
      xl: 'shadow-xl',
      '2xl': 'shadow-2xl',
    },
  };
  
  // ==========================================
  // Pre-built Component Classes
  // ==========================================
  export const themeClasses = {
    // Page container
    pageContainer: cn(
      themeColors.background.primary,
      'min-h-screen'
    ),
  
    // Content container
    contentContainer: cn(
      'max-w-screen-2xl mx-auto px-6 py-8'
    ),
  
    // Card
    card: cn(
      themeColors.background.card,
      themeColors.border.primary,
      'rounded-xl border',
      themeColors.shadow['2xl'],
      'overflow-hidden'
    ),
  
    // Card with hover
    cardHover: cn(
      themeColors.background.card,
      themeColors.border.primary,
      themeColors.background.cardHover,
      'rounded-lg border',
      'transition-all cursor-pointer'
    ),
  
    // Input field
    input: cn(
      themeColors.background.input,
      themeColors.border.primary,
      themeColors.text.primary,
      'rounded-lg border px-4 py-2',
      themeColors.border.focus,
      themeColors.ring.primary,
      'focus:outline-none transition-colors',
      'placeholder-gray-500 dark:placeholder-gray-400 dark:placeholder-gray-500'
    ),
  
    // Textarea
    textarea: cn(
      themeColors.background.input,
      themeColors.border.primary,
      themeColors.text.primary,
      'rounded-lg border p-3',
      themeColors.border.focus,
      themeColors.ring.primary,
      'focus:outline-none transition-colors',
      'placeholder-gray-500 dark:placeholder-gray-400 dark:placeholder-gray-500'
    ),
  
    // Select/Dropdown
    select: cn(
      themeColors.background.input,
      themeColors.border.primary,
      themeColors.text.primary,
      'rounded-lg border px-4 py-2',
      themeColors.border.focus,
      themeColors.ring.primary,
      'focus:outline-none transition-colors'
    ),
  
    // Heading
    heading: cn(
      themeColors.text.primary,
      'font-bold'
    ),
  
    // Subheading
    subheading: cn(
      themeColors.text.secondary,
      'font-medium'
    ),
  
    // Label
    label: cn(
      themeColors.text.primary,
      'font-medium text-sm'
    ),
  
    // Modal backdrop
    modalBackdrop: cn(
      'fixed inset-0 z-50 flex items-center justify-center',
      'bg-black/80 backdrop-blur-sm overflow-y-auto'
    ),
  
    // Modal content
    modalContent: cn(
      themeColors.background.modal,
      themeColors.border.primary,
      'rounded-xl shadow-2xl w-full max-w-3xl mx-4 my-8 relative border'
    ),
  
    // Modal header
    modalHeader: cn(
      'flex justify-between items-center border-b',
      themeColors.border.primary,
      'p-5 sticky top-0',
      'bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm rounded-t-xl z-10'
    ),
  
    // Modal footer
    modalFooter: cn(
      'border-t',
      themeColors.border.primary,
      'p-5 text-right',
      'bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm rounded-b-xl'
    ),
  
    // Tab container
    tabContainer: cn(
      themeColors.background.tabContainer,
      'backdrop-blur-sm rounded-xl p-2 border',
      themeColors.border.secondary,
      themeColors.shadow['2xl']
    ),
  
    // Tab button (inactive)
    tabButton: cn(
      'relative flex items-center gap-3 px-6 py-3 rounded-lg font-semibold transition-all duration-300',
      themeColors.text.secondary,
      'hover:text-gray-800 dark:hover:text-gray-200'
    ),
  
    // Tab button (active)
    tabButtonActive: cn(
      'text-gray-900 dark:text-white'
    ),
  
    // Table header
    tableHeader: cn(
      'bg-gray-50 dark:bg-gray-900/50',
      themeColors.border.primary,
      'border-b'
    ),
  
    // Table row
    tableRow: cn(
      themeColors.background.cardHover,
      themeColors.border.primary,
      'border-b transition-colors'
    ),
  
    // Navbar
    navbar: cn(
      themeColors.background.navbar,
      'shadow-2xl border-b',
      themeColors.border.primary
    ),
  };
  
  // ==========================================
  // Helper Functions
  // ==========================================
  
  // Status badge helper
  export const getStatusBadgeClass = (status) => {
    if (status.includes('Approved') || status.includes('Completed')) {
      return 'bg-green-500/20 text-green-400 border border-green-500/50';
    }
    if (status.includes('Rejected')) {
      return 'bg-red-500/20 text-red-400 border border-red-500/50';
    }
    if (status.includes('Pending')) {
      return 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/50';
    }
    return 'bg-blue-500/20 text-blue-400 border border-blue-500/50';
  };
  
  // Default export
  export default themeColors;