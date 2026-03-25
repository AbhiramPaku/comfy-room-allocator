
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { EditRoomModal } from '@/components/EditRoomModal';
import { AddRoomModal } from '@/components/AddRoomModal';
import { DeleteConfirmationModal } from '@/components/DeleteConfirmationModal';
import { Loader2 } from 'lucide-react';
import { apiFetch } from '@/lib/api';

export default function Rooms() {
  const [rooms, setRooms] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(null);

  const fetchRooms = async () => {
    setIsLoading(true);
    try {
      const response = await apiFetch('/api/rooms');
      const data = await response.json();
      setRooms(data);
    } catch (error) {
      console.error('Failed to fetch rooms:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  const handleCloseModals = () => {
    setIsAddModalOpen(false);
    setIsEditModalOpen(false);
    setIsDeleteModalOpen(false);
  };

  const handleAdd = async (newRoom) => {
    try {
      const response = await apiFetch('/api/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRoom),
      });
      const addedRoom = await response.json();
      setRooms([...rooms, addedRoom]);
      handleCloseModals();
    } catch (error) {
      console.error('Failed to add room:', error);
    }
  };

  const handleEdit = (room) => {
    setSelectedRoom(room);
    setIsEditModalOpen(true);
  };

  const handleSave = async (updatedRoom) => {
    try {
      const response = await apiFetch(`/api/rooms/${updatedRoom._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedRoom),
      });
      const newRoom = await response.json();
      setRooms(rooms.map((r) => (r._id === newRoom._id ? newRoom : r)));
      handleCloseModals();
    } catch (error) {
      console.error('Failed to save room:', error);
    }
  };

  const handleDelete = (room) => {
    setSelectedRoom(room);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    try {
      await apiFetch(`/api/rooms/${selectedRoom._id}`, {
        method: 'DELETE',
      });
      setRooms(rooms.filter((r) => r._id !== selectedRoom._id));
      handleCloseModals();
    } catch (error) {
      console.error('Failed to delete room:', error);
    }
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Manage Rooms</CardTitle>
          <Button onClick={() => setIsAddModalOpen(true)}>Add Room</Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Room Number</TableHead>
                  <TableHead>Floor</TableHead>
                  <TableHead>Total Beds</TableHead>
                  <TableHead>Occupied Beds</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rooms.map((room) => (
                  <TableRow key={room._id}>
                    <TableCell>{room.roomNumber}</TableCell>
                    <TableCell>{room.floor}</TableCell>
                    <TableCell>{room.totalBeds}</TableCell>
                    <TableCell>{room.occupiedBeds}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm" className="mr-2" onClick={() => handleEdit(room)}>
                        Edit
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => handleDelete(room)}>
                        Delete
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {isAddModalOpen && (
        <AddRoomModal 
          isOpen={isAddModalOpen} 
          onClose={handleCloseModals} 
          onAdd={handleAdd} 
        />
      )}

      {selectedRoom && (
        <EditRoomModal
          isOpen={isEditModalOpen}
          onClose={handleCloseModals}
          room={selectedRoom}
          onSave={handleSave}
        />
      )}

      {selectedRoom && (
        <DeleteConfirmationModal
          isOpen={isDeleteModalOpen}
          onClose={handleCloseModals}
          onConfirm={handleConfirmDelete}
          title="Delete Room"
          description={`Are you sure you want to delete room ${selectedRoom.roomNumber}? This will also unassign any students in this room.`}
        />
      )}
    </>
  );
}
