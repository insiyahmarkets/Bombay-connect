import { useState } from 'react';
import { registerEndpoint, getEndpoints } from '../api';
import type { Endpoint } from '../types';
import { UserPlus, CheckCircle, AlertCircle } from 'lucide-react';

interface EndpointRegistrationProps {
  onRegistered?: () => void;
}

const INITIAL = {
  participant_id: '',
  site_label: '',
  access_medium: '',
  isp: '',
  device_connection: '',
  notes: '',
};

export function EndpointRegistration({ onRegistered }: EndpointRegistrationProps) {
  const [form, setForm] = useState(INITIAL);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [showForm, setShowForm] = useState(false);

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm(f => ({ ...f, [k]: e.target.value }));
    setFieldErrors(fe => ({ ...fe, [k]: '' }));
    setError(null);
    setSuccess(null);
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!form.participant_id.trim()) errs.participant_id = 'Required';
    else if (!/^[A-Za-z0-9_-]{1,20}$/.test(form.participant_id)) errs.participant_id = 'Use 1–20 letters, numbers, - or _';
    if (!form.site_label.trim()) errs.site_label = 'Required';
    if (!form.access_medium) errs.access_medium = 'Select an access medium';
    if (!form.isp.trim()) errs.isp = 'Required';
    if (!form.device_connection) errs.device_connection = 'Select a device connection type';
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const ep = await registerEndpoint({
        participant_id: form.participant_id.trim(),
        site_label: form.site_label.trim(),
        access_medium: form.access_medium,
        isp: form.isp.trim(),
        device_connection: form.device_connection,
        notes: form.notes.trim() || undefined,
      });
      setSuccess(`Endpoint "${ep.participant_id}" registered successfully.`);
      setForm(INITIAL);
      onRegistered?.();
      setTimeout(() => setShowForm(false), 2000);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error
        || 'Registration failed. Please try again.';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const Field = ({ label, id, children, error: err }: { label: string; id: string; children: React.ReactNode; error?: string }) => (
    <div>
      <label htmlFor={id} className="metric-label block mb-1">{label}</label>
      {children}
      {err && <p className="text-xs text-red-600 mt-0.5">{err}</p>}
    </div>
  );

  return (
    <section className="card overflow-hidden">
      <button
        className="w-full px-5 py-4 flex items-center gap-2 text-left hover:bg-gray-50 transition-colors"
        onClick={() => setShowForm(v => !v)}
      >
        <UserPlus className="w-4 h-4 text-gray-500" />
        <h2 className="text-base font-semibold text-gray-800">Register Measurement Endpoint</h2>
        <span className="ml-auto text-gray-400 text-sm">{showForm ? '▲ Close' : '▼ Open'}</span>
      </button>

      {showForm && (
        <div className="border-t border-gray-100 px-5 py-4">
          {/* Consent notice */}
          <div className="mb-4 text-xs text-blue-700 bg-blue-50 rounded-lg border border-blue-200 px-3 py-2.5">
            <strong>Measurement transparency:</strong> By registering, you confirm that the access-medium
            information below is accurate and that you consent to periodic automated network measurements
            being submitted from this device to the NetCompare pilot backend. No browsing history or
            personal information is collected. Measurements run only when the agent script is active.
          </div>

          <form onSubmit={handleSubmit} noValidate className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Anonymous Participant ID *" id="participant_id" error={fieldErrors.participant_id}>
              <input
                id="participant_id"
                className="form-input font-mono"
                placeholder="e.g. P001"
                value={form.participant_id}
                onChange={set('participant_id')}
                maxLength={20}
                autoComplete="off"
              />
              <p className="text-xs text-gray-400 mt-0.5">
                Do not use your real name. Use a code like P001.
              </p>
            </Field>

            <Field label="Site / Location Label *" id="site_label" error={fieldErrors.site_label}>
              <input
                id="site_label"
                className="form-input"
                placeholder="e.g. Mumbai Central"
                value={form.site_label}
                onChange={set('site_label')}
                maxLength={100}
              />
            </Field>

            <Field label="Access Medium *" id="access_medium" error={fieldErrors.access_medium}>
              <select id="access_medium" className="form-select" value={form.access_medium} onChange={set('access_medium')}>
                <option value="">— Select access medium —</option>
                <option value="fiber">Fiber Broadband</option>
                <option value="mobile">Mobile / Cellular Internet</option>
                <option value="fixed_wireless">Fixed Wireless</option>
                <option value="other">Other</option>
              </select>
              <p className="text-xs text-gray-400 mt-0.5">
                How your premises receive Internet (not how your device connects).
              </p>
            </Field>

            <Field label="ISP *" id="isp" error={fieldErrors.isp}>
              <input
                id="isp"
                className="form-input"
                placeholder="e.g. JioFiber"
                value={form.isp}
                onChange={set('isp')}
                maxLength={100}
              />
            </Field>

            <Field label="Device Connection Type *" id="device_connection" error={fieldErrors.device_connection}>
              <select id="device_connection" className="form-select" value={form.device_connection} onChange={set('device_connection')}>
                <option value="">— Select device connection —</option>
                <option value="wifi">Wi-Fi</option>
                <option value="ethernet">Ethernet</option>
                <option value="cellular">Cellular (direct SIM)</option>
                <option value="unknown">Unknown</option>
              </select>
              <p className="text-xs text-gray-400 mt-0.5">
                How your device connects to the router / hotspot.
              </p>
            </Field>

            <Field label="Notes (optional)" id="notes" error={fieldErrors.notes}>
              <textarea
                id="notes"
                className="form-input resize-none"
                rows={2}
                placeholder="Optional — no personal information"
                value={form.notes}
                onChange={set('notes')}
                maxLength={500}
              />
            </Field>

            <div className="sm:col-span-2 flex flex-col gap-3">
              {success && (
                <div className="flex items-center gap-2 text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
                  <CheckCircle className="w-4 h-4 flex-shrink-0" />
                  {success}
                </div>
              )}
              {error && (
                <div className="flex items-center gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {error}
                </div>
              )}
              <div className="flex gap-3">
                <button type="submit" className="btn-primary" disabled={submitting}>
                  {submitting ? 'Registering…' : 'Register Endpoint'}
                </button>
                <button type="button" className="btn-secondary" onClick={() => { setForm(INITIAL); setFieldErrors({}); setError(null); setSuccess(null); }}>
                  Reset
                </button>
              </div>
            </div>
          </form>
        </div>
      )}
    </section>
  );
}
