import type { ReactNode } from 'react';
import { create } from 'zustand';

export interface DialogSpec {
  id: number;
  render: (close: () => void) => ReactNode;
  /** Called when dismissed by back button or tapping outside. */
  onDismiss?: () => void;
}

interface DialogState {
  stack: DialogSpec[];
  open(render: DialogSpec['render'], onDismiss?: () => void): void;
  closeTop(): boolean;
}

let nextId = 1;

export const useDialogs = create<DialogState>((set, get) => ({
  stack: [],
  open: (render, onDismiss) => set((s) => ({ stack: [...s.stack, { id: nextId++, render, onDismiss }] })),
  closeTop: () => {
    const top = get().stack.at(-1);
    if (!top) return false;
    set((s) => ({ stack: s.stack.slice(0, -1) }));
    top.onDismiss?.();
    return true;
  },
}));

export function openDialog(render: DialogSpec['render'], onDismiss?: () => void) {
  useDialogs.getState().open(render, onDismiss);
}

interface ConfirmOpts {
  title?: string;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  danger?: boolean;
}

export function confirmDialog(opts: ConfirmOpts): Promise<boolean> {
  return new Promise((resolve) => {
    let done = false;
    const finish = (v: boolean, close?: () => void) => {
      if (done) return;
      done = true;
      close?.();
      resolve(v);
    };
    openDialog(
      (close) => (
      <Sheet title={opts.title}>
        <p className="dialog-msg">{opts.message}</p>
        <div className="dialog-actions">
          <button className="btn btn-plain" onClick={() => finish(false, close)}>
            {opts.cancelLabel}
          </button>
          <button className={`btn ${opts.danger ? 'btn-danger' : 'btn-gold'}`} onClick={() => finish(true, close)}>
            {opts.confirmLabel}
          </button>
        </div>
      </Sheet>
      ),
      () => finish(false),
    );
  });
}

/** Bottom sheet frame. */
export function Sheet({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <div className="sheet" role="dialog" aria-modal="true">
      {title && <h2 className="sheet-title">{title}</h2>}
      {children}
    </div>
  );
}

export function DialogHost() {
  const stack = useDialogs((s) => s.stack);
  const closeTop = useDialogs((s) => s.closeTop);
  if (!stack.length) return null;
  return (
    <>
      {stack.map((d, i) => (
        <div key={d.id} className="backdrop" onClick={(e) => e.target === e.currentTarget && i === stack.length - 1 && closeTop()}>
          {d.render(() => {
            useDialogs.setState((s) => ({ stack: s.stack.filter((x) => x.id !== d.id) }));
          })}
        </div>
      ))}
    </>
  );
}
