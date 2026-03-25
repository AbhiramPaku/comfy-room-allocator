
import { RoomCard } from './RoomCard';

export function FloorSection({ floor, rooms, onEditRoom, onOpenDetails }) {
  const isNumeric = (value) => /^\d+$/.test(value);
  const floorTitle = isNumeric(floor) ? `Floor ${floor}` : floor;

  const sortedRooms = [...rooms].sort((a, b) => 
    a.roomNumber.localeCompare(b.roomNumber, undefined, { numeric: true })
  );

  return (
    <section>
      <h2 className="text-xl font-semibold mb-3 capitalize">{floorTitle}</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {sortedRooms.map(room => (
            <RoomCard 
              key={room._id} 
              room={room} 
              onEditRoom={onEditRoom} 
              onOpenDetails={onOpenDetails} 
            />
        ))}
      </div>
    </section>
  );
}
