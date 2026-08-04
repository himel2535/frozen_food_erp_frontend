import { Suspense } from 'react';
import { MessagesPage } from '@/components/modules/messages/MessagesPage';

export default function MessagesRoutePage() {
  return (
    <Suspense fallback={null}>
      <MessagesPage />
    </Suspense>
  );
}
