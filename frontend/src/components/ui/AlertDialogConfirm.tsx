import * as React from 'react';
import { LogOutIcon } from 'lucide-react';

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
} from './alert-dialog';

interface AlertDialogConfirmProps {
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => Promise<void> | void;
  trigger: React.ReactElement;
  busy?: boolean;
  tone?: 'danger' | 'default';
}

export function AlertDialogConfirm({
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  trigger,
  busy = false,
  tone = 'default',
}: AlertDialogConfirmProps) {
  const [open, setOpen] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);

  const handleConfirm = async () => {
    if (submitting || busy) return;
    setSubmitting(true);
    try {
      await Promise.resolve(onConfirm());
      setOpen(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={(next) => !submitting && setOpen(next)}>
      <AlertDialogTrigger render={trigger} />
      <AlertDialogContent size="sm">
        <AlertDialogHeader>
          <AlertDialogMedia
            className={
              tone === 'danger' ? 'bg-wood/10 text-red-600' : 'bg-gold/15 text-gold'
            }
          >
            <LogOutIcon />
          </AlertDialogMedia>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={submitting || busy}>{cancelLabel}</AlertDialogCancel>
          <AlertDialogAction
            variant={tone === 'danger' ? 'danger' : 'primary'}
            disabled={submitting || busy}
            onClick={(e) => {
              e.preventDefault();
              void handleConfirm();
            }}
          >
            {submitting || busy ? 'Please wait…' : confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
