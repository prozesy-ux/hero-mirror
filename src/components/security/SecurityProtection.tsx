import { ReactNode } from 'react';

interface SecurityProtectionProps {
  children: ReactNode;
}

// Simplified security wrapper - no blocking, no detection
// Just passes through children directly
const SecurityProtection = ({ children }: SecurityProtectionProps) => {
  return <>{children}</>;
};

export default SecurityProtection;
