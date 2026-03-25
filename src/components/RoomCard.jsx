
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function RoomCard({ room, onEditRoom, onOpenDetails }) {
  const isFull = room.occupiedBeds >= room.totalBeds;
  const availabilityClass = isFull ? 'bg-status-full' : 'bg-status-available';

  return (
    <Card className="overflow-hidden relative">
      <div className={cn("h-2 w-full", availabilityClass)} />
      <div onClick={() => onOpenDetails(room)} className="cursor-pointer">
        <CardContent className="p-4">
          <div className="flex flex-col items-center text-center">
            <h3 className="text-lg font-bold">{room.roomNumber}</h3>
            <p className="text-sm text-muted-foreground">
              {room.occupiedBeds} / {room.totalBeds} beds
            </p>
          </div>
        </CardContent>
      </div>
      <div className="flex justify-center pb-4">
        <Button 
          variant="outline" 
          size="sm" 
          className="text-white"
          onClick={(e) => {
            e.stopPropagation(); // Prevent the card's onClick from firing
            onEditRoom(room);
          }}
        >
          Edit
        </Button>
      </div>
    </Card>
  );
}
