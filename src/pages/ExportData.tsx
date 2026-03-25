
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CSVLink } from "react-csv";

const students = [
  { id: "1", name: "John Doe", studentId: "S001", room: "101" },
  { id: "2", name: "Jane Smith", studentId: "S002", room: "102" },
  { id: "3", name: "Peter Jones", studentId: "S003", room: "103" },
];

const rooms = [
  { id: "1", roomNumber: "101", totalBeds: 2, occupiedBeds: 2 },
  { id: "2", roomNumber: "102", totalBeds: 3, occupiedBeds: 3 },
  { id: "3", roomNumber: "103", totalBeds: 2, occupiedBeds: 1 },
];

export default function ExportData() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Export Data</CardTitle>
      </CardHeader>
      <CardContent className="flex gap-4">
        <CSVLink data={students} filename={"students.csv"}>
          <Button>Export Students</Button>
        </CSVLink>
        <CSVLink data={rooms} filename={"rooms.csv"}>
          <Button>Export Rooms</Button>
        </CSVLink>
      </CardContent>
    </Card>
  );
}
