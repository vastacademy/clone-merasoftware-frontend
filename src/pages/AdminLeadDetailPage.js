import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { ArrowLeft, Download, FileText, Mail, MessageSquarePlus, Phone, Upload, UserCheck, UserPlus } from "lucide-react";
import SummaryApi from "../common";
import { logout } from "../store/userSlice";
import CookieManager from "../utils/cookieManager";
import StorageService from "../utils/storageService";
import { useOnlineStatus } from "../App";
import AdminLayout from "../components/AdminLayout";
import AdminWorkspaceShell, { AdminWorkspaceHeader } from "../components/admin/AdminWorkspaceShell";
import AdminInfoPill from "../components/admin/AdminInfoPill";

const PIPELINE_STAGES = ["New", "Contacted", "Qualified", "Proposal Sent", "Won", "Lost"];

const STATUS_STYLES = {
  New: "bg-slate-100 text-slate-700 border-slate-200",
  Contacted: "bg-blue-100 text-blue-800 border-blue-200",
  Qualified: "bg-amber-100 text-amber-800 border-amber-200",
  "Proposal Sent": "bg-indigo-100 text-indigo-800 border-indigo-200",
  Won: "bg-emerald-100 text-emerald-800 border-emerald-200",
  Lost: "bg-red-100 text-red-800 border-red-200",
};

const formatDateTime = (value) => {
  if (!value) return "N/A";
  return new Date(value).toLocaleString("en-IN");
};

const AdminLeadDetailPage = () => {
  const user = useSelector((state) => state?.user?.user);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { leadId } = useParams();
  const { isOnline } = useOnlineStatus();

  const [lead, setLead] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statusSaving, setStatusSaving] = useState(false);
  const [followUpNote, setFollowUpNote] = useState("");
  const [followUpSaving, setFollowUpSaving] = useState(false);
  const [converting, setConverting] = useState(false);
  const [proposalFile, setProposalFile] = useState(null);
  const [proposalUploading, setProposalUploading] = useState(false);

  const handleLogout = async () => {
    try {
      if (isOnline) {
        const response = await fetch(SummaryApi.logout_user.url, {
          method: SummaryApi.logout_user.method,
          credentials: "include",
        });
        const data = await response.json();
        if (data.success) {
          toast.success(data.message);
        }
      }
      CookieManager.clearAll();
      StorageService.clearUserData();
      dispatch(logout());
      navigate("/");
    } catch (error) {
      console.error("Error during logout:", error);
      toast.error("Logout failed. Please try again.");
    }
  };

  const fetchLead = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${SummaryApi.leadDetail.url}/${leadId}`, {
        method: SummaryApi.leadDetail.method,
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });
      const result = await response.json();
      if (!result.success) {
        toast.error(result.message || "Failed to load lead");
        return;
      }
      setLead(result.data);
    } catch (error) {
      console.error("Error fetching lead:", error);
      toast.error("Error loading lead");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLead();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leadId]);

  const isConverted = Boolean(lead?.convertedToUserId);

  const handleStatusChange = async (status) => {
    if (!lead || status === lead.status || statusSaving || isConverted) return;
    try {
      setStatusSaving(true);
      const response = await fetch(`${SummaryApi.updateLead.url}/${leadId}`, {
        method: SummaryApi.updateLead.method,
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "status", status }),
      });
      const result = await response.json();
      if (!result.success) {
        toast.error(result.message || "Failed to update status");
        return;
      }
      toast.success("Status updated");
      await fetchLead();
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("Error updating status");
    } finally {
      setStatusSaving(false);
    }
  };

  const handleAddFollowUp = async (event) => {
    event.preventDefault();
    if (!followUpNote.trim()) {
      toast.error("Please write a follow-up note");
      return;
    }
    try {
      setFollowUpSaving(true);
      const response = await fetch(`${SummaryApi.updateLead.url}/${leadId}`, {
        method: SummaryApi.updateLead.method,
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "followUp", note: followUpNote }),
      });
      const result = await response.json();
      if (!result.success) {
        toast.error(result.message || "Failed to add follow-up");
        return;
      }
      toast.success("Follow-up added");
      setFollowUpNote("");
      await fetchLead();
    } catch (error) {
      console.error("Error adding follow-up:", error);
      toast.error("Error adding follow-up");
    } finally {
      setFollowUpSaving(false);
    }
  };

  const handleConvert = async () => {
    if (!lead || converting || isConverted) return;
    if (!lead.phone?.trim()) {
      toast.error("This lead has no phone number. Add a phone before converting.");
      return;
    }
    if (!lead.email?.trim()) {
      toast.error("This lead has no email. An email is required to create a client account.");
      return;
    }
    const ok = window.confirm(
      `Convert "${lead.name}" into a client?\n\nA customer account will be created with the default password 1234. The client can set their own password on first login.`
    );
    if (!ok) return;

    try {
      setConverting(true);
      const response = await fetch(`${SummaryApi.convertLead.url}/${leadId}/convert`, {
        method: SummaryApi.convertLead.method,
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });
      const result = await response.json();
      if (!result.success) {
        toast.error(result.message || "Failed to convert lead");
        return;
      }
      toast.success(`Client created. Login email: ${result.data?.email} · Password: ${result.data?.defaultPassword}`);
      await fetchLead();
    } catch (error) {
      console.error("Error converting lead:", error);
      toast.error("Error converting lead");
    } finally {
      setConverting(false);
    }
  };

  const handleUploadProposal = async (event) => {
    event.preventDefault();
    if (!proposalFile) {
      toast.error("Please choose a proposal file");
      return;
    }
    try {
      setProposalUploading(true);
      const formData = new FormData();
      formData.append("proposal", proposalFile);

      const response = await fetch(`${SummaryApi.uploadProposal.url}/${leadId}/proposal`, {
        method: SummaryApi.uploadProposal.method,
        credentials: "include",
        body: formData,
      });
      const result = await response.json();
      if (!result.success) {
        toast.error(result.message || "Failed to upload proposal");
        return;
      }
      toast.success(`Proposal v${result.data?.version} uploaded`);
      setProposalFile(null);
      await fetchLead();
    } catch (error) {
      console.error("Error uploading proposal:", error);
      toast.error("Error uploading proposal");
    } finally {
      setProposalUploading(false);
    }
  };

  const followUps = useMemo(() => {
    const list = lead?.followUps || [];
    return [...list].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  }, [lead]);

  const proposals = useMemo(() => {
    const list = lead?.proposals || [];
    return [...list].sort((a, b) => (b.version || 0) - (a.version || 0));
  }, [lead]);

  return (
    <AdminLayout user={user} onLogout={handleLogout}>
      <AdminWorkspaceShell>
        <AdminWorkspaceHeader
          icon={UserPlus}
          eyebrow={<>Lead</>}
          title={lead?.name || (loading ? "Loading..." : "Lead")}
          subtitle={lead?.email || lead?.phone || ""}
          leadingAction={
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-white transition hover:bg-white/10"
              aria-label="Go back"
            >
              <ArrowLeft size={18} />
            </button>
          }
          meta={
            <>
              <AdminInfoPill label="Status" value={lead?.status || "New"} variant="dark" />
              <AdminInfoPill label="Source" value={lead?.source || "N/A"} variant="dark" />
              <AdminInfoPill label="Added" value={lead?.createdAt ? new Date(lead.createdAt).toLocaleDateString("en-IN") : "N/A"} variant="dark" />
            </>
          }
          loadingText={loading ? "Loading lead..." : ""}
        />

        <div className="grid grid-cols-1 gap-6 p-5 sm:p-6 lg:grid-cols-3">
          {/* Left: lead info + pipeline */}
          <div className="space-y-6 lg:col-span-1">
            <div className="rounded-3xl border border-slate-200 bg-white p-5">
              <h3 className="text-sm font-bold uppercase tracking-wide text-slate-500">Contact</h3>
              <div className="mt-3 space-y-3">
                <div className="flex items-center gap-3 text-sm text-slate-800">
                  <Mail size={16} className="text-slate-400" />
                  <span className="truncate">{lead?.email || "N/A"}</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-slate-800">
                  <Phone size={16} className="text-slate-400" />
                  <span className="truncate">{lead?.phone || "N/A"}</span>
                </div>
              </div>
              {lead?.notes ? (
                <div className="mt-4 border-t border-slate-100 pt-4">
                  <h4 className="text-xs font-bold uppercase tracking-wide text-slate-500">Notes</h4>
                  <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">{lead.notes}</p>
                </div>
              ) : null}
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-5">
              <h3 className="text-sm font-bold uppercase tracking-wide text-slate-500">Pipeline Stage</h3>
              {isConverted ? (
                <div className="mt-3 space-y-3">
                  <p className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                    This lead is converted to a client and is now read-only.
                  </p>
                  <button
                    type="button"
                    onClick={() => navigate(`/admin-panel/clients/${lead.convertedToUserId}`)}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100"
                  >
                    <UserCheck size={16} />
                    View as Client
                  </button>
                </div>
              ) : (
                <div className="mt-3 flex flex-wrap gap-2">
                  {PIPELINE_STAGES.map((stage) => {
                    const active = lead?.status === stage;
                    return (
                      <button
                        key={stage}
                        type="button"
                        onClick={() => handleStatusChange(stage)}
                        disabled={statusSaving || active}
                        className={[
                          "rounded-full border px-3 py-1.5 text-xs font-semibold transition disabled:cursor-default",
                          active
                            ? STATUS_STYLES[stage]
                            : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50",
                        ].join(" ")}
                      >
                        {stage}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {!isConverted ? (
              <div className="rounded-3xl border border-slate-200 bg-white p-5">
                <h3 className="text-sm font-bold uppercase tracking-wide text-slate-500">Convert</h3>
                <p className="mt-2 text-xs text-slate-500">
                  Creates a customer account (default password <span className="font-semibold">1234</span>). Requires phone and email.
                </p>
                <button
                  type="button"
                  onClick={handleConvert}
                  disabled={converting || !lead?.phone?.trim() || !lead?.email?.trim()}
                  className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <UserCheck size={16} />
                  {converting ? "Converting..." : "Convert to Client"}
                </button>
                {(!lead?.phone?.trim() || !lead?.email?.trim()) ? (
                  <p className="mt-2 text-xs text-amber-600">
                    {!lead?.email?.trim() ? "Add an email to enable convert." : "Add a phone to enable convert."}
                  </p>
                ) : null}
              </div>
            ) : null}
          </div>

          {/* Right: follow-up log */}
          <div className="lg:col-span-2">
            <div className="rounded-3xl border border-slate-200 bg-white p-5">
              <h3 className="text-sm font-bold uppercase tracking-wide text-slate-500">Follow-ups</h3>

              {!isConverted ? (
                <form onSubmit={handleAddFollowUp} className="mt-3 space-y-3">
                  <textarea
                    value={followUpNote}
                    onChange={(e) => setFollowUpNote(e.target.value)}
                    placeholder="Add a follow-up note (call summary, next step, etc.)"
                    rows={3}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-100"
                  />
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={followUpSaving}
                      className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60"
                    >
                      <MessageSquarePlus size={16} />
                      {followUpSaving ? "Adding..." : "Add Follow-up"}
                    </button>
                  </div>
                </form>
              ) : null}

              <div className="mt-5 space-y-3">
                {followUps.length === 0 ? (
                  <p className="rounded-2xl bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
                    No follow-ups yet.
                  </p>
                ) : (
                  followUps.map((item, index) => (
                    <div key={index} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <p className="whitespace-pre-wrap text-sm text-slate-800">{item.note}</p>
                      <p className="mt-2 text-xs text-slate-500">
                        {item.createdBy?.name ? `${item.createdBy.name} · ` : ""}
                        {formatDateTime(item.createdAt)}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Proposals / Quotations (versioned timeline) */}
            <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-5">
              <h3 className="text-sm font-bold uppercase tracking-wide text-slate-500">Proposals &amp; Quotations</h3>

              {!isConverted ? (
                <form onSubmit={handleUploadProposal} className="mt-3 space-y-3">
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={(e) => setProposalFile(e.target.files?.[0] || null)}
                    className="block w-full text-sm text-slate-700 file:mr-3 file:rounded-xl file:border-0 file:bg-slate-100 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-slate-700 hover:file:bg-slate-200"
                  />
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs text-slate-500">PDF or DOC. Each upload is saved as a new version.</p>
                    <button
                      type="submit"
                      disabled={proposalUploading || !proposalFile}
                      className="inline-flex shrink-0 items-center gap-2 rounded-2xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <Upload size={16} />
                      {proposalUploading ? "Uploading..." : "Upload Proposal"}
                    </button>
                  </div>
                </form>
              ) : null}

              <div className="mt-5 space-y-3">
                {proposals.length === 0 ? (
                  <p className="rounded-2xl bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
                    No proposals uploaded yet.
                  </p>
                ) : (
                  proposals.map((item, index) => (
                    <div key={index} className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700">
                          <FileText size={18} />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-slate-900">
                            Proposal v{item.version} · <span className="truncate font-normal text-slate-600">{item.name}</span>
                          </p>
                          <p className="mt-0.5 text-xs text-slate-500">{formatDateTime(item.uploadedAt)}</p>
                        </div>
                      </div>
                      {item.downloadLink ? (
                        <a
                          href={item.downloadLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
                        >
                          <Download size={14} />
                          Download
                        </a>
                      ) : null}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </AdminWorkspaceShell>
    </AdminLayout>
  );
};

export default AdminLeadDetailPage;
