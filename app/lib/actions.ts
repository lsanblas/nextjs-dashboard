'use server';

import { z } from 'zod';
import { sql } from '@vercel/postgres';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { signIn } from '@/auth';
import { AuthError } from 'next-auth';

const FormSchema = z.object({
  id: z.string(),
  customerId: z.string({
    invalid_type_error: 'Please select a customer.',
  }),
  amount: z.coerce
    .number()
    .gt(0, { message: 'Please enter an amount greater than $0.' }),
  status: z.enum(['pending', 'paid'], {
    invalid_type_error: 'Please select an invoice status.',
  }),
  date: z.string(),
});

const FormCustomerSchema = z.object({
  id: z.string(),
  name: z.string({
    invalid_type_error: 'Please enter the customer name.',
  }),
  email: z.string({
    invalid_type_error: 'Please enter the customer email.',
  }),
});
   
const CreateInvoice = FormSchema.omit({ id: true, date: true });
const UpdateInvoice = FormSchema.omit({ id: true, date: true });

const CreateCustomer = FormCustomerSchema.omit({ id: true });
const UpdateCustomer = FormCustomerSchema.omit({ id: true });

export type State = {
  errors?: {
    customerId?: string[];
    amount?: string[];
    status?: string[];
  };
  message?: string | null;
};

export type StateCustomer = {
  errors?: {
    name?: string[];
    email?: string[];
  };
  message?: string | null;
};

export async function createInvoice(prevState: State, formData: FormData) {

  // Validate form using Zod
  const validatedFields = CreateInvoice.safeParse({
      customerId: formData.get('customerId'),
      amount: formData.get('amount'),
      status: formData.get('status'),
  });

  // If form validation fails, return errors early. Otherwise, continue.
  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Missing Fields. Failed to Create Invoice.',
    };
  }

  // Prepare data for insertion into the database
  const { customerId, amount, status } = validatedFields.data;
  const amountInCents = amount * 100;
  const date = new Date().toISOString().split('T')[0];

  // Insert data into the database
  try {
      await sql`
      INSERT INTO invoices (customer_id, amount, status, date)
      VALUES (${customerId}, ${amountInCents}, ${status}, ${date})
      `;  
  } catch (error) {
      // If a database error occurs, return a more specific error.
      return {
          message: 'Database Error: Failed to Create Invoice.',
        };
  }

  // Revalidate the cache for the invoices page and redirect the user.
  revalidatePath('/dashboard/invoices');
  redirect('/dashboard/invoices');
}

  export async function updateInvoice(id: string, prevState: State, formData: FormData) {  
    
    // Validate form using Zod
    const validatedFields = UpdateInvoice.safeParse({
    customerId: formData.get('customerId'),
    amount: formData.get('amount'),
    status: formData.get('status'),
    });

    // If form validation fails, return errors early. Otherwise, continue.
    if (!validatedFields.success) {
      return {
        errors: validatedFields.error.flatten().fieldErrors,
        message: 'Missing Fields. Failed to Update Invoice.',
      };
    }

    // Prepare data for insertion into the database
    const { customerId, amount, status } = validatedFields.data;
    const amountInCents = amount * 100;

    // Update data into the database
    try {
        await sql`
        UPDATE invoices
        SET customer_id = ${customerId}, amount = ${amountInCents}, status = ${status}
        WHERE id = ${id}
        `;
    } catch (error) {
        // If a database error occurs, return a more specific error.
        return { message: 'Database Error: Failed to Update Invoice.',};
    }

    // Revalidate the cache for the invoices page and redirect the user.
    revalidatePath('/dashboard/invoices');
    redirect('/dashboard/invoices');
  }

  export async function deleteInvoice(id: string) {
    try {
        await sql`DELETE FROM invoices WHERE id = ${id}`;
        revalidatePath('/dashboard/invoices');
        return { message: 'Deleted Invoice.' };
    }
    catch (error) {
        return { message: 'Database Error: Failed to Delete Invoice.',};
    }
  }

  export async function authenticate(
    prevState: string | undefined,
    formData: FormData,
  ) {
    try {
      await signIn('credentials', formData);
    } catch (error) {
      if (error instanceof AuthError) {
        switch (error.type) {
          case 'CredentialsSignin':
            return 'Invalid credentials.';
          default:
            return 'Something went wrong.';
        }
      }
      throw error;
    }
  }

  export async function deleteCustomer(id: string) {
    try {
        await sql`DELETE FROM customers WHERE id = ${id}`;
        revalidatePath('/dashboard/customers');
        return { message: 'Deleted Customer.' };
    }
    catch (error) {
        return { message: 'Database Error: Failed to Delete Customer.',};
    }
  }

  export async function createCustomer(prevState: StateCustomer, formData: FormData) {
    console.log('Creating customer');

    // Validate form using Zod
    const validatedFields = CreateCustomer.safeParse({
        name: formData.get('name'),
        email: formData.get('email'),
    });
  
    // If form validation fails, return errors early. Otherwise, continue.
    if (!validatedFields.success) {
      return {
        errors: validatedFields.error.flatten().fieldErrors,
        message: 'Missing Fields. Failed to Create Customer.',
      };
    }
  
    // Prepare data for insertion into the database
    const { name, email } = validatedFields.data;
    const image_url = '/customers/new-user.png';
    const defaultValue = 0;
  
    // Insert data into the database
    try {
        await sql`
        INSERT INTO customers (name, email, image_url)
        VALUES (${name}, ${email}, ${image_url})
        `;  
    } catch (error) {
        console.log(error);
        // If a database error occurs, return a more specific error.
        return {
            message: 'Database Error: Failed to Create Customer.',
          };
    }
  
    // Revalidate the cache for the customers page and redirect the user.
    revalidatePath('/dashboard/customers');
    redirect('/dashboard/customers');
  }

  export async function updateCustomer(id: string, prevState: StateCustomer, formData: FormData) {  
    
    // Validate form using Zod
    const validatedFields = UpdateCustomer.safeParse({
      name: formData.get('name'),
      email: formData.get('email'),
    });

    // If form validation fails, return errors early. Otherwise, continue.
    if (!validatedFields.success) {
      return {
        errors: validatedFields.error.flatten().fieldErrors,
        message: 'Missing Fields. Failed to Update Customer.',
      };
    }

    // Prepare data for insertion into the database
    const { name, email } = validatedFields.data;

    // Update data into the database
    try {
        await sql`
        UPDATE customers
        SET name = ${name}, email = ${email}
        WHERE id = ${id}
        `;
    } catch (error) {
        // If a database error occurs, return a more specific error.
        return { message: 'Database Error: Failed to Update Customer.',};
    }

    // Revalidate the cache for the customers page and redirect the user.
    revalidatePath('/dashboard/customers');
    redirect('/dashboard/customers');
  }