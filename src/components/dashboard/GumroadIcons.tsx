// Gumroad-style SVG icons extracted from official Gumroad HTML

interface IconProps {
  className?: string;
  size?: number;
}

export const GumroadHomeIcon = ({ className = '', size = 16 }: IconProps) => (
  <svg className={className} width={size} height={size} fill="currentColor" viewBox="0 0 24 24">
    <path d="M5.991 2.939c-.379 0-.737.224-.906.562L2.991 6.939c.036 1.886 1.525 3 3 3 .778 0 1.467-.295 2-.781a2.937 2.937 0 0 0 2 .781c.778 0 1.467-.295 2-.781a2.937 2.937 0 0 0 2 .781c.778 0 1.467-.264 2-.75.533.486 1.222.75 2 .75 1.475 0 2.991-1.152 3-3l-2.094-3.438a1.027 1.027 0 0 0-.906-.562h-12zm6 8.531c-.626.275-1.289.469-2 .469-.354 0-.668-.137-1-.219v3.219h6V11.72c-.332.083-.646.219-1 .219-.71 0-1.38-.194-2-.469zm-8 .031v7.438a1 1 0 0 0 0 2h16a1 1 0 0 0 0-2v-7.438a4.934 4.934 0 0 1-2 .438c-.354 0-.668-.136-1-.219v4.219a1 1 0 0 1-1 1h-8a1 1 0 0 1-1-1V11.72c-.333.083-.646.219-1 .219a4.99 4.99 0 0 1-2-.438Z"/>
  </svg>
);

export const GumroadProductsIcon = ({ className = '', size = 16 }: IconProps) => (
  <svg className={className} width={size} height={size} fill="currentColor" viewBox="0 0 24 24">
    <path d="M6.014 2.5a4 4 0 0 0-4 4v1h20v-1a4 4 0 0 0-4-4h-12zm-3 7v8c0 2.184 1.603 4 3.656 4h10.688c2.053 0 3.656-1.816 3.656-4V9h-18zm7.5 2h3a1.5 1.5 0 0 1 0 3h-3a1.5 1.5 0 0 1 0-3Z"/>
  </svg>
);

export const GumroadCheckoutIcon = ({ className = '', size = 16 }: IconProps) => (
  <svg className={className} width={size} height={size} fill="currentColor" viewBox="0 0 24 24">
    <path d="M3.015 2.001a1 1 0 0 0 0 2h1.469l3.312 7.72c-.48.333-.898.75-1.187 1.28a4.55 4.55 0 0 0-.563 1.938v.187c.036.256.134.579.344.907.375.585.984.937 1.78.937.418 0 10.537.03 10.845.031a1 1 0 1 0 0-2c-.308 0-10.425-.03-10.844-.03-.078 0-.1.006-.125-.032.022-.24.113-.604.313-.969.339-.621.88-.969 1.812-.969h7.844a.97.97 0 0 0 .906-.593l3-7c.283-.66-.188-1.407-.906-1.407H6.67l-.344-.812C6.029 2.493 5.24 1.994 4.484 2h-1.47zm4.5 17a1.5 1.5 0 1 0 0 3.001 1.5 1.5 0 0 0 0-3zm11 0a1.5 1.5 0 1 0 0 3.001 1.5 1.5 0 0 0 0-3Z"/>
  </svg>
);

export const GumroadEmailsIcon = ({ className = '', size = 16 }: IconProps) => (
  <svg className={className} width={size} height={size} fill="currentColor" viewBox="0 0 24 24">
    <path d="M5.953 4.002c-2.034 0-3.626.514-3.907 2.469-.09.626.108 1.242.563 1.687.226.22.465.484.78.75.794.669 1.805 1.42 2.75 2.094 2.604 1.85 4.659 3 5.876 3 1.217 0 3.272-1.15 5.875-3 .947-.673 1.958-1.426 2.75-2.094.316-.266.555-.528.78-.75a1.944 1.944 0 0 0 .564-1.687C21.703 4.516 20.11 4 18.077 4H5.953zm-3.938 6.156v5.844a4 4 0 0 0 4 4h12a4 4 0 0 0 4-4v-5.844a26.122 26.122 0 0 1-3.031 2.5c-2.836 2.008-5.383 3.344-6.97 3.344-1.585 0-4.132-1.336-6.968-3.344a26.037 26.037 0 0 1-3.031-2.5Z"/>
  </svg>
);

export const GumroadWorkflowsIcon = ({ className = '', size = 16 }: IconProps) => (
  <svg className={className} width={size} height={size} fill="currentColor" viewBox="0 0 24 24">
    <path d="M12.029 2.003a3 3 0 0 0-3 3c0 1.268.839 2.408 1.998 2.827l.002 3.173h-4a1 1 0 0 0-1 1l-.001 4.175c-1.151.396-2 1.557-2 2.825a3 3 0 1 0 6 0c0-1.268-.794-2.386-1.988-2.838l-.011-3.162h8l.007 3.177a2.993 2.993 0 0 0-2.007 2.823 3 3 0 1 0 6 0c0-1.268-.82-2.384-1.992-2.828l-.008-4.172a1 1 0 0 0-1-1h-4l-.003-3.177c1.164-.411 2.003-1.555 2.003-2.823a3 3 0 0 0-3-3Z"/>
  </svg>
);

export const GumroadSalesIcon = ({ className = '', size = 16 }: IconProps) => (
  <svg className={className} width={size} height={size} fill="currentColor" viewBox="0 0 24 24">
    <path d="M10.12 8.911a2.79 2.79 0 0 1 .68-.32v2.038a2.77 2.77 0 0 1-.68-.32c-.436-.292-.52-.562-.52-.7 0-.136.084-.406.52-.698Zm3.08 6.518V13.39c.265.086.495.197.68.32.437.292.52.562.52.699 0 .137-.083.407-.52.698a2.77 2.77 0 0 1-.68.32Z"/>
    <path fillRule="evenodd" d="M12 21.61a9.6 9.6 0 1 0 0-19.2 9.6 9.6 0 0 0 0 19.2zm1.2-15.6a1.2 1.2 0 0 0-2.4 0v.11c-.745.14-1.435.41-2.01.794-.867.578-1.59 1.507-1.59 2.696 0 1.189.723 2.118 1.59 2.695a5.442 5.442 0 0 0 2.01.795v2.329c-.469-.152-.817-.38-1.012-.606a1.2 1.2 0 1 0-1.812 1.573c.675.778 1.696 1.29 2.824 1.503v.11a1.2 1.2 0 1 0 2.4 0v-.11a5.442 5.442 0 0 0 2.012-.794c.866-.577 1.588-1.506 1.588-2.695 0-1.189-.722-2.118-1.588-2.696a5.442 5.442 0 0 0-2.012-.794V8.59c.47.153.817.382 1.012.606a1.2 1.2 0 1 0 1.813-1.573c-.675-.777-1.696-1.29-2.825-1.502V6.01Z" clipRule="evenodd"/>
  </svg>
);

export const GumroadAnalyticsIcon = ({ className = '', size = 16 }: IconProps) => (
  <svg className={className} width={size} height={size} fill="currentColor" viewBox="0 0 24 24">
    <path d="M18.014 3.999a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2v-12a2 2 0 0 0-2-2h-2zm-7 4a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2h-2zm-7 4a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2v-4a2 2 0 0 0-2-2h-2Z"/>
  </svg>
);

export const GumroadPayoutsIcon = ({ className = '', size = 16 }: IconProps) => (
  <svg className={className} width={size} height={size} fill="currentColor" viewBox="0 0 20 19">
    <path fillRule="evenodd" d="M10.596.558a1.2 1.2 0 0 0-1.191 0l-8.4 4.8A1.2 1.2 0 0 0 1.6 7.6V16a1.2 1.2 0 0 0 0 2.4h16.8a1.2 1.2 0 1 0 0-2.4V7.6a1.2 1.2 0 0 0 .596-2.242l-8.4-4.8ZM5.2 8.8A1.2 1.2 0 0 0 4 10v3.6a1.2 1.2 0 0 0 2.4 0V10a1.2 1.2 0 0 0-1.2-1.2ZM8.8 10a1.2 1.2 0 1 1 2.4 0v3.6a1.2 1.2 0 1 1-2.4 0V10zm6-1.2a1.2 1.2 0 0 0-1.2 1.2v3.6a1.2 1.2 0 0 0 2.4 0V10a1.2 1.2 0 0 0-1.2-1.2Z" clipRule="evenodd"/>
  </svg>
);

export const GumroadDiscoverIcon = ({ className = '', size = 16 }: IconProps) => (
  <svg className={className} width={size} height={size} fill="currentColor" viewBox="0 0 24 24">
    <path fillRule="evenodd" d="M9.6 4.81a4.8 4.8 0 1 0 0 9.6 4.8 4.8 0 0 0 0-9.6zm-7.2 4.8a7.2 7.2 0 1 1 13.07 4.173l5.779 5.78a1.2 1.2 0 0 1-1.697 1.696l-5.78-5.78A7.2 7.2 0 0 1 2.4 9.61Z" clipRule="evenodd"/>
  </svg>
);

export const GumroadLibraryIcon = ({ className = '', size = 16 }: IconProps) => (
  <svg className={className} width={size} height={size} fill="currentColor" viewBox="0 0 24 24">
    <path d="M7.998 2.015c-2.552 0-4 1.449-4 4.002v15.008c0 .719.746 1.189 1.406.907l6.594-2.814 6.594 2.814c.66.283 1.406-.189 1.406-.907V6.017c0-2.624-1.305-4.002-4-4.002h-8zm2 6.003c.721 0 1.367.366 1.72.845.095.131.28.406.28.406l.312-.406c.368-.483 1.014-.845 1.688-.845 1.105 0 2 .84 2 1.876 0 2.71-4 4.784-4 4.784s-4-2.074-4-4.784c0-1.036.895-1.876 2-1.876Z"/>
  </svg>
);

export const GumroadSettingsIcon = ({ className = '', size = 16 }: IconProps) => (
  <svg className={className} width={size} height={size} fill="currentColor" viewBox="0 0 24 24">
    <path d="M8.968 2.46A9.669 9.669 0 0 0 5.25 4.649c-.333.31-.435.818-.219 1.219.801 1.48-.037 3.065-1.843 3.156-.443.023-.834.35-.938.78A8.713 8.713 0 0 0 2 11.993c0 .687.074 1.464.22 2.156.09.432.465.743.905.782 1.818.157 2.718 1.543 1.906 3.312-.18.393-.098.863.22 1.156 1.061.983 2.281 1.675 3.718 2.125.41.129.873-.026 1.125-.375 1.112-1.538 2.725-1.544 3.781 0 .25.364.705.539 1.125.406a10.072 10.072 0 0 0 3.75-2.156c.33-.3.417-.787.22-1.187-.833-1.68.124-3.221 1.842-3.25.456-.008.862-.308.97-.75.172-.717.218-1.342.218-2.22 0-.753-.089-1.496-.25-2.218a.994.994 0 0 0-.969-.781c-1.69-.003-2.639-1.665-1.812-3.125a.979.979 0 0 0-.188-1.22 10.153 10.153 0 0 0-3.812-2.186.986.986 0 0 0-1.125.406c-.966 1.5-2.77 1.527-3.719.03-.243-.382-.724-.574-1.156-.436ZM12 7.993a4 4 0 1 1 0 8 4 4 0 0 1 0-8Z"/>
  </svg>
);

export const GumroadHelpIcon = ({ className = '', size = 16 }: IconProps) => (
  <svg className={className} width={size} height={size} fill="currentColor" viewBox="0 0 24 24">
    <path d="M6.014 3.999a4 4 0 0 0-4 4v8a4 4 0 0 0 4 4l3.01.01c.425 0 .871.196 1.382.667.2.184.437.414.6.629.18.24.414.697 1.008.694.594-.003.787-.407 1-.688.161-.198.354-.387.553-.571.512-.471 1.021-.741 1.447-.741h3a4 4 0 0 0 4-4v-8a4 4 0 0 0-4-4h-3c-1.21 0-2.266.556-3 1.406-.734-.85-1.789-1.406-3-1.406h-3Zm0 2h3a2 2 0 0 1 2 2l.006 10.649c-.624-.405-1.294-.65-2.006-.65h-3a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2Zm9 0h3a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-3c-.712 0-1.38.257-2.004.662l.004-10.662a2 2 0 0 1 2-2Z"/>
  </svg>
);

export const GumroadInfoIcon = ({ className = '', size = 16 }: IconProps) => (
  <svg className={className} width={size} height={size} fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 2.02c-5.524 0-10 4.477-10 10s4.476 10 10 10c5.522 0 10-4.477 10-10s-4.478-10-10-10Zm0 2a8 8 0 1 1-.001 16 8 8 0 0 1 0-16Zm0 3a1 1 0 1 0 0 2 1 1 0 0 0 0-2Zm0 3a1 1 0 0 0-1 1v5a1 1 0 0 0 2 0v-5a1 1 0 0 0-1-1Z"/>
  </svg>
);

export const GumroadCollapseIcon = ({ className = '', size = 16 }: IconProps) => (
  <svg className={className} width={size} height={size} fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 2a1 1 0 0 0-1 1v3.562l-2-1.968-1.406 1.406 3.687 3.72a1.03 1.03 0 0 0 1.438 0l3.687-3.72-1.406-1.406-2 1.968V3a1 1 0 0 0-1-1m-7 9a1 1 0 0 0 0 2h14a1 1 0 0 0 0-2zm7 3c-.256 0-.523.086-.72.281l-3.687 3.72 1.407 1.405 2-1.968v3.562a1 1 0 0 0 2 0v-3.562l2 1.968 1.406-1.406-3.687-3.719a1 1 0 0 0-.72-.281"/>
  </svg>
);

// Onboarding/Getting Started Icons
export const GumroadWelcomeIcon = ({ className = '' }: { className?: string }) => (
  <svg className={className} width="60" height="60" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="30" cy="30" r="28" fill="#FEF3C7" stroke="#000" strokeWidth="2"/>
    <path d="M30 15L35 25H25L30 15Z" fill="#FBBF24"/>
    <circle cx="30" cy="35" r="8" fill="#FBBF24" stroke="#000" strokeWidth="2"/>
    <path d="M26 33L29 36L34 31" stroke="#000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const GumroadProfileIcon = ({ className = '' }: { className?: string }) => (
  <svg className={className} width="60" height="60" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="30" cy="30" r="28" fill="#DBEAFE" stroke="#000" strokeWidth="2"/>
    <circle cx="30" cy="24" r="8" fill="#3B82F6" stroke="#000" strokeWidth="2"/>
    <path d="M18 45C18 38.373 23.373 33 30 33C36.627 33 42 38.373 42 45" stroke="#000" strokeWidth="2" fill="#3B82F6"/>
  </svg>
);

export const GumroadProductIcon = ({ className = '' }: { className?: string }) => (
  <svg className={className} width="60" height="60" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="12" y="12" width="36" height="36" rx="4" fill="#D1FAE5" stroke="#000" strokeWidth="2"/>
    <path d="M20 30H40M30 20V40" stroke="#10B981" strokeWidth="3" strokeLinecap="round"/>
  </svg>
);

export const GumroadFollowerIcon = ({ className = '' }: { className?: string }) => (
  <svg className={className} width="60" height="60" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="30" cy="30" r="28" fill="#FCE7F3" stroke="#000" strokeWidth="2"/>
    <circle cx="24" cy="26" r="6" fill="#EC4899" stroke="#000" strokeWidth="2"/>
    <circle cx="36" cy="26" r="6" fill="#EC4899" stroke="#000" strokeWidth="2"/>
    <path d="M14 42C14 36.477 18.477 32 24 32H36C41.523 32 46 36.477 46 42" stroke="#000" strokeWidth="2" fill="#EC4899"/>
  </svg>
);

export const GumroadSaleIcon = ({ className = '' }: { className?: string }) => (
  <svg className={className} width="60" height="60" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="30" cy="30" r="28" fill="#D1FAE5" stroke="#000" strokeWidth="2"/>
    <text x="30" y="38" textAnchor="middle" fontSize="24" fontWeight="bold" fill="#059669">$</text>
  </svg>
);

export const GumroadPayoutIcon = ({ className = '' }: { className?: string }) => (
  <svg className={className} width="60" height="60" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="10" y="20" width="40" height="24" rx="3" fill="#DBEAFE" stroke="#000" strokeWidth="2"/>
    <rect x="10" y="26" width="40" height="6" fill="#3B82F6"/>
    <circle cx="42" cy="38" r="4" fill="#FCD34D" stroke="#000" strokeWidth="1.5"/>
  </svg>
);

export const GumroadEmailBlastIcon = ({ className = '' }: { className?: string }) => (
  <svg className={className} width="60" height="60" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="10" y="16" width="40" height="28" rx="3" fill="#FEE2E2" stroke="#000" strokeWidth="2"/>
    <path d="M10 20L30 34L50 20" stroke="#000" strokeWidth="2"/>
    <circle cx="46" cy="18" r="6" fill="#EF4444" stroke="#000" strokeWidth="2"/>
    <path d="M44 18L46 20L49 16" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const GumroadSmallBetsIcon = ({ className = '' }: { className?: string }) => (
  <svg className={className} width="60" height="60" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="30" cy="30" r="28" fill="#FEF3C7" stroke="#000" strokeWidth="2"/>
    <path d="M22 38L30 22L38 38H22Z" fill="#F59E0B" stroke="#000" strokeWidth="2"/>
    <circle cx="30" cy="32" r="3" fill="#fff"/>
  </svg>
);

export const GumroadCheckIcon = ({ className = '', size = 12 }: IconProps) => (
  <svg className={className} width={size} height={size} fill="currentColor" viewBox="0 0 24 24">
    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
  </svg>
);
