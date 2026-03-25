
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from '@/components/ui/button';

const initialPayments = [
  { id: '1', studentId: 'S001', name: 'John Doe', status: 'Paid' },
  { id: '2', studentId: 'S002', name: 'Jane Smith', status: 'Pending' },
  { id: '3', studentId: 'S003', name: 'Peter Jones', status: 'Paid' },
];

export default function Payments() {
  const [payments, setPayments] = useState(initialPayments);

  const handlePayment = (id) => {
    setPayments(payments.map(p => p.id === id ? { ...p, status: 'Paid' } : p));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Payment Status</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Student ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {payments.map((payment) => (
              <TableRow key={payment.id}>
                <TableCell>{payment.studentId}</TableCell>
                <TableCell>{payment.name}</TableCell>
                <TableCell>{payment.status}</TableCell>
                <TableCell>
                  {payment.status === 'Pending' && (
                    <Button onClick={() => handlePayment(payment.id)}>Mark as Paid</Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
