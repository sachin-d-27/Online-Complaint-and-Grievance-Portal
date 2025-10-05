import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ClipboardList, Clock, CheckCircle, MessageSquare, Filter, User, RefreshCw, Download, Paperclip, Pin, PinOff, Search, X, AlertTriangle, Lock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import GrievyAssistant from "@/components/GrievyAssistant";

const StaffDashboard = () => {
  const [assignedComplaints, setAssignedComplaints] = useState<any[]>([]);
  const [pinnedComplaints, setPinnedComplaints] = useState<Set<string>>(new Set());
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredComplaints, setFilteredComplaints] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState<string | null>(null);
  const [isAddingComment, setIsAddingComment] = useState<string | null>(null);
  const [newComment, setNewComment] = useState("");
  const [isLockingComplaint, setIsLockingComplaint] = useState<string | null>(null);
  const [lockedComplaints, setLockedComplaints] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  // Fetch assigned complaints from backend
  const fetchAssignedComplaints = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      window.location.href = "/staff-login";
      return;
    }

    try {
      setIsLoading(true);
      const response = await fetch("http://localhost:3001/api/staff/complaints", {
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = await response.json();
      
      if (data.success) {
        setAssignedComplaints(data.complaints);
      } else {
        throw new Error(data.message || "Failed to fetch complaints");
      }
    } catch (error: any) {
      console.error("Error fetching complaints:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to load complaints",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignedComplaints();
  }, []);

  // Auto-lock admin-resolved complaints
  useEffect(() => {
    const adminResolvedIds = assignedComplaints
      .filter(complaint => complaint.adminResolved)
      .map(complaint => complaint._id);
    
    if (adminResolvedIds.length > 0) {
      setLockedComplaints(prev => {
        const newSet = new Set(prev);
        adminResolvedIds.forEach(id => newSet.add(id));
        return newSet;
      });
    }
  }, [assignedComplaints]);

  // Helper function to check if complaint is locked
  const isComplaintLocked = (complaint: any) => {
    return complaint.locked || complaint.adminResolved || lockedComplaints.has(complaint._id);
  };

  // Filter complaints based on search term and status
  useEffect(() => {
    let filtered = assignedComplaints;

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(complaint => complaint.status === statusFilter);
    }

    // Apply search filter
    if (searchTerm.trim() !== "") {
      filtered = filtered.filter(complaint => 
        complaint._id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        complaint.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        complaint.citizen.toLowerCase().includes(searchTerm.toLowerCase()) ||
        complaint.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredComplaints(filtered);
  }, [assignedComplaints, searchTerm, statusFilter]);

  const updateComplaintStatus = async (complaintId: string, newStatus: string) => {
    const token = localStorage.getItem("token");
    if (!token) return;

    setIsUpdatingStatus(complaintId);
    
    try {
      const response = await fetch(`http://localhost:3001/api/staff/complaints/${complaintId}/status`, {
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
        fetchAssignedComplaints();
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
    } finally {
      setIsUpdatingStatus(null);
    }
  };

  const addComment = async (complaintId: string) => {
    if (!newComment.trim()) return;
    
    const token = localStorage.getItem("token");
    if (!token) return;

    setIsAddingComment(complaintId);
    
    try {
      const response = await fetch(`http://localhost:3001/api/staff/complaints/${complaintId}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ comment: newComment.trim() })
      });

      const data = await response.json();
      
      if (data.success) {
        toast({
          title: "Comment Added! 💬",
          description: data.message,
        });
        setNewComment("");
        // Refresh data to get updated comments
        fetchAssignedComplaints();
      } else {
        throw new Error(data.message || "Failed to add comment");
      }
    } catch (error: any) {
      console.error("Error adding comment:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to add comment",
        variant: "destructive"
      });
    } finally {
      setIsAddingComment(null);
    }
  };

  const lockComplaint = async (complaintId: string) => {
    const token = localStorage.getItem("token");
    if (!token) return;

    setIsLockingComplaint(complaintId);
    
    try {
      const response = await fetch(`http://localhost:3001/api/staff/complaints/${complaintId}/lock`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ locked: true })
      });

      const data = await response.json();
      
      if (data.success) {
        toast({
          title: "Complaint Locked! 🔒",
          description: data.message,
        });
        
        // Refresh data to get updated information
        fetchAssignedComplaints();
      } else {
        throw new Error(data.message || "Failed to lock complaint");
      }
    } catch (error: any) {
      console.error("Error locking complaint:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to lock complaint",
        variant: "destructive"
      });
    } finally {
      setIsLockingComplaint(null);
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

  // Toggle pin complaint functionality
  const togglePinComplaint = (complaintId: string) => {
    setPinnedComplaints(prev => {
      const newSet = new Set(prev);
      if (newSet.has(complaintId)) {
        newSet.delete(complaintId);
        toast({
          title: "Unpinned",
          description: "Complaint unpinned from top",
        });
      } else {
        newSet.add(complaintId);
        toast({
          title: "Pinned",
          description: "Complaint pinned to top",
        });
      }
      return newSet;
    });
  };

  // Sort complaints with pinned ones first, excluding locked complaints
  const sortedComplaints = filteredComplaints
    .filter(complaint => !isComplaintLocked(complaint)) // Exclude locked complaints
    .filter(complaint => complaint.status !== "Escalated") // Exclude escalated complaints
    .sort((a, b) => {
      const aPinned = pinnedComplaints.has(a._id);
      const bPinned = pinnedComplaints.has(b._id);

      if (aPinned && !bPinned) return -1;
      if (!aPinned && bPinned) return 1;

      // If both pinned or both unpinned, sort by date (newest first)
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

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

  const stats = {
    total: assignedComplaints.length, // Show total assigned as history (including locked)
    inProgress: assignedComplaints.filter(c => c.status === "In Progress" && !isComplaintLocked(c)).length,
    pending: assignedComplaints.filter(c => (c.status === "Under Review" || c.status === "Submitted") && !isComplaintLocked(c)).length,
    resolved: assignedComplaints.filter(c => c.status === "Resolved").length // Show all resolved as history (including locked)
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-green-600" />
          <p className="text-lg font-medium">Loading your assigned complaints...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-50">
      <div className="bg-gradient-to-r from-green-600 to-green-700 text-white p-6">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold mb-2">Staff Dashboard</h1>
            <p className="text-green-100">Manage and resolve assigned complaints efficiently</p>
          </div>
          <Button 
            variant="secondary" 
            onClick={fetchAssignedComplaints}
            disabled={isLoading}
            className="bg-green-100 text-green-700 border-green-200 hover:bg-green-200 hover:text-green-800 shadow-sm"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
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

        {/* Search Bar */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search complaints by ID, title, citizen, or category..."
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
                    <SelectItem value="Under Review">Under Review</SelectItem>
                    <SelectItem value="In Progress">In Progress</SelectItem>
                    <SelectItem value="Resolved">Resolved</SelectItem>
                    <SelectItem value="Escalated">Escalated</SelectItem>
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
                        with status "{statusFilter}"
                      </span>
                    )}
                  </span>
                ) : (
                  <span>Showing all {assignedComplaints.length} complaints</span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="assigned" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="assigned" className="flex items-center gap-2">
              <ClipboardList className="h-4 w-4" />
              Assigned Complaints
            </TabsTrigger>
            <TabsTrigger value="resolved" className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Resolved Complaints
            </TabsTrigger>
            <TabsTrigger value="escalated" className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Escalated Complaints
            </TabsTrigger>
          </TabsList>

          {/* Assigned Complaints Tab */}
          <TabsContent value="assigned">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-semibold">My Assigned Complaints</h2>
                <Badge variant="outline">{sortedComplaints.length} Complaints</Badge>
              </div>

              {sortedComplaints.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <ClipboardList className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">
                      {searchTerm || statusFilter !== "all" ? "No Matching Complaints" : "No Assigned Complaints"}
                    </h3>
                    <p className="text-muted-foreground">
                      {searchTerm || statusFilter !== "all" 
                        ? "No complaints match your current search and filter criteria."
                        : "You don't have any complaints assigned to you at the moment."
                      }
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">
                      {searchTerm || statusFilter !== "all" 
                        ? "Try adjusting your search terms or filters."
                        : "Check back later or contact your admin for new assignments."
                      }
                    </p>
                  </CardContent>
                </Card>
              ) : (
                sortedComplaints.map((complaint) => (
                <Card key={complaint._id} className={`hover:shadow-lg transition-shadow ${pinnedComplaints.has(complaint._id) ? 'border-green-200 bg-green-50/30' : ''}`}>
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-lg font-semibold">{complaint.title}</h3>
                          {pinnedComplaints.has(complaint._id) && (
                            <Pin className="h-4 w-4 text-green-600" />
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          ID: {complaint._id} • Citizen: {complaint.citizen}
                        </p>
                        <p className="text-muted-foreground mb-4">{complaint.description}</p>
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

                    {/* Comments Section */}
                    {complaint.comments && complaint.comments.length > 0 && (
                      <div className="bg-muted/50 rounded-lg p-4 mb-4">
                        <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                          <MessageSquare className="h-4 w-4" />
                          Recent Comments
                        </h4>
                        <div className="space-y-2">
                          {complaint.comments.slice(-2).map((comment: any, index: number) => (
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

                    <div className="flex gap-4 items-end">
                      <div className="flex-1">
                        <Label htmlFor={`status-${complaint._id}`}>Update Status</Label>
                        <Select 
                          value={complaint.status}
                          onValueChange={(value) => updateComplaintStatus(complaint._id, value)}
                          disabled={isUpdatingStatus === complaint._id}
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
                        <Label htmlFor={`comment-${complaint._id}`}>Add Comment</Label>
                        <div className="flex gap-2">
                          <Textarea
                            id={`comment-${complaint._id}`}
                            placeholder="Add update or comment..."
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            rows={2}
                            className="flex-1"
                          />
                          <Button 
                            onClick={() => addComment(complaint._id)}
                            disabled={isAddingComment === complaint._id || !newComment.trim()}
                          >
                            {isAddingComment === complaint._id ? "Adding..." : "Add"}
                          </Button>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-between items-center text-sm text-muted-foreground mt-4 pt-4 border-t">
                      <div className="flex flex-col gap-1">
                        <span>Assigned: {new Date(complaint.createdAt).toLocaleDateString()}</span>
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
                        {complaint.daysPending > 0 && (
                          <span className="text-warning">Days Pending: {complaint.daysPending}</span>
                        )}
                        {complaint.isOverdue && (
                          <Badge variant="destructive" className="text-xs">
                            OVERDUE
                          </Badge>
                        )}
                        <div className="flex justify-end mt-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => togglePinComplaint(complaint._id)}
                            className={pinnedComplaints.has(complaint._id) ? "bg-green-50 border-green-200 text-green-700" : ""}
                          >
                            {pinnedComplaints.has(complaint._id) ? (
                              <>
                                <PinOff className="h-4 w-4 mr-2" /> Unpin
                              </>
                            ) : (
                              <>
                                <Pin className="h-4 w-4 mr-2" /> Pin to Top
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                ))
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
                    <h3 className="text-lg font-semibold mb-2">
                      {searchTerm || statusFilter !== "all" ? "No Matching Resolved Complaints" : "No Resolved Complaints"}
                    </h3>
                    <p className="text-muted-foreground">
                      {searchTerm || statusFilter !== "all" 
                        ? "No resolved complaints match your current search and filter criteria."
                        : "You don't have any resolved complaints yet."
                      }
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">
                      {searchTerm || statusFilter !== "all" 
                        ? "Try adjusting your search terms or filters."
                        : "Complaints you mark as resolved will appear here."
                      }
                    </p>
                  </CardContent>
                </Card>
              ) : (
                filteredComplaints
                  .filter(complaint => complaint.status === "Resolved")
                  .sort((a, b) => {
                    const aPinned = pinnedComplaints.has(a._id);
                    const bPinned = pinnedComplaints.has(b._id);
                    
                    if (aPinned && !bPinned) return -1;
                    if (!aPinned && bPinned) return 1;
                    
                    // If both pinned or both unpinned, sort by date (newest first)
                    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
                  })
                  .map((complaint) => (
                  <Card key={complaint._id} className={`hover:shadow-lg transition-shadow ${isComplaintLocked(complaint) ? 'border-gray-300 bg-gray-50/30' : 'border-green-200 bg-green-50/30'}`}>
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className={`text-lg font-semibold ${isComplaintLocked(complaint) ? 'text-gray-600' : 'text-green-800'}`}>{complaint.title}</h3>
                            {pinnedComplaints.has(complaint._id) && (
                              <Pin className="h-4 w-4 text-green-600" />
                            )}
                            <Badge className={isComplaintLocked(complaint) ? "bg-gray-100 text-gray-600 border-gray-200" : "bg-green-100 text-green-800 border-green-200"}>
                              {isComplaintLocked(complaint) ? 'Locked' : 'Resolved'}
                            </Badge>
                            {complaint.adminResolved && (
                              <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                                Admin Resolved
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            ID: {complaint._id} • Citizen: {complaint.citizen}
                          </p>
                          <p className="text-muted-foreground mb-4">{complaint.description}</p>
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

                      {/* Lock & Close Button - Only show for non-locked complaints */}
                      {!isComplaintLocked(complaint) && (
                        <div className="mt-4 pt-4 border-t border-green-200">
                          <div className="flex justify-between items-center">
                            <div className="text-sm text-muted-foreground">
                              <p className="text-xs text-green-600 mb-2">
                                Confirm resolution and lock this complaint
                              </p>
                            </div>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => {
                                if (window.confirm("Are you sure you want to lock this complaint? This action cannot be undone and will mark it as locked.")) {
                                  lockComplaint(complaint._id);
                                }
                              }}
                              disabled={isLockingComplaint === complaint._id}
                              className="bg-red-600 hover:bg-red-700 text-white"
                            >
                              {isLockingComplaint === complaint._id ? (
                                <>
                                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                  Locking...
                                </>
                              ) : (
                                <>
                                  <Lock className="h-4 w-4 mr-2" />
                                  Lock & Close
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                      )}

                      {/* Locked Status Message */}
                      {isComplaintLocked(complaint) && (
                        <div className="mt-4 pt-4 border-t border-gray-200">
                          <div className="flex items-center justify-center text-sm text-gray-600">
                            <Lock className="h-4 w-4 mr-2" />
                            <span>This complaint has been locked and cannot be modified</span>
                          </div>
                        </div>
                      )}

                      <div className={`flex justify-between items-center text-sm text-muted-foreground mt-4 pt-4 border-t ${isComplaintLocked(complaint) ? 'border-gray-200' : 'border-green-200'}`}>
                        <div className="flex flex-col gap-1">
                          <span>Submitted: {new Date(complaint.createdAt).toLocaleDateString()}</span>
                          <span className="text-green-600 font-medium">
                            Resolved: {complaint.resolvedAt ? new Date(complaint.resolvedAt).toLocaleDateString() : 'Recently'}
                          </span>
                          {complaint.adminResolved && complaint.adminResolvedAt && (
                            <span className="text-blue-600 font-medium">
                              Admin Resolved: {new Date(complaint.adminResolvedAt).toLocaleDateString()} at {new Date(complaint.adminResolvedAt).toLocaleTimeString()}
                            </span>
                          )}
                        </div>
                        <div className="flex flex-col gap-1 text-right">
                          <span>Category: {complaint.category}</span>
                          <span className="text-green-600 font-medium">Status: Resolved</span>
                          <div className="flex justify-end mt-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => togglePinComplaint(complaint._id)}
                              className={pinnedComplaints.has(complaint._id) ? "bg-green-50 border-green-200 text-green-700" : ""}
                            >
                              {pinnedComplaints.has(complaint._id) ? (
                                <>
                                  <PinOff className="h-4 w-4 mr-2" /> Unpin
                                </>
                              ) : (
                                <>
                                  <Pin className="h-4 w-4 mr-2" /> Pin to Top
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          {/* Escalated Complaints Tab */}
          <TabsContent value="escalated">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-semibold">Escalated Complaints</h2>
                <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                  {filteredComplaints.filter(c => c.status === "Escalated").length} Escalated
                </Badge>
              </div>

              {filteredComplaints.filter(complaint => complaint.status === "Escalated").length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">
                      {searchTerm || statusFilter !== "all" ? "No Matching Escalated Complaints" : "No Escalated Complaints"}
                    </h3>
                    <p className="text-muted-foreground">
                      {searchTerm || statusFilter !== "all" 
                        ? "Try adjusting your search criteria to find escalated complaints."
                        : "Complaints that have been escalated will appear here."}
                    </p>
                  </CardContent>
                </Card>
              ) : (
                filteredComplaints
                  .filter(complaint => complaint.status === "Escalated")
                  .map((complaint) => (
                    <Card key={complaint._id} className="border-orange-200 bg-orange-50/30">
                      <CardHeader className="pb-3">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <CardTitle className="text-orange-800 text-lg mb-2">
                              {complaint.title}
                            </CardTitle>
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant="outline" className="bg-orange-100 text-orange-700 border-orange-300">
                                Escalated
                              </Badge>
                              <Badge variant="outline" className="bg-orange-100 text-orange-700 border-orange-300">
                                {complaint.priority} Priority
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </CardHeader>

                      <CardContent className="pt-0">
                        <div className="space-y-3">
                          <p className="text-gray-700">{complaint.description}</p>
                          
                          {/* Action Buttons */}
                          <div className="flex gap-2 mt-4">
                            <Button 
                              variant="outline"
                              size="sm"
                              onClick={() => updateComplaintStatus(complaint._id, "In Progress")}
                              className="bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100"
                            >
                              Retrieve Escalation
                            </Button>
                            <Button 
                              variant="outline"
                              size="sm"
                              onClick={() => updateComplaintStatus(complaint._id, "Under Review")}
                              className="bg-yellow-50 text-yellow-700 border-yellow-200 hover:bg-yellow-100"
                            >
                              Back to Review
                            </Button>
                          </div>
                          
                          <div className="flex justify-between items-center text-sm text-muted-foreground mt-4 pt-4 border-t border-orange-200">
                            <div className="flex flex-col gap-1">
                              <span>Submitted: {new Date(complaint.createdAt).toLocaleDateString()}</span>
                              {complaint.lastUpdated && (
                                <span className="text-blue-600 font-medium">
                                  Last Updated: {new Date(complaint.lastUpdated).toLocaleDateString()} at {new Date(complaint.lastUpdated).toLocaleTimeString()}
                                </span>
                              )}
                              <span className="text-orange-600 font-medium">
                                Escalated: {complaint.escalatedAt ? new Date(complaint.escalatedAt).toLocaleDateString() : 'Recently'}
                              </span>
                            </div>
                            <div className="flex flex-col gap-1 text-right">
                              <span>Category: {complaint.category}</span>
                              <span className="text-orange-600 font-medium">Status: Escalated</span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <GrievyAssistant />
    </div>
  );
};

export default StaffDashboard;