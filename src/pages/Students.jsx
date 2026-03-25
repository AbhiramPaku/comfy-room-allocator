
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AddStudentModal } from "@/components/AddStudentModal";
import { EditStudentModal } from "@/components/EditStudentModal";
import { DeleteConfirmationModal } from "@/components/DeleteConfirmationModal";
import { Loader2, AlertCircle } from "lucide-react";
import { apiFetch } from "@/lib/api";

export default function Students() {
  const [students, setStudents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);

  const fetchStudents = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiFetch("/api/students");
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      setStudents(data.filter((student) => student));
    } catch (err) {
      console.error("Failed to fetch students:", err);
      setError("Failed to load student data. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const handleAddStudent = async (newStudent) => {
    try {
      const response = await apiFetch("/api/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newStudent),
      });
      if (!response.ok) throw new Error("Failed to add student");
      await fetchStudents();
    } catch (error) {
      console.error("Failed to add student:", error);
    }
  };

  const handleEdit = (student) => {
    setSelectedStudent(student);
    setIsEditModalOpen(true);
  };

  const handleSave = async (updatedStudent) => {
    try {
      const response = await apiFetch(`/api/students/${updatedStudent._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedStudent),
      });
      if (!response.ok) throw new Error("Failed to update student");
      await fetchStudents();
    } catch (error) {
      console.error("Failed to save student:", error);
    } finally {
      setIsEditModalOpen(false);
    }
  };

  const openDeleteModal = (student) => {
    setSelectedStudent(student);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedStudent) return;
    try {
      const response = await apiFetch(`/api/students/${selectedStudent._id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete student");
      await fetchStudents();
    } catch (error) {
      console.error("Failed to delete student:", error);
    } finally {
      setIsDeleteModalOpen(false);
      setSelectedStudent(null);
    }
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Manage Students</CardTitle>
          <Button onClick={() => setIsAddModalOpen(true)}>Add Student</Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : error ? (
            <div className="text-center py-10 text-destructive">
              <AlertCircle className="mx-auto h-8 w-8" />
              <p className="mt-2">{error}</p>
              <Button variant="outline" size="sm" className="mt-4" onClick={fetchStudents}>
                Retry
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Student ID</TableHead>
                  <TableHead>Room</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.map((student) => (
                  <TableRow key={student._id}>
                    <TableCell>{student.name}</TableCell>
                    <TableCell>{student.studentId}</TableCell>
                    <TableCell>{student.roomNumber || "N/A"}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm" className="mr-2" onClick={() => handleEdit(student)}>
                        Edit
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => openDeleteModal(student)}>
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

      <AddStudentModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={handleAddStudent}
      />

      {selectedStudent && (
        <EditStudentModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          student={selectedStudent}
          onSave={handleSave}
        />
      )}

      {selectedStudent && (
        <DeleteConfirmationModal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          onConfirm={handleConfirmDelete}
          title="Delete Student"
          description={`Are you sure you want to delete ${selectedStudent.name}? This action cannot be undone.`}
        />
      )}
    </>
  );
}
