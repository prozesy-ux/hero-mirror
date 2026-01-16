import { ReactNode } from 'react';

interface SecurityProtectionProps {
  children: ReactNode;
}

// Security protection is completely disabled as per user request
// This component now just passes through children without any security checks
const SecurityProtection = ({ children }: SecurityProtectionProps) => {
  return <>{children}</>;
};

export default SecurityProtection;