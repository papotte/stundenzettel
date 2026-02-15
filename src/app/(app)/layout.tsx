import AppHeader from '@/components/app-header'
import BottomNav from '@/components/ui/bottom-nav'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AppHeader />
      {children}
      <BottomNav />
    </>
  )
}
