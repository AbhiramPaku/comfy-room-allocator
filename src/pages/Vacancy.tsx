
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import jsPDF from "jspdf";
import "jspdf-autotable";
import { apiFetch } from "@/lib/api";

declare module "jspdf" {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

export default function Vacancy() {
  // --- RENAMED: State now holds a simple array of rooms ---
  const [rooms, setRooms] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // --- FIXED: Fetch from the correct endpoint --- 
        const response = await apiFetch("/api/rooms");
        const data = await response.json();
        setRooms(data);
      } catch (error) {
        console.error("Error fetching vacancy data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // --- SIMPLIFIED: Filter the flat array of rooms directly ---
  const vacantRooms = rooms.filter(room => room.occupiedBeds < room.totalBeds);

  const downloadPdf = () => {
    const doc = new jsPDF();
    doc.autoTable({
      head: [['Room Number', 'Floor', 'Available Beds']],
      body: vacantRooms.map(room => [
        room.roomNumber,
        room.floor,
        room.totalBeds - room.occupiedBeds
      ]),
    });
    doc.save('vacancy-report.pdf');
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Vacancy Report</CardTitle>
        <Button onClick={downloadPdf} disabled={isLoading || vacantRooms.length === 0}>
          Download as PDF
        </Button>
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
                <TableHead>Available Beds</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {vacantRooms.length > 0 ? (
                vacantRooms.map((room) => (
                  <TableRow key={room._id}>
                    <TableCell>{room.roomNumber}</TableCell>
                    <TableCell>{room.floor}</TableCell>
                    <TableCell>{room.totalBeds - room.occupiedBeds}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={3} className="text-center">
                    No vacancies available.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
