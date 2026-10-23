'use client';

import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { AdminPageHeader } from '@/features/admin/AdminShell';
import { useAuth } from '@/features/admin/AuthContext';
import { useToast } from '@/features/admin/Toast';
import { ErrorNotice, Panel, Spinner, btn, inputCls, useLoader } from '@/features/admin/ui';
import { admin } from '@/services/admin';
import { ClientApiError } from '@/services/client';

interface Node {
  key: string;
  label: string;
  url: string;
  description: string;
  open_in_new_tab: boolean;
  is_enabled: boolean;
  children: Node[];
}
interface ApiNode {
  label: string;
  url: string | null;
  href: string;
  description: string | null;
  open_in_new_tab: boolean;
  is_enabled: boolean;
  children: ApiNode[];
}
interface ApiMenu {
  id: number;
  key: string;
  name: string;
  items: ApiNode[];
}

let seq = 0;
const fromApi = (items: ApiNode[]): Node[] =>
  items.map((i) => ({
    key: `n${++seq}`,
    label: i.label,
    url: i.url ?? i.href ?? '',
    description: i.description ?? '',
    open_in_new_tab: i.open_in_new_tab,
    is_enabled: i.is_enabled,
    children: fromApi(i.children),
  }));
const toApi = (items: Node[]): unknown[] =>
  items.map((i) => ({
    label: i.label,
    url: i.url || null,
    description: i.description || null,
    open_in_new_tab: i.open_in_new_tab,
    is_enabled: i.is_enabled,
    children: toApi(i.children),
  }));

type Path = number[];
const getList = (tree: Node[], path: Path): Node[] => path.reduce<Node[]>((list, idx) => list[idx].children, tree);
const clone = (t: Node[]): Node[] => structuredClone(t);

function ItemEditor({ node, path, depth, tree, setTree, editable }: { node: Node; path: Path; depth: number; tree: Node[]; setTree: (t: Node[]) => void; editable: boolean }) {
  const idx = path[path.length - 1];
  const parentPath = path.slice(0, -1);
  const mutate = (fn: (t: Node[]) => void) => {
    const t = clone(tree);
    fn(t);
    setTree(t);
  };
  const update = (patch: Partial<Node>) => mutate((t) => Object.assign(getList(t, parentPath)[idx], patch));
  const siblings = getList(tree, parentPath);
  const id = `mi-${node.key}`;

  return (
    <li className="rounded border border-line bg-white">
      <div className="grid gap-3 p-3 md:grid-cols-[1fr_1.4fr_auto] md:items-end">
        <div>
          <label htmlFor={`${id}-label`} className="mb-1 block text-xs font-semibold text-muted">
            Label
          </label>
          <input id={`${id}-label`} value={node.label} onChange={(e) => update({ label: e.target.value })} className={inputCls} disabled={!editable} />
        </div>
        <div>
          <label htmlFor={`${id}-url`} className="mb-1 block text-xs font-semibold text-muted">
            Link (/path or https://…)
          </label>
          <input id={`${id}-url`} value={node.url} onChange={(e) => update({ url: e.target.value })} className={inputCls} disabled={!editable} placeholder={node.children.length ? 'Optional for dropdowns' : '/about'} />
        </div>
        {editable && (
          <div className="flex flex-wrap gap-1">
            <button type="button" className="rounded p-2 hover:bg-surface disabled:opacity-30" aria-label={`Move ${node.label} up`} disabled={idx === 0} onClick={() => mutate((t) => { const l = getList(t, parentPath); [l[idx - 1], l[idx]] = [l[idx], l[idx - 1]]; })}>
              <ArrowUp aria-hidden className="size-4" />
            </button>
            <button type="button" className="rounded p-2 hover:bg-surface disabled:opacity-30" aria-label={`Move ${node.label} down`} disabled={idx === siblings.length - 1} onClick={() => mutate((t) => { const l = getList(t, parentPath); [l[idx + 1], l[idx]] = [l[idx], l[idx + 1]]; })}>
              <ArrowDown aria-hidden className="size-4" />
            </button>
            <button type="button" className="rounded p-2 hover:bg-surface disabled:opacity-30" aria-label={`Nest ${node.label} under the item above`} disabled={idx === 0 || depth >= 2} onClick={() => mutate((t) => { const l = getList(t, parentPath); const [n] = l.splice(idx, 1); l[idx - 1].children.push(n); })}>
              <ArrowRight aria-hidden className="size-4" />
            </button>
            <button type="button" className="rounded p-2 hover:bg-surface disabled:opacity-30" aria-label={`Move ${node.label} out one level`} disabled={depth === 0} onClick={() => mutate((t) => { const l = getList(t, parentPath); const [n] = l.splice(idx, 1); const grand = getList(t, parentPath.slice(0, -1)); grand.splice(parentPath[parentPath.length - 1] + 1, 0, n); })}>
              <ArrowLeft aria-hidden className="size-4" />
            </button>
            <button type="button" className="rounded p-2 text-danger hover:bg-[#fdf0ee]" aria-label={`Remove ${node.label}`} onClick={() => mutate((t) => { getList(t, parentPath).splice(idx, 1); })}>
              <Trash2 aria-hidden className="size-4" />
            </button>
          </div>
        )}
      </div>
      <div className="flex flex-wrap gap-x-5 gap-y-1 border-t border-line px-3 py-2 text-sm">
        <label className="flex items-center gap-2">
          <input type="checkbox" className="accent-brand-700" checked={node.is_enabled} disabled={!editable} onChange={(e) => update({ is_enabled: e.target.checked })} /> Visible
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" className="accent-brand-700" checked={node.open_in_new_tab} disabled={!editable} onChange={(e) => update({ open_in_new_tab: e.target.checked })} /> Open in new tab
        </label>
        {depth === 0 && (
          <label className="flex min-w-72 flex-1 items-center gap-2">
            <span className="shrink-0 text-muted">Dropdown description</span>
            <input value={node.description} disabled={!editable} onChange={(e) => update({ description: e.target.value })} className={`${inputCls} py-1`} aria-label="Dropdown description" />
          </label>
        )}
      </div>
      {node.children.length > 0 && (
        <ul className="space-y-2 border-t border-line bg-surface p-3 pl-6">
          {node.children.map((c, i) => (
            <ItemEditor key={c.key} node={c} path={[...path, i]} depth={depth + 1} tree={tree} setTree={setTree} editable={editable} />
          ))}
        </ul>
      )}
    </li>
  );
}

function MenuEditor({ menu, onSaved }: { menu: ApiMenu; onSaved: () => void }) {
  const { can } = useAuth();
  const toast = useToast();
  const [tree, setTree] = useState<Node[]>(() => fromApi(menu.items));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const editable = can('menus.update');

  const save = async () => {
    setSaving(true);
    setError('');
    try {
      await admin.put(`/admin/menus/${menu.key}`, { items: toApi(tree) });
      toast('success', `${menu.name} saved. The website updates within moments.`);
      onSaved();
    } catch (e) {
      const msg = e instanceof ClientApiError ? (Object.values(e.fields)[0] ? `${e.message} ${Object.values(e.fields)[0]}` : e.message) : 'Save failed';
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Panel
      title={menu.name}
      actions={
        editable && (
          <div className="flex gap-2">
            <button type="button" className={btn.secondary} onClick={() => setTree([...tree, { key: `n${++seq}`, label: 'New item', url: '/', description: '', open_in_new_tab: false, is_enabled: true, children: [] }])}>
              <Plus aria-hidden className="size-4" /> Add item
            </button>
            <button type="button" className={btn.primary} disabled={saving} onClick={() => void save()}>
              {saving ? 'Saving…' : 'Save menu'}
            </button>
          </div>
        )
      }
    >
      {error && <ErrorNotice error={error} />}
      <ul className="mt-2 space-y-2">
        {tree.map((n, i) => (
          <ItemEditor key={n.key} node={n} path={[i]} depth={0} tree={tree} setTree={setTree} editable={editable} />
        ))}
      </ul>
    </Panel>
  );
}

export default function MenusPage() {
  const { data, error, loading, reload } = useLoader(() => admin.get<ApiMenu[]>('/admin/menus'), []);
  return (
    <>
      <AdminPageHeader title="Navigation menus" crumbs={[{ label: 'Navigation menus' }]} description="Main menu, footer link columns and the top utility bar. Menus can be up to three levels deep; changes appear on the website after saving." />
      {error && <ErrorNotice error={error} onRetry={reload} />}
      {loading && !data && <Spinner />}
      <div className="space-y-6">{/* Keyed on content so a reload after saving re-initialises the editor. */}
        {data?.map((m) => <MenuEditor key={`${m.key}:${JSON.stringify(m.items)}`} menu={m} onSaved={reload} />)}</div>
    </>
  );
}
