import { FormEvent, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { monitoringApi } from '../api/client';
import { CasePriority, CaseStatus } from '../types';
import { formatSafeDate } from '../utils/date';

export const Cases = () => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<CaseStatus | ''>('');
  const [priority, setPriority] = useState<CasePriority | ''>('');
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [createForm, setCreateForm] = useState({
    transactionId: '',
    assignedTo: '',
    status: 'OPEN' as CaseStatus,
    priority: 'MEDIUM' as CasePriority,
    note: ''
  });

  const casesQuery = useQuery({
    queryKey: ['cases', page, status, priority],
    queryFn: () =>
      monitoringApi.getCases({
        page,
        limit: 20,
        status: status || undefined,
        priority: priority || undefined
      }),
    refetchInterval: 7000
  });

  const selected = useMemo(
    () => casesQuery.data?.data.find((item) => item.caseId === selectedCaseId) ?? null,
    [casesQuery.data, selectedCaseId]
  );

  const createCaseMutation = useMutation({
    mutationFn: () =>
      monitoringApi.createCase({
        transactionId: createForm.transactionId,
        assignedTo: createForm.assignedTo || undefined,
        status: createForm.status,
        priority: createForm.priority,
        notes: createForm.note ? [createForm.note] : undefined
      }),
    onSuccess: async () => {
      setCreateForm({
        transactionId: '',
        assignedTo: '',
        status: 'OPEN',
        priority: 'MEDIUM',
        note: ''
      });
      await queryClient.invalidateQueries({ queryKey: ['cases'] });
    }
  });

  const updateCaseMutation = useMutation({
    mutationFn: (payload: { caseId: string; status?: CaseStatus; priority?: CasePriority; note?: string; assignedTo?: string }) =>
      monitoringApi.updateCase(payload.caseId, {
        status: payload.status,
        priority: payload.priority,
        note: payload.note,
        assignedTo: payload.assignedTo
      }),
    onSuccess: async () => {
      setNote('');
      await queryClient.invalidateQueries({ queryKey: ['cases'] });
    }
  });

  const onCreate = (event: FormEvent) => {
    event.preventDefault();
    if (!createForm.transactionId.trim()) return;
    createCaseMutation.mutate();
  };

  return (
    <div className="space-y-6">
      <motion.section className="panel" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <h2 className="section-title">Case Management</h2>
        <p className="section-subtitle mt-1">Open, triage, assign, and resolve fraud investigation cases.</p>
      </motion.section>

      <motion.section className="panel" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.03 }}>
        <h3 className="panel-title">Create Case</h3>
        <form className="grid gap-3 md:grid-cols-2 xl:grid-cols-5" onSubmit={onCreate}>
          <input
            className="input"
            placeholder="Transaction ID"
            value={createForm.transactionId}
            onChange={(event) => setCreateForm((prev) => ({ ...prev, transactionId: event.target.value }))}
            required
          />
          <input
            className="input"
            placeholder="Assign analyst email"
            value={createForm.assignedTo}
            onChange={(event) => setCreateForm((prev) => ({ ...prev, assignedTo: event.target.value }))}
          />
          <select
            className="input"
            value={createForm.status}
            onChange={(event) => setCreateForm((prev) => ({ ...prev, status: event.target.value as CaseStatus }))}
          >
            <option value="OPEN">OPEN</option>
            <option value="INVESTIGATING">INVESTIGATING</option>
            <option value="RESOLVED">RESOLVED</option>
            <option value="FALSE_POSITIVE">FALSE_POSITIVE</option>
          </select>
          <select
            className="input"
            value={createForm.priority}
            onChange={(event) => setCreateForm((prev) => ({ ...prev, priority: event.target.value as CasePriority }))}
          >
            <option value="LOW">LOW</option>
            <option value="MEDIUM">MEDIUM</option>
            <option value="HIGH">HIGH</option>
            <option value="CRITICAL">CRITICAL</option>
          </select>
          <button className="glass-btn justify-center" type="submit" disabled={createCaseMutation.isPending}>
            {createCaseMutation.isPending ? 'Creating...' : 'Create Case'}
          </button>
          <textarea
            className="input md:col-span-2 xl:col-span-5"
            placeholder="Initial case note"
            value={createForm.note}
            onChange={(event) => setCreateForm((prev) => ({ ...prev, note: event.target.value }))}
          />
        </form>
      </motion.section>

      <div className="grid gap-6 xl:grid-cols-[1.25fr_1fr]">
        <motion.section className="panel" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06 }}>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h3 className="panel-title mb-0">Case Queue</h3>
            <div className="flex gap-2">
              <select
                className="input w-40"
                value={status}
                onChange={(event) => {
                  setPage(1);
                  setStatus(event.target.value as CaseStatus | '');
                }}
              >
                <option value="">All Status</option>
                <option value="OPEN">OPEN</option>
                <option value="INVESTIGATING">INVESTIGATING</option>
                <option value="RESOLVED">RESOLVED</option>
                <option value="FALSE_POSITIVE">FALSE_POSITIVE</option>
              </select>
              <select
                className="input w-40"
                value={priority}
                onChange={(event) => {
                  setPage(1);
                  setPriority(event.target.value as CasePriority | '');
                }}
              >
                <option value="">All Priority</option>
                <option value="LOW">LOW</option>
                <option value="MEDIUM">MEDIUM</option>
                <option value="HIGH">HIGH</option>
                <option value="CRITICAL">CRITICAL</option>
              </select>
            </div>
          </div>

          <div className="table-shell">
            <table className="min-w-full text-sm">
              <thead className="sticky top-0 z-10 bg-slate-100/95 text-left text-xs uppercase tracking-[0.16em] text-slate-500 backdrop-blur dark:bg-slate-900/95 dark:text-slate-400">
                <tr>
                  <th className="px-3 py-3">Case ID</th>
                  <th className="px-3 py-3">Transaction</th>
                  <th className="px-3 py-3">Status</th>
                  <th className="px-3 py-3">Priority</th>
                  <th className="px-3 py-3">Assigned To</th>
                  <th className="px-3 py-3">Updated</th>
                </tr>
              </thead>
              <tbody>
                {casesQuery.isLoading
                  ? Array.from({ length: 7 }).map((_, i) => (
                      <tr key={i}>
                        <td className="px-3 py-2" colSpan={6}>
                          <div className="skeleton h-10" />
                        </td>
                      </tr>
                    ))
                  : casesQuery.data?.data.map((item) => (
                      <tr
                        key={item.caseId}
                        className={[
                          'cursor-pointer table-row',
                          selectedCaseId === item.caseId ? 'ring-1 ring-blue-400/50' : ''
                        ].join(' ')}
                        onClick={() => setSelectedCaseId(item.caseId)}
                      >
                        <td className="px-3 py-3 font-semibold text-blue-700 dark:text-blue-200">{item.caseId}</td>
                        <td className="px-3 py-3 text-slate-700 dark:text-slate-300">{item.transactionId}</td>
                        <td className="px-3 py-3 text-slate-700 dark:text-slate-300">{item.status}</td>
                        <td className="px-3 py-3 text-slate-700 dark:text-slate-300">{item.priority}</td>
                        <td className="px-3 py-3 text-slate-700 dark:text-slate-300">{item.assignedTo || 'Unassigned'}</td>
                        <td className="px-3 py-3 text-slate-500 dark:text-slate-400">{formatSafeDate(item.updatedAt)}</td>
                      </tr>
                    ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex items-center justify-between text-sm text-slate-600 dark:text-slate-300">
            <p>
              Page {casesQuery.data?.page ?? page} of {casesQuery.data?.pages ?? 1}
            </p>
            <div className="flex gap-2">
              <button className="glass-btn" disabled={page <= 1} onClick={() => setPage((prev) => Math.max(1, prev - 1))}>
                Previous
              </button>
              <button
                className="glass-btn"
                disabled={page >= (casesQuery.data?.pages ?? 1)}
                onClick={() => setPage((prev) => prev + 1)}
              >
                Next
              </button>
            </div>
          </div>
        </motion.section>

        <motion.section className="panel" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.09 }}>
          <h3 className="panel-title">Case Workflow</h3>
          {!selected ? (
            <div className="app-empty">
              <p className="text-sm text-slate-500 dark:text-slate-400">Select a case to update status, priority, assignee, and notes.</p>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-slate-700 dark:text-slate-200">
                <span className="font-semibold">Case:</span> {selected.caseId}
              </p>
              <p className="text-sm text-slate-700 dark:text-slate-200">
                <span className="font-semibold">Transaction:</span> {selected.transactionId}
              </p>

              <div className="grid gap-2 sm:grid-cols-2">
                <button
                  className="glass-btn justify-center"
                  onClick={() => updateCaseMutation.mutate({ caseId: selected.caseId, status: 'INVESTIGATING' })}
                >
                  Set Investigating
                </button>
                <button
                  className="glass-btn justify-center"
                  onClick={() => updateCaseMutation.mutate({ caseId: selected.caseId, status: 'RESOLVED' })}
                >
                  Set Resolved
                </button>
                <button
                  className="glass-btn justify-center"
                  onClick={() => updateCaseMutation.mutate({ caseId: selected.caseId, status: 'FALSE_POSITIVE' })}
                >
                  Mark False Positive
                </button>
                <button
                  className="glass-btn justify-center"
                  onClick={() => updateCaseMutation.mutate({ caseId: selected.caseId, priority: 'CRITICAL' })}
                >
                  Escalate Critical
                </button>
              </div>

              <input
                className="input"
                placeholder="Assign analyst email"
                defaultValue={selected.assignedTo || ''}
                onBlur={(event) => {
                  const value = event.target.value.trim();
                  if (value && value !== selected.assignedTo) {
                    updateCaseMutation.mutate({ caseId: selected.caseId, assignedTo: value });
                  }
                }}
              />

              <textarea
                className="input h-24"
                placeholder="Add investigation note..."
                value={note}
                onChange={(event) => setNote(event.target.value)}
              />
              <button
                className="glass-btn"
                disabled={!note.trim() || updateCaseMutation.isPending}
                onClick={() =>
                  updateCaseMutation.mutate({
                    caseId: selected.caseId,
                    note: note.trim()
                  })
                }
              >
                Append Note
              </button>

              <div className="space-y-2 rounded-xl border border-slate-200 p-3 dark:border-slate-700">
                <p className="text-xs uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">Timeline</p>
                {selected.timeline.map((item) => (
                  <p key={`${item.at}-${item.action}`} className="text-sm text-slate-700 dark:text-slate-200">
                    {formatSafeDate(item.at)} - {item.actor} - {item.action} {item.note ? `(${item.note})` : ''}
                  </p>
                ))}
              </div>
            </div>
          )}
        </motion.section>
      </div>
    </div>
  );
};
