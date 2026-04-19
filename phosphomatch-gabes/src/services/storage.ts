import type { Batch, BatchStatus, Match, SavedBatch } from '../types';

const SAVED_BATCHES_KEY = 'saved_batches';

function createId(): string {
  return crypto.randomUUID();
}

function readBatches(): SavedBatch[] {
  const raw = localStorage.getItem(SAVED_BATCHES_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as SavedBatch[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeBatches(batches: SavedBatch[]): void {
  localStorage.setItem(SAVED_BATCHES_KEY, JSON.stringify(batches));
}

export function saveBatch(sellerId: string, batch: Batch, matches: Match[]): SavedBatch {
  const saved: SavedBatch = {
    id: createId(),
    seller_id: sellerId,
    batch,
    matches,
    created_at: new Date().toISOString(),
    status: 'pending',
  };
  writeBatches([saved, ...readBatches()]);
  return saved;
}

export function getBatchesBySeller(sellerId: string): SavedBatch[] {
  return readBatches()
    .filter((batch) => batch.seller_id === sellerId)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

export function getBatchById(id: string): SavedBatch | null {
  return readBatches().find((batch) => batch.id === id) ?? null;
}

export function updateBatchStatus(id: string, status: BatchStatus): SavedBatch {
  const batches = readBatches();
  const existing = batches.find((batch) => batch.id === id);
  if (!existing) throw new Error('Lot introuvable.');

  const updated = { ...existing, status };
  writeBatches(batches.map((batch) => (batch.id === id ? updated : batch)));
  return updated;
}

export function updateBatchNotes(id: string, notes: string): SavedBatch {
  const batches = readBatches();
  const existing = batches.find((batch) => batch.id === id);
  if (!existing) throw new Error('Lot introuvable.');

  const updated = { ...existing, notes };
  writeBatches(batches.map((batch) => (batch.id === id ? updated : batch)));
  return updated;
}

export function deleteBatch(id: string): void {
  writeBatches(readBatches().filter((batch) => batch.id !== id));
}

export function deleteBatchesBySeller(sellerId: string): void {
  writeBatches(readBatches().filter((batch) => batch.seller_id !== sellerId));
}
