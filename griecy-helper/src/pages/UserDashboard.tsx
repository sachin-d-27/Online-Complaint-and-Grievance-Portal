import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import GrievyAssistant from "@/components/GrievyAssistant";
import { AlertTriangle, FilePlus2, List, Send, Upload, Pin, PinOff, Search, X } from "lucide-react";

type ComplaintStatus = "Submitted" | "Under Review" | "In Progress" | "Resolved" | "Closed" | "Escalated";
type ComplaintPriority = "Low" | "Medium" | "High";

interface Comment {
  comment: string;
  author: string;
  authorType: 'user' | 'staff' | 'admin';
  createdAt: string;
}

interface ComplaintItem {
  id: string;
  title: string;
  category: string;
  status: ComplaintStatus;
  priority: ComplaintPriority;
  dateSubmitted: string;
  daysPending: number;
  comments?: Comment[];
  resolvedAt?: string;
}

const UserDashboard = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [complaints, setComplaints] = useState<ComplaintItem[]>([]);
  const [pinnedComplaints, setPinnedComplaints] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({
    title: "",
    category: "",
    description: "",
    priority: "Medium" as ComplaintPriority,
    anonymous: false,
  });
  const [files, setFiles] = useState<File[]>([]);

  const stats = useMemo(() => ({
    total: complaints.length,
    pending: complaints.filter(c => c.status === "Under Review").length,
    inProgress: complaints.filter(c => c.status === "In Progress").length,
    resolved: complaints.filter(c => c.status === "Resolved").length,
    escalated: complaints.filter(c => c.status === "Escalated").length
  }), [complaints]);

  // Filter complaints based on search term and status
  const filteredComplaints = useMemo(() => {
    let filtered = complaints;

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(complaint => complaint.status === statusFilter);
    }

    // Apply search filter
    if (searchTerm.trim() !== "") {
      filtered = filtered.filter(complaint => 
        complaint.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        complaint.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        complaint.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return filtered;
  }, [complaints, searchTerm, statusFilter]);

  // Sort complaints with pinned ones first
  const sortedComplaints = useMemo(() => {
    return [...filteredComplaints].sort((a, b) => {
      const aPinned = pinnedComplaints.has(a.id);
      const bPinned = pinnedComplaints.has(b.id);
      
      if (aPinned && !bPinned) return -1;
      if (!aPinned && bPinned) return 1;
      
      // If both pinned or both unpinned, sort by date (newest first)
      return new Date(b.dateSubmitted).getTime() - new Date(a.dateSubmitted).getTime();
    });
  }, [filteredComplaints, pinnedComplaints]);

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

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/user-login");
      return;
    }
    const fetchComplaints = async () => {
      setIsLoading(true);
      try {
        const response = await fetch("http://localhost:3001/api/complaints", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await response.json();
        if (!data.success) {
          throw new Error(data.message || "Failed to load complaints");
        }
        const mapped: ComplaintItem[] = (data.complaints || []).map((c: any) => ({
          id: c._id || c.complaintId || "",
          title: c.title,
          category: c.category,
          status: c.status as ComplaintStatus,
          priority: (c.priority || "Medium") as ComplaintPriority,
          dateSubmitted: c.createdAt ? new Date(c.createdAt).toISOString().slice(0, 10) : "",
          daysPending: c.createdAt ? Math.max(0, Math.floor((Date.now() - new Date(c.createdAt).getTime()) / (1000 * 60 * 60 * 24))) : 0,
          comments: c.comments || [],
          resolvedAt: c.resolvedAt,
        }));
        setComplaints(mapped);
      } catch (error: any) {
        console.error("Load complaints error:", error);
        toast({ title: "Error", description: error.message || "Could not load complaints" });
      } finally {
        setIsLoading(false);
      }
    };
    fetchComplaints();
  }, [toast]);

  const getStatusColor = (status: ComplaintStatus) => {
    switch (status) {
      case "Under Review": return "bg-warning text-warning-foreground";
      case "In Progress": return "bg-info text-info-foreground";
      case "Resolved": return "bg-success text-success-foreground";
      case "Escalated": return "bg-destructive text-destructive-foreground";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const getPriorityColor = (priority: ComplaintPriority) => {
    switch (priority) {
      case "High": return "bg-destructive text-destructive-foreground";
      case "Medium": return "bg-warning text-warning-foreground";
      case "Low": return "bg-success text-success-foreground";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type, checked } = e.target as HTMLInputElement;
    setForm(prev => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  };

  const submitNewComplaint = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/user-login");
      return;
    }
    if (!form.title.trim() || !form.category || !form.description.trim()) {
      toast({ title: "Validation", description: "Please fill in title, category and description." });
      return;
    }
    if (form.title.trim().length < 5 || form.title.trim().length > 200) {
      toast({ title: "Validation", description: "Title must be between 5 and 200 characters." });
      return;
    }
    if (form.description.trim().length < 20 || form.description.trim().length > 2000) {
      toast({ title: "Validation", description: "Description must be between 20 and 2000 characters." });
      return;
    }
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("title", form.title);
      formData.append("category", form.category);
      formData.append("description", form.description);
      formData.append("priority", form.priority);
      formData.append("anonymous", String(form.anonymous));
      files.forEach((file) => formData.append("attachments", file));

      const response = await fetch("http://localhost:3001/api/complaints", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });
      const data = await response.json();
      if (!data.success) {
        if (data.errors && data.errors.length > 0) {
          const errorMessages = data.errors.map((error: any) => error.message).join('\n');
          throw new Error(errorMessages);
        }
        throw new Error(data.message || "Failed to submit complaint");
      }
      const c = data.complaint;
      const newItem: ComplaintItem = {
        id: c._id || c.complaintId || Math.random().toString(36).slice(2),
        title: c.title,
        category: c.category,
        status: c.status as ComplaintStatus,
        priority: (c.priority || "Medium") as ComplaintPriority,
        dateSubmitted: c.createdAt ? new Date(c.createdAt).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
        daysPending: 0,
      };
      setComplaints(prev => [newItem, ...prev]);
      setForm({ title: "", category: "", description: "", priority: "Medium", anonymous: false });
      setFiles([]);
      toast({ title: "Submitted", description: "Complaint submitted successfully." });
    } catch (error: any) {
      console.error("Submit complaint error:", error);
      toast({ title: "Error", description: error.message || "Submission failed" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold mb-2">User Dashboard</h1>
          <p className="text-blue-100">Track and manage your submitted complaints</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full md:w-auto">
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
                <div className="text-2xl font-bold text-success">{stats.resolved}</div>
                <div className="text-xs text-muted-foreground">Resolved</div>
              </CardContent>
            </Card>
          </div>

          <Button onClick={submitNewComplaint} className="ml-4 whitespace-nowrap" disabled={isSubmitting}>
            <FilePlus2 className="h-4 w-4 mr-2" /> New Complaint
          </Button>
        </div>

        {/* Search Bar */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search complaints by ID, title, or category..."
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
                        with status "{statusFilter}"
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

        <Tabs defaultValue="my-complaints" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="my-complaints" className="flex items-center gap-2">
              <List className="h-4 w-4" />
              My Complaints
            </TabsTrigger>
            <TabsTrigger value="resolved" className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Resolved
            </TabsTrigger>
            <TabsTrigger value="submit" className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Submit
            </TabsTrigger>
          </TabsList>

          <TabsContent value="my-complaints">
            <div className="space-y-4">
              {sortedComplaints.map((complaint) => (
                <Card key={complaint.id} className={`hover:shadow-lg transition-shadow ${pinnedComplaints.has(complaint.id) ? 'border-blue-200 bg-blue-50/30' : ''}`}>
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-lg font-semibold">{complaint.title}</h3>
                          {pinnedComplaints.has(complaint.id) && (
                            <Pin className="h-4 w-4 text-blue-600" />
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          ID: {complaint.id}
                        </p>
                      </div>
                      <div className="flex gap-2 ml-4">
                        <Badge className={getStatusColor(complaint.status)}>{complaint.status}</Badge>
                        <Badge className={getPriorityColor(complaint.priority)}>{complaint.priority}</Badge>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                      <div>
                        <label className="text-sm font-medium">Submitted</label>
                        <p className="text-sm text-muted-foreground">{complaint.dateSubmitted}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium">Category</label>
                        <p className="text-sm text-muted-foreground">{complaint.category}</p>
                      </div>
                      <div className="flex justify-end">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => togglePinComplaint(complaint.id)}
                          className={pinnedComplaints.has(complaint.id) ? "bg-blue-50 border-blue-200 text-blue-700" : ""}
                        >
                          {pinnedComplaints.has(complaint.id) ? (
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
                  </CardContent>
                </Card>
              ))}

              {sortedComplaints.length === 0 && (
                <Card>
                  <CardContent className="p-8 text-center">
                    <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">
                      {searchTerm || statusFilter !== "all" ? "No Matching Complaints" : "No Complaints Submitted"}
                    </h3>
                    <p className="text-muted-foreground">
                      {searchTerm || statusFilter !== "all" 
                        ? "No complaints match your current search and filter criteria."
                        : "You haven't submitted any complaints yet."
                      }
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">
                      {searchTerm || statusFilter !== "all" 
                        ? "Try adjusting your search terms or filters."
                        : "Use the 'Submit' tab to create your first complaint."
                      }
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="resolved">
            <div className="space-y-4">
              {filteredComplaints.filter(complaint => complaint.status === "Resolved").map((complaint) => (
                <Card key={complaint.id} className="hover:shadow-lg transition-shadow border-green-200 bg-green-50/30">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-lg font-semibold text-green-800">{complaint.title}</h3>
                          <Badge className="bg-green-100 text-green-800 border-green-200">Resolved</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          ID: {complaint.id}
                        </p>
                      </div>
                      <div className="flex gap-2 ml-4">
                        <Badge className={getPriorityColor(complaint.priority)}>{complaint.priority}</Badge>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end mb-4">
                      <div>
                        <label className="text-sm font-medium">Submitted</label>
                        <p className="text-sm text-muted-foreground">{complaint.dateSubmitted}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium">Category</label>
                        <p className="text-sm text-muted-foreground">{complaint.category}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium">Resolved</label>
                        <p className="text-sm text-green-600 font-medium">
                          {complaint.resolvedAt ? new Date(complaint.resolvedAt).toLocaleDateString() : 'Recently'}
                        </p>
                      </div>
                    </div>

                    {/* Staff Comments Section */}
                    {complaint.comments && complaint.comments.length > 0 && (
                      <div className="mt-6 pt-4 border-t border-green-200">
                        <h4 className="text-sm font-semibold text-green-800 mb-3 flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4" />
                          Staff Comments & Resolution Details
                        </h4>
                        <div className="space-y-3">
                          {complaint.comments
                            .filter(comment => comment.authorType === 'staff' || comment.authorType === 'admin')
                            .map((comment, index) => (
                            <div key={index} className="bg-white p-3 rounded-lg border border-green-100">
                              <div className="flex justify-between items-start mb-2">
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline" className="text-xs">
                                    {comment.authorType === 'admin' ? 'Admin' : 'Staff'}
                                  </Badge>
                                  <span className="text-sm font-medium text-gray-700">{comment.author}</span>
                                </div>
                                <span className="text-xs text-gray-500">
                                  {new Date(comment.createdAt).toLocaleDateString()}
                                </span>
                              </div>
                              <p className="text-sm text-gray-600 leading-relaxed">{comment.comment}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {(!complaint.comments || complaint.comments.filter(c => c.authorType === 'staff' || c.authorType === 'admin').length === 0) && (
                      <div className="mt-6 pt-4 border-t border-green-200">
                        <div className="text-center py-4">
                          <AlertTriangle className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                          <p className="text-sm text-gray-500">No staff comments available for this resolved complaint.</p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}

              {filteredComplaints.filter(complaint => complaint.status === "Resolved").length === 0 && (
                <Card>
                  <CardContent className="p-8 text-center">
                    <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
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
                        : "Your resolved complaints will appear here with staff comments."
                      }
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="submit">
            <Card>
              <CardHeader>
                <CardTitle>Submit a Complaint</CardTitle>
                <CardDescription>Fill the form to create a new complaint</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Title</label>
                    <input name="title" value={form.title} onChange={handleFormChange} className="w-full p-2 border rounded-md" placeholder="Brief title (minimum 5 characters)" />
                    <div className="text-xs text-muted-foreground mt-1">
                      {form.title.length}/200 characters (minimum 5 required)
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Category</label>
                    <Select value={form.category} onValueChange={(val) => setForm(prev => ({ ...prev, category: val }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {[
                          "Infrastructure",
                          "Utilities",
                          "Healthcare",
                          "Education",
                          "Transportation",
                          "Environment",
                          "Other",
                        ].map((c) => (
                          <SelectItem key={c} value={c}>{c}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Priority</label>
                    <Select value={form.priority} onValueChange={(val) => setForm(prev => ({ ...prev, priority: val as ComplaintPriority }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                      <SelectContent>
                        {["Low", "Medium", "High"].map((p) => (
                          <SelectItem key={p} value={p}>{p}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-sm font-medium">Description</label>
                    <textarea name="description" value={form.description} onChange={handleFormChange} className="w-full p-2 border rounded-md min-h-32" placeholder="Describe the issue in detail (minimum 20 characters)" />
                    <div className="text-xs text-muted-foreground mt-1">
                      {form.description.length}/2000 characters (minimum 20 required)
                    </div>
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-sm font-medium">Attachments</label>
                    <input
                      type="file"
                      multiple
                      onChange={(e) => {
                        const selected = Array.from(e.target.files || []);
                        setFiles(selected);
                      }}
                      className="w-full p-2 border rounded-md"
                    />
                    {files.length > 0 && (
                      <div className="mt-2 text-sm text-muted-foreground">
                        <div className="flex items-center justify-between mb-1">
                          <span>{files.length} file(s) selected</span>
                          <button type="button" className="text-blue-600" onClick={() => setFiles([])}>Clear</button>
                        </div>
                        <ul className="list-disc list-inside">
                          {files.map((f) => (
                            <li key={f.name}>{f.name}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-sm font-medium flex items-center gap-2">
                      <input type="checkbox" name="anonymous" checked={form.anonymous} onChange={handleFormChange} />
                      Submit anonymously
                    </label>
                  </div>
                </div>
                <div className="mt-4 flex justify-end">
                  <Button onClick={submitNewComplaint} disabled={isSubmitting}>{isSubmitting ? "Submitting..." : "Submit"}</Button>
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

export default UserDashboard;
