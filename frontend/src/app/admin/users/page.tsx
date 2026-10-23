'use client';

import { Plus } from 'lucide-react';
import { useState } from 'react';
import { AdminPageHeader } from '@/features/admin/AdminShell';
import { useAuth } from '@/features/admin/AuthContext';
import { useToast } from '@/features/admin/Toast';
import { ConfirmButton, ErrorNotice, Panel, Spinner, StatusBadge, btn, inputCls, useLoader } from '@/features/admin/ui';
import { admin, type AdminUser } from '@/services/admin';
import { ClientApiError } from '@/services/client';

interface Role {
  id: number;
  name: string;
  label: string;
  description: string | null;
  permissions: Array<{ key: string; label: string; group: string }>;
}

function UserForm({ roles, user, onDone }: { roles: Role[]; user: AdminUser | null; onDone: () => void }) {
  const toast = useToast();
  const [name, setName] = useState(user?.name ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState(user?.status ?? 'active');
  const [roleIds, setRoleIds] = useState<number[]>(user?.roles?.map((r) => r.id) ?? []);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErrors({});
    try {
      if (user) {
        await admin.patch(`/admin/users/${user.id}`, { name, email, status, role_ids: roleIds });
        if (password) await admin.post(`/admin/users/${user.id}/password`, { password });
      } else {
        await admin.post('/admin/users', { name, email, password, status, role_ids: roleIds });
      }
      toast('success', user ? 'User updated.' : 'User created. Share the password securely and ask them to change it.');
      onDone();
    } catch (err) {
      if (err instanceof ClientApiError) {
        setErrors(err.fields);
        toast('error', err.message);
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label htmlFor="u-name" className="mb-1 block text-sm font-semibold">
            Name
          </label>
          <input id="u-name" required value={name} onChange={(e) => setName(e.target.value)} className={inputCls} aria-invalid={!!errors.name} />
        </div>
        <div>
          <label htmlFor="u-email" className="mb-1 block text-sm font-semibold">
            Email
          </label>
          <input id="u-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} aria-invalid={!!errors.email} />
        </div>
        <div>
          <label htmlFor="u-pw" className="mb-1 block text-sm font-semibold">
            {user ? 'Set a new password (optional)' : 'Initial password'}
          </label>
          <input id="u-pw" type="password" autoComplete="new-password" required={!user} value={password} onChange={(e) => setPassword(e.target.value)} className={inputCls} aria-describedby="u-pw-hint" />
          <p id="u-pw-hint" className="mt-1 text-xs text-muted">
            At least 12 characters with upper- and lower-case letters and a number.
          </p>
        </div>
        <div>
          <label htmlFor="u-status" className="mb-1 block text-sm font-semibold">
            Account status
          </label>
          <select id="u-status" value={status} onChange={(e) => setStatus(e.target.value as 'active' | 'disabled')} className={inputCls}>
            <option value="active">Active</option>
            <option value="disabled">Disabled</option>
          </select>
        </div>
      </div>
      <fieldset>
        <legend className="mb-2 text-sm font-semibold">Roles</legend>
        <div className="grid gap-2 md:grid-cols-2">
          {roles.map((r) => (
            <label key={r.id} className="flex gap-3 rounded border border-line p-3 text-sm">
              <input type="checkbox" className="mt-0.5 accent-brand-700" checked={roleIds.includes(r.id)} onChange={(e) => setRoleIds(e.target.checked ? [...roleIds, r.id] : roleIds.filter((x) => x !== r.id))} />
              <span>
                <span className="block font-semibold text-ink">{r.label}</span>
                <span className="text-muted">{r.description}</span>
              </span>
            </label>
          ))}
        </div>
        {errors.role_ids && <p className="mt-1 text-sm text-danger">{errors.role_ids}</p>}
      </fieldset>
      <div className="flex gap-2">
        <button type="submit" className={btn.primary} disabled={busy}>
          {busy ? 'Saving…' : user ? 'Save user' : 'Create user'}
        </button>
        <button type="button" className={btn.secondary} onClick={onDone}>
          Cancel
        </button>
      </div>
    </form>
  );
}

export default function UsersPage() {
  const { can, session } = useAuth();
  const toast = useToast();
  const users = useLoader(() => admin.list<AdminUser>('/admin/users?pageSize=100'), []);
  const roles = useLoader(() => admin.get<Role[]>('/admin/users/roles'), []);
  const [editing, setEditing] = useState<AdminUser | 'new' | null>(null);

  return (
    <>
      <AdminPageHeader
        title="Users & roles"
        crumbs={[{ label: 'Users & roles' }]}
        description="Administrative accounts. Permissions are enforced by the API for every request."
        actions={can('users.create') && !editing && <button type="button" className={btn.primary} onClick={() => setEditing('new')}><Plus aria-hidden className="size-4" /> New user</button>}
      />
      {(users.error || roles.error) && <ErrorNotice error={users.error ?? roles.error ?? ''} />}
      {editing && roles.data && (
        <Panel title={editing === 'new' ? 'New user' : `Edit ${editing.name}`} className="mb-6">
          <UserForm
            roles={roles.data}
            user={editing === 'new' ? null : editing}
            onDone={() => {
              setEditing(null);
              void users.reload();
            }}
          />
        </Panel>
      )}
      {users.loading && !users.data && <Spinner />}
      {users.data && (
        <div className="overflow-x-auto rounded-(--radius-card) border border-line bg-white">
          <table className="w-full text-left text-sm">
            <caption className="sr-only">Users</caption>
            <thead className="border-b border-line bg-surface text-xs tracking-wide text-muted uppercase">
              <tr>
                <th scope="col" className="px-3 py-3">Name</th>
                <th scope="col" className="px-3 py-3">Roles</th>
                <th scope="col" className="px-3 py-3">Last sign-in</th>
                <th scope="col" className="px-3 py-3">Status</th>
                <th scope="col" className="px-3 py-3"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              {users.data.data.map((u) => (
                <tr key={u.id} className="border-b border-line last:border-0">
                  <td className="px-3 py-2.5">
                    <span className="font-semibold text-ink">{u.name}</span>
                    <span className="block text-muted">{u.email}</span>
                  </td>
                  <td className="px-3 py-2.5">{u.roles?.map((r) => r.label).join(', ')}</td>
                  <td className="px-3 py-2.5">{u.last_login_at ? new Date(u.last_login_at).toLocaleString('en-GB') : 'Never'}</td>
                  <td className="px-3 py-2.5">
                    <StatusBadge status={u.status} />
                  </td>
                  <td className="px-3 py-2.5 text-right whitespace-nowrap">
                    {can('users.update') && (
                      <button type="button" className={`${btn.link} mr-3`} onClick={() => setEditing(u)}>
                        Edit<span className="sr-only"> {u.name}</span>
                      </button>
                    )}
                    {can('users.delete') && u.id !== session.user.id && (
                      <ConfirmButton
                        className="font-semibold text-danger hover:underline"
                        title="Delete this user?"
                        message={`${u.email} will no longer be able to sign in. Their content stays on the website.`}
                        confirmLabel="Delete user"
                        onConfirm={async () => {
                          try {
                            await admin.del(`/admin/users/${u.id}`);
                            toast('success', 'User deleted.');
                            void users.reload();
                          } catch (e) {
                            toast('error', e instanceof ClientApiError ? e.message : 'Delete failed');
                          }
                        }}
                      >
                        Delete
                      </ConfirmButton>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {roles.data && (
        <Panel title="What each role can do" className="mt-8">
          <div className="grid gap-4 md:grid-cols-2">
            {roles.data.map((r) => (
              <details key={r.id} className="rounded border border-line p-3 text-sm">
                <summary className="cursor-pointer font-semibold text-ink">
                  {r.label} <span className="font-normal text-muted">({r.permissions.length} permissions)</span>
                </summary>
                <p className="mt-2 text-muted">{r.description}</p>
                <ul className="mt-2 columns-2 text-xs text-muted">
                  {r.permissions.map((p) => (
                    <li key={p.key}>{p.label}</li>
                  ))}
                </ul>
              </details>
            ))}
          </div>
        </Panel>
      )}
    </>
  );
}
