import { redirect } from 'next/navigation';

export default function BoardroomRedirect() {
  redirect('/dashboard/meetings');
}
