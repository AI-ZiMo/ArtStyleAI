import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { useUser } from '@/contexts/UserContext';
import { useTranslation } from 'react-i18next';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Menu } from 'lucide-react';
import { useLocation } from 'wouter';
import LanguageSwitcher from './LanguageSwitcher';

export default function NavBar() {
  const { user, loading } = useUser();
  const { t } = useTranslation();
  const [location] = useLocation();

  return (
    <nav className="bg-white shadow-sm py-3">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            </div>
            <Link href="/">
              <span className="text-primary font-poppins font-semibold text-xl cursor-pointer">
                Imagic AI
              </span>
            </Link>
          </div>

          <div className="hidden md:flex space-x-6">
            <Link href="/">
              <span className={`${location === '/' ? 'text-primary border-b-2 border-primary pb-1' : 'text-textDark'} font-medium cursor-pointer`}>
                {t('nav.home')}
              </span>
            </Link>
            <Link href="/batch-generate">
              <span className={`${location === '/batch-generate' ? 'text-primary border-b-2 border-primary pb-1' : 'text-textDark'} font-medium cursor-pointer`}>
                {t('nav.batchGenerate')}
              </span>
            </Link>
            <Link href="/redeem-points">
              <span className={`${location === '/redeem-points' ? 'text-primary border-b-2 border-primary pb-1' : 'text-textDark'} font-medium cursor-pointer`}>
                {t('nav.redeemPoints')}
              </span>
            </Link>
            <Link href="/history">
              <span className={`${location === '/history' ? 'text-primary border-b-2 border-primary pb-1' : 'text-textDark'} font-medium cursor-pointer`}>
                {t('nav.history')}
              </span>
            </Link>
            <LanguageSwitcher />
          </div>

          <div className="flex items-center space-x-4">
            {loading ? (
              <>
                <Skeleton className="h-8 w-16 rounded-full" />
                <Skeleton className="h-8 w-28" />
              </>
            ) : (
              <>
                <div className="flex items-center bg-yellow-50 rounded-full px-3 py-1">
                  <span className="text-yellow-600 mr-1">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </span>
                  <span className="font-medium text-sm">{user?.points || 0}</span>
                </div>
                <div className="hidden md:flex items-center">
                  <span className="text-sm text-gray-500 mr-2">{user?.email || 'demo@example.com'}</span>
                  <Button size="sm" className="rounded-full">
                    {t('nav.logout')}
                  </Button>
                </div>
              </>
            )}

            <div className="md:hidden">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Menu className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>
                    <Link href="/">{t('nav.home')}</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Link href="/batch-generate">{t('nav.batchGenerate')}</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Link href="/redeem-points">{t('nav.redeemPoints')}</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Link href="/history">{t('nav.history')}</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <LanguageSwitcher />
                  </DropdownMenuItem>
                  <DropdownMenuItem>{t('nav.logout')}</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
