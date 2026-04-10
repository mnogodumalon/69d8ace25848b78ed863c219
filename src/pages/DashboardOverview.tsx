import { useDashboardData } from '@/hooks/useDashboardData';
import { enrichKontakte } from '@/lib/enrich';
import type { EnrichedKontakte } from '@/types/enriched';
import type { Kategorien } from '@/types/app';
import { APP_IDS } from '@/types/app';
import { LivingAppsService, createRecordUrl } from '@/services/livingAppsService';
import { useState, useMemo } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { KontakteDialog } from '@/components/dialogs/KontakteDialog';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { AI_PHOTO_SCAN } from '@/config/ai-features';
import {
  IconAlertCircle,
  IconTool,
  IconRefresh,
  IconCheck,
  IconPlus,
  IconPencil,
  IconTrash,
  IconSearch,
  IconMail,
  IconPhone,
  IconBuilding,
  IconUsers,
} from '@tabler/icons-react';

const APPGROUP_ID = '69d8ace25848b78ed863c219';
const REPAIR_ENDPOINT = '/claude/build/repair';

const COLOR_MAP: Record<string, string> = {
  rot: 'bg-red-500',
  blau: 'bg-blue-500',
  gruen: 'bg-green-500',
  gelb: 'bg-yellow-400',
  orange: 'bg-orange-500',
  lila: 'bg-purple-500',
  grau: 'bg-gray-400',
  schwarz: 'bg-gray-800',
  weiss: 'bg-gray-100 border border-gray-200',
};

export default function DashboardOverview() {
  const {
    kategorien, kontakte,
    kategorienMap,
    loading, error, fetchAll,
  } = useDashboardData();

  const enrichedKontakte = enrichKontakte(kontakte, { kategorienMap });

  const [search, setSearch] = useState('');
  const [filterKat, setFilterKat] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editRecord, setEditRecord] = useState<EnrichedKontakte | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<EnrichedKontakte | null>(null);

  const filtered = useMemo(() => {
    let list = enrichedKontakte;
    if (filterKat) {
      list = list.filter(k => {
        const url = k.fields.kategorie ?? '';
        return url.includes(filterKat);
      });
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(k =>
        [k.fields.vorname, k.fields.nachname, k.fields.email, k.fields.telefon, k.fields.firma, k.kategorieName]
          .some(v => v?.toLowerCase().includes(q))
      );
    }
    return list;
  }, [enrichedKontakte, filterKat, search]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await LivingAppsService.deleteKontakteEntry(deleteTarget.record_id);
    setDeleteTarget(null);
    fetchAll();
  };

  if (loading) return <DashboardSkeleton />;
  if (error) return <DashboardError error={error} onRetry={fetchAll} />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex-1 relative">
          <IconSearch size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground shrink-0" />
          <Input
            placeholder="Suche nach Name, E-Mail, Firma..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button onClick={() => { setEditRecord(null); setDialogOpen(true); }} className="shrink-0">
          <IconPlus size={16} className="mr-1 shrink-0" />
          Kontakt hinzufügen
        </Button>
      </div>

      {/* Stat-Zeile */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="rounded-2xl border bg-card p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <IconUsers size={18} className="text-primary" />
          </div>
          <div className="min-w-0">
            <p className="text-2xl font-bold truncate">{kontakte.length}</p>
            <p className="text-xs text-muted-foreground">Kontakte gesamt</p>
          </div>
        </div>
        <div className="rounded-2xl border bg-card p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <IconBuilding size={18} className="text-primary" />
          </div>
          <div className="min-w-0">
            <p className="text-2xl font-bold truncate">
              {new Set(kontakte.map(k => k.fields.firma).filter(Boolean)).size}
            </p>
            <p className="text-xs text-muted-foreground">Firmen</p>
          </div>
        </div>
        <div className="rounded-2xl border bg-card p-4 flex items-center gap-3 col-span-2 sm:col-span-1">
          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <IconMail size={18} className="text-primary" />
          </div>
          <div className="min-w-0">
            <p className="text-2xl font-bold truncate">
              {kontakte.filter(k => k.fields.email).length}
            </p>
            <p className="text-xs text-muted-foreground">Mit E-Mail</p>
          </div>
        </div>
      </div>

      {/* Kategorie-Filter */}
      {kategorien.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilterKat(null)}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
              filterKat === null
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground'
            }`}
          >
            Alle
          </button>
          {kategorien.map(kat => (
            <button
              key={kat.record_id}
              onClick={() => setFilterKat(filterKat === kat.record_id ? null : kat.record_id)}
              className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1.5 transition-colors ${
                filterKat === kat.record_id
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              }`}
            >
              {kat.fields.farbe?.key && (
                <span className={`w-2 h-2 rounded-full shrink-0 ${COLOR_MAP[kat.fields.farbe.key] ?? 'bg-gray-400'}`} />
              )}
              {kat.fields.name}
            </button>
          ))}
        </div>
      )}

      {/* Kontakt-Karten */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
          <IconUsers size={48} className="text-muted-foreground" stroke={1.5} />
          <p className="text-muted-foreground text-sm">
            {search || filterKat ? 'Keine Kontakte gefunden.' : 'Noch keine Kontakte vorhanden.'}
          </p>
          {!search && !filterKat && (
            <Button variant="outline" size="sm" onClick={() => { setEditRecord(null); setDialogOpen(true); }}>
              <IconPlus size={14} className="mr-1" />
              Ersten Kontakt anlegen
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map(k => (
            <KontaktKarte
              key={k.record_id}
              kontakt={k}
              kategorien={kategorien}
              colorMap={COLOR_MAP}
              onEdit={() => { setEditRecord(k); setDialogOpen(true); }}
              onDelete={() => setDeleteTarget(k)}
            />
          ))}
        </div>
      )}

      {/* Dialoge */}
      <KontakteDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSubmit={async (fields) => {
          if (editRecord) {
            await LivingAppsService.updateKontakteEntry(editRecord.record_id, fields);
          } else {
            await LivingAppsService.createKontakteEntry(fields);
          }
          fetchAll();
        }}
        defaultValues={editRecord
          ? {
              ...editRecord.fields,
              kategorie: editRecord.fields.kategorie
                ? editRecord.fields.kategorie
                : undefined,
            }
          : undefined
        }
        kategorienList={kategorien}
        enablePhotoScan={AI_PHOTO_SCAN['Kontakte']}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        title="Kontakt löschen"
        description={`Soll "${deleteTarget?.fields.vorname ?? ''} ${deleteTarget?.fields.nachname ?? ''}".trimEnd() wirklich gelöscht werden?`}
        onConfirm={handleDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
}

function KontaktKarte({
  kontakt,
  kategorien,
  colorMap,
  onEdit,
  onDelete,
}: {
  kontakt: EnrichedKontakte;
  kategorien: Kategorien[];
  colorMap: Record<string, string>;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const f = kontakt.fields;
  const initials = [f.vorname, f.nachname].filter(Boolean).map(n => n![0].toUpperCase()).join('') || '?';

  // Finde Kategorie für Farbe
  const kat = kontakt.fields.kategorie
    ? kategorien.find(k => kontakt.fields.kategorie?.includes(k.record_id))
    : null;
  const katColor = kat?.fields.farbe?.key ? colorMap[kat.fields.farbe.key] ?? 'bg-primary' : 'bg-primary';

  return (
    <div className="rounded-2xl border bg-card p-4 flex flex-col gap-3 overflow-hidden hover:shadow-md transition-shadow">
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold text-white shrink-0 ${katColor}`}>
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm truncate">
            {[f.vorname, f.nachname].filter(Boolean).join(' ') || '(Kein Name)'}
          </p>
          {f.firma && <p className="text-xs text-muted-foreground truncate">{f.firma}</p>}
          {kontakt.kategorieName && (
            <span className="inline-flex items-center gap-1 mt-1 text-xs text-muted-foreground">
              {kat?.fields.farbe?.key && (
                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${colorMap[kat.fields.farbe.key] ?? 'bg-gray-400'}`} />
              )}
              {kontakt.kategorieName}
            </span>
          )}
        </div>
        {/* Aktionen */}
        <div className="flex gap-1 shrink-0">
          <button
            onClick={onEdit}
            className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-accent-foreground transition-colors"
            title="Bearbeiten"
          >
            <IconPencil size={14} />
          </button>
          <button
            onClick={onDelete}
            className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
            title="Löschen"
          >
            <IconTrash size={14} />
          </button>
        </div>
      </div>

      {/* Kontaktinfo */}
      <div className="space-y-1.5">
        {f.email && (
          <a
            href={`mailto:${f.email}`}
            className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors min-w-0"
          >
            <IconMail size={13} className="shrink-0" />
            <span className="truncate">{f.email}</span>
          </a>
        )}
        {f.telefon && (
          <a
            href={`tel:${f.telefon}`}
            className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors min-w-0"
          >
            <IconPhone size={13} className="shrink-0" />
            <span className="truncate">{f.telefon}</span>
          </a>
        )}
      </div>

      {f.notiz && (
        <p className="text-xs text-muted-foreground line-clamp-2 border-t pt-2">{f.notiz}</p>
      )}
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <Skeleton className="h-9 flex-1" />
        <Skeleton className="h-9 w-40 shrink-0" />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-20 rounded-2xl" />)}
      </div>
      <div className="flex gap-2">
        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-7 w-20 rounded-full" />)}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-36 rounded-2xl" />)}
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
