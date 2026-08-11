import * as React from "react"
import { CheckCircle2Icon, Trash2Icon, AlertCircleIcon } from "lucide-react"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "../ui/alert-dialog"

interface AlertDialogResetProps {
  onConfirm: () => Promise<void> | void;
  trigger: React.ReactElement;
  busy?: boolean;
}

export function AlertDialogReset({
  onConfirm,
  trigger,
  busy = false,
}: AlertDialogResetProps) {
  const [isConfirmOpen, setIsConfirmOpen] = React.useState(false);
  const [isStatusOpen, setIsStatusOpen] = React.useState(false);
  const [statusError, setStatusError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);

  const handleConfirm = async () => {
    if (submitting || busy) return;
    setSubmitting(true);
    setStatusError(null);
    try {
      await Promise.resolve(onConfirm());
      setIsConfirmOpen(false);
      setIsStatusOpen(true);
    } catch (err) {
      setIsConfirmOpen(false);
      setStatusError(err instanceof Error ? err.message : 'Reset failed. Please try again.');
      setIsStatusOpen(true);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <AlertDialog open={isConfirmOpen} onOpenChange={(open) => !submitting && setIsConfirmOpen(open)}>
        <AlertDialogTrigger render={trigger} />

        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogMedia className="bg-wood/10 text-red-600">
              <Trash2Icon />
            </AlertDialogMedia>

            <AlertDialogTitle>Reset Progress?</AlertDialogTitle>

            <AlertDialogDescription>
              This will wipe all your kung fu belt progress,
              unlocked cards, solved puzzles and leaderboard
              rankings on the server.

              <br />
              <br />

              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel variant="outline" disabled={submitting}>Cancel</AlertDialogCancel>

            <AlertDialogAction
              variant="danger"
              disabled={submitting || busy}
              onClick={() => {
                void handleConfirm();
              }}
            >
              {submitting ? 'Resetting…' : 'Reset Progress'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={isStatusOpen} onOpenChange={setIsStatusOpen}>
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogMedia className={statusError ? 'bg-red-500/10 text-red-600' : 'bg-emerald-500/10 text-emerald-600'}>
              {statusError ? <AlertCircleIcon /> : <CheckCircle2Icon />}
            </AlertDialogMedia>

            <AlertDialogTitle>{statusError ? 'Reset Failed' : 'Reset Complete'}</AlertDialogTitle>

            <AlertDialogDescription>
              {statusError ||
                'All training scrolls and belt progress have been reset to White Belt.'}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogAction
              variant="outline"
              onClick={() => {
                setIsStatusOpen(false);
                setStatusError(null);
              }}
            >
              OK
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
