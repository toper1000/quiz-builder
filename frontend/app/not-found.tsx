import { ButtonLink } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/state-panels';

export default function NotFound() {
  return (
    <EmptyState
      title="Page not found"
      description="The page you are looking for does not exist."
      action={<ButtonLink href="/quizzes">Go to quizzes</ButtonLink>}
    />
  );
}
