'use client';
import { useTranslation } from '@/context/i18n-context';
import { useAuth } from '@/hooks/use-auth';
import { Cog, FileSpreadsheet, Home } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

const navItems = [
  {
    href: '/',
    icon: Home,
    labelKey: 'bottomNav.home',
    labelDefault: 'Home',
  },
  {
    href: '/export',
    icon: FileSpreadsheet,
    labelKey: 'bottomNav.export',
    labelDefault: 'Export',
  },
  {
    href: '/settings',
    icon: Cog,
    labelKey: 'bottomNav.settings',
    labelDefault: 'Settings',
  },
];

export default function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { signOut } = useAuth();
  const { t } = useTranslation();

  const handleSignOut = async () => {
    await signOut();
    router.push('/login');
  };

  return (
    <nav className="fixed bottom-0 left-0 z-50 w-full bg-white border-t border-gray-200 shadow md:hidden" role="navigation" aria-label="Bottom navigation">
      <ul className="flex justify-around items-center h-16">
        {navItems.map(({ href, icon: Icon, labelKey, labelDefault }) => {
          const isActive = pathname === href;
          return (
            <li key={href} className="flex-1">
              <Link 
                href={href} 
                className="flex flex-col items-center justify-center h-full w-full"
                {...(isActive ? { 'aria-current': 'page' } : {})}
              >
                <Icon className={`h-6 w-6 mb-1 ${isActive ? 'text-primary' : 'text-gray-400'}`} />
                <span className={`text-xs block ${isActive ? 'text-primary font-semibold' : 'text-gray-500'}`}>{t(labelKey, { defaultValue: labelDefault })}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
} 