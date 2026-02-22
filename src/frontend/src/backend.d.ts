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
export interface Client {
    blacklistMedia: Array<ExternalBlob>;
    blacklistComments: string;
    info: ContactInfo;
    updatedAt: Time;
    isBlacklisted: boolean;
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
export interface ContactInfo {
    name: string;
    email: string;
    address: Address;
    phone: string;
}
export interface UserProfile {
    name: string;
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addIntervention(clientId: string, comments: string, media: Array<ExternalBlob>, day: bigint, month: bigint, year: bigint): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    createFolder(path: string): Promise<void>;
    createOrUpdateClient(id: string, name: string, address: Address, phone: string, email: string): Promise<void>;
    deleteIntervention(interventionId: string, clientId: string): Promise<void>;
    deleteMediaItem(mediaId: string): Promise<void>;
    deleteTechnicalFileWithPath(path: string): Promise<void>;
    downloadTechnicalFileWithPath(path: string): Promise<ExternalBlob | null>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getClient(clientId: string): Promise<Client>;
    getClientInterventions(clientId: string): Promise<Array<Intervention>>;
    getClients(): Promise<Array<Client>>;
    getInterventionsByDate(day: bigint, month: bigint, year: bigint): Promise<Array<Intervention>>;
    getMediaItem(mediaId: string): Promise<MediaItem | null>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    listAllMediaItems(): Promise<Array<MediaItem>>;
    listTechnicalFiles(): Promise<Array<[string, ExternalBlob]>>;
    markAsBlacklisted(clientId: string, comments: string, media: Array<ExternalBlob>): Promise<void>;
    moveTechnicalFile(oldPath: string, newPath: string): Promise<void>;
    renameFolder(oldPath: string, newName: string): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    searchClients(searchString: string): Promise<Array<Client>>;
    unmarkAsBlacklisted(clientId: string): Promise<void>;
    updateIntervention(interventionId: string, clientId: string, comments: string, media: Array<ExternalBlob>, day: bigint, month: bigint, year: bigint): Promise<void>;
    uploadMediaItem(file: ExternalBlob): Promise<string>;
    uploadTechnicalFileWithFolderPath(path: string, blob: ExternalBlob): Promise<void>;
}
