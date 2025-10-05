import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { 
  Settings, 
  Users, 
  TrendingUp, 
  AlertTriangle, 
  FileBarChart,
  UserPlus,
  Calendar,
  RefreshCw,
  Search,
  X,
  Download,
  Paperclip,
  CheckCircle,
  Lock,
  MessageSquare
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import GrievyAssistant from "@/components/GrievyAssistant";

const AdminDashboard = () => {
  const [complaints, setComplaints] = useState<any[]>([]);
  const [staffList, setStaffList] = useState<any[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    inProgress: 0,
    escalated: 0,
    resolved: 0,
    overdue: 0,
    categories: {} as Record<string, number>
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isAssigning, setIsAssigning] = useState<string | null>(null);
  const [isEscalating, setIsEscalating] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [filteredComplaints, setFilteredComplaints] = useState<any[]>([]);

  const { toast } = useToast();

  // Fetch data from backend
  const fetchData = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      window.location.href = "/admin-login";
      return;
    }

    try {
      setIsLoading(true);
      
      // Fetch complaints, stats, and staff in parallel
      const [complaintsRes, statsRes, staffRes] = await Promise.all([
        fetch("http://localhost:3001/api/admin/complaints", {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch("http://localhost:3001/api/admin/complaints/stats", {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch("http://localhost:3001/api/admin/staff", {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      const [complaintsData, statsData, staffData] = await Promise.all([
        complaintsRes.json(),
        statsRes.json(),
        staffRes.json()
      ]);

      if (complaintsData.success) {
        setComplaints(complaintsData.complaints);
      }
      
      if (statsData.success) {
        setStats(statsData.stats);
      }
      
      if (staffData.success) {
        setStaffList(staffData.staff);
      }

    } catch (error) {
      console.error("Error fetching data:", error);
      toast({
        title: "Error",
        description: "Failed to load dashboard data",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filter complaints based on search term and status
  useEffect(() => {
    let filtered = complaints;

    // Apply status filter
    if (statusFilter !== "all") {
      if (statusFilter === "exclude-resolved-inprogress") {
        filtered = filtered.filter(complaint => 
          complaint.status !== "Resolved" && complaint.status !== "In Progress"
        );
      } else {
        filtered = filtered.filter(complaint => complaint.status === statusFilter);
      }
    }

    // Apply search filter
    if (searchTerm.trim() !== "") {
      filtered = filtered.filter(complaint => 
        complaint._id.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredComplaints(filtered);
  }, [complaints, searchTerm, statusFilter]);

  const assignComplaint = async (complaintId: string, staffId: string) => {
    const token = localStorage.getItem("token");
    if (!token) return;

    setIsAssigning(complaintId);
    
    try {
      const response = await fetch(`http://localhost:3001/api/admin/complaints/${complaintId}/assign`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ staffId })
      });

      const data = await response.json();
      
      if (data.success) {
        toast({
          title: "Complaint Assigned! 👥",
          description: data.message,
        });
        // Refresh data to get updated assignments
        fetchData();
      } else {
        throw new Error(data.message || "Failed to assign complaint");
      }
    } catch (error: any) {
      console.error("Error assigning complaint:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to assign complaint",
        variant: "destructive"
      });
    } finally {
      setIsAssigning(null);
    }
  };

  const escalateComplaint = async (complaintId: string) => {
    const token = localStorage.getItem("token");
    if (!token) return;

    setIsEscalating(complaintId);
    
    try {
      const response = await fetch(`http://localhost:3001/api/admin/complaints/${complaintId}/escalate`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const data = await response.json();
      
      if (data.success) {
        toast({
          title: "Complaint Escalated! ⚠️",
          description: data.message,
        });
        // Refresh data to get updated status
        fetchData();
      } else {
        throw new Error(data.message || "Failed to escalate complaint");
      }
    } catch (error: any) {
      console.error("Error escalating complaint:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to escalate complaint",
        variant: "destructive"
      });
    } finally {
      setIsEscalating(null);
    }
  };

  const updateComplaintStatus = async (complaintId: string, newStatus: string) => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const response = await fetch(`http://localhost:3001/api/admin/complaints/${complaintId}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      const data = await response.json();
      
      if (data.success) {
        toast({
          title: "Status Updated! ✅",
          description: data.message,
        });
        // Refresh data to get updated status
        fetchData();
      } else {
        throw new Error(data.message || "Failed to update status");
      }
    } catch (error: any) {
      console.error("Error updating status:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to update status",
        variant: "destructive"
      });
    }
  };

  const updateComplaintPriority = async (complaintId: string, newPriority: string) => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const response = await fetch(`http://localhost:3001/api/admin/complaints/${complaintId}/priority`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ priority: newPriority })
      });

      const data = await response.json();
      
      if (data.success) {
        toast({
          title: "Priority Updated! 🔄",
          description: data.message,
        });
        // Refresh data to get updated priority
        fetchData();
      } else {
        throw new Error(data.message || "Failed to update priority");
      }
    } catch (error: any) {
      console.error("Error updating priority:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to update priority",
        variant: "destructive"
      });
    }
  };

  const downloadAttachment = async (filename: string) => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const response = await fetch(`http://localhost:3001/api/download/${filename}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to download file');
      }

      // Create blob from response
      const blob = await response.blob();
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Download Started! 📥",
        description: `Downloading ${filename}`,
      });
    } catch (error: any) {
      console.error("Error downloading file:", error);
      toast({
        title: "Download Failed",
        description: error.message || "Failed to download file",
        variant: "destructive"
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Submitted": return "bg-muted text-muted-foreground";
      case "Under Review": return "bg-warning text-warning-foreground";
      case "In Progress": return "bg-info text-info-foreground";
      case "Resolved": return "bg-success text-success-foreground";
      case "Escalated": return "bg-destructive text-destructive-foreground";
      case "Closed": return "bg-muted text-muted-foreground";
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-purple-600" />
          <p className="text-lg font-medium">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-purple-50">
      <div className="bg-gradient-to-r from-purple-600 to-purple-700 text-white p-6">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
            <p className="text-purple-100">Manage complaints, staff allocation, and system oversight</p>
          </div>
          <Button 
            variant="secondary" 
            onClick={fetchData}
            disabled={isLoading}
            className="bg-purple-100 text-purple-700 border-purple-200 hover:bg-purple-200 hover:text-purple-800 shadow-sm"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
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

        {/* Search Bar */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search complaints by ID (e.g., 68e0f3d772d3b713aa9cda29)..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-10"
                />
                {searchTerm && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSearchTerm("")}
                    className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <div className="min-w-[200px]">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Complaints</SelectItem>
                    <SelectItem value="exclude-resolved-inprogress">Exclude Resolved & In Progress</SelectItem>
                    <SelectItem value="Submitted">Submitted</SelectItem>
                    <SelectItem value="Under Review">Under Review</SelectItem>
                    <SelectItem value="In Progress">In Progress</SelectItem>
                    <SelectItem value="Resolved">Resolved</SelectItem>
                    <SelectItem value="Escalated">Escalated</SelectItem>
                    <SelectItem value="Closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="text-sm text-muted-foreground">
                {searchTerm || statusFilter !== "all" ? (
                  <span>
                    Found {filteredComplaints.length} complaint{filteredComplaints.length !== 1 ? 's' : ''}
                    {searchTerm && ` matching "${searchTerm}"`}
                    {statusFilter !== "all" && (
                      <span>
                        {searchTerm ? ' and ' : ' '}
                        {statusFilter === "exclude-resolved-inprogress" ? 'excluding resolved & in progress' : `with status "${statusFilter}"`}
                      </span>
                    )}
                  </span>
                ) : (
                  <span>Showing all {complaints.length} complaints</span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="allocation" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="allocation" className="flex items-center gap-2">
              <UserPlus className="h-4 w-4" />
              Complaint Allocation
            </TabsTrigger>
            <TabsTrigger value="escalation" className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Escalation Management
            </TabsTrigger>
            <TabsTrigger value="resolved" className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Resolved Complaints
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

              {filteredComplaints.filter(complaint => complaint.status !== "Resolved").map((complaint) => (
                <Card key={complaint._id} className={`hover:shadow-lg transition-shadow ${complaint.status === "Resolved" ? 'border-gray-300 bg-gray-50/30' : ''}`}>
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className={`text-lg font-semibold ${complaint.status === "Resolved" ? 'text-gray-600' : ''}`}>{complaint.title}</h3>
                          {complaint.status === "Resolved" && (
                            <Badge className="bg-gray-100 text-gray-600 border-gray-200">Locked</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          ID: {complaint._id} • Citizen: {complaint.citizen}
                        </p>
                      </div>
                      <div className="flex gap-2 ml-4">
                        <Badge className={getStatusColor(complaint.status)}>{complaint.status}</Badge>
                        <Badge className={getPriorityColor(complaint.priority)}>{complaint.priority}</Badge>
                      </div>
                    </div>

                    {/* Attachments Section */}
                    {complaint.attachments && complaint.attachments.length > 0 && (
                      <div className="mb-4 p-3 bg-muted/50 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <Paperclip className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-medium">Attachments ({complaint.attachments.length})</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {complaint.attachments.map((attachment: any, index: number) => {
                            // Extract filename from path (remove 'uploads/' prefix)
                            const actualFilename = attachment.path ? attachment.path.replace('uploads/', '') : attachment.filename;
                            return (
                              <Button
                                key={index}
                                variant="outline"
                                size="sm"
                                onClick={() => downloadAttachment(actualFilename)}
                                className="flex items-center gap-2"
                              >
                                <Download className="h-3 w-3" />
                                {attachment.filename}
                              </Button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                      <div>
                        <label className="text-sm font-medium">Assigned To</label>
                        <p className="text-sm text-muted-foreground">
                          {complaint.assignedTo?.username || "Unassigned"}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium">Assign to Staff</label>
                        <Select 
                          onValueChange={(staffId) => assignComplaint(complaint._id, staffId)}
                          disabled={isAssigning === complaint._id || complaint.status === "Resolved"}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder={complaint.status === "Resolved" ? "Complaint is locked" : "Select staff member"} />
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
                        {complaint.daysPending > 5 && complaint.status !== "Resolved" && (
                          <Button 
                            variant="destructive"
                            onClick={() => escalateComplaint(complaint._id)}
                            className="w-full"
                            disabled={isEscalating === complaint._id}
                          >
                            {isEscalating === complaint._id ? "Escalating..." : `Escalate (${complaint.daysPending} days)`}
                          </Button>
                        )}
                        {complaint.status === "Resolved" && (
                          <div className="w-full p-3 text-center text-sm text-gray-500 bg-gray-100 rounded-md">
                            Complaint is locked - no actions available
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex justify-between items-center text-sm text-muted-foreground mt-4 pt-4 border-t">
                      <div className="flex flex-col gap-1">
                        <span>Submitted: {new Date(complaint.createdAt).toLocaleDateString()}</span>
                        {complaint.dueDate && (
                          <span className={complaint.isOverdue ? "text-red-600 font-medium" : "text-blue-600"}>
                            Due: {new Date(complaint.dueDate).toLocaleDateString()}
                            {complaint.daysUntilDue !== null && (
                              <span className="ml-2">
                                ({complaint.daysUntilDue > 0 ? `${complaint.daysUntilDue} days left` : 
                                  complaint.daysUntilDue === 0 ? 'Due today' : 
                                  `${Math.abs(complaint.daysUntilDue)} days overdue`})
                              </span>
                            )}
                          </span>
                        )}
                      </div>
                      <div className="flex flex-col gap-1 text-right">
                        <span>Category: {complaint.category}</span>
                        {complaint.isOverdue && (
                          <Badge variant="destructive" className="text-xs">
                            OVERDUE
                          </Badge>
                        )}
                      </div>
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

              {filteredComplaints.filter(c => (c.status === "Escalated" || c.daysPending > 5) && c.status !== "Resolved").map((complaint) => (
                <Card key={complaint._id} className="border-destructive/20 bg-destructive/5">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold mb-1">{complaint.title}</h3>
                        <p className="text-sm text-muted-foreground mb-2">
                          ID: {complaint._id} • Days Pending: {complaint.daysPending}
                        </p>
                        <p className="text-sm text-muted-foreground mb-2">
                          Citizen: {complaint.citizen} • Category: {complaint.category}
                        </p>
                        <p className="text-sm text-muted-foreground mb-1">
                          Currently Assigned: {complaint.assignedTo?.username || "Unassigned"}
                        </p>
                        {complaint.dueDate && (
                          <p className={`text-sm ${complaint.isOverdue ? "text-red-600 font-medium" : "text-blue-600"}`}>
                            Due: {new Date(complaint.dueDate).toLocaleDateString()}
                            {complaint.daysUntilDue !== null && (
                              <span className="ml-2">
                                ({complaint.daysUntilDue > 0 ? `${complaint.daysUntilDue} days left` : 
                                  complaint.daysUntilDue === 0 ? 'Due today' : 
                                  `${Math.abs(complaint.daysUntilDue)} days overdue`})
                              </span>
                            )}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2 ml-4">
                        <Badge className={getStatusColor(complaint.status)}>{complaint.status}</Badge>
                        <Badge className={getPriorityColor(complaint.priority)}>{complaint.priority}</Badge>
                      </div>
                    </div>

                    {/* Attachments Section */}
                    {complaint.attachments && complaint.attachments.length > 0 && (
                      <div className="mb-4 p-3 bg-muted/50 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <Paperclip className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-medium">Attachments ({complaint.attachments.length})</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {complaint.attachments.map((attachment: any, index: number) => {
                            // Extract filename from path (remove 'uploads/' prefix)
                            const actualFilename = attachment.path ? attachment.path.replace('uploads/', '') : attachment.filename;
                            return (
                              <Button
                                key={index}
                                variant="outline"
                                size="sm"
                                onClick={() => downloadAttachment(actualFilename)}
                                className="flex items-center gap-2"
                              >
                                <Download className="h-3 w-3" />
                                {attachment.filename}
                              </Button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="text-sm font-medium mb-2 block">Reassign to Staff</label>
                        <Select 
                          onValueChange={(staffId) => assignComplaint(complaint._id, staffId)}
                          disabled={isAssigning === complaint._id || complaint.status === "Resolved"}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder={complaint.status === "Resolved" ? "Complaint is locked" : "Select new staff member"} />
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
                        <label className="text-sm font-medium mb-2 block">Priority Level</label>
                        <Select 
                          value={complaint.priority}
                          onValueChange={(priority) => updateComplaintPriority(complaint._id, priority)}
                          disabled={complaint.status === "Resolved"}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Low">Low</SelectItem>
                            <SelectItem value="Medium">Medium</SelectItem>
                            <SelectItem value="High">High</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <Button 
                        variant="outline"
                        onClick={() => updateComplaintStatus(complaint._id, "In Progress")}
                        disabled={complaint.status === "Resolved"}
                      >
                        Mark as In Progress
                      </Button>
                      <Button 
                        variant="outline"
                        onClick={() => updateComplaintStatus(complaint._id, "Resolved")}
                        disabled={complaint.status === "Resolved"}
                      >
                        Mark as Resolved
                      </Button>
                      <Button 
                        variant="destructive"
                        onClick={() => updateComplaintStatus(complaint._id, "Closed")}
                        disabled={complaint.status === "Resolved"}
                      >
                        Close Complaint
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {filteredComplaints.filter(c => (c.status === "Escalated" || c.daysPending > 5) && c.status !== "Resolved").length === 0 && (
                <Card>
                  <CardContent className="p-8 text-center">
                    <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No escalated complaints at the moment.</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Resolved Complaints Tab */}
          <TabsContent value="resolved">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-semibold">Resolved Complaints</h2>
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  {filteredComplaints.filter(c => c.status === "Resolved").length} Resolved
                </Badge>
              </div>

              {filteredComplaints.filter(complaint => complaint.status === "Resolved").length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <CheckCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Resolved Complaints</h3>
                    <p className="text-muted-foreground">
                      No complaints have been resolved and locked by staff yet.
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Resolved complaints will appear here once staff members complete and lock them.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                filteredComplaints
                  .filter(complaint => complaint.status === "Resolved")
                  .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                  .map((complaint) => (
                    <Card key={complaint._id} className="hover:shadow-lg transition-shadow border-green-200 bg-green-50/30">
                      <CardContent className="p-6">
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="text-lg font-semibold text-green-800">{complaint.title}</h3>
                              <Badge className="bg-green-100 text-green-800 border-green-200">Resolved</Badge>
                              <Badge className="bg-gray-100 text-gray-600 border-gray-200">Locked</Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">
                              ID: {complaint._id} • Citizen: {complaint.citizen}
                            </p>
                            <p className="text-sm text-muted-foreground mb-2">
                              Assigned to: {complaint.assignedTo?.username || "Unknown"} • Category: {complaint.category}
                            </p>
                          </div>
                          <div className="flex gap-2 ml-4">
                            <Badge className={getPriorityColor(complaint.priority)}>{complaint.priority}</Badge>
                          </div>
                        </div>

                        {/* Attachments Section */}
                        {complaint.attachments && complaint.attachments.length > 0 && (
                          <div className="mb-4 p-3 bg-muted/50 rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                              <Paperclip className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm font-medium">Attachments ({complaint.attachments.length})</span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {complaint.attachments.map((attachment: any, index: number) => {
                                const actualFilename = attachment.path ? attachment.path.replace('uploads/', '') : attachment.filename;
                                return (
                                  <Button
                                    key={index}
                                    variant="outline"
                                    size="sm"
                                    onClick={() => downloadAttachment(actualFilename)}
                                    className="flex items-center gap-2"
                                  >
                                    <Download className="h-3 w-3" />
                                    {attachment.filename}
                                  </Button>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* Comments Section */}
                        {complaint.comments && complaint.comments.length > 0 && (
                          <div className="bg-green-50/50 rounded-lg p-4 mb-4">
                            <h4 className="font-semibold text-sm mb-2 flex items-center gap-2 text-green-800">
                              <MessageSquare className="h-4 w-4" />
                              Resolution Comments
                            </h4>
                            <div className="space-y-2">
                              {complaint.comments.map((comment: any, index: number) => (
                                <div key={index} className="text-sm">
                                  <span className="font-medium">{comment.author} ({comment.authorType}):</span> {comment.comment}
                                  <div className="text-xs text-muted-foreground mt-1">
                                    {new Date(comment.createdAt).toLocaleDateString()}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Lock Status Message */}
                        <div className="mt-4 pt-4 border-t border-green-200">
                          <div className="flex items-center justify-center text-sm text-gray-600">
                            <Lock className="h-4 w-4 mr-2" />
                            <span>This complaint has been resolved and locked by staff - no modifications allowed</span>
                          </div>
                        </div>

                        <div className="flex justify-between items-center text-sm text-muted-foreground mt-4 pt-4 border-t border-green-200">
                          <div className="flex flex-col gap-1">
                            <span>Submitted: {new Date(complaint.createdAt).toLocaleDateString()}</span>
                            <span className="text-green-600 font-medium">
                              Resolved: {complaint.resolvedAt ? new Date(complaint.resolvedAt).toLocaleDateString() : 'Recently'}
                            </span>
                          </div>
                          <div className="flex flex-col gap-1 text-right">
                            <span>Category: {complaint.category}</span>
                            <span className="text-green-600 font-medium">Status: Resolved & Locked</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
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
                    {Object.entries(stats.categories).map(([category, count]) => (
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