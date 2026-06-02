export const gradients = {
  brand: 'bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700',
  hero: 'bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600',
  whatsapp: 'bg-gradient-to-br from-emerald-500 to-green-600',
  facebook: 'bg-gradient-to-br from-blue-500 to-indigo-600',
  instagram: 'bg-gradient-to-br from-pink-500 via-purple-500 to-orange-500',
  success: 'bg-gradient-to-br from-emerald-500 to-teal-600',
  warning: 'bg-gradient-to-br from-amber-500 to-orange-600',
  danger: 'bg-gradient-to-br from-rose-500 to-red-600',
  info: 'bg-gradient-to-br from-sky-500 to-blue-600',
  violet: 'bg-gradient-to-br from-violet-500 to-purple-600',
}

export const channelConfig = {
  whatsapp: {
    name: 'واتساب',
    nameEn: 'WhatsApp',
    icon: 'Phone',
    color: 'emerald',
    gradient: gradients.whatsapp,
    bgLight: 'bg-emerald-50',
    textLight: 'text-emerald-700',
    borderLight: 'border-emerald-200',
    bgDark: 'dark:bg-emerald-900/20',
    textDark: 'dark:text-emerald-400',
    hex: '#25D366',
  },
  facebook: {
    name: 'فيسبوك',
    nameEn: 'Facebook',
    icon: 'MessageCircle',
    color: 'blue',
    gradient: gradients.facebook,
    bgLight: 'bg-blue-50',
    textLight: 'text-blue-700',
    borderLight: 'border-blue-200',
    bgDark: 'dark:bg-blue-900/20',
    textDark: 'dark:text-blue-400',
    hex: '#1877F2',
  },
  instagram: {
    name: 'إنستغرام',
    nameEn: 'Instagram',
    icon: 'Camera',
    color: 'pink',
    gradient: gradients.instagram,
    bgLight: 'bg-pink-50',
    textLight: 'text-pink-700',
    borderLight: 'border-pink-200',
    bgDark: 'dark:bg-pink-900/20',
    textDark: 'dark:text-pink-400',
    hex: '#E4405F',
  },
}

export const orderStatus = {
  PENDING:    { label: 'قيد الانتظار', color: 'slate',  icon: 'Clock' },
  CONFIRMED:  { label: 'مؤكد',         color: 'emerald', icon: 'CheckCircle2' },
  PROCESSING: { label: 'قيد المعالجة', color: 'amber',   icon: 'Loader' },
  SHIPPED:    { label: 'تم الشحن',     color: 'blue',    icon: 'Truck' },
  DELIVERED:  { label: 'تم التسليم',   color: 'green',   icon: 'PackageCheck' },
  CANCELLED:  { label: 'ملغي',         color: 'rose',    icon: 'XCircle' },
  RETURNED:   { label: 'مرتجع',        color: 'orange',  icon: 'Undo' },
}

export const colorVariants = {
  slate:   { bg: 'bg-slate-50',   text: 'text-slate-700',   border: 'border-slate-200',   dot: 'bg-slate-500'   },
  blue:    { bg: 'bg-blue-50',    text: 'text-blue-700',    border: 'border-blue-200',    dot: 'bg-blue-500'    },
  emerald: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-500' },
  amber:   { bg: 'bg-amber-50',   text: 'text-amber-700',   border: 'border-amber-200',   dot: 'bg-amber-500'   },
  rose:    { bg: 'bg-rose-50',    text: 'text-rose-700',    border: 'border-rose-200',    dot: 'bg-rose-500'    },
  green:   { bg: 'bg-green-50',   text: 'text-green-700',   border: 'border-green-200',   dot: 'bg-green-500'   },
  orange:  { bg: 'bg-orange-50',  text: 'text-orange-700',  border: 'border-orange-200',  dot: 'bg-orange-500'  },
  pink:    { bg: 'bg-pink-50',    text: 'text-pink-700',    border: 'border-pink-200',    dot: 'bg-pink-500'    },
  violet:  { bg: 'bg-violet-50',  text: 'text-violet-700',  border: 'border-violet-200',  dot: 'bg-violet-500'  },
}

export const shadows = {
  card:    'shadow-sm hover:shadow-md',
  glass:   'shadow-lg shadow-slate-200/40 dark:shadow-slate-900/40',
  elevated:'shadow-xl hover:shadow-2xl',
  glow:    'shadow-2xl shadow-blue-500/10',
}
