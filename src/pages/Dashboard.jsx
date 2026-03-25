
import { useState, useEffect } from 'react';
import { FloorSection } from '@/components/FloorSection';
import { EditRoomModal } from '@/components/EditRoomModal';
import { NotificationPanel } from '@/components/NotificationPanel';
import { RoomDetailsModal } from '@/components/RoomDetailsModal';
import { Loader2 } from 'lucide-react';
import { apiFetch } from '@/lib/api';

export default function Dashboard() {
  const [floors, setFloors] = useState({});
  // --- NEW: State for dashboard statistics ---
  const [dashboardStats, setDashboardStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(null);

  const fetchData = async () => {
    try {
      // --- UPDATED: Fetch from both endpoints at the same time ---
      const [roomsResponse, dashboardResponse] = await Promise.all([
        apiFetch(`/api/rooms?timestamp=${new Date().getTime()}`),
        apiFetch(`/api/dashboard?timestamp=${new Date().getTime()}`)
      ]);

      if (!roomsResponse.ok) throw new Error('Failed to fetch rooms');
      if (!dashboardResponse.ok) throw new Error('Failed to fetch dashboard stats');

      const rooms = await roomsResponse.json();
      const stats = await dashboardResponse.json();
      
      // --- NEW: Update the statistics state ---
      setDashboardStats(stats);

      const floorsData = rooms.reduce((acc, room) => {
        const floorKey = room.floor.toString();
        if (!acc[floorKey]) acc[floorKey] = [];
        acc[floorKey].push(room);
        return acc;
      }, {});
      
      setFloors(floorsData);

    } catch (error) {
      console.error('Error fetching live data:', error);
    } finally {
      if (isLoading) setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const intervalId = setInterval(fetchData, 3000);
    return () => clearInterval(intervalId);
  }, []);

  const handleEdit = (room) => {
    setSelectedRoom(room);
    setIsEditModalOpen(true);
  };
  
  const handleOpenDetails = (room) => {
    setSelectedRoom(room);
    setIsDetailsModalOpen(true);
  };

  const handleSave = async (roomToSave) => {
    try {
      const response = await apiFetch(`/api/rooms/${roomToSave._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(roomToSave),
      });

      if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to save room');
      }
      
      setIsEditModalOpen(false);

    } catch (error) {
      console.error('Save failed:', error);
    }
  };
  
  const allRoomsForPanel = Object.values(floors).flat();

  return (
    <div className="p-4 sm:p-6">
      <h1 className="text-2xl font-bold mb-4">Hostel Dashboard</h1>
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3 space-y-6">
            {Object.entries(floors)
              .sort(([floorA], [floorB]) => parseInt(floorA, 10) - parseInt(floorB, 10))
              .map(([floor, rooms]) => (
                <FloorSection 
                  key={floor} 
                  floor={floor} 
                  rooms={rooms}
                  onEditRoom={handleEdit}
                  onOpenDetails={handleOpenDetails} 
                />
              ))}
          </div>
          <div className="lg:col-span-1">
            {/* --- UPDATED: Pass the new stats to the panel --- */}
            <NotificationPanel rooms={allRoomsForPanel} stats={dashboardStats} />
          </div>
        </div>
      )}

      {selectedRoom && (
        <EditRoomModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          room={selectedRoom}
          onSave={handleSave}
        />
      )}

      {selectedRoom && (
        <RoomDetailsModal
          isOpen={isDetailsModalOpen}
          onClose={() => setIsDetailsModalOpen(false)}
          room={selectedRoom}
        />
      )}
    </div>
  );
}
