import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, User as UserIcon, Mail } from "lucide-react";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/contexts/useTheme";
import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { supabaseAdmin } from "@/lib/supabase-admin";
import type { User } from "@/types/user";
import { AddUserDialog } from "./AddUserDialog";
import { useUser } from "@/contexts/UserContext";
import { convertToCSV, downloadCSV, formatUsersForCSV } from '@/utils/csvExport';
import { format } from 'date-fns';

export function UserManagement() {
    const { t } = useTheme();
    const { toast } = useToast();
    const { user } = useUser();
    const queryClient = useQueryClient();
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [deletingUser, setDeletingUser] = useState<User | null>(null);
    const [isAddUserDialogOpen, setIsAddUserDialogOpen] = useState(false);
    const [selectedUsers, setSelectedUsers] = useState<string[]>([]);

    // Add audit logging function
    const logAuditEvent = async (
        action: string,
        targetUserId: string,
        details?: Record<string, string | number | boolean | string[] | null>
    ) => {
        try {
            await supabaseAdmin.from('audit_logs').insert({
                action,
                performed_by: user?.id,
                target_user: targetUserId,
                details,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            console.error('Error logging audit event:', error);
        }
    };

    const { data: users, isLoading: loading, error: queryError } = useQuery({
        queryKey: ['users'],
        queryFn: async () => {
            const query = supabaseAdmin
                .from('users')
                .select(`
                    id,
                    email,
                    name,
                    role,
                    assistant_access,
                    language,
                    assigned_assistants,
                    assigned_assistant_names,
                    default_assistant_id,
                    default_assistant_name,
                    created_at,
                    updated_at,
                    created_by
                `);

            if (!user) {
                throw new Error('No user found');
            }

            try {
                // For owners, show all users
                if (user.role === 'owner') {
                    const { data: users } = await query.order('created_at', { ascending: false });
                    console.log('Fetched all users for owner:', users);
                    return users || [];
                }
                
                // For admins, show only users they created
                if (user.role === 'admin') {
                    const { data: users } = await query
                        .eq('created_by', user.id);
                    console.log('Fetched users for admin:', users);
                    return users || [];
                }
                
                // Regular users only see themselves
                const { data: users } = await query.eq('id', user.id);
                console.log('Fetched user data:', users);
                return users || [];
            } catch (error) {
                console.error('Error in fetchUsers:', error);
                throw error;
            }
        }
    });

    const handleDelete = async (userId: string) => {
        try {
            // Check if user has permission to delete
            if (user?.role === 'admin') {
                const { data: targetUser } = await supabaseAdmin
                    .from('users')
                    .select('created_by')
                    .eq('id', userId)
                    .single();

                if (targetUser?.created_by !== user.id) {
                    throw new Error('You do not have permission to delete this user');
                }
            }

            // Log the deletion attempt
            await logAuditEvent('user_deletion_attempt', userId);

            const { error } = await supabaseAdmin
                .from('users')
                .delete()
                .eq('id', userId);

            if (error) throw error;

            // Log successful deletion
            await logAuditEvent('user_deleted', userId, { success: true });

            queryClient.invalidateQueries({ queryKey: ['users'] });
            toast({ title: t('success'), description: t('userDeleted') });
        } catch (error) {
            console.error('Error deleting user:', error);
            // Log failed deletion
            await logAuditEvent('user_deletion_failed', userId, { 
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            toast({ 
                title: t('error'), 
                description: t('errorDeletingUser'),
                variant: "destructive"
            });
        }
    };

    const handleBulkDelete = async () => {
        try {
            // Check permissions for each user
            if (user?.role === 'admin') {
                const { data: targetUsers } = await supabaseAdmin
                    .from('users')
                    .select('id, created_by')
                    .in('id', selectedUsers);

                const unauthorizedUsers = targetUsers?.filter(u => u.created_by !== user.id);
                if (unauthorizedUsers?.length) {
                    throw new Error('You do not have permission to delete some of these users');
                }
            }

            // Log bulk deletion attempt
            await logAuditEvent('bulk_user_deletion_attempt', 'multiple', { userIds: selectedUsers });

            const { error } = await supabaseAdmin
                .from('users')
                .delete()
                .in('id', selectedUsers);

            if (error) throw error;

            // Log successful bulk deletion
            await logAuditEvent('bulk_users_deleted', 'multiple', { 
                success: true,
                userIds: selectedUsers 
            });

            setSelectedUsers([]);
            queryClient.invalidateQueries({ queryKey: ['users'] });
            toast({ title: t('success'), description: t('usersDeleted') });
        } catch (error) {
            console.error('Error deleting users:', error);
            // Log failed bulk deletion
            await logAuditEvent('bulk_user_deletion_failed', 'multiple', { 
                error: error instanceof Error ? error.message : 'Unknown error',
                userIds: selectedUsers 
            });
            toast({ 
                title: t('error'), 
                description: t('errorDeletingUsers'),
                variant: "destructive"
            });
        }
    };

    const handleExport = () => {
        if (!user || (user.role !== 'owner' && user.role !== 'admin')) return;
        if (!users) return;

        const standardQAFields = [
            'propertyName',
            'location',
            'breakfastService',
            'lunchService',
            'dinnerService',
            'poolHours',
            'spaServices',
            'checkoutProcedures',
            'ironingFacilities',
            'iceMachineLocation',
            'kidsClubServices',
            'synagogueServices',
            'gymFacilities',
            'businessLounge',
            'accessibilityFeatures',
            'uniqueAmenities',
            'contactPerson',
            'contactEmail',
            'contactPhone'
        ] as const;

        // Base headers
        const headers: Record<string, string> = {
            id: t('userId'),
            email: t('email'),
            name: t('name'),
            role: t('role'),
            assistant_access: t('assistantAccess'),
            language: t('language'),
            assigned_assistants: t('assignedAssistants'),
            default_assistant: t('defaultAssistant'),
            qa_form_submitted: 'QA Form Submitted',
            created_at: t('createdAt'),
            updated_at: t('updatedAt'),
            created_by: 'Created By'
        };

        // Add QA headers
        standardQAFields.forEach(field => {
            headers[`qa_${field}_en`] = `${t(field as keyof typeof t)} (English)`;
            headers[`qa_${field}_he`] = `${t(field as keyof typeof t)} (Hebrew)`;
        });

        // Add custom QA headers if they exist
        const customFields = new Set<string>();
        users.forEach(user => {
            const userData = user as User;
            if (userData.questions) {
                Object.keys(userData.questions)
                    .filter(key => !standardQAFields.includes(key as typeof standardQAFields[number]))
                    .forEach(key => customFields.add(key));
            }
        });

        customFields.forEach(field => {
            headers[`qa_custom_${field}_en`] = `Custom: ${field} (English)`;
            headers[`qa_custom_${field}_he`] = `Custom: ${field} (Hebrew)`;
        });

        const csvData = formatUsersForCSV(users);
        const csvContent = convertToCSV(csvData, headers);
        downloadCSV(csvContent, `users-${format(new Date(), 'yyyy-MM-dd')}.csv`);
    };

    if (loading) {
        return (
            <div className="p-6">
                <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {[1, 2, 3, 4].map((i) => (
                        <Card key={i} className="flex flex-col">
                            <CardHeader>
                                <div className="flex items-start justify-between">
                                    <div className="space-y-1">
                                        <div className="h-6 w-32 bg-muted rounded animate-pulse" />
                                        <div className="h-4 w-24 bg-muted rounded animate-pulse" />
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    <div className="h-4 w-20 bg-muted rounded animate-pulse" />
                                    <div className="h-4 w-24 bg-muted rounded animate-pulse" />
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        );
    }

    if (!users || users.length === 0) {
        return (
            <div className="p-6">
                <div className="text-center py-10">
                    <p className="text-muted-foreground">No users found</p>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold">{t('userManagement')}</h1>
                    <p className="text-muted-foreground">{t('manageUsersAndPermissions')}</p>
                </div>
                <div className="flex gap-2">
                    {selectedUsers.length > 0 && (
                        <Button
                            variant="destructive"
                            onClick={() => setDeletingUser({ id: 'bulk' } as User)}
                            className="bg-destructive hover:bg-destructive/90"
                        >
                            {t('deleteSelected')} ({selectedUsers.length})
                        </Button>
                    )}
                    {user?.role && ['owner', 'admin'].includes(user.role) && (
                        <Button
                            onClick={() => setIsAddUserDialogOpen(true)}
                            className="bg-primary hover:bg-primary/90"
                        >
                            <Plus className="mr-2 h-4 w-4" />
                            {t('createUser')}
                        </Button>
                    )}
                    {(user?.role === 'owner' || user?.role === 'admin') && (
                        <Button onClick={handleExport} variant="outline">
                            {t('exportCSV')}
                        </Button>
                    )}
                </div>
            </div>

            {queryError && (
                <div className="bg-destructive/10 border border-destructive text-destructive px-4 py-3 rounded mb-4">
                    {queryError instanceof Error ? queryError.message : String(queryError)}
                </div>
            )}

            <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {users?.map((mappedUser) => {
                    if (!mappedUser) return null;
                    return (
                        <Card key={mappedUser.id} className="flex flex-col">
                            <CardHeader>
                                <div className="flex items-start justify-between">
                                    <div className="space-y-1">
                                        <CardTitle className="flex items-center gap-2">
                                            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                                                <UserIcon className="h-4 w-4 text-primary" />
                                            </div>
                                            {mappedUser.name || t('name')}
                                        </CardTitle>
                                        <CardDescription>
                                            <span className="flex items-center gap-2">
                                                <Mail className="h-4 w-4" />
                                                {mappedUser.email}
                                            </span>
                                        </CardDescription>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => {
                                                setEditingUser(mappedUser);
                                                setIsAddUserDialogOpen(true);
                                            }}
                                        >
                                            <Pencil className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => setDeletingUser(mappedUser)}
                                        >
                                            <Trash2 className="h-4 w-4 text-destructive" />
                                        </Button>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    <div className="flex justify-between">
                                        <span className="text-sm text-muted-foreground">{t('role')}</span>
                                        <span className="text-sm font-medium">{t(mappedUser.role)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-sm text-muted-foreground">{t('language')}</span>
                                        <span className="text-sm font-medium">{mappedUser.language}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-sm text-muted-foreground">{t('assistantAccess')}</span>
                                        <span className="text-sm font-medium">{t(mappedUser.assistant_access)}</span>
                                    </div>
                                    {mappedUser.assigned_assistants && mappedUser.assigned_assistants.length > 0 && (
                                        <div className="flex justify-between">
                                            <span className="text-sm text-muted-foreground">{t('assignedAssistants')}</span>
                                            <span className="text-sm font-medium">
                                                {mappedUser.assigned_assistant_names?.join(', ') || mappedUser.assigned_assistants.join(', ')}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            <AlertDialog open={!!deletingUser} onOpenChange={() => setDeletingUser(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{t('confirmDelete')}</AlertDialogTitle>
                        <AlertDialogDescription>
                            {deletingUser?.id === 'bulk'
                                ? `${t('confirmBulkDeleteDescription')} (${selectedUsers.length} users)`
                                : t('confirmDeleteDescription')}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => {
                                if (deletingUser?.id === 'bulk') {
                                    handleBulkDelete();
                                } else if (deletingUser) {
                                    handleDelete(deletingUser.id);
                                }
                                setDeletingUser(null);
                            }}
                            className="bg-destructive hover:bg-destructive/90"
                        >
                            {t('delete')}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <AddUserDialog
                open={isAddUserDialogOpen}
                onClose={() => {
                    setIsAddUserDialogOpen(false);
                    setEditingUser(null);
                    queryClient.invalidateQueries({ queryKey: ['users'] });
                }}
                editingUser={editingUser}
            />
        </div>
    );
} 