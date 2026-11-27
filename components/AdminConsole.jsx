'use client';
import StatusBadge from './StatusBadge';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import DashboardShell from './DashboardShell';
import { adminSections } from '@/utils/adminFilters.mjs';
import WorkspaceForm from './WorkspaceForm';

const labels = { registered: 'Registered users', tenants: 'Tenants', landlords: 'Landlords', total: 'Properties', pending: 'Pending listings', awaitingVerification: 'Pending verifications', openReports: 'Open reports' };
function Panel({ title, children }) {
  return <section className='rounded-xl border bg-white p-5'><h2 className='mb-4 text-lg font-bold'>{title}</h2>{children}</section>;
}

export default function AdminConsole() {
  const [search, setSearch] = useState('');
  const [section, setSection] = useState('users');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [version, refresh] = useState(0);
  const [state, setState] = useState(null);
  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/admin?' + new URLSearchParams({ search, section, status, page }), { signal: controller.signal, cache: 'no-store' })
      .then(async res => { if (!res.ok) throw new Error(); setState(await res.json()); })
      .catch(() => { if (!controller.signal.aborted) setState({ error: true }); });
    return () => controller.abort();
  }, [search, section, status, page, version]);
  const buttons = (action, row, options) => (
    <div className='flex flex-wrap gap-2'>{options.map(([status, label]) => <WorkspaceForm key={status} endpoint='/api/admin' action={action} data={{ id: row._id, status }} label={label} confirmText={['removed','suspended'].includes(status) ? label + '?' : undefined} onSuccess={() => refresh(value => value + 1)} />)}</div>
  );
  return <DashboardShell title='Administration' links={[['#overview','Platform overview'],['#moderation','Moderation queues']]}><section id='overview'>
    <h1 className='mb-5 text-3xl font-bold text-brand-800'>Administrator dashboard</h1>
    <div id='moderation' className='mb-4 flex flex-wrap gap-2' aria-label='Moderation queues'>
      {Object.entries(adminSections).map(([key, {label}]) => <button key={key} type='button' aria-pressed={section === key} className={'tn-button ' + (section === key ? 'tn-primary' : 'tn-secondary')} onClick={() => { if (section === key) return; setSection(key); setPage(1); setStatus(''); setSearch(''); setState(null); }}>{label}</button>)}
    </div>
    <form key={section} className='mb-5 flex flex-wrap items-end gap-3' onSubmit={event => {
      event.preventDefault();
      const fields = new FormData(event.currentTarget);
      setPage(1); setSearch(fields.get('search')); setStatus(fields.get('status'));
    }}>
      <label>Search {adminSections[section].label.toLowerCase()}<input name='search' type='search' defaultValue={search} maxLength={80} className='tn-field' /></label>
      <label>Status<select name='status' className='tn-field' defaultValue={status}><option value=''>Any status</option>{adminSections[section].states.map(value => <option key={value}>{value}</option>)}</select></label>
      <button className='tn-button tn-primary'>Apply filters</button>
    </form>
    {!state ? <p role='status'>Loading administration…</p> : state.error ? <p role='alert'>Administration unavailable.</p> : <>
      <dl className='mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4'>{Object.entries(state.counts).map(([key, count]) => <div className='rounded-xl border bg-white p-4' key={key}><dt>{labels[key]}</dt><dd className='text-2xl font-bold'>{count}</dd></div>)}</dl>
      <div className='grid gap-5 lg:grid-cols-2'>
        {state.users && <Panel title='Users'>{!state.users.length && <p>No matching users.</p>}<ul className='divide-y'>{state.users.map(row => <li className='break-words py-2' key={row._id}>{row.username} · {row.email} · {row.role ?? 'tenant'} · {row.deleted ? 'deleted' : row.suspended ? 'suspended' : 'active'}
          {!row.deleted && row.role !== 'admin' && buttons('account', row, row.suspended ? [['active','Reactivate']] : [['suspended','Suspend account']])}</li>)}</ul></Panel>}
        {state.properties && <Panel title='Listings'>{!state.properties.length && <p>No landlord listings.</p>}<ul className='divide-y'>{state.properties.map(row => <li className='break-words py-2' key={row._id}><Link href={'/properties/' + row._id + '?preview=1'} className='text-brand-700 underline'>{row.name}</Link> <StatusBadge status={row.status ?? 'active'} />
          {buttons('listing', row, row.status === 'pending' ? [['active','Approve'],['rejected','Reject'],['removed','Remove listing']] : row.status === 'removed' ? [] : [['removed','Remove listing']])}</li>)}</ul></Panel>}
        {state.verifications && <Panel title='Landlord verification'>{!state.verifications.length && <p>No submissions.</p>}<ul className='divide-y'>{state.verifications.map(row => <li className='break-words py-2' key={row._id}><strong>{row.name}</strong> <StatusBadge status={row.status} /><p>{row.statement}</p>
          {buttons('verification', row, row.status === 'pending' ? [['approved','Approve'],['rejected','Reject']] : row.status === 'approved' ? [['suspended','Suspend verification']] : [])}</li>)}</ul></Panel>}
        {state.reports && <Panel title='Scam reports'>{!state.reports.length && <p>No reports.</p>}<ul className='divide-y'>{state.reports.map(row => <li className='break-words py-2' key={row._id}><strong>{row.reason}</strong> · {row.status}<p>{row.description}</p>
          <Link href={'/properties/' + row.property + '?preview=1'} className='text-brand-700 underline'>View listing</Link>
          {buttons('report', row, ['open','in-review'].includes(row.status) ? [...(row.status === 'open' ? [['in-review','Start review']] : []), ['resolved','Resolve'],['dismissed','Dismiss']] : [])}</li>)}</ul></Panel>}
        {state.audit && <Panel title='Recent administrative activity'>{!state.audit.length && <p>No recorded actions.</p>}<ul className='divide-y'>{state.audit.map(row => <li className='py-2' key={row._id}>{row.action} · {row.status} · {row.outcome ?? 'applied'} · {new Date(row.createdAt).toLocaleString('en-IE', { timeZone: 'Europe/Dublin' })}</li>)}</ul></Panel>}
      </div>
      <nav aria-label='Administration pages' className='mt-4 flex flex-wrap items-center gap-3'>
        <button type='button' className='tn-button tn-secondary' disabled={page === 1} onClick={() => setPage(page - 1)}>Previous</button>
        <span className='text-sm'>Page {state.page} · {state.totalRows} records</span>
        <button type='button' className='tn-button tn-secondary' disabled={page >= 200 || page * state.size >= state.totalRows} onClick={() => setPage(page + 1)}>Next</button>
      </nav>
    </>}
  </section></DashboardShell>;
}
