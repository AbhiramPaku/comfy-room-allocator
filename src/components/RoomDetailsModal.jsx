
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Bed } from "lucide-react";

export function RoomDetailsModal({ room, isOpen, onClose }) {
  if (!room) return null;

  // Create an array of beds, populating with occupants and leaving the rest available
  const beds = Array.from({ length: room.totalBeds }).map((_, i) => {
    const occupant = room.occupants[i];
    return {
      occupied: !!occupant,
      studentName: occupant ? occupant.name : "Available",
    };
  });

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{room.roomNumber}</DialogTitle>
          <DialogDescription>
            Occupied Beds: {room.occupiedBeds} / {room.totalBeds}
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-4 py-4">
          {beds.map((bed, index) => (
            <div 
              key={index} 
              className={`flex items-center gap-3 p-3 rounded-lg border ${bed.occupied ? 'bg-muted' : 'bg-background'}`}
            >
              <Bed className={`h-6 w-6 ${bed.occupied ? 'text-red-500' : 'text-green-500'}`} />
              <div className="flex flex-col">
                <p className="font-semibold">Bed {index + 1}</p>
                <p className="text-sm text-muted-foreground">{bed.studentName}</p>
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
