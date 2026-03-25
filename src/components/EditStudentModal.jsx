
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";

export function EditStudentModal({ isOpen, onClose, student, onSave }) {
  const [name, setName] = useState("");
  const [studentId, setStudentId] = useState("");
  const [roomNumber, setRoomNumber] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    if (student) {
      setName(student.name || "");
      setStudentId(student.studentId || "");
      setRoomNumber(student.roomNumber || "");
    }
  }, [student]);

  const handleSave = () => {
    const updatedStudent = { 
        ...student, 
        name, 
        studentId, 
        roomNumber 
    };
    onSave(updatedStudent);
    toast({
      title: "Student Updated",
      description: "The student's details have been updated successfully.",
    });
    onClose();
  };

  if (!isOpen) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Student</DialogTitle>
          <DialogDescription>
            Make changes to the student's details below.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">Name</Label>
            <Input id="name" placeholder={student?.name || "Enter name"} value={name} onChange={(e) => setName(e.target.value)} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="studentId" className="text-right">Student ID</Label>
            <Input id="studentId" placeholder={student?.studentId || "Enter student ID"} value={studentId} onChange={(e) => setStudentId(e.target.value)} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="roomNumber" className="text-right">Room</Label>
            <Input id="roomNumber" placeholder={student?.roomNumber || "Enter room number"} value={roomNumber} onChange={(e) => setRoomNumber(e.target.value)} className="col-span-3" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
