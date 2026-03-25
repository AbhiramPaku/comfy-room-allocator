
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter
} from '@/components/ui/card';
import { Bell, UserPlus, Wrench, BedDouble, Users } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

// --- UPDATED: The component now receives `stats` as a prop ---
export function NotificationPanel({ rooms, stats }) {

  const fullRooms = (rooms || []).filter(room => room.occupiedBeds >= room.totalBeds)
    .map(room => ({
      id: room._id,
      type: 'Room Full',
      message: `Room ${room.roomNumber} on floor ${room.floor} is full.`,
      icon: <Bell className="h-4 w-4 text-destructive" />
  }));

  const sampleNotifications = [
    {
      id: 'req-1',
      type: 'New Request',
      message: 'John Doe requested a room change.',
      icon: <UserPlus className="h-4 w-4 text-blue-500" />
    },
    {
      id: 'maint-1',
      type: 'Maintenance',
      message: 'AC in room 203 needs repair.',
      icon: <Wrench className="h-4 w-4 text-yellow-500" />
    }
  ];

  const allNotifications = [...sampleNotifications, ...fullRooms];

  return (
    <div className="space-y-6">
      {/* --- NEW: Vacancy Statistics Card --- */}
      {stats && (
        <Card>
          <CardHeader>
            <CardTitle>Vacancy</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-1">
                <p className="text-sm font-medium">Overall Vacancy</p>
                <p className="text-lg font-bold">{stats.vacancy}%</p>
              </div>
              <Progress value={100 - parseFloat(stats.vacancy)} className="w-full" />
            </div>
            <div className="flex justify-between text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                    <BedDouble className="h-4 w-4"/>
                    <span>{stats.totalBeds} Total Beds</span>
                </div>
                <div className="flex items-center gap-2">
                    <Users className="h-4 w-4"/>
                    <span>{stats.occupiedBeds} Occupied</span>
                </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* --- Original Notifications Card --- */}
      <Card>
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
        </CardHeader>
        <CardContent>
          {allNotifications.length > 0 ? (
            <ul className="space-y-4">
              {allNotifications.map(notification => (
                <li key={notification.id} className="flex items-start gap-4">
                  {notification.icon}
                  <div className="flex-1">
                    <p className="text-sm font-medium">{notification.type}</p>
                    <p className="text-sm text-muted-foreground">{notification.message}</p>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">No new notifications.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
