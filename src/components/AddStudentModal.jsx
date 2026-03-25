
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function AddStudentModal({ isOpen, onClose, onAdd }) {
  const [name, setName] = useState("");
  const [studentId, setStudentId] = useState("");
  const [room, setRoom] = useState("");

  const handleSubmit = () => {
    onAdd({ name, studentId, room });
    onClose(); // Close the modal after adding
  };

  // Reset form when the modal is opened
  useEffect(() => {
    if (isOpen) {
      setName("");
      setStudentId("");
      setRoom("");
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Student</DialogTitle>
          <DialogDescription>
            Fill in the details below to add a new student.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">Name</Label>
            <Input 
              id="name" 
              className="col-span-3" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Jane Doe"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="studentId" className="text-right">Student ID</Label>
            <Input 
              id="studentId" 
              className="col-span-3" 
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              placeholder="e.g., 123456"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="room" className="text-right">Room</Label>
            <Input 
              id="room" 
              className="col-span-3" 
              value={room}
              onChange={(e) => setRoom(e.target.value)}
              placeholder="e.g., ACR-101"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" onClick={handleSubmit}>Add Student</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
