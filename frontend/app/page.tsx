import Dashboard from '@/components/Dashboard';
import SendSolDemo from '@/components/SendSolDemo';
import DemoBanner from '@/components/DemoBanner';

export default function Home() {
  return (
    <>
      <DemoBanner />
      <Dashboard />
      <SendSolDemo />
    </>
  );
}
