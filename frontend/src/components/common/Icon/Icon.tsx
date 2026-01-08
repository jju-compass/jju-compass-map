import React from 'react';
import './Icon.css';

export type IconName =
  | 'search'
  | 'close'
  | 'menu'
  | 'star'
  | 'star-filled'
  | 'location'
  | 'my-location'
  | 'home'
  | 'directions'
  | 'walking'
  | 'car'
  | 'transit'
  | 'history'
  | 'settings'
  | 'chevron-left'
  | 'chevron-right'
  | 'chevron-up'
  | 'chevron-down'
  | 'plus'
  | 'minus'
  | 'info'
  | 'phone'
  | 'clock'
  | 'delete'
  | 'trending'
  // Category icons
  | 'food'
  | 'rice'
  | 'noodle'
  | 'sushi'
  | 'pasta'
  | 'snack'
  | 'cafe'
  | 'store'
  | 'pharmacy'
  | 'hospital'
  | 'bank'
  | 'pencil'
  | 'scissors'
  | 'computer'
  | 'dumbbell'
  | 'mic';

export interface IconProps {
  name: IconName;
  size?: 'sm' | 'md' | 'lg' | number;
  color?: string;
  className?: string;
  onClick?: () => void;
  title?: string;
}

const iconPaths: Record<IconName, React.ReactNode> = {
  search: (
    <path
      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  ),
  close: (
    <path
      d="M6 18L18 6M6 6l12 12"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  ),
  menu: (
    <path
      d="M4 6h16M4 12h16M4 18h16"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  ),
  star: (
    <path
      d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  ),
  'star-filled': (
    <path
      d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
      fill="currentColor"
    />
  ),
  location: (
    <path
      d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  ),
  'my-location': (
    <>
      <circle cx="12" cy="12" r="3" strokeLinecap="round" strokeLinejoin="round" />
      <path
        d="M12 2v3m0 14v3M2 12h3m14 0h3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </>
  ),
  home: (
    <path
      d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  ),
  directions: (
    <path
      d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  ),
  walking: (
    <path
      d="M13.5 6a1.5 1.5 0 100-3 1.5 1.5 0 000 3zM11 10l-1 4 5 2 1-4.5M10.5 21l1.5-5-2-1v-3l3-3M7.5 11l3-1"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  ),
  car: (
    <path
      d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25m-5.25 0H6.375a2.064 2.064 0 00-1.58.86A17.903 17.903 0 001.636 17.63c-.039.62.468 1.124 1.09 1.124H4.5M9 12h6m-6 0a2.25 2.25 0 01-2.25-2.25H18.75A2.25 2.25 0 0116.5 12m-7.5 0V9.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  ),
  transit: (
    <path
      d="M8 18v2m8-2v2M3 8h18M4 6h16a1 1 0 011 1v9a3 3 0 01-3 3H6a3 3 0 01-3-3V7a1 1 0 011-1zM8 14h.01M16 14h.01"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  ),
  history: (
    <path
      d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  ),
  settings: (
    <path
      d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065zM15 12a3 3 0 11-6 0 3 3 0 016 0z"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  ),
  'chevron-left': (
    <path
      d="M15.75 19.5L8.25 12l7.5-7.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  ),
  'chevron-right': (
    <path
      d="M8.25 4.5l7.5 7.5-7.5 7.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  ),
  'chevron-up': (
    <path
      d="M4.5 15.75l7.5-7.5 7.5 7.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  ),
  'chevron-down': (
    <path
      d="M19.5 8.25l-7.5 7.5-7.5-7.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  ),
  plus: (
    <path
      d="M12 4.5v15m7.5-7.5h-15"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  ),
  minus: (
    <path
      d="M19.5 12h-15"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  ),
  info: (
    <path
      d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  ),
  phone: (
    <path
      d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  ),
  clock: (
    <path
      d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  ),
  delete: (
    <path
      d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  ),
  trending: (
    <path
      d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  ),
  // Category icons
  food: (
    <path
      d="M12 8.25v-1.5m0 1.5c-1.355 0-2.697.056-4.024.166C6.845 8.51 6 9.473 6 10.608v2.513c0 1.135.845 2.098 1.976 2.192 1.327.11 2.669.166 4.024.166 1.355 0 2.697-.056 4.024-.166C17.155 15.22 18 14.257 18 13.122v-2.513c0-1.135-.845-2.098-1.976-2.192A48.424 48.424 0 0012 8.25zm0 0V6.75m0 0h.008v.008H12V6.75zm-3 4.5h.008v.008H9v-.008zm3 0h.008v.008H12v-.008zm3 0h.008v.008H15v-.008zm-6 3h.008v.008H9v-.008zm3 0h.008v.008H12v-.008zm3 0h.008v.008H15v-.008zm1.5 3.75H5.25a1.5 1.5 0 01-1.5-1.5v-.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  ),
  rice: (
    <path
      d="M12 3c-4.97 0-9 2.686-9 6v6c0 3.314 4.03 6 9 6s9-2.686 9-6V9c0-3.314-4.03-6-9-6zm0 3c3.314 0 6 1.343 6 3s-2.686 3-6 3-6-1.343-6-3 2.686-3 6-3zm-6 6c0 1.657 2.686 3 6 3s6-1.343 6-3v2c0 1.657-2.686 3-6 3s-6-1.343-6-3v-2z"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  ),
  noodle: (
    <path
      d="M4 6h16M4 6v2c0 1.5 1 3 4 3m-4-5c0-1 1-2 2-2m14 2v2c0 1.5-1 3-4 3m4-5c0-1-1-2-2-2M8 11v8c0 1 1 2 2 2h4c1 0 2-1 2-2v-8M12 6v5m-4 0c0 3 1.5 5 4 5s4-2 4-5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  ),
  sushi: (
    <path
      d="M12 4c-4.418 0-8 1.79-8 4v8c0 2.21 3.582 4 8 4s8-1.79 8-4V8c0-2.21-3.582-4-8-4zm0 3c2.761 0 5 .895 5 2s-2.239 2-5 2-5-.895-5-2 2.239-2 5-2zm0 10c-2.761 0-5-.895-5-2v-3c1.194.638 3.024 1 5 1s3.806-.362 5-1v3c0 1.105-2.239 2-5 2z"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  ),
  pasta: (
    <path
      d="M12 3v3m0 0c-3 0-6 1-6 4v1h12v-1c0-3-3-4-6-4zm-6 8h12v2c0 3-2.686 5-6 5s-6-2-6-5v-2zm3 3h.01M12 14h.01M15 14h.01"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  ),
  snack: (
    <path
      d="M9 3v2m6-2v2M6 8h12c1 0 2 1 2 2v8c0 1-1 2-2 2H6c-1 0-2-1-2-2v-8c0-1 1-2 2-2zm3 4v5m3-5v5m3-5v5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  ),
  cafe: (
    <path
      d="M18 8h1a3 3 0 010 6h-1m-1-6H5v6a4 4 0 004 4h4a4 4 0 004-4V8zM6 21h12"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  ),
  store: (
    <path
      d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7-.393 2.25-1.016a3.001 3.001 0 003.75.614m-16.5 0a3.004 3.004 0 01-.621-4.72L4.318 3.44A1.5 1.5 0 015.378 3h13.243a1.5 1.5 0 011.06.44l1.19 1.189a3 3 0 01-.621 4.72m-13.5 8.65h3.75a.75.75 0 00.75-.75V13.5a.75.75 0 00-.75-.75H6.75a.75.75 0 00-.75.75v3.75c0 .415.336.75.75.75z"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  ),
  pharmacy: (
    <path
      d="M9 12h6m-3-3v6m-7 4h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  ),
  hospital: (
    <path
      d="M12 6v6m0 0v6m0-6h6m-6 0H6m13.5-3.25a9 9 0 11-18 0 9 9 0 0118 0z"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  ),
  bank: (
    <path
      d="M12 3L2 9h20L12 3zm0 3v1m-7 5v4m4-4v4m6-4v4m4-4v4M4 21h16M3 17h18"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  ),
  pencil: (
    <path
      d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  ),
  scissors: (
    <path
      d="M7.848 8.25l1.536.887M7.848 8.25a3 3 0 11-5.196-3 3 3 0 015.196 3zm9.304 0l-1.536.887M17.152 8.25a3 3 0 105.196-3 3 3 0 00-5.196 3zM12 17.25l-3.616-2.087m0 0a3 3 0 10-3 5.196l6.616-3.109m-3.616-2.087L12 12m3.616 3.163l3.616-2.087m0 0L12 12m7.232 1.076a3 3 0 103-5.196l-6.616 3.109"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  ),
  computer: (
    <path
      d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0V12a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 12V5.25"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  ),
  dumbbell: (
    <path
      d="M6 6.5v11M18 6.5v11M6 12h12M4 8v8a1 1 0 001 1h1V7H5a1 1 0 00-1 1zm16 0v8a1 1 0 01-1 1h-1V7h1a1 1 0 011 1zM2 9v6m20-6v6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  ),
  mic: (
    <path
      d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  ),
};

const sizeMap = {
  sm: 16,
  md: 24,
  lg: 32,
};

export const Icon: React.FC<IconProps> = ({
  name,
  size = 'md',
  color,
  className = '',
  onClick,
  title,
}) => {
  const pixelSize = typeof size === 'number' ? size : sizeMap[size];
  
  const classes = [
    'icon',
    onClick && 'icon-clickable',
    className,
  ].filter(Boolean).join(' ');

  return (
    <svg
      className={classes}
      width={pixelSize}
      height={pixelSize}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color || 'currentColor'}
      strokeWidth={1.5}
      onClick={onClick}
      role={onClick ? 'button' : 'img'}
      aria-label={title || name}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      } : undefined}
    >
      {title && <title>{title}</title>}
      {iconPaths[name]}
    </svg>
  );
};

export default Icon;
