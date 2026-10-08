import CEODeskClient from './CEODeskClient';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'CEO Desk | ROX OS',
  description: 'AI Autonomous Enterprise Command Center',
};

export default function CEODeskPage() {
  return <CEODeskClient />;
}
