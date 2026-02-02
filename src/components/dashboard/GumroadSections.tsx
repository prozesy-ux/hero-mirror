import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Check } from 'lucide-react';
import {
  GumroadWelcomeIcon,
  GumroadProfileIcon,
  GumroadProductIcon,
  GumroadFollowerIcon,
  GumroadSaleIcon,
  GumroadPayoutIcon,
  GumroadEmailBlastIcon,
  GumroadSmallBetsIcon,
  GumroadInfoIcon,
  GumroadCollapseIcon,
} from './GumroadIcons';

interface ChecklistItem {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  href?: string;
  isCompleted: boolean;
}

interface GettingStartedProps {
  onboardingProgress?: {
    accountCreated: boolean;
    profileCustomized: boolean;
    firstProductCreated: boolean;
    firstFollower: boolean;
    firstSale: boolean;
    firstPayout: boolean;
    firstEmailBlast: boolean;
    smallBetsSignup: boolean;
  };
}

export const GettingStartedSection = ({ onboardingProgress }: GettingStartedProps) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  // Default progress for buyers - some steps pre-completed
  const progress = onboardingProgress || {
    accountCreated: true,
    profileCustomized: true,
    firstProductCreated: false,
    firstFollower: false,
    firstSale: false,
    firstPayout: false,
    firstEmailBlast: false,
    smallBetsSignup: false,
  };

  const checklistItems: ChecklistItem[] = [
    {
      id: 'welcome',
      title: 'Welcome aboard',
      description: 'Make a Gumroad account.',
      icon: <GumroadWelcomeIcon className="w-15 h-15" />,
      isCompleted: progress.accountCreated,
    },
    {
      id: 'profile',
      title: 'Make an impression',
      description: 'Customize your profile.',
      icon: <GumroadProfileIcon className="w-15 h-15" />,
      href: '/dashboard/profile',
      isCompleted: progress.profileCustomized,
    },
    {
      id: 'product',
      title: 'Showtime',
      description: 'Create your first product.',
      icon: <GumroadProductIcon className="w-15 h-15" />,
      href: '/seller/products/new',
      isCompleted: progress.firstProductCreated,
    },
    {
      id: 'follower',
      title: 'Build your tribe',
      description: 'Get your first follower.',
      icon: <GumroadFollowerIcon className="w-15 h-15" />,
      href: '/dashboard/marketplace',
      isCompleted: progress.firstFollower,
    },
    {
      id: 'sale',
      title: 'Cha-ching',
      description: 'Make your first sale.',
      icon: <GumroadSaleIcon className="w-15 h-15" />,
      href: '/seller/orders',
      isCompleted: progress.firstSale,
    },
    {
      id: 'payout',
      title: 'Money inbound',
      description: 'Get your first pay out.',
      icon: <GumroadPayoutIcon className="w-15 h-15" />,
      href: '/dashboard/wallet',
      isCompleted: progress.firstPayout,
    },
    {
      id: 'email',
      title: 'Making waves',
      description: 'Send out your first email blast.',
      icon: <GumroadEmailBlastIcon className="w-15 h-15" />,
      href: '/seller/marketing',
      isCompleted: progress.firstEmailBlast,
    },
    {
      id: 'smallbets',
      title: 'Smart move',
      description: 'Sign up for Small Bets.',
      icon: <GumroadSmallBetsIcon className="w-15 h-15" />,
      href: '/seller',
      isCompleted: progress.smallBetsSignup,
    },
  ];

  if (isCollapsed) {
    return null;
  }

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-slate-900">Getting started</h2>
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="flex items-center gap-1 text-sm underline hover:no-underline"
        >
          <span>Show less</span>
          <GumroadCollapseIcon size={20} />
        </button>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {checklistItems.map((item) => {
          const CardContent = (
            <div 
              className="relative bg-white border rounded p-4 text-center hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-shadow cursor-pointer"
            >
              {/* Completion Badge */}
              {item.isCompleted ? (
                <span className="absolute top-2 right-2 w-5 h-5 bg-teal-600 rounded-full flex items-center justify-center">
                  <Check className="w-3 h-3 text-white" strokeWidth={3} />
                </span>
              ) : (
                <span className="absolute top-2 right-2 w-5 h-5 bg-neutral-800 rounded-full border-2 border-neutral-800" />
              )}
              
              {/* Icon */}
              <div className="w-15 h-15 mx-auto mb-3 flex items-center justify-center">
                {item.icon}
              </div>
              
              {/* Text */}
              <h3 className="font-semibold mb-1 text-slate-900">{item.title}</h3>
              <p className="text-sm text-slate-600/80">{item.description}</p>
            </div>
          );
          
          if (item.href && !item.isCompleted) {
            return (
              <Link key={item.id} to={item.href}>
                {CardContent}
              </Link>
            );
          }
          
          return <div key={item.id}>{CardContent}</div>;
        })}
      </div>
    </div>
  );
};

interface ActivityStatsProps {
  balance: number;
  last7Days: number;
  last28Days: number;
  totalEarnings: number;
  formatAmount: (amount: number) => string;
}

export const ActivityStatsSection = ({ 
  balance, 
  last7Days, 
  last28Days, 
  totalEarnings,
  formatAmount 
}: ActivityStatsProps) => {
  return (
    <div className="mb-8">
      <h2 className="text-xl font-semibold text-slate-900 mb-4">Activity</h2>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        {/* Balance Card */}
        <div className="bg-white border rounded p-8">
          <div className="flex items-center gap-2 text-base mb-2">
            <span className="text-slate-700">Balance</span>
            <GumroadInfoIcon size={16} className="text-slate-400" />
          </div>
          <div className="text-4xl font-semibold text-slate-900">{formatAmount(balance)}</div>
        </div>

        {/* Last 7 days Card */}
        <div className="bg-white border rounded p-8">
          <div className="flex items-center gap-2 text-base mb-2">
            <span className="text-slate-700">Last 7 days</span>
            <GumroadInfoIcon size={16} className="text-slate-400" />
          </div>
          <div className="text-4xl font-semibold text-slate-900">{formatAmount(last7Days)}</div>
        </div>

        {/* Last 28 days Card */}
        <div className="bg-white border rounded p-8">
          <div className="flex items-center gap-2 text-base mb-2">
            <span className="text-slate-700">Last 28 days</span>
            <GumroadInfoIcon size={16} className="text-slate-400" />
          </div>
          <div className="text-4xl font-semibold text-slate-900">{formatAmount(last28Days)}</div>
        </div>

        {/* Total earnings Card */}
        <div className="bg-white border rounded p-8">
          <div className="flex items-center gap-2 text-base mb-2">
            <span className="text-slate-700">Total earnings</span>
            <GumroadInfoIcon size={16} className="text-slate-400" />
          </div>
          <div className="text-4xl font-semibold text-slate-900">{formatAmount(totalEarnings)}</div>
        </div>
      </div>
    </div>
  );
};

export const ActivityEmptyState = () => {
  return (
    <div className="bg-white border border-dashed rounded p-6 text-center">
      <p className="text-slate-600">
        Followers and sales will show up here as they come in.
        For now,{' '}
        <Link to="/seller/products/new" className="underline hover:no-underline">
          create a product
        </Link>
        {' '}or{' '}
        <Link to="/dashboard/profile" className="underline hover:no-underline">
          customize your profile
        </Link>
      </p>
    </div>
  );
};

export const EmptyProductState = () => {
  return (
    <div className="bg-white border border-dashed rounded p-6 text-center">
      <img 
        src="https://assets.gumroad.com/packs/static/20f9d3e0a6869c1b28a1.png" 
        alt="Empty state illustration" 
        className="w-full max-w-md mx-auto mb-3"
      />
      <h2 className="text-xl font-semibold text-slate-900 mb-3">
        We're here to help you get paid for your work.
      </h2>
      <Link 
        to="/seller/products/new"
        className="inline-flex items-center bg-[#FF90E8] border border-black px-4 py-3 rounded hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-shadow font-medium"
      >
        Create your first product
      </Link>
      <div className="mt-3">
        <Link 
          to="/dashboard/marketplace" 
          className="underline text-sm text-slate-600 hover:no-underline"
        >
          Learn more about creating products
        </Link>
      </div>
    </div>
  );
};
