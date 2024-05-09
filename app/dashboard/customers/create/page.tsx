import Form from '@/app/dashboard/customers/create/create-form';
import Breadcrumbs from '@/app/dashboard/customers/breadcrumbs';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Create customer',
};
 
export default async function Page() {
 
  return (
    <main>
      <Breadcrumbs
        breadcrumbs={[
          { label: 'Customers', href: '/dashboard/customers' },
          {
            label: 'Create Customer',
            href: '/dashboard/customers/create',
            active: true,
          },
        ]}
      />
      <Form />
    </main>
  );
}