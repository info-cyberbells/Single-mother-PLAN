"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, Clock, Video, Plus, X, AlertTriangle, CheckCircle, ExternalLink } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Input";
import { StatusBadge } from "@/components/ui/Badge";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/utils";

const bookSchema = z.object({
  counselor_id: z.string().min(1, "Please select a counselor"),
  scheduled_at: z.string().min(1, "Please select a date and time"),
  duration_minutes: z.string().default("30"),
  notes: z.string().optional(),
});

type BookFormData = z.infer<typeof bookSchema>;

export default function SessionsPage() {
  const [showBookModal, setShowBookModal] = useState(false);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [bookError, setBookError] = useState("");
  const queryClient = useQueryClient();

  const { data: sessions, isLoading } = useQuery({
    queryKey: ["sessions"],
    queryFn: () => api.get("/api/sessions").then((r) => r.data.data),
  });

  const { data: counselors } = useQuery({
    queryKey: ["counselors"],
    queryFn: () =>
      api.get("/api/user/counselors").then((r) => r.data.data),
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<BookFormData>({ resolver: zodResolver(bookSchema) });

  const bookMutation = useMutation({
    mutationFn: (data: BookFormData) =>
      api.post("/api/sessions/book", {
        ...data,
        duration_minutes: parseInt(data.duration_minutes),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      setShowBookModal(false);
      setBookError("");
      reset();
    },
    onError: (err: any) => {
      setBookError(err.response?.data?.error?.message || "Booking failed. Please try again.");
    },
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) =>
      api.put(`/api/sessions/${id}`, { status: "cancelled" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      setCancellingId(null);
    },
  });

  const upcoming = sessions?.filter(
    (s: any) => s.status === "scheduled" && new Date(s.scheduled_at) > new Date()
  ) || [];
  const past = sessions?.filter(
    (s: any) => s.status !== "scheduled" || new Date(s.scheduled_at) <= new Date()
  ) || [];

  const formatSessionTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
  };

  const getDaysUntil = (dateStr: string) => {
    const diff = new Date(dateStr).getTime() - Date.now();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    if (days === 0) return "Today";
    if (days === 1) return "Tomorrow";
    return `In ${days} days`;
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display font-bold text-2xl lg:text-3xl text-on-surface mb-1">
            Counselor Sessions
          </h1>
          <p className="text-sm text-on-surface-variant">
            Book 1-on-1 video sessions with certified benefits advisors
          </p>
        </div>
        <Button onClick={() => { setBookError(""); setShowBookModal(true); }}>
          <Plus className="w-4 h-4" />
          Book Session
        </Button>
      </div>

      {/* How it works banner */}
      {!isLoading && sessions?.length === 0 && (
        <Card className="mb-6 bg-primary-50/40 border border-primary-100">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center shrink-0">
              <Video className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <h3 className="font-semibold text-on-surface mb-1">How sessions work</h3>
              <p className="text-sm text-on-surface-variant leading-relaxed">
                Book a free 1-on-1 video call with a certified benefits advisor. They will review your
                eligibility results, help with applications, and answer any questions about government
                programs. Sessions are conducted via secure video link — no downloads required.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Upcoming Sessions */}
      <h2 className="font-display font-semibold text-on-surface mb-3">Upcoming Sessions</h2>
      {isLoading ? (
        <div className="space-y-3 mb-8">
          {[0, 1].map((i) => <div key={i} className="animate-pulse h-24 bg-surface-container rounded-xl" />)}
        </div>
      ) : upcoming.length === 0 ? (
        <Card className="mb-8 text-center" padding="lg">
          <Calendar className="w-10 h-10 text-on-surface-variant/30 mx-auto mb-3" />
          <p className="text-on-surface-variant text-sm mb-4">No upcoming sessions scheduled</p>
          <Button onClick={() => setShowBookModal(true)} variant="secondary" size="sm">
            Book your first session
          </Button>
        </Card>
      ) : (
        <div className="space-y-3 mb-8">
          {upcoming.map((session: any) => (
            <motion.div
              key={session.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card hover padding="sm">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary-50 flex items-center justify-center shrink-0">
                    <Video className="w-6 h-6 text-primary-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm text-on-surface">
                      Session with {session.counselor?.full_name || "Your Advisor"}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-on-surface-variant mt-0.5 flex-wrap">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {formatDate(session.scheduled_at)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {formatSessionTime(session.scheduled_at)} · {session.duration_minutes} min
                      </span>
                      <span className="font-semibold text-primary-600">
                        {getDaysUntil(session.scheduled_at)}
                      </span>
                    </div>
                    {session.notes && (
                      <p className="text-xs text-on-surface-variant/70 mt-1 italic truncate">
                        "{session.notes}"
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
                    <StatusBadge status={session.status} />
                    {session.meeting_url && (
                      <Button asChild size="sm">
                        <a href={session.meeting_url} target="_blank" rel="noopener noreferrer">
                          <Video className="w-3.5 h-3.5" />
                          Join Session
                          <ExternalLink className="w-3 h-3 ml-0.5 opacity-70" />
                        </a>
                      </Button>
                    )}
                    <button
                      onClick={() => setCancellingId(session.id)}
                      className="p-1.5 rounded-lg text-on-surface-variant hover:text-red-500 hover:bg-red-50 transition-colors"
                      title="Cancel session"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Past Sessions */}
      {past.length > 0 && (
        <>
          <h2 className="font-display font-semibold text-on-surface mb-3">Past Sessions</h2>
          <div className="space-y-2">
            {past.slice(0, 5).map((session: any) => (
              <Card key={session.id} padding="sm">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-surface-container flex items-center justify-center shrink-0">
                    <CheckCircle className="w-4 h-4 text-on-surface-variant/50" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm text-on-surface">
                      {session.counselor?.full_name || "Advisor"}
                    </div>
                    <div className="text-xs text-on-surface-variant">
                      {formatDate(session.scheduled_at)} · {session.duration_minutes} min
                    </div>
                  </div>
                  <StatusBadge status={session.status} />
                </div>
              </Card>
            ))}
          </div>
        </>
      )}

      {/* Cancel Confirmation Modal */}
      <AnimatePresence>
        {cancellingId && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-glass-lg w-full max-w-sm p-6"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                </div>
                <div>
                  <h3 className="font-semibold text-on-surface">Cancel Session?</h3>
                  <p className="text-xs text-on-surface-variant">This action cannot be undone.</p>
                </div>
              </div>
              <p className="text-sm text-on-surface-variant mb-6">
                Are you sure you want to cancel this session? Your advisor will be notified.
              </p>
              <div className="flex gap-3">
                <Button
                  variant="ghost"
                  size="md"
                  className="flex-1"
                  onClick={() => setCancellingId(null)}
                >
                  Keep Session
                </Button>
                <Button
                  variant="primary"
                  size="md"
                  className="flex-1 !bg-red-500 hover:!bg-red-600"
                  loading={cancelMutation.isPending}
                  onClick={() => cancelMutation.mutate(cancellingId)}
                >
                  Yes, Cancel
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Book Modal */}
      <AnimatePresence>
        {showBookModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-glass-lg w-full max-w-md"
            >
              <div className="p-6 border-b border-outline-variant/20 flex items-center justify-between">
                <div>
                  <h2 className="font-display font-semibold text-on-surface">Book Counselor Session</h2>
                  <p className="text-xs text-on-surface-variant mt-0.5">A secure video link will be generated</p>
                </div>
                <button
                  onClick={() => setShowBookModal(false)}
                  className="p-1.5 rounded-lg hover:bg-surface-container text-on-surface-variant"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <form
                onSubmit={handleSubmit((data) => bookMutation.mutate(data))}
                className="p-6 space-y-4"
              >
                {bookError && (
                  <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
                    {bookError}
                  </div>
                )}
                <Select
                  label="Select Counselor"
                  placeholder={counselors?.length === 0 ? "No counselors available" : "Choose a counselor..."}
                  error={errors.counselor_id?.message}
                  options={(counselors || []).map((c: any) => ({
                    value: c.id,
                    label: c.full_name,
                  }))}
                  required
                  {...register("counselor_id")}
                />
                <Input
                  label="Date & Time"
                  type="datetime-local"
                  error={errors.scheduled_at?.message}
                  required
                  min={new Date(Date.now() + 30 * 60 * 1000).toISOString().slice(0, 16)}
                  {...register("scheduled_at")}
                />
                <Select
                  label="Session Duration"
                  options={[
                    { value: "30", label: "30 minutes" },
                    { value: "45", label: "45 minutes" },
                    { value: "60", label: "60 minutes" },
                  ]}
                  {...register("duration_minutes")}
                />
                <Input
                  label="Notes (optional)"
                  placeholder="What would you like to discuss?"
                  {...register("notes")}
                />

                <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-50 border border-blue-100">
                  <Video className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                  <p className="text-xs text-blue-700">
                    A secure video meeting link will be generated and sent to your email after booking.
                  </p>
                </div>

                <div className="flex gap-3 pt-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="md"
                    className="flex-1"
                    onClick={() => setShowBookModal(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    size="md"
                    className="flex-1"
                    loading={bookMutation.isPending}
                  >
                    Confirm Booking
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
