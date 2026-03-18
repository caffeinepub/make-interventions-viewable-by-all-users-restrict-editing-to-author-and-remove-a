import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export class ExternalBlob {
    getBytes(): Promise<Uint8Array<ArrayBuffer>>;
    getDirectURL(): string;
    static fromURL(url: string): ExternalBlob;
    static fromBytes(blob: Uint8Array<ArrayBuffer>): ExternalBlob;
    withUploadProgress(onProgress: (percentage: number) => void): ExternalBlob;
}
export interface ScheduledIntervention {
    id: string;
    media: Array<ExternalBlob>;
    startTime: string;
    clientId: string;
    endTime: string;
    clientName: string;
    weekYear: bigint;
    date: {
        day: bigint;
        month: bigint;
        year: bigint;
    };
    createdAt: Time;
    createdBy: Principal;
    description: string;
    weekNumber: bigint;
    updatedAt: Time;
    clientSignature?: string;
    employeeSignature?: string;
    assignedEmployee: Principal;
    reason: string;
}
export interface UserProfile {
    name: string;
}
export interface Address {
    zip: string;
    street: string;
    city: string;
    state: string;
}
export type Time = bigint;
export interface MediaItem {
    id: string;
    owner: Principal;
    file: ExternalBlob;
    createdAt: Time;
}
export interface WorkHours {
    id: string;
    date: {
        day: bigint;
        month: bigint;
        year: bigint;
    };
    morningEnd: string;
    afternoonStart: string;
    updatedAt: Time;
    employee: Principal;
    afternoonEnd: string;
    morningStart: string;
}
export interface UserApprovalInfo {
    status: ApprovalStatus;
    principal: Principal;
}
export interface Client {
    blacklistMedia: Array<ExternalBlob>;
    blacklistComments: string;
    info: ContactInfo;
    updatedAt: Time;
    isBlacklisted: boolean;
}
export interface ContactInfo {
    name: string;
    email: string;
    address: Address;
    phone: string;
}
export interface Intervention {
    id: string;
    media: Array<ExternalBlob>;
    clientId: string;
    date: {
        day: bigint;
        month: bigint;
        year: bigint;
    };
    canEdit: boolean;
    updatedAt: Time;
    employee: Principal;
    canDelete: boolean;
    comments: string;
    interventionTimestamp: Time;
}
export enum ApprovalStatus {
    pending = "pending",
    approved = "approved",
    rejected = "rejected"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addIntervention(clientId: string, comments: string, media: Array<ExternalBlob>, day: bigint, month: bigint, year: bigint): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    claimAdminIfNoneExists(): Promise<void>;
    createFolder(path: string): Promise<void>;
    createOrUpdateClient(id: string, name: string, address: Address, phone: string, email: string): Promise<void>;
    createScheduledIntervention(clientId: string, clientName: string, assignedEmployee: Principal, reason: string, startTime: string, endTime: string, description: string, media: Array<ExternalBlob>, day: bigint, month: bigint, year: bigint, weekNumber: bigint, weekYear: bigint): Promise<string>;
    deleteIntervention(interventionId: string, clientId: string): Promise<void>;
    deleteMediaItem(mediaId: string): Promise<void>;
    deleteScheduledIntervention(id: string): Promise<void>;
    deleteTechnicalFileWithPath(path: string): Promise<void>;
    downloadTechnicalFileWithPath(path: string): Promise<ExternalBlob | null>;
    getAllEmployeesWorkHoursForMonth(month: bigint, year: bigint): Promise<Array<WorkHours>>;
    getApprovedEmployees(): Promise<Array<[Principal, UserProfile]>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getClient(clientId: string): Promise<Client>;
    getClientInterventions(clientId: string): Promise<Array<Intervention>>;
    getClients(): Promise<Array<Client>>;
    getClientsWithIds(): Promise<Array<[string, Client]>>;
    getInterventionsByDate(day: bigint, month: bigint, year: bigint): Promise<Array<Intervention>>;
    getMediaItem(mediaId: string): Promise<MediaItem | null>;
    getScheduledInterventionById(id: string): Promise<ScheduledIntervention | null>;
    getScheduledInterventionsByWeek(weekNumber: bigint, weekYear: bigint): Promise<Array<ScheduledIntervention>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    getUserProfilesByPrincipals(principals: Array<Principal>): Promise<Array<[Principal, UserProfile]>>;
    getWorkHoursForMonth(employee: Principal, month: bigint, year: bigint): Promise<Array<WorkHours>>;
    hasAdminRegistered(): Promise<boolean>;
    isCallerAdmin(): Promise<boolean>;
    isCallerApproved(): Promise<boolean>;
    listAllMediaItems(): Promise<Array<MediaItem>>;
    listApprovals(): Promise<Array<UserApprovalInfo>>;
    listTechnicalFiles(): Promise<Array<[string, ExternalBlob]>>;
    markAsBlacklisted(clientId: string, comments: string, media: Array<ExternalBlob>): Promise<void>;
    moveTechnicalFile(oldPath: string, newPath: string): Promise<void>;
    renameFolder(oldPath: string, newName: string): Promise<void>;
    requestApproval(): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    saveWorkHours(day: bigint, month: bigint, year: bigint, morningStart: string, morningEnd: string, afternoonStart: string, afternoonEnd: string): Promise<void>;
    searchClients(searchString: string): Promise<Array<Client>>;
    setApproval(user: Principal, status: ApprovalStatus): Promise<void>;
    unmarkAsBlacklisted(clientId: string): Promise<void>;
    updateIntervention(interventionId: string, clientId: string, comments: string, media: Array<ExternalBlob>, day: bigint, month: bigint, year: bigint): Promise<void>;
    updateScheduledIntervention(id: string, clientId: string, clientName: string, assignedEmployee: Principal, reason: string, startTime: string, endTime: string, description: string, media: Array<ExternalBlob>, employeeSignature: string | null, clientSignature: string | null, day: bigint, month: bigint, year: bigint, weekNumber: bigint, weekYear: bigint): Promise<void>;
    uploadMediaItem(arg0: {
        file: ExternalBlob;
    }): Promise<string>;
    uploadTechnicalFileWithFolderPath(path: string, blob: ExternalBlob): Promise<void>;
}
