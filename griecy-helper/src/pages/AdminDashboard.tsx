import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Settings, 
  Users, 
  TrendingUp, 
  AlertTriangle, 
  FileBarChart,
  UserPlus,
  Calendar
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import GrievyAssistant from "@/components/GrievyAssistant";

const AdminDashboard = () => {
  const [complaints, setComplaints] = useState([
    {
      id: "C001",
      title: "Internet",
      category: "Utilities",
      status: "Unresolved",
      priority: "High",
      citizen: "Sachin",
      assignedTo: null,
      dateSubmitted: "2025-09-29",
      daysPending: 0
    },
    {
      id: "C002",
      title: "OS errors",
      category: "Infrastructure",
      status: "Unresolved",
      priority: "Medium",
      citizen: "Sachin",
      assignedTo: null,
      dateSubmitted: "2025-09-29",
      daysPending: 0
    },
    {
      id: "C003",
      title: "Cafeteria",
      category: "Environment", 
      status: "Unresolved",
      priority: "Low",
      citizen: "Sachin",
      assignedTo: null,
      dateSubmitted: "2025-09-30",
      daysPending: 0
    },
  ]);

  const [staffList] = useState([
    { id: "staff1", name: "Staff A", workload: 0, specialization: "Infrastructure" },
    { id: "staff2", name: "Staff B", workload: 0, specialization: "Utilities" },
    { id: "staff3", name: "Staff C", workload: 0, specialization: "Environment" }
  ]);

  const { toast } = useToast();

  const assignComplaint = (complaintId: string, staffId: string) => {
    const staff = staffList.find(s => s.id === staffId);
    setComplaints(prev => prev.map(complaint => 
      complaint.id === complaintId 
        ? { ...complaint, assignedTo: staff?.name || null, status: "In Progress" }
        : complaint
    ));
    
    toast({
      title: "Complaint Assigned! 👥",
      description: `Complaint ${complaintId} has been assigned to ${staff?.name}`,
    });
  };

  const escalateComplaint = (complaintId: string) => {
    setComplaints(prev => prev.map(complaint => 
      complaint.id === complaintId 
        ? { ...complaint, status: "Escalated" }
        : complaint
    ));
    
    toast({
      title: "Complaint Escalated! ⚠️",
      description: `Complaint ${complaintId} has been escalated for urgent attention`,
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
    total: complaints.length,
    pending: complaints.filter(c => c.status === "Under Review").length,
    inProgress: complaints.filter(c => c.status === "In Progress").length,
    escalated: complaints.filter(c => c.status === "Escalated").length,
    resolved: complaints.filter(c => c.status === "Resolved").length,
    overdue: complaints.filter(c => c.daysPending > 5).length
  };

  const categoryStats = complaints.reduce((acc, complaint) => {
    acc[complaint.category] = (acc[complaint.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-purple-50">
      <div className="bg-gradient-to-r from-purple-600 to-purple-700 text-white p-6">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
          <p className="text-purple-100">Manage complaints, staff allocation, and system oversight</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-6">
        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-foreground">{stats.total}</div>
              <div className="text-xs text-muted-foreground">Total</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-warning">{stats.pending}</div>
              <div className="text-xs text-muted-foreground">Pending</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-info">{stats.inProgress}</div>
              <div className="text-xs text-muted-foreground">In Progress</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-destructive">{stats.escalated}</div>
              <div className="text-xs text-muted-foreground">Escalated</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-success">{stats.resolved}</div>
              <div className="text-xs text-muted-foreground">Resolved</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-destructive">{stats.overdue}</div>
              <div className="text-xs text-muted-foreground">Overdue</div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="allocation" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="allocation" className="flex items-center gap-2">
              <UserPlus className="h-4 w-4" />
              Complaint Allocation
            </TabsTrigger>
            <TabsTrigger value="escalation" className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Escalation Management
            </TabsTrigger>
            <TabsTrigger value="reports" className="flex items-center gap-2">
              <FileBarChart className="h-4 w-4" />
              Reports & Analytics
            </TabsTrigger>
          </TabsList>

          {/* Complaint Allocation Tab */}
          <TabsContent value="allocation">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-semibold">Complaint Allocation</h2>
                <Badge variant="outline">{stats.pending} Unassigned</Badge>
              </div>

              {complaints.map((complaint) => (
                <Card key={complaint.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold mb-1">{complaint.title}</h3>
                        <p className="text-sm text-muted-foreground mb-2">
                          ID: {complaint.id} • Citizen: {complaint.citizen}
                        </p>
                      </div>
                      <div className="flex gap-2 ml-4">
                        <Badge className={getStatusColor(complaint.status)}>{complaint.status}</Badge>
                        <Badge className={getPriorityColor(complaint.priority)}>{complaint.priority}</Badge>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                      <div>
                        <label className="text-sm font-medium">Assigned To</label>
                        <p className="text-sm text-muted-foreground">
                          {complaint.assignedTo || "Unassigned"}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium">Assign to Staff</label>
                        <Select onValueChange={(staffId) => assignComplaint(complaint.id, staffId)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select staff member" />
                          </SelectTrigger>
                          <SelectContent>
                            {staffList.map((staff) => (
                              <SelectItem key={staff.id} value={staff.id}>
                                {staff.name} ({staff.workload} active) - {staff.specialization}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        {complaint.daysPending > 5 && (
                          <Button 
                            variant="destructive"
                            onClick={() => escalateComplaint(complaint.id)}
                            className="w-full"
                          >
                            Escalate ({complaint.daysPending} days)
                          </Button>
                        )}
                      </div>
                    </div>

                    <div className="flex justify-between items-center text-sm text-muted-foreground mt-4 pt-4 border-t">
                      <span>Submitted: {complaint.dateSubmitted}</span>
                      <span>Category: {complaint.category}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Escalation Management Tab */}
          <TabsContent value="escalation">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-semibold">Escalation Management</h2>
                <Badge variant="destructive">{stats.escalated} Escalated</Badge>
              </div>

              {complaints.filter(c => c.status === "Escalated" || c.daysPending > 5).map((complaint) => (
                <Card key={complaint.id} className="border-destructive/20 bg-destructive/5">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-semibold mb-1">{complaint.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          ID: {complaint.id} • Days Pending: {complaint.daysPending}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Badge className={getStatusColor(complaint.status)}>{complaint.status}</Badge>
                        <Badge className={getPriorityColor(complaint.priority)}>{complaint.priority}</Badge>
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <Button variant="outline">Contact Senior Staff</Button>
                      <Button variant="outline">Request External Help</Button>
                      <Button>Mark as High Priority</Button>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {complaints.filter(c => c.status === "Escalated" || c.daysPending > 5).length === 0 && (
                <Card>
                  <CardContent className="p-8 text-center">
                    <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No escalated complaints at the moment.</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Reports & Analytics Tab */}
          <TabsContent value="reports">
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold">Reports & Analytics</h2>
              
              {/* Category Breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Complaints by Category
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {Object.entries(categoryStats).map(([category, count]) => (
                      <div key={category} className="text-center p-4 bg-muted/50 rounded-lg">
                        <div className="text-2xl font-bold">{count}</div>
                        <div className="text-sm text-muted-foreground">{category}</div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Staff Performance */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Staff Workload
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {staffList.map((staff) => (
                      <div key={staff.id} className="flex justify-between items-center p-4 border rounded-lg">
                        <div>
                          <div className="font-semibold">{staff.name}</div>
                          <div className="text-sm text-muted-foreground">Specialization: {staff.specialization}</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold">{staff.workload}</div>
                          <div className="text-xs text-muted-foreground">Active Cases</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Export Options */}
              <Card>
                <CardHeader>
                  <CardTitle>Export Reports</CardTitle>
                  <CardDescription>Generate detailed reports for analysis</CardDescription>
                </CardHeader>
                <CardContent className="flex gap-4">
                  <Button variant="outline">
                    <FileBarChart className="h-4 w-4 mr-2" />
                    Export to PDF
                  </Button>
                  <Button variant="outline">
                    <Calendar className="h-4 w-4 mr-2" />
                    Monthly Report
                  </Button>
                  <Button variant="outline">
                    <TrendingUp className="h-4 w-4 mr-2" />
                    Analytics Dashboard
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <GrievyAssistant />
    </div>
  );
};

export default AdminDashboard;