import { useDashboardData } from '@/hooks/useDashboardData';
import { enrichKontakte } from '@/lib/enrich';
import type { EnrichedKontakte } from '@/types/enriched';
import type { Kontakte } from '@/types/app';
import { LivingAppsService } from '@/services/livingAppsService';
import { AI_PHOTO_SCAN } from '@/config/ai-features';
import { useState, useMemo } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { KontakteDialog } from '@/components/dialogs/KontakteDialog';
import { KategorienDialog } from '@/components/dialogs/KategorienDialog';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { StatCard } from '@/components/StatCard';
import {
  IconAlertCircle, IconTool, IconRefresh, IconCheck,
  IconPlus, IconPencil, IconTrash, IconSearch, IconUsers,
  IconMail, IconPhone, IconBuilding, IconNotes, IconTag,
  IconLayoutGrid, IconList, IconX,
} from '@tabler/icons-react';

const APPGROUP_ID = '69d8ace25848b78ed863c219';
const REPAIR_ENDPOINT = '/claude/build/repair';

const COLOR_MAP: Record<string, { bg: string; text: string; border: string; dot: string }> = {
  rot:     { bg: 'bg-red-50',    text: 'text-red-700',    border: 'border-red-200',    dot: 'bg-red-500' },
  blau:    { bg: 'bg-blue-50',   text: 'text-blue-700',   border: 'border-blue-200',   dot: 'bg-blue-500' },
  gruen:   { bg: 'bg-green-50',  text: 'text-green-700',  border: 'border-green-200',  dot: 'bg-green-500' },
  gelb:    { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200', dot: 'bg-yellow-500' },
  orange:  { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200', dot: 'bg-orange-500' },
  lila:    { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200', dot: 'bg-purple-500' },
  grau:    { bg: 'bg-gray-50',   text: 'text-gray-700',   border: 'border-gray-200',   dot: 'bg-gray-400' },
  schwarz: { bg: 'bg-zinc-100',  text: 'text-zinc-800',   border: 'border-zinc-300',   dot: 'bg-zinc-800' },
  weiss:   { bg: 'bg-slate-50',  text: 'text-slate-600',  border: 'border-slate-300',  dot: 'bg-slate-300' },
};

function getColorStyle(colorKey?: string) {
  return COLOR_MAP[colorKey ?? ''] ?? { bg: 'bg-primary/10', text: 'text-primary', border: 'border-primary/20', dot: 'bg-primary' };
}

export default function DashboardOverview() {
  const {
    kategorien, kontakte,
    kategorienMap,
    loading, error, fetchAll,
  } = useDashboardData();

  const enrichedKontakte = enrichKontakte(kontakte, { kategorienMap });

  const [search, setSearch] = useState('');
  const [activeKategorie, setActiveKategorie] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const [kontakteDialogOpen, setKontakteDialogOpen] = useState(false);
  const [editKontakt, setEditKontakt] = useState<EnrichedKontakte | null>(null);
  const [deleteKontakt, setDeleteKontakt] = useState<EnrichedKontakte | null>(null);

  const [kategorienDialogOpen, setKategorienDialogOpen] = useState(false);

  const filtered = useMemo(() => {
    let result = enrichedKontakte;
    if (activeKategorie) {
      result = result.filter(k => {
        const kat = kategorienMap.get(activeKategorie);
        return k.kategorieName === (kat?.fields.name ?? '');
      });
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(k =>
        [k.fields.vorname, k.fields.nachname, k.fields.email, k.fields.telefon, k.fields.firma, k.fields.notiz]
          .some(v => v?.toLowerCase().includes(q))
      );
    }
    return result;
  }, [enrichedKontakte, activeKategorie, kategorienMap, search]);

  const kategorienWithCount = useMemo(() => {
    return kategorien.map(kat => ({
      ...kat,
      count: enrichedKontakte.filter(k => k.kategorieName === kat.fields.name).length,
    }));
  }, [kategorien, enrichedKontakte]);

  const handleDeleteKontakt = async () => {
    if (!deleteKontakt) return;
    await LivingAppsService.deleteKontakteEntry(deleteKontakt.record_id);
    fetchAll();
    setDeleteKontakt(null);
  };

  if (loading) return <DashboardSkeleton />;
  if (error) return <DashboardError error={error} onRetry={fetchAll} />;

  const fullName = (k: EnrichedKontakte) =>
    [k.fields.vorname, k.fields.nachname].filter(Boolean).join(' ') || '(Kein Name)';

  const initials = (k: EnrichedKontakte) => {
    const parts = [k.fields.vorname, k.fields.nachname].filter(Boolean);
    if (parts.length === 0) return '?';
    return parts.map(p => p![0].toUpperCase()).join('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Kontakte</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{kontakte.length} Kontakte gespeichert</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setKategorienDialogOpen(true)}
          >
            <IconTag size={16} className="mr-1.5 shrink-0" />
            Kategorie anlegen
          </Button>
          <Button
            size="sm"
            onClick={() => { setEditKontakt(null); setKontakteDialogOpen(true); }}
          >
            <IconPlus size={16} className="mr-1.5 shrink-0" />
            Kontakt hinzufügen
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          title="Kontakte gesamt"
          value={String(kontakte.length)}
          description="Alle Einträge"
          icon={<IconUsers size={18} className="text-muted-foreground" />}
        />
        <StatCard
          title="Kategorien"
          value={String(kategorien.length)}
          description="Gruppen"
          icon={<IconTag size={18} className="text-muted-foreground" />}
        />
        <StatCard
          title="Mit E-Mail"
          value={String(kontakte.filter(k => k.fields.email).length)}
          description="Erreichbar per Mail"
          icon={<IconMail size={18} className="text-muted-foreground" />}
        />
        <StatCard
          title="Mit Telefon"
          value={String(kontakte.filter(k => k.fields.telefon).length)}
          description="Erreichbar per Telefon"
          icon={<IconPhone size={18} className="text-muted-foreground" />}
        />
      </div>

      {/* Category filter bar */}
      <div className="flex flex-wrap gap-2 items-center">
        <button
          onClick={() => setActiveKategorie(null)}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
            activeKategorie === null
              ? 'bg-primary text-primary-foreground border-primary'
              : 'bg-background text-muted-foreground border-border hover:border-primary/40 hover:text-foreground'
          }`}
        >
          Alle
          <span className="text-xs opacity-70">({kontakte.length})</span>
        </button>
        {kategorienWithCount.map(kat => {
          const colorKey = kat.fields.farbe?.key;
          const cs = getColorStyle(colorKey);
          const isActive = activeKategorie === kat.record_id;
          return (
            <button
              key={kat.record_id}
              onClick={() => setActiveKategorie(isActive ? null : kat.record_id)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
                isActive
                  ? `${cs.bg} ${cs.text} ${cs.border} ring-2 ring-offset-1 ring-current`
                  : `bg-background text-muted-foreground border-border hover:${cs.bg} hover:${cs.text} hover:${cs.border}`
              }`}
            >
              <span className={`w-2 h-2 rounded-full shrink-0 ${cs.dot}`} />
              {kat.fields.name ?? '—'}
              <span className="text-xs opacity-70">({kat.count})</span>
            </button>
          );
        })}
      </div>

      {/* Search + view toggle */}
      <div className="flex gap-2 items-center flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <IconSearch size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground shrink-0" />
          <Input
            placeholder="Suchen nach Name, E-Mail, Firma..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 pr-9"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <IconX size={14} />
            </button>
          )}
        </div>
        <div className="flex border border-border rounded-lg overflow-hidden">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 transition-colors ${viewMode === 'grid' ? 'bg-primary text-primary-foreground' : 'bg-background text-muted-foreground hover:bg-accent'}`}
          >
            <IconLayoutGrid size={16} />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 transition-colors ${viewMode === 'list' ? 'bg-primary text-primary-foreground' : 'bg-background text-muted-foreground hover:bg-accent'}`}
          >
            <IconList size={16} />
          </button>
        </div>
      </div>

      {/* Contacts */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <IconUsers size={48} className="text-muted-foreground" stroke={1.5} />
          <div className="text-center">
            <p className="font-medium text-foreground">Keine Kontakte gefunden</p>
            <p className="text-sm text-muted-foreground mt-1">
              {search || activeKategorie ? 'Passe die Filter an oder' : 'Lege deinen ersten Kontakt an.'}
            </p>
          </div>
          {!search && !activeKategorie && (
            <Button size="sm" onClick={() => { setEditKontakt(null); setKontakteDialogOpen(true); }}>
              <IconPlus size={16} className="mr-1.5" />
              Kontakt anlegen
            </Button>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map(k => (
            <ContactCard
              key={k.record_id}
              kontakt={k}
              initials={initials(k)}
              fullName={fullName(k)}
              kategorienMap={kategorienMap}
              onEdit={() => { setEditKontakt(k); setKontakteDialogOpen(true); }}
              onDelete={() => setDeleteKontakt(k)}
            />
          ))}
        </div>
      ) : (
        <div className="border border-border rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/40 border-b border-border">
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Name</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden sm:table-cell">E-Mail</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Telefon</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">Firma</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Kategorie</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {filtered.map(k => {
                  const kat = k.kategorieName ? kategorien.find(x => x.fields.name === k.kategorieName) : null;
                  const cs = kat ? getColorStyle(kat.fields.farbe?.key) : null;
                  return (
                    <tr key={k.record_id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${cs ? `${cs.bg} ${cs.text}` : 'bg-primary/10 text-primary'}`}>
                            {initials(k)}
                          </div>
                          <span className="font-medium truncate">{fullName(k)}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        {k.fields.email ? (
                          <a href={`mailto:${k.fields.email}`} className="text-primary hover:underline truncate block max-w-[180px]">{k.fields.email}</a>
                        ) : <span className="text-muted-foreground">—</span>}
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        {k.fields.telefon ? (
                          <a href={`tel:${k.fields.telefon}`} className="hover:text-primary truncate block">{k.fields.telefon}</a>
                        ) : <span className="text-muted-foreground">—</span>}
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <span className="truncate block max-w-[150px]">{k.fields.firma ?? <span className="text-muted-foreground">—</span>}</span>
                      </td>
                      <td className="px-4 py-3">
                        {k.kategorieName && cs ? (
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${cs.bg} ${cs.text} ${cs.border} border`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${cs.dot}`} />
                            {k.kategorieName}
                          </span>
                        ) : <span className="text-muted-foreground text-xs">—</span>}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 justify-end">
                          <button
                            onClick={() => { setEditKontakt(k); setKontakteDialogOpen(true); }}
                            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                            title="Bearbeiten"
                          >
                            <IconPencil size={14} className="shrink-0" />
                          </button>
                          <button
                            onClick={() => setDeleteKontakt(k)}
                            className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                            title="Löschen"
                          >
                            <IconTrash size={14} className="shrink-0" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Dialogs */}
      <KontakteDialog
        open={kontakteDialogOpen}
        onClose={() => { setKontakteDialogOpen(false); setEditKontakt(null); }}
        onSubmit={async (fields: Kontakte['fields']) => {
          if (editKontakt) {
            await LivingAppsService.updateKontakteEntry(editKontakt.record_id, fields);
          } else {
            await LivingAppsService.createKontakteEntry(fields);
          }
          fetchAll();
        }}
        defaultValues={editKontakt ? editKontakt.fields : undefined}
        kategorienList={kategorien}
        enablePhotoScan={AI_PHOTO_SCAN['Kontakte']}
      />

      <KategorienDialog
        open={kategorienDialogOpen}
        onClose={() => setKategorienDialogOpen(false)}
        onSubmit={async (fields) => {
          await LivingAppsService.createKategorienEntry(fields);
          fetchAll();
        }}
        defaultValues={undefined}
        enablePhotoScan={AI_PHOTO_SCAN['Kategorien']}
      />

      <ConfirmDialog
        open={!!deleteKontakt}
        title="Kontakt löschen"
        description={`Soll "${deleteKontakt ? fullName(deleteKontakt) : ''}" wirklich gelöscht werden?`}
        onConfirm={handleDeleteKontakt}
        onClose={() => setDeleteKontakt(null)}
      />
    </div>
  );
}

interface ContactCardProps {
  kontakt: EnrichedKontakte;
  initials: string;
  fullName: string;
  kategorienMap: Map<string, import('@/types/app').Kategorien>;
  onEdit: () => void;
  onDelete: () => void;
}

function ContactCard({ kontakt: k, initials, fullName, kategorienMap, onEdit, onDelete }: ContactCardProps) {
  const kat = k.kategorieName
    ? Array.from(kategorienMap.values()).find(x => x.fields.name === k.kategorieName)
    : null;
  const cs = getColorStyle(kat?.fields.farbe?.key);

  return (
    <div className="bg-card border border-border rounded-2xl p-4 flex flex-col gap-3 hover:shadow-md transition-shadow overflow-hidden">
      {/* Avatar + Actions */}
      <div className="flex items-start justify-between gap-2">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-base font-bold shrink-0 ${cs.bg} ${cs.text}`}>
          {initials}
        </div>
        <div className="flex gap-1">
          <button
            onClick={onEdit}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            title="Bearbeiten"
          >
            <IconPencil size={14} className="shrink-0" />
          </button>
          <button
            onClick={onDelete}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
            title="Löschen"
          >
            <IconTrash size={14} className="shrink-0" />
          </button>
        </div>
      </div>

      {/* Name + Category */}
      <div className="min-w-0">
        <p className="font-semibold text-foreground truncate">{fullName}</p>
        {k.kategorieName && (
          <span className={`inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full text-xs font-medium border ${cs.bg} ${cs.text} ${cs.border}`}>
            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${cs.dot}`} />
            {k.kategorieName}
          </span>
        )}
      </div>

      {/* Contact details */}
      <div className="space-y-1.5 min-w-0">
        {k.fields.firma && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground min-w-0">
            <IconBuilding size={13} className="shrink-0" />
            <span className="truncate">{k.fields.firma}</span>
          </div>
        )}
        {k.fields.email && (
          <div className="flex items-center gap-2 text-sm min-w-0">
            <IconMail size={13} className="shrink-0 text-muted-foreground" />
            <a href={`mailto:${k.fields.email}`} className="text-primary hover:underline truncate">{k.fields.email}</a>
          </div>
        )}
        {k.fields.telefon && (
          <div className="flex items-center gap-2 text-sm min-w-0">
            <IconPhone size={13} className="shrink-0 text-muted-foreground" />
            <a href={`tel:${k.fields.telefon}`} className="hover:text-primary truncate">{k.fields.telefon}</a>
          </div>
        )}
        {k.fields.notiz && (
          <div className="flex items-start gap-2 text-sm text-muted-foreground min-w-0">
            <IconNotes size={13} className="shrink-0 mt-0.5" />
            <span className="line-clamp-2">{k.fields.notiz}</span>
          </div>
        )}
      </div>

      {/* Quick actions */}
      {(k.fields.email || k.fields.telefon) && (
        <div className="flex gap-2 pt-1 border-t border-border flex-wrap">
          {k.fields.email && (
            <a
              href={`mailto:${k.fields.email}`}
              className="flex-1 min-w-0 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/5 hover:bg-primary/10 text-primary text-xs font-medium transition-colors"
            >
              <IconMail size={13} className="shrink-0" />
              <span className="truncate">E-Mail</span>
            </a>
          )}
          {k.fields.telefon && (
            <a
              href={`tel:${k.fields.telefon}`}
              className="flex-1 min-w-0 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-50 hover:bg-green-100 text-green-700 text-xs font-medium transition-colors"
            >
              <IconPhone size={13} className="shrink-0" />
              <span className="truncate">Anrufen</span>
            </a>
          )}
        </div>
      )}
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-9 w-36" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}
      </div>
      <div className="flex gap-2">
        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-8 w-24 rounded-full" />)}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-52 rounded-2xl" />)}
      </div>
    </div>
  );
}

function DashboardError({ error, onRetry }: { error: Error; onRetry: () => void }) {
  const [repairing, setRepairing] = useState(false);
  const [repairStatus, setRepairStatus] = useState('');
  const [repairDone, setRepairDone] = useState(false);
  const [repairFailed, setRepairFailed] = useState(false);

  const handleRepair = async () => {
    setRepairing(true);
    setRepairStatus('Reparatur wird gestartet...');
    setRepairFailed(false);

    const errorContext = JSON.stringify({
      type: 'data_loading',
      message: error.message,
      stack: (error.stack ?? '').split('\n').slice(0, 10).join('\n'),
      url: window.location.href,
    });

    try {
      const resp = await fetch(REPAIR_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ appgroup_id: APPGROUP_ID, error_context: errorContext }),
      });

      if (!resp.ok || !resp.body) {
        setRepairing(false);
        setRepairFailed(true);
        return;
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        for (const raw of lines) {
          const line = raw.trim();
          if (!line.startsWith('data: ')) continue;
          const content = line.slice(6);
          if (content.startsWith('[STATUS]')) {
            setRepairStatus(content.replace(/^\[STATUS]\s*/, ''));
          }
          if (content.startsWith('[DONE]')) {
            setRepairDone(true);
            setRepairing(false);
          }
          if (content.startsWith('[ERROR]') && !content.includes('Dashboard-Links')) {
            setRepairFailed(true);
          }
        }
      }
    } catch {
      setRepairing(false);
      setRepairFailed(true);
    }
  };

  if (repairDone) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <div className="w-12 h-12 rounded-2xl bg-green-500/10 flex items-center justify-center">
          <IconCheck size={22} className="text-green-500" />
        </div>
        <div className="text-center">
          <h3 className="font-semibold text-foreground mb-1">Dashboard repariert</h3>
          <p className="text-sm text-muted-foreground max-w-xs">Das Problem wurde behoben. Bitte laden Sie die Seite neu.</p>
        </div>
        <Button size="sm" onClick={() => window.location.reload()}>
          <IconRefresh size={14} className="mr-1" />Neu laden
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-24 gap-4">
      <div className="w-12 h-12 rounded-2xl bg-destructive/10 flex items-center justify-center">
        <IconAlertCircle size={22} className="text-destructive" />
      </div>
      <div className="text-center">
        <h3 className="font-semibold text-foreground mb-1">Fehler beim Laden</h3>
        <p className="text-sm text-muted-foreground max-w-xs">
          {repairing ? repairStatus : error.message}
        </p>
      </div>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={onRetry} disabled={repairing}>Erneut versuchen</Button>
        <Button size="sm" onClick={handleRepair} disabled={repairing}>
          {repairing
            ? <span className="inline-block w-3.5 h-3.5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin mr-1" />
            : <IconTool size={14} className="mr-1" />}
          {repairing ? 'Reparatur läuft...' : 'Dashboard reparieren'}
        </Button>
      </div>
      {repairFailed && <p className="text-sm text-destructive">Automatische Reparatur fehlgeschlagen. Bitte kontaktieren Sie den Support.</p>}
    </div>
  );
}

