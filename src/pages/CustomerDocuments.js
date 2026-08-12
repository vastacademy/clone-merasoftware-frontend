import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { ArrowLeft, FileText, Download } from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';
import SummaryApi from '../common';
import backgroundImage from '../assets/BG.png';

const formatFileSize = (bytes) => {
  const n = Number(bytes) || 0;
  if (n <= 0) return '';
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
};

const formatDateTime = (value) => {
  if (!value) return '';
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? '' : parsed.toLocaleString('en-IN');
};

// Presentation for each document row. Only two kinds ever appear here — both are
// admin-sent: an agreement/document (client stage) or a proposal (lead stage).
const getDocMeta = (doc) => {
  if (doc?.kind === 'proposal') {
    return {
      label: `Proposal v${doc.version}`,
      badge: 'border-amber-300/40 bg-amber-400/15 text-amber-200',
    };
  }
  if (doc?.source === 'agreement') {
    return {
      label: 'Agreement',
      badge: 'border-emerald-300/40 bg-emerald-400/15 text-emerald-200',
    };
  }
  return {
    label: 'Document',
    badge: 'border-white/25 bg-white/10 text-slate-200',
  };
};

const CustomerDocuments = () => {
  const navigate = useNavigate();
  const user = useSelector((state) => state?.user?.user);

  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        setLoading(true);
        setError('');
        const response = await fetch(SummaryApi.myDocuments.url, {
          method: SummaryApi.myDocuments.method,
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
        });
        const result = await response.json();
        if (!result.success) throw new Error(result.message || 'Failed to load documents');
        if (!cancelled) setDocuments(result.data?.documents || []);
      } catch (err) {
        if (!cancelled) setError(err.message || 'Failed to load documents');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleBack = () => navigate('/dashboard');

  return (
    <DashboardLayout user={user}>
      <div
        className="relative min-h-[calc(100vh-4rem)] overflow-hidden bg-slate-950 bg-cover bg-center px-4 py-10 sm:px-6 lg:px-8 lg:py-14"
        style={{ backgroundImage: `url(${backgroundImage})` }}
      >
        <div className="pointer-events-none absolute inset-0 bg-slate-950/40" />

        <div className="relative mx-auto flex w-full max-w-4xl flex-col gap-6">
          {/* Header */}
          <div className="relative flex items-center justify-center">
            <button
              type="button"
              onClick={handleBack}
              className="absolute left-0 inline-flex w-fit shrink-0 items-center gap-2 rounded-2xl border border-white/15 bg-white/10 px-5 py-3 text-lg font-semibold text-white backdrop-blur-md transition hover:bg-white/15"
            >
              <ArrowLeft className="h-5 w-5" />
              Back
            </button>

            <div className="text-center">
              <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl lg:text-4xl">
                Documents
              </h1>
              <p className="mt-1 text-base text-slate-300 sm:text-lg">
                Proposals and agreements shared with you
              </p>
            </div>
          </div>

          {/* Timeline card */}
          <div className="relative overflow-hidden rounded-[1.75rem] border border-white/20 bg-white/10 p-5 shadow-[0_8px_32px_rgba(0,0,0,0.25)] backdrop-blur-2xl backdrop-saturate-150 sm:p-6">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/[0.12] to-transparent" />

            <div className="relative">
              <div className="flex items-center gap-2 text-white">
                <FileText className="h-5 w-5" />
                <h2 className="text-lg font-bold">Your Documents</h2>
              </div>

              {loading ? (
                <p className="mt-6 text-sm text-slate-300">Loading documents…</p>
              ) : error ? (
                <p className="mt-6 text-sm text-rose-300">{error}</p>
              ) : documents.length === 0 ? (
                <p className="mt-6 text-sm text-slate-300">
                  No documents yet. Any proposal or agreement shared with you will appear here.
                </p>
              ) : (
                <ul className="mt-6 space-y-3">
                  {documents.map((doc) => {
                    const meta = getDocMeta(doc);
                    const sizeLabel = formatFileSize(doc.size);
                    return (
                      <li
                        key={doc.id}
                        className="flex items-start justify-between gap-4 rounded-2xl border border-white/15 bg-white/[0.06] px-4 py-3.5"
                      >
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${meta.badge}`}>
                              {meta.label}
                            </span>
                            <span className="truncate text-sm font-semibold text-white">
                              {doc.name || 'Document'}
                            </span>
                          </div>
                          <p className="mt-1 text-xs text-slate-300">
                            {formatDateTime(doc.date)}
                            {sizeLabel ? ` · ${sizeLabel}` : ''}
                          </p>
                        </div>
                        {doc.downloadLink ? (
                          <a
                            href={doc.downloadLink}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-white/15"
                          >
                            <Download className="h-3.5 w-3.5" />
                            Download
                          </a>
                        ) : null}
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default CustomerDocuments;
