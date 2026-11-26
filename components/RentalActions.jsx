import Link from 'next/link';
import WorkspaceForm from './WorkspaceForm';
import { reportReasons } from '@/utils/workflow.mjs';

const input = 'mt-1 w-full rounded border border-slate-300 p-2';

export default function RentalActions({ id, role }) {
  if (!role) return <Link className='font-semibold text-brand-700 underline' href='/account'>Sign in to enquire, request a viewing or report a listing</Link>;
  return (
    <section className='rounded-xl border bg-white p-5'>
      <h2 className='text-lg font-bold'>Contact and safety</h2>
      {role === 'tenant' && <>
        <details className='mt-3'><summary className='cursor-pointer font-medium'>Contact landlord</summary>
          <WorkspaceForm action='enquiry' label='Send enquiry' data={{ property: id }}>
            <label>Message<textarea name='message' required maxLength={4000} className={input} /></label>
          </WorkspaceForm>
        </details>
        <details className='mt-3'><summary className='cursor-pointer font-medium'>Request a viewing</summary>
          <WorkspaceForm action='viewing' label='Request viewing' data={{ property: id }}>
            <label>Preferred date<input name='date' type='date' required className={input} /></label>
            <label>Preferred time (Ireland)<input name='time' type='time' required className={input} /></label>
            <label>Optional message<textarea name='message' maxLength={600} className={input} /></label>
          </WorkspaceForm>
        </details>
      </>}
      <details className='mt-3'><summary className='cursor-pointer font-medium'>Report suspicious listing</summary>
        <WorkspaceForm action='report' label='Submit private report' data={{ property: id }}>
          <label>Reason<select name='reason' required className={input}>{reportReasons.map(reason => <option key={reason}>{reason}</option>)}</select></label>
          <label>Additional description<textarea name='description' maxLength={2000} className={input} /></label>
        </WorkspaceForm>
      </details>
    </section>
  );
}
