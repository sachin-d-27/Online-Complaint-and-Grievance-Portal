import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ClipboardList, Clock, CheckCircle, MessageSquare, Filter, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import GrievyAssistant from "@/components/GrievyAssistant";

const StaffDashboard = () => {
  const [assignedComplaints, setAssignedComplaints] = useState([
    {
      id: "C001",
      title: "Poor Road Conditions",
      category: "Infrastructure", 
      status: "In Progress",
      priority: "High",
      assignedDate: "2024-01-15",
      citizen: "John Doe",
      description: "Road has multiple potholes causing damage to vehicles",
      updates: [
        { date: "2024-01-16", message: "Site inspection scheduled for tomorrow", author: "Staff A" }
      ]
    },
    {
      id: "C003",
      title: "Street Light Not Working",
      category: "Infrastructure",
      status: "Under Review", 
      priority: "Medium",
      assignedDate: "2024-01-14",
      citizen: "Jane Smith",
      description: "Street light has been non-functional for 3 weeks",
      updates: []
    },
    {
      id: "C005",
      title: "Garbage Collection Delay",
      category: "Sanitation",
      status: "In Progress",
      priority: "High",
      assignedDate: "2024-01-12",
      citizen: "Anonymous",
      description: "Garbage not collected for over a week in residential area",
      updates: [
        { date: "2024-01-13", message: "Contacted sanitation department", author: "Staff A" },
        { date: "2024-01-14", message: "Additional truck scheduled for tomorrow", author: "Staff A" }
      ]
    }
  ]);

  const [selectedComplaint, setSelectedComplaint] = useState<string | null>(null);
  const [statusUpdate, setStatusUpdate] = useState("");
  const [newComment, setNewComment] = useState("");
  const { toast } = useToast();

  const updateComplaintStatus = (complaintId: string, newStatus: string) => {
    setAssignedComplaints(prev => prev.map(complaint => 
      complaint.id === complaintId 
        ? { ...complaint, status: newStatus }
        : complaint
    ));
    
    toast({
      title: "Status Updated! ✅",
      description: `Complaint ${complaintId} status changed to ${newStatus}`,
    });
  };

  const addComment = (complaintId: string) => {
    if (!newComment.trim()) return;
    
    setAssignedComplaints(prev => prev.map(complaint => 
      complaint.id === complaintId 
        ? { 
            ...complaint, 
            updates: [...complaint.updates, {
              date: new Date().toISOString().split('T')[0],
              message: newComment,
              author: "Staff A"
            }]
          }
        : complaint
    ));
    
    setNewComment("");
    toast({
      title: "Comment Added! 💬",
      description: "Update has been added to the complaint",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Under Review": return "bg-warning text-warning-foreground";
      case "In Progress": return "bg-info text-info-foreground";
      case "Resolved": return "bg-success text-success-foreground";
      case "Escalated": return "bg-destructive text-destructive-foreground";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "High": return "bg-destructive text-destructive-foreground";
      case "Medium": return "bg-warning text-warning-foreground"; 
      case "Low": return "bg-success text-success-foreground";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const stats = {
    total: assignedComplaints.length,
    inProgress: assignedComplaints.filter(c => c.status === "In Progress").length,
    pending: assignedComplaints.filter(c => c.status === "Under Review").length,
    resolved: assignedComplaints.filter(c => c.status === "Resolved").length
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-50">
      <div className="bg-gradient-to-r from-green-600 to-green-700 text-white p-6">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold mb-2">Staff Dashboard</h1>
          <p className="text-green-100">Manage and resolve assigned complaints efficiently</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-foreground">{stats.total}</div>
              <div className="text-sm text-muted-foreground">Total Assigned</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-info">{stats.inProgress}</div>
              <div className="text-sm text-muted-foreground">In Progress</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-warning">{stats.pending}</div>
              <div className="text-sm text-muted-foreground">Under Review</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-success">{stats.resolved}</div>
              <div className="text-sm text-muted-foreground">Resolved</div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="assigned" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="assigned" className="flex items-center gap-2">
              <ClipboardList className="h-4 w-4" />
              Assigned Complaints
            </TabsTrigger>
            <TabsTrigger value="pending" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Pending Review
            </TabsTrigger>
          </TabsList>

          {/* Assigned Complaints Tab */}
          <TabsContent value="assigned">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-semibold">My Assigned Complaints</h2>
                <Button variant="outline" size="sm" className="flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  Filter
                </Button>
              </div>

              {assignedComplaints.map((complaint) => (
                <Card key={complaint.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold mb-1">{complaint.title}</h3>
                        <p className="text-sm text-muted-foreground mb-2">
                          ID: {complaint.id} • Citizen: {complaint.citizen}
                        </p>
                        <p className="text-muted-foreground mb-4">{complaint.description}</p>
                      </div>
                      <div className="flex gap-2 ml-4">
                        <Badge className={getStatusColor(complaint.status)}>{complaint.status}</Badge>
                        <Badge className={getPriorityColor(complaint.priority)}>{complaint.priority}</Badge>
                      </div>
                    </div>

                    {/* Updates Section */}
                    {complaint.updates.length > 0 && (
                      <div className="bg-muted/50 rounded-lg p-4 mb-4">
                        <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                          <MessageSquare className="h-4 w-4" />
                          Recent Updates
                        </h4>
                        <div className="space-y-2">
                          {complaint.updates.slice(-2).map((update, index) => (
                            <div key={index} className="text-sm">
                              <span className="font-medium">{update.date}:</span> {update.message}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex gap-4 items-end">
                      <div className="flex-1">
                        <Label htmlFor={`status-${complaint.id}`}>Update Status</Label>
                        <Select 
                          defaultValue={complaint.status}
                          onValueChange={(value) => updateComplaintStatus(complaint.id, value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Under Review">Under Review</SelectItem>
                            <SelectItem value="In Progress">In Progress</SelectItem>
                            <SelectItem value="Resolved">Resolved</SelectItem>
                            <SelectItem value="Escalated">Escalated</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex-2">
                        <Label htmlFor={`comment-${complaint.id}`}>Add Comment</Label>
                        <div className="flex gap-2">
                          <Textarea
                            id={`comment-${complaint.id}`}
                            placeholder="Add update or comment..."
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            rows={2}
                            className="flex-1"
                          />
                          <Button onClick={() => addComment(complaint.id)}>
                            Add
                          </Button>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-between items-center text-sm text-muted-foreground mt-4 pt-4 border-t">
                      <span>Assigned: {complaint.assignedDate}</span>
                      <span>Category: {complaint.category}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Pending Review Tab */}
          <TabsContent value="pending">
            <Card>
              <CardHeader>
                <CardTitle>Complaints Pending Review</CardTitle>
                <CardDescription>
                  These complaints are waiting for initial review and assignment
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No complaints pending review at the moment.</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <GrievyAssistant />
    </div>
  );
};

export default StaffDashboard;