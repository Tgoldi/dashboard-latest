/** @jsxImportSource react */
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { MultiSelect } from "@/components/ui/multi-select";
import { useTheme } from "@/contexts/useTheme";
import type { User, UserRole } from "@/types/user";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { useToast } from "@/components/ui/use-toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import vapiService from "@/services/vapiService";
import React from "react";
import { useUser } from "@/contexts/UserContext";
import type { TranslationKey } from "@/utils/translations";

interface AddUserDialogProps {
    open: boolean;
    onClose: () => void;
    editingUser?: User | null;
}

export function AddUserDialog({ open, onClose, editingUser }: AddUserDialogProps) {
    const { t } = useTheme();
    const { toast } = useToast();
    const { user } = useUser();
    const queryClient = useQueryClient();
    const [isLoading, setIsLoading] = useState(false);
    const [isResettingPassword, setIsResettingPassword] = useState(false);
    const [formData, setFormData] = useState({
        email: editingUser?.email || "",
        password: "",
        name: editingUser?.name || "",
        role: editingUser?.role || "user",
        assistant_access: editingUser?.assistant_access || "single",
        assigned_assistants: editingUser?.assigned_assistants || [],
        assigned_assistant_names: editingUser?.assigned_assistant_names || [],
        language: editingUser?.language || "en"
    });

    // Fetch assistants
    const { data: assistantsResponse } = useQuery({
        queryKey: ['assistants'],
        queryFn: async () => {
            const response = await vapiService.getAssistants();
            return response;
        },
        enabled: open
    });

    const assistants = assistantsResponse?.data || [];

    useEffect(() => {
        if (editingUser) {
            setFormData({
                email: editingUser.email,
                password: "",
                name: editingUser.name || "",
                role: editingUser.role as UserRole,
                assistant_access: editingUser.assistant_access as "single" | "all",
                assigned_assistants: editingUser.assigned_assistants || [],
                assigned_assistant_names: editingUser.assigned_assistant_names || [],
                language: editingUser.language,
            });
        } else {
            setFormData({
                email: "",
                password: "",
                name: "",
                role: "user" as UserRole,
                assistant_access: "single",
                assigned_assistants: [],
                assigned_assistant_names: [],
                language: "en",
            });
        }
    }, [editingUser]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            // First check if user exists in either auth or database
            const { data: existingDbUsers } = await supabaseAdmin
                .from('users')
                .select('id, email')
                .eq('email', formData.email);

            const { data: authUsers } = await supabaseAdmin.auth.admin.listUsers();
            const existingAuthUser = authUsers?.users.find(u => u.email === formData.email);

            // If user exists in either place, show error
            if (existingDbUsers?.length || existingAuthUser) {
                throw new Error(`User with email ${formData.email} already exists. Please use a different email.`);
            }

            // Create new auth user
            const { data: authUser, error: createAuthError } = await supabaseAdmin.auth.admin.createUser({
                email: formData.email,
                password: formData.password,
                email_confirm: true,
                user_metadata: {
                    name: formData.name,
                    role: formData.role
                }
            });

            if (createAuthError) throw createAuthError;

            if (!authUser?.user?.id) {
                throw new Error('Failed to create auth user');
            }

            // Prepare the data with assistant names
            const selectedAssistants = formData.assigned_assistants;
            const selectedAssistantNames = selectedAssistants.map(id => 
                assistants.find(a => a.id === id)?.name || ''
            ).filter(Boolean);

            // If assistant_access is "all", assign all assistants
            const finalAssistantIds = formData.assistant_access === "all" 
                ? assistants.map(a => a.id)
                : selectedAssistants;

            const finalAssistantNames = formData.assistant_access === "all"
                ? assistants.map(a => a.name)
                : selectedAssistantNames;

            // Set default assistant if single access and only one assistant selected
            const defaultAssistantId = formData.assistant_access === "single" && finalAssistantIds.length === 1
                ? finalAssistantIds[0]
                : null;

            const defaultAssistantName = formData.assistant_access === "single" && finalAssistantNames.length === 1
                ? finalAssistantNames[0]
                : null;

            // Create the database user with upsert
            const { error: dbError } = await supabaseAdmin
                .from('users')
                .upsert({
                    id: authUser.user.id,
                    email: formData.email,
                    name: formData.name || null,
                    role: formData.role,
                    assistant_access: formData.assistant_access,
                    language: formData.language,
                    assigned_assistants: finalAssistantIds,
                    assigned_assistant_names: finalAssistantNames,
                    default_assistant_id: defaultAssistantId,
                    default_assistant_name: defaultAssistantName,
                    created_by: user?.id,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                }, {
                    onConflict: 'id',
                    ignoreDuplicates: false
                });

            if (dbError) {
                // If there's a database error, clean up the auth user
                await supabaseAdmin.auth.admin.deleteUser(authUser.user.id);
                throw dbError;
            }

            toast({ title: t('success'), description: t('userCreated') });
            queryClient.invalidateQueries({ queryKey: ['users'] });
            onClose();
        } catch (error) {
            console.error('Error saving user:', error);
            toast({
                title: t('error'),
                description: error instanceof Error ? error.message : t('errorCreatingUser'),
                variant: "destructive"
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handlePasswordReset = async () => {
        try {
            if (!editingUser) return;

            if (!formData.password || formData.password.length < 6) {
                toast({
                    title: t('error'),
                    description: t('passwordTooShort'),
                    variant: "destructive",
                });
                return;
            }

            const { error } = await supabaseAdmin.auth.admin.updateUserById(
                editingUser.id,
                { password: formData.password }
            );

            if (error) throw error;

            toast({
                title: t('success'),
                description: t('passwordUpdated'),
            });
            setIsResettingPassword(false);
            setFormData(prev => ({ ...prev, password: "" }));
        } catch (error) {
            console.error('Error resetting password:', error);
            toast({
                title: t('error'),
                description: t('errorResettingPassword'),
                variant: "destructive",
            });
        }
    };

    // Get available roles based on current user's role
    const getAvailableRoles = () => {
        if (user?.role === 'owner') {
            return ['owner', 'admin', 'editor', 'user'];
        } else if (user?.role === 'admin') {
            return ['editor', 'user'];
        }
        return ['user'];
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{editingUser ? t('editUser') : t('createNewUser')}</DialogTitle>
                    <DialogDescription>
                        {editingUser ? t('editUserDescription') : t('createUserDescription')}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="name" className="text-right">
                                {t('name')}
                            </Label>
                            <Input
                                id="name"
                                value={formData.name}
                                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                className="col-span-3"
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="email" className="text-right">
                                {t('email')}
                            </Label>
                            <Input
                                id="email"
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                                className="col-span-3"
                                disabled={!!editingUser}
                            />
                        </div>
                        {!editingUser && (
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="password" className="text-right">
                                    {t('password')}
                                </Label>
                                <Input
                                    id="password"
                                    type="password"
                                    value={formData.password}
                                    onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                                    className="col-span-3"
                                    required
                                    minLength={6}
                                />
                            </div>
                        )}
                        {editingUser && (
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label className="text-right">
                                    {t('password')}
                                </Label>
                                <div className="col-span-3 space-y-2">
                                    {!isResettingPassword ? (
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => setIsResettingPassword(true)}
                                        >
                                            {t('resetPassword')}
                                        </Button>
                                    ) : (
                                        <div className="space-y-2">
                                            <Input
                                                type="password"
                                                value={formData.password}
                                                onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                                                placeholder={t('newPassword')}
                                                minLength={6}
                                            />
                                            <div className="flex gap-2">
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    onClick={() => {
                                                        setIsResettingPassword(false);
                                                        setFormData(prev => ({ ...prev, password: "" }));
                                                    }}
                                                >
                                                    {t('cancel')}
                                                </Button>
                                                <Button
                                                    type="button"
                                                    onClick={handlePasswordReset}
                                                >
                                                    {t('updatePassword')}
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="role" className="text-right">
                                {t('role')}
                            </Label>
                            <Select
                                value={formData.role}
                                onValueChange={(value) => setFormData(prev => ({ ...prev, role: value as UserRole }))}
                            >
                                <SelectTrigger className="col-span-3">
                                    <SelectValue placeholder={t('selectRole')} />
                                </SelectTrigger>
                                <SelectContent>
                                    {getAvailableRoles().map((role) => (
                                        <SelectItem key={role} value={role}>
                                            {t(role as TranslationKey)}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="assistant_access" className="text-right">
                                {t('assistantAccess')}
                            </Label>
                            <Select
                                value={formData.assistant_access}
                                onValueChange={(value) => setFormData(prev => ({ 
                                    ...prev, 
                                    assistant_access: value as "single" | "all",
                                    // Clear assigned assistants if switching to single access
                                    assigned_assistants: value === "single" ? [] : prev.assigned_assistants
                                }))}
                            >
                                <SelectTrigger className="col-span-3">
                                    <SelectValue placeholder={t('selectAssistantAccess')} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="single">{t('single')}</SelectItem>
                                    <SelectItem value="all">{t('all')}</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        {formData.assistant_access === "single" && (
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="assigned_assistants" className="text-right">
                                    {t('assignedAssistants')}
                                </Label>
                                <div className="col-span-3">
                                    <MultiSelect
                                        options={assistants?.map(a => ({ 
                                            label: a.name || '', 
                                            value: a.id || '' 
                                        })) || []}
                                        value={formData.assigned_assistants || []}
                                        onChange={(value) => {
                                            if (!Array.isArray(value)) return;
                                            setFormData(prev => ({ 
                                                ...prev, 
                                                assigned_assistants: value,
                                                assigned_assistant_names: value.map(v => 
                                                    assistants?.find(a => a.id === v)?.name || ''
                                                ).filter(Boolean)
                                            }));
                                        }}
                                        placeholder={t('selectAssistants')}
                                    />
                                </div>
                            </div>
                        )}
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="language" className="text-right">
                                {t('language')}
                            </Label>
                            <Select
                                value={formData.language}
                                onValueChange={(value) => setFormData(prev => ({ ...prev, language: value }))}
                            >
                                <SelectTrigger className="col-span-3">
                                    <SelectValue placeholder={t('selectLanguage')} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="en">English</SelectItem>
                                    <SelectItem value="he">Hebrew</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose}>
                            {t('cancel')}
                        </Button>
                        <Button type="submit" className="w-full" disabled={isLoading}>
                            {isLoading ? t('saving') : (editingUser ? t('save') : t('createUser'))}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
} 