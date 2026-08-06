import * as React from "react"
import { CheckCircle2Icon, Trash2Icon } from "lucide-react"

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
}

export function AlertDialogReset({
  onConfirm,
  trigger,
}: AlertDialogResetProps) {
  const [isConfirmOpen, setIsConfirmOpen] = React.useState(false);
  const [isStatusOpen, setIsStatusOpen] = React.useState(false);

  const handleConfirm = async () => {
    setIsConfirmOpen(false);
    await Promise.resolve(onConfirm());
    setIsStatusOpen(true);
  };

  return (
    <>
      <AlertDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
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
              rankings.

              <br />
              <br />

              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel variant="outline">Cancel</AlertDialogCancel>

            <AlertDialogAction
              variant="danger"
              onClick={() => {
                void handleConfirm();
              }}
            >
              Reset Progress
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={isStatusOpen} onOpenChange={setIsStatusOpen}>
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogMedia className="bg-emerald-500/10 text-emerald-600">
              <CheckCircle2Icon />
            </AlertDialogMedia>

            <AlertDialogTitle>Reset Complete</AlertDialogTitle>

            <AlertDialogDescription>
              All training scrolls and belt progress have been reset to White Belt.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogAction
              variant="outline"
              onClick={() => setIsStatusOpen(false)}
            >
              OK
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}