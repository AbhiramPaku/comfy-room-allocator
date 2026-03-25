
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export function ViewRequestModal({ isOpen, onClose, request }) {
  if (!request) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Request Details</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div><strong>Student:</strong> {request.studentName}</div>
          <div><strong>Request Type:</strong> {request.requestType}</div>
          <div><strong>Date:</strong> {new Date(request.date).toLocaleDateString()}</div>
          <div><strong>Status:</strong> {request.status}</div>
          <div><strong>Details:</strong></div>
          <p>{request.details}</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
