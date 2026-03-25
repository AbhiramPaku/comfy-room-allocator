
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useState, useEffect } from "react";
import { ViewRequestModal } from "@/components/ViewRequestModal";
import { Loader2 } from "lucide-react";
import { apiFetch } from "@/lib/api";

export default function Requests() {
  const [requests, setRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);

  useEffect(() => {
    const fetchRequests = async () => {
      setIsLoading(true);
      try {
        const response = await apiFetch("/api/requests");
        const data = await response.json();
        setRequests(data);
      } catch (error) {
        console.error("Failed to fetch requests:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchRequests();
  }, []);

  const handleUpdateStatus = async (id, status) => {
    try {
      // --- THE FINAL FIX ---
      // The API endpoint for updating is now PUT /api/requests/:id
      const response = await apiFetch(`/api/requests/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        // The body only needs to contain the fields being changed.
        body: JSON.stringify({ status }),
      });
      const updatedRequest = await response.json();
      setRequests(
        requests.map((r) => (r._id === updatedRequest._id ? updatedRequest : r))
      );
    } catch (error) {
      console.error("Failed to update request status:", error);
    }
  };

  const handleView = (request) => {
    setSelectedRequest(request);
    setIsModalOpen(true);
  };

  const getStatusVariant = (status) => {
    switch (status) {
      case "Pending":
        return "secondary";
      case "Approved":
        return "default";
      case "Rejected":
        return "destructive";
      default:
        return "outline";
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Requests and Changes</CardTitle>
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
                  <TableHead>Student Name</TableHead>
                  <TableHead>Request Type</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map((request) => (
                  <TableRow
                    key={request._id}
                    className={request.status === "Rejected" ? "bg-red-100 dark:bg-red-900/50" : ""}
                  >
                    <TableCell>{request.studentName}</TableCell>
                    <TableCell>{request.requestType}</TableCell>
                    <TableCell>{new Date(request.date).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Badge
                        variant={getStatusVariant(request.status)}
                        className={request.status === "Rejected" ? "bg-red-500 text-white" : ""}
                      >
                        {request.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {request.status === "Pending" && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleUpdateStatus(request._id, "Approved")}
                          >
                            Approve
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="ml-2"
                            onClick={() => handleUpdateStatus(request._id, "Rejected")}
                          >
                            Reject
                          </Button>
                        </>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        className="ml-2"
                        onClick={() => handleView(request)}
                      >
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      <ViewRequestModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        request={selectedRequest}
      />
    </>
  );
}
