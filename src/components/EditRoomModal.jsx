
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";

export function EditRoomModal({ isOpen, onClose, room, onSave }) {
  const [roomNumber, setRoomNumber] = useState("");
  const [floor, setFloor] = useState("");
  const [totalBeds, setTotalBeds] = useState("");

  useEffect(() => {
    if (room) {
      setRoomNumber(room.roomNumber || "");
      setFloor(room.floor?.toString() || "");
      setTotalBeds(room.totalBeds?.toString() || "");
    } else {
      setRoomNumber("");
      setFloor("");
      setTotalBeds("");
    }
  }, [room, isOpen]);

  const handleSave = () => {
    if (!roomNumber || !floor || !totalBeds) {
      alert("Please fill all fields.");
      return;
    }
    onSave({ 
        ...room, 
        roomNumber, 
        floor: parseInt(floor, 10),
        totalBeds: parseInt(totalBeds, 10)
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Room</DialogTitle>
          <DialogDescription>
            Make changes to the room details below.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="roomNumber" className="text-right">Room Number</Label>
            <Input id="roomNumber" value={roomNumber} onChange={(e) => setRoomNumber(e.target.value)} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="floor" className="text-right">Floor</Label>
            <Input id="floor" type="number" value={floor} onChange={(e) => setFloor(e.target.value)} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="totalBeds" className="text-right">Total Beds</Label>
            <Input id="totalBeds" type="number" value={totalBeds} onChange={(e) => setTotalBeds(e.target.value)} className="col-span-3" />
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
