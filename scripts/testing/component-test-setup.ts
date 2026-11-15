// The simulated browser used for component tests has no built-in dialog behavior.
// These stand in for what a real browser does: showModal opens the dialog, close fires
// the close event, and Escape closes an open modal dialog.
if (typeof HTMLDialogElement !== "undefined") {
  const proto = HTMLDialogElement.prototype as HTMLDialogElement & { showModal?: () => void; show?: () => void; close?: () => void };
  const escapeCloses = (event: Event) => {
    const dialog = event.currentTarget as HTMLDialogElement;
    if ((event as KeyboardEvent).key === "Escape" && dialog.hasAttribute("open")) dialog.close();
  };
  if (typeof proto.showModal !== "function") {
    proto.showModal = function showModal(this: HTMLDialogElement) {
      this.setAttribute("open", "");
      this.removeEventListener("keydown", escapeCloses);
      this.addEventListener("keydown", escapeCloses);
    };
  }
  if (typeof proto.show !== "function") proto.show = function show(this: HTMLDialogElement) { this.setAttribute("open", ""); };
  if (typeof proto.close !== "function") {
    proto.close = function close(this: HTMLDialogElement) {
      if (!this.hasAttribute("open")) return;
      this.removeAttribute("open");
      this.dispatchEvent(new Event("close"));
    };
  }
}
